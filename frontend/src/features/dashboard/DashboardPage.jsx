/**
 * DashboardPage — Legal Premium Design
 *
 * ── Typography Contract ───────────────────────────────────────────
 *  Playfair Display 700  →  section titles, firm greeting headline
 *  Inter 800             →  stat numbers (extra-bold, tabular, gold)
 *  Inter 500             →  labels, uppercase eyebrows, badge text
 *  Inter 400             →  body data, delta lines, "ver todos"
 *  Inter 300             →  secondary data, motives, client sub-lines
 *
 *  --text-primary   rgba(255,255,255,0.95)  titles + numbers
 *  --text-secondary rgba(255,255,255,0.55)  labels & descriptions
 *  --text-muted     rgba(255,255,255,0.30)  tertiary data
 *  --gold-primary   #e8d48a                 firm name + ≤2 more uses
 */

import { useState, useEffect } from 'react'
import { useAuth }    from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

/* ── Design tokens ───────────────────────────────────────────────── */
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

  glassLight:    'rgba(255,255,255,0.07)',
  glassMedium:   'rgba(255,255,255,0.12)',
  glassDark:     'rgba(0,0,0,0.45)',
  glassBorder:   'rgba(255,255,255,0.10)',

  statusActive:  { bg:'rgba(134,239,172,0.12)', text:'#86efac', border:'rgba(134,239,172,0.20)' },
  statusPending: { bg:'rgba(253,224,132,0.12)', text:'#fde08c', border:'rgba(253,224,132,0.20)' },
  statusUrgent:  { bg:'rgba(252,165,165,0.12)', text:'#fca5a5', border:'rgba(252,165,165,0.20)' },
  statusReview:  { bg:'rgba(147,197,253,0.12)', text:'#93c5fd', border:'rgba(147,197,253,0.20)' },
  statusClosed:  { bg:'rgba(148,163,184,0.12)', text:'#94a3b8', border:'rgba(148,163,184,0.20)' },
}

/* ── Mock data ───────────────────────────────────────────────────── */
const DATA = {
  casosActivos:  12,
  citasHoy:       3,
  totalClientes: 28,
  pendientes:     2,
  casos: [
    { id:1, folio:'EXP-2025-001', titulo:'Homicidio culposo',         cliente:'Juan Martínez',  estado:'activo'      },
    { id:2, folio:'EXP-2025-002', titulo:'Demanda por daños',          cliente:'Ana Martínez',   estado:'urgente'     },
    { id:3, folio:'EXP-2025-003', titulo:'Amparo contra autoridad',    cliente:'Luis Ramírez',   estado:'en_revision' },
    { id:4, folio:'EXP-2025-004', titulo:'Herencia y sucesiones',      cliente:'María López',    estado:'pendiente'   },
    { id:5, folio:'EXP-2025-005', titulo:'Compraventa de inmueble',    cliente:'Carlos Torres',  estado:'activo'      },
  ],
  citas: [
    { id:1, hora:'9:00',  pm:false, cliente:'Juan Martínez',  motivo:'Revisión de expediente', estado:'confirmada' },
    { id:2, hora:'11:00', pm:false, cliente:'Ana Martínez',   motivo:'Firma de documentos',    estado:'pendiente'  },
    { id:3, hora:'3:00',  pm:true,  cliente:'Luis Ramírez',   motivo:'Consulta inicial',       estado:'confirmada' },
  ],
}

