import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { getMisCitas }         from '../appointments/appointmentsService'
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_L = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

const ESTADO_CONFIG = {
  pendiente:  { label:'Pendiente de confirmación', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.28)',  text:'#FCD34D', dot:'#F59E0B', cardBg:'rgba(245,158,11,0.06)',  cardBorder:'rgba(245,158,11,0.18)',  icon:AlertCircle  },
  confirmada: { label:'Confirmada',                bg:'rgba(34,197,94,0.12)',   border:'rgba(34,197,94,0.28)',   text:'#86EFAC', dot:'#22C55E', cardBg:'rgba(34,197,94,0.06)',   cardBorder:'rgba(34,197,94,0.18)',   icon:CheckCircle  },
  cancelada:  { label:'Cancelada',                 bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.28)',   text:'#FCA5A5', dot:'#EF4444', cardBg:'rgba(239,68,68,0.06)',   cardBorder:'rgba(239,68,68,0.18)',   icon:XCircle      },
}

function formatHora(hora) {
  if (!hora) return ''
  const [h, m] = hora.split(':')
  const hNum = parseInt(h)
  return `${hNum > 12 ? hNum - 12 : hNum || 12}:${m} ${hNum >= 12 ? 'pm' : 'am'}`
}

function Badge({ estado }) {
  const c = ESTADO_CONFIG[estado] || ESTADO_CONFIG.pendiente
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'5px',
      background:c.bg, border:`1px solid ${c.border}`,
      borderRadius:'4px', padding:'3px 8px',
      fontFamily:"'Inter',sans-serif",
      fontSize:'11px', fontWeight:'600', color:c.text,
      whiteSpace:'nowrap', flexShrink:0,
    }}>
      <span style={{width:'5px',height:'5px',borderRadius:'50%',background:c.dot}}/>
      {c.label}
    </span>
  )
}

const toLocalStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

