import { Bell, X, Check, MessageSquare, CalendarDays, FileText, Gavel, FolderOpen, Unlock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationsContext'

const ICON_MAP = {
  MessageSquare,
  CalendarDays,
  FileText,
  Gavel,
  FolderOpen,
  Unlock,
  Bell,
}

export default function NotificationPanel({ onClose }) {
  const { notifications, markAllRead, removeNotification } = useNotifications()
  const navigate = useNavigate()

  const handleClick = (notif) => {
    if (notif.link) navigate(notif.link)
    removeNotification(notif.id)
    onClose()
  }

  const handleMarkAll = () => {
    markAllRead()
    onClose()
  }

  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      right: 0,
      width: 340,
      maxHeight: 420,
      overflowY: 'auto',
      background: 'rgba(6,16,40,0.97)',
      border: '1px solid rgba(201,168,76,0.3)',
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 200,
      marginTop: 8,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(201,168,76,0.15)',
      }}>
        <span translate="no" style={{
          fontFamily: "'Inter', sans-serif",
          color: '#C9A84C',
          fontWeight: 600,
          fontSize: 14,
        }}>
          Notificaciones
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {notifications.length > 0 && (
            <button
              onClick={handleMarkAll}
              title="Marcar todas como leídas"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 4,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >
              <Check size={15} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Lista */}
      {notifications.length === 0 ? (
        <div style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.35)',
          fontSize: 13,
          fontFamily: "'Inter', sans-serif",
        }} translate="no">
          Sin notificaciones nuevas
        </div>
      ) : (
        <div>
          {notifications.map(notif => {
            const IconComp = ICON_MAP[notif.icono] || Bell
            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 16px',
                  cursor: notif.link ? 'pointer' : 'default',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  transition: 'background 0.15s',
                  background: 'transparent',
                }}
                onMouseEnter={e => { if (notif.link) e.currentTarget.style.background = 'rgba(201,168,76,0.07)' }}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Icono */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: `${notif.color || '#C9A84C'}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <IconComp size={16} color={notif.color || '#C9A84C'} />
                </div>

                {/* Contenido */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div translate="no" style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: 2,
                  }}>
                    {notif.titulo}
                  </div>
                  <div translate="no" style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {notif.mensaje}
                  </div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11,
                    color: 'rgba(201,168,76,0.6)',
                    marginTop: 4,
                  }}>
                    {new Date(notif.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Botón eliminar */}
                <button
                  onClick={e => { e.stopPropagation(); removeNotification(notif.id) }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.3)',
                    padding: 2,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 4,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(239,68,68,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                >
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
