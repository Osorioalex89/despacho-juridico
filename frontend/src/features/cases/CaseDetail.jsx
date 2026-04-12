import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCasoById, getMovimientos, addMovimiento, chatCaso } from './casesService'
import CaseTimeline from './CaseTimeline'
import {
  ArrowLeft, Pencil, FolderOpen, User, Calendar,
  Clock, FileText, MapPin, Scale, AlertCircle,
  CheckCircle, XCircle, Tag, Phone, Mail, Home,
  ChevronRight, History, Bell, Plus, Gavel, Users,
  Brain, Zap, ShieldAlert, ListChecks, RefreshCw,
  Sparkles, Send, Loader2, MessageSquare
} from 'lucide-react'

// ── Config estados ────────────────────────────────────────────────
const ESTADO_CONFIG = {
  activo:      { label:'Activo',      bg:'rgba(59,130,246,0.12)',  border:'rgba(59,130,246,0.28)',  text:'#93BBFC', dot:'#3B82F6', cardBg:'rgba(59,130,246,0.06)',  cardBorder:'rgba(59,130,246,0.18)',  icon:CheckCircle },
  urgente:     { label:'Urgente',     bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.28)',   text:'#FCA5A5', dot:'#EF4444', cardBg:'rgba(239,68,68,0.06)',   cardBorder:'rgba(239,68,68,0.18)',   icon:AlertCircle },
  pendiente:   { label:'Pendiente',   bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.28)',  text:'#FCD34D', dot:'#F59E0B', cardBg:'rgba(245,158,11,0.06)',  cardBorder:'rgba(245,158,11,0.18)',  icon:Clock       },
  en_revision: { label:'En revisión', bg:'rgba(139,92,246,0.12)',  border:'rgba(139,92,246,0.28)',  text:'#C4B5FD', dot:'#8B5CF6', cardBg:'rgba(139,92,246,0.06)',  cardBorder:'rgba(139,92,246,0.18)',  icon:FileText    },
  cerrado:     { label:'Cerrado',     bg:'rgba(107,114,128,0.12)', border:'rgba(107,114,128,0.28)', text:'#9CA3AF', dot:'#6B7280', cardBg:'rgba(107,114,128,0.05)', cardBorder:'rgba(107,114,128,0.15)', icon:XCircle     },
}

const CITA_ESTADO = {
  pendiente:  { label:'Pendiente',  bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.28)', text:'#FCD34D', dot:'#F59E0B' },
  confirmada: { label:'Confirmada', bg:'rgba(34,197,94,0.12)',  border:'rgba(34,197,94,0.28)',  text:'#86EFAC', dot:'#22C55E' },
  cancelada:  { label:'Cancelada',  bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.28)',  text:'#FCA5A5', dot:'#EF4444' },
}

// ── Tipo chip colors ──────────────────────────────────────────────
const TIPO_COLOR = {
  'Penal':                   { bg:'rgba(239,68,68,0.1)',   text:'#FCA5A5',  border:'rgba(239,68,68,0.2)'  },
  'Civil':                   { bg:'rgba(59,130,246,0.1)',  text:'#93BBFC',  border:'rgba(59,130,246,0.2)' },
  'Amparo':                  { bg:'rgba(139,92,246,0.1)',  text:'#C4B5FD',  border:'rgba(139,92,246,0.2)' },
  'Sucesorio':               { bg:'rgba(245,158,11,0.1)',  text:'#FCD34D',  border:'rgba(245,158,11,0.2)' },
  'Contratos':               { bg:'rgba(34,197,94,0.1)',   text:'#86EFAC',  border:'rgba(34,197,94,0.2)'  },
  'Trámite de escrituras':   { bg:'rgba(201,168,76,0.1)',  text:'#E8C97A',  border:'rgba(201,168,76,0.2)' },
  'Inscripción de posesión': { bg:'rgba(20,184,166,0.1)',  text:'#5EEAD4',  border:'rgba(20,184,166,0.2)' },
  'Asesoría legal':          { bg:'rgba(249,115,22,0.1)',  text:'#FDBA74',  border:'rgba(249,115,22,0.2)' },
}

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    day:'numeric', month:'long', year:'numeric'
  })
}

function formatHora(hora) {
  if (!hora) return ''
  const [h, m] = hora.split(':')
  const hNum = parseInt(h)
  return `${hNum > 12 ? hNum - 12 : hNum || 12}:${m} ${hNum >= 12 ? 'pm' : 'am'}`
}

function Badge({ estado, config }) {
  const c = config[estado] || Object.values(config)[0]
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'5px',
      background:c.bg, border:`1px solid ${c.border}`,
      borderRadius:'4px', padding:'3px 9px',
      fontFamily:"'Inter',sans-serif",
      fontSize:'11px', fontWeight:'600', color:c.text,
      whiteSpace:'nowrap', flexShrink:0,
    }}>
      <span style={{width:'5px',height:'5px',borderRadius:'50%',background:c.dot}}/>
      {c.label}
    </span>
  )
}

function TipoBadge({ tipo }) {
  const c = TIPO_COLOR[tipo] || { bg:'rgba(255,255,255,0.06)', text:'rgba(255,255,255,0.55)', border:'rgba(255,255,255,0.1)' }
  return (
    <span style={{
      display:'inline-flex', alignItems:'center',
      background:c.bg, border:`1px solid ${c.border}`,
      borderRadius:'4px', padding:'3px 8px',
      fontFamily:"'Inter',sans-serif",
      fontSize:'11px', fontWeight:'500', color:c.text, whiteSpace:'nowrap',
    }}>{tipo}</span>
  )
}

