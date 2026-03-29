import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getClienteById, createCliente, updateCliente } from './clientsService'
import {
  Save, X, User, MapPin,
  StickyNote, AlertCircle, KeyRound, Eye, EyeOff
} from 'lucide-react'

export default function ClientForm() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)

  const [form, setForm] = useState({
    nombre: '', telefono: '', correo: '',
    direccion: '', rfc: '', notas: '',
  })
  const [acceso, setAcceso]         = useState(false)   // toggle sección acceso portal
  const [contrasena, setContrasena] = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [loading,  setLoading]      = useState(false)
  const [saving,   setSaving]       = useState(false)
  const [error,    setError]        = useState('')

  useEffect(() => {
    if (isEdit) {
      setLoading(true)
      getClienteById(id)
        .then(res => setForm(res.data))
        .catch(() => setError('Error al cargar el cliente'))
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        await updateCliente(id, form)
      } else {
        const payload = { ...form }
        if (acceso && contrasena) payload.contrasena = contrasena
        await createCliente(payload)
      }
      navigate('/panel/clientes')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────
  if (loading) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'linear-gradient(160deg,#020818,#040d20)',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '2px solid rgba(201,168,76,0.3)', borderTopColor: '#C9A84C',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  )

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .cf-fade { animation: fadeUp 0.4s ease both; }

        .cf-input {
          width:100%; padding:11px 14px; border-radius:10px;
          border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.05);
          color:rgba(255,255,255,0.9);
          font-family:'Inter',sans-serif; font-size:13px;
          outline:none; box-sizing:border-box;
          transition:all 0.15s ease; color-scheme:dark;
        }
        .cf-input::placeholder { color:rgba(255,255,255,0.2); }
        .cf-input:hover  { border-color:rgba(255,255,255,0.18); background:rgba(255,255,255,0.07); }
        .cf-input:focus  { border-color:rgba(201,168,76,0.5); background:rgba(201,168,76,0.05); box-shadow:0 0 0 3px rgba(201,168,76,0.1); }

        .cf-textarea {
          width:100%; padding:11px 14px; border-radius:10px;
          border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.05);
          color:rgba(255,255,255,0.9);
          font-family:'Inter',sans-serif; font-size:13px;
          outline:none; resize:none; box-sizing:border-box;
          transition:all 0.15s ease; color-scheme:dark;
        }
        .cf-textarea::placeholder { color:rgba(255,255,255,0.2); }
        .cf-textarea:hover  { border-color:rgba(255,255,255,0.18); background:rgba(255,255,255,0.07); }
        .cf-textarea:focus  { border-color:rgba(201,168,76,0.5); background:rgba(201,168,76,0.05); box-shadow:0 0 0 3px rgba(201,168,76,0.1); }

        .cf-label {
          display:block; font-family:'Inter',sans-serif;
          font-size:10px; font-weight:700;
          letter-spacing:1.8px; text-transform:uppercase;
          color:rgba(255,255,255,0.45); margin-bottom:7px;
        }
        .cf-label .req { color:#FCA5A5; margin-left:3px; }

        .cf-section-title {
          font-family:'Playfair Display',serif;
          font-size:14px; font-weight:700;
          color:rgba(255,255,255,0.9); margin:0;
        }

        .cf-btn-save {
          display:inline-flex; align-items:center; gap:7px;
          padding:11px 22px; border-radius:9px; border:none;
          background:linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%);
          color:#020818; font-family:'Inter',sans-serif;
          font-size:13px; font-weight:700;
          cursor:pointer; transition:all 0.18s ease;
          box-shadow:0 4px 16px rgba(201,168,76,0.25);
        }
        .cf-btn-save:hover:not(:disabled) { background:linear-gradient(135deg,#E8C97A 0%,#C9A84C 100%); transform:translateY(-1px); box-shadow:0 6px 20px rgba(201,168,76,0.35); }
        .cf-btn-save:disabled { opacity:0.5; cursor:not-allowed; }

        .cf-btn-cancel {
          display:inline-flex; align-items:center; gap:7px;
          padding:11px 18px; border-radius:9px;
          border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.04);
          color:rgba(255,255,255,0.55);
          font-family:'Inter',sans-serif; font-size:13px; font-weight:500;
          cursor:pointer; transition:all 0.15s ease;
        }
        .cf-btn-cancel:hover { background:rgba(255,255,255,0.07); border-color:rgba(255,255,255,0.18); color:rgba(255,255,255,0.85); }

        .cf-toggle {
          display:flex; align-items:center; gap:10px;
          padding:12px 16px; border-radius:10px;
          border:1px solid rgba(201,168,76,0.18);
          background:rgba(201,168,76,0.05);
          cursor:pointer; transition:all 0.15s ease;
          width:100%;
        }
        .cf-toggle:hover { background:rgba(201,168,76,0.09); border-color:rgba(201,168,76,0.28); }

        .cf-pass-wrap { position:relative; }
        .cf-pass-wrap .cf-input { padding-right:44px; }
        .cf-pass-eye {
          position:absolute; right:12px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; padding:4px;
          color:rgba(255,255,255,0.35); transition:color 0.15s;
          display:flex; align-items:center;
        }
        .cf-pass-eye:hover { color:rgba(201,168,76,0.8); }
      `}</style>

      <div style={{
        flex: 1, overflowY: 'auto', minHeight: '100vh',
        background: `
          radial-gradient(ellipse at 10% 20%, rgba(201,168,76,0.05) 0%, transparent 48%),
          radial-gradient(ellipse at 90% 80%, rgba(59,130,246,0.04) 0%, transparent 48%),
          linear-gradient(160deg,#020818 0%,#040d20 50%,#02050f 100%)
        `,
      }}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="cf-fade" style={{
          background: 'linear-gradient(135deg,rgba(6,16,40,0.97) 0%,rgba(12,26,56,0.9) 100%)',
          borderBottom: '1px solid rgba(201,168,76,0.14)',
          padding: '22px 36px 18px', position: 'relative', overflow: 'hidden',
        }}>
          {[160, 110].map((s, i) => (
            <div key={i} style={{
              position: 'absolute', top: -s * 0.4, right: -s * 0.4,
              width: s, height: s, borderRadius: '50%',
              border: `1px solid rgba(201,168,76,${0.06 - i * 0.02})`,
              pointerEvents: 'none',
            }} />
          ))}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{
              fontFamily: "'Inter',sans-serif", fontSize: '10px', fontWeight: '700',
              letterSpacing: '3px', textTransform: 'uppercase',
              color: 'rgba(201,168,76,0.85)', margin: '0 0 6px',
            }}>
              {isEdit ? 'Editar cliente' : 'Nuevo cliente'}
            </p>
            <h1 style={{
              fontFamily: "'Playfair Display',Georgia,serif",
              fontSize: '22px', fontWeight: '700',
              color: 'rgba(255,255,255,0.96)', margin: '0 0 3px',
              textShadow: '0 2px 6px rgba(0,0,0,0.35)',
            }}>
              {isEdit ? 'Editar cliente' : 'Registrar nuevo cliente'}
            </h1>
            <p style={{
              fontFamily: "'Inter',sans-serif", fontSize: '12px',
              color: 'rgba(255,255,255,0.35)', margin: 0,
            }}>
              {isEdit
                ? 'Modifica los datos del cliente'
                : 'Completa la información del nuevo cliente del despacho'}
            </p>
          </div>
          <div style={{
            position: 'absolute', bottom: 0, left: '36px',
            width: '44px', height: '1px',
            background: 'linear-gradient(90deg,rgba(201,168,76,0.55),transparent)',
          }} />
        </div>

        <div style={{ padding: '26px 36px', maxWidth: '820px' }}>

          {/* Error */}
          {error && (
            <div className="cf-fade" style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '18px',
            }}>
              <AlertCircle size={14} style={{ color: '#FCA5A5', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: '#FCA5A5', margin: 0, lineHeight: 1.5 }}>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── Sección 1: Datos personales ───────────────────── */}
            <div className="cf-fade" style={{
              background: 'rgba(8,20,48,0.75)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(201,168,76,0.14)', borderRadius: '16px',
              overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              marginBottom: '16px', animationDelay: '0.06s',
            }}>
              <div style={{
                padding: '15px 22px', borderBottom: '1px solid rgba(201,168,76,0.1)',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <User size={14} style={{ color: 'rgba(201,168,76,0.8)' }} />
                </div>
                <p className="cf-section-title">Datos personales</p>
              </div>

              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Nombre y Teléfono */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="cf-label">Nombre completo <span className="req">*</span></label>
                    <input className="cf-input" name="nombre" value={form.nombre}
                      onChange={handleChange} required placeholder="Ej. Juan González López" />
                  </div>
                  <div>
                    <label className="cf-label">Teléfono</label>
                    <input className="cf-input" name="telefono" value={form.telefono || ''}
                      onChange={handleChange} placeholder="Ej. 555-123-4567" />
                  </div>
                </div>

                {/* Correo y RFC */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="cf-label">Correo electrónico</label>
                    <input className="cf-input" name="correo" type="email" value={form.correo || ''}
                      onChange={handleChange} placeholder="correo@ejemplo.com" />
                  </div>
                  <div>
                    <label className="cf-label">RFC</label>
                    <input className="cf-input" name="rfc" value={form.rfc || ''}
                      onChange={handleChange} placeholder="Ej. GOGL800101XXX" />
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <label className="cf-label">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={10} style={{ opacity: 0.6 }} /> Dirección
                    </span>
                  </label>
                  <input className="cf-input" name="direccion" value={form.direccion || ''}
                    onChange={handleChange} placeholder="Calle, número, colonia, ciudad..." />
                </div>

              </div>
            </div>

            {/* ── Sección 2: Notas ─────────────────────────────── */}
            <div className="cf-fade" style={{
              background: 'rgba(8,20,48,0.75)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(201,168,76,0.14)', borderRadius: '16px',
              overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              marginBottom: '16px', animationDelay: '0.1s',
            }}>
              <div style={{
                padding: '15px 22px', borderBottom: '1px solid rgba(201,168,76,0.1)',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <StickyNote size={14} style={{ color: 'rgba(201,168,76,0.8)' }} />
                </div>
                <p className="cf-section-title">Notas internas</p>
              </div>
              <div style={{ padding: '20px 22px' }}>
                <label className="cf-label">Observaciones</label>
                <textarea className="cf-textarea" name="notas" value={form.notas || ''}
                  onChange={handleChange} rows={3}
                  placeholder="Observaciones del cliente, referencias, acuerdos previos..." />
              </div>
            </div>

            {/* ── Sección 3: Acceso al portal (solo en crear) ───── */}
            {!isEdit && (
              <div className="cf-fade" style={{
                background: 'rgba(8,20,48,0.75)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(201,168,76,0.14)', borderRadius: '16px',
                overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                marginBottom: '16px', animationDelay: '0.14s',
              }}>
                <div style={{
                  padding: '15px 22px', borderBottom: '1px solid rgba(201,168,76,0.1)',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <KeyRound size={14} style={{ color: 'rgba(201,168,76,0.8)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="cf-section-title">Acceso al portal del cliente</p>
                  </div>
                  <span style={{
                    fontFamily: "'Inter',sans-serif", fontSize: '10px', fontWeight: '700',
                    color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase',
                  }}>Opcional</span>
                </div>

                <div style={{ padding: '20px 22px' }}>
                  {/* Toggle */}
                  <button type="button" className="cf-toggle" onClick={() => setAcceso(v => !v)}>
                    {/* Checkbox visual */}
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                      border: `2px solid ${acceso ? '#C9A84C' : 'rgba(255,255,255,0.2)'}`,
                      background: acceso ? 'rgba(201,168,76,0.2)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}>
                      {acceso && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontFamily: "'Inter',sans-serif", fontSize: '13px', fontWeight: '600',
                        color: 'rgba(255,255,255,0.85)', margin: '0 0 2px',
                      }}>
                        Crear acceso al portal
                      </p>
                      <p style={{
                        fontFamily: "'Inter',sans-serif", fontSize: '11px',
                        color: 'rgba(255,255,255,0.35)', margin: 0,
                      }}>
                        El cliente podrá iniciar sesión para ver sus casos y citas
                      </p>
                    </div>
                  </button>

                  {/* Campos de acceso */}
                  {acceso && (
                    <div style={{
                      marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
                      padding: '16px', borderRadius: '10px',
                      background: 'rgba(201,168,76,0.04)',
                      border: '1px solid rgba(201,168,76,0.12)',
                    }}>
                      <p style={{
                        fontFamily: "'Inter',sans-serif", fontSize: '11px',
                        color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6,
                      }}>
                        Se usará el correo electrónico ingresado arriba como nombre de usuario.
                        El cliente iniciará sesión con ese correo y la contraseña que establezcas.
                      </p>
                      <div className="cf-pass-wrap">
                        <label className="cf-label">Contraseña <span className="req">*</span></label>
                        <input
                          className="cf-input"
                          type={showPass ? 'text' : 'password'}
                          value={contrasena}
                          onChange={e => setContrasena(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          required={acceso}
                          minLength={6}
                        />
                        <button type="button" className="cf-pass-eye" onClick={() => setShowPass(v => !v)}>
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Botones ───────────────────────────────────────── */}
            <div className="cf-fade" style={{
              display: 'flex', justifyContent: 'flex-end', gap: '10px',
              animationDelay: '0.18s',
            }}>
              <button type="button" className="cf-btn-cancel"
                onClick={() => navigate('/panel/clientes')}>
                <X size={14} /> Cancelar
              </button>
              <button type="submit" className="cf-btn-save" disabled={saving}>
                <Save size={14} />
                {saving ? 'Guardando...' : isEdit ? 'Actualizar cliente' : 'Guardar cliente'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  )
}
