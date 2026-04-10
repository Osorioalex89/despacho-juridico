import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCasos } from '../../features/cases/casesService'
import { getCitas } from '../../features/appointments/appointmentsService'
import { getUsuarios } from '../../features/users/usersService'
import {
  LayoutDashboard, Users, FolderOpen,
  Calendar, FileText, UserCheck, LogOut,
  ChevronRight, Shield, Globe
} from 'lucide-react'

// ── Logo SVG premium — Monograma "SC" con balanza ────────────────
const LogoMark = () => (
  <svg viewBox="0 0 44 44" width="42" height="42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sbGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8C97A"/>
        <stop offset="100%" stopColor="#9A7A32"/>
      </linearGradient>
    </defs>
    <rect width="44" height="44" rx="10" fill="url(#sbGold)" opacity="0.13"/>
    <rect width="44" height="44" rx="10" fill="none" stroke="url(#sbGold)" strokeWidth="1" strokeOpacity="0.5"/>
    <rect x="21.2" y="8" width="1.6" height="22" rx="0.8" fill="url(#sbGold)" opacity="0.85"/>
    <circle cx="22" cy="8.5" r="2.2" fill="url(#sbGold)" opacity="0.95"/>
    <rect x="9" y="16" width="26" height="1.5" rx="0.75" fill="url(#sbGold)" opacity="0.8"/>
    <line x1="12" y1="17.5" x2="10" y2="24" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.65"/>
    <line x1="12" y1="17.5" x2="14" y2="24" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.65"/>
    <ellipse cx="12" cy="24.8" rx="4.5" ry="1.6" fill="url(#sbGold)" opacity="0.75"/>
    <line x1="32" y1="17.5" x2="30" y2="24" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.65"/>
    <line x1="32" y1="17.5" x2="34" y2="24" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.65"/>
    <ellipse cx="32" cy="24.8" rx="4.5" ry="1.6" fill="url(#sbGold)" opacity="0.75"/>
    <text x="22" y="37" textAnchor="middle"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="9" fontWeight="700"
      fill="url(#sbGold)" opacity="0.92" letterSpacing="1.5">
      SC
    </text>
    <rect x="17" y="30" width="10" height="1.4" rx="0.7" fill="url(#sbGold)" opacity="0.6"/>
  </svg>
)

const NAV_ITEMS = [
  { label: 'Dashboard',   path: '/panel/dashboard',          icon: LayoutDashboard, roles: ['abogado', 'secretario'] },
  { label: 'Clientes',    path: '/panel/clientes',           icon: Users,           roles: ['abogado', 'secretario'] },
  { label: 'Casos',       path: '/panel/casos',              icon: FolderOpen,      roles: ['abogado', 'secretario'] },
  { label: 'Agenda',      path: '/panel/agenda',             icon: Calendar,        roles: ['abogado', 'secretario'] },
  { label: 'Documentos',  path: '/panel/documentos',         icon: FileText,        roles: ['abogado', 'secretario'] },
  { label: 'Solicitudes', path: '/panel/usuarios-pendientes',icon: UserCheck,       roles: ['abogado', 'secretario'] },
  { label: 'Landing',     path: '/panel/solicitudes-landing', icon: Globe,           roles: ['abogado', 'secretario'] },
]

const ROL_LABEL = {
  abogado:    'Abogado',
  secretario: 'Secretario',
  cliente:    'Cliente',
}

