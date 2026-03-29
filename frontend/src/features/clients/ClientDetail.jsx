import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getClienteById } from './clientsService'
import { useAuth } from '../../context/AuthContext'
import {
  ArrowLeft, Pencil, User, Phone, Mail,
  MapPin, FileText, Calendar, Clock, StickyNote
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────
function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

// ── InfoRow ───────────────────────────────────────────────────────
function InfoRow({ label, value, icon: Icon }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      {Icon && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} style={{ color: 'rgba(201,168,76,0.7)' }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Inter',sans-serif", fontSize: '10px', fontWeight: '700',
          letterSpacing: '1.5px', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)', margin: '0 0 3px',
        }}>{label}</p>
        <p style={{
          fontFamily: "'Inter',sans-serif", fontSize: '13px', fontWeight: '500',
          color: 'rgba(255,255,255,0.85)', margin: 0, wordBreak: 'break-word',
        }}>{value}</p>
      </div>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────
function Card({ children, delay = '0s' }) {
  return (
    <div className="cd-fade" style={{
      background: 'rgba(8,20,48,0.75)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(201,168,76,0.14)', borderRadius: '16px',
      overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      animationDelay: delay,
    }}>
      {children}
    </div>
  )
}

function CardHeader({ icon: Icon, title }) {
  return (
    <div style={{
      padding: '16px 22px', borderBottom: '1px solid rgba(201,168,76,0.1)',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <div style={{
        width: '30px', height: '30px', borderRadius: '8px',
        background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={14} style={{ color: 'rgba(201,168,76,0.8)' }} />
      </div>
      <p style={{
        fontFamily: "'Playfair Display',serif", fontSize: '15px',
        fontWeight: '700', color: 'rgba(255,255,255,0.92)', margin: 0,
      }}>{title}</p>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
export default function ClientDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { canManageClients } = useAuth()

  const [cliente,  setCliente]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    getClienteById(id)
      .then(res => setCliente(res.data))
      .catch(() => setError('Error al cargar el cliente'))
      .finally(() => setLoading(false))
  }, [id])

  // ── Loading ───────────────────────────────────────────────────
  if (loading) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(160deg,#020818,#040d20)',
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

  if (error) return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'linear-gradient(160deg,#020818,#040d20)',
    }}>
      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: '#FCA5A5' }}>{error}</p>
    </div>
  )

  if (!cliente) return null

  const inicial = cliente.nombre?.charAt(0).toUpperCase() || '?'

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .cd-fade { animation: fadeUp 0.4s ease both; }

        .cd-btn-back {
          display:inline-flex; align-items:center; gap:7px;
          padding:8px 14px; border-radius:8px;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.1);
          color:rgba(255,255,255,0.65);
          font-family:'Inter',sans-serif; font-size:13px; font-weight:500;
          cursor:pointer; transition:all 0.15s ease;
        }
        .cd-btn-back:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); color:rgba(255,255,255,0.9); }

        .cd-btn-edit {
          display:inline-flex; align-items:center; gap:7px;
          padding:8px 16px; border-radius:8px;
          background:linear-gradient(135deg,#C9A84C 0%,#9A7A32 100%);
          border:none; color:#020818;
          font-family:'Inter',sans-serif; font-size:13px; font-weight:700;
          cursor:pointer; transition:all 0.15s ease;
        }
        .cd-btn-edit:hover { background:linear-gradient(135deg,#E8C97A 0%,#C9A84C 100%); transform:translateY(-1px); box-shadow:0 4px 14px rgba(201,168,76,0.3); }
      `}</style>

      <div style={{
        flex: 1, overflowY: 'auto', minHeight: '100vh',
        background: `
          radial-gradient(ellipse at 8% 15%, rgba(201,168,76,0.06) 0%, transparent 48%),
          radial-gradient(ellipse at 92% 85%, rgba(59,130,246,0.04) 0%, transparent 48%),
          linear-gradient(160deg,#020818 0%,#040d20 50%,#02050f 100%)
        `,
      }}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="cd-fade" style={{
          background: 'linear-gradient(135deg,rgba(6,16,40,0.97) 0%,rgba(12,26,56,0.9) 100%)',
          borderBottom: '1px solid rgba(201,168,76,0.14)',
          padding: '22px 36px 18px',
          position: 'relative', overflow: 'hidden',
        }}>
          {[160, 110].map((s, i) => (
            <div key={i} style={{
              position: 'absolute', top: -s * 0.4, right: -s * 0.4,
              width: s, height: s, borderRadius: '50%',
              border: `1px solid rgba(201,168,76,${0.06 - i * 0.02})`,
              pointerEvents: 'none',
            }} />
          ))}

          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Avatar */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                background: 'rgba(201,168,76,0.15)',
                border: '1px solid rgba(201,168,76,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: '22px', fontWeight: '700', color: '#C9A84C', lineHeight: 1,
                }}>{inicial}</span>
              </div>

              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginBottom: '5px', flexWrap: 'wrap',
                }}>
                  <span style={{
                    fontFamily: "'Inter',sans-serif", fontSize: '11px', fontWeight: '700',
                    color: 'rgba(201,168,76,0.85)',
                    background: 'rgba(201,168,76,0.1)',
                    border: '1px solid rgba(201,168,76,0.22)',
                    borderRadius: '5px', padding: '3px 9px', letterSpacing: '0.5px',
                  }}>
                    Cliente
                  </span>
                  {cliente.rfc && (
                    <span style={{
                      fontFamily: "'Inter',sans-serif", fontSize: '11px', fontWeight: '600',
                      color: 'rgba(255,255,255,0.45)',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '5px', padding: '3px 9px',
                    }}>
                      RFC: {cliente.rfc}
                    </span>
                  )}
                </div>
                <h1 style={{
                  fontFamily: "'Playfair Display',Georgia,serif",
                  fontSize: '22px', fontWeight: '700',
                  color: 'rgba(255,255,255,0.96)', margin: '0 0 3px',
                  textShadow: '0 2px 6px rgba(0,0,0,0.35)',
                }}>
                  {cliente.nombre}
                </h1>
                <p style={{
                  fontFamily: "'Inter',sans-serif", fontSize: '12px',
                  color: 'rgba(255,255,255,0.35)', margin: 0,
                }}>
                  Perfil del cliente · Registrado el {formatFecha(cliente.createdAt)}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="cd-btn-back" onClick={() => navigate('/panel/clientes')}>
                <ArrowLeft size={14} /> Volver
              </button>
              {canManageClients && (
                <button className="cd-btn-edit" onClick={() => navigate(`/panel/clientes/${id}/editar`)}>
                  <Pencil size={14} /> Editar cliente
                </button>
              )}
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: 0, left: '36px',
            width: '44px', height: '1px',
            background: 'linear-gradient(90deg,rgba(201,168,76,0.55),transparent)',
          }} />
        </div>

        {/* ── Contenido ─────────────────────────────────────────── */}
        <div style={{ padding: '24px 36px', maxWidth: '860px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Datos de contacto */}
            <Card delay="0.08s">
              <CardHeader icon={User} title="Datos de contacto" />
              <div style={{ padding: '4px 22px 8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                  <InfoRow label="Teléfono"   value={cliente.telefono}  icon={Phone}    />
                  <InfoRow label="Correo"     value={cliente.correo}    icon={Mail}     />
                  <InfoRow label="Dirección"  value={cliente.direccion} icon={MapPin}   />
                  <InfoRow label="RFC"        value={cliente.rfc}       icon={FileText} />
                </div>
              </div>
            </Card>

            {/* Notas */}
            {cliente.notas && (
              <Card delay="0.12s">
                <CardHeader icon={StickyNote} title="Notas internas" />
                <div style={{ padding: '18px 22px' }}>
                  <p style={{
                    fontFamily: "'Inter',sans-serif", fontSize: '13px',
                    color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, margin: 0,
                  }}>
                    {cliente.notas}
                  </p>
                </div>
              </Card>
            )}

            {/* Registro */}
            <Card delay="0.16s">
              <CardHeader icon={Calendar} title="Información del registro" />
              <div style={{ padding: '4px 22px 8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                  <InfoRow label="Fecha de registro"      value={formatFecha(cliente.createdAt)} icon={Calendar} />
                  <InfoRow label="Última actualización"   value={formatFecha(cliente.updatedAt)} icon={Clock}    />
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </>
  )
}
