import { useState, useEffect } from 'react'
import { getMisCasos, getMovimientos, chatCaso, getTimeline } from '../cases/casesService'
import { useToast, Toast } from '../../components/ui/Toast'
import { getMisDocumentos }            from '../documents/documentsService'
import {
  FolderOpen, Clock, CheckCircle, XCircle,
  AlertCircle, FileText, Calendar, CalendarDays,
  ChevronRight, ChevronDown, ChevronUp, Download, Lock, Eye,
  Bell, Gavel, Scale, Users, Sparkles, Send, Loader2, MessageSquare, History
} from 'lucide-react'

// ── Estado config premium ─────────────────────────────────────────
const ESTADO_CONFIG = {
  activo:      { label:'Activo',      bg:'rgba(59,130,246,0.12)',  border:'rgba(59,130,246,0.28)',  text:'#93BBFC', dot:'#3B82F6', icon:CheckCircle, cardBg:'rgba(59,130,246,0.06)',  cardBorder:'rgba(59,130,246,0.18)'  },
  urgente:     { label:'Urgente',     bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.28)',   text:'#FCA5A5', dot:'#EF4444', icon:AlertCircle, cardBg:'rgba(239,68,68,0.06)',   cardBorder:'rgba(239,68,68,0.18)'   },
  pendiente:   { label:'Pendiente',   bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.28)',  text:'#FCD34D', dot:'#F59E0B', icon:Clock,       cardBg:'rgba(245,158,11,0.06)',  cardBorder:'rgba(245,158,11,0.18)'  },
  en_revision: { label:'En revisión', bg:'rgba(139,92,246,0.12)',  border:'rgba(139,92,246,0.28)',  text:'#C4B5FD', dot:'#8B5CF6', icon:FileText,    cardBg:'rgba(139,92,246,0.06)',  cardBorder:'rgba(139,92,246,0.18)'  },
  cerrado:     { label:'Cerrado',     bg:'rgba(107,114,128,0.12)', border:'rgba(107,114,128,0.28)', text:'#9CA3AF', dot:'#6B7280', icon:XCircle,     cardBg:'rgba(107,114,128,0.05)', cardBorder:'rgba(107,114,128,0.15)' },
}

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    day:'numeric', month:'long', year:'numeric'
  })
}

// ── Semáforo de estado ────────────────────────────────────────────
function calcularSemaforo(caso, docs = []) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  if (caso.estado === 'cerrado') return null

  if (caso.estado === 'urgente') return 'rojo'

  if (caso.fecha_limite) {
    const limite = new Date(caso.fecha_limite + 'T12:00:00')
    const diffDias = Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24))
    if (diffDias <= 3) return 'rojo'
    if (diffDias <= 14) return 'amarillo'
  }

  const hayBloqueados = docs.some(d => d.bloqueado)
  if (hayBloqueados) return 'amarillo'

  return 'verde'
}

const SEMAFORO_CFG = {
  rojo:     { color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.35)',   label: 'Requiere atención urgente' },
  amarillo: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.35)',  label: 'Atención recomendada' },
  verde:    { color: '#22C55E', bg: 'rgba(34,197,94,0.15)',   border: 'rgba(34,197,94,0.35)',   label: 'Caso al día' },
}