// Avatar cliente con inicial
function ClienteAvatar({ nombre, size=40 }) {
  const inicial = nombre?.charAt(0).toUpperCase() || '?'
  return (
    <div style={{
      width:size, height:size, borderRadius:'10px', flexShrink:0,
      background:'rgba(201,168,76,0.15)', border:'1px solid rgba(201,168,76,0.35)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <span style={{
        fontFamily:"'Playfair Display',serif",
        fontSize:size*0.42, fontWeight:'700', color:'#C9A84C', lineHeight:1,
      }}>{inicial}</span>
    </div>
  )
}

// Info row premium
function InfoRow({ label, value, icon: Icon }) {
  if (!value) return null
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:'12px',
      padding:'12px 0',
      borderBottom:'1px solid rgba(255,255,255,0.05)',
    }}>
      {Icon && (
        <div style={{
          width:'32px', height:'32px', borderRadius:'8px', flexShrink:0,
          background:'rgba(201,168,76,0.08)',
          border:'1px solid rgba(201,168,76,0.15)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon size={14} style={{color:'rgba(201,168,76,0.7)'}}/>
        </div>
      )}
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',margin:'0 0 3px'}}>{label}</p>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'500',color:'rgba(255,255,255,0.85)',margin:0,wordBreak:'break-word'}}>{value}</p>
      </div>
    </div>
  )
}

