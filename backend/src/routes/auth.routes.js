import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, registro, verifyOtp, verificarEmail, solicitarReset, adminResetPassword, resetPassword, resendOtp } from '../controllers/auth.controller.js'
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js'

const router = Router()

// Máximo 5 intentos de login cada 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
})

// Rate-limit para registro: 10 intentos / 15 min
const registroLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { message: 'Demasiados intentos de registro. Intenta en 15 minutos.' },
})

// Rate-limit para OTP: 10 intentos / 15 min (los 3 intentos por código son en el controller)
const otpLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { message: 'Demasiados intentos. Intenta en 15 minutos.' },
})

router.post('/login',      loginLimiter,    login)
router.post('/registro',   registroLimiter, registro)
router.post('/verify-otp', otpLimiter,      verifyOtp)
router.post('/resend-otp', otpLimiter,      resendOtp)
router.get ('/verificar-email',      verificarEmail)

// ── Recuperacion de contrasena ───────────────────────────────────
// Ruta publica: cualquier usuario puede solicitar reset
router.post('/solicitar-reset',      solicitarReset)
// Ruta protegida: solo abogado o secretario aprueba y genera el token
router.post('/admin-reset-password', verifyToken, requireRole('abogado', 'secretario'), adminResetPassword)
// Ruta pública: el cliente usa el token del correo para establecer su nueva contraseña
router.post('/reset-password', resetPassword)

export default router
