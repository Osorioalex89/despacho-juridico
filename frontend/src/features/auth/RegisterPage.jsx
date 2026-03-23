import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/axios.config'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'

// ── Logo SC (mismo del login) ─────────────────────────────────────
const LogoSC = ({ size = 60 }) => (
  <svg viewBox="0 0 72 72" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rg-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8C97A"/><stop offset="100%" stopColor="#9A7A32"/>
      </linearGradient>
      <linearGradient id="rg-navy" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3a5f"/><stop offset="100%" stopColor="#0e1830"/>
      </linearGradient>
    </defs>
    <rect width="72" height="72" rx="16" fill="url(#rg-navy)" stroke="rgba(201,168,76,0.4)" strokeWidth="1.2"/>
    <rect x="1" y="1" width="70" height="32" rx="15" fill="rgba(255,255,255,0.04)"/>
    <rect x="35.2" y="11" width="1.6" height="34" rx="0.8" fill="url(#rg-gold)" opacity="0.9"/>
    <circle cx="36" cy="11" r="2.8" fill="url(#rg-gold)"/>
    <rect x="14" y="22" width="44" height="2" rx="1" fill="url(#rg-gold)" opacity="0.85"/>
    <line x1="19" y1="24" x2="16" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <line x1="19" y1="24" x2="22" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <ellipse cx="19" cy="34.2" rx="6" ry="2.2" fill="url(#rg-gold)" opacity="0.8"/>
    <line x1="53" y1="24" x2="50" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <line x1="53" y1="24" x2="56" y2="33" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.7"/>
    <ellipse cx="53" cy="34.2" rx="6" ry="2.2" fill="url(#rg-gold)" opacity="0.8"/>
    <rect x="29" y="45" width="14" height="1.8" rx="0.9" fill="url(#rg-gold)" opacity="0.65"/>
    <text x="36" y="58" textAnchor="middle"
      fontFamily="Georgia,'Times New Roman',serif"
      fontSize="11" fontWeight="700"
      fill="url(#rg-gold)" opacity="0.95" letterSpacing="2">SC</text>
    <rect x="28" y="61" width="16" height="1" rx="0.5" fill="url(#rg-gold)" opacity="0.35"/>
  </svg>
)

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form,    setForm]    = useState({ nombre:'', correo:'', contrasena:'', confirmar:'' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [exito,   setExito]   = useState(false)
  const [showPass,setShowPass]= useState(false)

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const validar = () => {
    if (!form.nombre.trim())        return 'El nombre es requerido'
    if (!form.correo.trim())        return 'El correo es requerido'
    if (form.contrasena.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    if (form.contrasena !== form.confirmar) return 'Las contraseñas no coinciden'
    return null
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const err = validar()
    if (err) { setError(err); return }
    setLoading(true); setError('')
    try {
      await api.post('/auth/registro', {
        nombre: form.nombre, correo: form.correo, contrasena: form.contrasena,
      })
      setExito(true)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al registrarse')
    } finally { setLoading(false) }
  }

  // ── Pantalla de éxito ─────────────────────────────────────────
  if (exito) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes floatIn { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .rg-card { animation: floatIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>
      <div style={{
        minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative', overflow:'hidden',
        backgroundImage:'url(/src/assets/fondo-clinica.jpg)',
        backgroundSize:'cover', backgroundPosition:'center',
      }}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(2,8,24,0.82) 0%,rgba(8,20,48,0.75) 50%,rgba(2,8,24,0.85) 100%)',backdropFilter:'blur(4px)',zIndex:1}}/>
        <div className="rg-card" style={{
          position:'relative', zIndex:10,
          width:'100%', maxWidth:'400px', margin:'24px',
          background:'rgba(6,16,40,0.88)',
          backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
          border:'1px solid rgba(201,168,76,0.22)', borderRadius:'24px',
          boxShadow:'0 25px 80px rgba(0,0,0,0.7)',
          padding:'44px 40px', textAlign:'center',
          overflow:'hidden',
        }}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)'}}/>

          {/* Ícono éxito */}
          <div style={{
            width:'64px', height:'64px', borderRadius:'50%',
            background:'rgba(34,197,94,0.12)',
            border:'1px solid rgba(34,197,94,0.28)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 20px',
          }}>
            <CheckCircle size={30} style={{color:'#86EFAC'}}/>
          </div>

          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'22px',fontWeight:'700',color:'rgba(255,255,255,0.96)',margin:'0 0 10px',textShadow:'0 2px 6px rgba(0,0,0,0.3)'}}>
            ¡Solicitud enviada!
          </h2>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.45)',margin:'0 0 24px',lineHeight:1.7,maxWidth:'300px',marginLeft:'auto',marginRight:'auto'}}>
            Tu cuenta fue creada y está <strong style={{color:'#FCD34D'}}>pendiente de aprobación</strong>. El despacho revisará tu solicitud y te dará acceso en breve.
          </p>

          {/* Info contacto */}
          <div style={{
            padding:'12px 16px', marginBottom:'24px',
            background:'rgba(201,168,76,0.06)',
            border:'1px solid rgba(201,168,76,0.15)',
            borderRadius:'10px',
          }}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(201,168,76,0.7)',margin:0}}>
              📞 913-100-44-13 &nbsp;·&nbsp; Centla, Tabasco
            </p>
          </div>

          <button onClick={() => navigate('/login')} style={{
            width:'100%', padding:'13px',
            borderRadius:'10px', border:'none',
            background:'linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%)',
            color:'#020818', fontFamily:"'Inter',sans-serif",
            fontSize:'14px', fontWeight:'700',
            cursor:'pointer', transition:'all 0.18s ease',
            boxShadow:'0 4px 16px rgba(201,168,76,0.3)',
          }}>
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    </>
  )

  // ── Formulario de registro ────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(8,20,48,0.9) inset !important;
          -webkit-text-fill-color: rgba(255,255,255,0.92) !important;
          caret-color: #ffffff;
          transition: background-color 5000s ease-in-out 0s;
        }
        @keyframes floatIn { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .rg-card { animation: floatIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }

        .rg-input {
          width:100%; padding:12px 16px;
          border-radius:10px;
          border:1px solid rgba(255,255,255,0.12);
          background:rgba(255,255,255,0.06);
          color:rgba(255,255,255,0.92);
          font-family:'Inter',sans-serif; font-size:14px;
          outline:none; box-sizing:border-box;
          transition:all 0.18s ease; colorScheme:dark;
        }
        .rg-input::placeholder { color:rgba(255,255,255,0.2); }
        .rg-input:hover { border-color:rgba(255,255,255,0.22); background:rgba(255,255,255,0.08); }
        .rg-input:focus { border-color:rgba(201,168,76,0.55); background:rgba(201,168,76,0.05); box-shadow:0 0 0 3px rgba(201,168,76,0.12); }

        .rg-label {
          display:block; font-family:'Inter',sans-serif;
          font-size:11px; font-weight:700;
          letter-spacing:1.8px; text-transform:uppercase;
          color:rgba(255,255,255,0.5); margin-bottom:7px;
        }

        .rg-btn {
          width:100%; padding:13px; border-radius:10px; border:none;
          background:linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%);
          color:#020818; font-family:'Inter',sans-serif;
          font-size:15px; font-weight:700; cursor:pointer;
          transition:all 0.18s ease;
          box-shadow:0 4px 20px rgba(201,168,76,0.3);
        }
        .rg-btn:hover:not(:disabled) {
          background:linear-gradient(135deg,#E8C97A 0%,#C9A84C 100%);
          transform:translateY(-2px);
          box-shadow:0 8px 28px rgba(201,168,76,0.4);
        }
        .rg-btn:disabled { opacity:0.5; cursor:not-allowed; }
      `}</style>

      <div style={{
        minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative', overflow:'hidden',
        backgroundImage:'url(/src/assets/fondo-clinica.jpg)',
        backgroundSize:'cover', backgroundPosition:'center',
      }}>
        {/* Overlay */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(2,8,24,0.82) 0%,rgba(8,20,48,0.75) 50%,rgba(2,8,24,0.85) 100%)',backdropFilter:'blur(4px)',zIndex:1}}/>

        {/* Anillos decorativos */}
        {[380,260,160].map((s,i)=>(
          <div key={i} style={{position:'absolute',width:s,height:s,borderRadius:'50%',border:`1px solid rgba(201,168,76,${0.06-i*0.015})`,top:'50%',left:'50%',transform:'translate(-50%,-50%)',pointerEvents:'none',zIndex:1}}/>
        ))}

        {/* Card */}
        <div className="rg-card" style={{
          position:'relative', zIndex:10,
          width:'100%', maxWidth:'420px', margin:'24px',
          background:'rgba(6,16,40,0.88)',
          backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
          border:'1px solid rgba(201,168,76,0.22)', borderRadius:'24px',
          boxShadow:'0 25px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08)',
          padding:'36px 40px', overflow:'hidden',
        }}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)'}}/>

          {/* Logo + Nombre */}
          <div style={{textAlign:'center',marginBottom:'24px'}}>
            <div style={{display:'inline-block',marginBottom:'14px'}}>
              <LogoSC size={58}/>
            </div>
            <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'19px',fontWeight:'700',color:'rgba(255,255,255,0.97)',margin:'0 0 4px',textShadow:'0 2px 8px rgba(0,0,0,0.4)',lineHeight:1.2}}>
              Lic. Horacio{' '}
              <span style={{color:'#C9A84C'}}>Sánchez Cerino</span>
            </h1>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',color:'rgba(201,168,76,0.6)',letterSpacing:'3px',textTransform:'uppercase',margin:'0 0 12px'}}>
              Crear cuenta
            </p>
            <div style={{width:'36px',height:'2px',margin:'0 auto',background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',borderRadius:'2px'}}/>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display:'flex',alignItems:'flex-start',gap:'10px',
              background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',
              borderRadius:'10px',padding:'11px 14px',marginBottom:'18px',
            }}>
              <span style={{fontSize:'13px',flexShrink:0}}>⚠</span>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'#FCA5A5',margin:0,lineHeight:1.5}}>
                {error}
              </p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit}>

            {/* Nombre */}
            <div style={{marginBottom:'14px'}}>
              <label className="rg-label">Nombre completo</label>
              <input className="rg-input" name="nombre" type="text"
                value={form.nombre} onChange={handleChange}
                placeholder="Ej. Juan González" required/>
            </div>

            {/* Correo */}
            <div style={{marginBottom:'14px'}}>
              <label className="rg-label">Correo electrónico</label>
              <input className="rg-input" name="correo" type="email"
                value={form.correo} onChange={handleChange}
                placeholder="correo@ejemplo.com" required/>
            </div>

            {/* Contraseña */}
            <div style={{marginBottom:'14px'}}>
              <label className="rg-label">Contraseña</label>
              <div style={{position:'relative'}}>
                <input className="rg-input"
                  name="contrasena"
                  type={showPass ? 'text' : 'password'}
                  value={form.contrasena} onChange={handleChange}
                  placeholder="Mínimo 6 caracteres" required
                  style={{paddingRight:'44px'}}/>
                <button type="button" onClick={()=>setShowPass(v=>!v)}
                  style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.35)',display:'flex',padding:'2px'}}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* Confirmar */}
            <div style={{marginBottom:'20px'}}>
              <label className="rg-label">Confirmar contraseña</label>
              <input className="rg-input"
                name="confirmar"
                type={showPass ? 'text' : 'password'}
                value={form.confirmar} onChange={handleChange}
                placeholder="Repite tu contraseña" required/>
            </div>

            {/* Aviso pendiente */}
            <div style={{
              padding:'11px 14px', marginBottom:'20px',
              background:'rgba(245,158,11,0.08)',
              border:'1px solid rgba(245,158,11,0.2)',
              borderRadius:'10px',
            }}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.5)',margin:0,lineHeight:1.6}}>
                Tu cuenta quedará{' '}
                <strong style={{color:'#FCD34D'}}>pendiente de aprobación</strong>.
                {' '}El despacho te dará acceso una vez que verifique tu solicitud.
              </p>
            </div>

            <button type="submit" disabled={loading} className="rg-btn">
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          {/* Link login */}
          <p style={{textAlign:'center',marginTop:'18px',fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.35)'}}>
            ¿Ya tienes cuenta?{' '}
            <a href="/login" style={{color:'#C9A84C',fontWeight:'600',textDecoration:'none'}}>
              Inicia sesión
            </a>
          </p>

        </div>

        {/* Footer */}
        <p style={{position:'absolute',bottom:'20px',fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.2)',zIndex:10,letterSpacing:'0.5px'}}>
          Cédula Prof. 2762890 · Sistema de Gestión Jurídica
        </p>
      </div>
    </>
  )
}