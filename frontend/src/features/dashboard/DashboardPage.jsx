import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

// ── Datos mock realistas ─────────────────────────────────────────
const mockData = {
  casosActivos: 14,
  totalCitas: 4,
  totalClientes: 31,
  pendientes: 2,
  casosRecientes: [
    { id: 1, folio: 'EXP-2025-047', titulo: 'Homicidio culposo — Acevedo',      cliente: 'Juan González Acevedo',  estado: 'urgente',     fecha: '08 ene 2025' },
    { id: 2, folio: 'EXP-2025-091', titulo: 'Demanda laboral por despido',       cliente: 'Constructora HM S.A.',   estado: 'activo',      fecha: '14 ene 2025' },
    { id: 3, folio: 'EXP-2025-112', titulo: 'Amparo contra resolución fiscal',   cliente: 'Ana Martínez Gutiérrez', estado: 'en_revision', fecha: '20 ene 2025' },
    { id: 4, folio: 'EXP-2025-134', titulo: 'Herencia y adjudicación de bienes', cliente: 'Sucesión Ramírez Peña',  estado: 'pendiente',   fecha: '03 feb 2025' },
    { id: 5, folio: 'EXP-2025-158', titulo: 'Compraventa de predio ejidal',      cliente: 'Luis R. Torres Vera',    estado: 'activo',      fecha: '10 feb 2025' },
  ],
  citasHoy: [
    { id: 1, hora: '9:00',  periodo: 'am', cliente: 'Juan González Acevedo',  motivo: 'Revisión de expediente penal', estado: 'confirmada' },
    { id: 2, hora: '11:00', periodo: 'am', cliente: 'Ana Martínez Gutiérrez', motivo: 'Firma de poder notarial',      estado: 'pendiente'  },
    { id: 3, hora: '3:00',  periodo: 'pm', cliente: 'Luis R. Torres Vera',    motivo: 'Consulta sobre escrituración', estado: 'confirmada' },
    { id: 4, hora: '5:00',  periodo: 'pm', cliente: 'Sucesión Ramírez Peña',  motivo: 'Avance de trámite sucesorio',  estado: 'pendiente'  },
  ],
}

const ESTADO = {
  activo:      { label: 'Activo',      bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  text: '#93BBFC', dot: '#3B82F6' },
  urgente:     { label: 'Urgente',     bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   text: '#FCA5A5', dot: '#EF4444' },
  pendiente:   { label: 'Pendiente',   bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  text: '#FCD34D', dot: '#F59E0B' },
  en_revision: { label: 'En revisión', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)',  text: '#C4B5FD', dot: '#8B5CF6' },
  cerrado:     { label: 'Cerrado',     bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', text: '#9CA3AF', dot: '#6B7280' },
}

const CITA_ESTADO = {
  confirmada: { label: 'Confirmada', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  text: '#93BBFC', dot: '#3B82F6' },
  pendiente:  { label: 'Pendiente',  bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  text: '#FCD34D', dot: '#F59E0B' },
  cancelada:  { label: 'Cancelada',  bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   text: '#FCA5A5', dot: '#EF4444' },
}

function Badge({ estado, config }) {
  const c = config[estado] || config.activo || config.pendiente
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: '4px', padding: '3px 8px',
      fontFamily: "'Inter', sans-serif",
      fontSize: '11px', fontWeight: '600', color: c.text,
      whiteSpace: 'nowrap', flexShrink: 0,
      letterSpacing: '0.02em',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.dot, flexShrink: 0 }}/>
      {c.label}
    </span>
  )
}

// ── SVG Icons premium (diseñados para despacho jurídico) ──────────

// Balanza de la Justicia — card de Casos
const IconBalanza = () => (
  <svg viewBox="0 0 40 40" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8C97A"/>
        <stop offset="100%" stopColor="#9A7A32"/>
      </linearGradient>
    </defs>
    {/* Base */}
    <rect x="15" y="33" width="10" height="2" rx="1" fill="url(#goldGrad1)" opacity="0.9"/>
    <rect x="19" y="27" width="2" height="6" rx="1" fill="url(#goldGrad1)" opacity="0.9"/>
    {/* Eje horizontal */}
    <rect x="6" y="14" width="28" height="1.8" rx="0.9" fill="url(#goldGrad1)" opacity="0.85"/>
    {/* Poste vertical */}
    <rect x="19" y="7" width="2" height="8" rx="1" fill="url(#goldGrad1)" opacity="0.9"/>
    {/* Pivote top */}
    <circle cx="20" cy="7" r="2" fill="url(#goldGrad1)"/>
    {/* Cadenas izq */}
    <line x1="10" y1="15" x2="8" y2="22" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.75"/>
    <line x1="10" y1="15" x2="12" y2="22" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.75"/>
    {/* Platillo izq */}
    <ellipse cx="10" cy="23" rx="5" ry="1.8" fill="url(#goldGrad1)" opacity="0.8"/>
    {/* Cadenas der */}
    <line x1="30" y1="15" x2="28" y2="22" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.75"/>
    <line x1="30" y1="15" x2="32" y2="22" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.75"/>
    {/* Platillo der */}
    <ellipse cx="30" cy="23" rx="5" ry="1.8" fill="url(#goldGrad1)" opacity="0.8"/>
  </svg>
)

