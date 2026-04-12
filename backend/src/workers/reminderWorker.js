/**
 * reminderWorker.js — Agente 1: Monitor 24/7
 *
 * Corre dentro del mismo proceso Express. Se inicializa una vez que
 * la BD ya está conectada (llamar startReminderWorker() desde app.js
 * DENTRO del bloque .then() de sequelize.authenticate()).
 *
 * Jobs activos:
 *   1. Recordatorio de citas  — todos los días a las 08:00
 *      → busca citas con fecha = mañana + estado = 'confirmada'
 *      → envía email al cliente (y al abogado si tiene correo)
 *
 *   2. Casos vencidos         — todos los días a las 09:00
 *      → busca casos con fecha_limite < hoy + estado ∈ {activo, urgente, pendiente, en_revision}
 *      → notifica al abogado asignado (o al ADMIN_EMAIL si no hay abogado)
 *
 *   3. Limpieza de OTP        — cada hora
 *      → borra otp_code/otp_expires/otp_intentos de tokens ya expirados
 *      → mantiene la BD limpia (los OTPs expiran solos, pero esto elimina basura)
 */

import cron      from 'node-cron'
import { Op }    from 'sequelize'

import Appointment from '../models/Appointment.js'
import Case        from '../models/Case.js'
import User        from '../models/User.js'
import Client      from '../models/Client.js'
import Document    from '../models/Document.js'
import Movimiento  from '../models/Movimiento.js'

import {
  sendReminderCita,
  notifyVencimientoCaso,
  notifyReporteIACaso,
} from '../services/emailService.js'
// aiService se importa dinámicamente en jobMonitoreoIA para evitar crash de startup

// ── Utilidades ─────────────────────────────────────────────────────

/** Devuelve 'YYYY-MM-DD' de un Date en hora LOCAL (sin UTC) */
const toLocalDate = (d = new Date()) => {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** Fecha de mañana en hora local */
const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toLocalDate(d)
}

/** Fecha de hoy en hora local */
const today = () => toLocalDate()

// ── Job 1 — Recordatorio de citas ─────────────────────────────────
const jobRecordatorioCitas = async () => {
  console.log('[Worker] Recordatorio citas: iniciando...')
  const baseUrl = process.env.APP_URL || 'http://localhost:5173'
  const fechaMañana = tomorrow()

  try {
    const citas = await Appointment.findAll({
      where: {
        fecha:  fechaMañana,
        estado: 'confirmada',
      },
      include: [
        { model: Client, as: 'Cliente', attributes: ['nombre', 'correo'] },
      ],
    })

    if (!citas.length) {
      console.log('[Worker] Recordatorio citas: ninguna cita mañana.')
      return
    }

    // Recopilar correos de abogados en paralelo (evitar N+1)
    const abogadoIds = [...new Set(citas.map(c => c.id_abogado).filter(Boolean))]
    const abogados   = abogadoIds.length
      ? await User.findAll({
          where: { id_usuario: abogadoIds },
          attributes: ['id_usuario', 'nombre', 'correo'],
        })
      : []
    const abogadoMap = Object.fromEntries(abogados.map(u => [u.id_usuario, u]))

    const jobs = []
    for (const cita of citas) {
      const cliente  = cita.Cliente
      const abogado  = abogadoMap[cita.id_abogado]
      const hora     = cita.hora?.slice(0, 5) ?? '??:??'   // 'HH:MM:SS' → 'HH:MM'

      // Email al cliente
      if (cliente?.correo) {
        jobs.push(
          sendReminderCita({
            to:            cliente.correo,
            nombreCliente: cliente.nombre,
            nombreAbogado: abogado?.nombre ?? 'Lic. Sánchez',
            fecha:         fechaMañana,
            hora,
            motivo:        cita.motivo,
            baseUrl,
          }).catch(err =>
            console.error(`[Worker] Error recordatorio cliente ${cliente.correo}:`, err.message)
          )
        )
      }

      // Email al abogado (mismo recordatorio, diferente saludo)
      if (abogado?.correo) {
        jobs.push(
          sendReminderCita({
            to:            abogado.correo,
            nombreCliente: abogado.nombre,   // el abogado ve su propio nombre en el saludo
            nombreAbogado: `cliente ${cliente?.nombre ?? '(sin nombre)'}`,
            fecha:         fechaMañana,
            hora,
            motivo:        cita.motivo,
            baseUrl: null,   // el abogado no necesita el botón "Ver mis citas"
          }).catch(err =>
            console.error(`[Worker] Error recordatorio abogado ${abogado.correo}:`, err.message)
          )
        )
      }
    }

    await Promise.all(jobs)
    console.log(`[Worker] Recordatorio citas: ${jobs.length} correo(s) enviado(s).`)
  } catch (err) {
    console.error('[Worker] Error en jobRecordatorioCitas:', err.message)
  }
}

