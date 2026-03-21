import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Scale, Clock, Phone, Mail, MapPin, LogOut } from 'lucide-react'

const SERVICIOS = [
  {
    icon: '⚖️',
    titulo: 'Asuntos Penales',
    desc: 'Defensa y representación en procesos penales, delitos del fuero común y federal.',
  },
  {
    icon: '📋',
    titulo: 'Asuntos Civiles',
    desc: 'Contratos, demandas civiles, daños y perjuicios, obligaciones.',
  },
  {
    icon: '🏛️',
    titulo: 'Amparos',
    desc: 'Amparo directo e indirecto contra actos de autoridad que vulneren derechos.',
  },
  {
    icon: '📜',
    titulo: 'Sucesorios',
    desc: 'Testamentos, herencias, adjudicación de bienes y trámites sucesorios.',
  },
  {
    icon: '🤝',
    titulo: 'Contratos',
    desc: 'Elaboración, revisión y asesoría en contratos civiles y mercantiles.',
  },
  {
    icon: '🏠',
    titulo: 'Trámites de Escrituras',
    desc: 'Escrituración de inmuebles, regularización de propiedades y trámites notariales.',
  },
  {
    icon: '📌',
    titulo: 'Inscripción de Posesión',
    desc: 'Registro y trámites de posesión de terrenos y propiedades ejidales.',
  },
  {
    icon: '💼',
    titulo: 'Asesoría Legal',
    desc: 'Consultas y orientación jurídica en todas las ramas del derecho.',
  },
]

export default function PendientePage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0a1628 0%, #1e3a5f 50%, #0a1628 100%)',
        fontFamily: "'Inter', sans-serif",
      }}>

        {/* Navbar */}
        <nav style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '0 32px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          backdropFilter: 'blur(10px)',
          background: 'rgba(10,22,40,0.6)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, #e8d48a, #d4b86a)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Scale size={18} color="#1e3a5f" strokeWidth={2.5}/>
            </div>
            <div>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '14px', fontWeight: '700',
                color: '#ffffff', margin: 0, lineHeight: 1.2,
              }}>
                Lic. Horacio Sánchez Cerino
              </p>
              <p style={{ fontSize: '10px', color: '#7a9abf', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Asesoría Jurídica Profesional
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Hola, <span style={{ color: '#ffffff', fontWeight: '500' }}>{user?.nombre}</span>
            </p>
            <button onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px', color: 'rgba(255,255,255,0.6)',
                fontSize: '13px', cursor: 'pointer',
              }}>
              <LogOut size={13}/> Salir
            </button>
          </div>
        </nav>

        {/* Hero — estado de espera */}
        <div style={{
          maxWidth: '700px', margin: '0 auto',
          padding: '60px 24px 40px',
          textAlign: 'center',
        }}>
          {/* Icono animado */}
          <div style={{
            width: '72px', height: '72px',
            background: 'rgba(232,212,138,0.12)',
            border: '1.5px solid rgba(232,212,138,0.3)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Clock size={32} color="#e8d48a" strokeWidth={1.5}/>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '32px', fontWeight: '700',
            color: '#ffffff', margin: '0 0 14px',
            lineHeight: 1.3,
          }}>
            Solicitud en revisión
          </h1>
          <p style={{
            fontSize: '15px', color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.7, margin: '0 0 28px',
          }}>
            Tu cuenta está pendiente de aprobación. El despacho revisará tu solicitud y te dará acceso en breve. Mientras tanto, conoce los servicios que ofrecemos.
          </p>

          {/* Status pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(232,212,138,0.1)',
            border: '1px solid rgba(232,212,138,0.25)',
            borderRadius: '20px', padding: '8px 20px',
            marginBottom: '50px',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#e8d48a',
              boxShadow: '0 0 8px #e8d48a',
            }}/>
            <span style={{ fontSize: '13px', color: '#e8d48a', fontWeight: '500' }}>
              Cuenta pendiente de aprobación
            </span>
          </div>
        </div>

        {/* Servicios */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <p style={{
              fontSize: '11px', fontWeight: '600',
              color: '#e8d48a', letterSpacing: '2px',
              textTransform: 'uppercase', marginBottom: '10px',
            }}>
              Nuestros servicios
            </p>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '26px', fontWeight: '700',
              color: '#ffffff', margin: 0,
            }}>
              ¿En qué podemos ayudarte?
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}>
            {SERVICIOS.map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '24px',
                transition: 'all 0.2s',
                cursor: 'default',
              }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(232,212,138,0.06)'
                  e.currentTarget.style.borderColor = 'rgba(232,212,138,0.2)'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{s.icon}</div>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '15px', fontWeight: '600',
                  color: '#ffffff', margin: '0 0 8px',
                }}>
                  {s.titulo}
                </h3>
                <p style={{
                  fontSize: '13px', color: 'rgba(255,255,255,0.45)',
                  lineHeight: 1.6, margin: 0,
                }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contacto */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '36px 24px',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <div style={{
            maxWidth: '700px', margin: '0 auto',
            display: 'flex', flexWrap: 'wrap',
            justifyContent: 'center', gap: '28px',
          }}>
            {[
              { icon: Phone,  text: '913-100-44-13'               },
              { icon: Mail,   text: 'horaciocerino23@gmail.com'   },
              { icon: MapPin, text: 'Francisco Javier Mina #25, Centla, Tabasco' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Icon size={14} color="#e8d48a"/>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
          <p style={{
            textAlign: 'center', marginTop: '20px',
            fontSize: '11px', color: 'rgba(255,255,255,0.2)',
          }}>
            Cédula Prof. 2762890 · Sistema de Gestión Jurídica
          </p>
        </div>

      </div>
    </>
  )
}