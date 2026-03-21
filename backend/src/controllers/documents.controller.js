import Document from '../models/Document.js'
import fs       from 'fs'
import path     from 'path'

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
  } catch (error) {
    console.error(error)
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

// GET /api/documentos/:id/descargar
export const descargarDocumento = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Documento no encontrado' })

    const filePath = path.join('./uploads', doc.nombre)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado en el servidor' })
    }

    res.download(filePath, doc.nombre_original)
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}