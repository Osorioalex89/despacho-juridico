import { useState, useEffect } from 'react'
import { getMisCasos }         from '../cases/casesService'
import { getMisDocumentos }    from '../documents/documentsService'
import {
  FolderOpen, Clock, CheckCircle, XCircle,
  AlertCircle, FileText, Calendar,
  ChevronRight, ChevronDown, Download
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
  const [casos,        setCasos]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [filtro,       setFiltro]       = useState('')
  const [casoExpandido,setCasoExpandido]= useState(null)
  const [docsPorCaso,  setDocsPorCaso]  = useState({})
  const [loadingDocs,  setLoadingDocs]  = useState(false)

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
    if (docsPorCaso[id_caso]) return
    setLoadingDocs(true)
    try {
      const r = await getMisDocumentos(id_caso)
      setDocsPorCaso(prev => ({ ...prev, [id_caso]: r.data.documentos }))
    } catch {
      setDocsPorCaso(prev => ({ ...prev, [id_caso]: [] }))
    } finally { setLoadingDocs(false) }
  }

  const handleDescargar = async (id, nombre) => {
    const token = localStorage.getItem('token')
    const res   = await fetch(
      `http://localhost:3001/api/documentos/mis-documentos/${id}/descargar`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = nombre; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
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
        <div className="mc-fade" style={{
          background:'linear-gradient(135deg,rgba(6,16,40,0.97) 0%,rgba(12,26,56,0.9) 100%)',
          borderBottom:'1px solid rgba(201,168,76,0.14)',
          padding:'24px 32px 20px',
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

        <div style={{padding:'24px 32px',maxWidth:'900px'}}>

          {/* Stats */}
          <div className="mc-fade" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'20px',animationDelay:'0.06s'}}>
            {[
              {label:'Casos activos', val:activos,    color:'#93BBFC', bg:'rgba(59,130,246,0.08)',  border:'rgba(59,130,246,0.2)' },
              {label:'Pendientes',    val:pendientes, color:'#FCD34D', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)'},
              {label:'Cerrados',      val:cerrados,   color:'#9CA3AF', bg:'rgba(107,114,128,0.08)',border:'rgba(107,114,128,0.15)'},
            ].map((s,i)=>(
              <div key={s.label} className="mc-fade" style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:'12px',padding:'14px 18px',backdropFilter:'blur(12px)',animationDelay:`${0.08+i*0.05}s`}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',color:`${s.color}99`,margin:'0 0 6px'}}>{s.label}</p>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'30px',fontWeight:'800',color:'rgba(255,255,255,0.93)',margin:0,lineHeight:1,letterSpacing:'-1px'}}>{s.val}</p>
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
                        <div style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:'14px'}}>
                          {/* Ícono estado */}
                          <div style={{
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

                          <div style={{display:'flex',alignItems:'center',gap:'10px',flexShrink:0}}>
                            <Badge estado={caso.estado}/>
                            {expanded
                              ? <ChevronDown size={15} style={{color:'rgba(255,255,255,0.3)'}}/>
                              : <ChevronRight size={15} style={{color:'rgba(255,255,255,0.3)'}}/>
                            }
                          </div>
                        </div>

                        {/* Panel expandido */}
                        {expanded && (
                          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',padding:'14px 20px 16px',background:'rgba(4,12,32,0.4)'}}>
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
                              <div style={{background:'rgba(8,20,48,0.5)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',overflow:'hidden'}}>
                                {(docsPorCaso[caso.id_caso]||[]).map(doc=>(
                                  <div key={doc.id_documento} className="mc-doc-row">
                                    <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                      <FileText size={14} style={{color:'rgba(201,168,76,0.7)'}}/>
                                    </div>
                                    <div style={{flex:1,minWidth:0}}>
                                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'500',color:'rgba(255,255,255,0.85)',margin:'0 0 2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                                        {doc.nombre_original}
                                      </p>
                                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.3)',margin:0}}>
                                        {new Date(doc.createdAt).toLocaleDateString('es-MX')}
                                        {doc.descripcion ? ` · ${doc.descripcion}` : ''}
                                      </p>
                                    </div>
                                    <button className="mc-dl-btn"
                                      onClick={e=>{e.stopPropagation();handleDescargar(doc.id_documento,doc.nombre_original)}}>
                                      <Download size={11}/> Descargar
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}