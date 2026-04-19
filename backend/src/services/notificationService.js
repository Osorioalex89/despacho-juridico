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

// Envía a todos los abogados y secretarios conectados
export function notifyAdmins(event) {
  const payload = `data: ${JSON.stringify({ ...event, id: Date.now(), timestamp: new Date().toISOString() })}\n\n`
  for (const [, conn] of connections.entries()) {
    if (conn.role === 'abogado' || conn.role === 'secretario') {
      try { conn.res.write(payload) } catch {}
    }
  }
}