// Calendario Legal — card de Citas
const IconCalendario = () => (
  <svg viewBox="0 0 40 40" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="blueGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#93BBFC"/>
        <stop offset="100%" stopColor="#3B82F6"/>
      </linearGradient>
    </defs>
    {/* Cuerpo calendario */}
    <rect x="6" y="10" width="28" height="24" rx="4" fill="url(#blueGrad1)" opacity="0.15" stroke="url(#blueGrad1)" strokeWidth="1.5" strokeOpacity="0.6"/>
    {/* Cabecera */}
    <rect x="6" y="10" width="28" height="8" rx="4" fill="url(#blueGrad1)" opacity="0.25"/>
    <rect x="6" y="14" width="28" height="4" fill="url(#blueGrad1)" opacity="0.1"/>
    {/* Argollas */}
    <rect x="13" y="7" width="2.5" height="6" rx="1.25" fill="#93BBFC" opacity="0.8"/>
    <rect x="24.5" y="7" width="2.5" height="6" rx="1.25" fill="#93BBFC" opacity="0.8"/>
    {/* Puntos de días */}
    {[
      [11,23],[16,23],[21,23],[26,23],
      [11,29],[16,29],[21,29],
    ].map(([cx,cy],i) => (
      <circle key={i} cx={cx} cy={cy} r="1.8"
        fill={i === 0 ? '#93BBFC' : 'rgba(147,187,252,0.35)'}
        stroke={i === 0 ? '#3B82F6' : 'none'}
        strokeWidth="0.8"
      />
    ))}
    {/* Línea de mes */}
    <text x="20" y="17" textAnchor="middle"
      fontFamily="Inter, sans-serif" fontSize="5" fontWeight="700"
      fill="#93BBFC" opacity="0.9" letterSpacing="1">
      HOY
    </text>
  </svg>
)

// Silueta Cliente con insignia legal — card de Clientes
const IconCliente = () => (
  <svg viewBox="0 0 40 40" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="greenGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#86EFAC"/>
        <stop offset="100%" stopColor="#16A34A"/>
      </linearGradient>
    </defs>
    {/* Torso */}
    <path d="M8 34 C8 26 12 23 20 23 C28 23 32 26 32 34"
      stroke="url(#greenGrad1)" strokeWidth="1.8" strokeOpacity="0.7"
      fill="rgba(34,197,94,0.08)" strokeLinecap="round"/>
    {/* Cabeza */}
    <circle cx="20" cy="16" r="6.5"
      fill="rgba(34,197,94,0.1)"
      stroke="url(#greenGrad1)" strokeWidth="1.6" strokeOpacity="0.75"/>
    {/* Insignia en el torso — estrella de 6 puntas pequeña */}
    <path d="M20 27 L20.8 29.4 L23.4 29.4 L21.3 30.9 L22.1 33.3 L20 31.8 L17.9 33.3 L18.7 30.9 L16.6 29.4 L19.2 29.4 Z"
      fill="rgba(34,197,94,0.5)" stroke="#86EFAC" strokeWidth="0.5" strokeOpacity="0.6"/>
  </svg>
)

