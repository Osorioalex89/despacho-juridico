import { useState, useEffect, useRef } from 'react'
import { getCitas, updateEstadoCita, deleteCita } from './appointmentsService'
import { getClientes } from '../clients/clientsService'
import CitaModal from './CitaModal'
import {
  ChevronLeft, ChevronRight, Plus,
  Check, X, Trash2, Clock,
  AlertCircle, CheckCircle, XCircle,
  Edit3, User, CalendarDays
} from 'lucide-react'
import { useToast, Toast } from '../../components/ui/Toast'

// ── Constantes ────────────────────────────────────────────────────
const DIAS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MESES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_L = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

// ── Estado config ─────────────────────────────────────────────────
const ESTADO_CFG = {
  pendiente:  {
    label: 'Pendiente',
    bg:     'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.28)',
    text:   '#FCD34D',
    dot:    '#F59E0B',
    cardBg: 'rgba(245,158,11,0.06)',
    cardBorder: 'rgba(245,158,11,0.18)',
    icon: AlertCircle,
  },
  confirmada: {
    label: 'Confirmada',
    bg:     'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.28)',
    text:   '#86EFAC',
    dot:    '#22C55E',
    cardBg: 'rgba(34,197,94,0.06)',
    cardBorder: 'rgba(34,197,94,0.18)',
    icon: CheckCircle,
  },
  cancelada: {
    label: 'Cancelada',
    bg:     'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.28)',
    text:   '#FCA5A5',
    dot:    '#EF4444',
    cardBg: 'rgba(239,68,68,0.06)',
    cardBorder: 'rgba(239,68,68,0.18)',
    icon: XCircle,
  },
}

// ── Helpers ───────────────────────────────────────────────────────
function formatHora(hora) {
  if (!hora) return ''
  const [h, m] = hora.split(':')
  const n = parseInt(h)
  return `${n > 12 ? n - 12 : n || 12}:${m} ${n >= 12 ? 'pm' : 'am'}`
}

function toFechaStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

function Badge({ estado }) {
  const c = ESTADO_CFG[estado] || ESTADO_CFG.pendiente
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: '4px', padding: '3px 9px',
      fontFamily: "'Inter',sans-serif",
      fontSize: '11px', fontWeight: '600', color: c.text,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <span style={{ width:'5px', height:'5px', borderRadius:'50%', background: c.dot }}/>
      {c.label}
    </span>
  )
}

// ── SVG Icono Balanza para empty state ────────────────────────────
const IconCalendarEmpty = () => (
  <svg viewBox="0 0 56 56" width="52" height="52" fill="none">
    <defs>
      <linearGradient id="ag-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8C97A"/>
        <stop offset="100%" stopColor="#9A7A32"/>
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="rgba(201,168,76,0.08)" stroke="rgba(201,168,76,0.2)" strokeWidth="1"/>
    <rect x="12" y="16" width="32" height="26" rx="5"
      fill="none" stroke="url(#ag-gold)" strokeWidth="1.5" strokeOpacity="0.7"/>
    <rect x="12" y="16" width="32" height="9" rx="5"
      fill="rgba(201,168,76,0.12)"/>
    <rect x="12" y="21" width="32" height="4" fill="rgba(201,168,76,0.06)"/>
    <rect x="17" y="12" width="3" height="8" rx="1.5" fill="url(#ag-gold)" opacity="0.8"/>
    <rect x="36" y="12" width="3" height="8" rx="1.5" fill="url(#ag-gold)" opacity="0.8"/>
    {[[19,31],[25,31],[31,31],[37,31],[19,37],[25,37],[31,37]].map(([cx,cy],i)=>(
      <circle key={i} cx={cx} cy={cy} r="2"
        fill={i===0?'rgba(201,168,76,0.6)':'rgba(255,255,255,0.15)'}/>
    ))}
    <text x="28" y="23" textAnchor="middle"
      fontFamily="Inter,sans-serif" fontSize="5.5" fontWeight="700"
      fill="rgba(201,168,76,0.8)" letterSpacing="0.5">HOY</text>
  </svg>
)

const toLocalStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

