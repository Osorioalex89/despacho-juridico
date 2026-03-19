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
     style={{
       backgroundImage: 'url(/src/assets/fondo-clinica.jpg)',
       backgroundSize: 'cover',
       backgroundPosition: 'center',
     }}>

  {/* Overlay mejorado: Menos opaco y con desenfoque */}
  <div style={{
    position: 'absolute', 
    inset: 0,
   
    background: 'linear-gradient(135deg, rgba(10,22,40,0.7) 0%, rgba(30,58,95,0.5) 100%)',
    backdropFilter: 'blur(3px)', 
    zIndex: 1,
  }}/>

       
        {/* Card principal con efecto Cristal */}
        <div style={{
         
          background: 'rgba(0, 0, 0, 0.45)', 
          
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
         
          border: '1px solid rgba(255, 255, 255, 0.1)',
      
          borderRadius: '24px',
          padding: '48px 52px',
          width: '100%',
          maxWidth: '480px',
          margin: '24px',
          
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          
          position: 'relative',
          zIndex: 10,
        }}>

          {/* Logo y nombre con ajustes de contraste */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '64px', height: '64px',
              background: 'linear-gradient(135deg, #1e3a5f, #2d5282)',
              borderRadius: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 10px 20px rgba(30,58,95,0.2)',
            }}>
              <Scale size={28} color="#e8d48a" strokeWidth={2.5}/>
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '26px', fontWeight: '700',
              color: '#ffffff', margin: '0 0 4px',
              letterSpacing: '-0.3px',
            }}>
              Lic. Horacio Sánchez Cerino
            </h1>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px', fontWeight: '600',
              color: '#ffffff', margin: '0',
              letterSpacing: '0.8px', textTransform: 'uppercase',
            }}>
              Asesoría Jurídica Profesional
            </p>
          </div>

          {/* Formulario con Inputs semi-transparentes */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: '600',
                color: '#ffffff', marginBottom: '8px', fontFamily: "'Inter', sans-serif",
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
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px', fontSize: '15px',
                  fontFamily: "'Inter', sans-serif",
                  color: '#ffffff', 
                  background: 'rgba(255, 255, 255, 0.5)', // Input semi-transparente
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#1e3a5f';
                  e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.5)';
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: '600',
                color: '#ffffff', marginBottom: '8px', fontFamily: "'Inter', sans-serif",
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
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px', fontSize: '15px',
                  fontFamily: "'Inter', sans-serif",
                  color: '#ffffff', 
                  background: 'rgba(255, 255, 255, 0.5)', // Input semi-transparente
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#1e3a5f';
                  e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.5)';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '16px',
                background: loading ? '#94a3b8' : '#1e3a5f',
                color: 'white', border: 'none',
                borderRadius: '14px', fontSize: '16px',
                fontWeight: '600', fontFamily: "'Inter', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px rgba(30,58,95,0.25)',
                transition: 'transform 0.2s ease',
              }}
              onMouseOver={e => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseOut={e => !loading && (e.target.style.transform = 'translateY(0)')}
            >
              {loading ? 'Verificando...' : 'Entrar al Sistema'}
            </button>
          </form>

          {/* Sección de Contacto más minimalista */}
          <div style={{
            marginTop: '32px', padding: '16px',
            background: 'rgba(30, 58, 95, 0.04)', // Un tinte azul muy suave
            borderRadius: '16px',
            border: '1px solid rgba(30, 58, 95, 0.08)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={{ fontSize: '12px', color: '#ffffff', margin: 0, fontFamily: "'Inter', sans-serif" }}>
                📞 913-100-44-13
              </p>
              <p style={{ fontSize: '12px', color: '#ffffff', margin: 0, fontFamily: "'Inter', sans-serif" }}>
                📍 Centla, Tabasco
              </p>
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