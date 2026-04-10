import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getCasos }    from '../cases/casesService'
import { getClientes } from '../clients/clientsService'
import { getCitas }    from '../appointments/appointmentsService'
import api             from '../../services/axios.config'
import { Scale, CalendarDays, Users } from 'lucide-react'

const toLocalStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

function parseHora(horaStr) {
  if (!horaStr) return { hora: '--', periodo: '' }
  const [h, m] = horaStr.split(':').map(Number)
  const periodo = h < 12 ? 'am' : 'pm'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return { hora: m === 0 ? `${h12}:00` : `${h12}:${String(m).padStart(2,'0')}`, periodo }
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

// ── Colores de iconos para tarjetas (navy bg + gold icon) ─────────
const CARD_ICON_STYLE = {
  wrapper: {
    width: '48px', height: '48px', borderRadius: '12px',
    background: 'rgba(8,20,48,0.55)',
    border: '1px solid rgba(197,160,89,0.22)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  color: '#c5a059',
}

export default function DashboardPage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [visible, setVisible] = useState(false)

  const [stats, setStats] = useState({
    casosActivos:  0,
    totalClientes: 0,
    citasHoyCount: 0,
    pendientes:    0,
  })
  const [casosRecientes, setCasosRecientes] = useState([])
  const [citasHoy,       setCitasHoy]       = useState([])
  const [proximaCita,    setProximaCita]     = useState(null)
  const [loading,        setLoading]         = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const hoy = toLocalStr(new Date())

    Promise.allSettled([
      api.get('/stats/dashboard'),
      getCasos({ limit: 1000 }),
      getClientes({ limit: 1000 }),
      getCitas({ limit: 1000 }),
    ]).then(([rStats, rCasos, rClientes, rCitas]) => {
      const statsData = rStats.status === 'fulfilled' ? rStats.value.data : {}
      const casos    = rCasos.status    === 'fulfilled' ? (rCasos.value.data.casos       || []) : []
      const clientes = rClientes.status === 'fulfilled' ? (rClientes.value.data.clientes || []) : []
      const citas    = rCitas.status    === 'fulfilled' ? (rCitas.value.data.citas       || []) : []

      // Mapa id → nombre de cliente
      const clienteMap = {}
      clientes.forEach(c => { clienteMap[c.id_cliente] = c.nombre })

      // Métricas — conteos exactos desde /api/stats/dashboard
      const casosActivos = statsData.casosActivos  ?? casos.filter(c => c.estado !== 'cerrado').length
      const pendientes   = statsData.pendientes    ?? 0

      // Citas de hoy
      const citasDeHoy = citas
        .filter(c => c.fecha === hoy)
        .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
        .map(c => {
          const { hora, periodo } = parseHora(c.hora)
          return {
            id:      c.id_cita,
            hora,
            periodo,
            cliente: clienteMap[c.id_cliente] || c.nombre_cliente || 'Cliente',
            motivo:  c.motivo || '—',
            estado:  c.estado,
          }
        })

      // Próxima cita de hoy
      const ahora = new Date()
      const horaActual = `${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`
      const proxima = citas
        .filter(c => c.fecha === hoy && (c.hora || '') >= horaActual && c.estado !== 'cancelada')
        .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))[0]

      // Casos recientes — últimos 5
      const recientes = [...casos]
        .sort((a, b) => new Date(b.fecha_apertura || 0) - new Date(a.fecha_apertura || 0))
        .slice(0, 5)
        .map(c => ({
          id:      c.id_caso,
          folio:   c.folio,
          titulo:  c.asunto,
          cliente: clienteMap[c.id_cliente] || '—',
          estado:  c.estado,
        }))

      setStats({
        casosActivos,
        totalClientes: statsData.totalClientes ?? clientes.length,
        citasHoyCount: statsData.citasHoy      ?? citasDeHoy.length,
        pendientes,
      })
      setCasosRecientes(recientes)
      setCitasHoy(citasDeHoy)
      setProximaCita(proxima || null)
      setLoading(false)
    })
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
                <div style={CARD_ICON_STYLE.wrapper}>
                  <Scale size={22} color={CARD_ICON_STYLE.color} strokeWidth={1.6}/>
                </div>
              </div>
              {/* Número en Inter extra-bold */}
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'48px', fontWeight:'800',
                color:'rgba(255,255,255,0.96)', margin:'0 0 7px', lineHeight:1,
                letterSpacing:'-1px',
              }}>{loading ? '—' : stats.casosActivos}</p>
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:'500',
                color:'rgba(201,168,76,0.72)', margin:0,
              }}>
                Casos sin cerrar
              </p>
            </div>

            {/* Card 2 — Citas (blue) */}
            <div className="metric-card mc-blue dash-fade" style={{ animationDelay:'0.14s' }}
                 onClick={() => navigate('/panel/agenda')}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'18px' }}>
                <p className="card-eyebrow card-eyebrow-blue">Citas hoy</p>
                <div style={CARD_ICON_STYLE.wrapper}>
                  <CalendarDays size={22} color={CARD_ICON_STYLE.color} strokeWidth={1.6}/>
                </div>
              </div>
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'48px', fontWeight:'800',
                color:'rgba(255,255,255,0.96)', margin:'0 0 7px', lineHeight:1,
                letterSpacing:'-1px',
              }}>{loading ? '—' : stats.citasHoyCount}</p>
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:'500',
                color:'rgba(147,187,252,0.72)', margin:0,
              }}>
                {proximaCita
                  ? `Próxima: ${parseHora(proximaCita.hora).hora} ${parseHora(proximaCita.hora).periodo}`
                  : 'Sin citas pendientes hoy'}
              </p>
            </div>

            {/* Card 3 — Clientes (green) */}
            <div className="metric-card mc-green dash-fade" style={{ animationDelay:'0.22s' }}
                 onClick={() => navigate('/panel/clientes')}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'18px' }}>
                <p className="card-eyebrow card-eyebrow-green">Clientes</p>
                <div style={CARD_ICON_STYLE.wrapper}>
                  <Users size={22} color={CARD_ICON_STYLE.color} strokeWidth={1.6}/>
                </div>
              </div>
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'48px', fontWeight:'800',
                color:'rgba(255,255,255,0.96)', margin:'0 0 7px', lineHeight:1,
                letterSpacing:'-1px',
              }}>{loading ? '—' : stats.totalClientes}</p>
              {stats.pendientes > 0 ? (
                <p style={{
                  fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:'500',
                  color:'rgba(252,211,77,0.80)', margin:0,
                }}>
                  ⚠ {stats.pendientes} pendiente{stats.pendientes > 1 ? 's' : ''} de aprobación
                </p>
              ) : (
                <p style={{
                  fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:'500',
                  color:'rgba(134,239,172,0.72)', margin:0,
                }}>
                  Total de clientes registrados
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

              {casosRecientes.length === 0 && !loading && (
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.3)',padding:'20px 24px',margin:0}}>
                  Sin casos registrados
                </p>
              )}
              {casosRecientes.map(caso => (
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

              {citasHoy.length === 0 && !loading && (
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.3)',padding:'20px 24px',margin:0}}>
                  Sin citas para hoy
                </p>
              )}
              {citasHoy.map((cita) => {
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
                  {stats.citasHoyCount} citas · {new Date().toLocaleDateString('es-MX', { day:'numeric', month:'short' })}
                </p>
                <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
                  {citasHoy.map(c => (
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