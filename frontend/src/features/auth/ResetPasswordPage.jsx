import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/axios.config'

const LogoSC = ({ size = 64 }) => (
  <svg viewBox="0 0 72 72" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rp-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8C97A"/>
        <stop offset="100%" stopColor="#9A7A32"/>
      </linearGradient>
      <linearGradient id="rp-navy" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3a5f"/>
        <stop offset="100%" stopColor="#0e1830"/>
      </linearGradient>
    </defs>
    <rect width="72" height="72" rx="16" fill="url(#rp-navy)" stroke="rgba(201,168,76,0.4)" strokeWidth="1.2"/>
    <rect x="1" y="1" width="70" height="32" rx="15" fill="rgba(255,255,255,0.04)"/>
    <rect x="35.2" y="11" width="1.6" height="34" rx="0.8" fill="url(#rp-gold)" opacity="0.9"/>
    <circle cx="36" cy="11" r="2.8" fill="url(#rp-gold)"/>
    <rect x="14" y="22" width="44" height="2" rx="1" fill="url(#rp-gold)" opacity="0.85"/>
    <line x1="19" y1="24" x2="16" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <line x1="19" y1="24" x2="22" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <ellipse cx="19" cy="34.2" rx="6" ry="2.2" fill="url(#rp-gold)" opacity="0.8"/>
    <line x1="53" y1="24" x2="50" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <line x1="53" y1="24" x2="56" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <ellipse cx="53" cy="34.2" rx="6" ry="2.2" fill="url(#rp-gold)" opacity="0.8"/>
    <rect x="29" y="45" width="14" height="1.8" rx="0.9" fill="url(#rp-gold)" opacity="0.65"/>
    <text x="36" y="58" textAnchor="middle"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="11" fontWeight="700"
      fill="url(#rp-gold)" opacity="0.95" letterSpacing="2">SC</text>
    <rect x="28" y="61" width="16" height="1" rx="0.5" fill="url(#rp-gold)" opacity="0.35"/>
  </svg>
)

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [contrasena,  setContrasena]  = useState('')
  const [confirmar,   setConfirmar]   = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [exito,       setExito]       = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (contrasena.length < 8) {
      return setError('La contrasena debe tener al menos 8 caracteres.')
    }
    if (contrasena !== confirmar) {
      return setError('Las contrasenas no coinciden.')
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, contrasena })
      setExito(true)
    } catch (err) {
      const data = err.response?.data
      if (!err.response) {
        setError('No se pudo conectar con el servidor. Intenta mas tarde.')
      } else if (data?.expired) {
        setError('El enlace ha expirado. Solicita un nuevo restablecimiento desde la pagina de inicio de sesion.')
      } else {
        setError(data?.message ?? 'Error al restablecer la contrasena.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px rgba(8,20,48,0.9) inset !important;
          -webkit-text-fill-color: rgba(255,255,255,0.92) !important;
          caret-color: #ffffff;
          transition: background-color 5000s ease-in-out 0s;
        }
        @keyframes floatIn {
          from { opacity:0; transform:translateY(32px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .rp-card { animation: floatIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both; }
        .rp-input {
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
        .rp-input::placeholder { color: rgba(255,255,255,0.2); }
        .rp-input:hover  { border-color:rgba(255,255,255,0.22); background:rgba(255,255,255,0.08); }
        .rp-input:focus  { border-color:rgba(201,168,76,0.55); background:rgba(201,168,76,0.05); box-shadow:0 0 0 3px rgba(201,168,76,0.12); }
        .rp-btn {
          width: 100%; padding: 14px;
          border-radius: 10px; border: none;
          background: linear-gradient(135deg, #C9A84C 0%, #9A7A32 100%);
          color: #020818;
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 0.18s ease;
          box-shadow: 0 4px 20px rgba(201,168,76,0.3);
          letter-spacing: 0.02em;
        }
        .rp-btn:hover:not(:disabled) { background:linear-gradient(135deg,#E8C97A 0%,#C9A84C 100%); transform:translateY(-2px); box-shadow:0 8px 28px rgba(201,168,76,0.4); }
        .rp-btn:active:not(:disabled) { transform:translateY(0); }
        .rp-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .rp-back-btn {
          width: 100%; padding: 13px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.65);
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.18s ease; margin-top: 10px;
        }
        .rp-back-btn:hover { background:rgba(255,255,255,0.08); border-color:rgba(201,168,76,0.25); color:rgba(255,255,255,0.9); }
      `}</style>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: 'url(/src/assets/fondo-clinica.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.08) 0%, transparent 50%),
            linear-gradient(135deg, rgba(2,8,24,0.82) 0%, rgba(8,20,48,0.75) 50%, rgba(2,8,24,0.85) 100%)
          `,
          backdropFilter: 'blur(4px)',
          zIndex: 1,
        }}/>

        {[400, 280, 180].map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: s, height: s, borderRadius: '50%',
            border: `1px solid rgba(201,168,76,${0.06 - i * 0.015})`,
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            pointerEvents: 'none', zIndex: 1,
          }}/>
        ))}

        <div
          className="rp-card"
          style={{
            position: 'relative', zIndex: 10,
            width: '100%', maxWidth: '460px',
            margin: '24px',
            background: 'rgba(6,16,40,0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(201,168,76,0.22)',
            borderRadius: '24px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08)',
            padding: '44px 48px',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)',
          }}/>

          <div style={{ textAlign: 'center', marginBottom: '36px' }} translate="no">
            <div style={{ display: 'inline-block', marginBottom: '16px' }}>
              <LogoSC size={68}/>
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display',Georgia,serif",
              fontSize: '22px', fontWeight: '700',
              color: 'rgba(255,255,255,0.97)',
              margin: '0 0 5px', textShadow: '0 2px 8px rgba(0,0,0,0.4)', lineHeight: 1.2,
            }}>
              Lic. Horacio{' '}
              <span style={{ color: '#C9A84C' }}>Sanchez Cerino</span>
            </h1>
            <p style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: '10px', fontWeight: '700',
              color: 'rgba(201,168,76,0.6)',
              letterSpacing: '3px', textTransform: 'uppercase',
              margin: '0 0 14px',
            }}>
              Asesoria Juridica Profesional
            </p>
            <div style={{
              width: '40px', height: '2px', margin: '0 auto',
              background: 'linear-gradient(90deg,transparent,#C9A84C,transparent)',
              borderRadius: '2px',
            }}/>
          </div>

          {!token ? (
            <div>
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '14px', padding: '24px',
                textAlign: 'center', marginBottom: '24px',
              }} translate="no">
                <p style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: '16px', fontWeight: '700',
                  color: 'rgba(255,255,255,0.9)', margin: '0 0 8px',
                }}>Enlace invalido</p>
                <p style={{
                  fontFamily: "'Inter',sans-serif", fontSize: '13px',
                  color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6,
                }}>
                  Este enlace no es valido. Solicita un nuevo restablecimiento de contrasena.
                </p>
              </div>
              <button className="rp-back-btn" onClick={() => navigate('/olvide-contrasena')} translate="no">
                Solicitar restablecimiento
              </button>
            </div>
          ) : exito ? (
            <div>
              <div style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: '14px', padding: '28px 24px',
                textAlign: 'center', marginBottom: '24px',
              }} translate="no">
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%', margin: '0 auto 16px',
                  background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '22px' }}>&#10003;</span>
                </div>
                <p style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: '17px', fontWeight: '700',
                  color: 'rgba(255,255,255,0.95)', margin: '0 0 8px',
                }}>
                  Contrasena actualizada
                </p>
                <p style={{
                  fontFamily: "'Inter',sans-serif", fontSize: '13px',
                  color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6,
                }}>
                  Tu contrasena ha sido establecida correctamente. Ya puedes iniciar sesion.
                </p>
              </div>
              <button className="rp-btn" onClick={() => navigate('/login')} translate="no">
                Iniciar sesion
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '24px' }} translate="no">
                <p style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: '20px', fontWeight: '700',
                  color: 'rgba(255,255,255,0.95)', margin: '0 0 5px',
                }}>
                  Nueva contrasena
                </p>
                <p style={{
                  fontFamily: "'Inter',sans-serif", fontSize: '13px',
                  color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.6,
                }}>
                  Elige una contrasena segura de al menos 8 caracteres.
                </p>
              </div>

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '10px', padding: '12px 14px',
                  marginBottom: '20px',
                }} translate="no">
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>&#9888;</span>
                  <p style={{
                    fontFamily: "'Inter',sans-serif", fontSize: '13px',
                    color: '#FCA5A5', margin: 0, lineHeight: 1.5,
                  }}>
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{
                    display: 'block',
                    fontFamily: "'Inter',sans-serif",
                    fontSize: '11px', fontWeight: '700',
                    letterSpacing: '1.8px', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '7px',
                  }} translate="no">
                    Nueva contrasena
                  </label>
                  <input
                    className="rp-input"
                    type="password"
                    value={contrasena}
                    onChange={e => setContrasena(e.target.value)}
                    placeholder="Minimo 8 caracteres"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <label style={{
                    display: 'block',
                    fontFamily: "'Inter',sans-serif",
                    fontSize: '11px', fontWeight: '700',
                    letterSpacing: '1.8px', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '7px',
                  }} translate="no">
                    Confirmar contrasena
                  </label>
                  <input
                    className="rp-input"
                    type="password"
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    placeholder="Repite la contrasena"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="rp-btn"
                  translate="no"
                >
                  {loading ? 'Guardando...' : 'Establecer nueva contrasena'}
                </button>
              </form>

              <button
                className="rp-back-btn"
                onClick={() => navigate('/login')}
                translate="no"
              >
                Volver al inicio de sesion
              </button>
            </>
          )}

          <p style={{
            textAlign: 'center', marginTop: '24px',
            fontFamily: "'Inter',sans-serif", fontSize: '10px',
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.5px',
          }} translate="no">
            Cedula Prof. 2762890 · Sistema de Gestion Juridica
          </p>
        </div>
      </div>
    </>
  )
}
