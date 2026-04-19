import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../context/NotificationsContext'
import NotificationPanel from './NotificationPanel'

export default function NotificationBell() {
  const { unreadCount, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Cerrar al hacer click fuera del componente
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleToggle = () => {
    if (!open) markAllRead()
    setOpen(v => !v)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        title="Notificaciones"
        aria-label="Ver notificaciones"
        style={{
          position: 'relative',
          background: open ? 'rgba(201,168,76,0.1)' : 'none',
          border: open ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
          cursor: 'pointer',
          padding: 6,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: open ? '#C9A84C' : 'rgba(255,255,255,0.6)',
          transition: 'color 0.2s, background 0.2s, border-color 0.2s',
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
            e.currentTarget.style.background = 'none'
          }
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            minWidth: 17,
            height: 17,
            borderRadius: '50%',
            background: '#EF4444',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            border: '2px solid #020818',
            padding: '0 2px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  )
}
