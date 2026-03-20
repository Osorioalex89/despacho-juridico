import Case from '../models/Case.js'
import { Op } from 'sequelize'

// GET /api/casos
export const getCasos = async (req, res) => {
  try {
    const { search = '', tipo = '', estado = '', page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    const where = {}
    if (search) {
      where[Op.or] = [
        { folio:   { [Op.like]: `%${search}%` } },
        { asunto:  { [Op.like]: `%${search}%` } },
      ]
    }
    if (tipo)   where.tipo   = tipo
    if (estado) where.estado = estado

    const { count, rows } = await Case.findAndCountAll({
      where,
      limit:  parseInt(limit),
      offset: parseInt(offset),
      order:  [['fecha_apertura', 'DESC']],
    })

    res.json({
      casos:        rows,
      total:        count,
      pagina:       parseInt(page),
      totalPaginas: Math.ceil(count / limit),
    })
  } catch (error) {
    console.error('Error al obtener casos:', error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// GET /api/casos/:id
export const getCasoById = async (req, res) => {
  try {
    const caso = await Case.findByPk(req.params.id)
    if (!caso) return res.status(404).json({ message: 'Caso no encontrado' })

    // Buscar cliente vinculado
    let cliente = null
    if (caso.id_cliente) {
      const Client = (await import('../models/Client.js')).default
      cliente = await Client.findByPk(caso.id_cliente)
    }

    // Buscar citas vinculadas
    const Appointment = (await import('../models/Appointment.js')).default
    const citas = await Appointment.findAll({
      where: { id_caso: caso.id_caso },
      order: [['fecha', 'ASC']],
    })

    res.json({ caso, cliente, citas })
  } catch (error) {
    console.error('Error al obtener caso:', error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}


// POST /api/casos
export const createCaso = async (req, res) => {
  try {
    const {
      asunto, tipo, estado, descripcion, id_cliente, id_abogado,
      juzgado, exp_externo, contraparte, fecha_apertura, fecha_limite, notas
    } = req.body

    if (!asunto || !tipo || !fecha_apertura) {
      return res.status(400).json({ message: 'Asunto, tipo y fecha de apertura son requeridos' })
    }

    // Generar folio automático
    const total = await Case.count()
    const folio = `EXP-${new Date().getFullYear()}-${String(total + 1).padStart(3, '0')}`

    const caso = await Case.create({
      folio, asunto, tipo, estado: estado || 'activo', descripcion,
      id_cliente, id_abogado, juzgado, exp_externo, contraparte,
      fecha_apertura, fecha_limite, notas
    })

    res.status(201).json({ message: 'Caso creado exitosamente', caso })
  } catch (error) {
    console.error('Error al crear caso:', error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// PUT /api/casos/:id
export const updateCaso = async (req, res) => {
  try {
    const caso = await Case.findByPk(req.params.id)
    if (!caso) return res.status(404).json({ message: 'Caso no encontrado' })

    const {
      asunto, tipo, estado, descripcion, id_cliente, id_abogado,
      juzgado, exp_externo, contraparte, fecha_apertura, fecha_limite, notas
    } = req.body

    await caso.update({
      asunto, tipo, estado, descripcion, id_cliente, id_abogado,
      juzgado, exp_externo, contraparte, fecha_apertura, fecha_limite, notas
    })

    res.json({ message: 'Caso actualizado exitosamente', caso })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// DELETE /api/casos/:id
export const deleteCaso = async (req, res) => {
  try {
    const caso = await Case.findByPk(req.params.id)
    if (!caso) return res.status(404).json({ message: 'Caso no encontrado' })
    await caso.destroy()
    res.json({ message: 'Caso eliminado exitosamente' })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}