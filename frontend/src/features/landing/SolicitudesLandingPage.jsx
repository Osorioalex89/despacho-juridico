import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/axios.config'
import { CheckCircle, CheckSquare, Mail, RefreshCw, Inbox, XCircle, Phone, MessageCircle } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
function toLocalStr(d) {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function formatFecha(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${parseInt(d)} ${meses[parseInt(m) - 1]} ${y}`
}

function isNueva(createdAt) {
  if (!createdAt) return false
  const diff = Date.now() - new Date(createdAt).getTime()
  return diff < 24 * 60 * 60 * 1000
}

// ── Badge "Nueva" dorado ──────────────────────────────────────────────────────
function BadgeNueva() {
  return (
    <span
      translate="no"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '999px',
        background: 'linear-gradient(135deg, rgba(232,201,122,0.22), rgba(201,168,76,0.12))',
        border: '1px solid rgba(201,168,76,0.50)',
        color: '#E8C97A',
        fontFamily: "'Inter', sans-serif",
        fontSize: '10px',
        fontWeight: '700',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        boxShadow: '0 0 8px rgba(201,168,76,0.18)',
      }}
    >
      <span style={{
        width: '5px', height: '5px', borderRadius: '50%',
        background: '#E8C97A',
        animation: 'pulse-nueva 1.8s ease-in-out infinite',
        flexShrink: 0,
      }} />
      Nueva
    </span>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
// ── Modal de confirmación ─────────────────────────────────────────────────────
function ConfirmarModal({ cita, onClose, onConfirmado }) {
  const hoy = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const [fecha, setFecha]           = useState(hoy)
  const [hora, setHora]             = useState('10:00')
  const [enviando, setEnviando]     = useState(false)
  const [err, setErr]               = useState(null)
  const [crearPortal, setCrearPortal] = useState(false)

  const nombre     = cita.Cliente?.nombre || '—'
  const tienePortal = Boolean(cita.Cliente?.id_usuario)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fecha || !hora) { setErr('Ingresa fecha y hora.'); return }
    setEnviando(true)
    setErr(null)
    try {
      await api.patch(`/citas/${cita.id_cita}/estado`, {
        estado: 'confirmada',
        fecha,
        hora: hora.length === 5 ? hora + ':00' : hora,
      })

      // Crear cuenta de portal si el abogado lo activó
      if (crearPortal && cita.id_cliente && !tienePortal) {
        try {
          await api.post(`/clientes/${cita.id_cliente}/crear-cuenta`)
        } catch (portalErr) {
          console.error('Error creando cuenta portal:', portalErr)
          // No bloqueamos — la cita ya fue confirmada
        }
      }

      onConfirmado(cita.id_cita)
    } catch (e) {
      console.error(e)
      setErr('No se pudo confirmar la cita. Intenta de nuevo.')
      setEnviando(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(2,8,24,0.80)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '420px',
          background: 'rgba(6,16,40,0.97)',
          border: '1px solid rgba(201,168,76,0.28)',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          padding: '2rem',
        }}
      >
        {/* Título */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p translate="no" style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '10px', fontWeight: '700',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#C9A84C', margin: '0 0 0.5rem',
          }}>
            Confirmar cita
          </p>
          <h2 translate="no" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.3rem', fontWeight: '700',
            color: 'rgba(255,255,255,0.95)', margin: 0,
          }}>
            {nombre}
          </h2>
          <p translate="no" style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px', color: 'rgba(255,255,255,0.40)',
            margin: '0.3rem 0 0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {cita.motivo}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Fecha */}
          <div style={{ marginBottom: '1rem' }}>
            <label translate="no" style={{
              display: 'block',
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px', fontWeight: '600',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(201,168,76,0.70)',
              marginBottom: '6px',
            }}>
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              min={hoy}
              onChange={e => setFecha(e.target.value)}
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(201,168,76,0.22)',
                color: 'rgba(255,255,255,0.88)',
                fontFamily: "'Inter', sans-serif", fontSize: '14px',
                outline: 'none',
                colorScheme: 'dark',
              }}
            />
          </div>

          {/* Hora */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label translate="no" style={{
              display: 'block',
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px', fontWeight: '600',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(201,168,76,0.70)',
              marginBottom: '6px',
            }}>
              Hora
            </label>
            <input
              type="time"
              value={hora}
              onChange={e => setHora(e.target.value)}
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(201,168,76,0.22)',
                color: 'rgba(255,255,255,0.88)',
                fontFamily: "'Inter', sans-serif", fontSize: '14px',
                outline: 'none',
                colorScheme: 'dark',
              }}
            />
          </div>

          {/* Checkbox crear portal — solo si el cliente no tiene cuenta */}
          {!tienePortal && (
            <label
              translate="no"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                marginBottom: '1.25rem', cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={crearPortal}
                onChange={e => setCrearPortal(e.target.checked)}
                style={{ marginTop: '2px', accentColor: '#C9A84C', cursor: 'pointer' }}
              />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12.5px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                Crear acceso al portal para este cliente
                <br />
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
                  Se enviar&#225; un correo con sus credenciales de acceso
                </span>
              </span>
            </label>
          )}

          {err && (
            <p translate="no" style={{
              fontFamily: "'Inter', sans-serif", fontSize: '12px',
              color: 'rgba(252,165,165,0.85)',
              margin: '0 0 1rem',
            }}>
              {err}
            </p>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              translate="no"
              style={{
                flex: 1, padding: '10px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.55)',
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px', fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              translate="no"
              style={{
                flex: 2, padding: '10px',
                borderRadius: '8px',
                background: enviando
                  ? 'rgba(34,197,94,0.08)'
                  : 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(34,197,94,0.10))',
                border: '1px solid rgba(34,197,94,0.35)',
                color: 'rgba(134,239,172,0.92)',
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px', fontWeight: '700',
                cursor: enviando ? 'not-allowed' : 'pointer',
                opacity: enviando ? 0.65 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              <CheckCircle size={14} strokeWidth={2.2} />
              {enviando ? 'Confirmando…' : 'Confirmar cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function SolicitudesLandingPage() {
  const [citas, setCitas]             = useState([])
  const [confirmadas, setConfirmadas] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [modalCita, setModalCita]     = useState(null)
  const [rechazando, setRechazando]   = useState(new Set())
  const [completando, setCompletando] = useState(new Set())
  const [contactMenu, setContactMenu] = useState(null)

  const fetchCitas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/citas', { params: { limit: 1000 } })
      const todas = res.data?.citas ?? res.data ?? []
      const pendientes = todas
        .filter(c => c.estado === 'pendiente')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      const confLanding = todas
        .filter(c => c.estado === 'confirmada' && !c.id_caso)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setCitas(pendientes)
      setConfirmadas(confLanding)
    } catch (err) {
      console.error('Error fetching solicitudes:', err)
      setError('No se pudieron cargar las solicitudes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCitas() }, [fetchCitas])

  // Abre el modal de confirmación
  const handleConfirmar = (cita) => {
    setModalCita(cita)
  }

  // Llamado por el modal cuando la API responde OK
  const handleConfirmado = (id_cita) => {
    setCitas(prev => prev.filter(c => c.id_cita !== id_cita))
    setModalCita(null)
  }

  const handleCompletar = async (cita) => {
    if (!cita.id_cliente) return
    setCompletando(prev => new Set([...prev, cita.id_cita]))
    try {
      await api.patch(`/clientes/${cita.id_cliente}/completar-asesoria`)
      setConfirmadas(prev => prev.filter(c => c.id_cita !== cita.id_cita))
    } catch (e) {
      console.error('Error completando asesoría:', e)
    } finally {
      setCompletando(prev => { const next = new Set(prev); next.delete(cita.id_cita); return next })
    }
  }

  const handleRechazar = async (cita) => {
    setRechazando(prev => new Set([...prev, cita.id_cita]))
    try {
      await api.patch(`/citas/${cita.id_cita}/rechazar`)
      setCitas(prev => prev.filter(c => c.id_cita !== cita.id_cita))
    } catch (e) {
      console.error('Error rechazando solicitud:', e)
      setRechazando(prev => { const next = new Set(prev); next.delete(cita.id_cita); return next })
    }
  }

  const handleWhatsApp = (cita) => {
    const telefono = cita.Cliente?.telefono || ''
    const nombre   = cita.Cliente?.nombre || 'Cliente'
    const digits   = telefono.replace(/\D/g, '')
    if (!digits) return
    const phone = digits.length === 10 ? '52' + digits : digits
    const text  = encodeURIComponent(
      `Estimado/a ${nombre}, le contactamos del Despacho Jurídico Sánchez en respuesta a su solicitud de asesoría. ¿Podría proporcionarnos más detalles sobre su caso?`
    )
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  const handleEmail = (cita) => {
    const nombre  = cita.Cliente?.nombre || 'Cliente'
    const correo  = cita.Cliente?.correo || ''
    const motivo  = cita.motivo || ''
    const subject = encodeURIComponent(`Seguimiento a solicitud de asesoría — ${motivo}`)
    const body    = encodeURIComponent(
      `Estimado/a ${nombre},\n\nMe comunico en respuesta a su solicitud de asesoría registrada.\n\nAsunto: ${motivo}\n\nQuedo a su disposición para atender su caso.\n\nAtte.\nLic. Horacio Sánchez Cerino\nDespacho Jurídico Sánchez`
    )
    window.location.href = `mailto:${correo}?subject=${subject}&body=${body}`
  }

  // ── Estado vacío ─────────────────────────────────────────────────
  const EmptyState = () => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '4rem 2rem', gap: '1rem',
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '16px',
        background: 'rgba(201,168,76,0.08)',
        border: '1px solid rgba(201,168,76,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Inbox size={28} color="rgba(201,168,76,0.55)" strokeWidth={1.5} />
      </div>
      <p translate="no" style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.05rem', fontWeight: '600',
        color: 'rgba(255,255,255,0.70)',
        margin: 0,
      }}>
        Sin solicitudes pendientes
      </p>
      <p translate="no" style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '0.82rem',
        color: 'rgba(255,255,255,0.35)',
        margin: 0,
      }}>
        Todas las solicitudes han sido atendidas.
      </p>
    </div>
  )

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px' }}>

      <style>{`
        @keyframes pulse-nueva {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
        .sl-row:hover { background: rgba(255,255,255,0.025) !important; }
        .sl-btn-confirm {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 13px; border-radius: 7px;
          background: rgba(34,197,94,0.12);
          border: 1px solid rgba(34,197,94,0.30);
          color: rgba(134,239,172,0.92);
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s ease;
          white-space: nowrap;
        }
        .sl-btn-confirm:hover:not(:disabled) {
          background: rgba(34,197,94,0.20);
          border-color: rgba(34,197,94,0.50);
        }
        .sl-btn-confirm:disabled { opacity: 0.55; cursor: not-allowed; }
        .sl-btn-contact {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 13px; border-radius: 7px;
          background: rgba(201,168,76,0.09);
          border: 1px solid rgba(201,168,76,0.25);
          color: rgba(201,168,76,0.88);
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s ease;
          text-decoration: none; white-space: nowrap;
        }
        .sl-btn-contact:hover {
          background: rgba(201,168,76,0.17);
          border-color: rgba(201,168,76,0.45);
        }
        .sl-btn-reject {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 13px; border-radius: 7px;
          background: rgba(252,165,165,0.09);
          border: 1px solid rgba(252,165,165,0.28);
          color: rgba(252,165,165,0.90);
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s ease;
          white-space: nowrap;
        }
        .sl-btn-reject:hover:not(:disabled) {
          background: rgba(252,165,165,0.17);
          border-color: rgba(252,165,165,0.50);
        }
        .sl-btn-reject:disabled { opacity: 0.55; cursor: not-allowed; }
        .sl-btn-complete {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 13px; border-radius: 7px;
          background: rgba(147,187,252,0.09);
          border: 1px solid rgba(147,187,252,0.28);
          color: rgba(147,187,252,0.92);
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s ease;
          white-space: nowrap;
        }
        .sl-btn-complete:hover:not(:disabled) {
          background: rgba(147,187,252,0.17);
          border-color: rgba(147,187,252,0.50);
        }
        .sl-btn-complete:disabled { opacity: 0.55; cursor: not-allowed; }
        .sl-contact-menu {
          position: absolute; top: calc(100% + 4px); left: 0;
          z-index: 50; min-width: 140px;
          background: rgba(6,16,40,0.98);
          border: 1px solid rgba(201,168,76,0.25);
          border-radius: 9px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.55);
          overflow: hidden;
        }
        .sl-contact-menu button {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 10px 14px;
          border: none; border-radius: 0;
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 600;
          cursor: pointer; text-align: left;
          transition: background 0.14s ease;
        }
        .sl-menu-whatsapp {
          background: rgba(34,197,94,0.08);
          color: rgba(134,239,172,0.92);
        }
        .sl-menu-whatsapp:hover { background: rgba(34,197,94,0.18) !important; }
        .sl-menu-gmail {
          background: rgba(239,68,68,0.07);
          color: rgba(252,165,165,0.88);
          border-top: 1px solid rgba(255,255,255,0.06) !important;
        }
        .sl-menu-gmail:hover { background: rgba(239,68,68,0.16) !important; }
        @media (max-width: 700px) {
          .sl-table-wrap { overflow-x: auto; }
          .sl-hide-mobile { display: none !important; }
        }
      `}</style>

      {/* ── Encabezado ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span translate="no" style={{
              display: 'inline-block',
              padding: '3px 12px', borderRadius: '999px',
              border: '1px solid rgba(201,168,76,0.30)',
              background: 'rgba(201,168,76,0.06)',
              color: '#C9A84C',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.65rem', fontWeight: '700',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              marginBottom: '0.6rem',
            }}>
              Landing Page
            </span>
            <h1 translate="no" style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.35rem, 2.5vw, 1.75rem)',
              fontWeight: '700',
              color: 'rgba(255,255,255,0.95)',
              margin: 0, lineHeight: 1.2,
            }}>
              Solicitudes de Asesoría
            </h1>
            <p translate="no" style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.82rem',
              color: 'rgba(255,255,255,0.40)',
              margin: '0.4rem 0 0',
            }}>
              {loading ? 'Cargando…' : `${citas.length} solicitud${citas.length !== 1 ? 'es' : ''} pendiente${citas.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Botón refrescar */}
          <button
            onClick={fetchCitas}
            disabled={loading}
            translate="no"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px',
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.22)',
              color: 'rgba(201,168,76,0.80)',
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(201,168,76,0.14)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.08)' }}
          >
            <RefreshCw size={14} strokeWidth={2.2} style={{ animation: loading ? 'spin-icon 0.8s linear infinite' : 'none' }} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────── */}
      {error && (
        <div translate="no" style={{
          padding: '12px 16px', borderRadius: '9px',
          background: 'rgba(252,165,165,0.08)',
          border: '1px solid rgba(252,165,165,0.22)',
          color: 'rgba(252,165,165,0.85)',
          fontFamily: "'Inter', sans-serif", fontSize: '0.83rem',
          marginBottom: '1.5rem',
        }}>
          {error}
        </div>
      )}

      {/* ── Tabla ──────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: '14px',
        border: '1px solid rgba(201,168,76,0.15)',
        background: 'rgba(8,20,48,0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        overflow: 'visible',
        position: 'relative',
        zIndex: 50,
      }}>
        {/* Cabecera de tabla */}
        <div style={{
          padding: '0.85rem 1.4rem',
          background: 'rgba(201,168,76,0.06)',
          borderBottom: '1px solid rgba(201,168,76,0.12)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 180px 120px 100px 160px',
            gap: '1rem',
            alignItems: 'center',
          }}>
            {['Cliente', 'Correo', 'Teléfono', 'Fecha', 'Acciones'].map((h, i) => (
              <span key={h} translate="no" className={i === 2 ? 'sl-hide-mobile' : ''} style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '10.5px', fontWeight: '700',
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'rgba(201,168,76,0.65)',
              }}>
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* Filas */}
        <div className="sl-table-wrap">
          {loading && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '3rem', gap: '10px',
              fontFamily: "'Inter', sans-serif", fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.40)',
            }}>
              <span style={{
                width: '18px', height: '18px',
                border: '2px solid rgba(201,168,76,0.20)',
                borderTop: '2px solid #C9A84C',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin-icon 0.7s linear infinite',
              }} />
              Cargando solicitudes...
            </div>
          )}

          {!loading && citas.length === 0 && <EmptyState />}

          {!loading && citas.map((cita, idx) => {
            const nombre  = cita.Cliente?.nombre || '—'
            const correo  = cita.Cliente?.correo || '—'
            const telefono = cita.Cliente?.telefono || '—'
            const nueva   = isNueva(cita.createdAt)

            return (
              <div
                key={cita.id_cita}
                className="sl-row"
                style={{
                  padding: '1rem 1.4rem',
                  borderBottom: idx < citas.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  transition: 'background 0.15s ease',
                  background: nueva ? 'rgba(201,168,76,0.03)' : 'transparent',
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 180px 120px 100px 160px',
                  gap: '1rem',
                  alignItems: 'center',
                }}>

                  {/* Cliente + badge Nueva + motivo */}
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <span translate="no" style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px', fontWeight: '600',
                        color: 'rgba(255,255,255,0.90)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: '180px', display: 'block',
                      }}>
                        {nombre}
                      </span>
                      {nueva && <BadgeNueva />}
                    </div>
                    <p
                      translate="no"
                      title={cita.motivo}
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.42)',
                        margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: '220px',
                      }}
                    >
                      {cita.motivo}
                    </p>
                  </div>

                  {/* Correo */}
                  <span translate="no" style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12.5px',
                    color: 'rgba(255,255,255,0.55)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {correo}
                  </span>

                  {/* Teléfono */}
                  <span translate="no" className="sl-hide-mobile" style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12.5px',
                    color: 'rgba(255,255,255,0.50)',
                  }}>
                    {telefono}
                  </span>

                  {/* Fecha */}
                  <span translate="no" style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.45)',
                    whiteSpace: 'nowrap',
                  }}>
                    {formatFecha(cita.fecha)}
                  </span>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      className="sl-btn-confirm"
                      onClick={() => handleConfirmar(cita)}
                      translate="no"
                    >
                      <CheckCircle size={13} strokeWidth={2.2} />
                      Confirmar
                    </button>

                    <button
                      className="sl-btn-reject"
                      onClick={() => handleRechazar(cita)}
                      disabled={rechazando.has(cita.id_cita)}
                      translate="no"
                    >
                      <XCircle size={13} strokeWidth={2.2} />
                      {rechazando.has(cita.id_cita) ? 'Rechazando…' : 'Rechazar'}
                    </button>

                    <div style={{ position: 'relative' }}>
                      <button
                        className="sl-btn-contact"
                        onClick={() => setContactMenu(contactMenu === cita.id_cita ? null : cita.id_cita)}
                        translate="no"
                      >
                        <Phone size={13} strokeWidth={2} />
                        Contactar
                      </button>

                      <AnimatePresence>
                        {contactMenu === cita.id_cita && (
                          <motion.div
                            className="sl-contact-menu"
                            translate="no"
                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.96 }}
                            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <button
                              className="sl-menu-whatsapp"
                              onClick={() => { handleWhatsApp(cita); setContactMenu(null) }}
                            >
                              <MessageCircle size={13} strokeWidth={2} />
                              WhatsApp
                            </button>
                            <button
                              className="sl-menu-gmail"
                              onClick={() => { handleEmail(cita); setContactMenu(null) }}
                            >
                              <Mail size={13} strokeWidth={2} />
                              Gmail
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Asesorías confirmadas (landing, pendientes de cierre) ─── */}
      {!loading && confirmadas.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 translate="no" style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.1rem', fontWeight: '700',
              color: 'rgba(255,255,255,0.80)',
              margin: '0 0 0.25rem',
            }}>
              Asesorías confirmadas
            </h2>
            <p translate="no" style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.35)',
              margin: 0,
            }}>
              Asesor&#237;as atendidas que a&#250;n no han sido cerradas
            </p>
          </div>

          <div style={{
            borderRadius: '14px',
            border: '1px solid rgba(147,187,252,0.15)',
            background: 'rgba(8,20,48,0.55)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}>
            {/* Cabecera */}
            <div style={{
              padding: '0.75rem 1.4rem',
              background: 'rgba(147,187,252,0.05)',
              borderBottom: '1px solid rgba(147,187,252,0.10)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 120px 160px', gap: '1rem' }}>
                {['Cliente', 'Correo', 'Fecha', 'Acción'].map(h => (
                  <span key={h} translate="no" style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '10.5px', fontWeight: '700',
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: 'rgba(147,187,252,0.55)',
                  }}>{h}</span>
                ))}
              </div>
            </div>

            {/* Filas */}
            {confirmadas.map((cita, idx) => (
              <div
                key={cita.id_cita}
                className="sl-row"
                style={{
                  padding: '0.9rem 1.4rem',
                  borderBottom: idx < confirmadas.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 120px 160px', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <span translate="no" style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px', fontWeight: '600',
                      color: 'rgba(255,255,255,0.85)',
                      display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {cita.Cliente?.nombre || '—'}
                    </span>
                    <span translate="no" style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '11px', color: 'rgba(255,255,255,0.35)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                    }}>
                      {cita.motivo}
                    </span>
                  </div>
                  <span translate="no" style={{
                    fontFamily: "'Inter', sans-serif", fontSize: '12.5px',
                    color: 'rgba(255,255,255,0.50)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {cita.Cliente?.correo || '—'}
                  </span>
                  <span translate="no" style={{
                    fontFamily: "'Inter', sans-serif", fontSize: '12px',
                    color: 'rgba(255,255,255,0.40)', whiteSpace: 'nowrap',
                  }}>
                    {formatFecha(cita.fecha)}
                  </span>
                  <button
                    className="sl-btn-complete"
                    onClick={() => handleCompletar(cita)}
                    disabled={completando.has(cita.id_cita)}
                    translate="no"
                  >
                    <CheckSquare size={13} strokeWidth={2.2} />
                    {completando.has(cita.id_cita) ? 'Cerrando…' : 'Completada'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin-icon { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Backdrop para cerrar menú Contactar ────────────────────── */}
      {contactMenu !== null && (
        <div
          onClick={() => setContactMenu(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 49 }}
        />
      )}

      {/* ── Modal de confirmación ───────────────────────────────────── */}
      {modalCita && (
        <ConfirmarModal
          cita={modalCita}
          onClose={() => setModalCita(null)}
          onConfirmado={handleConfirmado}
        />
      )}
    </div>
  )
}
