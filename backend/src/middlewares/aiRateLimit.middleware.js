// F4.3 — Rate-limit específico para endpoints que disparan llamadas a Groq.
// Justificación:
//   - Coste: cada request a Groq cuesta tokens; un cliente abusivo puede
//     vaciar la cuota del free tier (15 RPM) o disparar la factura.
//   - Estabilidad: el chat IA mantiene historial → ráfagas afectan a otros.
//
// Llave por usuario autenticado (req.user.id) → cliente A no afecta a cliente B.
// Si no hay user (no debería en estas rutas, todas pasan verifyToken), cae a IP.
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

// ipKeyGenerator normaliza IPv6 a /64 (recomendado por express-rate-limit)
const keyByUser = (req) =>
  req.user?.id ? `u:${req.user.id}` : `ip:${ipKeyGenerator(req)}`

// Chat IA — 20 req/min/usuario. El chat real ronda 1 req cada varios segundos,
// 20/min deja margen amplio para uso humano legítimo y bloquea bots.
export const chatIaLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             Number(process.env.AI_CHAT_RATE_MAX || 20),
  keyGenerator:    keyByUser,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { message: 'Demasiadas consultas al asistente IA. Espera un minuto antes de continuar.' },
})

// Subida de documentos con análisis IA — 10 uploads/min/usuario.
// Un usuario real rara vez sube >10/min; este límite frena scripts que
// suban PDFs malformados para spam de prompts.
export const docAiLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             Number(process.env.AI_DOC_RATE_MAX || 10),
  keyGenerator:    keyByUser,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { message: 'Demasiadas subidas en poco tiempo. Espera un minuto.' },
})
