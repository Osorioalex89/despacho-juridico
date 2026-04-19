import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const eventSourceRef = useRef(null)
  const reconnectRef   = useRef(null)

  const connect = useCallback(() => {
    if (!token || !isAuthenticated) return
    if (eventSourceRef.current) eventSourceRef.current.close()

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const url = `${apiBase}/notificaciones/stream?token=${token}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onmessage = (e) => {
      if (!e.data || e.data.startsWith(':')) return  // heartbeat
      try {
        const notif = JSON.parse(e.data)
        setNotifications(prev => [notif, ...prev].slice(0, 50))  // máx 50
        setUnreadCount(prev => prev + 1)
      } catch (_) {
        // JSON inválido — ignorar
      }
    }

    es.onerror = () => {
      es.close()
      // Reconectar en 5 segundos
      reconnectRef.current = setTimeout(connect, 5000)
    }
  }, [token, isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      connect()
    } else {
      eventSourceRef.current?.close()
      clearTimeout(reconnectRef.current)
      setNotifications([])
      setUnreadCount(0)
    }
    return () => {
      eventSourceRef.current?.close()
      clearTimeout(reconnectRef.current)
    }
  }, [isAuthenticated, connect])

  const markAllRead = () => setUnreadCount(0)

  const removeNotification = (id) =>
    setNotifications(prev => prev.filter(n => n.id !== id))

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAllRead, removeNotification }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
