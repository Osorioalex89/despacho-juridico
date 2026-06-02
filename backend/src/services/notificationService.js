// Gestiona conexiones SSE y envío de eventos en tiempo real
const connections = new Map() // userId(string) → { res, role }

export function registerConnection(userId, role, res) {
  connections.set(String(userId), { res, role })
}

export function removeConnection(userId) {
  connections.delete(String(userId))
}

// Envía a un array de userIds
export function notifyUsers(userIds, event) {
  const payload = `data: ${JSON.stringify({ ...event, id: Date.now(), timestamp: new Date().toISOString() })}\n\n`
  for (const uid of userIds) {
    const conn = connections.get(String(uid))
    if (conn) {
      try { conn.res.write(payload) } catch {}
    }
  }
}

// Envía a clientes identificados por id_cliente (PK de la tabla clientes).
// Traduce id_cliente → id_usuario porque las conexiones SSE se indexan por id_usuario.
export async function notifyClientes(clienteIds, event) {
  const ids = clienteIds.filter(Boolean)
  if (ids.length === 0) return
  const { Op }       = await import('sequelize')
  const Client       = (await import('../models/Client.js')).default
  const clientes     = await Client.findAll({
    where:      { id_cliente: { [Op.in]: ids } },
    attributes: ['id_usuario'],
  })
  const userIds = clientes.map(c => c.id_usuario).filter(Boolean)
  notifyUsers(userIds, event)
}

// Envía a todos los abogados y secretarios conectados
export function notifyAdmins(event) {
  const payload = `data: ${JSON.stringify({ ...event, id: Date.now(), timestamp: new Date().toISOString() })}\n\n`
  for (const [, conn] of connections.entries()) {
    if (conn.role === 'abogado' || conn.role === 'secretario') {
      try { conn.res.write(payload) } catch {}
    }
  }
}