// ── Job 2 — Casos vencidos ─────────────────────────────────────────
const jobCasosVencidos = async () => {
  console.log('[Worker] Casos vencidos: iniciando...')
  const baseUrl = process.env.APP_URL || 'http://localhost:5173'
  const hoy = today()

  try {
    const casos = await Case.findAll({
      where: {
        fecha_limite: { [Op.lt]: hoy },
        estado: { [Op.in]: ['activo', 'urgente', 'pendiente', 'en_revision'] },
      },
    })

    if (!casos.length) {
      console.log('[Worker] Casos vencidos: ningún caso vencido.')
      return
    }

    // Recopilar abogados
    const abogadoIds = [...new Set(casos.map(c => c.id_abogado).filter(Boolean))]
    const abogados   = abogadoIds.length
      ? await User.findAll({
          where: { id_usuario: abogadoIds },
          attributes: ['id_usuario', 'nombre', 'correo'],
        })
      : []
    const abogadoMap = Object.fromEntries(abogados.map(u => [u.id_usuario, u]))

    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER

    const jobs = []
    for (const caso of casos) {
      const abogado = abogadoMap[caso.id_abogado]
      const destino = abogado?.correo ?? adminEmail

      if (!destino) continue

      jobs.push(
        notifyVencimientoCaso({
          to:           destino,
          nombreAbogado: abogado?.nombre ?? 'Administrador',
          folio:        caso.folio,
          asunto:       caso.asunto,
          tipo:         caso.tipo,
          estado:       caso.estado,
          fechaLimite:  caso.fecha_limite,
          baseUrl,
        }).catch(err =>
          console.error(`[Worker] Error notificando caso ${caso.folio}:`, err.message)
        )
      )
    }

    await Promise.all(jobs)
    console.log(`[Worker] Casos vencidos: ${jobs.length} notificación(es) enviada(s).`)
  } catch (err) {
    console.error('[Worker] Error en jobCasosVencidos:', err.message)
  }
}

// ── Job 4 — Escalamiento de urgencias ─────────────────────────────
const jobEscalamientoUrgencias = async () => {
  console.log('[Worker] Escalamiento urgencias: iniciando...')
  const baseUrl = process.env.APP_URL || 'http://localhost:5173'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const en3Dias = new Date(hoy)
  en3Dias.setDate(en3Dias.getDate() + 3)
  const hoyStr    = toLocalDate(hoy)
  const en3Str    = toLocalDate(en3Dias)

  try {
    const casos = await Case.findAll({
      where: {
        estado:       'urgente',
        fecha_limite: { [Op.between]: [hoyStr, en3Str] },
      },
    })

    if (!casos.length) {
      console.log('[Worker] Escalamiento urgencias: ningún caso urgente próximo a vencer.')
      return
    }

    // Todos los abogados y secretarios activos
    const staff = await User.findAll({
      where: {
        rol:    { [Op.in]: ['abogado', 'secretario'] },
        activo: true,
      },
      attributes: ['id_usuario', 'nombre', 'correo'],
    })

    if (!staff.length) {
      console.log('[Worker] Escalamiento urgencias: no hay staff activo para notificar.')
      return
    }

    const jobs = []
    for (const caso of casos) {
      const limite  = new Date(caso.fecha_limite)
      const diffMs  = limite - hoy
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      const diasLabel = diasRestantes <= 0 ? 'hoy' : `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`
      const subject = `\u26A0\uFE0F URGENTE: Caso ${caso.folio} vence en ${diasLabel}`

      for (const usuario of staff) {
        if (!usuario.correo) continue
        jobs.push(
          notifyVencimientoCaso({
            to:            usuario.correo,
            nombreAbogado: usuario.nombre,
            folio:         caso.folio,
            asunto:        caso.asunto,
            tipo:          caso.tipo,
            estado:        caso.estado,
            fechaLimite:   caso.fecha_limite,
            baseUrl,
            subjectOverride: subject,
          }).catch(err =>
            console.error(`[Worker] Error escalamiento ${caso.folio} → ${usuario.correo}:`, err.message)
          )
        )
      }
    }

    await Promise.all(jobs)
    console.log(`[Worker] Escalamiento urgencias: ${jobs.length} notificación(es) enviada(s).`)
  } catch (err) {
    console.error('[Worker] Error en jobEscalamientoUrgencias:', err.message)
  }
}

