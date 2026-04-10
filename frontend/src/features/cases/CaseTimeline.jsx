import { useState, useEffect } from 'react'
import { Scale, FileText, CalendarDays, MessageSquare, RefreshCw, Clock } from 'lucide-react'
import { getTimeline } from './casesService'

const ICON_MAP = {
  Scale,
  FileText,
  CalendarDays,
  MessageSquare,
  RefreshCw,
}

const TIPO_LABEL = {
  apertura:   'Apertura',
  documento:  'Documento',
  cita:       'Cita',
  comentario: 'Comentario',
  estado:     'Cambio de estado',
}

const CITA_ESTADO_COLOR = {
  pendiente:  '#FCD34D',
  confirmada: '#86EFAC',
  cancelada:  '#FCA5A5',
}

function formatFechaTimeline(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatHora(hora) {
  if (!hora) return ''
  const [h, m] = hora.split(':')
  const hNum = parseInt(h)
  return ` · ${hNum > 12 ? hNum - 12 : hNum || 12}:${m} ${hNum >= 12 ? 'pm' : 'am'}`
}

export default function CaseTimeline({ casoId }) {
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    setLoading(true)
    getTimeline(casoId)
      .then(res => setEvents(res.data.timeline || []))
      .catch(() => setError('No se pudo cargar el historial'))
      .finally(() => setLoading(false))
  }, [casoId])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 0' }}>
      <div style={{
        width:'28px', height:'28px', borderRadius:'50%',
        border:'2px solid rgba(201,168,76,0.25)',
        borderTopColor:'#C9A84C',
        animation:'spin 0.8s linear infinite',
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ textAlign:'center', padding:'48px 0' }}>
      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'#FCA5A5', margin:0 }}>{error}</p>
    </div>
  )

  if (events.length === 0) return (
    <div style={{ textAlign:'center', padding:'60px 0' }}>
      <Clock size={28} style={{ color:'rgba(255,255,255,0.12)', margin:'0 auto 12px', display:'block' }}/>
      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.28)', margin:0 }}>
        No hay eventos en el historial
      </p>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes tl-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .tl-item { animation: tl-fade 0.35s ease both; }
        .tl-card {
          background: rgba(8,20,48,0.65);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 14px 18px;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .tl-card:hover {
          border-color: rgba(201,168,76,0.2);
          background: rgba(8,20,48,0.85);
        }
      `}</style>

      <div style={{ position:'relative', paddingLeft:'44px' }}>

        {/* Línea vertical dorada */}
        <div style={{
          position: 'absolute',
          left: '15px',
          top: '18px',
          bottom: '18px',
          width: '2px',
          background: 'linear-gradient(to bottom, #C9A84C 0%, rgba(201,168,76,0.15) 85%, transparent 100%)',
          borderRadius: '2px',
        }}/>

        {events.map((ev, idx) => {
          const Icon = ICON_MAP[ev.icono] || Scale
          const delay = `${idx * 0.06}s`

          return (
            <div
              key={idx}
              className="tl-item"
              style={{ position:'relative', marginBottom:'20px', animationDelay:delay }}
            >
              {/* Nodo en la línea */}
              <div style={{
                position: 'absolute',
                left: '-36px',
                top: '14px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: `rgba(${hexToRgb(ev.color)},0.12)`,
                border: `1.5px solid ${ev.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 0 10px rgba(${hexToRgb(ev.color)},0.2)`,
              }}>
                <Icon size={12} style={{ color: ev.color }} />
              </div>

              {/* Card del evento */}
              <div className="tl-card">
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', marginBottom:'6px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                    <span style={{
                      fontFamily:"'Inter',sans-serif",
                      fontSize:'10px', fontWeight:'700',
                      letterSpacing:'1px', textTransform:'uppercase',
                      color: ev.color,
                      background: `rgba(${hexToRgb(ev.color)},0.1)`,
                      border: `1px solid rgba(${hexToRgb(ev.color)},0.22)`,
                      borderRadius:'4px', padding:'2px 7px',
                    }}>
                      {TIPO_LABEL[ev.tipo] || ev.tipo}
                    </span>
                    {ev.tipo === 'cita' && ev.meta?.estado && (
                      <span style={{
                        fontFamily:"'Inter',sans-serif",
                        fontSize:'10px', fontWeight:'600',
                        color: CITA_ESTADO_COLOR[ev.meta.estado] || '#FCD34D',
                        opacity: 0.85,
                      }}>
                        {ev.meta.estado}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontFamily:"'Inter',sans-serif",
                    fontSize:'11px', fontWeight:'500',
                    color:'rgba(255,255,255,0.3)',
                    whiteSpace:'nowrap', flexShrink:0,
                  }}>
                    {formatFechaTimeline(ev.fecha)}
                    {ev.tipo === 'cita' && ev.meta?.hora ? formatHora(ev.meta.hora) : ''}
                  </span>
                </div>

                <p style={{
                  fontFamily:"'Inter',sans-serif",
                  fontSize:'13px', fontWeight:'500',
                  color:'rgba(255,255,255,0.78)',
                  margin:0, lineHeight:1.55,
                  wordBreak:'break-word',
                  display: ev.tipo === 'comentario' ? '-webkit-box' : undefined,
                  WebkitLineClamp: ev.tipo === 'comentario' ? 3 : undefined,
                  WebkitBoxOrient: ev.tipo === 'comentario' ? 'vertical' : undefined,
                  overflow: ev.tipo === 'comentario' ? 'hidden' : undefined,
                }}>
                  {ev.descripcion}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// Convierte hex (#C9A84C) a "r,g,b" para usar en rgba()
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '201,168,76'
  return `${parseInt(result[1],16)},${parseInt(result[2],16)},${parseInt(result[3],16)}`
}
