// F5.2 — API de auditoría (solo abogado).
//   GET /api/audit
//     ?action=login,doc_download   filtro por acciones (CSV)
//     ?userId=42                   filtro por usuario
//     ?ip=1.2.3.4                  filtro por IP
//     ?desde=2026-05-01&hasta=2026-06-01
//     ?page=1&limit=50             default 50, máx 200
//   Respuesta: { total, page, limit, rows[] }
import { Router } from 'express'
import { Op }     from 'sequelize'
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js'
import AuditLog from '../models/AuditLog.js'

const router = Router()
router.use(verifyToken, requireRole('abogado'))

router.get('/', async (req, res) => {
  try {
    const { action, userId, ip, desde, hasta } = req.query
    const page  = Math.max(1, Number(req.query.page  || 1))
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)))

    const where = {}
    if (action) {
      const arr = String(action).split(',').map(s => s.trim()).filter(Boolean)
      where.action = arr.length > 1 ? { [Op.in]: arr } : arr[0]
    }
    if (userId) where.user_id = Number(userId)
    if (ip)     where.ip      = ip
    if (desde || hasta) {
      where.created_at = {}
      if (desde) where.created_at[Op.gte] = new Date(desde)
      if (hasta) where.created_at[Op.lte] = new Date(hasta)
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order:  [['created_at', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })

    res.json({ total: count, page, limit, rows })
  } catch (err) {
    console.error('Error en GET /api/audit:', err.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

export default router
