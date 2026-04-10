import User from '../models/User.js'
import { Op } from 'sequelize'

// GET /api/usuarios — todos los usuarios
export const getUsuarios = async (req, res) => {
  try {
    const { rol, estado, search = '' } = req.query
    const where = {}
    if (rol)    where.rol    = rol
    if (estado) where.estado = estado
    if (search) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { correo: { [Op.like]: `%${search}%` } },
      ]
    }
    const usuarios = await User.findAll({
      where,
      attributes: { exclude: ['contrasena'] },
      order: [['createdAt', 'DESC']],
    })
    res.json({ usuarios })
  } catch (error) {
    console.error('Error al obtener usuarios:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// PATCH /api/usuarios/:id/estado — aprobar o rechazar
export const updateEstadoUsuario = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id)
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })

    const { estado, rol } = req.body
    if (!['aprobado', 'rechazado', 'pendiente'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' })
    }

    const rolFinal = estado === 'aprobado' ? (rol || 'cliente') : usuario.rol

    await usuario.update({ estado, rol: rolFinal })

    // Si se aprueba como cliente, crear registro en tabla clientes automáticamente
    if (estado === 'aprobado' && rolFinal === 'cliente') {
      const Client = (await import('../models/Client.js')).default

      // Verificar que no exista ya
      const existe = await Client.findOne({ where: { id_usuario: usuario.id_usuario } })

      if (!existe) {
        await Client.create({
          id_usuario: usuario.id_usuario,
          nombre:     usuario.nombre,
          correo:     usuario.correo,
          telefono:   '',
          direccion:  '',
        })
      }
    }

    res.json({ message: `Usuario ${estado} correctamente`, usuario })
  } catch (error) {
    console.error('Error al actualizar estado de usuario:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// DELETE /api/usuarios/:id
export const deleteUsuario = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id)
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })

    // Eliminar también el registro de clientes vinculado (si existe)
    const Client = (await import('../models/Client.js')).default
    await Client.destroy({ where: { id_usuario: usuario.id_usuario } })

    await usuario.destroy()
    res.json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar usuario:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}