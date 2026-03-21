import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/axios.config'
import { Scale, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '', correo: '', contrasena: '', confirmar: '',
  })
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [exito,    setExito]    = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const validar = () => {
    if (!form.nombre.trim())   return 'El nombre es requerido'
    if (!form.correo.trim())   return 'El correo es requerido'
    if (form.contrasena.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    if (form.contrasena !== form.confirmar) return 'Las contraseñas no coinciden'
    return null
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const err = validar()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      await api.post('/auth/registro', {
        nombre:     form.nombre,
        correo:     form.correo,
        contrasena: form.contrasena,
      })
      setExito(true)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  // ── Pantalla de éxito ────────────────────────────────────────────
  if (exito) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
           style={{
             backgroundImage: 'url(/src/assets/fondo-clinica.jpg)',
             backgroundSize: 'cover', backgroundPosition: 'center',
           }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(10,22,40,0.7),rgba(30,58,95,0.5))', backdropFilter:'blur(3px)', zIndex:1 }}/>
        <div style={{
          background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)',
          border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:'24px', padding:'48px 52px',
          width:'100%', maxWidth:'440px', margin:'24px',
          boxShadow:'0 25px 50px rgba(0,0,0,0.5)',
          position:'relative', zIndex:10, textAlign:'center',
        }}>
          <div style={{
            width:'64px', height:'64px',
            background:'linear-gradient(135deg,#16a34a,#15803d)',
            borderRadius:'50%', display:'flex',
            alignItems:'center', justifyContent:'center',
            margin:'0 auto 20px',
          }}>
            <CheckCircle size={32} color="white"/>
          </div>
          <h2 style={{
            fontFamily:"'Playfair Display', serif",
            fontSize:'24px', fontWeight:'700',
            color:'#ffffff', marginBottom:'12px',
          }}>
            ¡Solicitud enviada!
          </h2>
          <p style={{
            fontFamily:"'Inter', sans-serif",
            fontSize:'14px', color:'rgba(255,255,255,0.7)',
            lineHeight:'1.6', marginBottom:'28px',
          }}>
            Tu cuenta fue creada y está pendiente de aprobación. El despacho revisará tu solicitud y te notificará cuando tengas acceso.
          </p>
          <div style={{
            background:'rgba(232,212,138,0.1)',
            border:'1px solid rgba(232,212,138,0.3)',
            borderRadius:'12px', padding:'14px',
            marginBottom:'24px',
          }}>
            <p style={{ fontSize:'12px', color:'#e8d48a', fontFamily:"'Inter', sans-serif" }}>
              📞 913-100-44-13 &nbsp;·&nbsp; horaciocerino23@gmail.com
            </p>
          </div>
          <button onClick={() => navigate('/login')}
            style={{
              width:'100%', padding:'14px',
              background:'#1e3a5f', color:'white',
              border:'none', borderRadius:'12px',
              fontSize:'15px', fontWeight:'600',
              fontFamily:"'Inter', sans-serif",
              cursor:'pointer',
            }}>
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    </>
  )

  // ── Formulario de registro ───────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
           style={{
             backgroundImage: 'url(/src/assets/fondo-clinica.jpg)',
             backgroundSize: 'cover', backgroundPosition: 'center',
           }}>

        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(10,22,40,0.7),rgba(30,58,95,0.5))', backdropFilter:'blur(3px)', zIndex:1 }}/>

        <div style={{
          background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)',
          WebkitBackdropFilter:'blur(8px)',
          border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:'24px', padding:'44px 52px',
          width:'100%', maxWidth:'480px', margin:'24px',
          boxShadow:'0 25px 50px rgba(0,0,0,0.5)',
          position:'relative', zIndex:10,
        }}>

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:'28px' }}>
            <div style={{
              width:'56px', height:'56px',
              background:'linear-gradient(135deg,#1e3a5f,#2d5282)',
              borderRadius:'16px', display:'flex',
              alignItems:'center', justifyContent:'center',
              margin:'0 auto 14px',
              boxShadow:'0 8px 20px rgba(30,58,95,0.3)',
            }}>
              <Scale size={26} color="#e8d48a" strokeWidth={2.5}/>
            </div>
            <h1 style={{
              fontFamily:"'Playfair Display', Georgia, serif",
              fontSize:'22px', fontWeight:'700',
              color:'#ffffff', margin:'0 0 4px',
            }}>
              Lic. Horacio Sánchez Cerino
            </h1>
            <p style={{
              fontFamily:"'Inter', sans-serif",
              fontSize:'11px', fontWeight:'600',
              color:'rgba(255,255,255,0.5)', margin:0,
              letterSpacing:'0.8px', textTransform:'uppercase',
            }}>
              Crear cuenta
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background:'rgba(220,38,38,0.15)',
              border:'1px solid rgba(220,38,38,0.3)',
              color:'#fca5a5', fontSize:'13px',
              borderRadius:'10px', padding:'12px 16px',
              marginBottom:'18px', fontFamily:"'Inter', sans-serif",
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Nombre */}
            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', color:'#ffffff', marginBottom:'7px', fontFamily:"'Inter', sans-serif" }}>
                Nombre completo
              </label>
              <input name="nombre" type="text" value={form.nombre}
                onChange={handleChange} placeholder="Ej. Juan González"
                required style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#e8d48a'; e.target.style.background='rgba(255,255,255,0.15)' }}
                onBlur={e =>  { e.target.style.borderColor='rgba(255,255,255,0.15)'; e.target.style.background='rgba(255,255,255,0.08)' }}
              />
            </div>

            {/* Correo */}
            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', color:'#ffffff', marginBottom:'7px', fontFamily:"'Inter', sans-serif" }}>
                Correo electrónico
              </label>
              <input name="correo" type="email" value={form.correo}
                onChange={handleChange} placeholder="correo@ejemplo.com"
                required style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#e8d48a'; e.target.style.background='rgba(255,255,255,0.15)' }}
                onBlur={e =>  { e.target.style.borderColor='rgba(255,255,255,0.15)'; e.target.style.background='rgba(255,255,255,0.08)' }}
              />
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', color:'#ffffff', marginBottom:'7px', fontFamily:"'Inter', sans-serif" }}>
                Contraseña
              </label>
              <div style={{ position:'relative' }}>
                <input name="contrasena" type={showPass ? 'text' : 'password'}
                  value={form.contrasena} onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  required style={{ ...inputStyle, paddingRight:'44px' }}
                  onFocus={e => { e.target.style.borderColor='#e8d48a'; e.target.style.background='rgba(255,255,255,0.15)' }}
                  onBlur={e =>  { e.target.style.borderColor='rgba(255,255,255,0.15)'; e.target.style.background='rgba(255,255,255,0.08)' }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)', display:'flex' }}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div style={{ marginBottom:'24px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'600', color:'#ffffff', marginBottom:'7px', fontFamily:"'Inter', sans-serif" }}>
                Confirmar contraseña
              </label>
              <input name="confirmar" type={showPass ? 'text' : 'password'}
                value={form.confirmar} onChange={handleChange}
                placeholder="Repite tu contraseña"
                required style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#e8d48a'; e.target.style.background='rgba(255,255,255,0.15)' }}
                onBlur={e =>  { e.target.style.borderColor='rgba(255,255,255,0.15)'; e.target.style.background='rgba(255,255,255,0.08)' }}
              />
            </div>

            {/* Aviso */}
            <div style={{
              background:'rgba(232,212,138,0.08)',
              border:'1px solid rgba(232,212,138,0.2)',
              borderRadius:'10px', padding:'12px',
              marginBottom:'20px',
            }}>
              <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)', fontFamily:"'Inter', sans-serif", lineHeight:'1.5', margin:0 }}>
                ⚠️ Tu cuenta quedará <strong style={{ color:'#e8d48a' }}>pendiente de aprobación</strong>. El despacho te dará acceso una vez que verifique tu solicitud.
              </p>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width:'100%', padding:'15px',
                background: loading ? '#475569' : '#1e3a5f',
                color:'white', border:'none',
                borderRadius:'12px', fontSize:'15px',
                fontWeight:'600', fontFamily:"'Inter', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow:'0 8px 20px rgba(30,58,95,0.3)',
                transition:'all 0.2s',
              }}
              onMouseOver={e => !loading && (e.target.style.background = '#2d5282')}
              onMouseOut={e =>  !loading && (e.target.style.background = '#1e3a5f')}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          {/* Link login */}
          <p style={{
            textAlign:'center', marginTop:'20px',
            fontSize:'13px', color:'rgba(255,255,255,0.5)',
            fontFamily:"'Inter', sans-serif",
          }}>
            ¿Ya tienes cuenta?{' '}
            <a href="/login" style={{ color:'#e8d48a', fontWeight:'600', textDecoration:'none' }}>
              Inicia sesión
            </a>
          </p>

        </div>

        <div style={{
          position:'absolute', bottom:'20px',
          fontFamily:"'Inter', sans-serif",
          fontSize:'12px', color:'rgba(255,255,255,0.25)',
          zIndex:10,
        }}>
          Cédula Prof. 2762890 · Sistema de Gestión Jurídica
        </div>
      </div>
    </>
  )
}

const inputStyle = {
  width:'100%', padding:'13px 16px',
  border:'1px solid rgba(255,255,255,0.15)',
  borderRadius:'12px', fontSize:'14px',
  fontFamily:"'Inter', sans-serif",
  color:'#ffffff',
  background:'rgba(255,255,255,0.08)',
  outline:'none', boxSizing:'border-box',
  transition:'all 0.2s',
  WebkitTextFillColor: '#ffffff',
}