function Badge({ estado }) {
  const c = ESTADO_CONFIG[estado] || ESTADO_CONFIG.activo
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

export default function MisCasosPage() {
  const { toast, showToast } = useToast()
  const [casos,        setCasos]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [filtro,       setFiltro]       = useState('')
  const [casoExpandido,setCasoExpandido]= useState(null)
  const [docsPorCaso,  setDocsPorCaso]  = useState({})
  const [loadingDocs,  setLoadingDocs]  = useState(false)
  const [movsPorCaso,  setMovsPorCaso]  = useState({})
  const [expandedIA,   setExpandedIA]   = useState(null)
  const [chatPorCaso,  setChatPorCaso]  = useState({}) // { [id_caso]: { open, history, input, loading } }
  const [previewDoc,       setPreviewDoc]       = useState(null) // { id, nombre, tipo, blobUrl }
  const [timelinePorCaso,  setTimelinePorCaso]  = useState({}) // { [id_caso]: events[] }
  const [tlLoadingPorCaso, setTlLoadingPorCaso] = useState({}) // { [id_caso]: bool }
  const [tlAbierto,        setTlAbierto]        = useState({}) // { [id_caso]: bool }

  const getChatState = (id) => chatPorCaso[id] || { open:false, history:[], input:'', loading:false }
  const setChatState = (id, patch) => setChatPorCaso(prev => ({
    ...prev, [id]: { ...getChatState(id), ...patch }
  }))

  const sendClientChat = async (id_caso) => {
    const cs = getChatState(id_caso)
    if (!cs.input.trim() || cs.loading) return
    const pregunta = cs.input.trim()
    const newHistory = [...cs.history, { role:'user', content:pregunta }]
    setChatState(id_caso, { input:'', history:newHistory, loading:true })
    try {
      const r = await chatCaso(id_caso, { pregunta, historial:cs.history })
      setChatState(id_caso, { history:[...newHistory, { role:'assistant', content:r.data.respuesta }], loading:false })
    } catch {
      setChatState(id_caso, { history:[...newHistory, { role:'assistant', content:'Error al conectar con el asistente. Intenta de nuevo.' }], loading:false })
    }
  }

  const toggleHistorial = async (id_caso) => {
    const yaAbierto = tlAbierto[id_caso]
    setTlAbierto(prev => ({ ...prev, [id_caso]: !yaAbierto }))
    if (!yaAbierto && !timelinePorCaso[id_caso]) {
      setTlLoadingPorCaso(prev => ({ ...prev, [id_caso]: true }))
      getTimeline(id_caso)
        .then(res => {
          const eventos = (res.data.timeline || []).filter(ev => ev.tipo !== 'comentario')
          setTimelinePorCaso(prev => ({ ...prev, [id_caso]: eventos }))
        })
        .catch(() => setTimelinePorCaso(prev => ({ ...prev, [id_caso]: [] })))
        .finally(() => setTlLoadingPorCaso(prev => ({ ...prev, [id_caso]: false })))
    }
  }

  useEffect(() => {
    getMisCasos()
      .then(r => setCasos(r.data.casos))
      .catch(() => setError('Error al cargar tus casos'))
      .finally(() => setLoading(false))
  }, [])

  const filtrados  = filtro ? casos.filter(c => c.estado === filtro) : casos
  const activos    = casos.filter(c => ['activo','urgente','en_revision'].includes(c.estado)).length
  const pendientes = casos.filter(c => c.estado === 'pendiente').length
  const cerrados   = casos.filter(c => c.estado === 'cerrado').length

  const toggleCaso = async (id_caso) => {
    if (casoExpandido === id_caso) { setCasoExpandido(null); return }
    setCasoExpandido(id_caso)
    const pending = []
    if (!docsPorCaso[id_caso]) {
      setLoadingDocs(true)
      pending.push(
        getMisDocumentos(id_caso)
          .then(r => setDocsPorCaso(prev => ({ ...prev, [id_caso]: r.data.documentos })))
          .catch(() => setDocsPorCaso(prev => ({ ...prev, [id_caso]: [] })))
      )
    }
    if (!movsPorCaso[id_caso]) {
      pending.push(
        getMovimientos(id_caso)
          .then(r => setMovsPorCaso(prev => ({ ...prev, [id_caso]: r.data.movimientos })))
          .catch(() => setMovsPorCaso(prev => ({ ...prev, [id_caso]: [] })))
      )
    }
    if (pending.length) await Promise.all(pending).finally(() => setLoadingDocs(false))
  }

  const handlePreview = async (doc) => {
    try {
      const token = localStorage.getItem('token')
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const res = await fetch(`${apiBase}/documentos/mis-documentos/${doc.id_documento}/preview`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 401) { window.location.href = '/login'; return }
      if (res.status === 403) {
        const data = await res.json()
        showToast(data.message || 'Documento no disponible para vista previa', 'warn')
        return
      }
      if (!res.ok) {
        try { const d = await res.json(); showToast(d.message || 'Error al cargar la vista previa', 'warn') }
        catch { showToast('Error al cargar la vista previa') }
        return
      }
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      setPreviewDoc({ id: doc.id_documento, nombre: doc.nombre_original, tipo: doc.tipo, blobUrl })
    } catch { showToast('Error de conexión al cargar vista previa') }
  }

  const closePreview = () => {
    if (previewDoc?.blobUrl) URL.revokeObjectURL(previewDoc.blobUrl)
    setPreviewDoc(null)
  }

  const handleDescargar = async (id, nombre) => {
    try {
      const token = localStorage.getItem('token')
      const res   = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/documentos/mis-documentos/${id}/descargar`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.status === 401) { window.location.href = '/login'; return }
      if (res.status === 403) { showToast('Este documento aún no ha sido liberado para descarga', 'warn'); return }
      if (!res.ok) {
        try { const d = await res.json(); showToast(d.message || 'Error al descargar el archivo', 'warn') }
        catch { showToast('Error al descargar el archivo') }
        return
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = nombre; a.click()
      URL.revokeObjectURL(url)
    } catch { showToast('Error de conexión al descargar') }
  }

  return (
    <>
      <Toast toast={toast} />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .mc-fade { animation: fadeUp 0.4s ease both; }

        .mc-chip {
          padding:6px 14px; border-radius:8px;
          font-family:'Inter',sans-serif; font-size:12px; font-weight:600;
          cursor:pointer; transition:all 0.15s ease;
          border:1px solid rgba(255,255,255,0.08);
          background:rgba(255,255,255,0.04);
          color:rgba(255,255,255,0.5);
          white-space:nowrap;
        }
        .mc-chip:hover { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.85); }
        .mc-chip.active { background:rgba(201,168,76,0.14); border-color:rgba(201,168,76,0.32); color:rgba(201,168,76,0.95); }

        .mc-caso-card {
          border-radius:14px; overflow:hidden;
          transition:all 0.2s ease;
          cursor:pointer;
        }
        .mc-caso-card:hover { transform:translateY(-1px); }

        .mc-doc-row {
          display:flex; align-items:center; gap:10px;
          padding:10px 14px;
          border-bottom:1px solid rgba(255,255,255,0.04);
          transition:background 0.15s ease;
        }
        .mc-doc-row:hover { background:rgba(201,168,76,0.04); }
        .mc-doc-row:last-child { border-bottom:none; }

        .mc-dl-btn {
          display:inline-flex; align-items:center; gap:5px;
          padding:5px 11px; border-radius:7px;
          background:rgba(201,168,76,0.12);
          border:1px solid rgba(201,168,76,0.25);
          color:rgba(201,168,76,0.85);
          font-family:'Inter',sans-serif; font-size:11px; font-weight:600;
          cursor:pointer; transition:all 0.15s ease; flex-shrink:0;
        }
        .mc-dl-btn:hover { background:rgba(201,168,76,0.2); border-color:rgba(201,168,76,0.4); }

        /* ── Responsive ≤700px ──────────────────────────────── */
        .mc-page-header  { padding: 24px 32px 20px; }
        .mc-page-content { padding: 24px 32px; max-width: 900px; }
        .mc-stats-grid   { grid-template-columns: repeat(3,1fr); gap: 12px; }
        .mc-stat-num     { font-size: 30px; }
        .mc-card-hdr     { padding: 16px 20px; display:flex; align-items:center; gap:14px; }
        .mc-card-right   { display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .mc-doc-actions  { display:flex; gap:6px; flex-shrink:0; }

        @media (max-width: 700px) {
          .mc-page-header  { padding: 14px 16px 12px; }
          .mc-page-content { padding: 12px 14px; }
          .mc-stats-grid   { grid-template-columns: repeat(3,1fr); gap: 8px; }
          .mc-stat-num     { font-size: 22px !important; letter-spacing: -0.5px !important; }
          .mc-stat-card    { padding: 10px 10px !important; }
          .mc-stat-label   { font-size: 9px !important; letter-spacing: 1px !important; }

          .mc-card-hdr     { padding: 12px 14px; gap: 10px; flex-wrap: wrap; }
          .mc-card-icon    { width: 34px !important; height: 34px !important; }
          .mc-card-right   { width: 100%; justify-content: flex-end; gap: 8px; }

          .mc-doc-row      { flex-wrap: wrap; gap: 8px; padding: 10px 12px; }
          .mc-doc-info     { flex: 1 1 100%; min-width: 0; }
          .mc-doc-actions  { flex-direction: row; justify-content: flex-end; width: 100%; }

          .mc-chip         { padding: 5px 10px; font-size: 11px; }
        }
      `}</style>

      <div style={{
        flex:1, overflowY:'auto', minHeight:'100vh',
        background:`
          radial-gradient(ellipse at 8% 15%,  rgba(201,168,76,0.06) 0%, transparent 48%),
          radial-gradient(ellipse at 92% 85%,  rgba(59,130,246,0.04) 0%, transparent 48%),
          linear-gradient(160deg,#020818 0%,#040d20 50%,#02050f 100%)
        `,
      }}>

        {/* ── Page header ────────────────────────────────────── */}
        <div className="mc-fade mc-page-header" style={{
          background:'linear-gradient(135deg,rgba(6,16,40,0.97) 0%,rgba(12,26,56,0.9) 100%)',
          borderBottom:'1px solid rgba(201,168,76,0.14)',
          position:'relative', overflow:'hidden',
        }}>
          {[160,110].map((s,i)=>(
            <div key={i} style={{position:'absolute',top:-s*0.4,right:-s*0.4,width:s,height:s,borderRadius:'50%',border:`1px solid rgba(201,168,76,${0.06-i*0.02})`,pointerEvents:'none'}}/>
          ))}
          <div style={{position:'relative',zIndex:1}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'3px',textTransform:'uppercase',color:'rgba(201,168,76,0.85)',margin:'0 0 6px'}}>
              Portal del Cliente
            </p>
            <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'24px',fontWeight:'700',color:'rgba(255,255,255,0.96)',margin:'0 0 3px',textShadow:'0 2px 6px rgba(0,0,0,0.35)'}}>
              Mis Expedientes
            </h1>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.38)',margin:0}}>
              Expedientes jurídicos vinculados a tu cuenta
            </p>
          </div>
          <div style={{position:'absolute',bottom:0,left:'32px',width:'44px',height:'1px',background:'linear-gradient(90deg,rgba(201,168,76,0.55),transparent)'}}/>
        </div>

        <div className="mc-page-content">

          {/* Stats */}
          <div className="mc-fade mc-stats-grid" style={{display:'grid',marginBottom:'20px',animationDelay:'0.06s'}}>
            {[
              {label:'Casos activos', val:activos,    color:'#93BBFC', bg:'rgba(59,130,246,0.08)',  border:'rgba(59,130,246,0.2)' },
              {label:'Pendientes',    val:pendientes, color:'#FCD34D', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)'},
              {label:'Cerrados',      val:cerrados,   color:'#9CA3AF', bg:'rgba(107,114,128,0.08)',border:'rgba(107,114,128,0.15)'},
            ].map((s,i)=>(
              <div key={s.label} className="mc-fade mc-stat-card" style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:'12px',padding:'14px 18px',backdropFilter:'blur(12px)',animationDelay:`${0.08+i*0.05}s`}}>
                <p className="mc-stat-label" style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',color:`${s.color}99`,margin:'0 0 6px'}}>{s.label}</p>
                <p className="mc-stat-num" style={{fontFamily:"'Inter',sans-serif",fontSize:'30px',fontWeight:'800',color:'rgba(255,255,255,0.93)',margin:0,lineHeight:1,letterSpacing:'-1px'}}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="mc-fade" style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'18px',animationDelay:'0.14s'}}>
            {[
              {val:'',           label:'Todos'      },
              {val:'activo',     label:'Activos'    },
              {val:'urgente',    label:'Urgentes'   },
              {val:'pendiente',  label:'Pendientes' },
              {val:'en_revision',label:'En revisión'},
              {val:'cerrado',    label:'Cerrados'   },
            ].map(opt=>(
              <button key={opt.val}
                className={`mc-chip${filtro===opt.val?' active':''}`}
                onClick={()=>setFiltro(opt.val)}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Contenido */}
          {loading ? (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {[...Array(3)].map((_,i)=>(
                <div key={i} style={{height:'84px',borderRadius:'14px',background:'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 100%)',backgroundSize:'400px 100%',animation:'shimmer 1.4s ease infinite'}}/>
              ))}
            </div>
          ) : error ? (
            <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:'12px',padding:'18px 20px'}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'#FCA5A5',margin:0}}>{error}</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{padding:'56px 24px',textAlign:'center',background:'rgba(8,20,48,0.5)',backdropFilter:'blur(12px)',border:'1px solid rgba(201,168,76,0.1)',borderRadius:'16px',display:'flex',flexDirection:'column',alignItems:'center'}}>
              <div style={{width:'56px',height:'56px',borderRadius:'14px',background:'rgba(201,168,76,0.07)',border:'1px solid rgba(201,168,76,0.15)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px'}}>
                <FolderOpen size={24} style={{color:'rgba(201,168,76,0.45)'}}/>
              </div>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:'16px',fontWeight:'700',color:'rgba(255,255,255,0.65)',margin:'0 0 7px'}}>
                {filtro ? 'Sin casos con ese estado' : 'Sin expedientes asignados'}
              </p>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.32)',margin:0,maxWidth:'260px',lineHeight:1.6}}>
                El despacho te asignará un expediente cuando inicie tu proceso
              </p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {filtrados.map((caso,idx)=>{
                const cfg  = ESTADO_CONFIG[caso.estado] || ESTADO_CONFIG.activo
                const Icon = cfg.icon
                const expanded = casoExpandido === caso.id_caso
                return (
                  <div key={caso.id_caso} className="mc-caso-card mc-fade"
                    style={{
                      background: expanded ? 'rgba(8,20,48,0.85)' : 'rgba(8,20,48,0.7)',
                      backdropFilter:'blur(16px)',
                      border:`1px solid ${expanded ? cfg.cardBorder : 'rgba(255,255,255,0.07)'}`,
                      boxShadow: expanded ? `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)` : '0 2px 12px rgba(0,0,0,0.2)',
                      animationDelay:`${idx*0.05}s`,
                    }}
                  >
                    {/* Línea lateral de color */}
                    <div style={{display:'flex'}}>
                      <div style={{width:'3px',flexShrink:0,background:`linear-gradient(to bottom,${cfg.dot},transparent)`,borderRadius:'14px 0 0 14px'}}/>

                      {/* Header */}
                      <div style={{flex:1}} onClick={()=>toggleCaso(caso.id_caso)}>
                        <div className="mc-card-hdr">
                          {/* Ícono estado */}
                          <div className="mc-card-icon" style={{
                            width:'40px', height:'40px', borderRadius:'10px', flexShrink:0,
                            background:cfg.cardBg, border:`1px solid ${cfg.cardBorder}`,
                            display:'flex', alignItems:'center', justifyContent:'center',
                          }}>
                            <Icon size={18} style={{color:cfg.dot}}/>
                          </div>

                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px',flexWrap:'wrap'}}>
                              <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',color:'rgba(201,168,76,0.85)',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'4px',padding:'2px 7px',letterSpacing:'0.4px'}}>
                                {caso.folio}
                              </span>
                              <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'4px',padding:'2px 7px'}}>
                                {caso.tipo}
                              </span>
                            </div>
                            <p style={{fontFamily:"'Playfair Display',serif",fontSize:'14px',fontWeight:'700',color:'rgba(255,255,255,0.92)',margin:'0 0 4px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                              {caso.asunto}
                            </p>
                            <span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)',display:'flex',alignItems:'center',gap:'4px'}}>
                              <Calendar size={10}/> {formatFecha(caso.fecha_apertura)}
                            </span>
                          </div>

                          <div className="mc-card-right">
                            {(() => {
                              const semaforo = calcularSemaforo(caso, docsPorCaso[caso.id_caso] || [])
                              if (!semaforo) return null
                              const s = SEMAFORO_CFG[semaforo]
                              return (
                                <div
                                  title={s.label}
                                  style={{
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: s.color,
                                    boxShadow: `0 0 6px ${s.color}`,
                                    flexShrink: 0,
                                    cursor: 'help',
                                  }}
                                />
                              )
                            })()}
                            <Badge estado={caso.estado}/>
                            {expanded
                              ? <ChevronDown size={15} style={{color:'rgba(255,255,255,0.3)'}}/>
                              : <ChevronRight size={15} style={{color:'rgba(255,255,255,0.3)'}}/>
                            }
                          </div>
                        </div>

                        {/* Panel expandido */}
                        {expanded && (() => {
                          const TIPO_CFG = {
                            auto:      { label:'Auto',      color:'#FB923C', Icon:Gavel    },
                            sentencia: { label:'Sentencia', color:'#FCA5A5', Icon:Scale    },
                            audiencia: { label:'Audiencia', color:'#86EFAC', Icon:Users    },
                            oficio:    { label:'Oficio',    color:'#93BBFC', Icon:FileText },
                            otro:      { label:'Notif.',    color:'#C4B5FD', Icon:Bell     },
                          }
                          const movs = movsPorCaso[caso.id_caso] || []
                          return (
                          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',padding:'14px 20px 16px',background:'rgba(4,12,32,0.4)'}}>

                            {/* ── Alertas procesales ── */}
                            {movs.length > 0 && (
                              <div style={{marginBottom:'16px'}}>
                                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',color:'rgba(251,146,60,0.75)',margin:'0 0 10px',display:'flex',alignItems:'center',gap:'6px'}}>
                                  <Bell size={12}/> Alertas procesales ({movs.length})
                                </p>
                                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                                  {movs.map(mov => {
                                    const c = TIPO_CFG[mov.tipo] || TIPO_CFG.otro
                                    const Icon = c.Icon
                                    const fecha = new Date(mov.fecha_movimiento + 'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'})
                                    return (
                                      <div key={mov.id_movimiento} style={{display:'flex',gap:'10px',alignItems:'flex-start',padding:'10px 12px',background:'rgba(251,146,60,0.05)',border:'1px solid rgba(251,146,60,0.15)',borderRadius:'8px'}}>
                                        <Icon size={13} style={{color:c.color,flexShrink:0,marginTop:'2px'}}/>
                                        <div style={{flex:1,minWidth:0}}>
                                          <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px',flexWrap:'wrap'}}>
                                            <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',color:c.color}}>{c.label}</span>
                                            <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.3)'}}>{fecha}</span>
                                          </div>
                                          <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.65)',margin:0,lineHeight:1.5}}>{mov.descripcion}</p>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',color:'rgba(201,168,76,0.65)',margin:'0 0 12px',display:'flex',alignItems:'center',gap:'6px'}}>
                              <FileText size={12}/> Documentos del expediente
                            </p>

                            {loadingDocs ? (
                              <div style={{padding:'16px',textAlign:'center'}}>
                                <div style={{width:'22px',height:'22px',borderRadius:'50%',border:'2px solid rgba(201,168,76,0.3)',borderTopColor:'#C9A84C',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/>
                                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                              </div>
                            ) : (docsPorCaso[caso.id_caso]||[]).length === 0 ? (
                              <div style={{textAlign:'center',padding:'20px',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
                                <FileText size={22} style={{color:'rgba(255,255,255,0.15)'}}/>
                                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.3)',margin:0}}>
                                  No hay documentos disponibles para este caso
                                </p>
                              </div>
                            ) : (
                              <div style={{background:'rgba(8,20,48,0.5)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',overflow:'visible'}}>
                                {(docsPorCaso[caso.id_caso]||[]).map(doc=>{
                                  const ia = doc.analisis ? (() => { try { return JSON.parse(doc.analisis) } catch { return null } })() : null
                                  const iaOpen = expandedIA === doc.id_documento
                                  const urgColor = ia?.urgencia === 'alta' ? '#FCA5A5' : ia?.urgencia === 'media' ? '#FCD34D' : '#86EFAC'
                                  return (
                                    <div key={doc.id_documento}>
                                      <div className="mc-doc-row">
                                        <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                          <FileText size={14} style={{color:'rgba(201,168,76,0.7)'}}/>
                                        </div>
                                        <div className="mc-doc-info" style={{flex:1,minWidth:0}}>
                                          <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'500',color:'rgba(255,255,255,0.85)',margin:'0 0 2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                                            {doc.nombre_original}
                                          </p>
                                          <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.3)',margin:0}}>
                                            {new Date(doc.createdAt).toLocaleDateString('es-MX')}
                                            {doc.descripcion ? ` · ${doc.descripcion}` : ''}
                                          </p>
                                          {ia && (
                                            <button
                                              onClick={e => { e.stopPropagation(); setExpandedIA(iaOpen ? null : doc.id_documento) }}
                                              style={{
                                                display:'inline-flex', alignItems:'center', gap:'4px',
                                                marginTop:'3px',
                                                padding:'3px 9px', borderRadius:'6px',
                                                background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.28)',
                                                color:'rgba(196,181,253,0.85)',
                                                fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:'600',
                                                cursor:'pointer', transition:'all 0.15s ease',
                                              }}
                                            >
                                              <Sparkles size={9}/> Resumen IA {iaOpen ? <ChevronUp size={9}/> : <ChevronDown size={9}/>}
                                            </button>
                                          )}
                                        </div>
                                        {doc.bloqueado ? (
                                          <button
                                            onClick={e=>{e.stopPropagation(); setPreviewDoc({ id: doc.id_documento, nombre: doc.nombre_original, tipo: doc.tipo, blobUrl: null, bloqueado: true })}}
                                            style={{
                                              display:'inline-flex', alignItems:'center', gap:'5px',
                                              padding:'5px 11px', borderRadius:'7px',
                                              background:'rgba(251,146,60,0.08)',
                                              border:'1px solid rgba(251,146,60,0.22)',
                                              color:'rgba(251,146,60,0.65)',
                                              fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:'600',
                                              cursor:'pointer', flexShrink:0,
                                              transition:'all 0.15s ease',
                                            }}
                                          >
                                            <Lock size={11}/> Vista previa
                                          </button>
                                        ) : (
                                          <div className="mc-doc-actions">
                                            <button
                                              className="mc-dl-btn"
                                              onClick={e=>{e.stopPropagation(); handlePreview(doc)}}
                                              style={{ background:'rgba(59,130,246,0.1)', borderColor:'rgba(59,130,246,0.25)', color:'rgba(147,187,252,0.85)' }}
                                            >
                                              <Eye size={11}/> Ver
                                            </button>
                                            <button className="mc-dl-btn"
                                              onClick={e=>{e.stopPropagation();handleDescargar(doc.id_documento,doc.nombre_original)}}>
                                              <Download size={11}/> Descargar
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      {ia && iaOpen && (
                                        <div style={{
                                          padding:'12px 16px',
                                          background:'rgba(139,92,246,0.06)',
                                          border:'1px dashed rgba(139,92,246,0.28)',
                                          borderRadius:'8px',
                                          margin:'0 0 6px',
                                        }}>
                                          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                                            <Sparkles size={12} style={{color:'#C4B5FD',flexShrink:0}}/>
                                            <span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:'700',letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(196,181,253,0.8)'}}>
                                              Resumen IA
                                            </span>
                                            {ia.urgencia && (
                                              <span style={{marginLeft:'auto',padding:'2px 8px',borderRadius:'4px',background:`${urgColor}18`,border:`1px solid ${urgColor}40`,fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',color:urgColor,textTransform:'uppercase',letterSpacing:'0.5px'}}>
                                                {ia.urgencia === 'alta' ? 'Urgencia alta' : ia.urgencia === 'media' ? 'Urgencia media' : 'Urgencia baja'}
                                              </span>
                                            )}
                                          </div>
                                          {ia.resumen && (
                                            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.7)',margin:'0 0 8px',lineHeight:1.6}}>
                                              {ia.resumen}
                                            </p>
                                          )}
                                          {ia.puntosClave?.length > 0 && (
                                            <div>
                                              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'1px',textTransform:'uppercase',color:'rgba(196,181,253,0.6)',margin:'0 0 5px'}}>
                                                Puntos clave
                                              </p>
                                              <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:'4px'}}>
                                                {ia.puntosClave.map((p,i) => (
                                                  <li key={i} style={{display:'flex',gap:'7px',alignItems:'flex-start',fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.6)',lineHeight:1.5}}>
                                                    <span style={{color:'#C4B5FD',flexShrink:0,marginTop:'1px'}}>&#9679;</span>{p}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {/* ── Historial del caso ── */}
                            {(() => {
                              const TL_CFG = {
                                apertura:   { label:'Apertura',   color:'#C9A84C', bg:'rgba(201,168,76,0.1)',  Icon:Scale       },
                                documento:  { label:'Documento',  color:'#93BBFC', bg:'rgba(147,187,252,0.1)', Icon:FileText    },
                                cita:       { label:'Cita',       color:'#86EFAC', bg:'rgba(134,239,172,0.1)', Icon:CalendarDays},
                                movimiento: { label:'Movimiento', color:'#FB923C', bg:'rgba(251,146,60,0.1)',  Icon:Gavel       },
                              }
                              const tlOpen    = tlAbierto[caso.id_caso] || false
                              const tlEvents  = timelinePorCaso[caso.id_caso] || []
                              const tlLoading = tlLoadingPorCaso[caso.id_caso] || false
                              return (
                                <div style={{ marginTop:'16px' }}>
                                  <button
                                    onClick={e => { e.stopPropagation(); toggleHistorial(caso.id_caso) }}
                                    style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', cursor:'pointer', padding:0, marginBottom: tlOpen ? '10px' : 0 }}
                                  >
                                    <History size={12} style={{ color:'rgba(147,187,252,0.75)' }}/>
                                    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:'700', letterSpacing:'2px', textTransform:'uppercase', color:'rgba(147,187,252,0.75)' }}>
                                      Historial del caso
                                    </span>
                                    {tlOpen
                                      ? <ChevronDown size={10} style={{ color:'rgba(147,187,252,0.5)' }}/>
                                      : <ChevronRight size={10} style={{ color:'rgba(147,187,252,0.5)' }}/>
                                    }
                                  </button>
                                  {tlOpen && (
                                    <div onClick={e => e.stopPropagation()}>
                                      {tlLoading ? (
                                        <div style={{ padding:'16px', textAlign:'center' }}>
                                          <div style={{ width:'22px', height:'22px', borderRadius:'50%', border:'2px solid rgba(201,168,76,0.3)', borderTopColor:'#C9A84C', animation:'spin 0.8s linear infinite', margin:'0 auto' }}/>
                                        </div>
                                      ) : tlEvents.length === 0 ? (
                                        <div style={{ textAlign:'center', padding:'16px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
                                          <Clock size={18} style={{ color:'rgba(255,255,255,0.12)' }}/>
                                          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.3)', margin:0 }}>
                                            Sin eventos en el historial
                                          </p>
                                        </div>
                                      ) : (
                                        <div style={{ position:'relative', paddingLeft:'30px' }}>
                                          {/* Línea vertical */}
                                          <div style={{ position:'absolute', left:'10px', top:'12px', bottom:'12px', width:'1.5px', background:'linear-gradient(to bottom,rgba(147,187,252,0.5),rgba(147,187,252,0.05))' }}/>
                                          {tlEvents.map((ev, i) => {
                                            const cfg = TL_CFG[ev.tipo] || { label:ev.tipo, color:'#C4B5FD', bg:'rgba(196,181,253,0.1)', Icon:Clock }
                                            const EvIcon = cfg.Icon
                                            const fecha = ev.fecha
                                              ? new Date(ev.fecha).toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' })
                                              : '—'
                                            return (
                                              <div key={i} style={{ position:'relative', marginBottom:'12px' }}>
                                                {/* Nodo */}
                                                <div style={{ position:'absolute', left:'-23px', top:'10px', width:'20px', height:'20px', borderRadius:'50%', background:cfg.bg, border:`1.5px solid ${cfg.color}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                  <EvIcon size={9} style={{ color:cfg.color }}/>
                                                </div>
                                                {/* Card */}
                                                <div style={{ background:'rgba(8,20,48,0.55)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', padding:'9px 13px', transition:'border-color 0.15s' }}>
                                                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', marginBottom:'4px' }}>
                                                    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'9px', fontWeight:'700', letterSpacing:'1px', textTransform:'uppercase', color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.color}30`, borderRadius:'4px', padding:'2px 6px' }}>
                                                      {cfg.label}
                                                    </span>
                                                    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.28)', whiteSpace:'nowrap', flexShrink:0 }}>
                                                      {fecha}
                                                    </span>
                                                  </div>
                                                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.72)', margin:0, lineHeight:1.5, wordBreak:'break-word' }}>
                                                    {ev.descripcion}
                                                  </p>
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })()}

                            {/* ── Chat IA ── */}
                            {(() => {
                              const cs = getChatState(caso.id_caso)
                              return (
                                <div style={{marginTop:'16px'}}>
                                  <button
                                    onClick={e=>{e.stopPropagation();setChatState(caso.id_caso,{open:!cs.open})}}
                                    style={{display:'flex',alignItems:'center',gap:'6px',background:'none',border:'none',cursor:'pointer',padding:0,marginBottom: cs.open ? '10px' : 0}}
                                  >
                                    <Sparkles size={12} style={{color:'rgba(201,168,76,0.75)'}}/>
                                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',color:'rgba(201,168,76,0.75)'}}>
                                      Asistente IA {cs.open ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
                                    </span>
                                  </button>
                                  {cs.open && (
                                    <div style={{background:'rgba(8,20,48,0.6)',border:'1px solid rgba(201,168,76,0.12)',borderRadius:'10px',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
                                      {/* Mensajes */}
                                      <div style={{maxHeight:'260px',overflowY:'auto',padding:'12px 14px',display:'flex',flexDirection:'column',gap:'10px'}}>
                                        {cs.history.length === 0 && (
                                          <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px',opacity:0.5}}>
                                            <MessageSquare size={16} style={{color:'rgba(201,168,76,0.4)',flexShrink:0}}/>
                                            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.4)',margin:0,lineHeight:1.5}}>
                                              Pregunta sobre el estado de tu caso, documentos o próximas fechas.
                                            </p>
                                          </div>
                                        )}
                                        {cs.history.map((msg,i)=>(
                                          <div key={i} style={{display:'flex',justifyContent:msg.role==='user'?'flex-end':'flex-start'}}>
                                            <div style={{
                                              maxWidth:'85%',padding:'8px 12px',
                                              borderRadius:msg.role==='user'?'10px 10px 3px 10px':'10px 10px 10px 3px',
                                              background:msg.role==='user'?'rgba(201,168,76,0.12)':'rgba(139,92,246,0.1)',
                                              border:msg.role==='user'?'1px solid rgba(201,168,76,0.25)':'1px solid rgba(139,92,246,0.2)',
                                            }}>
                                              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.82)',margin:0,lineHeight:1.55,whiteSpace:'pre-wrap'}}>
                                                {msg.content}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                        {cs.loading && (
                                          <div style={{display:'flex',justifyContent:'flex-start'}}>
                                            <div style={{padding:'8px 12px',borderRadius:'10px 10px 10px 3px',background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.2)',display:'flex',alignItems:'center',gap:'6px'}}>
                                              <Loader2 size={12} style={{color:'#C4B5FD',animation:'spin 1s linear infinite'}}/>
                                              <span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(196,181,253,0.7)'}}>Consultando expediente…</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      {/* Input */}
                                      <div style={{padding:'10px 12px',borderTop:'1px solid rgba(255,255,255,0.05)',display:'flex',gap:'8px',alignItems:'center'}}>
                                        <input
                                          value={cs.input}
                                          onChange={e=>setChatState(caso.id_caso,{input:e.target.value})}
                                          onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();sendClientChat(caso.id_caso)}}}
                                          placeholder="Escribe tu consulta…"
                                          style={{flex:1,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',padding:'8px 12px',color:'rgba(255,255,255,0.82)',fontFamily:"'Inter',sans-serif",fontSize:'12px',outline:'none'}}
                                        />
                                        <button
                                          onClick={()=>sendClientChat(caso.id_caso)}
                                          disabled={!cs.input.trim()||cs.loading}
                                          style={{width:'34px',height:'34px',borderRadius:'8px',flexShrink:0,background:cs.input.trim()&&!cs.loading?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.03)',border:cs.input.trim()&&!cs.loading?'1px solid rgba(201,168,76,0.3)':'1px solid rgba(255,255,255,0.06)',color:cs.input.trim()&&!cs.loading?'#C9A84C':'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',cursor:cs.input.trim()&&!cs.loading?'pointer':'default',transition:'all 0.15s'}}
                                        >
                                          <Send size={13}/>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}

                          </div>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Preview de documentos ── */}
      {previewDoc && (
        <div
          onClick={closePreview}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(2,8,24,0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '860px',
              background: 'rgba(6,16,40,0.97)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              maxHeight: '90vh',
            }}
          >
            {/* Header modal */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(8,20,48,0.6)',
            }}>
              {previewDoc.bloqueado
                ? <Lock size={16} style={{ color: 'rgba(251,146,60,0.7)', flexShrink: 0 }} />
                : <FileText size={16} style={{ color: 'rgba(201,168,76,0.8)', flexShrink: 0 }} />
              }
              <span style={{
                flex: 1, fontFamily: "'Inter',sans-serif", fontSize: '13px',
                fontWeight: '600', color: previewDoc.bloqueado ? 'rgba(251,146,60,0.8)' : 'rgba(255,255,255,0.85)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {previewDoc.nombre}
              </span>
              <button
                onClick={closePreview}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '7px', padding: '5px 12px',
                  color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter',sans-serif",
                  fontSize: '12px', cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>

            {/* Contenido */}
            <div style={{ flex: 1, overflow: 'hidden', minHeight: '400px', display: 'flex', position: 'relative' }}>
              {previewDoc.bloqueado ? (
                <>
                  {/* Fondo difuminado simulado con líneas */}
                  <div style={{
                    flex: 1, padding: '32px',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    filter: 'blur(4px)', opacity: 0.18, pointerEvents: 'none',
                    userSelect: 'none',
                  }}>
                    {[80,60,90,50,70,40,85,55].map((w,i) => (
                      <div key={i} style={{
                        height: '12px', borderRadius: '4px',
                        width: `${w}%`,
                        background: 'rgba(255,255,255,0.4)',
                      }}/>
                    ))}
                  </div>
                  {/* Overlay con candado */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '16px',
                    background: 'rgba(2,8,24,0.55)',
                    backdropFilter: 'blur(2px)',
                  }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '16px',
                      background: 'rgba(251,146,60,0.12)',
                      border: '1px solid rgba(251,146,60,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Lock size={28} style={{ color: 'rgba(251,146,60,0.8)' }} />
                    </div>
                    <div style={{ textAlign: 'center', maxWidth: '320px' }}>
                      <p style={{
                        fontFamily: "'Playfair Display',serif", fontSize: '16px',
                        fontWeight: '700', color: 'rgba(255,255,255,0.85)', margin: '0 0 8px',
                      }}>
                        Documento en revisión
                      </p>
                      <p style={{
                        fontFamily: "'Inter',sans-serif", fontSize: '13px',
                        color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6,
                      }}>
                        El abogado liberará este documento cuando esté listo para tu consulta. Recibirás una notificación por correo.
                      </p>
                    </div>
                  </div>
                </>
              ) : previewDoc.tipo?.startsWith('image/') ? (
                <img
                  src={previewDoc.blobUrl}
                  alt={previewDoc.nombre}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                />
              ) : previewDoc.tipo === 'application/pdf' ? (
                <iframe
                  src={previewDoc.blobUrl}
                  title={previewDoc.nombre}
                  style={{ width: '100%', height: '100%', border: 'none', minHeight: '500px' }}
                />
              ) : (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px',
                }}>
                  <FileText size={48} style={{ color: 'rgba(201,168,76,0.4)' }} />
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0, textAlign: 'center' }}>
                    Vista previa no disponible para este tipo de archivo.<br />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{previewDoc.tipo}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}