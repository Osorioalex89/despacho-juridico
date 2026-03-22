import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Calendar,
  FileText,
  UserCheck,
  LogOut,
  Scale,
  ShieldCheck,
} from 'lucide-react'

/* ── Design tokens (mirrors dashboard) ────────────────────────── */
const D = {
  fontDisplay:   "'Playfair Display', Georgia, serif",
  fontBody:      "'Inter', system-ui, sans-serif",

  textPrimary:   'rgba(255,255,255,0.95)',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted:     'rgba(255,255,255,0.30)',

  goldPrimary:   '#e8d48a',
  goldMuted:     'rgba(232,212,138,0.60)',
  goldGlow:      'rgba(232,212,138,0.15)',
  goldBorder:    'rgba(232,212,138,0.25)',

  glassBorder:   'rgba(255,255,255,0.10)',
}

/* ── Nav sections & items ──────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { label: 'Dashboard',   path: '/panel/dashboard',           icon: LayoutDashboard, roles: ['abogado', 'secretario'] },
      { label: 'Clientes',    path: '/panel/clientes',            icon: Users,           roles: ['abogado', 'secretario'] },
      { label: 'Casos',       path: '/panel/casos',               icon: FolderOpen,      roles: ['abogado', 'secretario'] },
      { label: 'Agenda',      path: '/panel/agenda',              icon: Calendar,        roles: ['abogado', 'secretario'] },
      { label: 'Documentos',  path: '/panel/documentos',          icon: FileText,        roles: ['abogado', 'secretario'] },
    ],
  },
  {
    label: 'Administración',
    items: [
      { label: 'Solicitudes', path: '/panel/usuarios-pendientes', icon: UserCheck,       roles: ['abogado', 'secretario'] },
      { label: 'Usuarios',    path: '/panel/usuarios',            icon: ShieldCheck,     roles: ['abogado'] },
    ],
  },
]

export default function Sidebar() {
  const { user, logout, canManageUsers } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  /* First letter of name for avatar */
  const avatarLetter = user?.nombre?.charAt(0).toUpperCase() || '?'

  /* Display name: skip "Lic." prefix */
  const displayName = (user?.nombre || '')
    .split(' ')
    .filter(w => !/^lic\.?$/i.test(w))
    .slice(0, 2)
    .join(' ') || user?.nombre || ''

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <style>{`
        /* ── Sidebar shell ── */
        .lp-sidebar {
          width: 240px;
          min-height: 100vh;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border-right: 1px solid ${D.glassBorder};
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: relative;
          box-shadow: 4px 0 24px rgba(0,0,0,0.40), inset -1px 0 0 rgba(255,255,255,0.04);
        }

        /* Subtle inner glow on the right edge */
        .lp-sidebar::after {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 1px; height: 100%;
          background: linear-gradient(
            to bottom,
            transparent,
            ${D.goldBorder} 30%,
            ${D.goldBorder} 70%,
            transparent
          );
          pointer-events: none;
        }

        /* ── Nav item base ── */
        .lp-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          margin: 1px 12px 1px 0;
          border-radius: 0 8px 8px 0;
          color: ${D.textSecondary};
          font-family: ${D.fontBody};
          font-size: 13px;
          font-weight: 400;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
          position: relative;
        }

        /* ── Hover state ── */
        .lp-nav-item:hover {
          background: rgba(255,255,255,0.07);
          color: ${D.textPrimary};
        }

        /* ── Active state — gold gradient + left border ── */
        .lp-nav-item.active {
          background: linear-gradient(
            90deg,
            rgba(232,212,138,0.12) 0%,
            rgba(255,255,255,0.07) 100%
          );
          color: ${D.goldPrimary};
          border-left: 2px solid ${D.goldPrimary};
          padding-left: calc(16px - 2px);
          font-weight: 500;
          box-shadow: inset 0 0 12px rgba(232,212,138,0.05);
        }

        /* Icon inside nav item */
        .lp-nav-icon {
          flex-shrink: 0;
          opacity: 0.7;
          transition: opacity 0.15s ease;
        }
        .lp-nav-item:hover   .lp-nav-icon { opacity: 0.9; }
        .lp-nav-item.active  .lp-nav-icon { opacity: 1.0; }

        /* ── Section label ── */
        .lp-section-label {
          font-family: ${D.fontBody};
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${D.textMuted};
          padding: 14px 18px 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lp-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, rgba(255,255,255,0.08), transparent);
        }

        /* ── Logout button ── */
        .lp-logout {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 9px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: ${D.textSecondary};
          font-family: ${D.fontBody};
          font-size: 12px;
          font-weight: 400;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .lp-logout:hover {
          background: rgba(252,165,165,0.10);
          border-color: rgba(252,165,165,0.20);
          color: #fca5a5;
        }
      `}</style>

      <aside className="lp-sidebar">

        {/* ══ LOGO / FIRM HEADER */}
        <div style={{
          padding: '24px 18px 20px',
          borderBottom: `1px solid ${D.glassBorder}`,
          position: 'relative',
        }}>
          {/* Faint radial behind logo */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse at top left, rgba(232,212,138,0.04), transparent 70%)',
            pointerEvents: 'none',
          }}/>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
            {/* Scale icon badge */}
            <div style={{
              width: '38px', height: '38px',
              background: 'linear-gradient(135deg, rgba(232,212,138,0.20), rgba(232,212,138,0.08))',
              border: `1px solid ${D.goldBorder}`,
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 12px ${D.goldGlow}`,
            }}>
              <Scale size={18} color={D.goldPrimary} strokeWidth={2}/>
            </div>

            <div style={{ minWidth: 0 }}>
              {/*
                Firm name — Playfair Display 700 (display role)
                "Lic. Horacio" in text-primary,
                accent word "Sánchez" kept in one line
              */}
              <p style={{
                fontFamily: D.fontDisplay,
                fontSize: '13px', fontWeight: '700',
                color: D.textPrimary,
                margin: '0 0 1px',
                lineHeight: 1.25,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {/* Gold accent #1 — firm name highlight */}
                <span style={{ color: D.goldPrimary }}>Lic.</span> Horacio Sánchez
              </p>
              <p style={{
                fontFamily: D.fontDisplay,
                fontSize: '13px', fontWeight: '700',
                color: D.textPrimary,
                margin: 0, lineHeight: 1.25,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}>
                Cerino
              </p>
              {/* Sub-label — Inter 400 */}
              <p style={{
                fontFamily: D.fontBody,
                fontSize: '9px', fontWeight: '400',
                letterSpacing: '0.10em', textTransform: 'uppercase',
                color: D.textMuted, margin: '4px 0 0',
              }}>
                Asesoría Jurídica
              </p>
            </div>
          </div>
        </div>

        {/* ══ NAVIGATION ══════════════════════════════════════ */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {NAV_SECTIONS.map((section, si) => {
            /* Filter items by role */
            const visibleItems = section.items.filter(item =>
              item.roles.includes(user?.rol) &&
              /* Hide Usuarios if not abogado */
              (item.path !== '/panel/usuarios' || canManageUsers)
            )
            if (visibleItems.length === 0) return null

            return (
              <div key={si}>
                {/* Section label (only for "Administración") */}
                {section.label && (
                  <p className="lp-section-label">{section.label}</p>
                )}

                {visibleItems.map(({ label, path, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    className={({ isActive }) =>
                      `lp-nav-item${isActive ? ' active' : ''}`
                    }
                  >
                    <Icon size={15} className="lp-nav-icon"/>
                    {/* Nav label — Inter 400/500 inherited from CSS */}
                    {label}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        {/* ══ THIN DIVIDER*/}
        <div style={{
          height: '1px',
          margin: '0 18px',
          background: `linear-gradient(to right, transparent, ${D.glassBorder}, transparent)`,
        }}/>

        {/* ══ USER FOOTER ═════════════════════════════════════ */}
        <div style={{ padding: '16px 18px 20px' }}>

          {/* Attorney card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '12px',
          }}>
            {/*
              Attorney avatar — gold ring (gold use #3)
              Per skill: border: 2px solid var(--gold-primary)
                         box-shadow: glow + outer ring
            */}
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(30,58,95,0.8), rgba(15,23,42,0.9))',
              border: `2px solid ${D.goldPrimary}`,
              boxShadow: `0 0 0 3px ${D.goldGlow}, 0 0 16px rgba(232,212,138,0.15)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {/* Avatar letter — Inter 600 */}
              <span style={{
                fontFamily: D.fontBody,
                fontSize: '13px', fontWeight: '600',
                color: D.goldPrimary,
                lineHeight: 1,
              }}>
                {avatarLetter}
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name — Inter 500, text-primary */}
              <p style={{
                fontFamily: D.fontBody,
                fontSize: '12px', fontWeight: '500',
                color: D.textPrimary, margin: 0,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {displayName}
              </p>
              {/* Role — Inter 400, text-secondary, capitalize */}
              <p style={{
                fontFamily: D.fontBody,
                fontSize: '10px', fontWeight: '400',
                color: D.textSecondary, margin: '1px 0 0',
                textTransform: 'capitalize', letterSpacing: '0.02em',
              }}>
                {user?.rol || 'Usuario'}
              </p>
            </div>
          </div>

          {/* Logout button */}
          <button className="lp-logout" onClick={handleLogout}>
            <LogOut size={13} style={{ opacity: 0.7, flexShrink: 0 }}/>
            Cerrar sesión
          </button>
        </div>

      </aside>
    </>
  )
}