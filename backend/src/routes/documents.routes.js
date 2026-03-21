import { Router }                   from 'express'
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js'
import { upload }                   from '../config/multer.js'
import {
  getDocumentos, uploadDocumento,
  deleteDocumento, descargarDocumento
} from '../controllers/documents.controller.js'
import Document from '../models/Document.js'
import fs       from 'fs'
import path     from 'path'
const router = Router()
router.use(verifyToken)

router.get('/',                requireRole('abogado', 'secretario'), getDocumentos)
router.post('/',   upload.single('archivo'), requireRole('abogado', 'secretario'), uploadDocumento)
router.get('/:id/descargar',   requireRole('abogado', 'secretario'), descargarDocumento)
router.delete('/:id',          requireRole('abogado'),               deleteDocumento)
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
    console.error(error)
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
    const filePath = path.join('./uploads', doc.nombre)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado' })
    }
    res.download(filePath, doc.nombre_original)
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})
export default router