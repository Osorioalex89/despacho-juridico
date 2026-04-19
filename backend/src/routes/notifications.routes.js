import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { registerConnection, removeConnection } from '../services/notificationService.js'

const router = Router()

// GET /api/notificaciones/stream?token=xxx
// El token va en query param porque EventSource no soporta headers
router.get('/stream', (req, res) => {
  const { token } = req.query
  if (!token) return res.status(401).json({ error: 'Token requerido' })

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }

  const userId = String(decoded.id)
  const role   = decoded.rol

  res.writeHead(200, {
    'Content-Type':      'text/event-stream',
    'Cache-Control':     'no-cache',
    'Connection':        'keep-alive',
    'X-Accel-Buffering': 'no',  // evita buffering en nginx/Railway
  })
  res.write(': conectado\n\n')

  registerConnection(userId, role, res)

  // Heartbeat cada 25s para mantener la conexión viva
  const hb = setInterval(() => {
    try { res.write(': ping\n\n') } catch { clearInterval(hb) }
  }, 25000)

  req.on('close', () => {
    clearInterval(hb)
    removeConnection(userId)
  })
})

export default router