// ── Job 5 — Monitoreo IA de casos ─────────────────────────────────
const jobMonitoreoIA = async () => {
  if (!process.env.GOOGLE_AI_API_KEY) return
  console.log('[Worker] Monitoreo IA: iniciando...')
  const baseUrl = process.env.APP_URL || 'http://localhost:5173'

  try {
    const casos = await Case.findAll({
      where: { estado: { [Op.in]: ['activo', 'urgente', 'pendiente', 'en_revision'] } },
    })

    if (!casos.length) {
      console.log('[Worker] Monitoreo IA: no hay casos activos.')
      return
    }

    // Abogados en un solo query
    const abogadoIds = [...new Set(casos.map(c => c.id_abogado).filter(Boolean))]
    const abogados   = abogadoIds.length
      ? await User.findAll({ where: { id_usuario: abogadoIds }, attributes: ['id_usuario', 'nombre', 'correo'] })
      : []
    const abogadoMap = Object.fromEntries(abogados.map(u => [u.id_usuario, u]))
    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER

    let analizados = 0
    for (const caso of casos) {
      try {
        const [movimientos, documentos, citas] = await Promise.all([
          Movimiento.findAll({
            where: { id_caso: caso.id_caso },
            order: [['fecha_movimiento', 'DESC']],
            limit: 8,
          }),
          Document.findAll({
            where: { id_caso: caso.id_caso },
            order: [['createdAt', 'DESC']],
            limit: 5,
          }),
          Appointment.findAll({
            where: {
              id_caso: caso.id_caso,
              estado:  { [Op.in]: ['pendiente', 'confirmada'] },
              fecha:   { [Op.gte]: toLocalDate() },
            },
            order: [['fecha', 'ASC']],
            limit: 3,
          }),
        ])

        const { analizarCaso } = await import('../services/aiService.js')
        const reporte = await analizarCaso({ caso, movimientos, documentos, citas })
        await caso.update({ reporte_ia: JSON.stringify(reporte), reporte_ia_at: new Date() })
        analizados++

        // Pausa entre casos para no exceder el rate limit del free tier (15 RPM)
        await new Promise(resolve => setTimeout(resolve, 5000))

        // Email al abogado asignado (fire-and-forget)
        const abogado = abogadoMap[caso.id_abogado]
        const destino = abogado?.correo ?? adminEmail
        if (destino) {
          notifyReporteIACaso({
            to:            destino,
            nombreAbogado: abogado?.nombre ?? 'Administrador',
            folio:         caso.folio,
            asunto:        caso.asunto,
            tipo:          caso.tipo,
            reporte,
            baseUrl,
          }).catch(err => console.error(`[Worker] Error email IA caso ${caso.folio}:`, err.message))
        }
      } catch (err) {
        console.error(`[Worker] Monitoreo IA: error en caso ${caso.folio}:`, err.message)
      }
    }

    console.log(`[Worker] Monitoreo IA: ${analizados}/${casos.length} caso(s) analizados.`)
  } catch (err) {
    console.error('[Worker] Error en jobMonitoreoIA:', err.message)
  }
}

// ── Job 3 — Limpieza de OTP expirados ─────────────────────────────
const jobLimpiezaOtp = async () => {
  try {
    const [rowsAffected] = await User.update(
      { otp_code: null, otp_expires: null, otp_intentos: 0 },
      { where: { otp_expires: { [Op.lt]: new Date() } } }
    )
    if (rowsAffected > 0) {
      console.log(`[Worker] Limpieza OTP: ${rowsAffected} registro(s) limpiado(s).`)
    }
  } catch (err) {
    console.error('[Worker] Error en jobLimpiezaOtp:', err.message)
  }
}

// ── Exportar jobs para testing manual ─────────────────────────────
export { jobMonitoreoIA }

// ── Inicializador ──────────────────────────────────────────────────
export const startReminderWorker = () => {
  console.log('[Worker] Agente de recordatorios iniciado.')

  // Job 1: Recordatorio de citas — todos los días a las 08:00
  cron.schedule('0 8 * * *', jobRecordatorioCitas, {
    timezone: 'America/Mexico_City',
  })

  // Job 2: Casos vencidos — todos los días a las 09:00
  cron.schedule('0 9 * * *', jobCasosVencidos, {
    timezone: 'America/Mexico_City',
  })

  // Job 3: Limpieza OTP — cada hora
  cron.schedule('0 * * * *', jobLimpiezaOtp)

  // Job 4: Escalamiento de urgencias — cada 4 horas
  cron.schedule('0 */4 * * *', jobEscalamientoUrgencias, {
    timezone: 'America/Mexico_City',
  })

  // Job 5: Monitoreo IA — todos los días a las 07:00 (solo si hay API key)
  if (process.env.GOOGLE_AI_API_KEY) {
    cron.schedule('0 7 * * *', jobMonitoreoIA, {
      timezone: 'America/Mexico_City',
    })
  }

  console.log('[Worker] Jobs programados:')
  console.log('  → 07:00 MX — Monitoreo IA de casos activos')
  console.log('  → 08:00 MX — Recordatorio de citas confirmadas para mañana')
  console.log('  → 09:00 MX — Notificación de casos vencidos')
  console.log('  → :00 cada hora — Limpieza de OTP expirados')
  console.log('  → cada 4h MX — Escalamiento de casos urgentes próximos a vencer')
}