export default function DashboardPage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const fechaActual = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).replace(/^\w/, c => c.toUpperCase())

  // Extrae solo nombre corto
  const nombreCorto = user?.nombre?.split(' ').slice(0, 3).join(' ') || 'Abogado'

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .dash-fade { animation: fadeUp 0.45s ease both; }

        /* ── Metric cards ── */
        .metric-card {
          background: rgba(8,20,48,0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
          position: relative; overflow: hidden;
        }
        .metric-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 44px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,168,76,0.2);
        }
        /* Top accent line */
        .metric-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:2px; border-radius:16px 16px 0 0;
        }
        .mc-gold  { border:1px solid rgba(201,168,76,0.25); }
        .mc-gold::before  { background: linear-gradient(90deg, #C9A84C 0%, rgba(201,168,76,0.2) 100%); }
        .mc-blue  { border:1px solid rgba(59,130,246,0.22); }
        .mc-blue::before  { background: linear-gradient(90deg, #3B82F6 0%, rgba(59,130,246,0.2) 100%); }
        .mc-green { border:1px solid rgba(34,197,94,0.22); }
        .mc-green::before { background: linear-gradient(90deg, #22C55E 0%, rgba(34,197,94,0.2) 100%); }

        /* ── Glass cards ── */
        .glass-card {
          background: rgba(8,20,48,0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(201,168,76,0.18);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
          overflow: hidden;
        }
        .card-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display:flex; align-items:center; justify-content:space-between;
        }
        .table-row-dash {
          display: grid; align-items:center; gap:0;
          padding: 13px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .table-row-dash:hover {
          background: rgba(201,168,76,0.04);
          border-bottom-color: rgba(201,168,76,0.08);
        }
        .table-row-dash:last-child { border-bottom:none; }
        .cita-row {
          display:flex; align-items:center; gap:12px;
          padding: 13px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s ease;
        }
        .cita-row:hover { background: rgba(255,255,255,0.02); }
        .cita-row:last-child { border-bottom:none; }
        .link-btn-d {
          fontFamily:'Inter',sans-serif; font-size:12px; font-weight:500;
          color: rgba(201,168,76,0.75); background:none; border:none;
          cursor:pointer; letter-spacing:0.3px;
          transition: all 0.15s ease;
          padding: 5px 10px; border-radius:6px;
        }
        .link-btn-d:hover { color:#E8C97A; background:rgba(201,168,76,0.08); }

        /* Uppercase label brighter */
        .card-eyebrow {
          font-family: 'Inter', sans-serif;
          font-size: 10px; font-weight: 700;
          letter-spacing: 3px; text-transform: uppercase;
          color: rgba(201,168,76,0.9);
          margin: 0 0 5px;
        }
        .card-eyebrow-blue  { color: rgba(147,187,252,0.9); }
        .card-eyebrow-green { color: rgba(134,239,172,0.9); }
      `}</style>

      {/* ── Root background ─────────────────────────────────────── */}
      <div style={{
        flex:1, overflowY:'auto', minHeight:'100vh',
        background: `
          radial-gradient(ellipse at 12% 18%, rgba(201,168,76,0.07) 0%, transparent 48%),
          radial-gradient(ellipse at 88% 82%, rgba(59,130,246,0.05) 0%, transparent 48%),
          radial-gradient(ellipse at 50% 50%, rgba(8,20,48,0.55) 0%, transparent 68%),
          linear-gradient(160deg, #020818 0%, #040d20 50%, #02050f 100%)
        `,
      }}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="dash-fade" style={{
          background: 'linear-gradient(135deg, rgba(6,16,40,0.97) 0%, rgba(12,26,56,0.92) 100%)',
          borderBottom: '1px solid rgba(201,168,76,0.14)',
          padding: '32px 40px 26px',
          position: 'relative', overflow: 'hidden',
        }}>
          {[220, 160, 110].map((s,i) => (
            <div key={i} style={{
              position:'absolute', top:-s*0.4, right:-s*0.4,
              width:s, height:s, borderRadius:'50%',
              border:`1px solid rgba(201,168,76,${0.07 - i*0.02})`,
              pointerEvents:'none',
            }}/>
          ))}

          <div style={{ position:'relative', zIndex:1 }}>
            {/* Eyebrow */}
            <p style={{
              fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:'700',
              letterSpacing:'3.5px', textTransform:'uppercase',
              color:'rgba(201,168,76,0.9)',
              margin:'0 0 10px',
            }}>
              Panel de Control
            </p>

            {/* Saludo */}
            <h1 style={{
              fontFamily:"'Playfair Display',Georgia,serif",
              fontSize:'27px', fontWeight:'700',
              color:'rgba(255,255,255,0.96)', margin:'0 0 4px',
              lineHeight:1.25,
              textShadow:'0 2px 6px rgba(0,0,0,0.35)',
            }}>
              {getGreeting()},{' '}
              {/* Nombre del Lic. en gold-primary */}
              <span style={{ color:'#C9A84C' }}>
                {nombreCorto}
              </span>
            </h1>

            {/* Fecha */}
            <p style={{
              fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:'400',
              color:'rgba(255,255,255,0.38)', margin:0,
            }}>
              {fechaActual}
            </p>

            <div style={{
              width:'44px', height:'2px', marginTop:'18px',
              background:'linear-gradient(90deg,#C9A84C,rgba(201,168,76,0.1))',
              borderRadius:'2px',
            }}/>
          </div>
        </div>

        <div style={{ padding:'28px 40px', maxWidth:'1300px' }}>

          {/* ── Métricas ─────────────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'24px' }}>

            {/* Card 1 — Casos (gold) */}
            <div className="metric-card mc-gold dash-fade" style={{ animationDelay:'0.06s' }}
                 onClick={() => navigate('/panel/casos')}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'18px' }}>
                <p className="card-eyebrow">Casos activos</p>
                {/* SVG Balanza premium */}
                <div style={{
                  width:'48px', height:'48px', borderRadius:'12px',
                  background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.18)',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                }}>
                  <IconBalanza/>
                </div>
              </div>
              {/* Número en Inter extra-bold */}
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'48px', fontWeight:'800',
                color:'rgba(255,255,255,0.96)', margin:'0 0 7px', lineHeight:1,
                letterSpacing:'-1px',
              }}>14</p>
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:'500',
                color:'rgba(201,168,76,0.72)', margin:0,
              }}>
                +2 expedientes este mes
              </p>
            </div>

            {/* Card 2 — Citas (blue) */}
            <div className="metric-card mc-blue dash-fade" style={{ animationDelay:'0.14s' }}
                 onClick={() => navigate('/panel/agenda')}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'18px' }}>
                <p className="card-eyebrow card-eyebrow-blue">Citas hoy</p>
                <div style={{
                  width:'48px', height:'48px', borderRadius:'12px',
                  background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                }}>
                  <IconCalendario/>
                </div>
              </div>
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'48px', fontWeight:'800',
                color:'rgba(255,255,255,0.96)', margin:'0 0 7px', lineHeight:1,
                letterSpacing:'-1px',
              }}>{mockData.totalCitas}</p>
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:'500',
                color:'rgba(147,187,252,0.72)', margin:0,
              }}>
                Próxima: 9:00 am · Juan González
              </p>
            </div>

            {/* Card 3 — Clientes (green) */}
            <div className="metric-card mc-green dash-fade" style={{ animationDelay:'0.22s' }}
                 onClick={() => navigate('/panel/clientes')}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'18px' }}>
                <p className="card-eyebrow card-eyebrow-green">Clientes</p>
                <div style={{
                  width:'48px', height:'48px', borderRadius:'12px',
                  background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                }}>
                  <IconCliente/>
                </div>
              </div>
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'48px', fontWeight:'800',
                color:'rgba(255,255,255,0.96)', margin:'0 0 7px', lineHeight:1,
                letterSpacing:'-1px',
              }}>{mockData.totalClientes}</p>
              {mockData.pendientes > 0 ? (
                <p style={{
                  fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:'500',
                  color:'rgba(252,211,77,0.80)', margin:0,
                }}>
                  ⚠ {mockData.pendientes} pendiente{mockData.pendientes > 1 ? 's' : ''} de aprobación
                </p>
              ) : (
                <p style={{
                  fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:'500',
                  color:'rgba(134,239,172,0.72)', margin:0,
                }}>
                  +3 nuevos esta semana
                </p>
              )}
            </div>
          </div>

          {/* ── Grid inferior ─────────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'1.45fr 1fr', gap:'20px' }}>

            {/* Casos recientes */}
            <div className="glass-card dash-fade" style={{ animationDelay:'0.30s' }}>
              <div className="card-header">
                <div>
                  <p style={{
                    fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:'700',
                    letterSpacing:'3px', textTransform:'uppercase',
                    color:'rgba(201,168,76,0.9)', margin:'0 0 5px',
                  }}>Expedientes</p>
                  <h2 style={{
                    fontFamily:"'Playfair Display',serif", fontSize:'17px', fontWeight:'700',
                    color:'rgba(255,255,255,0.93)', margin:0,
                    textShadow:'0 1px 4px rgba(0,0,0,0.3)',
                  }}>Casos recientes</h2>
                </div>
                <button className="link-btn-d" onClick={() => navigate('/panel/casos')}>
                  Ver todos →
                </button>
              </div>

              {/* Table header */}
              <div style={{
                display:'grid', gridTemplateColumns:'96px 1fr 104px',
                padding:'10px 24px 8px',
                borderBottom:'1px solid rgba(255,255,255,0.05)',
              }}>
                {['Folio','Asunto / Cliente','Estado'].map(h => (
                  <p key={h} style={{
                    fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:'700',
                    letterSpacing:'0.09em', textTransform:'uppercase',
                    color:'rgba(201,168,76,0.65)', margin:0,
                  }}>{h}</p>
                ))}
              </div>

              {mockData.casosRecientes.map(caso => (
                <div key={caso.id} className="table-row-dash"
                  style={{ gridTemplateColumns:'96px 1fr 104px' }}
                  onClick={() => navigate(`/panel/casos/${caso.id}`)}>
                  {/* Folio */}
                  <p style={{
                    fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:'700',
                    color:'rgba(201,168,76,0.85)', margin:0, letterSpacing:'0.4px',
                  }}>{caso.folio}</p>
                  {/* Asunto + Cliente */}
                  <div style={{ minWidth:0, paddingRight:'12px' }}>
                    <p style={{
                      fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:'500',
                      color:'rgba(255,255,255,0.88)', margin:'0 0 2px',
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    }}>{caso.titulo}</p>
                    <p style={{
                      fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:'400',
                      color:'rgba(255,255,255,0.38)', margin:0,
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    }}>{caso.cliente}</p>
                  </div>
                  {/* Badge */}
                  <div style={{ display:'flex', alignItems:'center' }}>
                    <Badge estado={caso.estado} config={ESTADO}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Citas del día */}
            <div className="glass-card dash-fade" style={{ animationDelay:'0.38s' }}>
              <div className="card-header">
                <div>
                  <p style={{
                    fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:'700',
                    letterSpacing:'3px', textTransform:'uppercase',
                    color:'rgba(201,168,76,0.9)', margin:'0 0 5px',
                  }}>Agenda</p>
                  <h2 style={{
                    fontFamily:"'Playfair Display',serif", fontSize:'17px', fontWeight:'700',
                    color:'rgba(255,255,255,0.93)', margin:0,
                    textShadow:'0 1px 4px rgba(0,0,0,0.3)',
                  }}>Citas de hoy</h2>
                </div>
                <button className="link-btn-d" onClick={() => navigate('/panel/agenda')}>
                  Ver agenda →
                </button>
              </div>

              {mockData.citasHoy.map((cita) => {
                const cfg = CITA_ESTADO[cita.estado] || CITA_ESTADO.pendiente
                return (
                  <div key={cita.id} className="cita-row">
                    {/* Hora pill */}
                    <div style={{
                      minWidth:'56px', textAlign:'center',
                      background:'rgba(255,255,255,0.04)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      borderRadius:'8px', padding:'6px 8px', flexShrink:0,
                    }}>
                      <p style={{
                        fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:'700',
                        color:'rgba(255,255,255,0.9)', margin:0, lineHeight:1.2,
                      }}>{cita.hora}</p>
                      <p style={{
                        fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:'600',
                        color:'rgba(201,168,76,0.8)', margin:0, letterSpacing:'0.5px',
                      }}>{cita.periodo}</p>
                    </div>

                    {/* Línea divisora champagne */}
                    <div style={{
                      width:'1px', height:'32px', flexShrink:0,
                      background:'linear-gradient(to bottom, transparent, rgba(201,168,76,0.45), transparent)',
                    }}/>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{
                        fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:'500',
                        color:'rgba(255,255,255,0.86)', margin:'0 0 2px',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      }}>{cita.cliente}</p>
                      <p style={{
                        fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:'400',
                        color:'rgba(255,255,255,0.36)', margin:0,
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      }}>{cita.motivo}</p>
                    </div>

                    <Badge estado={cita.estado} config={CITA_ESTADO}/>
                  </div>
                )
              })}

              {/* Footer */}
              <div style={{
                padding:'12px 24px',
                borderTop:'1px solid rgba(255,255,255,0.05)',
                background:'rgba(4,12,32,0.5)',
                display:'flex', alignItems:'center', justifyContent:'space-between',
              }}>
                <p style={{
                  fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:'400',
                  color:'rgba(255,255,255,0.28)', margin:0,
                }}>
                  {mockData.totalCitas} citas · {new Date().toLocaleDateString('es-MX', { day:'numeric', month:'short' })}
                </p>
                <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
                  {mockData.citasHoy.map(c => (
                    <div key={c.id} style={{
                      width:'6px', height:'6px', borderRadius:'50%',
                      background: CITA_ESTADO[c.estado]?.dot || '#6B7280',
                      opacity: 0.85,
                    }}/>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}