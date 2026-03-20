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
    console.error(error)
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

    await usuario.update({
      estado,
      rol: estado === 'aprobado' ? (rol || 'cliente') : usuario.rol,
    })

    res.json({ message: `Usuario ${estado} correctamente`, usuario })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// DELETE /api/usuarios/:id
export const deleteUsuario = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id)
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
    await usuario.destroy()
    res.json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}