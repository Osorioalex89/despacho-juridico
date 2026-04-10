import Case        from '../models/Case.js'
import { Op }      from 'sequelize'
import sequelize   from '../config/database.js'
import Comment     from '../models/Comment.js'
import Client      from '../models/Client.js'
import User        from '../models/User.js'
import Movimiento  from '../models/Movimiento.js'
import { notifyNewCaseComment, notifyMovimientoProcesal, notifyNuevoCasoAsignado } from '../services/emailService.js'

// GET /api/casos
export const getCasos = async (req, res) => {
  try {
    const { search = '', tipo = '', estado = '', page = 1, limit = 10 } = req.query
    const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100)
    const offset = (parseInt(page) - 1) * safeLimit

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
      limit:  safeLimit,
      offset,
      order:  [['fecha_apertura', 'DESC']],
    })

    res.json({
      casos:        rows,
      total:        count,
      pagina:       parseInt(page),
      totalPaginas: Math.ceil(count / limit),
    })
  } catch (error) {
    console.error('Error al obtener casos:', error.message)
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
    console.error('Error al obtener caso:', error.message)
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

    // Generar folio único con transacción para evitar duplicados bajo concurrencia
    const caso = await sequelize.transaction(async (t) => {
      const total = await Case.count({ transaction: t, lock: t.LOCK.UPDATE })
      const folio = `EXP-${new Date().getFullYear()}-${String(total + 1).padStart(4, '0')}`
      return Case.create({
        folio, asunto, tipo, estado: estado || 'activo', descripcion,
        id_cliente, id_abogado, juzgado, exp_externo, contraparte,
        fecha_apertura, fecha_limite, notas,
      }, { transaction: t })
    })

    res.status(201).json({ message: 'Caso creado exitosamente', caso })

    // Notificar al cliente — fire-and-forget
    if (caso.id_cliente) {
      Client.findByPk(caso.id_cliente).then(cliente => {
        if (cliente?.correo) {
          notifyNuevoCasoAsignado({
            toCliente:    cliente.correo,
            nombreCliente: cliente.nombre,
            folio:        caso.folio,
            asunto:       caso.asunto,
            tipo:         caso.tipo,
            fechaApertura: caso.fecha_apertura,
            baseUrl:      process.env.APP_URL || 'http://localhost:5173',
            idCaso:       caso.id_caso,
          }).catch(err => console.error('Error notificando caso asignado:', err.message))
        }
      }).catch(() => {})
    }
  } catch (error) {
    console.error('Error al crear caso:', error.message)
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

    // Notificar al cliente si se (re)asign&#243; — fire-and-forget
    if (caso.id_cliente) {
      Client.findByPk(caso.id_cliente).then(cliente => {
        if (cliente?.correo) {
          notifyNuevoCasoAsignado({
            toCliente:    cliente.correo,
            nombreCliente: cliente.nombre,
            folio:        caso.folio,
            asunto:       caso.asunto,
            tipo:         caso.tipo,
            fechaApertura: caso.fecha_apertura,
            baseUrl:      process.env.APP_URL || 'http://localhost:5173',
            idCaso:       caso.id_caso,
          }).catch(err => console.error('Error notificando caso actualizado:', err.message))
        }
      }).catch(() => {})
    }
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// POST /api/casos/:id/comentarios
export const addComentario = async (req, res) => {
  try {
    const caso = await Case.findByPk(req.params.id)
    if (!caso) return res.status(404).json({ message: 'Caso no encontrado' })

    const { contenido } = req.body
    if (!contenido?.trim()) {
      return res.status(400).json({ message: 'El contenido del comentario es requerido' })
    }

    const comentario = await Comment.create({
      id_caso:    caso.id_caso,
      id_usuario: req.user.id,
      contenido:  contenido.trim(),
    })

    res.status(201).json({ message: 'Comentario agregado', comentario })

    // Notificar a cliente y (si corresponde) al abogado — fire-and-forget
    Promise.all([
      caso.id_cliente ? Client.findByPk(caso.id_cliente) : null,
      caso.id_abogado ? User.findByPk(caso.id_abogado)   : null,
      User.findByPk(req.user.id),
    ]).then(([clienteData, abogadoData, autorData]) => {
      const recipients = []
      if (clienteData?.correo) recipients.push({ email: clienteData.correo, nombre: clienteData.nombre })
      if (abogadoData?.correo && abogadoData.id_usuario !== req.user.id) {
        recipients.push({ email: abogadoData.correo, nombre: abogadoData.nombre })
      }
      if (recipients.length > 0) {
        return notifyNewCaseComment({
          recipients,
          autorNombre:    autorData?.nombre || 'Sistema',
          folio:          caso.folio,
          asunto:         caso.asunto,
          comentarioPrev: contenido.trim(),
          baseUrl:        process.env.APP_URL || 'http://localhost:5173',
          idCaso:         caso.id_caso,
        })
      }
    }).catch(err => console.error('Error notificando comentario:', err.message))
  } catch (error) {
    console.error('Error al agregar comentario:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// GET /api/casos/:id/timeline
export const getCasoTimeline = async (req, res) => {
  try {
    const { id } = req.params
    const caso = await Case.findByPk(id)
    if (!caso) return res.status(404).json({ message: 'Caso no encontrado' })

    const [Document, Appointment] = await Promise.all([
      import('../models/Document.js').then(m => m.default),
      import('../models/Appointment.js').then(m => m.default),
    ])

    const [documentos, citas, comentarios, movimientos] = await Promise.all([
      Document.findAll({ where: { id_caso: id }, order: [['createdAt', 'ASC']] }),
      Appointment.findAll({ where: { id_caso: id }, order: [['fecha', 'ASC']] }),
      Comment.findAll({ where: { id_caso: id }, order: [['createdAt', 'ASC']] }),
      Movimiento.findAll({ where: { id_caso: id }, order: [['fecha_movimiento', 'ASC']] }),
    ])

    const events = []

    // Apertura del caso
    events.push({
      tipo: 'apertura',
      fecha: caso.fecha_apertura,
      descripcion: `Caso abierto — ${caso.asunto}`,
      icono: 'Scale',
      color: '#C9A84C',
    })

    documentos.forEach(doc => {
      events.push({
        tipo: 'documento',
        fecha: doc.createdAt,
        descripcion: doc.nombre_original || doc.nombre,
        icono: 'FileText',
        color: '#93BBFC',
      })
    })

    citas.forEach(cita => {
      events.push({
        tipo: 'cita',
        fecha: cita.fecha,
        descripcion: cita.motivo,
        icono: 'CalendarDays',
        color: '#86EFAC',
        meta: { hora: cita.hora, estado: cita.estado },
      })
    })

    comentarios.forEach(com => {
      events.push({
        tipo: 'comentario',
        fecha: com.createdAt,
        descripcion: com.contenido,
        icono: 'MessageSquare',
        color: '#C4B5FD',
      })
    })

    const MOVIMIENTO_ICONO = {
      auto:      'Gavel',
      sentencia: 'Scale',
      audiencia: 'Users',
      oficio:    'FileSignature',
      otro:      'Bell',
    }
    movimientos.forEach(mov => {
      events.push({
        tipo: 'movimiento',
        fecha: mov.fecha_movimiento,
        descripcion: mov.descripcion,
        icono: MOVIMIENTO_ICONO[mov.tipo] || 'Bell',
        color: '#FB923C',
        meta: { tipoMovimiento: mov.tipo },
      })
    })

    events.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

    res.json({ timeline: events })
  } catch (error) {
    console.error('Error al obtener timeline:', error.message)
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

// GET /api/casos/:id/movimientos — abogado/secretario/cliente
export const getMovimientos = async (req, res) => {
  try {
    const caso = await Case.findByPk(req.params.id)
    if (!caso) return res.status(404).json({ message: 'Caso no encontrado' })

    // Si es cliente, verificar que el caso le pertenece
    if (req.user.rol === 'cliente') {
      const cliente = await Client.findOne({ where: { id_usuario: req.user.id } })
      if (!cliente || caso.id_cliente !== cliente.id_cliente) {
        return res.status(403).json({ message: 'Acceso denegado' })
      }
    }

    const movimientos = await Movimiento.findAll({
      where: { id_caso: req.params.id },
      order: [['fecha_movimiento', 'DESC']],
    })
    res.json({ movimientos })
  } catch (error) {
    console.error('Error al obtener movimientos:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// POST /api/casos/:id/movimientos — abogado/secretario
export const addMovimiento = async (req, res) => {
  try {
    const caso = await Case.findByPk(req.params.id)
    if (!caso) return res.status(404).json({ message: 'Caso no encontrado' })

    const { tipo, descripcion, fecha_movimiento } = req.body
    if (!tipo || !descripcion?.trim() || !fecha_movimiento) {
      return res.status(400).json({ message: 'Tipo, descripción y fecha son requeridos' })
    }

    const TIPOS_VALIDOS = ['auto', 'sentencia', 'audiencia', 'oficio', 'otro']
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ message: 'Tipo de movimiento no válido' })
    }

    const movimiento = await Movimiento.create({
      id_caso:          caso.id_caso,
      tipo,
      descripcion:      descripcion.trim(),
      fecha_movimiento,
    })

    // Notificar al cliente — fire-and-forget
    if (caso.id_cliente) {
      Client.findByPk(caso.id_cliente).then(cliente => {
        if (cliente?.correo) {
          notifyMovimientoProcesal({
            toCliente:       cliente.correo,
            nombreCliente:   cliente.nombre,
            folio:           caso.folio,
            asunto:          caso.asunto,
            tipo,
            descripcion:     descripcion.trim(),
            fechaMovimiento: fecha_movimiento,
          }).catch(err => console.error('Error notificando movimiento:', err.message))
        }
      }).catch(() => {})
    }

    res.status(201).json({ message: 'Movimiento registrado', movimiento })
  } catch (error) {
    console.error('Error al registrar movimiento:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// POST /api/casos/:id/chat — abogado/secretario/cliente
export const chatCaso = async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(501).json({ message: 'IA no configurada' })
  }
  try {
    const { id }       = req.params
    const { pregunta, historial = [] } = req.body

    if (!pregunta?.trim()) return res.status(400).json({ message: 'La pregunta es requerida' })

    const caso = await Case.findByPk(id)
    if (!caso)  return res.status(404).json({ message: 'Caso no encontrado' })

    // Verificar acceso cliente
    if (req.user.rol === 'cliente') {
      const cliente = await Client.findOne({ where: { id_usuario: req.user.id } })
      if (!cliente || caso.id_cliente !== cliente.id_cliente) {
        return res.status(403).json({ message: 'Sin acceso a este caso' })
      }
    }

    const Document = (await import('../models/Document.js')).default
    const [movimientos, documentos] = await Promise.all([
      Movimiento.findAll({ where: { id_caso: id }, order: [['fecha_movimiento','DESC']], limit: 10 }),
      Document.findAll({ where: { id_caso: id }, limit: 20 }),
    ])

    const { chatConCaso } = await import('../services/aiService.js')
    const respuesta = await chatConCaso({ caso, movimientos, documentos, historial, pregunta: pregunta.trim() })

    res.json({ respuesta })
  } catch (err) {
    console.error('chatCaso error:', err.message)
    res.status(500).json({ message: 'Error al procesar la consulta IA' })
  }
}