const ESTADOS = {
  activo:      { label:'Activo',      ...D.statusActive  },
  urgente:     { label:'Urgente',     ...D.statusUrgent  },
  pendiente:   { label:'Pendiente',   ...D.statusPending },
  en_revision: { label:'En revisión', ...D.statusReview  },
  cerrado:     { label:'Cerrado',     ...D.statusClosed  },
}
const CITAS_EST = {
  confirmada: { label:'Confirmada', ...D.statusActive  },
  pendiente:  { label:'Pendiente',  ...D.statusPending },
  cancelada:  { label:'Cancelada',  ...D.statusUrgent  },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  /* Animated style helper */
  const anim = (delay = 0) => ({
    opacity:   visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(14px)',
    transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
  })

  /* Greeting */
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches'

  const fecha = new Date().toLocaleDateString('es-MX', {
    weekday:'long', day:'numeric', month:'long', year:'numeric',
  }).replace(/^\w/, c => c.toUpperCase())

  /* Display name: skip "Lic." prefix */
  const displayName = (user?.nombre || '')
    .split(' ')
    .filter(w => !/^lic\.?$/i.test(w))
    .slice(0, 2)
    .join(' ') || user?.nombre || 'Abogado'

  /* Metric cards config */
  const metrics = [
    { icon:'⚖️', value: DATA.casosActivos,  label:'Casos activos',  delta:'+2 este mes',                                              deltaColor: D.statusActive.text,  path:'/panel/casos'    },
    { icon:'📅', value: DATA.citasHoy,       label:'Citas hoy',      delta:'Próxima: 9:00 am',                                         deltaColor: D.statusPending.text, path:'/panel/agenda'   },
    { icon:'👤', value: DATA.totalClientes,  label:'Clientes',       delta:`${DATA.pendientes} pendiente${DATA.pendientes!==1?'s':''} de aprobación`, deltaColor: D.statusReview.text,  path:'/panel/clientes' },
  ]

  return (
    <>
      {/*
        Google Fonts:
        Playfair Display 700 only — display role
        Inter 300 400 500 600 800 — all body/data roles
      */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@300;400;500;600;800&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @keyframes lp-fade {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0);    }
        }

        /* ── Stat card (glass-medium + gold top border) ── */
        .lp-stat {
          background: ${D.glassMedium};
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid ${D.glassBorder};
          border-top: 1px solid ${D.goldBorder};
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          position: relative; overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .lp-stat::before {
          content:'';
          position: absolute; inset: 0;
          background: radial-gradient(circle at top right, ${D.goldGlow}, transparent 65%);
          pointer-events: none;
        }
        .lp-stat:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.40), 0 0 0 1px ${D.goldBorder};
        }

        /* ── Glass panel ── */
        .lp-panel {
          background: ${D.glassMedium};
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid ${D.glassBorder};
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06);
        }

        /* ── Row hover ── */
        .lp-row { transition: background 0.15s ease; cursor: pointer; }
        .lp-row:hover {
          background: rgba(255,255,255,0.05);
          box-shadow: inset 0 0 0 1px rgba(232,212,138,0.10);
        }

        /* ── Ghost link button ── */
        .lp-link {
          font-family: ${D.fontBody};
          font-size: 12px; font-weight: 400;
          color: ${D.goldMuted};
          background: none; border: none; cursor: pointer;
          transition: color 0.15s ease;
        }
        .lp-link:hover { color: ${D.goldPrimary}; }
      `}</style>

      {/* ══ Page root — layered background ══ */}
      <div style={{
        flex: 1, overflowY: 'auto', minHeight: '100vh',
        background: `
          radial-gradient(ellipse 80% 50% at 20% 20%, rgba(30,58,95,0.60) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 80%, rgba(232,212,138,0.04) 0%, transparent 50%),
          linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)
        `,
        backgroundAttachment: 'fixed',
      }}>

        {/* ══ HERO ═══════════════════════════════════════════════ */}
        <div style={{
          ...anim(0),
          background: D.glassDark,
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderBottom: `1px solid ${D.glassBorder}`,
          padding: '36px 36px 28px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative rings */}
          <div style={{ position:'absolute', top:-82, right:-82, width:280, height:280, borderRadius:'50%', border:`1px solid rgba(232,212,138,0.07)`, pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:-55, right:-55, width:190, height:190, borderRadius:'50%', border:`1px solid rgba(232,212,138,0.05)`, pointerEvents:'none' }}/>

          <div style={{ position:'relative', zIndex:1 }}>

            {/* Eyebrow — Inter 500, text-secondary */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
              <div style={{ width:'18px', height:'1px', background: D.goldMuted }}/>
              <p style={{
                fontFamily: D.fontBody,
                fontSize:'10px', fontWeight:'500',
                letterSpacing:'0.15em', textTransform:'uppercase',
                color: D.goldMuted, margin:0,
              }}>
                Panel de Control
              </p>
            </div>

            {/*
              ── MAIN HEADING — Playfair Display 700 ──────────────
              "Buenos días," in text-primary,
              attorney name in gold-primary (gold use #1 of 3 max)
            */}
            <h1 style={{
              fontFamily: D.fontDisplay,
              fontSize: '30px', fontWeight:'700',
              color: D.textPrimary,
              margin: '0 0 5px',
              textShadow: '0 2px 8px rgba(0,0,0,0.50)',
              letterSpacing: '-0.01em',
            }}>
              {greeting},&nbsp;
              <span style={{ color: D.goldPrimary }}>{displayName}</span>
            </h1>

            {/* Date — Inter 300, text-secondary */}
            <p style={{
              fontFamily: D.fontBody,
              fontSize:'13px', fontWeight:'300',
              color: D.textSecondary, margin:'0 0 22px',
              letterSpacing:'0.01em',
            }}>
              {fecha}
            </p>

            {/* Gold rule — decoration, not a gold text use */}
            <div style={{
              width:'40px', height:'2px',
              background:`linear-gradient(90deg, ${D.goldPrimary}, transparent)`,
              borderRadius:'2px',
            }}/>
          </div>
        </div>

        <div style={{ padding:'28px 36px', maxWidth:'1280px' }}>

          {/* ══ STAT CARDS ════════════════════════════════════════ */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'24px' }}>
            {metrics.map((m, i) => (
              <div
                key={m.label}
                className="lp-stat"
                style={anim(0.06 + i * 0.07)}
                onClick={() => navigate(m.path)}
              >
                {/* Icon */}
                <span style={{ fontSize:'20px', display:'block', marginBottom:'16px', opacity:0.60 }}>
                  {m.icon}
                </span>

                {/*
                  ── STAT NUMBER — Inter 800 ───────────────────────
                  Extra-bold sans-serif punches through dark glass.
                  Playfair Display is NOT used here per the typography
                  contract: numbers are data (body role → Inter).
                  Gold color: gold use #2 of 3 max.
                */}
                <p style={{
                  fontFamily: D.fontBody,
                  fontSize:'48px', fontWeight:'800',
                  color: D.goldPrimary,
                  margin:'0 0 6px', lineHeight:1,
                  fontVariantNumeric:'tabular-nums',
                  letterSpacing:'-0.03em',
                  textShadow:`0 0 28px ${D.goldGlow}`,
                }}>
                  {m.value}
                </p>

                {/*
                  ── STAT LABEL — Inter 500 uppercase ─────────────
                  Body-role label: uppercase tracking, text-secondary
                */}
                <p style={{
                  fontFamily: D.fontBody,
                  fontSize:'10px', fontWeight:'500',
                  letterSpacing:'0.10em', textTransform:'uppercase',
                  color: D.textSecondary, margin:'0 0 10px',
                }}>
                  {m.label}
                </p>

                {/*
                  ── DELTA — Inter 400, status color ──────────────
                */}
                <p style={{
                  fontFamily: D.fontBody,
                  fontSize:'12px', fontWeight:'400',
                  color: m.deltaColor, margin:0,
                }}>
                  {m.delta}
                </p>
              </div>
            ))}
          </div>

          {/* ══ LOWER GRID ════════════════════════════════════════ */}
          <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:'20px' }}>

            {/* ── Cases Panel ─────────────────────────────────── */}
            <div className="lp-panel" style={anim(0.27)}>

              <div style={{
                padding:'18px 22px 14px',
                borderBottom:`1px solid rgba(255,255,255,0.07)`,
                display:'flex', alignItems:'flex-end', justifyContent:'space-between',
              }}>
                <div>
                  {/* Eyebrow — Inter 500 */}
                  <p style={{
                    fontFamily: D.fontBody,
                    fontSize:'10px', fontWeight:'500',
                    letterSpacing:'0.12em', textTransform:'uppercase',
                    color: D.goldMuted, margin:'0 0 4px',
                  }}>
                    Expedientes
                  </p>
                  {/* Title — Playfair Display 700 */}
                  <h2 style={{
                    fontFamily: D.fontDisplay,
                    fontSize:'17px', fontWeight:'700',
                    color: D.textPrimary, margin:0,
                    textShadow:'0 1px 3px rgba(0,0,0,0.50)',
                    letterSpacing:'-0.01em',
                  }}>
                    Casos recientes
                  </h2>
                </div>
                <button className="lp-link" onClick={() => navigate('/panel/casos')}>
                  Ver todos →
                </button>
              </div>

              {DATA.casos.map((caso, i) => {
                const e = ESTADOS[caso.estado] || ESTADOS.activo
                return (
                  <div
                    key={caso.id}
                    className="lp-row"
                    style={{
                      display:'flex', alignItems:'center', gap:'14px',
                      padding:'13px 22px',
                      borderBottom: i < DATA.casos.length-1
                        ? 'border-bottom:1px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                    onClick={() => navigate(`/panel/casos/${caso.id}`)}
                  >
                    {/* Folio badge — Inter 600 */}
                    <div style={{
                      background:'rgba(255,255,255,0.05)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      borderRadius:'6px', padding:'3px 8px', flexShrink:0,
                    }}>
                      <span style={{
                        fontFamily: D.fontBody,
                        fontSize:'10px', fontWeight:'600',
                        color: D.goldMuted, letterSpacing:'0.04em',
                      }}>
                        {caso.folio}
                      </span>
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      {/* Case title — Playfair Display 700 */}
                      <p style={{
                        fontFamily: D.fontDisplay,
                        fontSize:'14px', fontWeight:'700',
                        color: D.textPrimary,
                        margin:'0 0 2px',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                        textShadow:'0 1px 2px rgba(0,0,0,0.40)',
                      }}>
                        {caso.titulo}
                      </p>
                      {/* Client — Inter 300 */}
                      <p style={{
                        fontFamily: D.fontBody,
                        fontSize:'12px', fontWeight:'300',
                        color: D.textMuted, margin:0,
                      }}>
                        {caso.cliente}
                      </p>
                    </div>

                    {/* Status badge — Inter 500 */}
                    <span style={{
                      display:'inline-flex', alignItems:'center', gap:'5px',
                      padding:'3px 10px', borderRadius:'999px',
                      background: e.bg, color: e.text,
                      border:`1px solid ${e.border}`,
                      fontFamily: D.fontBody,
                      fontSize:'11px', fontWeight:'500',
                      flexShrink:0,
                    }}>
                      <span style={{
                        width:'5px', height:'5px', borderRadius:'50%',
                        background: e.text, boxShadow:`0 0 5px ${e.text}`,
                      }}/>
                      {e.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* ── Appointments Panel ──────────────────────────── */}
            <div className="lp-panel" style={anim(0.34)}>

              <div style={{
                padding:'18px 22px 14px',
                borderBottom:`1px solid rgba(255,255,255,0.07)`,
                display:'flex', alignItems:'flex-end', justifyContent:'space-between',
              }}>
                <div>
                  <p style={{
                    fontFamily: D.fontBody,
                    fontSize:'10px', fontWeight:'500',
                    letterSpacing:'0.12em', textTransform:'uppercase',
                    color: D.goldMuted, margin:'0 0 4px',
                  }}>
                    Agenda
                  </p>
                  <h2 style={{
                    fontFamily: D.fontDisplay,
                    fontSize:'17px', fontWeight:'700',
                    color: D.textPrimary, margin:0,
                    textShadow:'0 1px 3px rgba(0,0,0,0.50)',
                    letterSpacing:'-0.01em',
                  }}>
                    Citas de hoy
                  </h2>
                </div>
                <button className="lp-link" onClick={() => navigate('/panel/agenda')}>
                  Ver agenda →
                </button>
              </div>

              {DATA.citas.map((cita, i) => {
                const cfg = CITAS_EST[cita.estado] || CITAS_EST.pendiente
                return (
                  <div
                    key={cita.id}
                    className="lp-row"
                    style={{
                      display:'flex', alignItems:'center', gap:'12px',
                      padding:'13px 22px',
                      borderBottom: i < DATA.citas.length-1
                        ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                  >
                    {/* Time — Inter 700 + 500 */}
                    <div style={{
                      minWidth:'50px', textAlign:'center', flexShrink:0,
                      background:'rgba(255,255,255,0.05)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      borderRadius:'8px', padding:'6px 4px',
                    }}>
                      <p style={{
                        fontFamily: D.fontBody,
                        fontSize:'14px', fontWeight:'700',
                        color: D.textPrimary, margin:0, lineHeight:1.2,
                        fontVariantNumeric:'tabular-nums',
                      }}>
                        {cita.hora}
                      </p>
                      <p style={{
                        fontFamily: D.fontBody,
                        fontSize:'10px', fontWeight:'500',
                        color: D.goldMuted, margin:0,
                      }}>
                        {cita.pm ? 'pm' : 'am'}
                      </p>
                    </div>

                    {/* Gold separator */}
                    <div style={{
                      width:'1px', height:'30px', flexShrink:0,
                      background:`linear-gradient(to bottom, transparent, ${D.goldMuted}, transparent)`,
                    }}/>

                    <div style={{ flex:1, minWidth:0 }}>
                      {/* Client — Inter 500 */}
                      <p style={{
                        fontFamily: D.fontBody,
                        fontSize:'13px', fontWeight:'500',
                        color: D.textPrimary, margin:'0 0 2px',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      }}>
                        {cita.cliente}
                      </p>
                      {/* Motive — Inter 300 */}
                      <p style={{
                        fontFamily: D.fontBody,
                        fontSize:'11px', fontWeight:'300',
                        color: D.textMuted, margin:0,
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      }}>
                        {cita.motivo}
                      </p>
                    </div>

                    {/* Badge — Inter 500 */}
                    <span style={{
                      display:'inline-flex', alignItems:'center', gap:'4px',
                      padding:'3px 9px', borderRadius:'999px',
                      background: cfg.bg, color: cfg.text,
                      border:`1px solid ${cfg.border}`,
                      fontFamily: D.fontBody,
                      fontSize:'10px', fontWeight:'500',
                      flexShrink:0,
                    }}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}

              {/* Footer — gold use #3 (dot only) */}
              <div style={{
                padding:'12px 22px',
                borderTop:'1px solid rgba(255,255,255,0.05)',
                background:'rgba(0,0,0,0.20)',
                display:'flex', alignItems:'center', justifyContent:'space-between',
              }}>
                <p style={{
                  fontFamily: D.fontBody,
                  fontSize:'11px', fontWeight:'300',
                  color: D.textMuted, margin:0,
                }}>
                  {DATA.citasHoy} cita{DATA.citasHoy !== 1 ? 's' : ''} programada{DATA.citasHoy !== 1 ? 's' : ''} hoy
                </p>
                <div style={{
                  width:'6px', height:'6px', borderRadius:'50%',
                  background: D.goldPrimary,
                  boxShadow:`0 0 8px ${D.goldGlow}`,
                }}/>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}