export default function MisCitasPage() {
  const navigate = useNavigate()
  const hoy      = new Date()

  const [año,        setAño]        = useState(hoy.getFullYear())
  const [mes,        setMes]        = useState(hoy.getMonth())
  const [diaSelecto, setDiaSelecto] = useState(toLocalStr(hoy))
  const [citas,      setCitas]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [panelKey,   setPanelKey]   = useState(0)

  useEffect(() => {
    getMisCitas()
      .then(r => setCitas(r.data.citas))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const citasDelDia  = citas.filter(c => c.fecha === diaSelecto)
  const diasEnMes    = new Date(año, mes + 1, 0).getDate()
  const primerDiaSem = new Date(año, mes, 1).getDay()

  const citasPorDia = (dia) => {
    const fecha = `${año}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    return citas.filter(c => c.fecha === fecha)
  }

  const navMes = (dir) => {
    let nm = mes + dir, na = año
    if (nm < 0)  { nm = 11; na-- }
    if (nm > 11) { nm = 0;  na++ }
    setMes(nm); setAño(na)
  }

  const selDia = (dia) => {
    const f = `${año}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    if (f === diaSelecto) return
    setDiaSelecto(f)
    setPanelKey(k => k+1)
  }

  const esHoy = (dia) => dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear()
  const esSel = (dia) => `${año}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}` === diaSelecto

  const fechaObj   = new Date(diaSelecto + 'T12:00:00')
  const nombreDia  = DIAS_L[fechaObj.getDay()]
  const numDia     = fechaObj.getDate()
  const nombreMes  = MESES[fechaObj.getMonth()]

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(7px)}  to{opacity:1;transform:translateY(0)} }
        .mc-fade  { animation: fadeUp 0.4s ease both; }
        .mc-panel { animation: fadeIn 0.22s ease both; }

        .ag-day {
          position:relative; width:32px; height:32px;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          border-radius:50%; cursor:pointer;
          transition:all 0.15s ease;
          font-family:'Inter',sans-serif;
          font-size:13px; font-weight:500;
          color:rgba(255,255,255,0.6);
          margin:0 auto;
          border:1.5px solid transparent;
        }
        .ag-day:hover:not(.selected):not(.today) { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.9); }
        .ag-day.today  { background:rgba(201,168,76,0.14); border-color:rgba(201,168,76,0.42); color:#E8C97A; font-weight:700; }
        .ag-day.selected { background:linear-gradient(135deg,#C9A84C,#9A7A32); border-color:transparent; color:#020818; font-weight:700; box-shadow:0 3px 12px rgba(201,168,76,0.3); }

        .mc-cita-card { border-radius:12px; padding:15px 16px; transition:all 0.18s ease; position:relative; overflow:hidden; }
        .mc-cita-card:hover { transform:translateY(-1px); box-shadow:0 6px 24px rgba(0,0,0,0.35); }

        .mc-nav {
          width:28px; height:28px; border-radius:7px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:all 0.15s ease; color:rgba(255,255,255,0.5);
        }
        .mc-nav:hover { background:rgba(201,168,76,0.1); border-color:rgba(201,168,76,0.25); color:#E8C97A; }

        .mc-btn-primary {
          display:inline-flex; align-items:center; gap:7px;
          padding:9px 16px; border-radius:8px;
          background:linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%);
          border:none; color:#020818;
          font-family:'Inter',sans-serif; font-size:12px; font-weight:700;
          cursor:pointer; transition:all 0.15s ease;
        }
        .mc-btn-primary:hover { background:linear-gradient(135deg,#E8C97A 0%,#C9A84C 100%); transform:translateY(-1px); box-shadow:0 4px 14px rgba(201,168,76,0.3); }

        /* Layout responsive */
        .mc-layout  { flex:1; display:flex; overflow:hidden; }
        .mc-cal     { width:280px; flex-shrink:0; background:rgba(4,12,32,0.85); backdrop-filter:blur(20px); border-right:1px solid rgba(201,168,76,0.12); display:flex; flex-direction:column; overflow-y:auto; }
        .mc-detail  { flex:1; overflow-y:auto; padding:22px 26px; }
        .mc-hdr     { padding:22px 32px 18px; }

        @media (max-width: 700px) {
          .mc-layout  { flex-direction:column; overflow:auto; }
          .mc-cal     { width:100%; border-right:none; border-bottom:1px solid rgba(201,168,76,0.12); }
          .mc-detail  { padding:14px 14px 24px; }
          .mc-hdr     { padding:16px 16px 14px; }
        }
      `}</style>

      <div style={{
        flex:1, display:'flex', flexDirection:'column', minHeight:'100vh', overflow:'hidden',
        background:`
          radial-gradient(ellipse at 8% 20%, rgba(201,168,76,0.06) 0%, transparent 48%),
          radial-gradient(ellipse at 92% 80%, rgba(59,130,246,0.04) 0%, transparent 48%),
          linear-gradient(160deg,#020818 0%,#040d20 50%,#02050f 100%)
        `,
      }}>

        {/* ── Page header ──────────────────────────────────────── */}
        <div className="mc-fade mc-hdr" style={{
          background:'linear-gradient(135deg,rgba(6,16,40,0.97) 0%,rgba(12,26,56,0.9) 100%)',
          borderBottom:'1px solid rgba(201,168,76,0.14)',
          position:'relative', overflow:'hidden', flexShrink:0,
        }}>
          {[160,110].map((s,i)=>(
            <div key={i} style={{position:'absolute',top:-s*0.4,right:-s*0.4,width:s,height:s,borderRadius:'50%',border:`1px solid rgba(201,168,76,${0.06-i*0.02})`,pointerEvents:'none'}}/>
          ))}
          <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
            <div>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'3px',textTransform:'uppercase',color:'rgba(201,168,76,0.85)',margin:'0 0 5px'}}>Portal del Cliente</p>
              <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'22px',fontWeight:'700',color:'rgba(255,255,255,0.96)',margin:'0 0 3px',textShadow:'0 2px 6px rgba(0,0,0,0.35)'}}>Mis Citas</h1>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.35)',margin:0}}>
                {citas.length} cita{citas.length!==1?'s':''} registrada{citas.length!==1?'s':''}
              </p>
            </div>
            <button className="mc-btn-primary" onClick={()=>navigate('/cliente/solicitar-cita')}>
              <Plus size={13}/> Solicitar cita
            </button>
          </div>
          <div style={{position:'absolute',bottom:0,left:'32px',width:'44px',height:'1px',background:'linear-gradient(90deg,rgba(201,168,76,0.55),transparent)'}}/>
        </div>

        {/* ── Split layout ──────────────────────────────────────── */}
        <div className="mc-layout">

          {/* Izquierda/Arriba — Calendario */}
          <div className="mc-cal">
            {/* Nav mes */}
            <div style={{padding:'16px 16px 10px',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <button className="mc-nav" onClick={()=>navMes(-1)}>‹</button>
              <div style={{textAlign:'center'}}>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:'15px',fontWeight:'700',color:'rgba(255,255,255,0.92)',margin:'0 0 1px'}} translate="no">{MESES[mes]}</p>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:'500',color:'rgba(201,168,76,0.6)',margin:0}}>{año}</p>
              </div>
              <button className="mc-nav" onClick={()=>navMes(1)}>›</button>
            </div>

            {/* Días semana */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',padding:'10px 12px 5px'}}>
              {DIAS.map(d=>(
                <div key={d} style={{textAlign:'center',fontFamily:"'Inter',sans-serif",fontSize:'9px',fontWeight:'700',color:'rgba(201,168,76,0.5)',letterSpacing:'0.5px',paddingBottom:'4px'}}>{d}</div>
              ))}
            </div>

            {/* Grid días */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',padding:'3px 12px 14px',rowGap:'3px'}}>
              {[...Array(primerDiaSem)].map((_,i)=><div key={`e${i}`}/>)}
              {[...Array(diasEnMes)].map((_,i)=>{
                const d     = i+1
                const tiene = citasPorDia(d)
                return (
                  <div key={d}
                    className={`ag-day${esHoy(d)?' today':''}${esSel(d)?' selected':''}`}
                    onClick={()=>selDia(d)}>
                    {d}
                    {tiene.length > 0 && (
                      <span style={{
                        position:'absolute', bottom:'3px',
                        width:'4px', height:'4px', borderRadius:'50%',
                        background: esSel(d) ? 'rgba(2,8,24,0.7)' : '#C9A84C',
                      }}/>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Leyenda */}
            <div style={{margin:'0 12px 14px',background:'rgba(8,20,48,0.6)',border:'1px solid rgba(201,168,76,0.1)',borderRadius:'10px',padding:'12px 14px'}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'9px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',color:'rgba(201,168,76,0.55)',margin:'0 0 9px'}}>Estados</p>
              {Object.entries(ESTADO_CONFIG).map(([k,v])=>(
                <div key={k} style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'6px'}}>
                  <span style={{width:'6px',height:'6px',borderRadius:'50%',background:v.dot,flexShrink:0}}/>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.45)'}}>{v.label}</span>
                </div>
              ))}
            </div>

            {/* Ir a hoy */}
            <div style={{padding:'0 12px 16px'}}>
              <button onClick={()=>{setAño(hoy.getFullYear());setMes(hoy.getMonth());selDia(hoy.getDate())}}
                style={{width:'100%',padding:'7px',borderRadius:'8px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.4)',fontFamily:"'Inter',sans-serif",fontSize:'12px',cursor:'pointer',transition:'all 0.15s ease'}}
                onMouseOver={e=>{e.currentTarget.style.background='rgba(201,168,76,0.08)';e.currentTarget.style.color='rgba(201,168,76,0.8)'}}
                onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.03)';e.currentTarget.style.color='rgba(255,255,255,0.4)'}}>
                Ir a hoy
              </button>
            </div>
          </div>

          {/* Derecha/Abajo — detalle del día */}
          <div className="mc-detail">
            <div key={panelKey} className="mc-panel">

              {/* Encabezado del día */}
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'10px'}}>
                <div>
                  <div style={{display:'flex',alignItems:'baseline',gap:'10px',flexWrap:'wrap'}}>
                    <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'22px',fontWeight:'700',color:'rgba(255,255,255,0.95)',margin:0,textShadow:'0 2px 5px rgba(0,0,0,0.3)'}} translate="no">
                      {nombreDia}, {numDia} de {nombreMes}
                    </h2>
                    {diaSelecto===toLocalStr(hoy) && (
                      <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',background:'rgba(201,168,76,0.14)',border:'1px solid rgba(201,168,76,0.28)',color:'rgba(201,168,76,0.9)',padding:'3px 9px',borderRadius:'20px'}}>Hoy</span>
                    )}
                  </div>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.35)',margin:'5px 0 0'}}>
                    {citasDelDia.length===0 ? 'Sin citas programadas' : `${citasDelDia.length} cita${citasDelDia.length!==1?'s':''} programada${citasDelDia.length!==1?'s':''}`}
                  </p>
                </div>
              </div>

              {loading ? (
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {[...Array(2)].map((_,i)=>(
                    <div key={i} style={{height:'80px',borderRadius:'12px',background:'rgba(255,255,255,0.04)'}}/>
                  ))}
                </div>
              ) : citasDelDia.length === 0 ? (
                <div style={{padding:'48px 24px',textAlign:'center',background:'rgba(8,20,48,0.5)',backdropFilter:'blur(12px)',border:'1px solid rgba(201,168,76,0.1)',borderRadius:'14px',display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <div style={{width:'50px',height:'50px',borderRadius:'14px',background:'rgba(201,168,76,0.07)',border:'1px solid rgba(201,168,76,0.15)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'14px'}}>
                    <Clock size={22} style={{color:'rgba(201,168,76,0.45)'}}/>
                  </div>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:'15px',fontWeight:'700',color:'rgba(255,255,255,0.6)',margin:'0 0 7px'}}>Sin citas para este día</p>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.3)',margin:0,maxWidth:'220px',lineHeight:1.6}}>
                    Puedes solicitar una nueva cita con el despacho desde el botón en la parte superior.
                  </p>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {citasDelDia.map(cita=>{
                    const cfg  = ESTADO_CONFIG[cita.estado] || ESTADO_CONFIG.pendiente
                    const Icon = cfg.icon
                    return (
                      <div key={cita.id_cita} className="mc-cita-card"
                        style={{background:cfg.cardBg,border:`1px solid ${cfg.cardBorder}`,boxShadow:'0 4px 16px rgba(0,0,0,0.25)'}}>
                        {/* Línea lateral */}
                        <div style={{position:'absolute',top:0,left:0,bottom:0,width:'3px',background:`linear-gradient(to bottom,${cfg.dot},transparent)`,borderRadius:'12px 0 0 12px'}}/>
                        <div style={{paddingLeft:'10px'}}>
                          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'10px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'12px',flex:1,minWidth:0}}>
                              {/* Hora pill */}
                              <div style={{flexShrink:0,textAlign:'center',background:'rgba(4,12,32,0.6)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'6px 10px',minWidth:'52px'}}>
                                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'800',color:'rgba(255,255,255,0.92)',margin:'0 0 1px',lineHeight:1,letterSpacing:'-0.3px'}}>
                                  {cita.hora?.slice(0,5)||'--:--'}
                                </p>
                                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'9px',fontWeight:'700',color:'rgba(201,168,76,0.7)',margin:0,letterSpacing:'0.5px',textTransform:'uppercase'}}>
                                  {cita.hora?parseInt(cita.hora)>=12?'pm':'am':''}
                                </p>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'14px',fontWeight:'600',color:'rgba(255,255,255,0.92)',margin:'0 0 3px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                                  {cita.motivo}
                                </p>
                                {cita.estado==='pendiente' && (
                                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(245,158,11,0.7)',margin:0}}>
                                    En espera de confirmación del despacho
                                  </p>
                                )}
                                {cita.mensaje && (
                                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontStyle:'italic',color:'rgba(255,255,255,0.35)',margin:'3px 0 0'}}>
                                    "{cita.mensaje}"
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge estado={cita.estado}/>
                          </div>
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
    </>
  )
}