import { useState, useEffect, useRef } from 'react'
import { useAuth }       from '../../context/AuthContext'
import { useToast, Toast } from '../../components/ui/Toast'
import { getCasos }      from '../cases/casesService'
import { getClientes }   from '../clients/clientsService'
import { getDocumentos, uploadDocumento, deleteDocumento, analizarDocumentoIA, toggleBloqueoDoc } from './documentsService'
import {
  Upload, Trash2, Download, FileText,
  File, Image, FileBadge, Search, FolderOpen, User,
  Lock, Unlock, Sparkles, ChevronDown, ChevronUp, Loader2
} from 'lucide-react'

// ── Helpers (lógica original intacta) ────────────────────────────
const CATEGORIA_CONFIG = {
  general:      { label: 'General',      bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  text: '#93BBFC', icon: Unlock },
  confidencial: { label: 'Confidencial', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   text: '#FCA5A5', icon: Lock   },
}

function getFileIcon(tipo) {
  if (!tipo) return File
  if (tipo.includes('pdf'))   return FileText
  if (tipo.includes('image')) return Image
  if (tipo.includes('word') || tipo.includes('document')) return FileBadge
  return File
}

function getFileColor(tipo) {
  if (!tipo) return { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' }
  if (tipo.includes('pdf'))   return { color: '#FCA5A5', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)'   }
  if (tipo.includes('image')) return { color: '#86EFAC', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)'   }
  if (tipo.includes('word') || tipo.includes('document'))
    return { color: '#93BBFC', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' }
  if (tipo.includes('sheet') || tipo.includes('excel'))
    return { color: '#86EFAC', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' }
  return { color: '#E8C97A', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.2)' }
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function CategoriaBadge({ categoria }) {
  const c = CATEGORIA_CONFIG[categoria] || CATEGORIA_CONFIG.general
  const Icon = c.icon
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'5px',
      background: c.bg, border:`1px solid ${c.border}`,
      borderRadius:'4px', padding:'2px 8px',
      fontFamily:"'Inter',sans-serif",
      fontSize:'10px', fontWeight:'600', color: c.text,
      whiteSpace:'nowrap',
    }}>
      <Icon size={10}/>{c.label}
    </span>
  )
}

// ── SVG icon empty state ──────────────────────────────────────────
const IconDocs = () => (
  <svg viewBox="0 0 56 56" width="52" height="52" fill="none">
    <defs>
      <linearGradient id="dg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8C97A"/><stop offset="100%" stopColor="#9A7A32"/>
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="rgba(201,168,76,0.08)" stroke="rgba(201,168,76,0.2)" strokeWidth="1"/>
    <rect x="20" y="10" width="20" height="26" rx="3" fill="none" stroke="url(#dg1)" strokeWidth="1.2" strokeOpacity="0.4"/>
    <rect x="14" y="14" width="22" height="28" rx="3" fill="rgba(201,168,76,0.1)" stroke="url(#dg1)" strokeWidth="1.4" strokeOpacity="0.7"/>
    <path d="M30 14 L36 20 L30 20 Z" fill="rgba(201,168,76,0.2)" stroke="url(#dg1)" strokeWidth="1"/>
    <rect x="18" y="24" width="12" height="1.5" rx="0.75" fill="rgba(201,168,76,0.5)"/>
    <rect x="18" y="28" width="14" height="1.5" rx="0.75" fill="rgba(255,255,255,0.2)"/>
    <rect x="18" y="32" width="10" height="1.5" rx="0.75" fill="rgba(255,255,255,0.15)"/>
    <rect x="18" y="36" width="13" height="1.5" rx="0.75" fill="rgba(255,255,255,0.15)"/>
  </svg>
)

export default function DocumentosPage() {
  const { toast, showToast } = useToast()
  const { canEditCases, canUploadConfidential } = useAuth()
  const fileInputRef = useRef(null)

  // ── Estado original intacto ───────────────────────────────────
  const [casos,       setCasos]       = useState([])
  const [clientes,    setClientes]    = useState([])
  const [casoSel,     setCasoSel]     = useState('')
  const [docs,        setDocs]        = useState([])
  const [loading,     setLoading]     = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [search,      setSearch]      = useState('')
  const [categoria,   setCategoria]   = useState('')
  const [archivos,    setArchivos]    = useState([])
  const [descripcion, setDescripcion] = useState('')
  const [catUpload,   setCatUpload]   = useState('general')
  const [dragOver,    setDragOver]    = useState(false)
  const [deleteId,    setDeleteId]    = useState(null)
  const [deleteNombre,setDeleteNombre]= useState('')
  const [expandedIA,  setExpandedIA]  = useState(null)
  const [analyzingIds, setAnalyzingIds] = useState(new Set())
  const [togglingIds, setTogglingIds] = useState(new Set())

  // ── Lógica original intacta ───────────────────────────────────
  useEffect(() => {
    getCasos({ limit: 100 }).then(r => setCasos(r.data.casos)).catch(() => {})
    getClientes({ limit: 100 }).then(r => setClientes(r.data.clientes)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!casoSel) { setDocs([]); return }
    setLoading(true)
    getDocumentos(casoSel)
      .then(r => setDocs(r.data.documentos))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [casoSel])

  const docsFiltrados = docs.filter(d => {
    const matchQ = !search    || d.nombre_original.toLowerCase().includes(search.toLowerCase())
    const matchC = !categoria || d.categoria === categoria
    return matchQ && matchC
  })

  const handleFiles = (files) => {
    setArchivos(prev => {
      const nombres = new Set(prev.map(f => f.name))
      return [...prev, ...Array.from(files).filter(f => !nombres.has(f.name))]
    })
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleUpload = async () => {
    if (!casoSel || archivos.length === 0) return
    setUploading(true)
    try {
      await Promise.all(archivos.map(f => uploadDocumento(casoSel, f, catUpload, descripcion)))
      setArchivos([]); setDescripcion('')
      const r = await getDocumentos(casoSel)
      setDocs(r.data.documentos)
    } catch { showToast('Error al subir archivos') }
    finally  { setUploading(false) }
  }

  const handleDelete = async (id, nombre) => {
    setDeleteId(id); setDeleteNombre(nombre)
  }

  const confirmDelete = async () => {
    try {
      await deleteDocumento(deleteId)
      setDocs(prev => prev.filter(d => d.id_documento !== deleteId))
      setDeleteId(null); setDeleteNombre('')
    } catch { showToast('Error al eliminar') }
  }

  const handleDescargar = async (id, nombre) => {
    try {
      const token = localStorage.getItem('token')
      const res   = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/documentos/${id}/descargar`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.status === 401) { window.location.href = '/login'; return }
      if (!res.ok) { showToast('Error al descargar el archivo'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = nombre; a.click()
      URL.revokeObjectURL(url)
    } catch { showToast('Error de conexión al descargar') }
  }

  const handleToggleLock = async (id) => {
    setTogglingIds(prev => new Set([...prev, id]))
    try {
      const r = await toggleBloqueoDoc(id)
      setDocs(prev => prev.map(d => d.id_documento === id ? { ...d, bloqueado: r.data.documento.bloqueado } : d))
    } catch { /* silencioso */ }
    finally {
      setTogglingIds(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  const handleAnalizar = async (id) => {
    setAnalyzingIds(prev => new Set([...prev, id]))
    try {
      await analizarDocumentoIA(id)
      const r = await getDocumentos(casoSel)
      setDocs(r.data.documentos)
    } catch { /* análisis falló, seguir sin mostrar error bloqueante */ }
    finally {
      setAnalyzingIds(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  const casoActual    = casos.find(c => String(c.id_caso) === String(casoSel))
  const clienteActual = casoActual ? clientes.find(cl => cl.id_cliente === casoActual.id_cliente) : null
  const totalGeneral      = docs.filter(d => d.categoria === 'general').length
  const totalConfidencial = docs.filter(d => d.categoria === 'confidencial').length

  return (
    <>
      <Toast toast={toast} />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .dc-fade { animation: fadeUp 0.4s ease both; }

        /* Select nativo con estilos premium */
        .dc-select-native {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.75);
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 500;
          outline: none;
          cursor: pointer;
          transition: all 0.15s ease;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(201,168,76,0.7)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 38px;
        }
        .dc-select-native:focus {
          border-color: rgba(201,168,76,0.5);
          background-color: rgba(201,168,76,0.04);
          box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
          color: rgba(201,168,76,0.9);
        }
        .dc-select-native option { background: #040d20; color: rgba(255,255,255,0.85); }
        .dc-select-native.has-value {
          border-color: rgba(201,168,76,0.28);
          color: rgba(201,168,76,0.9);
          background-color: rgba(201,168,76,0.06);
        }

        .dc-select-sm {
          padding: 8px 32px 8px 12px;
          border-radius: 9px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.65);
          font-family: 'Inter', sans-serif; font-size: 12px;
          outline: none; cursor: pointer; transition: all 0.15s ease;
          appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.35)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center;
        }
        .dc-select-sm:focus { border-color: rgba(201,168,76,0.4); box-shadow: 0 0 0 3px rgba(201,168,76,0.08); color: rgba(201,168,76,0.85); outline:none; }
        .dc-select-sm option { background: #040d20; }

        .dc-search { transition: all 0.15s ease; }
        .dc-search:focus { outline:none; border-color:rgba(201,168,76,0.5)!important; background:rgba(201,168,76,0.04)!important; box-shadow:0 0 0 3px rgba(201,168,76,0.1)!important; }
        .dc-search::placeholder { color:rgba(255,255,255,0.22); }

        .dc-input:focus { outline:none; border-color:rgba(201,168,76,0.5); background:rgba(201,168,76,0.04); box-shadow:0 0 0 3px rgba(201,168,76,0.1); }
        .dc-input::placeholder { color:rgba(255,255,255,0.2); }

        .dc-action { width:30px;height:30px;border-radius:7px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s ease;color:rgba(255,255,255,0.38); }
        .dc-action:hover.dl   { background:rgba(59,130,246,0.12);border-color:rgba(59,130,246,0.25);color:#93BBFC; }
        .dc-action:hover.del  { background:rgba(239,68,68,0.12); border-color:rgba(239,68,68,0.25); color:#FCA5A5; }
        .dc-action.lock-on    { background:rgba(251,146,60,0.1); border-color:rgba(251,146,60,0.3); color:#FB923C; }
        .dc-action.lock-on:hover { background:rgba(251,146,60,0.2); border-color:rgba(251,146,60,0.5); }
        .dc-action.lock-off   { background:rgba(134,239,172,0.08); border-color:rgba(134,239,172,0.25); color:#86EFAC; }
        .dc-action.lock-off:hover { background:rgba(134,239,172,0.16); border-color:rgba(134,239,172,0.45); }
        .dc-action:disabled   { opacity:0.45; cursor:not-allowed; }

        .dc-doc-row { display:flex;align-items:center;gap:12px;padding:13px 20px;border-bottom:1px solid rgba(255,255,255,0.04);transition:all 0.15s ease; }
        .dc-doc-row:hover { background:rgba(201,168,76,0.04);border-bottom-color:rgba(201,168,76,0.08); }
        .dc-doc-row:last-child { border-bottom:none; }

        .dc-ia-btn { display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25);color:#C4B5FD;font-family:'Inter',sans-serif;font-size:10px;font-weight:700;cursor:pointer;transition:all 0.15s ease; }
        .dc-ia-btn:hover { background:rgba(139,92,246,0.22);border-color:rgba(139,92,246,0.4); }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .dc-ia-panel { animation:fadeDown 0.2s ease both; }

        .dc-btn-primary { display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:8px;background:linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%);border:none;color:#020818;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s ease; }
        .dc-btn-primary:hover { background:linear-gradient(135deg,#E8C97A 0%,#C9A84C 100%);transform:translateY(-1px);box-shadow:0 4px 14px rgba(201,168,76,0.3); }
        .dc-btn-primary:disabled { opacity:0.5;cursor:not-allowed;transform:none;box-shadow:none; }

        .dc-modal-bg { position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(2,8,24,0.85);backdrop-filter:blur(8px); }

        .cat-chip { padding:6px 12px;border-radius:7px;font-family:'Inter',sans-serif;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s ease;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.45); }
        .cat-chip:hover { background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.8); }
        .cat-chip.active { background:rgba(201,168,76,0.15);border-color:rgba(201,168,76,0.3);color:rgba(201,168,76,0.9); }
      `}</style>

      {/* ── Root ─────────────────────────────────────────────── */}
      <div style={{
        flex:1, overflowY:'auto', minHeight:'100vh',
        background:`
          radial-gradient(ellipse at 10% 20%,rgba(201,168,76,0.05) 0%,transparent 48%),
          radial-gradient(ellipse at 90% 80%,rgba(59,130,246,0.04) 0%,transparent 48%),
          linear-gradient(160deg,#020818 0%,#040d20 50%,#02050f 100%)
        `,
      }}>

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="dc-fade" style={{
          background:'linear-gradient(135deg,rgba(6,16,40,0.97) 0%,rgba(12,26,56,0.9) 100%)',
          borderBottom:'1px solid rgba(201,168,76,0.14)',
          padding:'26px 36px 22px',
          position:'relative', overflow:'hidden',
        }}>
          {[180,120].map((s,i)=>(
            <div key={i} style={{position:'absolute',top:-s*0.4,right:-s*0.4,width:s,height:s,borderRadius:'50%',border:`1px solid rgba(201,168,76,${0.06-i*0.02})`,pointerEvents:'none'}}/>
          ))}
          <div style={{position:'relative',zIndex:1}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'3px',textTransform:'uppercase',color:'rgba(201,168,76,0.85)',margin:'0 0 7px'}}>
              Gestión de Documentos
            </p>
            <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'26px',fontWeight:'700',color:'rgba(255,255,255,0.96)',margin:'0 0 4px',textShadow:'0 2px 6px rgba(0,0,0,0.35)'}}>
              Repositorio de Archivos
            </h1>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.38)',margin:0}}>
              Selecciona un expediente para gestionar sus documentos
            </p>
          </div>
          <div style={{position:'absolute',bottom:0,left:'36px',width:'48px',height:'1px',background:'linear-gradient(90deg,rgba(201,168,76,0.55),transparent)'}}/>
        </div>

        <div style={{padding:'26px 36px',maxWidth:'1300px'}}>

          {/* ── Selector de caso — SELECT NATIVO (lógica original) ── */}
          <div className="dc-fade" style={{
            background:'rgba(8,20,48,0.75)',backdropFilter:'blur(16px)',
            border:'1px solid rgba(201,168,76,0.16)',borderRadius:'16px',
            padding:'20px 24px',marginBottom:'20px',
            boxShadow:'0 8px 32px rgba(0,0,0,0.4)',animationDelay:'0.06s',
          }}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'2.5px',textTransform:'uppercase',color:'rgba(201,168,76,0.7)',margin:'0 0 14px'}}>
              Expediente seleccionado
            </p>

            <div style={{display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
              {/* SELECT NATIVO — lógica original, solo estilos nuevos */}
              <div style={{flex:1,minWidth:'260px'}}>
                <label style={{display:'block',fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'1.8px',textTransform:'uppercase',color:'rgba(255,255,255,0.4)',marginBottom:'8px'}}>
                  Seleccionar expediente
                </label>
                <select
                  value={casoSel}
                  onChange={e => setCasoSel(e.target.value)}
                  className={`dc-select-native${casoSel ? ' has-value' : ''}`}
                >
                  <option value="">Selecciona un caso para ver sus documentos…</option>
                  {casos.map(c => {
                    const cli = clientes.find(cl => cl.id_cliente === c.id_cliente)
                    return (
                      <option key={c.id_caso} value={c.id_caso}>
                        {c.folio} — {c.asunto}{cli ? ` · ${cli.nombre}` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Card expediente seleccionado */}
              {casoActual && (
                <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'11px 16px',background:'rgba(201,168,76,0.07)',border:'1px solid rgba(201,168,76,0.18)',borderRadius:'12px',flexShrink:0}}>
                  <FolderOpen size={16} style={{color:'rgba(201,168,76,0.75)',flexShrink:0}}/>
                  <div>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',fontWeight:'700',color:'rgba(201,168,76,0.88)',margin:'0 0 2px'}}>{casoActual.folio}</p>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.5)',margin:0,maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {casoActual.asunto}
                    </p>
                    {clienteActual && (
                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.35)',margin:'2px 0 0',display:'flex',alignItems:'center',gap:'4px'}}>
                        <User size={9}/> {clienteActual.nombre}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {casoSel ? (
            <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>

              {/* Stats */}
              {docs.length > 0 && (
                <div className="dc-fade" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',animationDelay:'0.08s'}}>
                  {[
                    {label:'Total archivos',val:docs.length,          color:'#C9A84C',borderC:'rgba(201,168,76,0.22)',bgC:'rgba(201,168,76,0.08)'},
                    {label:'Generales',      val:totalGeneral,          color:'#93BBFC',borderC:'rgba(59,130,246,0.2)', bgC:'rgba(59,130,246,0.06)'},
                    {label:'Confidenciales', val:totalConfidencial,     color:'#FCA5A5',borderC:'rgba(239,68,68,0.2)',  bgC:'rgba(239,68,68,0.06)' },
                  ].map(s=>(
                    <div key={s.label} style={{background:s.bgC,border:`1px solid ${s.borderC}`,borderRadius:'12px',padding:'14px 18px'}}>
                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',color:`${s.color}99`,margin:'0 0 7px'}}>{s.label}</p>
                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:'32px',fontWeight:'800',color:'rgba(255,255,255,0.93)',margin:0,lineHeight:1,letterSpacing:'-1px'}}>{s.val}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Zona de subida */}
              <div className="dc-fade" style={{background:'rgba(8,20,48,0.75)',backdropFilter:'blur(16px)',border:'1px solid rgba(201,168,76,0.14)',borderRadius:'16px',overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.4)',animationDelay:'0.12s'}}>
                <div style={{padding:'16px 22px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Upload size={15} style={{color:'rgba(201,168,76,0.8)'}}/>
                  </div>
                  <div>
                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:'15px',fontWeight:'700',color:'rgba(255,255,255,0.92)',margin:0}}>
                      Subir documentos
                      {clienteActual && (
                        <span style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',fontWeight:'400',color:'rgba(255,255,255,0.4)',marginLeft:'8px'}}>— {clienteActual.nombre}</span>
                      )}
                    </p>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)',margin:0}}>PDF, Word, Excel, JPG, PNG — máx. 20 MB por archivo</p>
                  </div>
                </div>

                <div style={{padding:'20px 22px'}}>
                  {/* Drop zone */}
                  <div
                    onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                    onDragLeave={()=>setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={()=>fileInputRef.current?.click()}
                    style={{
                      border:`2px dashed ${dragOver?'rgba(201,168,76,0.6)':'rgba(255,255,255,0.12)'}`,
                      borderRadius:'12px',padding:'28px 24px',textAlign:'center',
                      cursor:'pointer',transition:'all 0.2s ease',
                      background:dragOver?'rgba(201,168,76,0.06)':'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div style={{width:'44px',height:'44px',borderRadius:'12px',background:dragOver?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.05)',border:`1px solid ${dragOver?'rgba(201,168,76,0.3)':'rgba(255,255,255,0.1)'}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',transition:'all 0.2s ease'}}>
                      <Upload size={20} style={{color:dragOver?'rgba(201,168,76,0.9)':'rgba(255,255,255,0.35)'}}/>
                    </div>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'500',color:'rgba(255,255,255,0.55)',margin:'0 0 4px'}}>
                      Arrastra archivos aquí o{' '}
                      <span style={{color:'rgba(201,168,76,0.85)',fontWeight:'600'}}>haz clic para seleccionar</span>
                    </p>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.28)',margin:0}}>Soporta múltiples archivos simultáneamente</p>
                  </div>
                  <input ref={fileInputRef} type="file" multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                    style={{display:'none'}}
                    onChange={e=>handleFiles(e.target.files)}/>

                  {/* Archivos seleccionados */}
                  {archivos.length > 0 && (
                    <div style={{marginTop:'14px'}}>
                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',color:'rgba(201,168,76,0.6)',margin:'0 0 8px'}}>
                        {archivos.length} archivo{archivos.length>1?'s':''} seleccionado{archivos.length>1?'s':''}
                      </p>
                      <div style={{display:'flex',flexDirection:'column',gap:'6px',marginBottom:'14px'}}>
                        {archivos.map(f=>{
                          const fc=getFileColor(f.type)
                          const FIcon=getFileIcon(f.type)
                          return (
                            <div key={f.name} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 13px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'9px'}}>
                              <div style={{width:'30px',height:'30px',borderRadius:'7px',background:fc.bg,border:`1px solid ${fc.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                <FIcon size={14} style={{color:fc.color}}/>
                              </div>
                              <span style={{flex:1,fontFamily:"'Inter',sans-serif",fontSize:'12px',fontWeight:'500',color:'rgba(255,255,255,0.8)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
                              <span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)',flexShrink:0}}>{formatSize(f.size)}</span>
                              <button onClick={()=>setArchivos(p=>p.filter(x=>x.name!==f.name))} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',display:'flex',flexShrink:0,padding:'2px'}}>
                                ✕
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      {/* Opciones subida */}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
                        <div>
                          <label style={{display:'block',fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'1.8px',textTransform:'uppercase',color:'rgba(255,255,255,0.45)',marginBottom:'6px'}}>Categoría</label>
                          <select value={catUpload} onChange={e=>setCatUpload(e.target.value)} className="dc-select-native" style={{background:'rgba(255,255,255,0.05)'}}>
                            <option value="general">General</option>
                            {canUploadConfidential && <option value="confidencial">Confidencial</option>}
                          </select>
                        </div>
                        <div>
                          <label style={{display:'block',fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'1.8px',textTransform:'uppercase',color:'rgba(255,255,255,0.45)',marginBottom:'6px'}}>Descripción</label>
                          <input className="dc-input" type="text" value={descripcion} onChange={e=>setDescripcion(e.target.value)} placeholder="Breve descripción…"
                            style={{width:'100%',padding:'9px 12px',borderRadius:'10px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.88)',fontFamily:"'Inter',sans-serif",fontSize:'13px',transition:'all 0.15s ease',boxSizing:'border-box'}}/>
                        </div>
                      </div>

                      <div style={{display:'flex',justifyContent:'flex-end',gap:'10px'}}>
                        <button onClick={()=>setArchivos([])} style={{padding:'9px 16px',borderRadius:'8px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.6)',fontFamily:"'Inter',sans-serif",fontSize:'12px',fontWeight:'500',cursor:'pointer'}}>
                          Cancelar
                        </button>
                        <button className="dc-btn-primary" onClick={handleUpload} disabled={uploading}>
                          <Upload size={13}/>
                          {uploading?'Subiendo…':`Subir ${archivos.length} archivo${archivos.length>1?'s':''}`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista documentos */}
              <div className="dc-fade" style={{background:'rgba(8,20,48,0.75)',backdropFilter:'blur(16px)',border:'1px solid rgba(201,168,76,0.14)',borderRadius:'16px',overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.4)',animationDelay:'0.18s'}}>
                {/* Toolbar */}
                <div style={{padding:'15px 22px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                  <div style={{flex:1}}>
                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:'15px',fontWeight:'700',color:'rgba(255,255,255,0.9)',margin:'0 0 1px'}}>Documentos del expediente</p>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)',margin:0}}>
                      {docsFiltrados.length} de {docs.length} archivo{docs.length!==1?'s':''}
                    </p>
                  </div>
                  {/* Buscador */}
                  <div style={{position:'relative'}}>
                    <Search size={13} style={{position:'absolute',left:'11px',top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.25)',pointerEvents:'none'}}/>
                    <input className="dc-search" type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar archivo…"
                      style={{padding:'8px 10px 8px 30px',borderRadius:'9px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.88)',fontFamily:"'Inter',sans-serif",fontSize:'12px',width:'160px',boxSizing:'border-box'}}/>
                  </div>
                  {/* Select categoría — nativo */}
                  <select value={categoria} onChange={e=>setCategoria(e.target.value)} className="dc-select-sm">
                    <option value="">Todas las categorías</option>
                    <option value="general">General</option>
                    <option value="confidencial">Confidencial</option>
                  </select>
                </div>

                {/* Column headers */}
                <div style={{display:'grid',gridTemplateColumns:'44px 1fr 100px 80px 90px 68px',padding:'9px 22px 8px',background:'rgba(4,12,32,0.85)',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  {['','Archivo','Categoría','Tamaño','Fecha','Acción'].map(h=>(
                    <div key={h} style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.09em',color:'rgba(201,168,76,0.6)'}}>{h}</div>
                  ))}
                </div>

                {/* Body */}
                {loading ? (
                  <div>{[...Array(4)].map((_,i)=>(
                    <div key={i} style={{display:'grid',gridTemplateColumns:'44px 1fr 100px 80px 90px 68px',padding:'14px 22px',borderBottom:'1px solid rgba(255,255,255,0.04)',gap:'12px',alignItems:'center'}}>
                      {[0,1,2,3,4,5].map(j=>(
                        <div key={j} style={{height:'11px',borderRadius:'6px',background:'rgba(255,255,255,0.06)',width:j===0?'36px':'80%'}}/>
                      ))}
                    </div>
                  ))}</div>
                ) : docsFiltrados.length === 0 ? (
                  <div style={{padding:'56px 24px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center'}}>
                    <IconDocs/>
                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:'16px',fontWeight:'700',color:'rgba(255,255,255,0.6)',margin:'18px 0 7px'}}>
                      {docs.length === 0 ? 'Sin documentos' : 'Sin resultados'}
                    </p>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.3)',margin:0,maxWidth:'240px'}}>
                      {docs.length === 0 ? 'Sube el primer documento de este expediente.' : 'Ajusta los filtros para ver más archivos.'}
                    </p>
                  </div>
                ) : (
                  docsFiltrados.map(doc=>{
                    const fc=getFileColor(doc.tipo); const FIcon=getFileIcon(doc.tipo)
                    const ia = doc.analisis ? (() => { try { return JSON.parse(doc.analisis) } catch { return null } })() : null
                    const iaOpen = expandedIA === doc.id_documento
                    const urgColor = ia?.urgencia === 'alta' ? '#FCA5A5' : ia?.urgencia === 'media' ? '#FCD34D' : '#86EFAC'
                    return (
                      <div key={doc.id_documento} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                        <div className="dc-doc-row" style={{borderBottom:'none'}}>
                          <div style={{width:'36px',height:'36px',borderRadius:'9px',background:fc.bg,border:`1px solid ${fc.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                            <FIcon size={17} style={{color:fc.color}}/>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'600',color:'rgba(255,255,255,0.88)',margin:'0 0 2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{doc.nombre_original}</p>
                            {doc.descripcion && <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)',margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{doc.descripcion}</p>}
                            {ia ? (
                              <button className="dc-ia-btn" style={{marginTop:'4px'}} onClick={()=>setExpandedIA(iaOpen ? null : doc.id_documento)}>
                                <Sparkles size={9}/> Resumen IA {iaOpen ? <ChevronUp size={9}/> : <ChevronDown size={9}/>}
                              </button>
                            ) : canEditCases && (
                              analyzingIds.has(doc.id_documento) ? (
                                <span className="dc-ia-btn" style={{marginTop:'4px',cursor:'default',opacity:0.7}}>
                                  <Loader2 size={9} style={{animation:'spin 1s linear infinite'}}/> Analizando…
                                </span>
                              ) : (
                                <button className="dc-ia-btn" style={{marginTop:'4px'}} onClick={()=>handleAnalizar(doc.id_documento)}>
                                  <Sparkles size={9}/> Analizar IA
                                </button>
                              )
                            )}
                          </div>
                          <div><CategoriaBadge categoria={doc.categoria}/></div>
                          <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.4)',margin:0}}>{formatSize(doc.tamanio)}</p>
                          <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)',margin:0}}>
                            {new Date(doc.createdAt).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'2-digit'})}
                          </p>
                          <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                            {canEditCases && (
                              <button
                                className={`dc-action ${doc.bloqueado ? 'lock-on' : 'lock-off'}`}
                                title={doc.bloqueado ? 'Bloqueado — clic para liberar al cliente' : 'Libre — clic para bloquear'}
                                disabled={togglingIds.has(doc.id_documento)}
                                onClick={() => handleToggleLock(doc.id_documento)}
                              >
                                {togglingIds.has(doc.id_documento)
                                  ? <Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>
                                  : doc.bloqueado ? <Lock size={13}/> : <Unlock size={13}/>
                                }
                              </button>
                            )}
                            <button className="dc-action dl" title="Descargar" onClick={()=>handleDescargar(doc.id_documento,doc.nombre_original)}><Download size={13}/></button>
                            {canEditCases && <button className="dc-action del" title="Eliminar" onClick={()=>handleDelete(doc.id_documento,doc.nombre_original)}><Trash2 size={13}/></button>}
                          </div>
                        </div>

                        {/* Panel Resumen IA */}
                        {ia && iaOpen && (
                          <div className="dc-ia-panel" style={{margin:'0 20px 14px',padding:'14px 18px',background:'rgba(139,92,246,0.06)',border:'1px dashed rgba(139,92,246,0.28)',borderRadius:'10px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                              <Sparkles size={13} style={{color:'#C4B5FD',flexShrink:0}}/>
                              <span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:'700',letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(196,181,253,0.8)'}}>Resumen IA</span>
                              {ia.urgencia && (
                                <span style={{marginLeft:'auto',padding:'2px 8px',borderRadius:'4px',background:`${urgColor}18`,border:`1px solid ${urgColor}40`,fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',color:urgColor,textTransform:'uppercase',letterSpacing:'0.5px'}}>
                                  {ia.urgencia === 'alta' ? 'Urgencia alta' : ia.urgencia === 'media' ? 'Urgencia media' : 'Urgencia baja'}
                                </span>
                              )}
                            </div>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                              {ia.tipo && (
                                <div>
                                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:'9px',fontWeight:'700',letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',margin:'0 0 4px'}}>Tipo</p>
                                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.75)',margin:0,textTransform:'capitalize'}}>{ia.tipo}</p>
                                </div>
                              )}
                              {ia.partes?.length > 0 && (
                                <div>
                                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:'9px',fontWeight:'700',letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',margin:'0 0 4px'}}>Partes</p>
                                  {ia.partes.map((p,i)=>(
                                    <p key={i} style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.65)',margin:'0 0 2px'}}>{p}</p>
                                  ))}
                                </div>
                              )}
                              {ia.fechasClave?.length > 0 && (
                                <div>
                                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:'9px',fontWeight:'700',letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',margin:'0 0 4px'}}>Fechas clave</p>
                                  {ia.fechasClave.map((f,i)=>(
                                    <p key={i} style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.65)',margin:'0 0 2px'}}>{f}</p>
                                  ))}
                                </div>
                              )}
                              {ia.puntosPrincipales?.length > 0 && (
                                <div style={{gridColumn:'1/-1'}}>
                                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:'9px',fontWeight:'700',letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',margin:'0 0 6px'}}>Puntos principales</p>
                                  {ia.puntosPrincipales.map((pt,i)=>(
                                    <div key={i} style={{display:'flex',gap:'8px',marginBottom:'4px'}}>
                                      <span style={{color:'rgba(196,181,253,0.6)',fontSize:'10px',marginTop:'1px',flexShrink:0}}>&#9679;</span>
                                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.65)',margin:0,lineHeight:1.5}}>{pt}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            /* Empty state sin expediente */
            <div className="dc-fade" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'72px 24px',background:'rgba(8,20,48,0.5)',backdropFilter:'blur(12px)',border:'1px solid rgba(201,168,76,0.1)',borderRadius:'16px',textAlign:'center',animationDelay:'0.1s'}}>
              <IconDocs/>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:'19px',fontWeight:'700',color:'rgba(255,255,255,0.7)',margin:'20px 0 8px',textShadow:'0 1px 4px rgba(0,0,0,0.3)'}}>Selecciona un expediente</h3>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.35)',margin:0,maxWidth:'280px',lineHeight:1.6}}>
                Elige un caso del selector de arriba para ver y gestionar todos sus documentos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal eliminación */}
      {deleteId && (
        <div className="dc-modal-bg" onClick={()=>setDeleteId(null)}>
          <div onClick={e=>e.stopPropagation()} style={{position:'relative',zIndex:1,width:'100%',maxWidth:'400px',background:'rgba(6,16,40,0.97)',backdropFilter:'blur(24px)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:'20px',boxShadow:'0 25px 80px rgba(0,0,0,0.7)',padding:'26px 30px'}}>
            <div style={{width:'46px',height:'46px',borderRadius:'12px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px'}}>
              <Trash2 size={20} style={{color:'#FCA5A5'}}/>
            </div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'18px',fontWeight:'700',color:'rgba(255,255,255,0.95)',margin:'0 0 8px'}}>Eliminar documento</h2>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.45)',margin:'0 0 6px',lineHeight:1.6}}>
              ¿Eliminar <strong style={{color:'rgba(255,255,255,0.7)'}}>{deleteNombre}</strong>?
            </p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.3)',margin:'0 0 24px'}}>Esta acción es permanente y no se puede deshacer.</p>
            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
              <button onClick={()=>setDeleteId(null)} style={{padding:'8px 16px',borderRadius:'8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.65)',fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>Cancelar</button>
              <button onClick={confirmDelete} style={{padding:'8px 16px',borderRadius:'8px',background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',color:'#FCA5A5',fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}