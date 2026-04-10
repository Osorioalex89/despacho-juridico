import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/axios.config'
import fondoImg from '../../assets/fondo-clinica.jpg'

// ── Logo SVG premium — Monograma SC + Balanza ─────────────────────
// Archetype: Sovereign / Law firm
// Concepto: Balanza de precisión con monograma SC integrado en la base
const LogoSC = ({ size = 72 }) => (
  <svg viewBox="0 0 72 72" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lg-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8C97A"/>
        <stop offset="100%" stopColor="#9A7A32"/>
      </linearGradient>
      <linearGradient id="lg-navy" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3a5f"/>
        <stop offset="100%" stopColor="#0e1830"/>
      </linearGradient>
      <filter id="lg-glow">
        <feGaussianBlur stdDeviation="1.5" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>

    {/* Fondo cuadrado redondeado */}
    <rect width="72" height="72" rx="16"
      fill="url(#lg-navy)"
      stroke="rgba(201,168,76,0.4)" strokeWidth="1.2"/>

    {/* Brillo sutil top */}
    <rect x="1" y="1" width="70" height="32" rx="15"
      fill="rgba(255,255,255,0.04)"/>

    {/* Poste central */}
    <rect x="35.2" y="11" width="1.6" height="34" rx="0.8"
      fill="url(#lg-gold)" opacity="0.9"/>

    {/* Pivote superior */}
    <circle cx="36" cy="11" r="2.8"
      fill="url(#lg-gold)" filter="url(#lg-glow)"/>

    {/* Eje horizontal */}
    <rect x="14" y="22" width="44" height="2" rx="1"
      fill="url(#lg-gold)" opacity="0.85"/>

    {/* Cadenas y platillos izquierda */}
    <line x1="19" y1="24" x2="16" y2="33"
      stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <line x1="19" y1="24" x2="22" y2="33"
      stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <ellipse cx="19" cy="34.2" rx="6" ry="2.2"
      fill="url(#lg-gold)" opacity="0.8"/>

    {/* Cadenas y platillos derecha */}
    <line x1="53" y1="24" x2="50" y2="33"
      stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <line x1="53" y1="24" x2="56" y2="33"
      stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <ellipse cx="53" cy="34.2" rx="6" ry="2.2"
      fill="url(#lg-gold)" opacity="0.8"/>

    {/* Base del poste */}
    <rect x="29" y="45" width="14" height="1.8" rx="0.9"
      fill="url(#lg-gold)" opacity="0.65"/>

    {/* Monograma SC — serif preciso */}
    <text x="36" y="58"
      textAnchor="middle"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="11" fontWeight="700"
      fill="url(#lg-gold)" opacity="0.95"
      letterSpacing="2">
      SC
    </text>

    {/* Línea decorativa bajo SC */}
    <rect x="28" y="61" width="16" height="1" rx="0.5"
      fill="url(#lg-gold)" opacity="0.35"/>
  </svg>
)

