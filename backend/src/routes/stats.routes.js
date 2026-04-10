import { Router }                   from 'express'
import { Op }                        from 'sequelize'
import { verifyToken, requireRole }  from '../middlewares/auth.middleware.js'
import User         from '../models/User.js'
import Client       from '../models/Client.js'
import Case         from '../models/Case.js'
import Appointment  from '../models/Appointment.js'

const router = Router()
router.use(verifyToken)
router.use(requireRole('abogado', 'secretario'))

// GET /api/stats/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const hoy = new Date()
    const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`

    const [totalClientes, casosActivos, citasHoy, pendientes] = await Promise.all([
      Client.count(),
      Case.count({ where: { estado: { [Op.ne]: 'cerrado' } } }),
      Appointment.count({ where: { fecha: fechaHoy } }),
      User.count({ where: { estado: 'pendiente', activo: true } }),
    ])

    res.json({ totalClientes, casosActivos, citasHoy, pendientes })
  } catch (error) {
    console.error('Error obteniendo stats del dashboard:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

export default router
