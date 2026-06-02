// F5.2 — Vista admin de auditoría.
// Consume GET /api/audit (solo abogado). Filtros: action (multi), userId, ip, rango.
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, LogIn, AlertTriangle, Download, Eye, Lock, Unlock,
  Trash2, RefreshCcw, KeyRound, Mail, UserCog, FileText, Bell,
  ChevronLeft, ChevronRight, Filter, X,
} from 'lucide-react'
import api from '../../services/axios.config'

// Vocabulario de acciones del backend (services/auditLogger.js → ACTIONS) + extras
const ACTION_META = {
  login:                      { label: 'Login',                 icon: LogIn,         color: '#86EFAC' },
  login_failed:               { label: 'Login fallido',         icon: AlertTriangle, color: '#FCA5A5' },
  otp_failed:                 { label: 'OTP fallido',           icon: AlertTriangle, color: '#FCD34D' },
  otp_success:                { label: 'OTP correcto',          icon: Shield,        color: '#86EFAC' },
  doc_download:               { label: 'Descarga doc.',         icon: Download,      color: '#93BBFC' },
  doc_preview:                { label: 'Vista doc.',            icon: Eye,           color: '#93BBFC' },
  doc_unlock:                 { label: 'Doc. desbloqueado',     icon: Unlock,        color: '#86EFAC' },
  doc_lock:                   { label: 'Doc. bloqueado',        icon: Lock,          color: '#FCD34D' },
  delete_caso:                { label: 'Caso eliminado',        icon: Trash2,        color: '#FCA5A5' },
  restore_caso:               { label: 'Caso restaurado',       icon: RefreshCcw,    color: '#86EFAC' },
  reset_request:              { label: 'Solicitud reset',       icon: KeyRound,      color: '#FCD34D' },
  reset_issued:               { label: 'Reset emitido',         icon: Mail,          color: '#93BBFC' },
  reset_consumed:             { label: 'Reset consumido',       icon: KeyRound,      color: '#86EFAC' },
  role_change:                { label: 'Cambio de rol',         icon: UserCog,       color: '#C4B5FD' },
  arco_acceso:                { label: 'ARCO acceso',           icon: FileText,      color: '#93BBFC' },
  arco_cancelacion_solicitada:{ label: 'ARCO cancelación',      icon: FileText,      color: '#FCD34D' },
  arco_anonimizado:           { label: 'ARCO anonimizado',      icon: Shield,        color: '#FCA5A5' },
  security_alert:             { label: 'Alerta seguridad',      icon: Bell,          color: '#FCA5A5' },
}

const DEFAULT_META = { label: '', icon: FileText, color: '#9CA3AF' }

const ACTION_OPTIONS = [
  '', 'login', 'login_failed', 'otp_failed',
  'doc_download', 'doc_preview', 'doc_unlock', 'doc_lock',
  'delete_caso', 'restore_caso',
  'reset_request', 'reset_issued', 'reset_consumed',
  'role_change',
  'arco_acceso', 'arco_cancelacion_solicitada', 'arco_anonimizado',
  'security_alert',
]

