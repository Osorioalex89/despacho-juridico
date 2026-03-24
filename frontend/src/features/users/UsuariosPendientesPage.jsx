import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getUsuarios, updateEstadoUsuario, deleteUsuario } from './usersService'
import {
  CheckCircle, XCircle, Trash2, Search,
  UserCheck, Clock, Users, ShieldCheck,
  Shield, AlertTriangle, X
} from 'lucide-react'

// ── Avatar con inicial ────────────────────────────────────────────
const UserAvatar = ({ nombre, size = 36 }) => {
  const inicial = nombre?.charAt(0).toUpperCase() || '?'
  const colors  = {
    A:'#C9A84C',B:'#93BBFC',C:'#C4B5FD',D:'#86EFAC',E:'#FCA5A5',
    F:'#C9A84C',G:'#93BBFC',H:'#C4B5FD',I:'#86EFAC',J:'#C9A84C',
    K:'#FCA5A5',L:'#93BBFC',M:'#C9A84C',N:'#C4B5FD',O:'#86EFAC',
    P:'#FCA5A5',Q:'#C9A84C',R:'#93BBFC',S:'#C4B5FD',T:'#C9A84C',
    U:'#86EFAC',V:'#FCA5A5',W:'#93BBFC',X:'#C4B5FD',Y:'#C9A84C',Z:'#86EFAC',
  }
  const color = colors[inicial] || '#C9A84C'
  return (
    <div style={{
      width:size, height:size, borderRadius:'9px', flexShrink:0,
      background:`${color}18`, border:`1px solid ${color}40`,
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <span style={{
        fontFamily:"'Playfair Display',Georgia,serif",
        fontSize: size*0.44, fontWeight:'700', color, lineHeight:1,
      }}>{inicial}</span>
    </div>
  )
}

// ── Badge configs ─────────────────────────────────────────────────
const ESTADO_CFG = {
  pendiente: { label:'Pendiente',  bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.28)', text:'#FCD34D', dot:'#F59E0B' },
  aprobado:  { label:'Aprobado',   bg:'rgba(34,197,94,0.12)',  border:'rgba(34,197,94,0.28)',  text:'#86EFAC', dot:'#22C55E' },
  rechazado: { label:'Rechazado',  bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.28)',  text:'#FCA5A5', dot:'#EF4444' },
}

const ROL_CFG = {
  abogado:    { bg:'rgba(201,168,76,0.12)', border:'rgba(201,168,76,0.25)', text:'#E8C97A'  },
  secretario: { bg:'rgba(139,92,246,0.12)', border:'rgba(139,92,246,0.25)', text:'#C4B5FD'  },
  cliente:    { bg:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.25)', text:'#93BBFC'  },
  usuario:    { bg:'rgba(107,114,128,0.12)',border:'rgba(107,114,128,0.25)',text:'#9CA3AF'  },
}

const ROL_OPTS = [
  { value:'cliente',    label:'Cliente'    },
  { value:'secretario', label:'Secretario' },
  { value:'abogado',    label:'Abogado'    },
]

function Badge({ value, config }) {
  const c = config[value] || config.usuario || config.pendiente
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'5px',
      background:c.bg, border:`1px solid ${c.border}`,
      borderRadius:'4px', padding:'3px 8px',
      fontFamily:"'Inter',sans-serif",
      fontSize:'11px', fontWeight:'600', color:c.text,
      whiteSpace:'nowrap',
    }}>
      <span style={{width:'5px',height:'5px',borderRadius:'50%',background:c.dot||c.text,flexShrink:0}}/>
      {c.label}
    </span>
  )
}

// ── SVG empty state ───────────────────────────────────────────────
const IconUsers = () => (
  <svg viewBox="0 0 56 56" width="52" height="52" fill="none">
    <defs>
      <linearGradient id="ug1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8C97A"/><stop offset="100%" stopColor="#9A7A32"/>
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="rgba(201,168,76,0.08)" stroke="rgba(201,168,76,0.2)" strokeWidth="1"/>
    <circle cx="22" cy="20" r="6" fill="none" stroke="url(#ug1)" strokeWidth="1.5" strokeOpacity="0.8"/>
    <path d="M10 38 C10 30 14 27 22 27 C30 27 34 30 34 38" stroke="url(#ug1)" strokeWidth="1.5" strokeOpacity="0.6" fill="rgba(201,168,76,0.06)" strokeLinecap="round"/>
    <circle cx="38" cy="22" r="5" fill="none" stroke="url(#ug1)" strokeWidth="1.2" strokeOpacity="0.5"/>
    <path d="M30 38 C30.5 33 33 31 38 31 C43 31 46 33 46.5 38" stroke="url(#ug1)" strokeWidth="1.2" strokeOpacity="0.4" fill="none" strokeLinecap="round"/>
  </svg>
)