export default function LoginPage() {
  const navigate    = useNavigate()

  const [correo,     setCorreo]     = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  // ── Paso 1: valida credenciales → redirige a OTP ─────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { correo, contrasena })
      const { requiresOtp, tempToken, maskedEmail } = res.data

      if (requiresOtp) {
        navigate('/verificar-otp', { state: { tempToken, maskedEmail } })
        return
      }
    } catch (err) {
      const msg  = err.response?.data?.message
      const code = err.response?.data?.code

      if (code === 'EMAIL_NOT_VERIFIED') {
        setError('Debes verificar tu correo antes de ingresar. Revisa tu bandeja de entrada.')
      } else if (msg === 'Credenciales incorrectas') {
        setError('El correo o la contraseña son incorrectos. Verifica tus datos.')
      } else if (err.response?.status === 403) {
        setError('Tu cuenta está desactivada. Contacta al despacho.')
      } else if (!err.response) {
        setError('No se pudo conectar con el servidor. Intenta más tarde.')
      } else {
        setError(msg ?? 'Error al iniciar sesión.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        /* Autocomplete override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px rgba(8,20,48,0.9) inset !important;
          -webkit-text-fill-color: rgba(255,255,255,0.92) !important;
          caret-color: #ffffff;
          border-color: rgba(255,255,255,0.15) !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes floatIn {
          from { opacity:0; transform:translateY(32px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }

        .login-card  { animation: floatIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both; }
        .login-left  { animation: fadeUp  0.5s ease 0.1s both; }

        .lg-input {
          width: 100%; padding: 13px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.92);
          font-family: 'Inter', sans-serif; font-size: 14px;
          outline: none; box-sizing: border-box;
          transition: all 0.18s ease;
          colorScheme: dark;
        }
        .lg-input::placeholder { color: rgba(255,255,255,0.2); }
        .lg-input:hover {
          border-color: rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.08);
        }
        .lg-input:focus {
          border-color: rgba(201,168,76,0.55);
          background: rgba(201,168,76,0.05);
          box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
        }

        .lg-btn {
          width: 100%; padding: 14px;
          border-radius: 10px; border: none;
          background: linear-gradient(135deg, #C9A84C 0%, #9A7A32 100%);
          color: #020818;
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 4px 20px rgba(201,168,76,0.3);
          letter-spacing: 0.02em;
        }
        .lg-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #E8C97A 0%, #C9A84C 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(201,168,76,0.4);
        }
        .lg-btn:active:not(:disabled) { transform: translateY(0); }
        .lg-btn:disabled { opacity:0.5; cursor:not-allowed; }

        .lg-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 13px 0;
        }
        .lg-divider::before,
        .lg-divider::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(255,255,255,0.08);
        }

        .lg-register-btn {
          width: 100%; padding: 13px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.65);
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.18s ease;
          text-decoration: none; display: block; text-align: center;
        }
        .lg-register-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(201,168,76,0.25);
          color: rgba(255,255,255,0.9);
        }
      `}</style>

      {/* ── Root: fondo de imagen + overlay ─────────────────── */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `url(${fondoImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>

        {/* Overlay multicapa */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.08) 0%, transparent 50%),
            linear-gradient(135deg, rgba(2,8,24,0.82) 0%, rgba(8,20,48,0.75) 50%, rgba(2,8,24,0.85) 100%)
          `,
          backdropFilter: 'blur(4px)',
          zIndex: 1,
        }}/>

        {/* Anillos decorativos */}
        {[400,280,180].map((s,i)=>(
          <div key={i} style={{
            position:'absolute',
            width:s, height:s, borderRadius:'50%',
            border:`1px solid rgba(201,168,76,${0.06-i*0.015})`,
            top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            pointerEvents:'none', zIndex:1,
          }}/>
        ))}

        {/* ── Card principal ───────────────────────────────── */}
        <div
          className="login-card"
          style={{
            position: 'relative', zIndex: 10,
            width: '100%', maxWidth: '460px',
            margin: '24px',
            // Glassmorphism Level 3
            background: 'rgba(6,16,40,0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(201,168,76,0.22)',
            borderRadius: '24px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08)',
            padding: '28px 40px',
            overflow: 'hidden',
          }}
        >
          {/* Brillo interior top */}
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:'1px',
            background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)',
          }}/>

          {/* ── Logo + Nombre ─────────────────────────────── */}
          <div style={{ textAlign:'center', marginBottom:'20px' }}>
            <div style={{ display:'inline-block', marginBottom:'10px' }}>
              <LogoSC size={60}/>
            </div>
            <h1 style={{
              fontFamily:"'Playfair Display',Georgia,serif",
              fontSize:'22px', fontWeight:'700',
              color:'rgba(255,255,255,0.97)',
              margin:'0 0 5px',
              textShadow:'0 2px 8px rgba(0,0,0,0.4)',
              lineHeight:1.2,
            }}>
              Lic. Horacio{' '}
              <span style={{ color:'#C9A84C' }}>Sánchez Cerino</span>
            </h1>
            <p style={{
              fontFamily:"'Inter',sans-serif",
              fontSize:'10px', fontWeight:'700',
              color:'rgba(201,168,76,0.6)',
              letterSpacing:'3px', textTransform:'uppercase',
              margin:'0 0 8px',
            }}>
              Asesoría Jurídica Profesional
            </p>
            {/* Divider gold */}
            <div style={{
              width:'40px', height:'2px', margin:'0 auto',
              background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',
              borderRadius:'2px',
            }}/>
          </div>

          {/* ── Eyebrow ───────────────────────────────────── */}
          <div style={{ marginBottom:'14px' }}>
            <p style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:'20px', fontWeight:'700',
              color:'rgba(255,255,255,0.95)', margin:'0 0 3px',
              textShadow:'0 1px 4px rgba(0,0,0,0.3)',
            }}>
              Iniciar sesión
            </p>
            <p style={{
              fontFamily:"'Inter',sans-serif", fontSize:'13px',
              color:'rgba(255,255,255,0.38)', margin:0,
            }}>
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* ── Error ─────────────────────────────────────── */}
          {error && (
            <div style={{
              display:'flex', alignItems:'flex-start', gap:'10px',
              background:'rgba(239,68,68,0.1)',
              border:'1px solid rgba(239,68,68,0.25)',
              borderRadius:'10px', padding:'12px 14px',
              marginBottom:'20px',
            }}>
              <span style={{ fontSize:'14px', flexShrink:0 }}>⚠</span>
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'13px',
                color:'#FCA5A5', margin:0, lineHeight:1.5,
              }}>
                {error}
              </p>
            </div>
          )}

          {/* ── Formulario ────────────────────────────────── */}
          <form onSubmit={handleSubmit}>
            {/* Correo */}
            <div style={{ marginBottom:'10px' }}>
              <label style={{
                display:'block',
                fontFamily:"'Inter',sans-serif",
                fontSize:'11px', fontWeight:'700',
                letterSpacing:'1.8px', textTransform:'uppercase',
                color:'rgba(255,255,255,0.5)',
                marginBottom:'4px',
              }}>
                Correo electrónico
              </label>
              <input
                className="lg-input"
                type="email"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom:'10px' }}>
              <label style={{
                display:'block',
                fontFamily:"'Inter',sans-serif",
                fontSize:'11px', fontWeight:'700',
                letterSpacing:'1.8px', textTransform:'uppercase',
                color:'rgba(255,255,255,0.5)',
                marginBottom:'4px',
              }}>
                Contraseña
              </label>
              <input
                className="lg-input"
                type="password"
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {/* Link olvide contraseña */}
            <div style={{ textAlign:'right', marginBottom:'14px' }}>
              <a
                href="/olvide-contrasena"
                translate="no"
                style={{
                  fontFamily:"'Inter',sans-serif",
                  fontSize:'12px',
                  color:'rgba(201,168,76,0.75)',
                  textDecoration:'none',
                  transition:'color 0.15s ease',
                }}
                onMouseEnter={e => e.target.style.color='#E8C97A'}
                onMouseLeave={e => e.target.style.color='rgba(201,168,76,0.75)'}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="lg-btn"
            >
              {loading ? 'Verificando…' : 'Entrar al Sistema'}
            </button>
          </form>

          {/* ── Divider + Registro ────────────────────────── */}
          <div className="lg-divider">
            <span style={{
              fontFamily:"'Inter',sans-serif", fontSize:'11px',
              color:'rgba(255,255,255,0.3)', whiteSpace:'nowrap',
            }}>
              ¿No tienes cuenta?
            </span>
          </div>

          <a href="/registro" className="lg-register-btn">
            Crear cuenta nueva
          </a>

          {/* ── Contacto ──────────────────────────────────── */}
          <div style={{
            marginTop:'16px', padding:'11px 14px',
            background:'rgba(255,255,255,0.03)',
            border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:'10px',
            display:'flex', alignItems:'center', gap:'16px',
          }}>
            <div style={{
              width:'32px', height:'32px', borderRadius:'8px', flexShrink:0,
              background:'rgba(201,168,76,0.1)',
              border:'1px solid rgba(201,168,76,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <span style={{ fontSize:'14px' }}>📞</span>
            </div>
            <div>
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:'600',
                color:'rgba(255,255,255,0.6)', margin:'0 0 2px',
              }}>
                913-100-44-13
              </p>
              <p style={{
                fontFamily:"'Inter',sans-serif", fontSize:'11px',
                color:'rgba(255,255,255,0.3)', margin:0,
              }}>
                Francisco Javier Mina #25, Centla, Tabasco
              </p>
            </div>
          </div>

          {/* Footer dentro de card */}
          <p style={{
            textAlign:'center', marginTop:'12px',
            fontFamily:"'Inter',sans-serif", fontSize:'10px',
            color:'rgba(255,255,255,0.2)',
            letterSpacing:'0.5px',
          }}>
            Cédula Prof. 2762890 · Sistema de Gestión Jurídica
          </p>
        </div>
      </div>
    </>
  )
}