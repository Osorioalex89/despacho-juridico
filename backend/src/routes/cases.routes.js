import { Router }                   from 'express'
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js'
import { requireOwnership }         from '../middlewares/ownership.middleware.js'
import { chatIaLimiter }            from '../middlewares/aiRateLimit.middleware.js'
import {
  getCasos, getCasoById,
  createCaso, updateCaso, deleteCaso, restaurarCaso,
  addComentario, getCasoTimeline,
  getMovimientos, addMovimiento,
  chatCaso, getChatHistory,
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
    console.error('Error al obtener mis-casos:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

router.get('/:id/timeline',      requireRole('abogado', 'secretario'),           getCasoTimeline)
router.get('/:id/movimientos',   requireRole('abogado', 'secretario', 'cliente'), requireOwnership('case'), getMovimientos)
router.post('/:id/movimientos',  requireRole('abogado', 'secretario'),            addMovimiento)
router.get('/:id',               requireRole('abogado', 'secretario'),            getCasoById)
router.post('/',                 requireRole('abogado'),                createCaso)
router.put('/:id',               requireRole('abogado'),                updateCaso)
router.delete('/:id',            requireRole('abogado'),                deleteCaso)
router.post('/:id/restaurar',    requireRole('abogado'),                restaurarCaso)
// Comentarios — disponible para abogado y secretario
router.post('/:id/comentarios',  requireRole('abogado', 'secretario'),  addComentario)
router.get( '/:id/chat-history', requireRole('abogado', 'secretario', 'cliente'), requireOwnership('case'), getChatHistory)
router.post('/:id/chat',         chatIaLimiter, requireRole('abogado', 'secretario', 'cliente'), requireOwnership('case'), chatCaso)

export default router