export default function UsuariosPendientesPage({ defaultEstado = 'pendiente' }) {
  const { canManageUsers } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [todosUsuarios, setTodosUsuarios] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filtroEstado, setFiltroEstado] = useState(defaultEstado)
  const [rolModal,     setRolModal]     = useState(null)
  const [rolSel,       setRolSel]       = useState('cliente')
  const [deleteModal,  setDeleteModal]  = useState(null)

  // Sync defaultEstado cuando cambia la ruta
  useEffect(() => { setFiltroEstado(defaultEstado) }, [defaultEstado])

  const fetchUsuarios = async () => {
  setLoading(true)
  try {
    const res = await getUsuarios({ estado: filtroEstado, search })
    setUsuarios(res.data.usuarios)
    const todos = await getUsuarios({})
    setTodosUsuarios(todos.data.usuarios)
  } catch { console.error('Error al cargar usuarios') }
  finally { setLoading(false) }
}
  useEffect(() => { fetchUsuarios() }, [filtroEstado, search])

  const handleAprobar = (id, nombre) => { setRolModal({ id, nombre }); setRolSel('cliente') }

  const confirmarAprobacion = async () => {
    try {
      await updateEstadoUsuario(rolModal.id, { estado:'aprobado', rol:rolSel })
      setRolModal(null); fetchUsuarios()
    } catch { alert('Error al aprobar') }
  }

  const handleRechazar = async (id) => {
    try { await updateEstadoUsuario(id, { estado:'rechazado' }); fetchUsuarios() }
    catch { alert('Error al rechazar') }
  }

  const handleEliminar = async () => {
    try { await deleteUsuario(deleteModal.id); setDeleteModal(null); fetchUsuarios() }
    catch { alert('Error al eliminar') }
  }

  // Stats
  const pendientes = todosUsuarios.filter(u => u.estado === 'pendiente').length
  const aprobados  = todosUsuarios.filter(u => u.estado === 'aprobado').length
  const rechazados = todosUsuarios.filter(u => u.estado === 'rechazado').length

  const FILTROS = [
    { val:'pendiente', label:'Pendientes' },
    { val:'aprobado',  label:'Aprobados'  },
    { val:'rechazado', label:'Rechazados' },
    { val:'',          label:'Todos'      },
  ]

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .up-fade { animation: fadeUp 0.4s ease both; }

        .up-row {
          display: grid; align-items: center;
          padding: 13px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          cursor: default;
          transition: all 0.15s ease;
        }
        .up-row:hover { background: rgba(201,168,76,0.03); border-bottom-color: rgba(201,168,76,0.07); }
        .up-row:last-child { border-bottom: none; }

        .up-search:focus { outline:none; border-color:rgba(201,168,76,0.5)!important; background:rgba(201,168,76,0.04)!important; box-shadow:0 0 0 3px rgba(201,168,76,0.1)!important; }
        .up-search::placeholder { color:rgba(255,255,255,0.22); }

        .up-chip {
          padding: 7px 14px; border-radius: 8px;
          font-family: 'Inter',sans-serif; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s ease;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.5);
          white-space: nowrap;
        }
        .up-chip:hover { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.85); }
        .up-chip.active { background:rgba(201,168,76,0.14); border-color:rgba(201,168,76,0.32); color:rgba(201,168,76,0.95); }
        .up-chip.pend.active { background:rgba(245,158,11,0.12); border-color:rgba(245,158,11,0.28); color:#FCD34D; }
        .up-chip.apro.active { background:rgba(34,197,94,0.12);  border-color:rgba(34,197,94,0.28);  color:#86EFAC; }
        .up-chip.rech.active { background:rgba(239,68,68,0.12);  border-color:rgba(239,68,68,0.28);  color:#FCA5A5; }

        .up-action-approve {
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 12px; border-radius:7px;
          background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.25);
          color:#86EFAC; font-family:'Inter',sans-serif; font-size:11px; font-weight:600;
          cursor:pointer; transition:all 0.15s ease; white-space:nowrap;
        }
        .up-action-approve:hover { background:rgba(34,197,94,0.18); border-color:rgba(34,197,94,0.4); transform:translateY(-1px); }

        .up-action-reject {
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 12px; border-radius:7px;
          background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2);
          color:#FCA5A5; font-family:'Inter',sans-serif; font-size:11px; font-weight:600;
          cursor:pointer; transition:all 0.15s ease; white-space:nowrap;
        }
        .up-action-reject:hover { background:rgba(239,68,68,0.15); border-color:rgba(239,68,68,0.32); }

        .up-action-del {
          width:38px; height:30px; border-radius:7px;
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:all 0.15s ease; color:rgba(255,255,255,0.35);
        }
        .up-action-del:hover { background:rgba(239,68,68,0.12); border-color:rgba(239,68,68,0.28); color:#FCA5A5; }

        .up-modal-bg {
          position:fixed; inset:0; z-index:9999;
          display:flex; align-items:center; justify-content:center;
          padding:24px; background:rgba(2,8,24,0.85); backdrop-filter:blur(8px);
        }

        .rol-btn {
          flex:1; padding:10px 8px; border-radius:9px; border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.55);
          font-family:'Inter',sans-serif; font-size:13px; font-weight:500;
          cursor:pointer; transition:all 0.15s ease; text-align:center;
        }
        .rol-btn:hover { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.85); }
        .rol-btn.selected { background:rgba(201,168,76,0.15); border-color:rgba(201,168,76,0.35); color:rgba(201,168,76,0.95); font-weight:600; }
      `}</style>

      {/* ── Root ─────────────────────────────────────────────── */}
      <div style={{
        flex:1, overflowY:'auto', minHeight:'100vh',
        background:`
          radial-gradient(ellipse at 10% 20%,rgba(201,168,76,0.05) 0%,transparent 48%),
          radial-gradient(ellipse at 90% 80%,rgba(139,92,246,0.04) 0%,transparent 48%),
          linear-gradient(160deg,#020818 0%,#040d20 50%,#02050f 100%)
        `,
      }}>

        {/* ── Page header ──────────────────────────────────────── */}
        <div className="up-fade" style={{
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
              {defaultEstado === 'pendiente' ? 'Acceso al Sistema' : 'Administración'}
            </p>
            <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'26px',fontWeight:'700',color:'rgba(255,255,255,0.96)',margin:'0 0 4px',textShadow:'0 2px 6px rgba(0,0,0,0.35)'}}>
              {defaultEstado === 'pendiente' ? 'Solicitudes de Acceso' : 'Gestión de Usuarios'}
            </h1>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.38)',margin:0}}>
              {defaultEstado === 'pendiente'
                ? 'Aprueba o rechaza solicitudes de acceso al sistema'
                : 'Administra todos los usuarios del sistema'}
            </p>
          </div>
          <div style={{position:'absolute',bottom:0,left:'36px',width:'48px',height:'1px',background:'linear-gradient(90deg,rgba(201,168,76,0.55),transparent)'}}/>
        </div>

        <div style={{padding:'26px 36px',maxWidth:'1300px'}}>

          {/* ── Stat cards ──────────────────────────────────────── */}
          <div className="up-fade" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'14px',marginBottom:'22px',animationDelay:'0.06s'}}>
            {[
              { label:'Pendientes de aprobación', val:pendientes, color:'#F59E0B', colorT:'#FCD34D', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)', icon:Clock     },
              { label:'Usuarios aprobados',        val:aprobados,  color:'#22C55E', colorT:'#86EFAC', bg:'rgba(34,197,94,0.08)',  border:'rgba(34,197,94,0.2)',  icon:ShieldCheck},
              { label:'Usuarios rechazados',       val:rechazados, color:'#EF4444', colorT:'#FCA5A5', bg:'rgba(239,68,68,0.08)',  border:'rgba(239,68,68,0.18)', icon:XCircle   },
            ].map((s,i)=>(
              <div key={s.label} className="up-fade" style={{
                background:s.bg, backdropFilter:'blur(16px)',
                border:`1px solid ${s.border}`, borderRadius:'14px',
                padding:'18px 22px', animationDelay:`${0.08+i*0.06}s`,
                boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
              }}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'10px'}}>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',color:`${s.colorT}99`,margin:0}}>
                    {s.label}
                  </p>
                  <div style={{width:'32px',height:'32px',borderRadius:'8px',background:`${s.color}18`,border:`1px solid ${s.color}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <s.icon size={15} style={{color:s.colorT}}/>
                  </div>
                </div>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'36px',fontWeight:'800',color:'rgba(255,255,255,0.93)',margin:0,lineHeight:1,letterSpacing:'-1px'}}>
                  {s.val}
                </p>
              </div>
            ))}
          </div>

          {/* ── Tabla principal ─────────────────────────────────── */}
          <div className="up-fade" style={{
            background:'rgba(8,20,48,0.75)', backdropFilter:'blur(16px)',
            border:'1px solid rgba(201,168,76,0.16)', borderRadius:'16px',
            boxShadow:'0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
            overflow:'hidden', animationDelay:'0.20s',
          }}>

            {/* Toolbar */}
            <div style={{padding:'16px 24px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
              {/* Search */}
              <div style={{position:'relative',flex:1,minWidth:'200px'}}>
                <Search size={14} style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.28)',pointerEvents:'none'}}/>
                <input
                  className="up-search"
                  type="text" value={search}
                  onChange={e=>setSearch(e.target.value)}
                  placeholder="Buscar por nombre o correo…"
                  style={{width:'100%',padding:'9px 12px 9px 34px',borderRadius:'10px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.88)',fontFamily:"'Inter',sans-serif",fontSize:'13px',transition:'all 0.15s ease',boxSizing:'border-box'}}
                />
                {search && (
                  <button onClick={()=>setSearch('')} style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',display:'flex'}}>
                    <X size={13}/>
                  </button>
                )}
              </div>

              {/* Chips de estado */}
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                {FILTROS.map(f=>(
                  <button key={f.val}
                    className={`up-chip${filtroEstado===f.val?' active':''}${f.val==='pendiente'?' pend':f.val==='aprobado'?' apro':f.val==='rechazado'?' rech':''}`}
                    onClick={()=>setFiltroEstado(f.val)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Column headers */}
            <div style={{display:'grid',gridTemplateColumns:'2fr 1.4fr 110px 110px 120px 130px',padding:'10px 24px 9px',background:'rgba(4,12,32,0.85)',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              {['Usuario','Correo','Rol','Estado','Registro','Acciones'].map(h=>(
                <div key={h} style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.09em',color:'rgba(201,168,76,0.65)'}}>{h}</div>
              ))}
            </div>

            {/* Body */}
            {loading ? (
              <div>{[...Array(5)].map((_,i)=>(
                <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1.4fr 110px 110px 120px 130px',padding:'15px 24px',borderBottom:'1px solid rgba(255,255,255,0.04)',gap:'16px',alignItems:'center'}}>
                  {[0,1,2,3,4,5].map(j=>(
                    <div key={j} style={{height:'11px',borderRadius:'6px',background:'rgba(255,255,255,0.06)',width:j===0?'70%':'80%'}}/>
                  ))}
                </div>
              ))}</div>
            ) : usuarios.length === 0 ? (
              <div style={{padding:'64px 24px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center'}}>
                <IconUsers/>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:'16px',fontWeight:'700',color:'rgba(255,255,255,0.6)',margin:'18px 0 7px'}}>
                  {search ? 'Sin resultados' : filtroEstado === 'pendiente' ? 'Sin solicitudes pendientes' : 'Sin usuarios'}
                </p>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.32)',margin:0,maxWidth:'280px'}}>
                  {search ? `No se encontraron usuarios con "${search}"` : 'No hay usuarios en este estado.'}
                </p>
              </div>
            ) : (
              usuarios.map((u, idx) => (
                <div key={u.id_usuario} className="up-row"
                  style={{gridTemplateColumns:'2fr 1.4fr 110px 110px 120px 130px',animationDelay:`${idx*0.03}s`}}>

                  {/* Usuario */}
                  <div style={{display:'flex',alignItems:'center',gap:'12px',minWidth:0}}>
                    <UserAvatar nombre={u.nombre} size={36}/>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'600',color:'rgba(255,255,255,0.9)',margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {u.nombre}
                    </p>
                  </div>

                  {/* Correo */}
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.45)',margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {u.correo}
                  </p>

                  {/* Rol */}
                  <div>
                    <Badge value={u.rol} config={ROL_CFG}/>
                  </div>

                  {/* Estado */}
                  <div>
                    <Badge value={u.estado} config={ESTADO_CFG}/>
                  </div>

                  {/* Fecha registro */}
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)',margin:0}}>
                    {new Date(u.createdAt).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'2-digit'})}
                  </p>

                  {/* Acciones */}
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}} onClick={e=>e.stopPropagation()}>
                    {u.estado === 'pendiente' && (
                      <>
                        <button className="up-action-approve" onClick={()=>handleAprobar(u.id_usuario,u.nombre)}>
                          <CheckCircle size={12}/> Aprobar
                        </button>
                        <button className="up-action-reject" onClick={()=>handleRechazar(u.id_usuario)}>
                          <XCircle size={12}/>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Modal aprobación ─────────────────────────────────── */}
      {rolModal && (
        <div className="up-modal-bg" onClick={()=>setRolModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{
            position:'relative',zIndex:1,width:'100%',maxWidth:'420px',
            background:'rgba(6,16,40,0.97)',backdropFilter:'blur(24px)',
            border:'1px solid rgba(34,197,94,0.25)',borderRadius:'22px',
            boxShadow:'0 25px 80px rgba(0,0,0,0.7)',padding:'28px 32px',
          }}>
            {/* Header */}
            <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'22px'}}>
              <div style={{width:'46px',height:'46px',borderRadius:'12px',background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <UserCheck size={22} style={{color:'#86EFAC'}}/>
              </div>
              <div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'18px',fontWeight:'700',color:'rgba(255,255,255,0.95)',margin:'0 0 3px',textShadow:'0 2px 4px rgba(0,0,0,0.3)'}}>
                  Aprobar usuario
                </h2>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.45)',margin:0}}>
                  {rolModal.nombre}
                </p>
              </div>
            </div>

            {/* Selección de rol */}
            <div style={{marginBottom:'24px'}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',color:'rgba(201,168,76,0.65)',margin:'0 0 12px'}}>
                Asignar rol de acceso
              </p>
              <div style={{display:'flex',gap:'8px'}}>
                {ROL_OPTS.map(opt=>(
                  <button key={opt.value}
                    className={`rol-btn${rolSel===opt.value?' selected':''}`}
                    onClick={()=>setRolSel(opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Descripción del rol seleccionado */}
              <div style={{marginTop:'12px',padding:'10px 14px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'9px'}}>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.4)',margin:0,lineHeight:1.5}}>
                  {rolSel === 'cliente'    && '🔵 Puede ver sus casos, citas y documentos asignados.'}
                  {rolSel === 'secretario' && '🟣 Puede gestionar clientes, confirmar citas y ver casos.'}
                  {rolSel === 'abogado'    && '🟡 Acceso completo: casos, documentos confidenciales y usuarios.'}
                </p>
              </div>
            </div>

            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
              <button onClick={()=>setRolModal(null)} style={{padding:'9px 18px',borderRadius:'8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.65)',fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>
                Cancelar
              </button>
              <button onClick={confirmarAprobacion} style={{padding:'9px 20px',borderRadius:'8px',background:'linear-gradient(135deg,#22C55E,#16A34A)',border:'none',color:'#020818',fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'700',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'7px'}}>
                <CheckCircle size={14}/> Confirmar aprobación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal eliminación ────────────────────────────────── */}
      {deleteModal && (
        <div className="up-modal-bg" onClick={()=>setDeleteModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{
            position:'relative',zIndex:1,width:'100%',maxWidth:'400px',
            background:'rgba(6,16,40,0.97)',backdropFilter:'blur(24px)',
            border:'1px solid rgba(239,68,68,0.25)',borderRadius:'20px',
            boxShadow:'0 25px 80px rgba(0,0,0,0.7)',padding:'26px 30px',
          }}>
            <div style={{width:'46px',height:'46px',borderRadius:'12px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px'}}>
              <Trash2 size={20} style={{color:'#FCA5A5'}}/>
            </div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'18px',fontWeight:'700',color:'rgba(255,255,255,0.95)',margin:'0 0 8px'}}>
              Eliminar usuario
            </h2>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.45)',margin:'0 0 6px',lineHeight:1.6}}>
              ¿Eliminar a <strong style={{color:'rgba(255,255,255,0.75)'}}>{deleteModal.nombre}</strong>?
            </p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.28)',margin:'0 0 24px'}}>
              Esta acción es permanente e irreversible.
            </p>
            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
              <button onClick={()=>setDeleteModal(null)} style={{padding:'8px 16px',borderRadius:'8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.65)',fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>
                Cancelar
              </button>
              <button onClick={handleEliminar} style={{padding:'8px 16px',borderRadius:'8px',background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',color:'#FCA5A5',fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}