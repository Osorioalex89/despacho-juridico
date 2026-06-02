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
import Comment     from '../models/Comment.js'
import AuditLog    from '../models/AuditLog.js'

import {
  sendReminderCita,
  notifyVencimientoCaso,
  notifyReporteIACaso,
  notifyAuditAlert,
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
  if (!process.env.GROQ_API_KEY) return
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
        const reporte = await analizarCaso({ caso, movimientos, documentos, citas, uid: 'worker:monitoreoIA' })
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

// ── Job 7 — Alertas de auditoría (F5.3) ───────────────────────────
// Corre cada 5 min. Se anti-spam vía marca en metadata_json: si la alerta
// ya se mandó dentro de la ventana actual, no se vuelve a mandar.
//
// Tres reglas:
//   A) >5 OTP fallidos del mismo usuario en 10 min → email admin
//   B) >20 descargas del mismo doc en 1h        → email admin (posible exfiltración)
//   C) Login desde IP no vista en 30 días para ese usuario → email al usuario
const jobAlertasSeguridad = async () => {
  const ahora = new Date()
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER
  if (!adminEmail) return

  // Helper: ¿ya alertamos por X (key) en los últimos minutos?
  const yaAlertado = async (key, dentroDeMin) => {
    const desde = new Date(ahora.getTime() - dentroDeMin * 60 * 1000)
    const n = await AuditLog.count({
      where: {
        action:   'security_alert',
        created_at: { [Op.gte]: desde },
        metadata_json: { key },
      },
    }).catch(() => 0)
    return n > 0
  }
  const marcarAlerta = (key, payload) =>
    AuditLog.create({
      action: 'security_alert',
      metadata_json: { key, ...payload },
    }).catch(err => console.error('[Worker] no se pudo marcar alerta:', err.message))

  try {
    // ── A) OTP brute-force ────────────────────────────────────────
    const desde10 = new Date(ahora.getTime() - 10 * 60 * 1000)
    const otpRows = await AuditLog.findAll({
      where: { action: 'otp_failed', created_at: { [Op.gte]: desde10 } },
      attributes: ['user_id'],
      raw: true,
    })
    const otpCount = otpRows.reduce((acc, r) => {
      if (!r.user_id) return acc
      acc[r.user_id] = (acc[r.user_id] || 0) + 1
      return acc
    }, {})
    for (const [uid, n] of Object.entries(otpCount)) {
      if (n <= 5) continue
      const key = `otp_bf:${uid}:${ahora.toISOString().slice(0,13)}` // hora actual
      if (await yaAlertado(key, 60)) continue
      await notifyAuditAlert({
        to:     adminEmail,
        tipo:   'otp_brute_force',
        titulo: `Posible fuerza bruta OTP en usuario #${uid}`,
        lineas: [
          `Intentos fallidos en los últimos 10 min: <b>${n}</b>`,
          `Umbral configurado: 5`,
          `Revisa /panel/auditoria filtro action=otp_failed userId=${uid}`,
        ],
      })
      await marcarAlerta(key, { user_id: Number(uid), n })
    }

    // ── B) Descargas masivas del mismo doc ─────────────────────────
    const desde1h = new Date(ahora.getTime() - 60 * 60 * 1000)
    const dlRows = await AuditLog.findAll({
      where: { action: 'doc_download', created_at: { [Op.gte]: desde1h } },
      attributes: ['resource_id'],
      raw: true,
    })
    const dlCount = dlRows.reduce((acc, r) => {
      if (!r.resource_id) return acc
      acc[r.resource_id] = (acc[r.resource_id] || 0) + 1
      return acc
    }, {})
    for (const [docId, n] of Object.entries(dlCount)) {
      if (n <= 20) continue
      const key = `dl_burst:${docId}:${ahora.toISOString().slice(0,13)}`
      if (await yaAlertado(key, 60)) continue
      await notifyAuditAlert({
        to:     adminEmail,
        tipo:   'doc_exfiltration_suspect',
        titulo: `Documento #${docId} descargado ${n} veces en 1h`,
        lineas: [
          `Posible exfiltración o script automatizado.`,
          `Umbral configurado: 20 descargas/hora.`,
          `Revisa /panel/auditoria filtro action=doc_download resourceId=${docId}`,
        ],
      })
      await marcarAlerta(key, { doc_id: Number(docId), n })
    }

    // ── C) Login desde IP nueva (30 días) ──────────────────────────
    // Sólo lo notamos para logins de la última corrida (5 min) para no spam.
    const desde5 = new Date(ahora.getTime() - 5 * 60 * 1000)
    const desde30d = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000)
    const loginsRecientes = await AuditLog.findAll({
      where: { action: 'login', created_at: { [Op.gte]: desde5 } },
      attributes: ['user_id', 'ip'],
      raw: true,
    })
    for (const { user_id, ip } of loginsRecientes) {
      if (!user_id || !ip) continue
      const vistaAntes = await AuditLog.count({
        where: {
          action:   'login',
          user_id,
          ip,
          created_at: { [Op.between]: [desde30d, desde5] },
        },
      }).catch(() => 0)
      if (vistaAntes > 0) continue // IP ya vista en 30 días
      const key = `new_ip:${user_id}:${ip}`
      if (await yaAlertado(key, 24 * 60)) continue
      // Email al usuario afectado, no al admin
      const usr = await User.findByPk(user_id, { attributes: ['correo', 'nombre'] }).catch(() => null)
      if (!usr?.correo) continue
      await notifyAuditAlert({
        to:     usr.correo,
        tipo:   'new_ip_login',
        titulo: `Acceso desde una IP nueva a tu cuenta`,
        lineas: [
          `Hola ${usr.nombre},`,
          `Detectamos un inicio de sesión desde la IP <b>${ip}</b>, no vista en tu cuenta en los últimos 30 días.`,
          `Si fuiste tú, ignora este aviso. Si no, cambia tu contraseña y avísanos.`,
        ],
      })
      await marcarAlerta(key, { user_id, ip })
    }
  } catch (err) {
    console.error('[Worker] Error en jobAlertasSeguridad:', err.message)
  }
}

