import Client      from '../models/Client.js'
import Case        from '../models/Case.js'
import Document    from '../models/Document.js'
import Appointment from '../models/Appointment.js'

// Resuelve el id_cliente a partir del id_usuario del JWT.
async function clienteIdFromUser(userId) {
  const cliente = await Client.findOne({
    where:      { id_usuario: userId },
    attributes: ['id_cliente'],
  })
  return cliente?.id_cliente ?? null
}

// Verificadores de pertenencia por tipo de recurso.
const checkers = {
  case: async (resourceId, clienteId) => {
    const caso = await Case.findByPk(resourceId, { attributes: ['id_cliente'] })
    return !!caso && caso.id_cliente === clienteId
  },
  document: async (resourceId, clienteId) => {
    const doc = await Document.findByPk(resourceId, { attributes: ['id_caso'] })
    if (!doc) return false
    const caso = await Case.findByPk(doc.id_caso, { attributes: ['id_cliente'] })
    return !!caso && caso.id_cliente === clienteId
  },
  appointment: async (resourceId, clienteId) => {
    const cita = await Appointment.findByPk(resourceId, { attributes: ['id_cliente'] })
    return !!cita && cita.id_cliente === clienteId
  },
}

// Middleware: garantiza que un cliente solo acceda a recursos propios.
// Devuelve 404 (no 403) ante recurso ajeno para evitar enumeración de IDs.
export const requireOwnership = (resourceType) => async (req, res, next) => {
  try {
    const { rol, id: userId } = req.user

    // Bypass staff. TODO multi-tenant: validar recurso.despacho_id === req.user.despachoId
    if (rol === 'abogado' || rol === 'secretario') return next()

    if (rol !== 'cliente') {
      return res.status(403).json({ message: 'Rol no autorizado' })
    }

    const check = checkers[resourceType]
    if (!check) {
      console.error(`requireOwnership: tipo de recurso desconocido "${resourceType}"`)
      return res.status(500).json({ message: 'Error de configuración' })
    }

    const clienteId = await clienteIdFromUser(userId)
    if (clienteId === null) {
      return res.status(404).json({ message: 'Recurso no encontrado' })
    }

    const owns = await check(req.params.id, clienteId)
    if (!owns) {
      return res.status(404).json({ message: 'Recurso no encontrado' })
    }

    next()
  } catch (error) {
    console.error('requireOwnership error:', error.message)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}
