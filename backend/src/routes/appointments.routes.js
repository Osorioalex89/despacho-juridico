import { Router }                   from 'express'
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js'
import {
  getCitas, getCitaById, createCita,
  updateCita, updateEstadoCita, deleteCita
} from '../controllers/appointments.controller.js'

const router = Router()

router.use(verifyToken)

router.get('/',           requireRole('abogado', 'secretario'), getCitas)
router.get('/:id',        requireRole('abogado', 'secretario'), getCitaById)
router.post('/',          requireRole('abogado', 'secretario'), createCita)
router.put('/:id',        requireRole('abogado', 'secretario'), updateCita)
router.patch('/:id/estado', requireRole('abogado', 'secretario'), updateEstadoCita)
router.delete('/:id',     requireRole('abogado', 'secretario'), deleteCita)

export default router
// Ruta especial — cliente solicita su propia cita
router.post('/solicitar', requireRole('cliente'), async (req, res) => {
  try {
    const { fecha, motivo, mensaje, id_caso } = req.body

    if (!fecha || !motivo) {
      return res.status(400).json({ message: 'Fecha y motivo son requeridos' })
    }

    const cita = await (await import('../models/Appointment.js')).default.create({
      fecha,
      hora:           '09:00:00',  // hora provisional, el secretario la ajusta
      motivo,
      mensaje,
      id_caso:        id_caso || null,
      id_solicitante: req.user.id,
      estado:         'pendiente',
    })

    res.status(201).json({ message: 'Solicitud enviada correctamente', cita })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

// Ruta especial — cliente ve solo sus propias citas
router.get('/mis-citas', requireRole('cliente'), async (req, res) => {
  try {
    const Appointment = (await import('../models/Appointment.js')).default
    const citas = await Appointment.findAll({
      where:  { id_solicitante: req.user.id },
      order:  [['fecha', 'ASC'], ['hora', 'ASC']],
    })
    res.json({ citas })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})