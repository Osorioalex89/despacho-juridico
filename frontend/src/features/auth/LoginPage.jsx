import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/axios.config'
import { Scale } from 'lucide-react'

export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [correo,     setCorreo]     = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { correo, contrasena })
      const { token, user } = res.data
      login(user, token)
      if (user.estado === 'pendiente') { navigate('/pendiente'); return }
      const destinations = {
        abogado:    '/panel/dashboard',
        secretario: '/panel/dashboard',
        cliente:    '/cliente/mis-citas',
      }
      navigate(destinations[user.rol] ?? '/login')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Fuente profesional desde Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>

      <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 45%, #2d5282 100%)' }}>

        {/* Círculos decorativos de fondo */}
        <div style={{
          position: 'absolute', top: '-100px', left: '-100px',
          width: '500px', height: '500px', borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.05)',
        }}/>
        <div style={{
          position: 'absolute', top: '-50px', left: '-50px',
          width: '350px', height: '350px', borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.05)',
        }}/>
        <div style={{
          position: 'absolute', bottom: '-120px', right: '-120px',
          width: '600px', height: '600px', borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.05)',
        }}/>
        <div style={{
          position: 'absolute', bottom: '-60px', right: '-60px',
          width: '400px', height: '400px', borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.05)',
        }}/>

        {/* Balanza SVG decorativa de fondo */}
        <div style={{
          position: 'absolute', right: '8%', top: '50%',
          transform: 'translateY(-50%)', opacity: 0.04,
        }}>
          <svg viewBox="0 0 300 300" width="500" height="500" fill="none">
            <line x1="150" y1="30" x2="150" y2="240" stroke="white" strokeWidth="4"/>
            <line x1="60"  y1="90" x2="240" y2="90" stroke="white" strokeWidth="4"/>
            <line x1="60"  y1="90" x2="30"  y2="150" stroke="white" strokeWidth="3"/>
            <line x1="240" y1="90" x2="270" y2="150" stroke="white" strokeWidth="3"/>
            <ellipse cx="30"  cy="158" rx="30" ry="12" stroke="white" strokeWidth="3"/>
            <ellipse cx="270" cy="158" rx="30" ry="12" stroke="white" strokeWidth="3"/>
            <circle cx="150" cy="30" r="8" fill="white"/>
            <line x1="100" y1="240" x2="200" y2="240" stroke="white" strokeWidth="4"/>
            <line x1="150" y1="240" x2="150" y2="265" stroke="white" strokeWidth="4"/>
            <line x1="110" y1="265" x2="190" y2="265" stroke="white" strokeWidth="6"/>
          </svg>
        </div>

        {/* Card principal */}
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '48px 52px',
          width: '100%',
          maxWidth: '480px',
          margin: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          position: 'relative',
          zIndex: 10,
        }}>

          {/* Logo y nombre */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '64px', height: '64px',
              background: 'linear-gradient(135deg, #1e3a5f, #2d5282)',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 20px rgba(30,58,95,0.3)',
            }}>
              <Scale size={28} color="#e8d48a" strokeWidth={2.5}/>
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '26px',
              fontWeight: '700',
              color: '#0d1f3c',
              margin: '0 0 4px',
              letterSpacing: '-0.3px',
            }}>
              Lic. Horacio Sánchez Cerino
            </h1>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              color: '#64748b',
              margin: '0 0 6px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              Asesoría Jurídica Profesional
            </p>
            <div style={{
              width: '48px', height: '2px',
              background: '#e8d48a',
              margin: '12px auto 0',
              borderRadius: '2px',
            }}/>
          </div>

          {/* Título formulario */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 6px',
            }}>
              Iniciar sesión
            </h2>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: '#94a3b8',
              margin: 0,
            }}>
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', fontSize: '14px',
              borderRadius: '10px', padding: '12px 16px',
              marginBottom: '20px', fontFamily: "'Inter', sans-serif",
            }}>
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', fontSize: '14px', fontWeight: '500',
                color: '#374151', marginBottom: '8px',
                fontFamily: "'Inter', sans-serif",
              }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                style={{
                  width: '100%', padding: '14px 16px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px', fontSize: '15px',
                  fontFamily: "'Inter', sans-serif",
                  color: '#1e293b', background: '#f8fafc',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#1e3a5f'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block', fontSize: '14px', fontWeight: '500',
                color: '#374151', marginBottom: '8px',
                fontFamily: "'Inter', sans-serif",
              }}>
                Contraseña
              </label>
              <input
                type="password"
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '14px 16px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px', fontSize: '15px',
                  fontFamily: "'Inter', sans-serif",
                  color: '#1e293b', background: '#f8fafc',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#1e3a5f'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '15px',
                background: loading
                  ? '#7a9abf'
                  : 'linear-gradient(135deg, #1e3a5f, #2d5282)',
                color: 'white', border: 'none',
                borderRadius: '12px', fontSize: '16px',
                fontWeight: '600', fontFamily: "'Inter', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(30,58,95,0.35)',
                letterSpacing: '0.3px',
              }}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Crear cuenta */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <p style={{
              fontSize: '14px', color: '#94a3b8',
              fontFamily: "'Inter', sans-serif",
            }}>
              ¿No tienes cuenta?{' '}
              <a href="/registro" style={{
                color: '#1e3a5f', fontWeight: '600',
                textDecoration: 'none',
              }}>
                Regístrate aquí
              </a>
            </p>
          </div>

          {/* Contacto */}
          <div style={{
            marginTop: '28px', padding: '16px',
            background: '#f8fafc', borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}>
            <p style={{
              fontSize: '11px', fontWeight: '600',
              color: '#64748b', marginBottom: '8px',
              textTransform: 'uppercase', letterSpacing: '0.8px',
              fontFamily: "'Inter', sans-serif",
            }}>
              Contacto
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { icon: '📞', text: '913-100-44-13' },
                { icon: '✉️', text: 'horaciocerino23@gmail.com' },
                { icon: '📍', text: 'Francisco Javier Mina #25, Centla, Tab.' },
              ].map(({ icon, text }) => (
                <p key={text} style={{
                  fontSize: '12px', color: '#64748b', margin: 0,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {icon} {text}
                </p>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute', bottom: '20px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px', color: 'rgba(255,255,255,0.3)',
          textAlign: 'center', zIndex: 10,
        }}>
          Cédula Prof. 2762890 · Sistema de Gestión Jurídica
        </div>

      </div>
    </>
  )
}