// ── Job 6 — Purga física de soft-deleted (F1.2) ───────────────────
// Borra DEFINITIVAMENTE los registros con deletedAt < now() - SOFT_DELETE_PURGE_DAYS.
// LFPDPPP exige que el dato no se conserve más allá del tiempo razonable;
// 90 días por defecto da margen para restaurar errores y cumple la ley.
const jobPurgaSoftDeleted = async () => {
  const dias = Number(process.env.SOFT_DELETE_PURGE_DAYS || 90)
  const corte = new Date()
  corte.setDate(corte.getDate() - dias)

  const targets = [
    { name: 'Comment',     model: Comment     },
    { name: 'Movimiento',  model: Movimiento  },
    { name: 'Document',    model: Document    },
    { name: 'Appointment', model: Appointment },
    { name: 'Case',        model: Case        },
    { name: 'Client',      model: Client      },
    // Orden: hijos antes que padres (evita problemas con FK si existieran ON DELETE RESTRICT)
  ]

  console.log(`[Worker] Purga soft-deleted: corte=${toLocalDate(corte)} (>${dias} días)`)
  let totalPurgados = 0
  for (const { name, model } of targets) {
    try {
      const n = await model.destroy({
        where:    { deletedAt: { [Op.lt]: corte } },
        force:    true,
        paranoid: false,
      })
      if (n > 0) {
        console.log(`[Worker]   ${name}: ${n} registro(s) purgado(s) físicamente.`)
        totalPurgados += n
      }
    } catch (err) {
      console.error(`[Worker] Error purgando ${name}:`, err.message)
    }
  }
  if (totalPurgados === 0) console.log('[Worker] Purga soft-deleted: nada que purgar.')
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
  if (process.env.GROQ_API_KEY) {
    cron.schedule('0 7 * * *', jobMonitoreoIA, {
      timezone: 'America/Mexico_City',
    })
  }

  // Job 6: Purga física de soft-deleted — todos los días a las 03:00 (F1.2)
  cron.schedule('0 3 * * *', jobPurgaSoftDeleted, {
    timezone: 'America/Mexico_City',
  })

  // Job 7: Alertas de seguridad (F5.3) — cada 5 minutos
  cron.schedule('*/5 * * * *', jobAlertasSeguridad)

  console.log('[Worker] Jobs programados:')
  console.log('  → cada 5 min — Alertas de seguridad (OTP brute-force, exfiltración, IP nueva)')
  console.log('  → 03:00 MX — Purga física de soft-deleted > SOFT_DELETE_PURGE_DAYS')
  console.log('  → 07:00 MX — Monitoreo IA de casos activos')
  console.log('  → 08:00 MX — Recordatorio de citas confirmadas para mañana')
  console.log('  → 09:00 MX — Notificación de casos vencidos')
  console.log('  → :00 cada hora — Limpieza de OTP expirados')
  console.log('  → cada 4h MX — Escalamiento de casos urgentes próximos a vencer')
}
