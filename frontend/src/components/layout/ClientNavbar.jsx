import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Calendar, FolderOpen, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

// ── Logo SVG premium — mismo que Sidebar ─────────────────────────
const LogoMark = () => (
  <svg viewBox="0 0 44 44" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cnGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8C97A"/>
        <stop offset="100%" stopColor="#9A7A32"/>
      </linearGradient>
    </defs>
    <rect width="44" height="44" rx="10" fill="url(#cnGold)" opacity="0.13"/>
    <rect width="44" height="44" rx="10" fill="none" stroke="url(#cnGold)" strokeWidth="1" strokeOpacity="0.5"/>
    <rect x="21.2" y="8" width="1.6" height="22" rx="0.8" fill="url(#cnGold)" opacity="0.85"/>
    <circle cx="22" cy="8.5" r="2.2" fill="url(#cnGold)" opacity="0.95"/>
    <rect x="9" y="16" width="26" height="1.5" rx="0.75" fill="url(#cnGold)" opacity="0.8"/>
    <line x1="12" y1="17.5" x2="10" y2="24" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.65"/>
    <line x1="12" y1="17.5" x2="14" y2="24" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.65"/>
    <ellipse cx="12" cy="24.8" rx="4.5" ry="1.6" fill="url(#cnGold)" opacity="0.75"/>
    <line x1="32" y1="17.5" x2="30" y2="24" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.65"/>
    <line x1="32" y1="17.5" x2="34" y2="24" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.65"/>
    <ellipse cx="32" cy="24.8" rx="4.5" ry="1.6" fill="url(#cnGold)" opacity="0.75"/>
    <text x="22" y="37" textAnchor="middle"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="9" fontWeight="700"
      fill="url(#cnGold)" opacity="0.92" letterSpacing="1.5">
      SC
    </text>
    <rect x="17" y="30" width="10" height="1.4" rx="0.7" fill="url(#cnGold)" opacity="0.6"/>
  </svg>
)

