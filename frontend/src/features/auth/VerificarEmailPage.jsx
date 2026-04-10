import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/axios.config'
import { ShieldCheck, ShieldAlert } from 'lucide-react'

export default function VerificarEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate        = useNavigate()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [msg,    setMsg]    = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMsg('Token de verificación no encontrado.')
      return
    }

    api.get(`/auth/verificar-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error')
        setMsg(err.response?.data?.message || 'Error al verificar el correo.')
      })
  }, [searchParams])

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet"/>
      <div style={{
        minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        background:'#020818',
      }}>
        <div style={{
          maxWidth:'400px', width:'100%', margin:'24px',
          background:'rgba(6,16,40,0.92)',
          border:'1px solid rgba(201,168,76,0.22)', borderRadius:'20px',
          boxShadow:'0 24px 80px rgba(0,0,0,0.7)',
          padding:'48px 40px', textAlign:'center',
        }}>
          {/* Línea dorada top */}
          <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)'}}/>

          {status === 'loading' && (
            <>
              <div style={{
                width:'64px',height:'64px',borderRadius:'50%',
                background:'rgba(201,168,76,0.07)',border:'1px solid rgba(201,168,76,0.22)',
                display:'flex',alignItems:'center',justifyContent:'center',
                margin:'0 auto 16px',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                  style={{animation:'spin 1.2s linear infinite'}}>
                  <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                  <circle cx="12" cy="12" r="9" stroke="rgba(201,168,76,0.25)" strokeWidth="2"/>
                  <path d="M12 3a9 9 0 0 1 9 9" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{fontFamily:"'Inter'",color:'rgba(255,255,255,0.5)',fontSize:'14px'}}>
                Verificando tu correo…
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{
                width:'72px',height:'72px',borderRadius:'50%',
                background:'rgba(16,185,129,0.09)',
                border:'1.5px solid rgba(16,185,129,0.40)',
                display:'flex',alignItems:'center',justifyContent:'center',
                margin:'0 auto 24px',
                boxShadow:'0 0 24px rgba(16,185,129,0.18)',
              }}>
                <ShieldCheck size={34} color="#10B981" strokeWidth={1.5}/>
              </div>
              <h2 style={{
                fontFamily:"'Playfair Display',serif",fontSize:'22px',fontWeight:'700',
                color:'rgba(255,255,255,0.97)',margin:'0 0 10px',
              }}>
                ¡Correo verificado!
              </h2>
              <p style={{fontFamily:"'Inter'",fontSize:'13px',color:'rgba(255,255,255,0.45)',margin:'0 0 28px',lineHeight:1.6}}>
                Tu cuenta está activa. El despacho revisará tu solicitud y te asignará acceso en breve.
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{
                  width:'100%',padding:'13px',borderRadius:'10px',border:'none',
                  background:'linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%)',
                  color:'#020818',fontFamily:"'Inter'",fontSize:'14px',fontWeight:'700',
                  cursor:'pointer',boxShadow:'0 4px 16px rgba(201,168,76,0.3)',
                }}
              >
                Ir al inicio de sesión
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{
                width:'72px',height:'72px',borderRadius:'50%',
                background:'rgba(239,68,68,0.09)',
                border:'1.5px solid rgba(239,68,68,0.35)',
                display:'flex',alignItems:'center',justifyContent:'center',
                margin:'0 auto 16px',
                boxShadow:'0 0 20px rgba(239,68,68,0.15)',
              }}>
                <ShieldAlert size={34} color="#FCA5A5" strokeWidth={1.5}/>
              </div>
              <h2 style={{
                fontFamily:"'Playfair Display',serif",fontSize:'20px',fontWeight:'700',
                color:'rgba(255,255,255,0.9)',margin:'0 0 10px',
              }}>
                Error de verificación
              </h2>
              <p style={{fontFamily:"'Inter'",fontSize:'13px',color:'#FCA5A5',margin:'0 0 24px'}}>
                {msg}
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{
                  width:'100%',padding:'13px',borderRadius:'10px',border:'none',
                  background:'linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%)',
                  color:'#020818',fontFamily:"'Inter'",fontSize:'14px',fontWeight:'700',
                  cursor:'pointer',
                }}
              >
                Volver al login
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
