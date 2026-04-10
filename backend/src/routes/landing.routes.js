import { Router }    from 'express'
import rateLimit from 'express-rate-limit'

const router = Router()

// Máximo 5 solicitudes de asesoría cada 15 minutos por IP
const asesoriaLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { message: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
})

/**
 * POST /api/landing/asesoria
 * Público — sin autenticación.
 * Crea cliente (si no existe) y registra cita pendiente desde la landing page.
 */
router.post('/asesoria', asesoriaLimiter, async (req, res) => {
  try {
    const { nombre, correo, telefono, mensaje } = req.body

    if (!nombre || !correo || !mensaje) {
      return res.status(400).json({ message: 'Nombre, correo y mensaje son requeridos.' })
    }

    const Client      = (await import('../models/Client.js')).default
    const Appointment = (await import('../models/Appointment.js')).default

    // 1. Buscar o crear cliente por correo
    let cliente = await Client.findOne({ where: { correo } })

    if (!cliente) {
      cliente = await Client.create({
        nombre,
        correo,
        telefono: telefono || null,
        id_usuario: null,
      })
    }

    // 2. Insertar cita con estado pendiente
    // fecha = hoy, hora genérica 09:00 (el Lic. reagendará si es necesario)
    const hoy = new Date()
    const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

    const cita = await Appointment.create({
      id_cliente: cliente.id_cliente,
      id_caso:    null,
      id_abogado: null,
      fecha,
      hora:   '09:00:00',
      motivo: mensaje,
      estado: 'pendiente',
      mensaje: null,
      id_solicitante: null,
    })

    // 3. Notificar al Lic. Sánchez — fire-and-forget (no bloquea la respuesta)
    import('../services/emailService.js')
      .then(({ notifyAdminNuevaAsesoria }) =>
        notifyAdminNuevaAsesoria({ nombre, correo, telefono: telefono || null, mensaje })
      )
      .catch(err => console.error('Error enviando notificación de asesoría al admin:', err.message))

    return res.status(201).json({ message: 'Solicitud registrada correctamente.', cita })
  } catch (error) {
    console.error('Error en POST /api/landing/asesoria:', error.message)
    return res.status(500).json({ message: 'Error interno del servidor.' })
  }
})

export default router