function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  const y  = dt.getFullYear()
  const m  = String(dt.getMonth() + 1).padStart(2, '0')
  const da = String(dt.getDate()).padStart(2, '0')
  const hh = String(dt.getHours()).padStart(2, '0')
  const mm = String(dt.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${da} ${hh}:${mm}`
}

const LIMIT = 25

export default function AuditoriaPage() {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')
  const [filtros, setFiltros] = useState({ action: '', userId: '', ip: '', desde: '', hasta: '' })
  const [expanded, setExpanded] = useState(null)   // id del row con metadata visible

  const fetchRows = useCallback(async (p = page) => {
    setLoading(true); setErr('')
    try {
      const params = { page: p, limit: LIMIT }
      if (filtros.action) params.action = filtros.action
      if (filtros.userId) params.userId = filtros.userId
      if (filtros.ip)     params.ip     = filtros.ip
      if (filtros.desde)  params.desde  = filtros.desde
      if (filtros.hasta)  params.hasta  = filtros.hasta
      const { data } = await api.get('/audit', { params })
      setRows(data.rows || [])
      setTotal(data.total || 0)
    } catch (e) {
      setErr(e.response?.data?.message ?? 'No se pudo cargar la auditoría')
      setRows([]); setTotal(0)
    } finally { setLoading(false) }
  }, [filtros, page])

  useEffect(() => { fetchRows(1); setPage(1) /* eslint-disable-next-line */ }, [filtros])
  useEffect(() => { fetchRows(page) /* eslint-disable-next-line */ }, [page])

  const limpiar = () => setFiltros({ action: '', userId: '', ip: '', desde: '', hasta: '' })
  const hayFiltros = !!(filtros.action || filtros.userId || filtros.ip || filtros.desde || filtros.hasta)
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        .au-input {
          width:100%; padding:9px 11px; border-radius:8px;
          background:rgba(8,20,48,0.55); color:rgba(255,255,255,0.92);
          border:1px solid rgba(201,168,76,0.18);
          font-family:'Inter',sans-serif; font-size:13px; outline:none;
          colorScheme:dark;
        }
        .au-input:focus { border-color:rgba(201,168,76,0.6); box-shadow:0 0 0 3px rgba(201,168,76,0.12); }
        .au-label { font-family:'Inter',sans-serif; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.5); margin-bottom:4px; display:block; }
        .au-row { transition: background 0.15s ease; }
        .au-row:hover { background:rgba(201,168,76,0.05); }
      `}</style>

      <div style={{ padding:'24px 28px', maxWidth:'1280px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
          <div style={{
            width:44, height:44, borderRadius:12,
            background:'rgba(201,168,76,0.12)',
            border:'1px solid rgba(201,168,76,0.28)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Shield size={22} style={{ color:'#C9A84C' }}/>
          </div>
          <div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", color:'rgba(255,255,255,0.97)', fontSize:'24px', margin:0 }}>Auditoría</h1>
            <p style={{ fontFamily:"'Inter',sans-serif", color:'rgba(255,255,255,0.45)', fontSize:'13px', margin:'2px 0 0' }}>
              Registro inmutable de eventos de seguridad · {total} {total === 1 ? 'evento' : 'eventos'}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div style={{
          background:'rgba(8,20,48,0.55)', padding:'16px 18px',
          border:'1px solid rgba(201,168,76,0.18)', borderRadius:'14px',
          marginBottom:'18px',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <Filter size={14} style={{ color:'#C9A84C' }}/>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:'rgba(201,168,76,0.75)', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>Filtros</span>
            {hayFiltros && (
              <button onClick={limpiar} style={{
                marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:6,
                background:'transparent', border:'1px solid rgba(252,165,165,0.3)',
                color:'#FCA5A5', padding:'4px 10px', borderRadius:8,
                fontFamily:"'Inter',sans-serif", fontSize:11, cursor:'pointer',
              }}>
                <X size={12}/> Limpiar
              </button>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12 }}>
            <div>
              <label className="au-label">Acción</label>
              <select className="au-input" value={filtros.action} onChange={e => setFiltros(f => ({ ...f, action: e.target.value }))}>
                {ACTION_OPTIONS.map(a => (
                  <option key={a || 'all'} value={a}>{a === '' ? '— todas —' : (ACTION_META[a]?.label || a)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="au-label">User ID</label>
              <input className="au-input" type="number" placeholder="ej. 42"
                value={filtros.userId} onChange={e => setFiltros(f => ({ ...f, userId: e.target.value }))}/>
            </div>
            <div>
              <label className="au-label">IP</label>
              <input className="au-input" type="text" placeholder="203.0.113.42"
                value={filtros.ip} onChange={e => setFiltros(f => ({ ...f, ip: e.target.value }))}/>
            </div>
            <div>
              <label className="au-label">Desde</label>
              <input className="au-input" type="date"
                value={filtros.desde} onChange={e => setFiltros(f => ({ ...f, desde: e.target.value }))}/>
            </div>
            <div>
              <label className="au-label">Hasta</label>
              <input className="au-input" type="date"
                value={filtros.hasta} onChange={e => setFiltros(f => ({ ...f, hasta: e.target.value }))}/>
            </div>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div style={{
            padding:'10px 14px', borderRadius:10, marginBottom:14,
            background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)',
            color:'#FCA5A5', fontFamily:"'Inter',sans-serif", fontSize:13,
          }}>{err}</div>
        )}

        {/* Tabla */}
        <div style={{
          background:'rgba(8,20,48,0.55)', border:'1px solid rgba(201,168,76,0.18)',
          borderRadius:14, overflow:'hidden',
        }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'Inter',sans-serif", fontSize:13 }}>
              <thead>
                <tr style={{ background:'rgba(201,168,76,0.06)' }}>
                  {['Fecha', 'Acción', 'Usuario', 'IP', 'Recurso', ''].map(h => (
                    <th key={h} style={{
                      textAlign:'left', padding:'12px 14px',
                      color:'rgba(201,168,76,0.85)', fontWeight:600,
                      fontSize:11, letterSpacing:1, textTransform:'uppercase',
                      borderBottom:'1px solid rgba(201,168,76,0.2)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 && (
                  <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'rgba(255,255,255,0.4)' }}>Cargando…</td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'rgba(255,255,255,0.4)' }}>
                    Sin eventos para los filtros actuales.
                  </td></tr>
                )}
                {rows.map(r => {
                  const meta = ACTION_META[r.action] || { ...DEFAULT_META, label: r.action }
                  const Icon = meta.icon
                  const isOpen = expanded === r.id
                  const hasMeta = r.metadata_json && typeof r.metadata_json === 'object' && Object.keys(r.metadata_json).length > 0
                  return (
                    <>
                      <tr key={r.id} className="au-row" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.85)' }}>
                        <td style={{ padding:'11px 14px', whiteSpace:'nowrap' }}>{fmtDate(r.created_at)}</td>
                        <td style={{ padding:'11px 14px' }}>
                          <span style={{
                            display:'inline-flex', alignItems:'center', gap:6,
                            padding:'4px 10px', borderRadius:8,
                            background:`${meta.color}1a`,
                            border:`1px solid ${meta.color}44`,
                            color: meta.color, fontWeight:600, fontSize:12,
                          }}>
                            <Icon size={12}/> {meta.label}
                          </span>
                        </td>
                        <td style={{ padding:'11px 14px' }}>{r.user_id ?? <span style={{ color:'rgba(255,255,255,0.3)' }}>—</span>}</td>
                        <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:12, color:'rgba(255,255,255,0.6)' }}>{r.ip || '—'}</td>
                        <td style={{ padding:'11px 14px', color:'rgba(255,255,255,0.6)' }}>
                          {r.resource_type ? `${r.resource_type}#${r.resource_id ?? '?'}` : '—'}
                        </td>
                        <td style={{ padding:'11px 14px', textAlign:'right' }}>
                          {hasMeta && (
                            <button onClick={() => setExpanded(isOpen ? null : r.id)} style={{
                              background:'transparent', border:'1px solid rgba(201,168,76,0.3)',
                              color:'#E8C97A', padding:'4px 10px', borderRadius:8,
                              fontFamily:"'Inter',sans-serif", fontSize:11, cursor:'pointer',
                            }}>
                              {isOpen ? 'Ocultar' : 'Detalle'}
                            </button>
                          )}
                        </td>
                      </tr>
                      <AnimatePresence>
                        {isOpen && hasMeta && (
                          <motion.tr
                            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                            key={`${r.id}-meta`} style={{ background:'rgba(2,8,24,0.55)' }}>
                            <td colSpan={6} style={{ padding:'14px 20px' }}>
                              <pre style={{
                                margin:0, fontFamily:'monospace', fontSize:12,
                                color:'rgba(232,201,122,0.85)',
                                background:'rgba(2,8,24,0.6)',
                                padding:'10px 12px', borderRadius:8,
                                overflowX:'auto', maxWidth:'100%',
                              }}>{JSON.stringify(r.metadata_json, null, 2)}</pre>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'12px 16px', borderTop:'1px solid rgba(201,168,76,0.15)',
            background:'rgba(2,8,24,0.4)',
          }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:'rgba(255,255,255,0.5)' }}>
              Página {page} de {totalPages} · {total} eventos
            </span>
            <div style={{ display:'flex', gap:8 }}>
              <button disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{
                  display:'inline-flex', alignItems:'center', gap:4,
                  background: page <= 1 ? 'transparent' : 'rgba(201,168,76,0.12)',
                  border:'1px solid rgba(201,168,76,0.25)',
                  color: page <= 1 ? 'rgba(255,255,255,0.25)' : '#E8C97A',
                  padding:'6px 12px', borderRadius:8,
                  fontFamily:"'Inter',sans-serif", fontSize:12,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                }}>
                <ChevronLeft size={14}/> Anterior
              </button>
              <button disabled={page >= totalPages || loading} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{
                  display:'inline-flex', alignItems:'center', gap:4,
                  background: page >= totalPages ? 'transparent' : 'rgba(201,168,76,0.12)',
                  border:'1px solid rgba(201,168,76,0.25)',
                  color: page >= totalPages ? 'rgba(255,255,255,0.25)' : '#E8C97A',
                  padding:'6px 12px', borderRadius:8,
                  fontFamily:"'Inter',sans-serif", fontSize:12,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                }}>
                Siguiente <ChevronRight size={14}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