export default function CaseDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { canEditCases } = useAuth()

  const [caso,         setCaso]         = useState(null)
  const [cliente,      setCliente]      = useState(null)
  const [citas,        setCitas]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [tab,          setTab]          = useState('detalle')
  const [movimientos,  setMovimientos]  = useState([])
  const [loadingMovs,  setLoadingMovs]  = useState(false)
  const [movForm,      setMovForm]      = useState({ tipo:'auto', descripcion:'', fecha_movimiento:'' })
  const [savingMov,    setSavingMov]    = useState(false)
  const [movMsg,       setMovMsg]       = useState(null) // { type:'success'|'error', text }
  const [chatHistory,  setChatHistory]  = useState([])
  const [chatInput,    setChatInput]    = useState('')
  const [chatLoading,  setChatLoading]  = useState(false)
  const chatTextareaRef = useRef(null)

  useEffect(() => {
    getCasoById(id)
      .then(res => {
        setCaso(res.data.caso)
        setCliente(res.data.cliente)
        setCitas(res.data.citas || [])
      })
      .catch(() => setError('Error al cargar el caso'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (tab === 'movimientos') {
      setLoadingMovs(true)
      getMovimientos(id)
        .then(res => setMovimientos(res.data.movimientos))
        .catch(() => setMovimientos([]))
        .finally(() => setLoadingMovs(false))
    }
  }, [tab, id])

  const handleAddMovimiento = async (e) => {
    e.preventDefault()
    if (!movForm.tipo || !movForm.descripcion.trim() || !movForm.fecha_movimiento) return
    setSavingMov(true)
    setMovMsg(null)
    try {
      const res = await addMovimiento(id, movForm)
      setMovimientos(prev => [res.data.movimiento, ...prev])
      setMovForm({ tipo:'auto', descripcion:'', fecha_movimiento:'' })
      setMovMsg({ type:'success', text:'Movimiento registrado. El cliente será notificado.' })
      setTimeout(() => setMovMsg(null), 4000)
    } catch {
      setMovMsg({ type:'error', text:'Error al registrar el movimiento.' })
    } finally {
      setSavingMov(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────
  if (loading) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'linear-gradient(160deg,#020818,#040d20)'}}>
        <div style={{width:'32px',height:'32px',borderRadius:'50%',border:'2px solid rgba(201,168,76,0.3)',borderTopColor:'#C9A84C',animation:'spin 0.8s linear infinite'}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  )

  if (error) return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'linear-gradient(160deg,#020818,#040d20)'}}>
      <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'#FCA5A5'}}>{error}</p>
    </div>
  )

  if (!caso) return null

  const estadoCfg  = ESTADO_CONFIG[caso.estado] || ESTADO_CONFIG.activo
  const EstadoIcon = estadoCfg.icon

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .cd-fade { animation: fadeUp 0.4s ease both; }

        .cd-cita-row {
          display:flex; align-items:center; gap:12px;
          padding:12px 16px;
          border-bottom:1px solid rgba(255,255,255,0.04);
          transition:background 0.15s ease;
        }
        .cd-cita-row:hover { background:rgba(201,168,76,0.04); }
        .cd-cita-row:last-child { border-bottom:none; }

        .cd-btn-back {
          display:inline-flex; align-items:center; gap:7px;
          padding:8px 14px; border-radius:8px;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.1);
          color:rgba(255,255,255,0.65);
          font-family:'Inter',sans-serif; font-size:13px; font-weight:500;
          cursor:pointer; transition:all 0.15s ease;
        }
        .cd-btn-back:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); color:rgba(255,255,255,0.9); }

        .cd-btn-edit {
          display:inline-flex; align-items:center; gap:7px;
          padding:8px 16px; border-radius:8px;
          background:linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%);
          border:none; color:#020818;
          font-family:'Inter',sans-serif; font-size:13px; font-weight:700;
          cursor:pointer; transition:all 0.15s ease;
        }
        .cd-btn-edit:hover { background:linear-gradient(135deg,#E8C97A 0%,#C9A84C 100%); transform:translateY(-1px); box-shadow:0 4px 14px rgba(201,168,76,0.3); }

        .cd-link-btn {
          display:flex; align-items:center; justify-content:center; gap:5px;
          width:100%; padding:9px;
          borderRadius:8px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.09);
          color:rgba(255,255,255,0.5);
          font-family:'Inter',sans-serif; font-size:12px; font-weight:500;
          cursor:pointer; transition:all 0.15s ease;
          text-decoration:none;
          border-radius:8px;
        }
        .cd-link-btn:hover { background:rgba(201,168,76,0.08); border-color:rgba(201,168,76,0.22); color:rgba(201,168,76,0.85); }

        .cd-tab-bar {
          display: flex;
          gap: 4px;
          padding: 12px 36px 0;
          border-bottom: 1px solid rgba(201,168,76,0.1);
          background: linear-gradient(135deg,rgba(6,16,40,0.97) 0%,rgba(12,26,56,0.9) 100%);
        }
        .cd-tab {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 8px 8px 0 0;
          font-family: 'Inter',sans-serif; font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.4);
          background: transparent; border: none;
          cursor: pointer; transition: all 0.15s ease;
          position: relative; bottom: -1px;
          border: 1px solid transparent;
          border-bottom: none;
        }
        .cd-tab:hover { color: rgba(255,255,255,0.7); }
        .cd-tab.active {
          color: #C9A84C;
          background: rgba(8,20,48,0.75);
          border-color: rgba(201,168,76,0.18);
          border-bottom-color: rgba(8,20,48,0.75);
        }
      `}</style>

      <div style={{
        flex:1, overflowY:'auto', minHeight:'100vh',
        background:`
          radial-gradient(ellipse at 8% 15%, rgba(201,168,76,0.06) 0%, transparent 48%),
          radial-gradient(ellipse at 92% 85%, rgba(139,92,246,0.04) 0%, transparent 48%),
          linear-gradient(160deg,#020818 0%,#040d20 50%,#02050f 100%)
        `,
      }}>

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="cd-fade" style={{
          background:'linear-gradient(135deg,rgba(6,16,40,0.97) 0%,rgba(12,26,56,0.9) 100%)',
          borderBottom:'1px solid rgba(201,168,76,0.14)',
          padding:'22px 36px 18px',
          position:'relative', overflow:'hidden',
        }}>
          {[160,110].map((s,i)=>(
            <div key={i} style={{position:'absolute',top:-s*0.4,right:-s*0.4,width:s,height:s,borderRadius:'50%',border:`1px solid rgba(201,168,76,${0.06-i*0.02})`,pointerEvents:'none'}}/>
          ))}
          <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px',flexWrap:'wrap'}}>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:'700',color:'rgba(201,168,76,0.85)',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.22)',borderRadius:'5px',padding:'3px 9px',letterSpacing:'0.5px'}}>
                  {caso.folio}
                </span>
                <TipoBadge tipo={caso.tipo}/>
                <Badge estado={caso.estado} config={ESTADO_CONFIG}/>
              </div>
              <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'22px',fontWeight:'700',color:'rgba(255,255,255,0.96)',margin:'0 0 3px',textShadow:'0 2px 6px rgba(0,0,0,0.35)'}}>
                {caso.asunto}
              </h1>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.35)',margin:0}}>
                Expediente jurídico · {formatFecha(caso.fecha_apertura)}
              </p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <button className="cd-btn-back" onClick={()=>navigate('/panel/casos')}>
                <ArrowLeft size={14}/> Volver
              </button>
              {canEditCases && (
                <button className="cd-btn-edit" onClick={()=>navigate(`/panel/casos/${id}/editar`)}>
                  <Pencil size={14}/> Editar caso
                </button>
              )}
            </div>
          </div>
          <div style={{position:'absolute',bottom:0,left:'36px',width:'44px',height:'1px',background:'linear-gradient(90deg,rgba(201,168,76,0.55),transparent)'}}/>
        </div>

        {/* ── Tab bar ─────────────────────────────────────────── */}
        <div className="cd-tab-bar">
          <button
            className={`cd-tab${tab === 'detalle' ? ' active' : ''}`}
            onClick={() => setTab('detalle')}
          >
            <FolderOpen size={14}/> Detalle
          </button>
          <button
            className={`cd-tab${tab === 'historial' ? ' active' : ''}`}
            onClick={() => setTab('historial')}
          >
            <History size={14}/> Historial
          </button>
          <button
            className={`cd-tab${tab === 'movimientos' ? ' active' : ''}`}
            onClick={() => setTab('movimientos')}
          >
            <Bell size={14}/> Movimientos
          </button>
          {canEditCases && caso?.reporte_ia && (
            <button
              className={`cd-tab${tab === 'ia' ? ' active' : ''}`}
              onClick={() => setTab('ia')}
            >
              <Brain size={14}/> Análisis IA
            </button>
          )}
          <button
            className={`cd-tab${tab === 'chat' ? ' active' : ''}`}
            onClick={() => setTab('chat')}
          >
            <Sparkles size={14}/> Chat IA
          </button>
        </div>

        <div style={{padding:'24px 36px',maxWidth:'1200px'}}>

        {tab === 'ia' && (() => {
          const ia = (() => { try { return caso.reporte_ia ? JSON.parse(caso.reporte_ia) : null } catch { return null } })()
          if (!ia) return null
          const RIESGO = {
            alto:  { label: 'Riesgo ALTO',  color: '#FCA5A5', bg: 'rgba(252,165,165,0.08)', border: 'rgba(252,165,165,0.25)', icon: ShieldAlert },
            medio: { label: 'Riesgo MEDIO', color: '#FCD34D', bg: 'rgba(252,211,77,0.08)',  border: 'rgba(252,211,77,0.25)',  icon: AlertCircle },
            bajo:  { label: 'Riesgo BAJO',  color: '#86EFAC', bg: 'rgba(134,239,172,0.08)', border: 'rgba(134,239,172,0.25)', icon: CheckCircle },
          }
          const r = RIESGO[ia.riesgo] || RIESGO.medio
          const RiesgoIcon = r.icon
          const ultimoAnalisis = caso.reporte_ia_at
            ? new Date(caso.reporte_ia_at).toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })
            : null
          return (
            <div style={{ maxWidth: '720px' }}>
              <div style={{
                background: 'rgba(8,20,48,0.75)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(201,168,76,0.14)', borderRadius: '16px',
                overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              }}>
                {/* Header */}
                <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Brain size={14} style={{ color: 'rgba(201,168,76,0.8)' }}/>
                    </div>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '15px', fontWeight: '700', color: 'rgba(255,255,255,0.92)', margin: 0 }}>
                      Análisis IA del Caso
                    </p>
                  </div>
                  {ultimoAnalisis && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <RefreshCw size={10} style={{ color: 'rgba(255,255,255,0.3)' }}/>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                        {ultimoAnalisis}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ padding: '24px' }}>
                  {/* Badge riesgo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px 16px', background: r.bg, border: `1px solid ${r.border}`, borderRadius: '10px' }}>
                    <RiesgoIcon size={16} style={{ color: r.color, flexShrink: 0 }}/>
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', fontWeight: '700', color: r.color }}>
                      {r.label}
                    </span>
                  </div>

                  {/* Resumen */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', margin: '0 0 8px' }}>Resumen ejecutivo</p>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: 0 }}>{ia.resumen}</p>
                  </div>

                  {/* Próxima acción */}
                  {ia.proximaAccion && (
                    <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Zap size={12} style={{ color: '#C9A84C' }}/>
                        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', margin: 0 }}>Próxima acción inmediata</p>
                      </div>
                      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', margin: 0 }}>{ia.proximaAccion}</p>
                    </div>
                  )}

                  {/* Alertas */}
                  {ia.alertas?.length > 0 && (
                    <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'rgba(252,165,165,0.05)', border: '1px solid rgba(252,165,165,0.2)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <ShieldAlert size={12} style={{ color: '#FCA5A5' }}/>
                        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#FCA5A5', margin: 0 }}>Alertas</p>
                      </div>
                      {ia.alertas.map((a, i) => (
                        <p key={i} style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.65)', margin: '0 0 4px', display: 'flex', gap: '6px' }}>
                          <span style={{ color: '#FCA5A5', flexShrink: 0 }}>&#9679;</span>{a}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Acciones recomendadas */}
                  {ia.accionesRecomendadas?.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <ListChecks size={12} style={{ color: 'rgba(201,168,76,0.7)' }}/>
                        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', margin: 0 }}>Acciones recomendadas</p>
                      </div>
                      {ia.accionesRecomendadas.map((a, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', fontWeight: '700', color: 'rgba(201,168,76,0.6)', flexShrink: 0, marginTop: '1px' }}>{i + 1}.</span>
                          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>{a}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.2)', margin: '20px 0 0', textAlign: 'center' }}>
                    Análisis generado automáticamente por IA · Verificar con criterio profesional
                  </p>
                </div>
              </div>
            </div>
          )
        })()}

        {tab === 'chat' && (() => {
          const sendChat = async () => {
            if (!chatInput.trim() || chatLoading) return
            const pregunta = chatInput.trim()
            setChatInput('')
            if (chatTextareaRef.current) chatTextareaRef.current.value = ''
            const newHistory = [...chatHistory, { role:'user', content:pregunta }]
            setChatHistory(newHistory)
            setChatLoading(true)
            try {
              const r = await chatCaso(id, { pregunta, historial: chatHistory })
              setChatHistory([...newHistory, { role:'assistant', content:r.data.respuesta }])
            } catch {
              setChatHistory([...newHistory, { role:'assistant', content:'Error al conectar con el asistente IA. Intenta de nuevo.' }])
            } finally {
              setChatLoading(false)
            }
          }
          return (
            <div style={{ maxWidth:'720px' }}>
              <div style={{
                background:'rgba(8,20,48,0.75)', backdropFilter:'blur(16px)',
                border:'1px solid rgba(201,168,76,0.14)', borderRadius:'16px',
                overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.35)',
                display:'flex', flexDirection:'column', minHeight:'480px',
              }}>
                {/* Header */}
                <div style={{ padding:'16px 24px', borderBottom:'1px solid rgba(201,168,76,0.1)', display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Sparkles size={14} style={{ color:'rgba(201,168,76,0.8)' }}/>
                  </div>
                  <div>
                    <p style={{ fontFamily:"'Playfair Display',serif", fontSize:'15px', fontWeight:'700', color:'rgba(255,255,255,0.92)', margin:0 }}>
                      Asistente IA — {caso?.folio}
                    </p>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', margin:0 }}>
                      Consulta sobre este expediente en lenguaje natural
                    </p>
                  </div>
                </div>

                {/* Mensajes */}
                <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:'14px', minHeight:'320px' }}>
                  {chatHistory.length === 0 && (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, gap:'12px', opacity:0.5 }}>
                      <MessageSquare size={28} style={{ color:'rgba(201,168,76,0.4)' }}/>
                      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.4)', margin:0, textAlign:'center', maxWidth:'260px', lineHeight:1.6 }}>
                        Pregunta sobre el caso, movimientos, documentos o plazos. El asistente tiene acceso al expediente completo.
                      </p>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} style={{ display:'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth:'80%', padding:'10px 14px', borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                        background: msg.role === 'user' ? 'rgba(201,168,76,0.14)' : 'rgba(139,92,246,0.1)',
                        border: msg.role === 'user' ? '1px solid rgba(201,168,76,0.28)' : '1px solid rgba(139,92,246,0.22)',
                      }}>
                        {msg.role === 'assistant' ? (
                          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.85)', lineHeight:1.6 }} className="md-chat">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.85)', margin:0, lineHeight:1.6 }}>
                            {msg.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display:'flex', justifyContent:'flex-start' }}>
                      <div style={{ padding:'10px 14px', borderRadius:'12px 12px 12px 4px', background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.22)', display:'flex', alignItems:'center', gap:'8px' }}>
                        <Loader2 size={13} style={{ color:'#C4B5FD', animation:'spin 1s linear infinite' }}/>
                        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(196,181,253,0.7)' }}>Analizando expediente…</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div style={{ padding:'16px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:'10px', alignItems:'flex-end' }}>
                  <textarea
                    ref={chatTextareaRef}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                    placeholder="Pregunta sobre este expediente… (Enter para enviar)"
                    disabled={chatLoading}
                    rows={2}
                    style={{
                      flex:1, resize:'none', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
                      borderRadius:'10px', padding:'10px 14px', color:'rgba(255,255,255,0.85)',
                      fontFamily:"'Inter',sans-serif", fontSize:'13px', lineHeight:1.5,
                      outline:'none', opacity: chatLoading ? 0.5 : 1,
                    }}
                  />
                  <button
                    onClick={sendChat}
                    disabled={!chatInput.trim() || chatLoading}
                    style={{
                      width:'40px', height:'40px', borderRadius:'10px', flexShrink:0,
                      background: chatInput.trim() && !chatLoading ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)',
                      border: chatInput.trim() && !chatLoading ? '1px solid rgba(201,168,76,0.35)' : '1px solid rgba(255,255,255,0.08)',
                      color: chatInput.trim() && !chatLoading ? '#C9A84C' : 'rgba(255,255,255,0.2)',
                      display:'flex', alignItems:'center', justifyContent:'center', cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'default',
                      transition:'all 0.15s ease',
                    }}
                  >
                    <Send size={16}/>
                  </button>
                </div>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.15)', margin:'0', padding:'0 24px 14px', textAlign:'center' }}>
                  Respuestas generadas por IA · Verificar con criterio profesional · Historial no se guarda
                </p>
              </div>
            </div>
          )
        })()}

        {tab === 'historial' && (
          <div style={{ maxWidth:'720px' }}>
            <div style={{
              background:'rgba(8,20,48,0.75)', backdropFilter:'blur(16px)',
              border:'1px solid rgba(201,168,76,0.14)', borderRadius:'16px',
              overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.35)',
            }}>
              <div style={{padding:'18px 24px', borderBottom:'1px solid rgba(201,168,76,0.1)', display:'flex', alignItems:'center', gap:'10px'}}>
                <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <History size={14} style={{color:'rgba(201,168,76,0.8)'}}/>
                </div>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:'15px',fontWeight:'700',color:'rgba(255,255,255,0.92)',margin:0}}>
                  Historial del caso
                </p>
              </div>
              <div style={{padding:'24px 24px 24px 60px'}}>
                <CaseTimeline casoId={id}/>
              </div>
            </div>
          </div>
        )}

        {tab === 'movimientos' && (() => {
          const TIPO_CONFIG = {
            auto:      { label:'Auto judicial',  color:'#FB923C', bg:'rgba(251,146,60,0.1)',  border:'rgba(251,146,60,0.25)',  Icon:Gavel  },
            sentencia: { label:'Sentencia',      color:'#FCA5A5', bg:'rgba(252,165,165,0.1)', border:'rgba(252,165,165,0.25)', Icon:Scale  },
            audiencia: { label:'Audiencia',      color:'#86EFAC', bg:'rgba(134,239,172,0.1)', border:'rgba(134,239,172,0.25)', Icon:Users  },
            oficio:    { label:'Oficio',         color:'#93BBFC', bg:'rgba(147,187,252,0.1)', border:'rgba(147,187,252,0.25)', Icon:FileText },
            otro:      { label:'Notificación',   color:'#C4B5FD', bg:'rgba(196,181,253,0.1)', border:'rgba(196,181,253,0.25)', Icon:Bell   },
          }
          return (
            <div style={{maxWidth:'760px',display:'flex',flexDirection:'column',gap:'18px'}}>

              {/* ── Formulario nuevo movimiento ── */}
              <div style={{background:'rgba(8,20,48,0.75)',backdropFilter:'blur(16px)',border:'1px solid rgba(201,168,76,0.14)',borderRadius:'16px',overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.35)'}}>
                <div style={{padding:'16px 22px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'rgba(251,146,60,0.1)',border:'1px solid rgba(251,146,60,0.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Plus size={14} style={{color:'rgba(251,146,60,0.8)'}}/>
                  </div>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:'15px',fontWeight:'700',color:'rgba(255,255,255,0.92)',margin:0}}>
                    Registrar movimiento procesal
                  </p>
                </div>
                <form onSubmit={handleAddMovimiento} style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:'12px'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                    <div>
                      <label style={{display:'block',fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',marginBottom:'6px'}}>
                        Tipo
                      </label>
                      <select
                        value={movForm.tipo}
                        onChange={e => setMovForm(f => ({...f, tipo:e.target.value}))}
                        style={{width:'100%',padding:'9px 12px',borderRadius:'8px',background:'rgba(4,12,32,0.7)',border:'1px solid rgba(201,168,76,0.18)',color:'rgba(255,255,255,0.85)',fontFamily:"'Inter',sans-serif",fontSize:'13px',outline:'none'}}
                      >
                        <option value="auto">Auto judicial</option>
                        <option value="sentencia">Sentencia</option>
                        <option value="audiencia">Audiencia</option>
                        <option value="oficio">Oficio</option>
                        <option value="otro">Otro / Notificación</option>
                      </select>
                    </div>
                    <div>
                      <label style={{display:'block',fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',marginBottom:'6px'}}>
                        Fecha del movimiento
                      </label>
                      <input
                        type="date"
                        value={movForm.fecha_movimiento}
                        onChange={e => setMovForm(f => ({...f, fecha_movimiento:e.target.value}))}
                        required
                        style={{width:'100%',padding:'9px 12px',borderRadius:'8px',background:'rgba(4,12,32,0.7)',border:'1px solid rgba(201,168,76,0.18)',color:'rgba(255,255,255,0.85)',fontFamily:"'Inter',sans-serif",fontSize:'13px',outline:'none',boxSizing:'border-box'}}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{display:'block',fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',marginBottom:'6px'}}>
                      Descripción
                    </label>
                    <textarea
                      value={movForm.descripcion}
                      onChange={e => setMovForm(f => ({...f, descripcion:e.target.value}))}
                      required
                      rows={3}
                      placeholder="Describe el movimiento procesal registrado..."
                      style={{width:'100%',padding:'9px 12px',borderRadius:'8px',background:'rgba(4,12,32,0.7)',border:'1px solid rgba(201,168,76,0.18)',color:'rgba(255,255,255,0.85)',fontFamily:"'Inter',sans-serif",fontSize:'13px',outline:'none',resize:'vertical',boxSizing:'border-box'}}
                    />
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
                    <button
                      type="submit"
                      disabled={savingMov}
                      style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'9px 20px',borderRadius:'8px',background:'linear-gradient(135deg,#FB923C,#ea7b1f)',border:'none',color:'#0B1A2A',fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'700',cursor:savingMov?'not-allowed':'pointer',opacity:savingMov?0.7:1}}
                    >
                      <Bell size={13}/> {savingMov ? 'Registrando...' : 'Registrar y notificar al cliente'}
                    </button>
                    {movMsg && (
                      <span style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:movMsg.type==='success'?'#86EFAC':'#FCA5A5'}}>
                        {movMsg.text}
                      </span>
                    )}
                  </div>
                </form>
              </div>

              {/* ── Lista de movimientos ── */}
              <div style={{background:'rgba(8,20,48,0.75)',backdropFilter:'blur(16px)',border:'1px solid rgba(201,168,76,0.14)',borderRadius:'16px',overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.35)'}}>
                <div style={{padding:'16px 22px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'rgba(251,146,60,0.1)',border:'1px solid rgba(251,146,60,0.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Bell size={14} style={{color:'rgba(251,146,60,0.8)'}}/>
                  </div>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:'15px',fontWeight:'700',color:'rgba(255,255,255,0.92)',margin:0}}>
                    Movimientos registrados
                  </p>
                  <span style={{marginLeft:'auto',fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:'700',color:'rgba(251,146,60,0.7)',background:'rgba(251,146,60,0.1)',border:'1px solid rgba(251,146,60,0.2)',borderRadius:'999px',padding:'2px 10px'}}>
                    {movimientos.length}
                  </span>
                </div>

                {loadingMovs ? (
                  <div style={{padding:'32px',display:'flex',justifyContent:'center'}}>
                    <div style={{width:'24px',height:'24px',borderRadius:'50%',border:'2px solid rgba(201,168,76,0.3)',borderTopColor:'#C9A84C',animation:'spin 0.8s linear infinite'}}/>
                  </div>
                ) : movimientos.length === 0 ? (
                  <div style={{padding:'36px 24px',textAlign:'center'}}>
                    <Bell size={28} style={{color:'rgba(255,255,255,0.12)',marginBottom:'10px'}}/>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.3)',margin:0}}>
                      Sin movimientos registrados aún
                    </p>
                  </div>
                ) : (
                  <div>
                    {movimientos.map((mov, idx) => {
                      const cfg = TIPO_CONFIG[mov.tipo] || TIPO_CONFIG.otro
                      const Icon = cfg.Icon
                      const fecha = new Date(mov.fecha_movimiento + 'T12:00:00').toLocaleDateString('es-MX', {day:'numeric',month:'long',year:'numeric'})
                      return (
                        <div key={mov.id_movimiento} style={{display:'flex',gap:'14px',padding:'16px 22px',borderBottom:idx<movimientos.length-1?'1px solid rgba(255,255,255,0.04)':'none'}}>
                          <div style={{width:'36px',height:'36px',borderRadius:'9px',background:cfg.bg,border:`1px solid ${cfg.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:'2px'}}>
                            <Icon size={15} style={{color:cfg.color}}/>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'5px',flexWrap:'wrap'}}>
                              <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',color:cfg.color,background:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:'4px',padding:'2px 8px',letterSpacing:'0.5px'}}>
                                {cfg.label}
                              </span>
                              <span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)',display:'flex',alignItems:'center',gap:'4px'}}>
                                <Calendar size={10}/> {fecha}
                              </span>
                            </div>
                            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.78)',margin:0,lineHeight:1.55}}>
                              {mov.descripcion}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {tab === 'detalle' && (
          <>
          {/* ── Banner estado urgente ──────────────────────────── */}
          {caso.estado === 'urgente' && (
            <div className="cd-fade" style={{
              display:'flex', alignItems:'center', gap:'14px',
              padding:'14px 20px', marginBottom:'20px',
              background:'rgba(239,68,68,0.1)',
              border:'1px solid rgba(239,68,68,0.28)',
              borderRadius:'12px',
              animationDelay:'0.05s',
            }}>
              <AlertCircle size={18} style={{color:'#FCA5A5',flexShrink:0}}/>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'600',color:'#FCA5A5',margin:0}}>
                Este expediente está marcado como <strong>URGENTE</strong> — requiere atención inmediata
              </p>
            </div>
          )}

          {/* ── Grid 2 cols ─────────────────────────────────────── */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'18px',alignItems:'start'}}>

            {/* ── Columna izquierda ──────────────────────────────── */}
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

              {/* Info general del caso */}
              <div className="cd-fade" style={{
                background:'rgba(8,20,48,0.75)', backdropFilter:'blur(16px)',
                border:'1px solid rgba(201,168,76,0.14)', borderRadius:'16px',
                overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.35)',
                animationDelay:'0.08s',
              }}>
                <div style={{padding:'16px 22px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <FolderOpen size={14} style={{color:'rgba(201,168,76,0.8)'}}/>
                  </div>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:'15px',fontWeight:'700',color:'rgba(255,255,255,0.92)',margin:0}}>
                    Información del caso
                  </p>
                </div>
                <div style={{padding:'4px 22px 8px'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 24px'}}>
                    <InfoRow label="Folio"          value={caso.folio}                    icon={Tag}      />
                    <InfoRow label="Tipo de caso"   value={caso.tipo}                     icon={Scale}    />
                    <InfoRow label="Fecha apertura" value={formatFecha(caso.fecha_apertura)} icon={Calendar} />
                    <InfoRow label="Fecha límite"   value={formatFecha(caso.fecha_limite)}   icon={Clock}    />
                    <InfoRow label="Juzgado"        value={caso.juzgado}                  icon={MapPin}   />
                    <InfoRow label="No. externo"    value={caso.exp_externo}              icon={FileText} />
                  </div>
                  {caso.contraparte && (
                    <div style={{padding:'12px 0',borderTop:'1px solid rgba(255,255,255,0.05)',marginTop:'4px'}}>
                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',margin:'0 0 5px'}}>Contraparte</p>
                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'500',color:'rgba(255,255,255,0.8)',margin:0}}>{caso.contraparte}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              {caso.descripcion && (
                <div className="cd-fade" style={{
                  background:'rgba(8,20,48,0.75)', backdropFilter:'blur(16px)',
                  border:'1px solid rgba(201,168,76,0.14)', borderRadius:'16px',
                  overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.35)',
                  animationDelay:'0.12s',
                }}>
                  <div style={{padding:'16px 22px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',alignItems:'center',gap:'10px'}}>
                    <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <FileText size={14} style={{color:'rgba(201,168,76,0.8)'}}/>
                    </div>
                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:'15px',fontWeight:'700',color:'rgba(255,255,255,0.92)',margin:0}}>
                      Descripción y antecedentes
                    </p>
                  </div>
                  <div style={{padding:'18px 22px'}}>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.6)',lineHeight:1.75,margin:0}}>
                      {caso.descripcion}
                    </p>
                  </div>
                </div>
              )}

              {/* Notas internas */}
              {caso.notas && (
                <div className="cd-fade" style={{
                  background:'rgba(245,158,11,0.06)',
                  border:'1px solid rgba(245,158,11,0.22)',
                  borderRadius:'16px', overflow:'hidden',
                  animationDelay:'0.14s',
                }}>
                  <div style={{padding:'14px 22px',borderBottom:'1px solid rgba(245,158,11,0.15)',display:'flex',alignItems:'center',gap:'10px'}}>
                    <AlertCircle size={15} style={{color:'#FCD34D',flexShrink:0}}/>
                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:'14px',fontWeight:'700',color:'#FCD34D',margin:0}}>
                      Notas internas
                    </p>
                  </div>
                  <div style={{padding:'16px 22px'}}>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(253,211,77,0.75)',lineHeight:1.7,margin:0}}>
                      {caso.notas}
                    </p>
                  </div>
                </div>
              )}

              {/* Citas vinculadas */}
              <div className="cd-fade" style={{
                background:'rgba(8,20,48,0.75)', backdropFilter:'blur(16px)',
                border:'1px solid rgba(201,168,76,0.14)', borderRadius:'16px',
                overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.35)',
                animationDelay:'0.18s',
              }}>
                <div style={{padding:'16px 22px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <Calendar size={14} style={{color:'rgba(201,168,76,0.8)'}}/>
                    </div>
                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:'15px',fontWeight:'700',color:'rgba(255,255,255,0.92)',margin:0}}>
                      Citas vinculadas
                    </p>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:'700',color:'rgba(201,168,76,0.8)',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'10px',padding:'1px 8px'}}>
                      {citas.length}
                    </span>
                  </div>
                  <button onClick={()=>navigate('/panel/agenda')} style={{
                    fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:'600',
                    color:'rgba(201,168,76,0.7)',background:'none',border:'none',
                    cursor:'pointer',display:'flex',alignItems:'center',gap:'3px',
                    transition:'color 0.15s ease',
                  }}>
                    Ver agenda <ChevronRight size={12}/>
                  </button>
                </div>

                {citas.length === 0 ? (
                  <div style={{padding:'36px 22px',textAlign:'center'}}>
                    <Calendar size={24} style={{color:'rgba(255,255,255,0.15)',margin:'0 auto 10px',display:'block'}}/>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.3)',margin:0}}>
                      No hay citas vinculadas a este caso
                    </p>
                  </div>
                ) : (
                  <div>
                    {citas.map(cita=>{
                      const cfg = CITA_ESTADO[cita.estado] || CITA_ESTADO.pendiente
                      return (
                        <div key={cita.id_cita} className="cd-cita-row">
                          {/* Fecha pill */}
                          <div style={{
                            flexShrink:0, textAlign:'center',
                            background:'rgba(4,12,32,0.6)',
                            border:'1px solid rgba(255,255,255,0.08)',
                            borderRadius:'8px', padding:'6px 10px',
                            minWidth:'72px',
                          }}>
                            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',fontWeight:'700',color:'rgba(255,255,255,0.85)',margin:'0 0 1px',lineHeight:1}}>
                              {formatFecha(cita.fecha).split(' de ').slice(0,2).join(' de ')}
                            </p>
                            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(201,168,76,0.65)',margin:0}}>
                              {formatHora(cita.hora)}
                            </p>
                          </div>
                          {/* Línea separadora */}
                          <div style={{width:'2px',height:'28px',background:'linear-gradient(to bottom,#C9A84C,transparent)',flexShrink:0,borderRadius:'2px'}}/>
                          {/* Motivo */}
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'500',color:'rgba(255,255,255,0.8)',margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                              {cita.motivo}
                            </p>
                          </div>
                          {/* Badge estado */}
                          <span style={{
                            display:'inline-flex',alignItems:'center',gap:'4px',
                            background:cfg.bg,border:`1px solid ${cfg.border}`,
                            borderRadius:'4px',padding:'2px 8px',
                            fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'600',color:cfg.text,
                            whiteSpace:'nowrap',flexShrink:0,
                          }}>
                            <span style={{width:'4px',height:'4px',borderRadius:'50%',background:cfg.dot}}/>
                            {cfg.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Columna derecha ────────────────────────────────── */}
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

              {/* Card cliente */}
              <div className="cd-fade" style={{
                background:'rgba(8,20,48,0.75)', backdropFilter:'blur(16px)',
                border:'1px solid rgba(201,168,76,0.14)', borderRadius:'16px',
                overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.35)',
                animationDelay:'0.1s',
              }}>
                <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <User size={14} style={{color:'rgba(201,168,76,0.8)'}}/>
                  </div>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:'14px',fontWeight:'700',color:'rgba(255,255,255,0.92)',margin:0}}>Cliente</p>
                </div>

                {cliente ? (
                  <div style={{padding:'16px 20px'}}>
                    {/* Avatar + nombre */}
                    <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
                      <ClienteAvatar nombre={cliente.nombre} size={42}/>
                      <div>
                        <p style={{fontFamily:"'Playfair Display',serif",fontSize:'14px',fontWeight:'700',color:'rgba(255,255,255,0.92)',margin:'0 0 2px'}}>{cliente.nombre}</p>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:'600',color:'rgba(201,168,76,0.65)',margin:0,letterSpacing:'0.5px'}}>Cliente</p>
                      </div>
                    </div>

                    {/* Datos de contacto */}
                    <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px'}}>
                      {cliente.telefono && (
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <Phone size={12} style={{color:'rgba(255,255,255,0.3)',flexShrink:0}}/>
                          <span style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.55)'}}>{cliente.telefono}</span>
                        </div>
                      )}
                      {cliente.correo && (
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <Mail size={12} style={{color:'rgba(255,255,255,0.3)',flexShrink:0}}/>
                          <span style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.55)',wordBreak:'break-all'}}>{cliente.correo}</span>
                        </div>
                      )}
                      {cliente.direccion && (
                        <div style={{display:'flex',alignItems:'flex-start',gap:'8px'}}>
                          <Home size={12} style={{color:'rgba(255,255,255,0.3)',flexShrink:0,marginTop:'1px'}}/>
                          <span style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.55)',lineHeight:1.5}}>{cliente.direccion}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={()=>navigate(`/panel/clientes/${cliente.id_cliente}`)}
                      className="cd-link-btn">
                      Ver perfil completo <ChevronRight size={12}/>
                    </button>
                  </div>
                ) : (
                  <div style={{padding:'28px 20px',textAlign:'center'}}>
                    <User size={22} style={{color:'rgba(255,255,255,0.15)',margin:'0 auto 8px',display:'block'}}/>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.3)',margin:0}}>Sin cliente asignado</p>
                  </div>
                )}
              </div>

              {/* Resumen */}
              <div className="cd-fade" style={{
                background:'rgba(8,20,48,0.75)', backdropFilter:'blur(16px)',
                border:'1px solid rgba(201,168,76,0.14)', borderRadius:'16px',
                overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.35)',
                animationDelay:'0.16s',
              }}>
                <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Clock size={14} style={{color:'rgba(201,168,76,0.8)'}}/>
                  </div>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:'14px',fontWeight:'700',color:'rgba(255,255,255,0.92)',margin:0}}>Resumen</p>
                </div>
                <div style={{padding:'8px 20px 12px'}}>
                  {[
                    { label:'Estado actual',   value:estadoCfg.label, isBadge:true, badgeEstado:caso.estado },
                    { label:'Tipo de materia', value:caso.tipo,       isTipo:true  },
                    { label:'Citas agendadas', value:`${citas.length} cita${citas.length!==1?'s':''}` },
                    { label:'Apertura',        value:formatFecha(caso.fecha_apertura) },
                    { label:'Fecha límite',    value:formatFecha(caso.fecha_limite)   },
                  ].map(item=>(
                    <div key={item.label} style={{
                      display:'flex',alignItems:'center',justifyContent:'space-between',
                      padding:'10px 0',
                      borderBottom:'1px solid rgba(255,255,255,0.05)',
                    }}>
                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.38)',margin:0}}>{item.label}</p>
                      {item.isBadge
                        ? <Badge estado={item.badgeEstado} config={ESTADO_CONFIG}/>
                        : item.isTipo
                          ? <TipoBadge tipo={item.value}/>
                          : <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',fontWeight:'600',color:'rgba(255,255,255,0.75)',margin:0,textAlign:'right',maxWidth:'160px'}}>{item.value || '—'}</p>
                      }
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
          </>)}
        </div>
      </div>
    </>
  )
}