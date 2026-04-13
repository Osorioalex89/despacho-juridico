import bcrypt    from 'bcryptjs'
import jwt        from 'jsonwebtoken'
import crypto     from 'crypto'
import User       from '../models/User.js'
import {
  sendOtpEmail,
  sendVerificationEmail,
  sendResetRequestToAdmin,
  sendNewPasswordToClient,
  notifyAdminNewUser,
} from '../services/emailService.js'

// ── Helpers ───────────────────────────────────────────────────────
const generateOtp     = () => String(Math.floor(100000 + Math.random() * 900000))
const generateToken64 = () => crypto.randomBytes(32).toString('hex')

// URL base para links de verificación (configurable en .env)
const BASE_URL = process.env.APP_URL || 'http://localhost:5173'

// ── POST /api/auth/registro ───────────────────────────────────────
export const registro = async (req, res) => {
  try {
    const { nombre, correo, contrasena, turnstileToken, origen } = req.body

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' })
    }

    // ── Verificar Cloudflare Turnstile ─────────────────────────
    if (process.env.NODE_ENV === 'production' && process.env.TURNSTILE_SECRET) {
      if (!turnstileToken) {
        return res.status(400).json({ message: 'Verificación de seguridad requerida' })
      }
      const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret:   process.env.TURNSTILE_SECRET,
          response: turnstileToken,
        }),
      })
      const cfData = await cfRes.json()
      if (!cfData.success) {
        return res.status(400).json({ message: 'Verificación de seguridad fallida. Intenta de nuevo.' })
      }
    }

    // ── Verificar si ya existe ─────────────────────────────────
    const existe = await User.findOne({ where: { correo } })
    if (existe) {
      return res.status(409).json({ message: 'El correo ya está registrado' })
    }

    // ── Crear usuario con activo:false + token de verificación ─
    const hash               = await bcrypt.hash(contrasena, 10)
    const verification_token = generateToken64()

    await User.create({
      nombre,
      correo,
      contrasena: hash,
      activo:     false,
      verification_token,
      origen:     origen || null,
    })

    // ── Enviar correo de verificación ──────────────────────────
    try {
      await sendVerificationEmail({ to: correo, nombre, token: verification_token, baseUrl: BASE_URL })
    } catch (mailErr) {
      console.error('Error enviando correo de verificación:', mailErr.message)
      // No interrumpir el flujo si el correo falla
    }

    res.status(201).json({
      message: 'Cuenta creada. Revisa tu correo para verificarla antes de iniciar sesión.',
    })

  } catch (error) {
    console.error('Error en registro:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// ── GET /api/auth/verificar-email?token=xxx ───────────────────────
export const verificarEmail = async (req, res) => {
  try {
    const { token } = req.query
    if (!token) return res.status(400).json({ message: 'Token requerido' })

    const user = await User.findOne({ where: { verification_token: token } })

    // Si no encontramos el token, puede ser que ya fue consumido (doble petición de React)
    if (!user) {
      // Buscar si existe algún usuario activo con este token ya limpiado no es posible,
      // pero sí podemos responder con éxito en lugar de error para no asustar al frontend.
      // El token ya fue validado en una petición anterior si activo pasó a true.
      return res.json({ message: 'Correo ya verificado. Ya puedes iniciar sesión.', alreadyVerified: true })
    }

    // Si el usuario ya estaba activo (segunda petición llega antes de limpiar el token)
    if (user.activo) {
      await user.update({ verification_token: null })
      return res.json({ message: 'Correo ya verificado. Ya puedes iniciar sesión.', alreadyVerified: true })
    }

    await user.update({ activo: true, verification_token: null })

    // Notificar al admin (no bloquea la respuesta)
    notifyAdminNewUser({ nombre: user.nombre, correo: user.correo, baseUrl: BASE_URL })
      .catch(() => {})

    res.json({ message: 'Correo verificado correctamente. Ya puedes iniciar sesión.' })

  } catch (error) {
    console.error('Error verificando email:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────
// Paso 1: valida credenciales → genera OTP → devuelve tempToken
export const login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body

    if (!correo || !contrasena) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos' })
    }

    const user = await User.findOne({ where: { correo } })
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    const passwordOk = await bcrypt.compare(contrasena, user.contrasena)
    if (!passwordOk) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    // Cuenta sin verificar email
    if (!user.activo) {
      return res.status(403).json({
        message: 'Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
        code: 'EMAIL_NOT_VERIFIED',
      })
    }

    // ── Invalidar OTP anterior y generar uno nuevo (10 min) ────
    const otp         = generateOtp()
    const otp_expires = new Date(Date.now() + 10 * 60 * 1000)

    await user.update({ otp_code: otp, otp_expires, otp_intentos: 0 })

    // ── Enviar OTP al correo del usuario ───────────────────────
    try {
      await sendOtpEmail({ to: user.correo, nombre: user.nombre, otp })
    } catch (mailErr) {
      console.error('Error enviando OTP:', mailErr.message)
      return res.status(500).json({ message: 'Error enviando el código de verificación. Intenta más tarde.' })
    }

    // ── tempToken: JWT corto (10 min) para identificar la sesión OTP
    const tempToken = jwt.sign(
      { id: user.id_usuario, type: 'otp_pending' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    )

    // Máscara del correo: ej. ju*****@gmail.com
    const [local, domain] = user.correo.split('@')
    const maskedEmail = local.slice(0, 2) + '*'.repeat(Math.max(local.length - 2, 3)) + '@' + domain

    res.json({
      requiresOtp: true,
      tempToken,
      maskedEmail,
    })

  } catch (error) {
    console.error('Error en login:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// ── POST /api/auth/verify-otp ─────────────────────────────────────
// Paso 2: valida el OTP → entrega JWT final
export const verifyOtp = async (req, res) => {
  try {
    const { tempToken, otp } = req.body

    if (!tempToken || !otp) {
      return res.status(400).json({ message: 'Token temporal y código son requeridos' })
    }

    // Verificar tempToken
    let payload
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ message: 'Sesión expirada. Inicia sesión de nuevo.' })
    }

    if (payload.type !== 'otp_pending') {
      return res.status(401).json({ message: 'Token inválido' })
    }

    const user = await User.findByPk(payload.id)
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' })
    }

    // Validar expiración primero
    if (!user.otp_expires || new Date() > new Date(user.otp_expires)) {
      await user.update({ otp_code: null, otp_expires: null, otp_intentos: 0 })
      return res.status(401).json({ message: 'El código ha expirado. Inicia sesión de nuevo.', expired: true })
    }

    // Validar código
    if (!user.otp_code || user.otp_code !== String(otp).trim()) {
      const MAX_INTENTOS = 3
      const intentos = (user.otp_intentos || 0) + 1
      const restantes = MAX_INTENTOS - intentos

      if (restantes <= 0) {
        await user.update({ otp_code: null, otp_expires: null, otp_intentos: 0 })
        return res.status(401).json({ message: 'Demasiados intentos fallidos. Inicia sesión de nuevo.', expired: true })
      }

      await user.update({ otp_intentos: intentos })
      return res.status(401).json({
        message: `Código incorrecto. Te quedan ${restantes} intento${restantes === 1 ? '' : 's'}.`,
      })
    }

    // ── OTP válido → limpiar OTP y emitir JWT final ────────────
    await user.update({ otp_code: null, otp_expires: null })

    const token = jwt.sign(
      {
        id:     user.id_usuario,
        correo: user.correo,
        rol:    user.rol,
        estado: user.estado,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    )

    res.json({
      message: 'Acceso concedido',
      token,
      user: {
        id:     user.id_usuario,
        nombre: user.nombre,
        correo: user.correo,
        rol:    user.rol,
        estado: user.estado,
      },
    })

  } catch (error) {
    console.error('Error en verify-otp:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// ── POST /api/auth/solicitar-reset ────────────────────────────────
// Ruta pública: el cliente envía su correo para pedir reset de contraseña.
// Marca reset_solicitado=true y notifica a todos los admins (abogado/secretario).
export const solicitarReset = async (req, res) => {
  try {
    const { correo } = req.body
    if (!correo) {
      return res.status(400).json({ message: 'El correo es requerido' })
    }

    // Siempre responder con éxito para no revelar si el correo existe
    const user = await User.findOne({ where: { correo } })
    if (!user || !user.activo) {
      return res.json({ message: 'Si el correo está registrado recibirás una respuesta del despacho.' })
    }

    // Marcar solicitud
    await user.update({
      reset_solicitado:    true,
      reset_solicitado_at: new Date(),
    })

    // Buscar correos de abogados y secretarios activos
    const admins = await User.findAll({
      where: { rol: ['abogado', 'secretario'], activo: true },
      attributes: ['correo'],
    })
    const adminCorreos = admins.map(a => a.correo)

    if (adminCorreos.length > 0) {
      try {
        await sendResetRequestToAdmin({
          toAdmins:       adminCorreos,
          clienteNombre:  user.nombre,
          clienteCorreo:  user.correo,
        })
      } catch (mailErr) {
        console.error('Error notificando admins para reset:', mailErr.message)
      }
    }

    res.json({ message: 'Si el correo está registrado recibirás una respuesta del despacho.' })

  } catch (error) {
    console.error('Error en solicitar-reset:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// ── POST /api/auth/admin-reset-password ───────────────────────────
// Ruta protegida (abogado/secretario): genera contraseña temporal automática,
// la asigna al usuario, limpia el flag de reset y la envía por correo al cliente.
export const adminResetPassword = async (req, res) => {
  try {
    const { id_usuario } = req.body

    if (!id_usuario) {
      return res.status(400).json({ message: 'id_usuario es requerido' })
    }

    const user = await User.findByPk(id_usuario)
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    // Generar contraseña temporal: prefijo fijo + 8 chars aleatorios (mayúsc + núm)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const randomPart = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('')
    const contrasenaTemp = `Tmp-${randomPart}`

    const hash = await bcrypt.hash(contrasenaTemp, 10)
    await user.update({
      contrasena:          hash,
      reset_solicitado:    false,
      reset_solicitado_at: null,
    })

    // Notificar al cliente con la contraseña temporal — fire-and-forget
    sendNewPasswordToClient({
      to:        user.correo,
      nombre:    user.nombre,
      contrasena: contrasenaTemp,
    }).catch(err => console.error('Error enviando nueva contraseña al cliente:', err.message))

    res.json({ message: `Contraseña restablecida correctamente. Se notificó a ${user.correo}.` })

  } catch (error) {
    console.error('Error en admin-reset-password:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// ── POST /api/auth/resend-otp ─────────────────────────────────────
// Reenvía el OTP usando el tempToken de la sesión OTP activa.
// Genera un código nuevo (invalida el anterior) y resetea intentos.
export const resendOtp = async (req, res) => {
  try {
    const { tempToken } = req.body
    if (!tempToken) {
      return res.status(400).json({ message: 'Token de sesión requerido' })
    }

    // Verificar tempToken
    let payload
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ message: 'Sesión expirada. Inicia sesión de nuevo.', expired: true })
    }

    if (payload.type !== 'otp_pending') {
      return res.status(401).json({ message: 'Token inválido', expired: true })
    }

    const user = await User.findByPk(payload.id)
    if (!user || !user.activo) {
      return res.status(401).json({ message: 'Usuario no encontrado', expired: true })
    }

    // Generar nuevo OTP (invalida el anterior)
    const otp         = generateOtp()
    const otp_expires = new Date(Date.now() + 10 * 60 * 1000)
    await user.update({ otp_code: otp, otp_expires, otp_intentos: 0 })

    // Enviar correo
    try {
      await sendOtpEmail({ to: user.correo, nombre: user.nombre, otp })
    } catch (mailErr) {
      console.error('Error reenviando OTP:', mailErr.message)
      return res.status(500).json({ message: 'Error enviando el código. Intenta de nuevo.' })
    }

    // Emitir nuevo tempToken (10 min desde ahora)
    const newTempToken = jwt.sign(
      { id: user.id_usuario, type: 'otp_pending' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    )

    res.json({ message: 'Código reenviado. Revisa tu correo.', tempToken: newTempToken })

  } catch (error) {
    console.error('Error en resend-otp:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}
