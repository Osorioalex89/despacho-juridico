import Appointment from '../models/Appointment.js'
import { Op }      from 'sequelize'
import Client      from '../models/Client.js'
import User        from '../models/User.js'
import Case        from '../models/Case.js'
import {
  notifyNewAppointment,
  updateAppointmentStatus,
  notifyAppointmentRescheduled,
} from '../services/emailService.js'
import { notifyUsers, notifyAdmins } from '../services/notificationService.js'

export const getCitas = async (req, res) => {
  try {
    const { fecha, estado, page = 1, limit = 50 } = req.query
    const offset = (page - 1) * limit
    const where  = {}
    if (fecha)  where.fecha  = fecha
    if (estado) where.estado = estado
    const { count, rows } = await Appointment.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      order: [['fecha', 'ASC'], ['hora', 'ASC']],
      include: [{ model: Client, as: 'Cliente', attributes: ['nombre', 'correo', 'telefono'] }],
    })
    res.json({ citas: rows, total: count })
  } catch (error) {
    console.error('Error al obtener citas:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export const getCitaById = async (req, res) => {
  try {
    const cita = await Appointment.findByPk(req.params.id)
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' })
    res.json(cita)
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export const createCita = async (req, res) => {
  try {
    const { id_cliente, id_caso, id_abogado, fecha, hora, motivo, estado, notas } = req.body
    if (!fecha || !hora || !motivo) {
      return res.status(400).json({ message: 'Fecha, hora y motivo son requeridos' })
    }
    const cita = await Appointment.create({
      id_cliente: id_cliente || null,
      id_caso:    id_caso    || null,
      id_abogado: id_abogado || null,
      fecha, hora, motivo,
      estado: estado || 'pendiente',
      notas,
    })

    res.status(201).json({ message: 'Cita creada exitosamente', cita })

    // SSE: notificar a cliente y abogado en tiempo real
    const receps = [id_cliente, id_abogado].filter(Boolean)
    if (receps.length) {
      notifyUsers(receps, {
        tipo:   'cita:creada',
        titulo: 'Nueva cita agendada',
        mensaje: `${fecha} ${hora} — ${motivo}`,
        link:   req.user?.rol === 'cliente' ? '/cliente/mis-citas' : '/panel/agenda',
        icono:  'CalendarDays',
        color:  '#86EFAC',
      })
    }

    // Notificar — fire-and-forget
    Promise.all([
      id_cliente ? Client.findByPk(id_cliente) : null,
      id_abogado ? User.findByPk(id_abogado)   : null,
      id_caso    ? Case.findByPk(id_caso)       : null,
    ]).then(([clienteData, abogadoData, casoData]) =>
      notifyNewAppointment({
        toAbogado:        abogadoData?.correo || null,
        toCliente:        clienteData?.correo || null,
        nombreAbogado:    abogadoData?.nombre || 'Lic. Sánchez',
        nombreCliente:    clienteData?.nombre || 'Cliente',
        fecha, hora, motivo,
        folio:            casoData?.folio  || null,
        asunto:           casoData?.asunto || null,
        creadaPorAbogado: true,
      })
    ).catch(err => console.error('Error notificando cita nueva:', err.message))
  } catch (error) {
    console.error('Error al crear cita:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export const updateCita = async (req, res) => {
  try {
    const cita = await Appointment.findByPk(req.params.id)
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' })

    const { id_cliente, id_caso, id_abogado, fecha, hora, motivo, estado, notas } = req.body

    // Detectar reagendamiento antes de actualizar
    const fechaAnterior = String(cita.fecha).slice(0, 10)
    const horaAnterior  = cita.hora
    const huboReagenda  = (fecha && fecha !== fechaAnterior) || (hora && hora !== horaAnterior)
    const estadoValido  = ['pendiente', 'confirmada'].includes(cita.estado)

    await cita.update({
      id_cliente: id_cliente || null,
      id_caso:    id_caso    || null,
      id_abogado: id_abogado || null,
      fecha, hora, motivo, estado, notas,
    })

    // Notificar reagendamiento al cliente (no bloquea la respuesta)
    if (huboReagenda && estadoValido) {
      try {
        const [clienteData, abogadoData] = await Promise.all([
          cita.id_cliente ? Client.findByPk(cita.id_cliente) : null,
          cita.id_abogado ? User.findByPk(cita.id_abogado)   : null,
        ])
        if (clienteData?.correo) {
          notifyAppointmentRescheduled({
            toCliente:     clienteData.correo,
            nombreCliente: clienteData.nombre,
            nombreAbogado: abogadoData?.nombre || 'Lic. Sánchez',
            fechaAnterior,
            horaAnterior,
            fechaNueva:    fecha || fechaAnterior,
            horaNueva:     hora  || horaAnterior,
            motivo:        motivo || cita.motivo,
          })
        }
      } catch (mailErr) {
        console.error('Error enviando notificación de reagendamiento:', mailErr.message)
      }
    }

    res.json({ message: 'Cita actualizada exitosamente', cita })
  } catch (error) {
    console.error('Error al actualizar cita:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export const updateEstadoCita = async (req, res) => {
  try {
    const cita = await Appointment.findByPk(req.params.id)
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' })
    const { estado, fecha, hora, mensajeCancelacion } = req.body
    if (!['pendiente', 'confirmada', 'cancelada'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' })
    }

    // Al confirmar, actualizar también fecha y hora si se proporcionan
    const updates = { estado }
    if (estado === 'confirmada') {
      if (fecha) updates.fecha = fecha
      if (hora)  updates.hora  = hora
    }
    await cita.update(updates)

    // Notificar al cliente cuando la cita es confirmada o cancelada
    if (['confirmada', 'cancelada'].includes(estado)) {
      try {
        const [clienteData, abogadoData] = await Promise.all([
          cita.id_cliente ? Client.findByPk(cita.id_cliente) : null,
          cita.id_abogado ? User.findByPk(cita.id_abogado)   : null,
        ])
        if (clienteData?.correo) {
          await updateAppointmentStatus({
            toCliente:          clienteData.correo,
            nombreCliente:      clienteData.nombre,
            nombreAbogado:      abogadoData?.nombre || 'Lic. Sánchez',
            fecha:              String(cita.fecha).slice(0, 10),
            hora:               cita.hora,
            motivo:             cita.motivo,
            estado,
            mensajeCancelacion: mensajeCancelacion || null,
          })
        }
      } catch (mailErr) {
        console.error('Error enviando notificación de cambio de estado de cita:', mailErr.message)
      }
    }

    res.json({ message: 'Estado actualizado', cita })

    // SSE: notificar al cliente y abogado del cambio de estado
    const titulo = estado === 'confirmada' ? 'Cita confirmada' : 'Cita cancelada'
    notifyUsers([cita.id_cliente, cita.id_abogado].filter(Boolean), {
      tipo:   `cita:${estado}`,
      titulo,
      mensaje: `${String(cita.fecha).slice(0, 10)} ${cita.hora}`,
      link:   req.user?.rol === 'cliente' ? '/cliente/mis-citas' : '/panel/agenda',
      icono:  'CalendarDays',
      color:  estado === 'confirmada' ? '#86EFAC' : '#FCA5A5',
    })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export const deleteCita = async (req, res) => {
  try {
    const cita = await Appointment.findByPk(req.params.id)
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' })
    await cita.destroy()
    res.json({ message: 'Cita eliminada exitosamente' })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}