const NAV_ITEMS = [
  { label: 'Mis Citas', path: '/cliente/mis-citas',     icon: Calendar   },
  { label: 'Mis Casos', path: '/cliente/mis-casos',     icon: FolderOpen },
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

  const handleNav = (path) => {
    navigate(path)
    setMenuOpen(false)
  }

  return (
    <>
      <style>{`
        .cn-root {
          min-height: 100vh;
          background: #020818;
          font-family: 'Inter', sans-serif;
        }
        .cn-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(8, 20, 48, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(201, 168, 76, 0.18);
          box-shadow: 0 4px 32px rgba(0,0,0,0.45);
        }
        .cn-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }
        /* Logo */
        .cn-logo {
          display: flex;
          align-items: center;
          gap: 11px;
          text-decoration: none;
          cursor: pointer;
          flex-shrink: 0;
        }
        .cn-logo-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 14px;
          font-weight: 700;
          color: rgba(255,255,255,0.95);
          margin: 0;
          line-height: 1.2;
          white-space: nowrap;
        }
        .cn-logo-sub {
          font-size: 9px;
          color: #C9A84C;
          margin: 0;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          opacity: 0.8;
        }
        /* Nav links desktop */
        .cn-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .cn-link {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.5);
          font-size: 13.5px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        .cn-link:hover {
          background: rgba(201,168,76,0.08);
          color: rgba(255,255,255,0.85);
        }
        .cn-link.active {
          color: #E8C97A;
          background: rgba(201,168,76,0.1);
          font-weight: 600;
        }
        .cn-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 16px;
          right: 16px;
          height: 2px;
          background: linear-gradient(90deg, #C9A84C, #E8C97A);
          border-radius: 2px 2px 0 0;
        }
        /* Right side */
        .cn-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cn-user {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .cn-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(201,168,76,0.12);
          border: 1.5px solid rgba(201,168,76,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 14px;
          font-weight: 700;
          color: #C9A84C;
          flex-shrink: 0;
        }
        .cn-user-name {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.9);
          margin: 0;
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cn-user-role {
          font-size: 10px;
          color: rgba(201,168,76,0.7);
          margin: 0;
          text-transform: capitalize;
          letter-spacing: 0.3px;
        }
        .cn-logout {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: rgba(255,255,255,0.55);
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cn-logout:hover {
          background: rgba(220,38,38,0.12);
          border-color: rgba(220,38,38,0.3);
          color: #FCA5A5;
        }
        /* Hamburguer */
        .cn-hamburger {
          display: none;
          flex-shrink: 0;
          background: transparent;
          border: 1px solid rgba(201,168,76,0.35);
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          color: #C9A84C;
          transition: all 0.2s;
          min-width: 36px;
          min-height: 36px;
          align-items: center;
          justify-content: center;
        }
        .cn-hamburger:hover {
          background: rgba(201,168,76,0.12);
          color: #E8C97A;
        }
        /* Divider desktop */
        .cn-divider {
          width: 1px;
          height: 28px;
          background: rgba(201,168,76,0.15);
        }
        /* Mobile menu */
        .cn-mobile-menu {
          display: none;
          background: rgba(6,16,40,0.97);
          border-top: 1px solid rgba(201,168,76,0.12);
          padding: 8px 16px 12px;
        }
        .cn-mobile-link {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 11px 14px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.55);
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          text-align: left;
          transition: all 0.18s;
          margin-bottom: 2px;
        }
        .cn-mobile-link:hover {
          background: rgba(201,168,76,0.08);
          color: rgba(255,255,255,0.85);
        }
        .cn-mobile-link.active {
          background: rgba(201,168,76,0.1);
          color: #E8C97A;
          font-weight: 600;
          border-left: 2px solid #C9A84C;
          padding-left: 12px;
        }
        .cn-mobile-sep {
          height: 1px;
          background: rgba(201,168,76,0.1);
          margin: 8px 0;
        }
        .cn-mobile-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px 6px;
        }
        /* Responsive */
        @media (max-width: 700px) {
          .cn-links        { display: none; }
          .cn-user-text    { display: none; }
          .cn-divider      { display: none; }
          .cn-logout-desktop { display: none; }
          .cn-hamburger    { display: flex !important; }
          .cn-logo-text    { display: none; }
          .cn-inner        { padding: 0 14px; height: 56px; }
        }
        @media (min-width: 701px) {
          .cn-mobile-menu { display: none !important; }
        }
      `}</style>

      <div className="cn-root">

        {/* Navbar */}
        <nav className="cn-nav">
          <div className="cn-inner">

            {/* Logo */}
            <div className="cn-logo">
              <LogoMark />
              <div className="cn-logo-text">
                <p className="cn-logo-title">Lic. Horacio Sánchez Cerino</p>
                <p className="cn-logo-sub">Portal del Cliente</p>
              </div>
            </div>

            {/* Links — desktop */}
            <div className="cn-links">
              {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
                const active = location.pathname === path
                return (
                  <button
                    key={path}
                    className={`cn-link${active ? ' active' : ''}`}
                    onClick={() => handleNav(path)}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Right: usuario + logout */}
            <div className="cn-right">
              <div className="cn-user">
                <div className="cn-avatar" translate="no">
                  {user?.nombre?.charAt(0).toUpperCase()}
                </div>
                <div className="cn-user-text" style={{ display: 'flex', flexDirection: 'column' }}>
                  <p className="cn-user-name" translate="no">{user?.nombre}</p>
                  <p className="cn-user-role">{user?.rol}</p>
                </div>
              </div>

              <div className="cn-divider" />

              <button className="cn-logout cn-logout-desktop" onClick={handleLogout}>
                <LogOut size={14} />
                Salir
              </button>

              {/* Hamburger — mobile */}
              <button
                className="cn-hamburger"
                onClick={() => setMenuOpen(v => !v)}
                aria-label="Menú"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>

          </div>

          {/* Menú móvil — controlado por menuOpen */}
          <div className="cn-mobile-menu" style={{ display: menuOpen ? 'block' : 'none' }}>
            <div className="cn-mobile-user">
              <div className="cn-avatar" translate="no">
                {user?.nombre?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="cn-user-name" translate="no">{user?.nombre}</p>
                <p className="cn-user-role">{user?.rol}</p>
              </div>
            </div>
            <div className="cn-mobile-sep" />

            {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
              const active = location.pathname === path
              return (
                <button
                  key={path}
                  className={`cn-mobile-link${active ? ' active' : ''}`}
                  onClick={() => handleNav(path)}
                >
                  <Icon size={16} />
                  {label}
                </button>
              )
            })}

            <div className="cn-mobile-sep" />

            <button
              className="cn-mobile-link"
              onClick={handleLogout}
              style={{ color: 'rgba(252,165,165,0.7)' }}
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </nav>

        {/* Contenido */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0' }}>
          {children}
        </main>

      </div>
    </>
  )
}
