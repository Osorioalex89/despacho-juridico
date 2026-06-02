// F6.2 — Rutas ARCO (LFPDPPP).
import { Router } from 'express'
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js'
import {
  exportarDatos, solicitarCancelacion, anonimizarUsuario,
} from '../controllers/arco.controller.js'

const router = Router()
router.use(verifyToken)

// Cliente: ejerce sus propios derechos
router.get('/exportar-datos',         requireRole('cliente'), exportarDatos)
router.post('/solicitar-cancelacion', requireRole('cliente'), solicitarCancelacion)

// Admin: materializa la cancelación de cualquier usuario
router.post('/anonimizar/:id',        requireRole('abogado'), anonimizarUsuario)

export default router
