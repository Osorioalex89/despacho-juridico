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

    res.status(201).json({ message: 'Solicitud enviada correctamente', cita })
  } catch (error) {
    console.error(error)
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
    console.error(error)
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

export default router