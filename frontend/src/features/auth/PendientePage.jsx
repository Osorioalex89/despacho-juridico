import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  LogOut, Phone, Mail, MapPin, Check, Lock, Shield, ChevronRight,
  Scale, FileText, Landmark, BookOpen, FileSignature, Home, Briefcase, Gavel,
} from 'lucide-react'

// ── Logo SC ───────────────────────────────────────────────────────
const LogoSC = ({ size = 40 }) => (
  <svg viewBox="0 0 72 72" width={size} height={size} fill="none">
    <defs>
      <linearGradient id="pp2-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8C97A"/><stop offset="100%" stopColor="#9A7A32"/>
      </linearGradient>
      <linearGradient id="pp2-navy" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3a5f"/><stop offset="100%" stopColor="#0e1830"/>
      </linearGradient>
    </defs>
    <rect width="72" height="72" rx="16" fill="url(#pp2-navy)" stroke="rgba(201,168,76,0.4)" strokeWidth="1.2"/>
    <rect x="1" y="1" width="70" height="32" rx="15" fill="rgba(255,255,255,0.04)"/>
    <rect x="35.2" y="11" width="1.6" height="34" rx="0.8" fill="url(#pp2-gold)" opacity="0.9"/>
    <circle cx="36" cy="11" r="2.8" fill="url(#pp2-gold)"/>
    <rect x="14" y="22" width="44" height="2" rx="1" fill="url(#pp2-gold)" opacity="0.85"/>
    <line x1="19" y1="24" x2="16" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <line x1="19" y1="24" x2="22" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <ellipse cx="19" cy="34.2" rx="6" ry="2.2" fill="url(#pp2-gold)" opacity="0.8"/>
    <line x1="53" y1="24" x2="50" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <line x1="53" y1="24" x2="56" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <ellipse cx="53" cy="34.2" rx="6" ry="2.2" fill="url(#pp2-gold)" opacity="0.8"/>
    <rect x="29" y="45" width="14" height="1.8" rx="0.9" fill="url(#pp2-gold)" opacity="0.65"/>
    <text x="36" y="58" textAnchor="middle"
      fontFamily="Georgia,'Times New Roman',serif"
      fontSize="11" fontWeight="700"
      fill="url(#pp2-gold)" opacity="0.95" letterSpacing="2">SC</text>
    <rect x="28" y="61" width="16" height="1" rx="0.5" fill="url(#pp2-gold)" opacity="0.35"/>
  </svg>
)

// ── Servicios ─────────────────────────────────────────────────────
const SERVICIOS = [
  { Icon: Gavel,         color:'#C9A84C', bg:'rgba(201,168,76,0.12)',  titulo:'Asuntos Penales',        desc:'Defensa y representación en procesos penales del fuero común y federal.',  req:'Acta de hechos, identificación oficial y denuncia previa.' },
  { Icon: FileText,      color:'#93BBFC', bg:'rgba(147,187,252,0.12)', titulo:'Asuntos Civiles',         desc:'Contratos, demandas civiles, daños y perjuicios, obligaciones.',           req:'Contrato o documento origen del conflicto e identificación.' },
  { Icon: Landmark,      color:'#C4B5FD', bg:'rgba(196,181,253,0.12)', titulo:'Amparos',                 desc:'Amparo directo e indirecto contra actos de autoridad.',                    req:'Resolución impugnada y datos del juicio de origen.' },
  { Icon: BookOpen,      color:'#FB923C', bg:'rgba(251,146,60,0.12)',  titulo:'Sucesorios',              desc:'Testamentos, herencias, adjudicación de bienes.',                          req:'Acta de defunción, testamento (si existe) e IDs de herederos.' },
  { Icon: FileSignature, color:'#86EFAC', bg:'rgba(134,239,172,0.12)', titulo:'Contratos',               desc:'Elaboración, revisión y asesoría en contratos civiles y mercantiles.',     req:'Partes involucradas, objeto del contrato y condiciones.' },
  { Icon: Home,          color:'#FCD34D', bg:'rgba(252,211,77,0.12)',  titulo:'Trámite de Escrituras',   desc:'Escrituración de inmuebles, regularización y trámites notariales.',        req:'Escritura anterior, plano catastral e identificaciones.' },
  { Icon: Scale,         color:'#FCA5A5', bg:'rgba(252,165,165,0.12)', titulo:'Inscripción de Posesión', desc:'Registro y trámites de posesión de terrenos y propiedades ejidales.',     req:'Título de posesión, plano y constancia ejidal.' },
  { Icon: Briefcase,     color:'#E8C97A', bg:'rgba(232,201,122,0.12)', titulo:'Asesoría Legal',           desc:'Consultas y orientación jurídica en todas las ramas del derecho.',        req:'Descripción del caso y documentos relacionados.' },
]

