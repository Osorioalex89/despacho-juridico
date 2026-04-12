import Document            from '../models/Document.js'
import fs                  from 'fs'
import path                from 'path'
import { analizarDocumento } from '../services/aiService.js'
import Case                from '../models/Case.js'
import Client              from '../models/Client.js'
import { notifyDocumentoAdjunto } from '../services/emailService.js'

// GET /api/documentos?id_caso=X
export const getDocumentos = async (req, res) => {
  try {
    const { id_caso } = req.query
    if (!id_caso) return res.status(400).json({ message: 'id_caso requerido' })

    const docs = await Document.findAll({
      where: { id_caso },
      order: [['createdAt', 'DESC']],
    })
    res.json({ documentos: docs })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// POST /api/documentos — subir archivo
export const uploadDocumento = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo' })

    const { id_caso, categoria, descripcion } = req.body
    if (!id_caso) return res.status(400).json({ message: 'id_caso requerido' })

    const doc = await Document.create({
      id_caso,
      id_usuario:      req.user.id,
      nombre:          req.file.filename,
      nombre_original: req.file.originalname,
      tipo:            req.file.mimetype,
      tamanio:         req.file.size,
      categoria:       categoria || 'general',
      descripcion:     descripcion || '',
    })

    res.status(201).json({ message: 'Documento subido correctamente', documento: doc })

    // Análisis IA — fire-and-forget (no bloquea la respuesta)
    if (process.env.ANTHROPIC_API_KEY) {
      const rutaArchivo = path.join('./uploads', req.file.filename)
      analizarDocumento({
        rutaArchivo,
        nombreArchivo: req.file.originalname,
        tipoArchivo:   req.file.mimetype,
      })
        .then(resultado => doc.update({ analisis: JSON.stringify(resultado) }))
        .catch(err => console.error('[IA] Error analizando documento:', err.message))
    }

    // Notificar al cliente — fire-and-forget
    Case.findByPk(id_caso).then(caso => {
      if (caso?.id_cliente) {
        Client.findByPk(caso.id_cliente).then(cliente => {
          if (cliente?.correo) {
            notifyDocumentoAdjunto({
              toCliente:    cliente.correo,
              nombreCliente: cliente.nombre,
              nombreArchivo: req.file.originalname,
              categoria:    categoria || 'general',
              folio:        caso.folio,
              asunto:       caso.asunto,
              baseUrl:      process.env.APP_URL || 'http://localhost:5173',
              idCaso:       caso.id_caso,
            }).catch(err => console.error('Error notificando documento:', err.message))
          }
        }).catch(() => {})
      }
    }).catch(() => {})
  } catch (error) {
    console.error('Error al subir documento:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// DELETE /api/documentos/:id
export const deleteDocumento = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Documento no encontrado' })

    // Eliminar archivo físico
    const filePath = path.join('./uploads', doc.nombre)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    await doc.destroy()
    res.json({ message: 'Documento eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// POST /api/documentos/:id/analizar — dispara análisis IA de forma síncrona
export const reanalizar = async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ message: 'Análisis IA no disponible' })
    }

    const doc = await Document.findByPk(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Documento no encontrado' })

    const rutaArchivo = path.join('./uploads', doc.nombre)
    if (!fs.existsSync(rutaArchivo)) {
      return res.status(404).json({ message: 'Archivo no encontrado en el servidor' })
    }

    const resultado = await analizarDocumento({
      rutaArchivo,
      nombreArchivo: doc.nombre_original,
      tipoArchivo:   doc.tipo,
    })

    await doc.update({ analisis: JSON.stringify(resultado) })
    await doc.reload()

    res.json({ documento: doc })
  } catch (error) {
    console.error('[IA] Error en reanalizar:', error.message)
    res.status(500).json({ message: 'Error al analizar el documento' })
  }
}

// GET /api/documentos/:id/descargar
export const descargarDocumento = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Documento no encontrado' })

    const filePath = path.resolve('./uploads', doc.nombre)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado en el servidor' })
    }

    res.download(filePath, doc.nombre_original)
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// PATCH /api/documentos/:id/toggle-bloqueo — abogado/secretario
export const toggleBloqueo = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Documento no encontrado' })

    await doc.update({ bloqueado: !doc.bloqueado })
    res.json({ documento: doc })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}