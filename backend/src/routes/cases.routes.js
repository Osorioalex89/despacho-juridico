import { Router }                   from 'express'
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js'
import {
  getCasos, getCasoById,
  createCaso, updateCaso, deleteCaso
} from '../controllers/cases.controller.js'

const router = Router()

router.use(verifyToken)

router.get('/',     requireRole('abogado', 'secretario'), getCasos)

// ← ESTA RUTA DEBE IR ANTES DE /:id
router.get('/mis-casos', requireRole('cliente'), async (req, res) => {
  try {
    const Client = (await import('../models/Client.js')).default
    const cliente = await Client.findOne({ where: { id_usuario: req.user.id } })

    if (!cliente) return res.json({ casos: [], cliente: null })

    const Case = (await import('../models/Case.js')).default
    const casos = await Case.findAll({
      where:  { id_cliente: cliente.id_cliente },
      order:  [['fecha_apertura', 'DESC']],
    })

    res.json({ casos, cliente })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

router.get('/:id',  requireRole('abogado', 'secretario'), getCasoById)
router.post('/',    requireRole('abogado'),                createCaso)
router.put('/:id',  requireRole('abogado'),                updateCaso)
router.delete('/:id', requireRole('abogado'),             deleteCaso)

export default router