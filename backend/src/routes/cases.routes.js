import { Router }                   from 'express'
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js'
import {
  getCasos, getCasoById,
  createCaso, updateCaso, deleteCaso
} from '../controllers/cases.controller.js'

const router = Router()

router.use(verifyToken)

router.get('/',     requireRole('abogado', 'secretario'), getCasos)
router.get('/:id',  requireRole('abogado', 'secretario'), getCasoById)
router.post('/',    requireRole('abogado'),                createCaso)
router.put('/:id',  requireRole('abogado'),                updateCaso)
router.delete('/:id', requireRole('abogado'),             deleteCaso)

export default router