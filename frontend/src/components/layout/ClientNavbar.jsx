import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Scale, Calendar, FolderOpen, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { label: 'Mis Citas',  path: '/cliente/mis-citas',     icon: Calendar   },
  { label: 'Mis Casos',  path: '/cliente/mis-casos',     icon: FolderOpen },
]

export default function ClientNavbar({ children }) {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const location         = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>

      <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Inter', sans-serif" }}>

        {/* Navbar */}
        <nav style={{
          background: '#1e3a5f',
          borderBottom: '2px solid #e8d48a',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          <div style={{
            maxWidth: '1200px', margin: '0 auto',
            padding: '0 24px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
          }}>

            {/* Logo + nombre */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px',
                background: 'linear-gradient(135deg, #e8d48a, #d4b86a)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Scale size={20} color="#1e3a5f" strokeWidth={2.5}/>
              </div>
              <div>
                <p style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '15px', fontWeight: '700',
                  color: '#ffffff', margin: 0, lineHeight: 1.2,
                }}>
                  Lic. Horacio Sánchez Cerino
                </p>
                <p style={{
                  fontSize: '10px', color: '#7a9abf',
                  margin: 0, letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}>
                  Portal del Cliente
                </p>
              </div>
            </div>

            {/* Nav links — desktop */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
            }} className="nav-desktop">
              {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
                const active = location.pathname === path
                return (
                  <button key={path}
                    onClick={() => navigate(path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 18px',
                      borderRadius: '10px', border: 'none',
                      background: active ? 'rgba(232,212,138,0.15)' : 'transparent',
                      color: active ? '#e8d48a' : '#c8daf0',
                      fontSize: '14px', fontWeight: active ? '600' : '400',
                      fontFamily: "'Inter', sans-serif",
                      cursor: 'pointer',
                      borderBottom: active ? '2px solid #e8d48a' : '2px solid transparent',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                        e.currentTarget.style.color = '#ffffff'
                      }
                    }}
                    onMouseOut={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#c8daf0'
                      }
                    }}
                  >
                    <Icon size={16}/>
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Usuario + logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Avatar + nombre */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(232,212,138,0.2)',
                  border: '1.5px solid #e8d48a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: '600',
                  color: '#e8d48a',
                  flexShrink: 0,
                }}>
                  {user?.nombre?.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <p style={{
                    fontSize: '13px', fontWeight: '500',
                    color: '#ffffff', margin: 0,
                    maxWidth: '140px', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {user?.nombre}
                  </p>
                  <p style={{
                    fontSize: '11px', color: '#7a9abf',
                    margin: 0, textTransform: 'capitalize',
                  }}>
                    {user?.rol}
                  </p>
                </div>
              </div>

              {/* Botón logout */}
              <button onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  color: '#c8daf0', fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(220,38,38,0.15)'
                  e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)'
                  e.currentTarget.style.color = '#fca5a5'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.color = '#c8daf0'
                }}
              >
                <LogOut size={14}/>
                Salir
              </button>
            </div>
          </div>
        </nav>

        {/* Contenido de la página */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0' }}>
          {children}
        </main>

      </div>
    </>
  )
}