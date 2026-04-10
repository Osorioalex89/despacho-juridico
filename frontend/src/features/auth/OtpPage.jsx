import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation }    from 'react-router-dom'
import { useAuth }                     from '../../context/AuthContext'
import api                             from '../../services/axios.config'
import { ShieldAlert }                 from 'lucide-react'
import fondoImg                        from '../../assets/fondo-clinica.jpg'

// ── Logo SC (mismo del login) ─────────────────────────────────────
const LogoSC = ({ size = 68 }) => (
  <svg viewBox="0 0 72 72" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="otp-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8C97A"/><stop offset="100%" stopColor="#9A7A32"/>
      </linearGradient>
      <linearGradient id="otp-navy" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3a5f"/><stop offset="100%" stopColor="#0e1830"/>
      </linearGradient>
      <filter id="otp-glow">
        <feGaussianBlur stdDeviation="1.5" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>
    <rect width="72" height="72" rx="16" fill="url(#otp-navy)" stroke="rgba(201,168,76,0.4)" strokeWidth="1.2"/>
    <rect x="1" y="1" width="70" height="32" rx="15" fill="rgba(255,255,255,0.04)"/>
    <rect x="35.2" y="11" width="1.6" height="34" rx="0.8" fill="url(#otp-gold)" opacity="0.9"/>
    <circle cx="36" cy="11" r="2.8" fill="url(#otp-gold)" filter="url(#otp-glow)"/>
    <rect x="14" y="22" width="44" height="2" rx="1" fill="url(#otp-gold)" opacity="0.85"/>
    <line x1="19" y1="24" x2="16" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <line x1="19" y1="24" x2="22" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <ellipse cx="19" cy="34.2" rx="6" ry="2.2" fill="url(#otp-gold)" opacity="0.8"/>
    <line x1="53" y1="24" x2="50" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <line x1="53" y1="24" x2="56" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <ellipse cx="53" cy="34.2" rx="6" ry="2.2" fill="url(#otp-gold)" opacity="0.8"/>
    <rect x="29" y="45" width="14" height="1.8" rx="0.9" fill="url(#otp-gold)" opacity="0.65"/>
    <text x="36" y="58" textAnchor="middle"
      fontFamily="Georgia,'Times New Roman',serif"
      fontSize="11" fontWeight="700"
      fill="url(#otp-gold)" opacity="0.95" letterSpacing="2">SC</text>
    <rect x="28" y="61" width="16" height="1" rx="0.5" fill="url(#otp-gold)" opacity="0.35"/>
  </svg>
)

