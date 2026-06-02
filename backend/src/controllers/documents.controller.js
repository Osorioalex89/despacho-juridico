import Document            from '../models/Document.js'
import { analizarDocumento } from '../services/aiService.js'
import Case                from '../models/Case.js'
import Client              from '../models/Client.js'
import { notifyDocumentoAdjunto } from '../services/emailService.js'
import { notifyClientes } from '../services/notificationService.js'
import {
  uploadDocument,
  fetchDocumentBuffer,
  destroyDocument,
} from '../services/cloudinary.service.js'
import { logAction, ACTIONS } from '../services/auditLogger.js'

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

    const nombreOriginal = Buffer.from(req.file.originalname, 'latin1').toString('utf8')
    const publicId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const result   = await uploadDocument(req.file.buffer, publicId)

    const doc = await Document.create({
      id_caso,
      id_usuario:      req.user.id,
      nombre:          result.public_id,   // public_id de Cloudinary
      nombre_original: nombreOriginal,
      tipo:            req.file.mimetype,
      tamanio:         req.file.size,
      categoria:       categoria || 'general',
      descripcion:     descripcion || '',
    })

    res.status(201).json({ message: 'Documento subido correctamente', documento: doc })

    // SSE: notificar al cliente del caso en tiempo real
    Case.findByPk(id_caso).then(caso => {
      if (caso?.id_cliente) {
        notifyClientes([caso.id_cliente], {
          tipo:   'documento:subido',
          titulo: 'Nuevo documento en tu caso',
          mensaje: nombreOriginal || doc.nombre,
          link:   '/cliente/mis-casos',
          icono:  'FileText',
          color:  '#93BBFC',
        })
      }
    }).catch(() => {})

    // Análisis IA — fire-and-forget (buffer todavía disponible)
    if (process.env.GROQ_API_KEY) {
      analizarDocumento({
        buffer:        req.file.buffer,
        nombreArchivo: nombreOriginal,
        tipoArchivo:   req.file.mimetype,
        uid:           `user:${req.user?.id || 'anon'}`,
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
              toCliente:     cliente.correo,
              nombreCliente: cliente.nombre,
              nombreArchivo: nombreOriginal,
              categoria:     categoria || 'general',
              folio:         caso.folio,
              asunto:        caso.asunto,
              baseUrl:       process.env.APP_URL || 'http://localhost:5173',
              idCaso:        caso.id_caso,
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

    // Eliminar de Cloudinary (tolerante a documentos viejos no migrados)
    try {
      await destroyDocument(doc.nombre)
    } catch (e) {
      console.warn('[Cloudinary] No se pudo eliminar el archivo:', doc.nombre, e.message)
    }

    await doc.destroy()
    res.json({ message: 'Documento eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// POST /api/documentos/:id/analizar — dispara análisis IA de forma síncrona
export const reanalizar = async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ message: 'Análisis IA no disponible' })
    }

    const doc = await Document.findByPk(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Documento no encontrado' })

    // Descargar buffer desde Cloudinary para analizarlo (URL firmada, expira 60s)
    let buffer
    try {
      buffer = await fetchDocumentBuffer(doc.nombre)
    } catch (e) {
      return res.status(e.statusCode || 404).json({ message: 'Archivo no encontrado en Cloudinary' })
    }

    const resultado = await analizarDocumento({
      buffer,
      nombreArchivo: doc.nombre_original,
      tipoArchivo:   doc.tipo,
      uid:           `user:${req.user?.id || 'anon'}`,
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

    let buffer
    try {
      buffer = await fetchDocumentBuffer(doc.nombre)
    } catch (e) {
      return res.status(e.statusCode || 404).json({ message: 'Archivo no encontrado en Cloudinary' })
    }
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.nombre_original)}"`)
    res.setHeader('Content-Type', doc.tipo || 'application/octet-stream')
    logAction(req, ACTIONS.DOC_DOWNLOAD, { resourceType: 'documento', resourceId: doc.id_documento, metadata: { id_caso: doc.id_caso, nombre: doc.nombre_original } })
    res.end(buffer)
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// PATCH /api/documentos/:id/toggle-bloqueo — abogado/secretario
export const toggleBloqueo = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Documento no encontrado' })

    const estabaBloqueado = doc.bloqueado
    await doc.update({ bloqueado: !doc.bloqueado })
    logAction(
      req,
      estabaBloqueado ? ACTIONS.DOC_UNLOCK : ACTIONS.DOC_LOCK,
      { resourceType: 'documento', resourceId: doc.id_documento, metadata: { id_caso: doc.id_caso } }
    )
    res.json({ documento: doc })

    // SSE: notificar al cliente si el documento se desbloqueó
    if (estabaBloqueado && doc.id_caso) {
      Case.findByPk(doc.id_caso).then(caso => {
        if (caso?.id_cliente) {
          notifyClientes([caso.id_cliente], {
            tipo:   'documento:desbloqueado',
            titulo: 'Documento disponible',
            mensaje: `${doc.nombre_original || doc.nombre} está disponible para descarga`,
            link:   '/cliente/mis-casos',
            icono:  'Unlock',
            color:  '#86EFAC',
          })
        }
      }).catch(() => {})
    }
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}
