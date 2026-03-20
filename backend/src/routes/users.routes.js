import { Router }                   from 'express'
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js'
import {
  getUsuarios, updateEstadoUsuario, deleteUsuario
} from '../controllers/users.controller.js'

const router = Router()
router.use(verifyToken)

router.get('/',             requireRole('abogado', 'secretario'), getUsuarios)
router.patch('/:id/estado', requireRole('abogado', 'secretario'), updateEstadoUsuario)
router.delete('/:id',       requireRole('abogado'),               deleteUsuario)

export default router