// ── Ícono candado animado ─────────────────────────────────────────
const LockIcon = () => (
  <div style={{
    width:'56px', height:'56px', borderRadius:'50%',
    background:'rgba(201,168,76,0.08)',
    border:'1px solid rgba(201,168,76,0.28)',
    display:'flex', alignItems:'center', justifyContent:'center',
    margin:'0 auto 20px',
    boxShadow:'0 0 24px rgba(201,168,76,0.15)',
  }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="11" width="18" height="11" rx="2"
        fill="none" stroke="#C9A84C" strokeWidth="1.8"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="16" r="1.5" fill="#C9A84C"/>
    </svg>
  </div>
)

export default function OtpPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()

  // Datos pasados desde LoginPage vía navigate state
  const { tempToken, maskedEmail } = location.state || {}

  const [digits,    setDigits]    = useState(['', '', '', '', '', ''])
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [resentOk,  setResentOk]  = useState(false)
  const [cooldown,  setCooldown]  = useState(0)          // segundos restantes
  const [activeTempToken, setActiveTempToken] = useState(tempToken)

  const inputRefs = useRef([])

  // Si llegaron sin tempToken, redirigir al login
  useEffect(() => {
    if (!tempToken) navigate('/login', { replace: true })
  }, [tempToken, navigate])

  // Auto-focus primer campo
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // ── Manejar input de cada dígito ──────────────────────────────
  const handleDigit = (idx, val) => {
    // Aceptar solo dígitos
    const digit = val.replace(/\D/g, '').slice(-1)
    const next  = [...digits]
    next[idx]   = digit
    setDigits(next)
    setError('')

    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus()
    }

    // Si llenaron el último dígito, submit automático
    if (digit && idx === 5) {
      const full = [...next.slice(0, 5), digit].join('')
      if (full.length === 6) submitOtp(full)
    }
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = ''; setDigits(next)
      } else if (idx > 0) {
        const next = [...digits]; next[idx - 1] = ''; setDigits(next)
        inputRefs.current[idx - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowRight' && idx < 5) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  // Pegar código completo
  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      setError('')
      inputRefs.current[5]?.focus()
      submitOtp(pasted)
    }
  }

  // ── Reenviar OTP ──────────────────────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setResending(true)
    setError('')
    setResentOk(false)
    try {
      const res = await api.post('/auth/resend-otp', { tempToken: activeTempToken })
      setActiveTempToken(res.data.tempToken)
      setDigits(['', '', '', '', '', ''])
      setResentOk(true)
      setCooldown(60)
      inputRefs.current[0]?.focus()
    } catch (err) {
      const expired = err.response?.data?.expired
      if (expired) {
        setError('La sesión expiró. Inicia sesión de nuevo.')
        setTimeout(() => navigate('/login', { replace: true }), 2800)
      } else {
        setError(err.response?.data?.message || 'No se pudo reenviar. Intenta de nuevo.')
      }
    } finally {
      setResending(false)
    }
  }

  // ── Submit OTP ────────────────────────────────────────────────
  const submitOtp = async (code) => {
    const otp = code ?? digits.join('')
    if (otp.length < 6) {
      setError('Ingresa los 6 dígitos del código.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/verify-otp', { tempToken: activeTempToken, otp })
      const { token, user } = res.data
      login(user, token)

      if (user.estado === 'pendiente') {
        navigate('/pendiente', { replace: true })
        return
      }
      const destinations = {
        abogado:    '/panel/dashboard',
        secretario: '/panel/dashboard',
        cliente:    '/cliente/mis-citas',
      }
      navigate(destinations[user.rol] ?? '/login', { replace: true })
    } catch (err) {
      const msg     = err.response?.data?.message
      const expired = err.response?.data?.expired

      setDigits(['', '', '', '', '', ''])

      if (expired) {
        // Código expirado o límite de intentos → redirigir al login
        setError(msg || 'Sesión expirada. Inicia sesión de nuevo.')
        setTimeout(() => navigate('/login', { replace: true }), 2800)
      } else {
        // Código incorrecto pero quedan intentos → quedarse en la página
        setError(msg || 'Código incorrecto. Verifica el correo.')
        inputRefs.current[0]?.focus()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submitOtp()
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes floatIn {
          from { opacity:0; transform:translateY(28px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes pulse-ring {
          0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.18); }
          50%      { box-shadow: 0 0 0 8px rgba(201,168,76,0); }
        }

        .otp-card { animation: floatIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both; }

        .otp-digit {
          width: 48px; height: 58px;
          border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.97);
          font-family: 'Playfair Display', serif;
          font-size: 26px; font-weight: 700;
          text-align: center;
          outline: none;
          caret-color: #C9A84C;
          transition: all 0.16s ease;
          -webkit-appearance: none;
        }
        .otp-digit:hover {
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.08);
        }
        .otp-digit:focus {
          border-color: rgba(201,168,76,0.7);
          background: rgba(201,168,76,0.06);
          box-shadow: 0 0 0 3px rgba(201,168,76,0.15);
          animation: pulse-ring 1.8s ease infinite;
        }
        .otp-digit.filled {
          border-color: rgba(201,168,76,0.45);
          background: rgba(201,168,76,0.07);
          color: #E8C97A;
        }
        .otp-digit.error-state {
          border-color: rgba(239,68,68,0.5);
          background: rgba(239,68,68,0.06);
          color: #FCA5A5;
        }

        .otp-submit-btn {
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
        .otp-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #E8C97A 0%, #C9A84C 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(201,168,76,0.4);
        }
        .otp-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .otp-back-btn {
          background: none; border: none;
          color: rgba(255,255,255,0.35);
          font-family: 'Inter', sans-serif; font-size: 13px;
          cursor: pointer; padding: 0;
          transition: color 0.16s ease;
          text-decoration: underline; text-underline-offset: 2px;
        }
        .otp-back-btn:hover { color: rgba(201,168,76,0.7); }

        /* Mobile */
        @media (max-width: 500px) {
          .otp-digit { width: 40px; height: 50px; font-size: 22px; border-radius: 10px; }
          .otp-digits-row { gap: 8px !important; }
        }
      `}</style>

      {/* ── Fondo ────────────────────────────────────────────── */}
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

        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse at 60% 40%, rgba(201,168,76,0.06) 0%, transparent 55%),
            linear-gradient(135deg, rgba(2,8,24,0.85) 0%, rgba(8,20,48,0.78) 50%, rgba(2,8,24,0.88) 100%)
          `,
          backdropFilter: 'blur(4px)',
          zIndex: 1,
        }}/>

        {/* Anillos decorativos */}
        {[380, 260, 160].map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: s, height: s, borderRadius: '50%',
            border: `1px solid rgba(201,168,76,${0.06 - i * 0.015})`,
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            pointerEvents: 'none', zIndex: 1,
          }}/>
        ))}

        {/* ── Card principal ────────────────────────────────── */}
        <div
          className="otp-card"
          style={{
            position: 'relative', zIndex: 10,
            width: '100%', maxWidth: '440px',
            margin: '24px',
            background: 'rgba(6,16,40,0.90)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(201,168,76,0.24)',
            borderRadius: '24px',
            boxShadow: '0 28px 90px rgba(0,0,0,0.72), 0 0 0 1px rgba(201,168,76,0.08)',
            padding: '44px 48px',
            overflow: 'hidden',
          }}
        >
          {/* Línea dorada top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent)',
          }}/>

          {/* ── Cabecera con firma ────────────────────────── */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-block', marginBottom: '16px' }}>
              <LogoSC size={66}/>
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display',Georgia,serif",
              fontSize: '21px', fontWeight: '700',
              color: 'rgba(255,255,255,0.97)',
              margin: '0 0 4px', lineHeight: 1.2,
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}>
              Lic. Horacio{' '}
              <span style={{ color: '#C9A84C' }}>Sánchez Cerino</span>
            </h1>
            <p style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: '10px', fontWeight: '700',
              color: 'rgba(201,168,76,0.6)',
              letterSpacing: '3px', textTransform: 'uppercase',
              margin: '0 0 12px',
            }}>
              Asesoría Jurídica Profesional
            </p>
            <div style={{
              width: '36px', height: '2px', margin: '0 auto',
              background: 'linear-gradient(90deg,transparent,#C9A84C,transparent)',
              borderRadius: '2px',
            }}/>
          </div>

          {/* ── Sección de verificación ───────────────────── */}
          <LockIcon/>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: '20px', fontWeight: '700',
              color: 'rgba(255,255,255,0.95)',
              margin: '0 0 8px',
            }}>
              Verificación de Identidad
            </h2>
            <p style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: '13px',
              color: 'rgba(255,255,255,0.38)',
              margin: 0, lineHeight: 1.6,
            }}>
              Ingresa el código de 6 dígitos enviado a
            </p>
            <p style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: '13px', fontWeight: '600',
              color: 'rgba(201,168,76,0.75)',
              margin: '4px 0 0',
            }}>
              {maskedEmail || 'tu correo registrado'}
            </p>
          </div>

          {/* ── Error ─────────────────────────────────────── */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px', padding: '11px 14px',
              marginBottom: '20px',
            }}>
              <ShieldAlert size={16} color="#FCA5A5" strokeWidth={1.8} style={{ flexShrink: 0, marginTop: '1px' }}/>
              <p style={{
                fontFamily: "'Inter',sans-serif", fontSize: '13px',
                color: '#FCA5A5', margin: 0, lineHeight: 1.5,
              }}>
                {error}
              </p>
            </div>
          )}

          {/* ── Inputs de 6 dígitos ───────────────────────── */}
          <form onSubmit={handleSubmit}>
            <div
              className="otp-digits-row"
              style={{
                display: 'flex', justifyContent: 'center',
                gap: '10px', marginBottom: '32px',
              }}
              onPaste={handlePaste}
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => (inputRefs.current[i] = el)}
                  className={`otp-digit${d ? ' filled' : ''}${error ? ' error-state' : ''}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  autoComplete="one-time-code"
                  disabled={loading}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || digits.join('').length < 6}
              className="otp-submit-btn"
            >
              {loading ? 'Verificando…' : 'Confirmar y Acceder'}
            </button>
          </form>

          {/* ── Divider ───────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            margin: '20px 0',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }}/>
            <span style={{
              fontFamily: "'Inter',sans-serif", fontSize: '11px',
              color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap',
            }}>
              ¿No recibiste el código?
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }}/>
          </div>

          {/* Reenviar */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            {resentOk && (
              <p style={{
                fontFamily: "'Inter',sans-serif", fontSize: '12px',
                color: 'rgba(34,197,94,0.75)', margin: '0 0 8px',
              }}>
                ✓ Código reenviado. Revisa tu correo.
              </p>
            )}
            <button
              className="otp-back-btn"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              style={{
                opacity: (cooldown > 0 || resending) ? 0.45 : 1,
                cursor: (cooldown > 0 || resending) ? 'not-allowed' : 'pointer',
              }}
            >
              {resending
                ? 'Enviando…'
                : cooldown > 0
                  ? `Reenviar código (${cooldown}s)`
                  : 'Reenviar código'}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <button
              className="otp-back-btn"
              onClick={() => navigate('/login')}
            >
              Volver al inicio de sesión
            </button>
          </div>

          {/* Footer */}
          <p style={{
            textAlign: 'center', marginTop: '16px',
            fontFamily: "'Inter',sans-serif", fontSize: '10px',
            color: 'rgba(255,255,255,0.18)',
            letterSpacing: '0.5px',
          }}>
            Cédula Prof. 2762890 · Sistema de Gestión Jurídica
          </p>
        </div>

      </div>
    </>
  )
}
