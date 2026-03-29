import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCasoById } from './casesService'
import {
  ArrowLeft, Pencil, FolderOpen, User, Calendar,
  Clock, FileText, MapPin, Scale, AlertCircle,
  CheckCircle, XCircle, Tag, Phone, Mail, Home,
  ChevronRight
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

  const [caso,    setCaso]    = useState(null)
  const [cliente, setCliente] = useState(null)
  const [citas,   setCitas]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

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

        <div style={{padding:'24px 36px',maxWidth:'1200px'}}>

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
        </div>
      </div>
    </>
  )
}