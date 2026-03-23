import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { solicitarCita } from '../appointments/appointmentsService'
import { CheckCircle, Calendar, Phone, MapPin } from 'lucide-react'

export default function SolicitarCitaPage() {
  const navigate = useNavigate()

  const [form,   setForm]   = useState({ fecha:'', motivo:'', mensaje:'' })
  const [saving, setSaving] = useState(false)
  const [exito,  setExito]  = useState(false)
  const [error,  setError]  = useState('')

  const hoy = new Date().toISOString().split('T')[0]

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      await solicitarCita(form)
      setExito(true)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al enviar la solicitud')
    } finally { setSaving(false) }
  }

  // ── Pantalla éxito ────────────────────────────────────────────
  if (exito) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes floatIn { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .sc-card { animation: floatIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>
      <div style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        minHeight:'100vh', padding:'24px',
        background:`
          radial-gradient(ellipse at 20% 40%, rgba(201,168,76,0.06) 0%, transparent 48%),
          linear-gradient(160deg,#020818 0%,#040d20 50%,#02050f 100%)
        `,
      }}>
        <div className="sc-card" style={{
          width:'100%', maxWidth:'400px',
          background:'rgba(6,16,40,0.9)',
          backdropFilter:'blur(24px)',
          border:'1px solid rgba(34,197,94,0.22)',
          borderRadius:'22px',
          boxShadow:'0 25px 70px rgba(0,0,0,0.6)',
          padding:'40px 36px', textAlign:'center',
          position:'relative', overflow:'hidden',
        }}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(34,197,94,0.4),transparent)'}}/>

          <div style={{
            width:'60px', height:'60px', borderRadius:'50%',
            background:'rgba(34,197,94,0.1)',
            border:'1px solid rgba(34,197,94,0.28)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 20px',
          }}>
            <CheckCircle size={28} style={{color:'#86EFAC'}}/>
          </div>

          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'20px',fontWeight:'700',color:'rgba(255,255,255,0.96)',margin:'0 0 10px',textShadow:'0 2px 6px rgba(0,0,0,0.3)'}}>
            ¡Solicitud enviada!
          </h2>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.45)',margin:'0 0 28px',lineHeight:1.7,maxWidth:'280px',marginLeft:'auto',marginRight:'auto'}}>
            Tu solicitud fue recibida. El secretario del despacho confirmará la fecha y hora a la brevedad.
          </p>

          <button onClick={()=>navigate('/cliente/mis-citas')} style={{
            width:'100%', padding:'13px', borderRadius:'10px', border:'none',
            background:'linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%)',
            color:'#020818', fontFamily:"'Inter',sans-serif",
            fontSize:'14px', fontWeight:'700',
            cursor:'pointer', transition:'all 0.18s ease',
            boxShadow:'0 4px 16px rgba(201,168,76,0.3)',
          }}>
            Ver mis citas
          </button>
        </div>
      </div>
    </>
  )

  // ── Formulario ────────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .sc-fade { animation: fadeUp 0.4s ease both; }

        .sc-input {
          width:100%; padding:11px 14px; border-radius:10px;
          border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.05);
          color:rgba(255,255,255,0.9);
          font-family:'Inter',sans-serif; font-size:14px;
          outline:none; box-sizing:border-box;
          transition:all 0.15s ease; colorScheme:dark;
        }
        .sc-input::placeholder { color:rgba(255,255,255,0.2); }
        .sc-input:hover { border-color:rgba(255,255,255,0.2); background:rgba(255,255,255,0.07); }
        .sc-input:focus { border-color:rgba(201,168,76,0.5); background:rgba(201,168,76,0.05); box-shadow:0 0 0 3px rgba(201,168,76,0.1); }

        .sc-label {
          display:block; font-family:'Inter',sans-serif;
          font-size:10px; font-weight:700;
          letter-spacing:1.8px; text-transform:uppercase;
          color:rgba(255,255,255,0.45); margin-bottom:7px;
        }

        .sc-btn-primary {
          display:inline-flex; align-items:center; gap:7px;
          padding:11px 20px; border-radius:9px; border:none;
          background:linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%);
          color:#020818; font-family:'Inter',sans-serif;
          font-size:13px; font-weight:700;
          cursor:pointer; transition:all 0.18s ease;
          box-shadow:0 4px 16px rgba(201,168,76,0.25);
        }
        .sc-btn-primary:hover:not(:disabled) { background:linear-gradient(135deg,#E8C97A 0%,#C9A84C 100%); transform:translateY(-1px); box-shadow:0 6px 20px rgba(201,168,76,0.35); }
        .sc-btn-primary:disabled { opacity:0.5; cursor:not-allowed; }

        .sc-btn-ghost {
          padding:11px 18px; border-radius:9px;
          border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.04);
          color:rgba(255,255,255,0.55);
          font-family:'Inter',sans-serif; font-size:13px; font-weight:500;
          cursor:pointer; transition:all 0.15s ease;
        }
        .sc-btn-ghost:hover { background:rgba(255,255,255,0.07); border-color:rgba(255,255,255,0.18); color:rgba(255,255,255,0.8); }
      `}</style>

      <div style={{
        flex:1, overflowY:'auto', minHeight:'100vh',
        background:`
          radial-gradient(ellipse at 10% 20%, rgba(201,168,76,0.05) 0%, transparent 48%),
          radial-gradient(ellipse at 90% 80%, rgba(59,130,246,0.04) 0%, transparent 48%),
          linear-gradient(160deg,#020818 0%,#040d20 50%,#02050f 100%)
        `,
      }}>

        {/* Page header */}
        <div className="sc-fade" style={{
          background:'linear-gradient(135deg,rgba(6,16,40,0.97) 0%,rgba(12,26,56,0.9) 100%)',
          borderBottom:'1px solid rgba(201,168,76,0.14)',
          padding:'22px 32px 18px', position:'relative', overflow:'hidden',
        }}>
          {[160,110].map((s,i)=>(
            <div key={i} style={{position:'absolute',top:-s*0.4,right:-s*0.4,width:s,height:s,borderRadius:'50%',border:`1px solid rgba(201,168,76,${0.06-i*0.02})`,pointerEvents:'none'}}/>
          ))}
          <div style={{position:'relative',zIndex:1}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:'700',letterSpacing:'3px',textTransform:'uppercase',color:'rgba(201,168,76,0.85)',margin:'0 0 6px'}}>Portal del Cliente</p>
            <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'22px',fontWeight:'700',color:'rgba(255,255,255,0.96)',margin:'0 0 3px',textShadow:'0 2px 6px rgba(0,0,0,0.35)'}}>Solicitar Cita</h1>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.35)',margin:0}}>
              Completa el formulario y el despacho confirmará tu cita
            </p>
          </div>
          <div style={{position:'absolute',bottom:0,left:'32px',width:'44px',height:'1px',background:'linear-gradient(90deg,rgba(201,168,76,0.55),transparent)'}}/>
        </div>

        <div style={{padding:'28px 32px',maxWidth:'560px'}}>

          {/* Error */}
          {error && (
            <div className="sc-fade" style={{
              display:'flex', alignItems:'flex-start', gap:'10px',
              background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)',
              borderRadius:'10px', padding:'12px 14px', marginBottom:'18px',
            }}>
              <span style={{fontSize:'13px',flexShrink:0}}>⚠</span>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'#FCA5A5',margin:0,lineHeight:1.5}}>{error}</p>
            </div>
          )}

          {/* Form card */}
          <div className="sc-fade" style={{
            background:'rgba(8,20,48,0.75)', backdropFilter:'blur(16px)',
            border:'1px solid rgba(201,168,76,0.14)', borderRadius:'16px',
            boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
            overflow:'hidden', animationDelay:'0.08s',
          }}>
            {/* Header card */}
            <div style={{padding:'16px 22px',borderBottom:'1px solid rgba(201,168,76,0.1)',display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Calendar size={15} style={{color:'rgba(201,168,76,0.8)'}}/>
              </div>
              <div>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:'15px',fontWeight:'700',color:'rgba(255,255,255,0.92)',margin:0}}>Nueva solicitud de cita</p>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)',margin:0}}>La fecha y hora final será confirmada por el despacho</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{padding:'22px'}}>

              {/* Fecha */}
              <div style={{marginBottom:'16px'}}>
                <label className="sc-label">Fecha preferida <span style={{color:'#FCA5A5'}}>*</span></label>
                <input className="sc-input" name="fecha" type="date"
                  value={form.fecha} min={hoy} onChange={handleChange} required/>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.3)',margin:'5px 0 0'}}>
                  El despacho puede ajustar la fecha según disponibilidad
                </p>
              </div>

              {/* Motivo */}
              <div style={{marginBottom:'16px'}}>
                <label className="sc-label">Motivo de la cita <span style={{color:'#FCA5A5'}}>*</span></label>
                <input className="sc-input" name="motivo" value={form.motivo}
                  onChange={handleChange} required
                  placeholder="Ej. Consulta sobre mi caso, firma de documentos…"/>
              </div>

              {/* Mensaje */}
              <div style={{marginBottom:'20px'}}>
                <label className="sc-label">Mensaje adicional</label>
                <textarea className="sc-input" name="mensaje" value={form.mensaje}
                  onChange={handleChange} rows={4}
                  placeholder="Cuéntanos brevemente en qué te podemos ayudar…"
                  style={{resize:'none',lineHeight:1.6}}/>
              </div>

              {/* Info despacho */}
              <div style={{
                padding:'13px 16px', marginBottom:'22px',
                background:'rgba(201,168,76,0.06)',
                border:'1px solid rgba(201,168,76,0.15)',
                borderRadius:'10px',
              }}>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:'13px',fontWeight:'700',color:'rgba(201,168,76,0.85)',margin:'0 0 8px'}}>
                  Lic. Horacio Sánchez Cerino
                </p>
                <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                    <MapPin size={11} style={{color:'rgba(201,168,76,0.55)',flexShrink:0}}/>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>
                      Francisco Javier Mina #25, Centla, Tabasco
                    </span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                    <Phone size={11} style={{color:'rgba(201,168,76,0.55)',flexShrink:0}}/>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>
                      913-100-44-13
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div style={{display:'flex',justifyContent:'flex-end',gap:'10px'}}>
                <button type="button" className="sc-btn-ghost"
                  onClick={()=>navigate('/cliente/mis-citas')}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="sc-btn-primary">
                  <Calendar size={14}/>
                  {saving ? 'Enviando…' : 'Enviar solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}