import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../context/NotificationsContext'
import NotificationPanel from './NotificationPanel'

export default function NotificationBell() {
  const { unreadCount, markAllRead } = useNotifications()
  const [open, setOpen]           = useState(false)
  const [panelPos, setPanelPos]   = useState({ top: 0, left: 0 })
  const btnRef    = useRef(null)
  const panelRef  = useRef(null)

  // Cerrar al click fuera (botón + panel)
  useEffect(() => {
    const handler = (e) => {
      const inBtn   = btnRef.current?.contains(e.target)
      const inPanel = panelRef.current?.contains(e.target)
      if (!inBtn && !inPanel) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      // Panel aparece a la DERECHA del sidebar, alineado en top con el botón
      setPanelPos({
        top:  Math.max(8, rect.top),
        left: rect.right + 12,
      })
      markAllRead()
    }
    setOpen(v => !v)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="Notificaciones"
        aria-label="Ver notificaciones"
        style={{
          position: 'relative',
          background: open ? 'rgba(201,168,76,0.1)' : 'transparent',
          border: open ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
          cursor: 'pointer',
          padding: '5px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: open ? '#C9A84C' : 'rgba(255,255,255,0.55)',
          transition: 'color 0.2s, background 0.2s, border-color 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.color      = 'rgba(255,255,255,0.9)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.color      = 'rgba(255,255,255,0.55)'
            e.currentTarget.style.background = 'transparent'
          }
        }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 1, right: 1,
            minWidth: 15, height: 15,
            borderRadius: '50%',
            background: '#EF4444',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            border: '1.5px solid #020818',
            padding: '0 2px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel renderizado en el body (portal) para evitar recortes del sidebar */}
      {open && createPortal(
        <div ref={panelRef} style={{ position: 'fixed', top: panelPos.top, left: panelPos.left, zIndex: 9999 }}>
          <NotificationPanel onClose={() => setOpen(false)} />
        </div>,
        document.body
      )}
    </>
  )
}