export default function Sidebar({ isMobileOpen = false, onMobileClose = () => {} }) {
  const { user, logout, canManageUsers } = useAuth()
  const navigate = useNavigate()

  const [badgeCasos, setBadgeCasos] = useState(null)
  const [badgeAgenda, setBadgeAgenda] = useState(null)
  const [badgeSolicitudes, setBadgeSolicitudes] = useState(null)
  const [badgeLanding, setBadgeLanding] = useState(null)

  useEffect(() => {
    if (!user?.rol || !['abogado', 'secretario'].includes(user.rol)) return

    Promise.allSettled([
      getCasos({ limit: 1000 }),
      getCitas({ limit: 1000 }),
      getUsuarios({ limit: 1000 }),
    ]).then(([resCasos, resCitas, resUsuarios]) => {
      if (resCasos.status === 'fulfilled') {
        const lista = resCasos.value?.data?.casos ?? resCasos.value?.data ?? []
        const activos = lista.filter(c => c.estado !== 'cerrado').length
        if (activos > 0) setBadgeCasos(activos)
      }
      if (resCitas.status === 'fulfilled') {
        const lista = resCitas.value?.data?.citas ?? resCitas.value?.data ?? []
        const pendientes = lista.filter(c => c.estado === 'pendiente').length
        if (pendientes > 0) setBadgeAgenda(pendientes)
        // Badge landing: citas pendientes con menos de 24 h (badge urgente dorado)
        const nuevas = lista.filter(c => {
          if (c.estado !== 'pendiente') return false
          const diff = Date.now() - new Date(c.createdAt).getTime()
          return diff < 24 * 60 * 60 * 1000
        }).length
        if (nuevas > 0) setBadgeLanding(nuevas)
      }
      if (resUsuarios.status === 'fulfilled') {
        const lista = resUsuarios.value?.data?.usuarios ?? resUsuarios.value?.data ?? []
        const pendientesAprobacion = lista.filter(u => u.estado === 'pendiente').length
        const resetsPendientes = lista.filter(u => u.reset_solicitado).length
        const total = pendientesAprobacion + resetsPendientes
        if (total > 0) setBadgeSolicitudes(total)
      }
    })
  }, [user?.rol])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredItems = NAV_ITEMS.filter(item => item.roles.includes(user?.rol))
  const inicial  = user?.nombre?.charAt(0).toUpperCase() || 'U'
  const rolLabel = ROL_LABEL[user?.rol] || user?.rol

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .sb-nav::-webkit-scrollbar { width: 3px; }
        .sb-nav::-webkit-scrollbar-track { background: transparent; }
        .sb-nav::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }

        .sb-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 9px;
          margin-bottom: 3px;
          cursor: pointer;
          transition: all 0.15s ease;
          border-left: 3px solid transparent;
          text-decoration: none;
          position: relative;
        }
        .sb-item.active {
          border-left: 3px solid #C9A84C;
          background: linear-gradient(90deg, rgba(201,168,76,0.13) 0%, rgba(201,168,76,0.02) 100%);
          box-shadow: inset 0 0 14px rgba(201,168,76,0.06);
        }
        .sb-item.active .sb-label { color: rgba(201,168,76,0.97) !important; font-weight: 600 !important; }
        .sb-item.active .sb-icon  { color: rgba(201,168,76,0.92) !important; }

        .sb-item:not(.active):hover { background: rgba(255,255,255,0.045); border-left-color: rgba(201,168,76,0.3); }
        .sb-item:not(.active):hover .sb-label { color: rgba(255,255,255,0.94) !important; }
        .sb-item:not(.active):hover .sb-icon  { color: rgba(255,255,255,0.78) !important; }

        .sb-user-card {
          display: flex; align-items: center; gap: 11px;
          padding: 11px 13px;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sb-user-card:hover {
          background: rgba(201,168,76,0.07);
          border-color: rgba(201,168,76,0.22);
        }

        .sb-logout {
          display: flex; align-items: center; gap: 9px;
          width: 100%;
          padding: 10px 13px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-top: 6px;
        }
        .sb-logout:hover { background: rgba(239,68,68,0.09); border-color: rgba(239,68,68,0.22); }
        .sb-logout:hover .sb-logout-text { color: rgba(252,165,165,0.92) !important; }
        .sb-logout:hover .sb-logout-icon { color: rgba(252,165,165,0.82) !important; }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        .dot-pulse { animation: pulse-dot 2s ease-in-out infinite; }

        /* ── Responsive: drawer en mobile ─────────────────────── */
        @media (max-width: 767px) {
          .sb-aside {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            height: 100vh !important;
            min-height: 100vh !important;
            z-index: 70 !important;
            transform: translateX(-100%);
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: none;
          }
          .sb-aside.sb-open {
            transform: translateX(0);
            box-shadow: 6px 0 40px rgba(0,0,0,0.7);
          }
          .sb-close-btn {
            display: flex !important;
          }
        }
        @media (min-width: 768px) {
          .sb-aside {
            position: relative !important;
            transform: none !important;
            transition: none !important;
          }
          .sb-close-btn {
            display: none !important;
          }
        }
      `}</style>

      <aside
        className={`sb-aside${isMobileOpen ? ' sb-open' : ''}`}
        style={{
          width: '248px',
          minHeight: '100vh',
          flexShrink: 0,
          background: 'rgba(4,12,32,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(201,168,76,0.15)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 10,
        }}
      >

        {/* Glow decorativo */}
        <div style={{
          position: 'absolute', top: -70, left: -70,
          width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>

        {/* ── Logo + Firm Name ──────────────────────────────── */}
        <div style={{
          padding: '26px 20px 22px',
          borderBottom: '1px solid rgba(201,168,76,0.1)',
          position: 'relative',
        }}>
          {/* Botón cerrar — solo visible en mobile */}
          <button
            className="sb-close-btn"
            onClick={onMobileClose}
            aria-label="Cerrar menú"
            style={{
              display: 'none',
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              padding: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(201,168,76,0.12)'
              e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="1" y1="1" x2="13" y2="13" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
              <line x1="13" y1="1" x2="1" y2="13" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
            <LogoMark/>
            <div>
              <p style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '15.5px', fontWeight: '700',
                color: 'rgba(255,255,255,0.97)',
                margin: '0 0 1px', lineHeight: 1.2,
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}>
                Lic. Horacio
              </p>
              <p style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '14px', fontWeight: '600',
                color: '#C9A84C',
                margin: '0 0 4px', lineHeight: 1.2,
              }}>
                Sánchez Cerino
              </p>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '10px', fontWeight: '700',
                color: 'rgba(201,168,76,0.6)',
                margin: 0,
                letterSpacing: '2.2px',
                textTransform: 'uppercase',
              }}>
                Asesoría Jurídica
              </p>
            </div>
          </div>
          <div style={{
            position: 'absolute', bottom: 0, left: '20px',
            width: '44px', height: '1px',
            background: 'linear-gradient(90deg, rgba(201,168,76,0.55), transparent)',
          }}/>
        </div>

        {/* ── Navigation ───────────────────────────────────── */}
        <nav className="sb-nav" style={{
          flex: 1,
          padding: '16px 11px 10px',
          overflowY: 'auto',
        }}>

          {/* Eyebrow — más visible */}
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '10px', fontWeight: '700',
            letterSpacing: '2.5px', textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.55)',
            padding: '0 14px', margin: '0 0 10px',
          }}>
            Menú principal
          </p>

          {filteredItems.map(({ label, path, icon: Icon, badge }) => {
            const dynamicBadge =
              path === '/panel/casos'               ? (badgeCasos       || null) :
              path === '/panel/agenda'              ? (badgeAgenda      || null) :
              path === '/panel/usuarios-pendientes' ? (badgeSolicitudes || null) :
              path === '/panel/solicitudes-landing' ? (badgeLanding     || null) :
              badge ?? null

            const dynamicBadgeUrgent = (path === '/panel/agenda' && badgeAgenda > 0) ||
                                       (path === '/panel/solicitudes-landing' && badgeLanding > 0)

            return (
              <NavLink
                key={path}
                to={path}
                onClick={onMobileClose}
                className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={17}
                      className="sb-icon"
                      style={{
                        color: isActive ? 'rgba(201,168,76,0.92)' : 'rgba(255,255,255,0.45)',
                        flexShrink: 0,
                        transition: 'color 0.15s ease',
                      }}
                    />
                    <span
                      className="sb-label"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        fontWeight: isActive ? '600' : '500',
                        color: isActive ? 'rgba(201,168,76,0.97)' : 'rgba(255,255,255,0.65)',
                        flex: 1,
                        transition: 'all 0.15s ease',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {label}
                    </span>

                    {dynamicBadge && (
                      <span
                        className={dynamicBadgeUrgent ? 'dot-pulse' : ''}
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '10px', fontWeight: '700',
                          padding: '2px 7px', borderRadius: '10px',
                          background: dynamicBadgeUrgent
                            ? 'rgba(239,68,68,0.18)'
                            : 'rgba(201,168,76,0.12)',
                          color: dynamicBadgeUrgent ? '#FCA5A5' : 'rgba(201,168,76,0.88)',
                          border: `1px solid ${dynamicBadgeUrgent
                            ? 'rgba(239,68,68,0.3)'
                            : 'rgba(201,168,76,0.24)'}`,
                          lineHeight: '1',
                        }}
                      >
                        {dynamicBadge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}

          {/* Sección Administración — solo abogado */}
          {canManageUsers && (
            <>
              <div style={{
                margin: '16px 14px 12px',
                height: '1px',
                background: 'linear-gradient(90deg, rgba(201,168,76,0.18), transparent)',
              }}/>

              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '10px', fontWeight: '700',
                letterSpacing: '2.5px', textTransform: 'uppercase',
                color: 'rgba(201,168,76,0.45)',
                padding: '0 14px', margin: '0 0 10px',
              }}>
                Administración
              </p>

              <NavLink
                to="/panel/usuarios"
                onClick={onMobileClose}
                className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
              >
                {({ isActive }) => (
                  <>
                    <Shield
                      size={17}
                      className="sb-icon"
                      style={{
                        color: isActive ? 'rgba(201,168,76,0.92)' : 'rgba(255,255,255,0.45)',
                        flexShrink: 0,
                        transition: 'color 0.15s ease',
                      }}
                    />
                    <span
                      className="sb-label"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        fontWeight: isActive ? '600' : '500',
                        color: isActive ? 'rgba(201,168,76,0.97)' : 'rgba(255,255,255,0.65)',
                        flex: 1,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Usuarios
                    </span>
                    {badgeSolicitudes && (
                      <span style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '10px', fontWeight: '700',
                        padding: '2px 7px', borderRadius: '10px',
                        background: 'rgba(201,168,76,0.12)',
                        color: 'rgba(201,168,76,0.88)',
                        border: '1px solid rgba(201,168,76,0.24)',
                        lineHeight: '1',
                      }}>
                        {badgeSolicitudes}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </>
          )}
        </nav>

        {/* ── User profile + logout ─────────────────────────── */}
        <div style={{
          padding: '13px 11px 16px',
          borderTop: '1px solid rgba(201,168,76,0.1)',
        }}>

          {/* User card */}
          <div className="sb-user-card">
            {/* Avatar */}
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '9px', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(201,168,76,0.28) 0%, rgba(201,168,76,0.09) 100%)',
              border: '1px solid rgba(201,168,76,0.38)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 10px rgba(201,168,76,0.1)',
            }}>
              <span style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '16px', fontWeight: '700',
                color: '#C9A84C', lineHeight: 1,
              }}>
                {inicial}
              </span>
            </div>

            {/* Nombre + rol */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px', fontWeight: '600',
                color: 'rgba(255,255,255,0.92)',
                margin: '0 0 2px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.nombre}
              </p>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px', fontWeight: '600',
                color: 'rgba(201,168,76,0.72)',
                margin: 0, letterSpacing: '0.3px',
              }}>
                {rolLabel}
              </p>
            </div>

            <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}/>
          </div>

          {/* Logout */}
          <button className="sb-logout" onClick={handleLogout}>
            <LogOut
              size={14}
              className="sb-logout-icon"
              style={{ color: 'rgba(255,255,255,0.4)', transition: 'color 0.15s ease' }}
            />
            <span
              className="sb-logout-text"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px', fontWeight: '500',
                color: 'rgba(255,255,255,0.48)',
                transition: 'color 0.15s ease',
              }}
            >
              Cerrar sesión
            </span>
          </button>
        </div>

      </aside>
    </>
  )
}