export default function AgendaPage() {
  const { toast, showToast } = useToast()
  const hoy = new Date()

  const [año,        setAño]        = useState(hoy.getFullYear())
  const [mes,        setMes]        = useState(hoy.getMonth())
  const [diaSelecto, setDiaSelecto] = useState(toLocalStr(hoy))
  const [citas,      setCitas]      = useState([])
  const [clientes,   setClientes]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [loadingDay, setLoadingDay] = useState(false)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [citaEdit,   setCitaEdit]   = useState(null)
  const [panelKey,   setPanelKey]   = useState(0) // animación al cambiar día

  // ── Fetch data ──────────────────────────────────────────────────
  const fetchCitas = async () => {
    setLoading(true)
    try {
      const res = await getCitas({ limit: 300 })
      setCitas(res.data.citas)
    } catch { console.error('Error al cargar citas') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchCitas()
    getClientes({ limit: 200 }).then(r => setClientes(r.data.clientes)).catch(()=>{})
  }, [])

  // ── Citas del día seleccionado ──────────────────────────────────
  const citasDelDia = citas
    .filter(c => c.fecha === diaSelecto)
    .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))

  const pendientes  = citasDelDia.filter(c => c.estado === 'pendiente').length
  const confirmadas = citasDelDia.filter(c => c.estado === 'confirmada').length
  const canceladas  = citasDelDia.filter(c => c.estado === 'cancelada').length

  // ── Calendario helpers ──────────────────────────────────────────
  const diasEnMes    = new Date(año, mes + 1, 0).getDate()
  const primerDiaSem = new Date(año, mes, 1).getDay()

  const citasPorDia = (d) =>
    citas.filter(c => c.fecha === toFechaStr(año, mes, d))

  const navMes = (dir) => {
    let nm = mes + dir, na = año
    if (nm < 0)  { nm = 11; na-- }
    if (nm > 11) { nm = 0;  na++ }
    setMes(nm); setAño(na)
  }

  const seleccionarDia = (d) => {
    const f = toFechaStr(año, mes, d)
    if (f === diaSelecto) return
    setLoadingDay(true)
    setDiaSelecto(f)
    setPanelKey(k => k + 1)
    setTimeout(() => setLoadingDay(false), 200)
  }

  const esHoy   = (d) => d === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear()
  const esSel   = (d) => toFechaStr(año, mes, d) === diaSelecto

  // ── Acciones ────────────────────────────────────────────────────
  const handleEstado = async (id, estado) => {
    try { await updateEstadoCita(id, estado); fetchCitas() }
    catch { showToast('Error al actualizar') }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta cita?')) return
    try { await deleteCita(id); fetchCitas() }
    catch { showToast('Error al eliminar') }
  }

  const abrirNueva = () => { setCitaEdit(null); setModalOpen(true) }
  const abrirEdit  = (c)  => { setCitaEdit(c);  setModalOpen(true) }
  const onGuardado = ()   => { setModalOpen(false); fetchCitas() }

  // ── Fecha formateada del día seleccionado ───────────────────────
  const fechaObj     = new Date(diaSelecto + 'T12:00:00')
  const diaNumero    = fechaObj.getDate()
  const nombreDia    = DIAS_L[fechaObj.getDay()]
  const nombreMesDay = MESES[fechaObj.getMonth()]
  const añoDay       = fechaObj.getFullYear()

  // ── Nombre del cliente ──────────────────────────────────────────
  const getNombreCliente = (id) =>
    clientes.find(c => c.id_cliente === id)?.nombre || null

  return (
    <>
      <Toast toast={toast} />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .ag-fade  { animation: fadeUp 0.4s ease both; }
        .ag-panel { animation: fadeIn 0.25s ease both; }

        /* ── Día del calendario ── */
        .ag-day {
          position: relative;
          width: 34px; height: 34px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.65);
          margin: 0 auto;
          border: 1.5px solid transparent;
        }
        .ag-day:hover:not(.selected):not(.today) {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.9);
        }
        .ag-day.today {
          background: rgba(201,168,76,0.15);
          border-color: rgba(201,168,76,0.45);
          color: #E8C97A;
          font-weight: 700;
        }
        .ag-day.selected {
          background: linear-gradient(135deg,#C9A84C,#9A7A32);
          border-color: transparent;
          color: #020818;
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(201,168,76,0.35);
        }
        .ag-day.has-cita .dot-row {
          display: flex; gap: 2px;
          position: absolute; bottom: 3px;
        }
        .ag-day:not(.has-cita) .dot-row { display: none; }

        /* ── Cita card ── */
        .cita-card {
          border-radius: 12px;
          padding: 16px 18px;
          transition: all 0.2s ease;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .cita-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.4);
        }

        /* ── Action buttons ── */
        .ag-action {
          width: 28px; height: 28px; border-radius: 7px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s ease;
          color: rgba(255,255,255,0.4);
          flex-shrink: 0;
        }
        .ag-action:hover.confirm { background:rgba(34,197,94,0.12); border-color:rgba(34,197,94,0.3); color:#86EFAC; }
        .ag-action:hover.cancel  { background:rgba(245,158,11,0.12); border-color:rgba(245,158,11,0.3); color:#FCD34D; }
        .ag-action:hover.edit    { background:rgba(201,168,76,0.12); border-color:rgba(201,168,76,0.28); color:#E8C97A; }
        .ag-action:hover.del     { background:rgba(239,68,68,0.12); border-color:rgba(239,68,68,0.3);  color:#FCA5A5; }

        /* ── Nav month button ── */
        .ag-nav {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s ease;
          color: rgba(255,255,255,0.55);
        }
        .ag-nav:hover { background:rgba(201,168,76,0.1); border-color:rgba(201,168,76,0.25); color:#E8C97A; }

        /* ── Primary button ── */
        .ag-btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 8px;
          background: linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%);
          border: none; color: #020818;
          font-family: 'Inter',sans-serif; font-size: 12px; font-weight: 700;
          cursor: pointer; transition: all 0.15s ease;
        }
        .ag-btn-primary:hover {
          background: linear-gradient(135deg,#E8C97A 0%,#C9A84C 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(201,168,76,0.3);
        }

        /* ── Skeleton ── */
        .ag-skeleton {
          background: linear-gradient(90deg,
            rgba(255,255,255,0.04) 0%,
            rgba(255,255,255,0.08) 50%,
            rgba(255,255,255,0.04) 100%);
          background-size: 400px 100%;
          animation: shimmer 1.4s ease infinite;
          border-radius: 6px;
        }

        /* ── Stat mini cards ── */
        .stat-mini {
          flex: 1;
          border-radius: 10px;
          padding: 12px 14px;
          transition: all 0.2s ease;
        }
      `}</style>

      {/* ── Root ───────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        minHeight: '100vh', overflow: 'hidden',
        background: `
          radial-gradient(ellipse at 8% 20%, rgba(201,168,76,0.06) 0%, transparent 48%),
          radial-gradient(ellipse at 92% 80%, rgba(59,130,246,0.04) 0%, transparent 48%),
          linear-gradient(160deg,#020818 0%,#040d20 50%,#02050f 100%)
        `,
      }}>

        {/* ── Page Header ────────────────────────────────────── */}
        <div className="ag-fade" style={{
          background: 'linear-gradient(135deg,rgba(6,16,40,0.97) 0%,rgba(12,26,56,0.9) 100%)',
          borderBottom: '1px solid rgba(201,168,76,0.14)',
          padding: '22px 32px 18px',
          position: 'relative', overflow: 'hidden', flexShrink: 0,
        }}>
          {[160,110].map((s,i) => (
            <div key={i} style={{
              position:'absolute', top:-s*0.4, right:-s*0.4,
              width:s, height:s, borderRadius:'50%',
              border:`1px solid rgba(201,168,76,${0.06-i*0.02})`,
              pointerEvents:'none',
            }}/>
          ))}
          <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
            <div>
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:'700',
                letterSpacing:'3px', textTransform:'uppercase',
                color:'rgba(201,168,76,0.85)', margin:'0 0 6px',
              }}>Agenda del Despacho</p>
              <h1 style={{
                fontFamily:"'Playfair Display',Georgia,serif",
                fontSize:'24px', fontWeight:'700',
                color:'rgba(255,255,255,0.96)', margin:'0 0 3px',
                textShadow:'0 2px 6px rgba(0,0,0,0.35)',
              }}>Calendario de Citas</h1>
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'12px',
                color:'rgba(255,255,255,0.35)', margin:0,
              }}>
                {citas.length} cita{citas.length !== 1 ? 's' : ''} registrada{citas.length !== 1 ? 's' : ''} en total
              </p>
            </div>
            <button className="ag-btn-primary" onClick={abrirNueva}>
              <Plus size={14}/> Nueva cita
            </button>
          </div>
          <div style={{
            position:'absolute', bottom:0, left:'32px',
            width:'44px', height:'1px',
            background:'linear-gradient(90deg,rgba(201,168,76,0.55),transparent)',
          }}/>
        </div>

        {/* ── SPLIT LAYOUT ───────────────────────────────────── */}
        <div style={{
          flex: 1, display: 'flex', overflow: 'hidden',
          gap: 0,
        }}>

          {/* ════════════════════════════════════════════════════
              IZQUIERDA — Calendario (30%)
          ════════════════════════════════════════════════════ */}
          <div style={{
            width: '300px', flexShrink: 0,
            background: 'rgba(4,12,32,0.85)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(201,168,76,0.12)',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
          }}>

            {/* Nav mes */}
            <div style={{
              padding: '18px 18px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <button className="ag-nav" onClick={() => navMes(-1)}>
                <ChevronLeft size={15}/>
              </button>
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily:"'Playfair Display',serif",
                  fontSize: '16px', fontWeight: '700',
                  color: 'rgba(255,255,255,0.92)', margin: '0 0 1px',
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} translate="no">
                  {MESES[mes]}
                </p>
                <p style={{
                  fontFamily:"'Inter',sans-serif",
                  fontSize: '11px', fontWeight: '500',
                  color: 'rgba(201,168,76,0.6)', margin: 0,
                }}>
                  {año}
                </p>
              </div>
              <button className="ag-nav" onClick={() => navMes(1)}>
                <ChevronRight size={15}/>
              </button>
            </div>

            {/* Días semana */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(7,1fr)',
              padding: '12px 14px 6px',
            }}>
              {DIAS.map(d => (
                <div key={d} style={{
                  textAlign: 'center',
                  fontFamily: "'Inter',sans-serif",
                  fontSize: '10px', fontWeight: '700',
                  color: 'rgba(201,168,76,0.5)',
                  letterSpacing: '0.5px',
                  paddingBottom: '4px',
                }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid días */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(7,1fr)',
              padding: '4px 14px 16px',
              rowGap: '4px',
            }}>
              {/* Celdas vacías */}
              {[...Array(primerDiaSem)].map((_,i) => <div key={`e${i}`}/>)}

              {/* Días del mes */}
              {[...Array(diasEnMes)].map((_,i) => {
                const d      = i + 1
                const citDs  = citasPorDia(d)
                const tieneC = citDs.length > 0
                const hoyD   = esHoy(d)
                const selD   = esSel(d)

                // Máximo 3 dots
                const dots = citDs.slice(0, 3).map(c => ESTADO_CFG[c.estado]?.dot || '#6B7280')

                return (
                  <div
                    key={d}
                    className={`ag-day${hoyD ? ' today' : ''}${selD ? ' selected' : ''}${tieneC ? ' has-cita' : ''}`}
                    onClick={() => seleccionarDia(d)}
                  >
                    {d}
                    {tieneC && (
                      <div className="dot-row">
                        {dots.map((color, di) => (
                          <span key={di} style={{
                            width: '4px', height: '4px', borderRadius: '50%',
                            background: selD ? 'rgba(2,8,24,0.7)' : color,
                            flexShrink: 0,
                          }}/>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── Resumen del mes ────────────────────────────── */}
            <div style={{
              margin: '0 14px 16px',
              background: 'rgba(8,20,48,0.6)',
              border: '1px solid rgba(201,168,76,0.1)',
              borderRadius: '12px',
              padding: '14px',
            }}>
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'9px', fontWeight:'700',
                letterSpacing:'2px', textTransform:'uppercase',
                color:'rgba(201,168,76,0.55)', margin:'0 0 10px',
              }}>
                Este mes
              </p>
              {[
                { estado: 'pendiente',  label: 'Pendientes' },
                { estado: 'confirmada', label: 'Confirmadas' },
                { estado: 'cancelada',  label: 'Canceladas'  },
              ].map(({ estado, label }) => {
                const count = citas.filter(c => {
                  const d = new Date(c.fecha + 'T12:00:00')
                  return c.estado === estado && d.getMonth() === mes && d.getFullYear() === año
                }).length
                const cfg = ESTADO_CFG[estado]
                return (
                  <div key={estado} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 0',
                    borderBottom: estado !== 'cancelada' ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                      <span style={{
                        width:'6px', height:'6px', borderRadius:'50%',
                        background: cfg.dot, flexShrink:0,
                      }}/>
                      <span style={{
                        fontFamily:"'Inter',sans-serif", fontSize:'12px',
                        color:'rgba(255,255,255,0.55)',
                      }}>{label}</span>
                    </div>
                    <span style={{
                      fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:'700',
                      color: count > 0 ? cfg.text : 'rgba(255,255,255,0.25)',
                    }}>{count}</span>
                  </div>
                )
              })}
            </div>

            {/* Botón ir a hoy */}
            <div style={{ padding: '0 14px 18px' }}>
              <button
                onClick={() => {
                  setAño(hoy.getFullYear())
                  setMes(hoy.getMonth())
                  seleccionarDia(hoy.getDate())
                }}
                style={{
                  width: '100%', padding: '8px',
                  borderRadius: '9px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.45)',
                  fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:'500',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  letterSpacing: '0.3px',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(201,168,76,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'
                  e.currentTarget.style.color = 'rgba(201,168,76,0.8)'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
                }}
              >
                Ir a hoy
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════
              DERECHA — Detalle del día (70%)
          ════════════════════════════════════════════════════ */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            overflowY: 'auto', padding: '24px 28px',
          }}>

            {/* key fuerza re-render con animación al cambiar día */}
            <div key={panelKey} className="ag-panel">

              {/* ── Encabezado del día ───────────────────────── */}
              <div style={{
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', flexWrap: 'wrap',
                gap: '12px', marginBottom: '20px',
              }}>
                <div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'10px', flexWrap:'wrap' }}>
                    <h2 style={{
                      fontFamily:"'Playfair Display',serif",
                      fontSize:'24px', fontWeight:'700',
                      color:'rgba(255,255,255,0.95)', margin:0,
                      textShadow:'0 2px 5px rgba(0,0,0,0.3)',
                    }} translate="no">
                      {nombreDia}, {diaNumero} de {nombreMesDay}
                    </h2>
                    {/* Indicador "hoy" */}
                    {diaSelecto === toLocalStr(hoy) && (
                      <span style={{
                        fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:'700',
                        letterSpacing:'2px', textTransform:'uppercase',
                        background:'rgba(201,168,76,0.15)',
                        border:'1px solid rgba(201,168,76,0.3)',
                        color:'rgba(201,168,76,0.9)',
                        padding:'3px 9px', borderRadius:'20px',
                      }}>Hoy</span>
                    )}
                  </div>
                  <p style={{
                    fontFamily:"'Inter',sans-serif", fontSize:'13px',
                    color:'rgba(255,255,255,0.38)', margin:'5px 0 0',
                  }}>
                    {añoDay} · {citasDelDia.length === 0
                      ? 'Sin citas programadas'
                      : `${citasDelDia.length} cita${citasDelDia.length !== 1 ? 's' : ''} programada${citasDelDia.length !== 1 ? 's' : ''}`
                    }
                  </p>
                </div>
              </div>

              {/* ── Mini stat cards ──────────────────────────── */}
              {citasDelDia.length > 0 && (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                  gap: '10px', marginBottom: '20px',
                }}>
                  {[
                    { label:'Pendientes',  count: pendientes,  cfg: ESTADO_CFG.pendiente,  icon: AlertCircle  },
                    { label:'Confirmadas', count: confirmadas, cfg: ESTADO_CFG.confirmada, icon: CheckCircle  },
                    { label:'Canceladas',  count: canceladas,  cfg: ESTADO_CFG.cancelada,  icon: XCircle      },
                  ].map(({ label, count, cfg, icon: Icon }) => (
                    <div
                      key={label}
                      className="stat-mini"
                      style={{
                        background: count > 0 ? cfg.cardBg : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${count > 0 ? cfg.cardBorder : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: count > 0 ? `0 4px 16px rgba(0,0,0,0.25)` : 'none',
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                        <p style={{
                          fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:'700',
                          letterSpacing:'1.8px', textTransform:'uppercase',
                          color: count > 0 ? cfg.text : 'rgba(255,255,255,0.28)',
                          margin:0, transition:'color 0.2s',
                        }}>{label}</p>
                        <Icon size={14} style={{ color: count > 0 ? cfg.dot : 'rgba(255,255,255,0.2)', flexShrink:0 }}/>
                      </div>
                      <p style={{
                        fontFamily:"'Inter',sans-serif", fontSize:'30px', fontWeight:'800',
                        color: count > 0 ? 'rgba(255,255,255,0.93)' : 'rgba(255,255,255,0.2)',
                        margin:0, lineHeight:1, letterSpacing:'-1px',
                      }}>{count}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Lista de citas o empty state ─────────────── */}
              {loadingDay ? (
                /* Skeleton */
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {[...Array(3)].map((_,i) => (
                    <div key={i} className="ag-skeleton" style={{ height:'88px', borderRadius:'12px' }}/>
                  ))}
                </div>
              ) : citasDelDia.length === 0 ? (
                /* ── Empty state premium ── */
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center',
                  padding: '56px 24px',
                  background: 'rgba(8,20,48,0.5)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(201,168,76,0.1)',
                  borderRadius: '16px',
                  textAlign: 'center',
                }}>
                  <IconCalendarEmpty/>
                  <h3 style={{
                    fontFamily:"'Playfair Display',serif",
                    fontSize:'18px', fontWeight:'700',
                    color:'rgba(255,255,255,0.7)', margin:'20px 0 8px',
                    textShadow:'0 1px 4px rgba(0,0,0,0.3)',
                  }}>
                    Sin citas programadas
                  </h3>
                  <p style={{
                    fontFamily:"'Inter',sans-serif", fontSize:'13px',
                    color:'rgba(255,255,255,0.35)', margin:'0 0 28px',
                    maxWidth:'280px', lineHeight:1.6,
                  }}>
                    Este día está libre. Aprovecha el espacio para agendar nuevas reuniones o revisar expedientes pendientes.
                  </p>
                </div>
              ) : (
                /* ── Cards de citas ── */
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {citasDelDia.map((cita, idx) => {
                    const cfg     = ESTADO_CFG[cita.estado] || ESTADO_CFG.pendiente
                    const cliente = getNombreCliente(cita.id_cliente)
                    const Icon    = cfg.icon

                    return (
                      <div
                        key={cita.id_cita}
                        className="cita-card"
                        style={{
                          background: cfg.cardBg,
                          border: `1px solid ${cfg.cardBorder}`,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                          animationDelay: `${idx * 0.06}s`,
                        }}
                      >
                        {/* Línea lateral de color */}
                        <div style={{
                          position:'absolute', top:0, left:0, bottom:0,
                          width:'3px',
                          background: `linear-gradient(to bottom, ${cfg.dot}, transparent)`,
                          borderRadius:'12px 0 0 12px',
                        }}/>

                        <div style={{ paddingLeft:'10px' }}>

                          {/* Header de la card */}
                          <div style={{
                            display:'flex', alignItems:'flex-start',
                            justifyContent:'space-between', gap:'12px',
                            marginBottom:'10px',
                          }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'12px', flex:1, minWidth:0 }}>

                              {/* Hora pill */}
                              <div style={{
                                flexShrink:0, textAlign:'center',
                                background:'rgba(4,12,32,0.6)',
                                border:'1px solid rgba(255,255,255,0.1)',
                                borderRadius:'9px',
                                padding:'7px 11px',
                                minWidth:'58px',
                              }}>
                                <p style={{
                                  fontFamily:"'Inter',sans-serif",
                                  fontSize:'14px', fontWeight:'800',
                                  color:'rgba(255,255,255,0.92)',
                                  margin:'0 0 1px', lineHeight:1,
                                  letterSpacing:'-0.3px',
                                }}>
                                  {cita.hora?.slice(0,5) || '--:--'}
                                </p>
                                <p style={{
                                  fontFamily:"'Inter',sans-serif",
                                  fontSize:'9px', fontWeight:'700',
                                  color:'rgba(201,168,76,0.7)',
                                  margin:0, letterSpacing:'0.5px',
                                  textTransform:'uppercase',
                                }}>
                                  {cita.hora
                                    ? parseInt(cita.hora) >= 12 ? 'pm' : 'am'
                                    : ''}
                                </p>
                              </div>

                              {/* Info principal */}
                              <div style={{ flex:1, minWidth:0 }}>
                                <p style={{
                                  fontFamily:"'Inter',sans-serif",
                                  fontSize:'14px', fontWeight:'600',
                                  color:'rgba(255,255,255,0.92)',
                                  margin:'0 0 3px',
                                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                                }}>
                                  {cita.motivo}
                                </p>
                                <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                                  {cliente && (
                                    <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                                      <User size={11} style={{ color:'rgba(255,255,255,0.3)', flexShrink:0 }}/>
                                      <span style={{
                                        fontFamily:"'Inter',sans-serif",
                                        fontSize:'12px', color:'rgba(255,255,255,0.5)',
                                      }}>
                                        {cliente}
                                      </span>
                                    </div>
                                  )}
                                  {cita.id_caso && (
                                    <span style={{
                                      fontFamily:"'Inter',sans-serif",
                                      fontSize:'10px', fontWeight:'600',
                                      color:'rgba(201,168,76,0.7)',
                                      background:'rgba(201,168,76,0.08)',
                                      border:'1px solid rgba(201,168,76,0.15)',
                                      borderRadius:'4px', padding:'1px 6px',
                                    }}>
                                      Caso #{cita.id_caso}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Badge estado + acciones */}
                            <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
                              <Badge estado={cita.estado}/>
                              {/* Confirmar si está pendiente */}
                              {cita.estado === 'pendiente' && (
                                <button className="ag-action confirm" title="Confirmar"
                                  onClick={() => handleEstado(cita.id_cita, 'confirmada')}>
                                  <Check size={12}/>
                                </button>
                              )}
                              {/* Cancelar si no está cancelada */}
                              {cita.estado !== 'cancelada' && (
                                <button className="ag-action cancel" title="Cancelar"
                                  onClick={() => handleEstado(cita.id_cita, 'cancelada')}>
                                  <X size={12}/>
                                </button>
                              )}
                              <button className="ag-action edit" title="Editar"
                                onClick={() => abrirEdit(cita)}>
                                <Edit3 size={12}/>
                              </button>
                              <button className="ag-action del" title="Eliminar"
                                onClick={() => handleDelete(cita.id_cita)}>
                                <Trash2 size={12}/>
                              </button>
                            </div>
                          </div>

                          {/* Mensaje/notas si existe */}
                          {(cita.mensaje || cita.notas) && (
                            <div style={{
                              background:'rgba(0,0,0,0.2)',
                              border:'1px solid rgba(255,255,255,0.06)',
                              borderRadius:'8px', padding:'8px 12px',
                              marginTop:'4px',
                            }}>
                              <p style={{
                                fontFamily:"'Inter',sans-serif",
                                fontSize:'12px', fontStyle:'italic',
                                color:'rgba(255,255,255,0.4)',
                                margin:0, lineHeight:1.5,
                              }}>
                                "{cita.mensaje || cita.notas}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal nueva/editar cita ─────────────────────────── */}
      {modalOpen && (
        <CitaModal
          cita={citaEdit}
          fechaInicial={diaSelecto}
          clientes={clientes}
          onClose={() => setModalOpen(false)}
          onGuardado={onGuardado}
        />
      )}
    </>
  )
}