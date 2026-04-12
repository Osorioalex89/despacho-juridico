import { Router }                   from 'express'
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js'
import { upload }                   from '../config/multer.js'
import {
  getDocumentos, uploadDocumento,
  deleteDocumento, descargarDocumento, reanalizar, toggleBloqueo
} from '../controllers/documents.controller.js'
import Document   from '../models/Document.js'
import cloudinary from '../config/cloudinary.js'
const router = Router()
router.use(verifyToken)

router.get('/',                requireRole('abogado', 'secretario'), getDocumentos)
router.post('/',   upload.single('archivo'), requireRole('abogado', 'secretario'), uploadDocumento)
router.post('/:id/analizar',      requireRole('abogado', 'secretario'), reanalizar)
router.get('/:id/descargar',      requireRole('abogado', 'secretario'), descargarDocumento)
router.patch('/:id/toggle-bloqueo', requireRole('abogado', 'secretario'), toggleBloqueo)
router.delete('/:id',             requireRole('abogado'),               deleteDocumento)
// Cliente ve documentos generales de sus casos
router.get('/mis-documentos', requireRole('cliente'), async (req, res) => {
  try {
    const Client   = (await import('../models/Client.js')).default
    const cliente  = await Client.findOne({ where: { id_usuario: req.user.id } })
    if (!cliente)  return res.json({ documentos: [] })

    const { id_caso } = req.query

    const where = {
      categoria: 'general',
    }

    if (id_caso) {
      where.id_caso = id_caso
    } else {
      // Busca todos los casos del cliente
      const Case  = (await import('../models/Case.js')).default
      const casos = await Case.findAll({
        where:      { id_cliente: cliente.id_cliente },
        attributes: ['id_caso'],
      })
      const { Op } = await import('sequelize')
      where.id_caso = { [Op.in]: casos.map(c => c.id_caso) }
    }

    const docs = await Document.findAll({
      where,
      order: [['createdAt', 'DESC']],
    })

    res.json({ documentos: docs })
  } catch (error) {
    console.error('Error al obtener mis-documentos:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

// Cliente descarga su propio documento
router.get('/mis-documentos/:id/descargar', requireRole('cliente'), async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id)
    if (!doc || doc.categoria === 'confidencial') {
      return res.status(403).json({ message: 'Acceso denegado' })
    }
    if (doc.bloqueado) {
      return res.status(403).json({ message: 'Este documento aún no está disponible para descarga' })
    }
    const url      = cloudinary.url(doc.nombre, { resource_type: 'raw', secure: true })
    const response = await fetch(url)
    if (!response.ok) {
      return res.status(404).json({ message: 'Archivo no encontrado' })
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.nombre_original)}"`)
    res.setHeader('Content-Type', doc.tipo || 'application/octet-stream')
    res.end(buffer)
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

// Cliente hace preview de su propio documento (inline en el navegador)
router.get('/mis-documentos/:id/preview', requireRole('cliente'), async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id)
    if (!doc) {
      return res.status(404).json({ message: 'Documento no encontrado' })
    }
    if (doc.categoria === 'confidencial') {
      return res.status(403).json({ message: 'Acceso denegado' })
    }
    if (doc.bloqueado) {
      return res.status(403).json({ bloqueado: true, message: 'Documento pendiente de revisión por el abogado' })
    }
    const url      = cloudinary.url(doc.nombre, { resource_type: 'raw', secure: true })
    const response = await fetch(url)
    if (!response.ok) {
      return res.status(404).json({ message: 'Archivo no encontrado' })
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    res.setHeader('Content-Type', doc.tipo)
    res.setHeader('Content-Disposition', `inline; filename="${doc.nombre_original}"`)
    res.end(buffer)
  } catch (error) {
    console.error('Error en preview de documento:', error.message)
    res.status(500).json({ message: 'Error interno' })
  }
})

export default router