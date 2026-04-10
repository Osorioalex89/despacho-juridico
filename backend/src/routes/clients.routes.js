import { Router }                                from 'express'
import { verifyToken, requireRole }              from '../middlewares/auth.middleware.js'
import {
  getClientes, getClienteById,
  createCliente, updateCliente, deleteCliente,
  crearCuentaCliente, completarAsesoria,
} from '../controllers/clients.controller.js'

const router = Router()

// Todas las rutas requieren token
router.use(verifyToken)

router.get('/',     requireRole('abogado', 'secretario'), getClientes)
router.get('/:id',  requireRole('abogado', 'secretario'), getClienteById)
router.post('/',    requireRole('abogado', 'secretario'), createCliente)
router.post('/:id/crear-cuenta', requireRole('abogado', 'secretario'), crearCuentaCliente)
router.patch('/:id/completar-asesoria', requireRole('abogado', 'secretario'), completarAsesoria)
router.put('/:id',  requireRole('abogado', 'secretario'), updateCliente)
router.delete('/:id', requireRole('abogado'),             deleteCliente)

export default router