// ── Ícono 3D ──────────────────────────────────────────────────────
function Icon3D({ Icon, color, bg, hovered }) {
  return (
    <div style={{
      width:'52px', height:'52px', borderRadius:'14px', flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      marginBottom:'14px',
      background: hovered
        ? `linear-gradient(145deg, ${bg.replace('0.12','0.22')}, ${bg})`
        : `linear-gradient(145deg, ${bg}, rgba(8,20,48,0.4))`,
      border:`1px solid ${color}33`,
      boxShadow: hovered
        ? `0 8px 20px ${color}30, 0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 ${color}22`
        : `0 4px 12px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)`,
      transform: hovered ? 'translateY(-2px) scale(1.07)' : 'translateY(0) scale(1)',
      transition:'all 0.25s ease',
    }}>
      <Icon size={22} style={{
        color,
        filter: `drop-shadow(0 2px 4px ${color}55)`,
        transition:'all 0.25s ease',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
      }}/>
    </div>
  )
}

// ── Pasos del stepper ─────────────────────────────────────────────
const STEPS = [
  { label:'Registro',                  status:'done'    },
  { label:'Verificación de Identidad', status:'active'  },
  { label:'Acceso al Portal',          status:'locked'  },
]

function ServiceCard({ s, idx }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(201,168,76,0.07)' : 'rgba(8,20,48,0.65)',
        border: `1px solid ${hovered ? 'rgba(201,168,76,0.28)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius:'16px', padding:'22px 20px',
        transition:'all 0.25s ease',
        cursor:'default', position:'relative', overflow:'hidden',
        boxShadow: hovered
          ? '0 0 28px rgba(201,168,76,0.15), 0 8px 32px rgba(0,0,0,0.35)'
          : '0 4px 16px rgba(0,0,0,0.2)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        animationDelay:`${0.3+idx*0.05}s`,
      }}
    >
      {/* Glow corner */}
      {hovered && (
        <div style={{
          position:'absolute', top:-30, right:-30,
          width:80, height:80, borderRadius:'50%',
          background:`${s.color}1a`,
          pointerEvents:'none',
        }}/>
      )}

      <Icon3D Icon={s.Icon} color={s.color} bg={s.bg} hovered={hovered}/>
      <h3 style={{
        fontFamily:"'Playfair Display',serif",
        fontSize:'14.5px', fontWeight:'700',
        color:'rgba(255,255,255,0.95)', margin:'0 0 7px',
        textShadow:'0 1px 3px rgba(0,0,0,0.2)',
      }}>{s.titulo}</h3>
      <p style={{
        fontFamily:"'Inter',sans-serif", fontSize:'12px',
        color:'rgba(255,255,255,0.4)', lineHeight:1.6, margin:'0 0 12px',
      }}>{s.desc}</p>

      {/* Micro-texto hover */}
      <div style={{
        display:'flex', alignItems:'center', gap:'5px',
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translateY(0)' : 'translateY(4px)',
        transition:'all 0.2s ease',
      }}>
        <span style={{
          fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:'600',
          color:'rgba(201,168,76,0.8)', letterSpacing:'0.5px',
        }}>
          Consultar requisitos para este trámite
        </span>
        <ChevronRight size={10} style={{color:'rgba(201,168,76,0.7)'}}/>
      </div>

      {/* Requisitos al hover */}
      {hovered && (
        <div style={{
          marginTop:'10px', padding:'9px 12px',
          background:'rgba(201,168,76,0.06)',
          border:'1px solid rgba(201,168,76,0.15)',
          borderRadius:'8px',
        }}>
          <p style={{
            fontFamily:"'Inter',sans-serif", fontSize:'11px',
            color:'rgba(255,255,255,0.5)', margin:0, lineHeight:1.5,
          }}>
            <span style={{color:'rgba(201,168,76,0.7)',fontWeight:'600'}}>Req: </span>
            {s.req}
          </p>
        </div>
      )}
    </div>
  )
}

export default function PendientePage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const handleLogout     = () => { logout(); navigate('/login') }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ppulse  { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.5)} 60%{box-shadow:0 0 0 8px rgba(201,168,76,0)} }
        @keyframes rotate  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .pp-fade { animation: fadeUp 0.45s ease both; }

        /* Stepper pulse */
        .step-pulse { animation: ppulse 2.2s ease-in-out infinite; }

        /* Spinner loader */
        .pp-spinner {
          width:14px; height:14px; border-radius:50%;
          border:2px solid rgba(201,168,76,0.25);
          border-top-color:#C9A84C;
          animation:rotate 1s linear infinite;
          flex-shrink:0;
        }

        .pp-logout {
          display:flex; align-items:center; gap:7px;
          padding:7px 14px; border-radius:8px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.09);
          color:rgba(255,255,255,0.5);
          font-family:'Inter',sans-serif; font-size:12px; font-weight:500;
          cursor:pointer; transition:all 0.15s ease;
        }
        .pp-logout:hover {
          background:rgba(239,68,68,0.09);
          border-color:rgba(239,68,68,0.22);
          color:rgba(252,165,165,0.9);
        }

        .pp-contact-btn {
          display:inline-flex; align-items:center; gap:8px;
          padding:11px 22px; border-radius:10px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.12);
          color:rgba(255,255,255,0.6);
          font-family:'Inter',sans-serif; font-size:13px; font-weight:500;
          cursor:pointer; transition:all 0.2s ease;
          text-decoration:none;
        }
        .pp-contact-btn:hover {
          background:rgba(201,168,76,0.08);
          border-color:rgba(201,168,76,0.28);
          color:rgba(201,168,76,0.9);
          transform:translateY(-1px);
        }

        /* ── Responsive ─────────────────────────────────── */
        @media (max-width: 767px) {
          .pp-nav-inner {
            padding: 0 16px !important;
            height: 56px !important;
          }
          .pp-brand-subtitle { display: none; }
          .pp-hero { padding: 32px 16px 16px !important; }
          .pp-hero h1 { font-size: 22px !important; }
          .pp-hero-desc { font-size: 13px !important; }

          .pp-stepper {
            gap: 0 !important;
          }
          .pp-step-line {
            width: 36px !important;
          }
          .pp-step-label { font-size: 9px !important; }

          .pp-services-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .pp-section { padding: 0 16px 40px !important; }
          .pp-seal { margin: 0 16px 32px !important; }
          .pp-footer-inner { gap: 14px !important; }
        }

        @media (max-width: 480px) {
          .pp-services-grid {
            grid-template-columns: 1fr !important;
          }
          .pp-hero h1 { font-size: 20px !important; }
          .pp-stepper { flex-wrap: nowrap; }
          .pp-step-line { width: 24px !important; }
        }
      `}</style>

      <div style={{
        minHeight:'100vh',
        background:`
          radial-gradient(ellipse at 15% 25%, rgba(201,168,76,0.07) 0%, transparent 45%),
          radial-gradient(ellipse at 85% 75%, rgba(59,130,246,0.05) 0%, transparent 45%),
          linear-gradient(160deg,#020818 0%,#040d20 50%,#02050f 100%)
        `,
        fontFamily:"'Inter',sans-serif",
      }}>

        {/* ── Navbar ─────────────────────────────────────────── */}
        <nav style={{
          background:'rgba(4,12,32,0.92)',
          backdropFilter:'blur(20px)',
          borderBottom:'1px solid rgba(201,168,76,0.14)',
          position:'sticky', top:0, zIndex:100,
          boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <div className="pp-nav-inner" style={{maxWidth:'1200px',margin:'0 auto',padding:'0 32px',height:'64px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <LogoSC size={38}/>
              <div>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:'14px',fontWeight:'700',color:'rgba(255,255,255,0.97)',margin:'0 0 1px',textShadow:'0 1px 4px rgba(0,0,0,0.3)'}}>
                  Lic. Horacio <span style={{color:'#C9A84C'}}>Sánchez Cerino</span>
                </p>
                <p className="pp-brand-subtitle" style={{fontFamily:"'Inter',sans-serif",fontSize:'9px',fontWeight:'700',color:'rgba(201,168,76,0.55)',margin:0,letterSpacing:'2.2px',textTransform:'uppercase'}}>
                  Asesoría Jurídica Profesional
                </p>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.4)',margin:0}}>
                {user?.nombre?.split(' ')[0]}
              </p>
              <button className="pp-logout" onClick={handleLogout}>
                <LogOut size={12}/> Salir
              </button>
            </div>
          </div>
        </nav>

        {/* ── Hero ───────────────────────────────────────────── */}
        <div className="pp-hero" style={{maxWidth:'720px',margin:'0 auto',padding:'52px 24px 20px',textAlign:'center'}}>

          {/* ── Timeline Stepper ─────────────────────────────── */}
          <div className="pp-fade pp-stepper" style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            marginBottom:'44px', gap:0,
            animationDelay:'0.05s',
          }}>
            {STEPS.map((step, i) => {
              const isDone   = step.status === 'done'
              const isActive = step.status === 'active'
              const isLocked = step.status === 'locked'
              return (
                <div key={i} style={{display:'flex',alignItems:'center'}}>
                  {/* Paso */}
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
                    {/* Círculo */}
                    <div
                      className={isActive ? 'step-pulse' : ''}
                      style={{
                        width:'28px', height:'28px', borderRadius:'50%',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        flexShrink:0,
                        background: isDone
                          ? 'linear-gradient(135deg,#C9A84C,#9A7A32)'
                          : isActive
                            ? 'rgba(201,168,76,0.1)'
                            : 'rgba(255,255,255,0.04)',
                        border: isDone
                          ? 'none'
                          : isActive
                            ? '1.5px solid rgba(201,168,76,0.6)'
                            : '1px solid rgba(255,255,255,0.1)',
                        boxShadow: isActive ? '0 0 0 0 rgba(201,168,76,0.4)' : 'none',
                      }}
                    >
                      {isDone   && <Check size={13} style={{color:'#020818'}} strokeWidth={3}/>}
                      {isActive && <div className="pp-spinner"/>}
                      {isLocked && <Lock size={11} style={{color:'rgba(255,255,255,0.25)'}}/>}
                    </div>
                    {/* Label */}
                    <span className="pp-step-label" style={{
                      fontFamily:"'Inter',sans-serif",
                      fontSize:'10px', fontWeight: isDone||isActive ? '600' : '400',
                      color: isDone
                        ? 'rgba(201,168,76,0.9)'
                        : isActive
                          ? 'rgba(255,255,255,0.8)'
                          : 'rgba(255,255,255,0.25)',
                      whiteSpace:'nowrap', letterSpacing:'0.2px',
                    }}>
                      {i+1}. {step.label}
                    </span>
                  </div>

                  {/* Línea conectora */}
                  {i < STEPS.length - 1 && (
                    <div className="pp-step-line" style={{
                      width:'80px', height:'1px', margin:'0 10px',
                      marginBottom:'22px',
                      background: i === 0
                        ? 'linear-gradient(90deg,#C9A84C,rgba(201,168,76,0.3))'
                        : 'rgba(255,255,255,0.08)',
                    }}/>
                  )}
                </div>
              )
            })}
          </div>

          {/* Mensaje central */}
          <p className="pp-fade" style={{
            fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:'700',
            letterSpacing:'3px', textTransform:'uppercase',
            color:'rgba(201,168,76,0.7)', margin:'0 0 12px',
            animationDelay:'0.1s',
          }}>
            Bienvenido al despacho
          </p>

          <h1 className="pp-fade" style={{
            fontFamily:"'Playfair Display',serif",
            fontSize:'30px', fontWeight:'700',
            color:'rgba(255,255,255,0.97)', margin:'0 0 16px',
            lineHeight:1.3, textShadow:'0 2px 8px rgba(0,0,0,0.4)',
            animationDelay:'0.14s',
          }}>
            Su seguridad es nuestra prioridad
          </h1>

          <p className="pp-fade pp-hero-desc" style={{
            fontFamily:"'Inter',sans-serif", fontSize:'14px',
            color:'rgba(255,255,255,0.45)', lineHeight:1.8,
            margin:'0 0 28px', maxWidth:'560px', marginLeft:'auto', marginRight:'auto',
            animationDelay:'0.18s',
          }}>
            El Lic. Horacio Sánchez Cerino está validando personalmente su solicitud para
            proteger la confidencialidad de sus futuros expedientes y garantizar
            un acceso seguro al portal jurídico.
          </p>

          {/* Status pill */}
          <div className="pp-fade" style={{
            display:'inline-flex', alignItems:'center', gap:'10px',
            background:'rgba(201,168,76,0.07)',
            border:'1px solid rgba(201,168,76,0.2)',
            borderRadius:'24px', padding:'9px 20px',
            marginBottom:'16px',
            animationDelay:'0.22s',
          }}>
            <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#C9A84C',boxShadow:'0 0 8px rgba(201,168,76,0.7)'}}/>
            <span style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',fontWeight:'600',color:'rgba(201,168,76,0.9)'}}>
              Verificación en curso
            </span>
          </div>

          {/* Botón contacto */}
          <div className="pp-fade" style={{marginBottom:'52px',animationDelay:'0.26s'}}>
            <br/>
            <a href="tel:+529131004413" className="pp-contact-btn">
              <Phone size={14}/>
              ¿Duda urgente? Contactar al despacho
            </a>
          </div>
        </div>

        {/* ── Exploración Preventiva ─────────────────────────── */}
        <div className="pp-section" style={{maxWidth:'1100px',margin:'0 auto',padding:'0 24px 52px'}}>

          <div className="pp-fade" style={{textAlign:'center',marginBottom:'32px',animationDelay:'0.28s'}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'3px',textTransform:'uppercase',color:'rgba(201,168,76,0.6)',margin:'0 0 10px'}}>
              Exploración preventiva
            </p>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'24px',fontWeight:'700',color:'rgba(255,255,255,0.95)',margin:'0 0 10px',textShadow:'0 1px 6px rgba(0,0,0,0.3)'}}>
              Conozca nuestros servicios
            </h2>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.35)',margin:'0 0 14px'}}>
              Pasa el cursor sobre cada servicio para conocer los requisitos necesarios
            </p>
            <div style={{width:'40px',height:'2px',margin:'0 auto',background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',borderRadius:'2px'}}/>
          </div>

          <div className="pp-services-grid" style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',
            gap:'13px',
          }}>
            {SERVICIOS.map((s,i)=>(
              <ServiceCard key={i} s={s} idx={i}/>
            ))}
          </div>
        </div>

        {/* ── Sello de garantía ──────────────────────────────── */}
        <div className="pp-seal" style={{maxWidth:'600px',margin:'0 auto 40px',padding:'0 24px'}}>
          <div className="pp-fade" style={{
            background:'rgba(8,20,48,0.75)',
            backdropFilter:'blur(16px)',
            WebkitBackdropFilter:'blur(16px)',
            border:'1px solid rgba(201,168,76,0.18)',
            borderRadius:'14px',
            padding:'14px 20px',
            display:'flex', alignItems:'center', gap:'14px',
            boxShadow:'0 8px 32px rgba(0,0,0,0.35)',
            animationDelay:'0.35s',
          }}>
            {/* Ícono sello */}
            <div style={{
              width:'38px', height:'38px', borderRadius:'10px', flexShrink:0,
              background:'linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05))',
              border:'1px solid rgba(201,168,76,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Shield size={18} style={{color:'#C9A84C'}}/>
            </div>
            <div>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:'700',color:'rgba(201,168,76,0.85)',margin:'0 0 3px',letterSpacing:'0.3px'}}>
                Protocolo de Seguridad Activo
              </p>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)',margin:0,lineHeight:1.5}}>
                SSL · Cifrado de Datos Jurídicos · Confidencialidad Garantizada
              </p>
            </div>
            {/* Indicador verde activo */}
            <div style={{marginLeft:'auto',flexShrink:0,display:'flex',alignItems:'center',gap:'5px'}}>
              <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#22C55E',boxShadow:'0 0 6px rgba(34,197,94,0.7)'}}/>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'600',color:'rgba(34,197,94,0.8)'}}>
                Activo
              </span>
            </div>
          </div>
        </div>

        {/* ── Footer contacto ────────────────────────────────── */}
        <div style={{borderTop:'1px solid rgba(255,255,255,0.05)',background:'rgba(4,12,32,0.6)',padding:'24px'}}>
          <div className="pp-footer-inner" style={{maxWidth:'800px',margin:'0 auto',display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'24px'}}>
            {[
              {icon:Phone,  text:'+52 913 100 4413'                },
              {icon:Mail,   text:'horaciocerino23@gmail.com'      },
              {icon:MapPin, text:'Francisco Javier Mina #25, Centla, Tabasco'},
            ].map(({icon:Icon,text})=>(
              <div key={text} style={{display:'flex',alignItems:'center',gap:'7px'}}>
                <Icon size={12} style={{color:'#C9A84C',flexShrink:0}}/>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.35)'}}>{text}</span>
              </div>
            ))}
          </div>
          <p style={{textAlign:'center',marginTop:'14px',fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.18)',letterSpacing:'0.5px'}}>
            Cédula Prof. 2762890 · Sistema de Gestión Jurídica
          </p>
        </div>

      </div>
    </>
  )
}