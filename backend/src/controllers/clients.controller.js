import bcrypt from 'bcryptjs'
import Client from '../models/Client.js'
import User   from '../models/User.js'
import { Op } from 'sequelize'
import { sendBienvenidaPortal } from '../services/emailService.js'

// GET /api/clientes
export const getClientes = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    const where = search ? {
      [Op.or]: [
        { nombre:  { [Op.like]: `%${search}%` } },
        { correo:  { [Op.like]: `%${search}%` } },
        { telefono:{ [Op.like]: `%${search}%` } },
      ]
    } : {}

    const { count, rows } = await Client.findAndCountAll({
      where,
      limit:  parseInt(limit),
      offset: parseInt(offset),
      order:  [['createdAt', 'DESC']],
    })

    res.json({
      clientes:   rows,
      total:      count,
      pagina:     parseInt(page),
      totalPaginas: Math.ceil(count / limit),
    })
  } catch (error) {
    console.error('Error al obtener clientes:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// GET /api/clientes/:id
export const getClienteById = async (req, res) => {
  try {
    const cliente = await Client.findByPk(req.params.id)
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' })
    res.json(cliente)
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// POST /api/clientes
export const createCliente = async (req, res) => {
  try {
    const { nombre, telefono, correo, direccion, rfc, notas, contrasena } = req.body

    if (!nombre) return res.status(400).json({ message: 'El nombre es requerido' })

    let id_usuario = null

    // Si se proporciona contraseña, crear usuario vinculado con acceso al portal
    if (contrasena) {
      if (!correo) return res.status(400).json({ message: 'El correo es requerido para crear acceso al portal' })

      const existente = await User.findOne({ where: { correo } })
      if (existente) return res.status(400).json({ message: 'Ya existe un usuario con ese correo' })

      const hash    = await bcrypt.hash(contrasena, 10)
      const usuario = await User.create({
        nombre, correo, contrasena: hash,
        rol: 'cliente', estado: 'aprobado', activo: true,
      })
      id_usuario = usuario.id_usuario
    }

    const cliente = await Client.create({
      nombre, telefono, correo, direccion, rfc, notas, id_usuario
    })

    res.status(201).json({ message: 'Cliente creado exitosamente', cliente })
  } catch (error) {
    console.error('Error al crear cliente:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// PUT /api/clientes/:id
export const updateCliente = async (req, res) => {
  try {
    const cliente = await Client.findByPk(req.params.id)
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' })

    const { nombre, telefono, correo, direccion, rfc, notas } = req.body
    await cliente.update({ nombre, telefono, correo, direccion, rfc, notas })

    res.json({ message: 'Cliente actualizado exitosamente', cliente })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// POST /api/clientes/:id/crear-cuenta
export const crearCuentaCliente = async (req, res) => {
  try {
    const cliente = await Client.findByPk(req.params.id)
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' })
    if (cliente.id_usuario) return res.status(400).json({ message: 'Este cliente ya tiene acceso al portal' })
    if (!cliente.correo) return res.status(400).json({ message: 'El cliente no tiene correo registrado' })

    // Si ya existe un usuario con ese correo, solo vincularlo
    const existente = await User.findOne({ where: { correo: cliente.correo } })
    if (existente) {
      await cliente.update({ id_usuario: existente.id_usuario })
      return res.json({ message: 'Cuenta existente vinculada al cliente', correo: cliente.correo })
    }

    // Generar contraseña temporal aleatoria
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    const tempPassword = Array.from({ length: 10 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('')
    const hash = await bcrypt.hash(tempPassword, 10)

    const usuario = await User.create({
      nombre:     cliente.nombre,
      correo:     cliente.correo,
      contrasena: hash,
      rol:        'cliente',
      activo:     true,
      estado:     'aprobado',
    })

    await cliente.update({ id_usuario: usuario.id_usuario })

    // Email con credenciales (fire-and-forget)
    const baseUrl = process.env.APP_URL || 'http://localhost:5173'
    sendBienvenidaPortal({
      to:       cliente.correo,
      nombre:   cliente.nombre,
      email:    cliente.correo,
      password: tempPassword,
      baseUrl,
    }).catch(err => console.error('[Email] Error bienvenida portal:', err.message))

    res.json({ message: 'Cuenta creada exitosamente', correo: cliente.correo })
  } catch (error) {
    console.error('Error al crear cuenta de cliente:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// DELETE /api/clientes/:id
export const deleteCliente = async (req, res) => {
  try {
    const cliente = await Client.findByPk(req.params.id)
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' })

    // Si el cliente tiene un usuario vinculado, eliminarlo también
    if (cliente.id_usuario) {
      await User.destroy({ where: { id_usuario: cliente.id_usuario } })
    }

    await cliente.destroy()
    res.json({ message: 'Cliente eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar cliente:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// PATCH /api/clientes/:id/completar-asesoria
export const completarAsesoria = async (req, res) => {
  try {
    const cliente = await Client.findByPk(req.params.id)
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' })

    if (cliente.id_usuario) {
      await User.update({ activo: false }, { where: { id_usuario: cliente.id_usuario } })
    }

    res.json({ message: 'Asesoría marcada como completada' })
  } catch (error) {
    console.error('Error al completar asesoría:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}