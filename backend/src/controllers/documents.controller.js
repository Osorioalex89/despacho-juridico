import Document            from '../models/Document.js'
import path                from 'path'
import cloudinary          from '../config/cloudinary.js'
import { analizarDocumento } from '../services/aiService.js'
import Case                from '../models/Case.js'
import Client              from '../models/Client.js'
import { notifyDocumentoAdjunto } from '../services/emailService.js'

// Sube un buffer a Cloudinary y retorna el public_id
const subirACloudinary = (buffer, publicId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: 'despacho-juridico', public_id: publicId },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    stream.end(buffer)
  })

// Genera la URL pública de un archivo almacenado en Cloudinary
const getCloudinaryUrl = (publicId) =>
  cloudinary.url(publicId, { resource_type: 'raw', secure: true })

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

    const publicId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const result   = await subirACloudinary(req.file.buffer, publicId)

    const doc = await Document.create({
      id_caso,
      id_usuario:      req.user.id,
      nombre:          result.public_id,   // public_id de Cloudinary
      nombre_original: req.file.originalname,
      tipo:            req.file.mimetype,
      tamanio:         req.file.size,
      categoria:       categoria || 'general',
      descripcion:     descripcion || '',
    })

    res.status(201).json({ message: 'Documento subido correctamente', documento: doc })

    // Análisis IA — fire-and-forget (buffer todavía disponible)
    if (process.env.ANTHROPIC_API_KEY) {
      analizarDocumento({
        buffer:        req.file.buffer,
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
              toCliente:     cliente.correo,
              nombreCliente: cliente.nombre,
              nombreArchivo: req.file.originalname,
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
      await cloudinary.uploader.destroy(doc.nombre, { resource_type: 'raw' })
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
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ message: 'Análisis IA no disponible' })
    }

    const doc = await Document.findByPk(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Documento no encontrado' })

    // Descargar buffer desde Cloudinary para analizarlo
    const url      = getCloudinaryUrl(doc.nombre)
    const response = await fetch(url)
    if (!response.ok) {
      return res.status(404).json({ message: 'Archivo no encontrado en Cloudinary' })
    }
    const buffer = Buffer.from(await response.arrayBuffer())

    const resultado = await analizarDocumento({
      buffer,
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

    const url      = getCloudinaryUrl(doc.nombre)
    const response = await fetch(url)
    if (!response.ok) {
      return res.status(404).json({ message: 'Archivo no encontrado en Cloudinary' })
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.nombre_original)}"`)
    res.setHeader('Content-Type', doc.tipo || 'application/octet-stream')
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

    await doc.update({ bloqueado: !doc.bloqueado })
    res.json({ documento: doc })
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}
