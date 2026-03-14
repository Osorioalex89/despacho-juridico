import bcrypt from 'bcryptjs'
import jwt    from 'jsonwebtoken'
import User   from '../models/User.js'

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body

    if (!correo || !contrasena) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos' })
    }

    // Buscar usuario
    const user = await User.findOne({ where: { correo } })
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    // Verificar contraseña
    const passwordOk = await bcrypt.compare(contrasena, user.contrasena)
    if (!passwordOk) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    // Verificar que esté activo
    if (!user.activo) {
      return res.status(403).json({ message: 'Cuenta desactivada' })
    }

    // Generar JWT
    const token = jwt.sign(
      {
        id:     user.id_usuario,
        correo: user.correo,
        rol:    user.rol,
        estado: user.estado,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.json({
      message: 'Login exitoso',
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
    console.error('Error en login:', error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// POST /api/auth/registro
export const registro = async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' })
    }

    // Verificar si ya existe
    const existe = await User.findOne({ where: { correo } })
    if (existe) {
      return res.status(409).json({ message: 'El correo ya está registrado' })
    }

    // Encriptar contraseña
    const hash = await bcrypt.hash(contrasena, 10)

    // Crear usuario (rol: usuario, estado: pendiente por defecto)
    const newUser = await User.create({
      nombre,
      correo,
      contrasena: hash,
    })

    res.status(201).json({
      message: 'Registro exitoso, espera aprobación',
      user: {
        id:     newUser.id_usuario,
        nombre: newUser.nombre,
        correo: newUser.correo,
        rol:    newUser.rol,
        estado: newUser.estado,
      },
    })

  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}