import { useState } from 'react'
import Sidebar from './Sidebar'

const HamburgerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect y="4" width="22" height="2" rx="1" fill="#C9A84C"/>
    <rect y="10" width="22" height="2" rx="1" fill="#C9A84C"/>
    <rect y="16" width="22" height="2" rx="1" fill="#C9A84C"/>
  </svg>
)

export default function PanelLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <style>{`
        .pl-mobile-header {
          display: none;
        }
        @media (max-width: 767px) {
          .pl-mobile-header {
            display: flex;
            align-items: center;
            gap: 12px;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 56px;
            padding: 0 16px;
            background: rgba(4,12,32,0.97);
            border-bottom: 1px solid rgba(201,168,76,0.15);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            z-index: 50;
            box-shadow: 0 2px 16px rgba(0,0,0,0.4);
          }
          .pl-content-wrapper {
            padding-top: 56px !important;
          }
        }
      `}</style>

      {/* Header mobile con hamburguesa */}
      <div className="pl-mobile-header">
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          aria-label="Abrir menú"
        >
          <HamburgerIcon />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          {/* Mini logo SVG */}
          <svg viewBox="0 0 44 44" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="mhGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E8C97A"/>
                <stop offset="100%" stopColor="#9A7A32"/>
              </linearGradient>
            </defs>
            <rect width="44" height="44" rx="10" fill="url(#mhGold)" opacity="0.13"/>
            <rect width="44" height="44" rx="10" fill="none" stroke="url(#mhGold)" strokeWidth="1" strokeOpacity="0.5"/>
            <rect x="21.2" y="8" width="1.6" height="22" rx="0.8" fill="url(#mhGold)" opacity="0.85"/>
            <circle cx="22" cy="8.5" r="2.2" fill="url(#mhGold)" opacity="0.95"/>
            <rect x="9" y="16" width="26" height="1.5" rx="0.75" fill="url(#mhGold)" opacity="0.8"/>
            <line x1="12" y1="17.5" x2="10" y2="24" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.65"/>
            <line x1="12" y1="17.5" x2="14" y2="24" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.65"/>
            <ellipse cx="12" cy="24.8" rx="4.5" ry="1.6" fill="url(#mhGold)" opacity="0.75"/>
            <line x1="32" y1="17.5" x2="30" y2="24" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.65"/>
            <line x1="32" y1="17.5" x2="34" y2="24" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.65"/>
            <ellipse cx="32" cy="24.8" rx="4.5" ry="1.6" fill="url(#mhGold)" opacity="0.75"/>
            <text x="22" y="37" textAnchor="middle"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize="9" fontWeight="700"
              fill="url(#mhGold)" opacity="0.92" letterSpacing="1.5">
              SC
            </text>
          </svg>
          <div>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '13px', fontWeight: '700',
              color: 'rgba(255,255,255,0.95)',
              margin: 0, lineHeight: 1.2,
            }}>
              Lic. Horacio Sánchez
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '9px', fontWeight: '700',
              color: 'rgba(201,168,76,0.65)',
              margin: 0, letterSpacing: '1.8px',
              textTransform: 'uppercase',
            }}>
              Asesoría Jurídica
            </p>
          </div>
        </div>
      </div>

      {/* Overlay semitransparente cuando el sidebar está abierto en mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2,8,24,0.65)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            zIndex: 60,
          }}
          aria-hidden="true"
        />
      )}

      <div style={{ display: 'flex', minHeight: '100vh', background: '#020818' }}>
        <Sidebar isMobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
        <div
          className="pl-content-wrapper"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {children}
        </div>
      </div>
    </>
  )
}
