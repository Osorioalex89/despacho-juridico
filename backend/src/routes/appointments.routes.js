import { Router }                   from 'express'
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js'
import {
  getCitas, getCitaById, createCita,
  updateCita, updateEstadoCita, deleteCita
} from '../controllers/appointments.controller.js'

const router = Router()

router.use(verifyToken)

// ── Rutas del cliente — DEBEN IR ANTES de /:id ──────────────────

// Cliente solicita su propia cita
router.post('/solicitar', requireRole('cliente'), async (req, res) => {
  try {
    const { fecha, motivo, mensaje, id_caso } = req.body

    if (!fecha || !motivo) {
      return res.status(400).json({ message: 'Fecha y motivo son requeridos' })
    }

    const Client      = (await import('../models/Client.js')).default
    const cliente     = await Client.findOne({ where: { id_usuario: req.user.id } })
    const Appointment = (await import('../models/Appointment.js')).default

    const cita = await Appointment.create({
      fecha,
      hora:           '09:00:00',
      motivo,
      mensaje,
      id_caso:        id_caso || null,
      id_cliente:     cliente?.id_cliente || null,
      id_solicitante: req.user.id,
      estado:         'pendiente',
    })

    // Notificar a todos los abogados/secretarios activos + confirmar al cliente
    try {
      const { notifyNewAppointment } = await import('../services/emailService.js')
      const User = (await import('../models/User.js')).default

      const solicitante = await User.findByPk(req.user.id, { attributes: ['nombre', 'correo'] })
      const admins      = await User.findAll({
        where:      { rol: ['abogado', 'secretario'], activo: true },
        attributes: ['nombre', 'correo'],
      })

      const nombreCliente = solicitante?.nombre || req.user.correo

      // Email de aviso a cada admin
      for (const admin of admins) {
        notifyNewAppointment({
          toAbogado: admin.correo,  toCliente: null,
          nombreAbogado: admin.nombre, nombreCliente,
          fecha, hora: '09:00:00', motivo,
          folio: null, asunto: null,
        }).catch(e => console.error('Error notificando admin cita:', e.message))
      }

      // Confirmación al cliente solicitante
      if (solicitante?.correo) {
        notifyNewAppointment({
          toAbogado: null, toCliente: solicitante.correo,
          nombreAbogado: 'el despacho', nombreCliente,
          fecha, hora: '09:00:00', motivo,
          folio: null, asunto: null,
        }).catch(e => console.error('Error confirmando cita al cliente:', e.message))
      }
    } catch (mailErr) {
      console.error('Error en notificaciones de solicitud de cita:', mailErr.message)
    }

    res.status(201).json({ message: 'Solicitud enviada correctamente', cita })
  } catch (error) {
    console.error('Error al solicitar cita:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

// Cliente ve sus propias citas
router.get('/mis-citas', requireRole('cliente'), async (req, res) => {
  try {
    const Appointment = (await import('../models/Appointment.js')).default
    const Client      = (await import('../models/Client.js')).default
    const { Op }      = await import('sequelize')

    const cliente = await Client.findOne({ where: { id_usuario: req.user.id } })

    const where = {
      [Op.or]: [{ id_solicitante: req.user.id }]
    }

    if (cliente) {
      where[Op.or].push({ id_cliente: cliente.id_cliente })
    }

    const citas = await Appointment.findAll({
      where,
      order: [['fecha', 'ASC'], ['hora', 'ASC']],
    })

    res.json({ citas })
  } catch (error) {
    console.error('Error al obtener mis-citas:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

// ── Rutas del panel interno ──────────────────────────────────────
router.get('/',             requireRole('abogado', 'secretario'), getCitas)
router.get('/:id',          requireRole('abogado', 'secretario'), getCitaById)
router.post('/',            requireRole('abogado', 'secretario'), createCita)
router.put('/:id',          requireRole('abogado', 'secretario'), updateCita)
router.patch('/:id/estado', requireRole('abogado', 'secretario'), updateEstadoCita)
router.delete('/:id',       requireRole('abogado', 'secretario'), deleteCita)

// ── Rechazar solicitud de asesoría (Landing) ─────────────────────
router.patch('/:id/rechazar', requireRole('abogado', 'secretario'), async (req, res) => {
  try {
    const { default: Appointment } = await import('../models/Appointment.js')
    const { default: Client }      = await import('../models/Client.js')

    const cita = await Appointment.findByPk(req.params.id, {
      include: [{ model: Client, as: 'Cliente', attributes: ['nombre', 'correo'] }],
    })
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' })

    await cita.update({ estado: 'cancelada' })

    // Email formal de rechazo (fire-and-forget)
    const correoCliente = cita.Cliente?.correo
    const nombreCliente = cita.Cliente?.nombre || 'Cliente'
    if (correoCliente) {
      import('../services/emailService.js')
        .then(({ notifyAsesoriaRechazada }) =>
          notifyAsesoriaRechazada({ to: correoCliente, nombre: nombreCliente, motivo: cita.motivo })
        )
        .catch(e => console.error('Error enviando email de rechazo:', e.message))
    }

    res.json({ message: 'Solicitud rechazada correctamente', cita })
  } catch (error) {
    console.error('Error al rechazar solicitud:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

export default router