import Appointment from '../models/Appointment.js'
import { Op }      from 'sequelize'

export const getCitas = async (req, res) => {
  try {
    const { fecha, estado, page = 1, limit = 50 } = req.query
    const offset = (page - 1) * limit
    const where  = {}
    if (fecha)  where.fecha  = fecha
    if (estado) where.estado = estado
    const { count, rows } = await Appointment.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      order: [['fecha', 'ASC'], ['hora', 'ASC']],
    })
    res.json({ citas: rows, total: count })
  } catch (error) {
    console.error('Error al obtener citas:', error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export const getCitaById = async (req, res) => {
  try {
    const cita = await Appointment.findByPk(req.params.id)
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' })
    res.json(cita)
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export const createCita = async (req, res) => {
  try {
    const { id_cliente, id_caso, id_abogado, fecha, hora, motivo, estado, notas } = req.body
    if (!fecha || !hora || !motivo) {
      return res.status(400).json({ message: 'Fecha, hora y motivo son requeridos' })
    }
    const cita = await Appointment.create({
      id_cliente, id_caso, id_abogado,
      fecha, hora, motivo,
      estado: estado || 'pendiente',
      notas,
    })
    res.status(201).json({ message: 'Cita creada exitosamente', cita })
  } catch (error) {
    console.error('Error al crear cita:', error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export const updateCita = async (req, res) => {
  try {
    const cita = await Appointment.findByPk(req.params.id)
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' })
    const { id_cliente, id_caso, id_abogado, fecha, hora, motivo, estado, notas } = req.body
    await cita.update({ id_cliente, id_caso, id_abogado, fecha, hora, motivo, estado, notas })
    res.json({ message: 'Cita actualizada exitosamente', cita })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export const updateEstadoCita = async (req, res) => {
  try {
    const cita = await Appointment.findByPk(req.params.id)
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' })
    const { estado } = req.body
    if (!['pendiente', 'confirmada', 'cancelada'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' })
    }
    await cita.update({ estado })
    res.json({ message: 'Estado actualizado', cita })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export const deleteCita = async (req, res) => {
  try {
    const cita = await Appointment.findByPk(req.params.id)
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' })
    await cita.destroy()
    res.json({ message: 'Cita eliminada exitosamente' })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}