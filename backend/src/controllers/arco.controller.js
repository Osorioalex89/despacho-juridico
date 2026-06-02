// F6.2 — Derechos ARCO (LFPDPPP).
//   Acceso     → GET  /api/yo/exportar-datos      (cliente autenticado)
//   Cancelación → POST /api/yo/solicitar-cancelacion (cliente autenticado)
//   (Admin)     → POST /api/yo/anonimizar/:id     (abogado materializa la cancelación)
//
// La rectificación se cubre con los endpoints CRUD existentes (PATCH /clientes/:id desde el portal).
// La oposición se gestiona manualmente vía cancelación.
import { Op } from 'sequelize'
import User        from '../models/User.js'
import Client      from '../models/Client.js'
import Case        from '../models/Case.js'
import Document    from '../models/Document.js'
import Appointment from '../models/Appointment.js'
import Comment     from '../models/Comment.js'
import Movimiento  from '../models/Movimiento.js'
import ChatMensaje from '../models/ChatMensaje.js'
import { logAction, ACTIONS } from '../services/auditLogger.js'

// GET /api/yo/exportar-datos
// Devuelve TODOS los datos personales y derivados del cliente en JSON.
// El plan original menciona ZIP con PDFs; por ahora entregamos JSON estructurado
// con links firmados a los PDFs (Cloudinary signedUrl ya implementado en F3.2).
export const exportarDatos = async (req, res) => {
  try {
    const userId  = req.user.id
    const usuario = await User.findByPk(userId, {
      attributes: { exclude: ['contrasena', 'otp_code', 'otp_expires', 'otp_intentos', 'verification_token', 'reset_token', 'reset_token_expires'] },
    })
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })

    const cliente = await Client.findOne({ where: { id_usuario: userId } })
    let casos = [], documentos = [], citas = [], comentarios = [], movimientos = [], chats = []

    if (cliente) {
      casos = await Case.findAll({ where: { id_cliente: cliente.id_cliente } })
      const caseIds = casos.map(c => c.id_caso)
      if (caseIds.length) {
        ;[documentos, citas, comentarios, movimientos, chats] = await Promise.all([
          Document.findAll({ where: { id_caso: { [Op.in]: caseIds } } }),
          Appointment.findAll({ where: { id_cliente: cliente.id_cliente } }),
          Comment.findAll({ where: { id_caso: { [Op.in]: caseIds } } }),
          Movimiento.findAll({ where: { id_caso: { [Op.in]: caseIds } } }),
          ChatMensaje.findAll({ where: { id_caso: { [Op.in]: caseIds }, id_usuario: userId } }),
        ])
      }
    }

    logAction(req, 'arco_acceso', { userId, metadata: { tipo: 'export_json' } })

    const payload = {
      generado_en: new Date().toISOString(),
      titular:     { usuario, cliente },
      casos,
      documentos: documentos.map(d => ({
        id:          d.id_documento,
        nombre:      d.nombre_original,
        categoria:   d.categoria,
        tipo:        d.tipo,
        tamanio:     d.tamanio,
        createdAt:   d.createdAt,
        // El binario se entrega aparte vía endpoint protegido del cliente.
        descargaUrl: `/api/documentos/mis-documentos/${d.id_documento}/descargar`,
      })),
      citas, comentarios, movimientos,
      chat_ia: chats,
      aviso_privacidad: {
        version:          usuario.aviso_version,
        aceptado_en:      usuario.aviso_aceptado_at,
      },
      nota: 'Este export refleja tus datos al momento de la generación. Para ejercer cancelación/oposición usa POST /api/yo/solicitar-cancelacion.',
    }

    res.setHeader('Content-Disposition', `attachment; filename="mis-datos-${userId}-${Date.now()}.json"`)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.send(JSON.stringify(payload, null, 2))
  } catch (err) {
    console.error('Error en exportarDatos:', err.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// POST /api/yo/solicitar-cancelacion
// Marca la solicitud y notifica a los admins; NO borra ni anonimiza nada todavía.
// LFPDPPP exige respuesta del responsable en ≤20 días hábiles.
export const solicitarCancelacion = async (req, res) => {
  try {
    const userId = req.user.id
    const usuario = await User.findByPk(userId)
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })

    if (usuario.anonimizado_at) {
      return res.status(400).json({ message: 'Tu cuenta ya fue anonimizada.' })
    }
    if (usuario.cancelacion_solicitada_at) {
      return res.json({
        message: 'Ya tienes una solicitud de cancelación en curso. Te responderemos en ≤20 días hábiles.',
        fecha:   usuario.cancelacion_solicitada_at,
      })
    }

    await usuario.update({ cancelacion_solicitada_at: new Date() })
    logAction(req, 'arco_cancelacion_solicitada', { userId, metadata: { motivo: req.body?.motivo || null } })

    // Notificar admins (fire-and-forget)
    import('../services/emailService.js').then(async (em) => {
      try {
        const admins = await User.findAll({ where: { rol: ['abogado', 'secretario'], activo: true }, attributes: ['correo'] })
        const tos    = admins.map(a => a.correo).filter(Boolean)
        if (tos.length && em.notifyAuditAlert) {
          await em.notifyAuditAlert({
            to:     tos,
            tipo:   'arco_cancelacion',
            titulo: `Solicitud de cancelación (ARCO) de ${usuario.correo}`,
            lineas: [
              `Usuario #${userId}: <b>${usuario.nombre}</b> (${usuario.correo})`,
              `LFPDPPP exige respuesta en ≤20 días hábiles.`,
              `Para materializar: POST /api/yo/anonimizar/${userId}.`,
            ],
          })
        }
      } catch (err) { console.error('[ARCO] error notificando admins:', err.message) }
    }).catch(() => {})

    res.json({ message: 'Solicitud registrada. Responderemos en un plazo máximo de 20 días hábiles.' })
  } catch (err) {
    console.error('Error en solicitarCancelacion:', err.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// POST /api/yo/anonimizar/:id   (solo abogado)
// Reemplaza la PII por marcadores, deja registros derivados intactos por
// integridad referencial e historial fiscal (SAT exige 5 años en casos cerrados).
export const anonimizarUsuario = async (req, res) => {
  try {
    const targetId = Number(req.params.id)
    if (!Number.isInteger(targetId)) return res.status(400).json({ message: 'ID inválido' })

    const usuario = await User.findByPk(targetId)
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
    if (usuario.anonimizado_at) {
      return res.status(400).json({ message: 'El usuario ya fue anonimizado.' })
    }

    const marca = `[REDACTADO_${targetId}]`
    const now   = new Date()

    // Anonimizar User
    await usuario.update({
      nombre:               marca,
      correo:               `redactado_${targetId}@anon.local`,
      contrasena:           '!ANONIMIZADO!',   // no se podrá login
      activo:               false,
      verification_token:   null,
      otp_code:             null,
      otp_expires:          null,
      reset_token:          null,
      reset_token_expires:  null,
      anonimizado_at:       now,
      cancelacion_solicitada_at: usuario.cancelacion_solicitada_at || now,
    })

    // Anonimizar Client (si existe) — los hooks de cifrado se ejecutan en update
    const cliente = await Client.findOne({ where: { id_usuario: targetId } })
    if (cliente) {
      await cliente.update({
        nombre:    marca,
        correo:    `redactado_${targetId}@anon.local`,
        telefono:  null,
        direccion: null,
        rfc:       null,
        notas:     null,
      })
    }

    logAction(req, 'arco_anonimizado', {
      resourceType: 'usuario',
      resourceId:   targetId,
      metadata:     { por: req.user.id, cliente_id: cliente?.id_cliente || null },
    })

    res.json({ message: `Usuario #${targetId} anonimizado correctamente.`, anonimizado_at: now })
  } catch (err) {
    console.error('Error en anonimizarUsuario:', err.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}
