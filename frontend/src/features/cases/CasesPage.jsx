import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCasos, deleteCaso } from './casesService'
import { useToast, Toast } from '../../components/ui/Toast'
import {
  Search, Plus, Eye, Pencil, Trash2,
  FolderOpen, X, Scale, AlertTriangle,
  Clock, CheckCircle, XCircle, FileSearch
} from 'lucide-react'

// ── Tipos de caso del despacho ────────────────────────────────────
const TIPOS = [
  'Penal', 'Civil', 'Amparo', 'Sucesorio',
  'Contratos', 'Trámite de escrituras',
  'Inscripción de posesión', 'Asesoría legal',
]

// ── Estado config ─────────────────────────────────────────────────
const ESTADO = {
  activo:      { label: 'Activo',      bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.28)',  text: '#93BBFC', dot: '#3B82F6' },
  urgente:     { label: 'Urgente',     bg: 'rgba(239,68,68,0.13)',   border: 'rgba(239,68,68,0.3)',    text: '#FCA5A5', dot: '#EF4444' },
  pendiente:   { label: 'Pendiente',   bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.28)',  text: '#FCD34D', dot: '#F59E0B' },
  en_revision: { label: 'En revisión', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.28)',  text: '#C4B5FD', dot: '#8B5CF6' },
  cerrado:     { label: 'Cerrado',     bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.28)', text: '#9CA3AF', dot: '#6B7280' },
}

// ── Tipo chip colors ──────────────────────────────────────────────
const TIPO_COLOR = {
  'Penal':                   { bg: 'rgba(239,68,68,0.1)',   text: '#FCA5A5',  border: 'rgba(239,68,68,0.2)'   },
  'Civil':                   { bg: 'rgba(59,130,246,0.1)',  text: '#93BBFC',  border: 'rgba(59,130,246,0.2)'  },
  'Amparo':                  { bg: 'rgba(139,92,246,0.1)',  text: '#C4B5FD',  border: 'rgba(139,92,246,0.2)'  },
  'Sucesorio':               { bg: 'rgba(245,158,11,0.1)',  text: '#FCD34D',  border: 'rgba(245,158,11,0.2)'  },
  'Contratos':               { bg: 'rgba(34,197,94,0.1)',   text: '#86EFAC',  border: 'rgba(34,197,94,0.2)'   },
  'Trámite de escrituras':   { bg: 'rgba(201,168,76,0.1)',  text: '#E8C97A',  border: 'rgba(201,168,76,0.2)'  },
  'Inscripción de posesión': { bg: 'rgba(20,184,166,0.1)',  text: '#5EEAD4',  border: 'rgba(20,184,166,0.2)'  },
  'Asesoría legal':          { bg: 'rgba(249,115,22,0.1)',  text: '#FDBA74',  border: 'rgba(249,115,22,0.2)'  },
}

function Badge({ estado }) {
  const c = ESTADO[estado] || ESTADO.activo
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: '4px', padding: '3px 9px',
      fontFamily: "'Inter', sans-serif",
      fontSize: '11px', fontWeight: '600', color: c.text,
      whiteSpace: 'nowrap', flexShrink: 0,
      letterSpacing: '0.02em',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.dot, flexShrink: 0 }}/>
      {c.label}
    </span>
  )
}

function TipoBadge({ tipo }) {
  const c = TIPO_COLOR[tipo] || { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.1)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: '4px', padding: '3px 8px',
      fontFamily: "'Inter', sans-serif",
      fontSize: '11px', fontWeight: '500', color: c.text,
      whiteSpace: 'nowrap',
    }}>
      {tipo}
    </span>
  )
}

// ── Stat card superior ────────────────────────────────────────────
const ESTADO_CHIPS = [
  { key: '',           label: 'Todos',       icon: FolderOpen  },
  { key: 'activo',     label: 'Activos',     icon: CheckCircle },
  { key: 'urgente',    label: 'Urgentes',    icon: AlertTriangle },
  { key: 'pendiente',  label: 'Pendientes',  icon: Clock       },
  { key: 'en_revision',label: 'En revisión', icon: FileSearch  },
  { key: 'cerrado',    label: 'Cerrados',    icon: XCircle     },
]

export default function CasesPage() {
  const { toast, showToast } = useToast()
  const { canEditCases } = useAuth()
  const navigate = useNavigate()

  const [casos,        setCasos]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filtroTipo,   setFiltroTipo]   = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [page,         setPage]         = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total,        setTotal]        = useState(0)
  const [error,        setError]        = useState('')
  const [deleteId,     setDeleteId]     = useState(null)
  const [showTipoMenu, setShowTipoMenu] = useState(false)

  const fetchCasos = async () => {
    setLoading(true)
    try {
      const res = await getCasos({
        search, tipo: filtroTipo, estado: filtroEstado, page, limit: 8,
      })
      setCasos(res.data.casos)
      setTotalPaginas(res.data.totalPaginas)
      setTotal(res.data.total)
    } catch {
      setError('Error al cargar los casos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCasos() }, [search, filtroTipo, filtroEstado, page])

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteCaso(deleteId)
      setDeleteId(null)
      fetchCasos()
    } catch { showToast('Error al eliminar') }
  }

  // Conteo por estado para las stat cards
  const countByEstado = (e) => casos.filter(c => c.estado === e).length

  return (
    <>
      <Toast toast={toast} />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .cs-fade { animation: fadeUp 0.4s ease both; }

        .cs-row {
          display: grid; align-items: center;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .cs-row:hover {
          background: rgba(201,168,76,0.04);
          border-bottom-color: rgba(201,168,76,0.09);
        }
        .cs-row:last-child { border-bottom: none; }

        .cs-search:focus {
          outline: none;
          border-color: rgba(201,168,76,0.5) !important;
          background: rgba(201,168,76,0.04) !important;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.1) !important;
        }
        .cs-search::placeholder { color: rgba(255,255,255,0.22); }

        .cs-action {
          width: 30px; height: 30px; border-radius: 7px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s ease;
          color: rgba(255,255,255,0.4);
        }
        .cs-action:hover.view { background:rgba(59,130,246,0.12); border-color:rgba(59,130,246,0.25); color:#93BBFC; }
        .cs-action:hover.edit { background:rgba(201,168,76,0.12); border-color:rgba(201,168,76,0.25); color:#E8C97A; }
        .cs-action:hover.del  { background:rgba(239,68,68,0.12);  border-color:rgba(239,68,68,0.25);  color:#FCA5A5; }

        .cs-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s ease;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.55);
        }
        .cs-chip:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.85); border-color: rgba(255,255,255,0.15); }
        .cs-chip.active {
          background: linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.08) 100%);
          border-color: rgba(201,168,76,0.35);
          color: rgba(201,168,76,0.95);
        }
        .cs-chip.urgente.active { background:rgba(239,68,68,0.15); border-color:rgba(239,68,68,0.3); color:#FCA5A5; }
        .cs-chip.pendiente.active { background:rgba(245,158,11,0.15); border-color:rgba(245,158,11,0.3); color:#FCD34D; }
        .cs-chip.en_revision.active { background:rgba(139,92,246,0.15); border-color:rgba(139,92,246,0.3); color:#C4B5FD; }
        .cs-chip.cerrado.active { background:rgba(107,114,128,0.15); border-color:rgba(107,114,128,0.25); color:#9CA3AF; }

        .cs-btn-primary {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 8px;
          background: linear-gradient(135deg, #C9A84C 0%, #9A7A32 100%);
          border: none; color: #020818;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.15s ease;
        }
        .cs-btn-primary:hover {
          background: linear-gradient(135deg, #E8C97A 0%, #C9A84C 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(201,168,76,0.3);
        }

        .cs-page-btn {
          padding: 7px 14px; border-radius: 8px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
          cursor: pointer; transition: all 0.15s ease;
        }
        .cs-page-btn:hover:not(:disabled) { background:rgba(201,168,76,0.1); border-color:rgba(201,168,76,0.3); color:rgba(201,168,76,0.9); }
        .cs-page-btn:disabled { opacity:0.3; cursor:not-allowed; }

        .tipo-dropdown {
          position: absolute; top: calc(100% + 6px); left: 0;
          min-width: 200px; z-index: 30;
          background: rgba(6,16,40,0.97);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(201,168,76,0.25);
          border-radius: 12px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.6);
          overflow: hidden;
          animation: fadeUp 0.15s ease both;
        }
        .tipo-opt {
          padding: 9px 14px;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.65);
          cursor: pointer; transition: all 0.12s ease;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .tipo-opt:last-child { border-bottom: none; }
        .tipo-opt:hover { background: rgba(201,168,76,0.08); color: rgba(201,168,76,0.9); }
        .tipo-opt.selected { color: rgba(201,168,76,0.95); background: rgba(201,168,76,0.06); }

        .cs-modal-bg {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          background: rgba(2,8,24,0.85);
          backdrop-filter: blur(8px);
        }
      `}</style>

      {/* ── Root background ─────────────────────────────────── */}
      <div
        style={{
          flex: 1, overflowY: 'auto', minHeight: '100vh',
          background: `
            radial-gradient(ellipse at 8% 15%,  rgba(201,168,76,0.06) 0%, transparent 48%),
            radial-gradient(ellipse at 92% 85%,  rgba(139,92,246,0.04) 0%, transparent 48%),
            radial-gradient(ellipse at 50% 50%,  rgba(8,20,48,0.5) 0%, transparent 68%),
            linear-gradient(160deg, #020818 0%, #040d20 50%, #02050f 100%)
          `,
        }}
        onClick={() => showTipoMenu && setShowTipoMenu(false)}
      >

        {/* ── Page header ──────────────────────────────────── */}
        <div className="cs-fade" style={{
          background: 'linear-gradient(135deg, rgba(6,16,40,0.97) 0%, rgba(12,26,56,0.9) 100%)',
          borderBottom: '1px solid rgba(201,168,76,0.14)',
          padding: '28px 36px 24px',
          position: 'relative', overflow: 'hidden',
        }}>
          {[180, 120].map((s, i) => (
            <div key={i} style={{
              position: 'absolute', top: -s * 0.4, right: -s * 0.4,
              width: s, height: s, borderRadius: '50%',
              border: `1px solid rgba(201,168,76,${0.06 - i * 0.02})`,
              pointerEvents: 'none',
            }}/>
          ))}

          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'flex-end',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
          }}>
            <div>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: '700',
                letterSpacing: '3px', textTransform: 'uppercase',
                color: 'rgba(201,168,76,0.85)', margin: '0 0 8px',
              }}>
                Expedientes Jurídicos
              </p>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '26px', fontWeight: '700',
                color: 'rgba(255,255,255,0.96)', margin: '0 0 4px',
                textShadow: '0 2px 6px rgba(0,0,0,0.35)',
              }}>
                Gestión de Casos
              </h1>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: '13px',
                color: 'rgba(255,255,255,0.38)', margin: 0,
              }}>
                {total > 0
                  ? `${total} expediente${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`
                  : 'Sin expedientes aún'}
              </p>
            </div>

            {canEditCases && (
              <button className="cs-btn-primary" onClick={() => navigate('/panel/casos/nuevo')}>
                <Plus size={15}/>
                Nuevo caso
              </button>
            )}
          </div>

          <div style={{
            position: 'absolute', bottom: 0, left: '36px',
            width: '48px', height: '1px',
            background: 'linear-gradient(90deg, rgba(201,168,76,0.55), transparent)',
          }}/>
        </div>

        <div style={{ padding: '24px 36px', maxWidth: '1300px' }}>

          {/* ── Stat cards por estado ─────────────────────── */}
          <div className="cs-fade" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            gap: '12px', marginBottom: '20px',
            animationDelay: '0.06s',
          }}>
            {[
              { estado: 'activo',      label: 'Activos',      color: '#3B82F6', colorBg: 'rgba(59,130,246,0.1)',  borderC: 'rgba(59,130,246,0.2)'  },
              { estado: 'urgente',     label: 'Urgentes',     color: '#EF4444', colorBg: 'rgba(239,68,68,0.1)',   borderC: 'rgba(239,68,68,0.2)'   },
              { estado: 'pendiente',   label: 'Pendientes',   color: '#F59E0B', colorBg: 'rgba(245,158,11,0.1)',  borderC: 'rgba(245,158,11,0.2)'  },
              { estado: 'cerrado',     label: 'Cerrados',     color: '#6B7280', colorBg: 'rgba(107,114,128,0.08)',borderC: 'rgba(107,114,128,0.15)' },
            ].map((s, i) => (
              <div
                key={s.estado}
                onClick={() => { setFiltroEstado(filtroEstado === s.estado ? '' : s.estado); setPage(1) }}
                style={{
                  background: filtroEstado === s.estado
                    ? `${s.colorBg}`
                    : 'rgba(8,20,48,0.7)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${filtroEstado === s.estado ? s.borderC : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '14px',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  animationDelay: `${0.08 + i * 0.05}s`,
                }}
              >
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: '700',
                  letterSpacing: '2px', textTransform: 'uppercase',
                  color: filtroEstado === s.estado ? s.color : 'rgba(255,255,255,0.35)',
                  margin: '0 0 8px',
                  transition: 'color 0.2s ease',
                }}>
                  {s.label}
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '32px', fontWeight: '800',
                  color: filtroEstado === s.estado ? s.color : 'rgba(255,255,255,0.9)',
                  margin: 0, lineHeight: 1, letterSpacing: '-1px',
                  transition: 'color 0.2s ease',
                }}>
                  {countByEstado(s.estado)}
                </p>
              </div>
            ))}
          </div>

          {/* ── Tabla principal ───────────────────────────── */}
          <div className="cs-fade" style={{
            background: 'rgba(8,20,48,0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(201,168,76,0.16)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
            overflow: 'hidden',
            animationDelay: '0.18s',
          }}>

            {/* ── Toolbar ─────────────────────────────────── */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(201,168,76,0.1)',
              display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
            }}>

              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={14} style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.28)', pointerEvents: 'none',
                }}/>
                <input
                  className="cs-search"
                  type="text"
                  placeholder="Buscar por folio o asunto…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  style={{
                    width: '100%', padding: '9px 12px 9px 34px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.88)',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px', transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                  }}
                />
                {search && (
                  <button onClick={() => { setSearch(''); setPage(1) }}
                    style={{
                      position: 'absolute', right: '10px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.3)', display: 'flex',
                    }}>
                    <X size={13}/>
                  </button>
                )}
              </div>

              {/* Tipo dropdown */}
              <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setShowTipoMenu(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '9px 14px', borderRadius: '10px',
                    background: filtroTipo ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${filtroTipo ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    color: filtroTipo ? 'rgba(201,168,76,0.9)' : 'rgba(255,255,255,0.55)',
                    fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: '600',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Scale size={13}/>
                  {filtroTipo || 'Tipo de caso'}
                  {filtroTipo && (
                    <span
                      onClick={e => { e.stopPropagation(); setFiltroTipo(''); setPage(1) }}
                      style={{ marginLeft: '2px', opacity: 0.7, display: 'flex' }}>
                      <X size={11}/>
                    </span>
                  )}
                </button>

                {showTipoMenu && (
                  <div className="tipo-dropdown">
                    <div
                      className={`tipo-opt${!filtroTipo ? ' selected' : ''}`}
                      onClick={() => { setFiltroTipo(''); setPage(1); setShowTipoMenu(false) }}
                    >
                      Todos los tipos
                    </div>
                    {TIPOS.map(t => (
                      <div
                        key={t}
                        className={`tipo-opt${filtroTipo === t ? ' selected' : ''}`}
                        onClick={() => { setFiltroTipo(t); setPage(1); setShowTipoMenu(false) }}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chips de estado */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ESTADO_CHIPS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    className={`cs-chip${filtroEstado === key ? ' active' : ''}${key ? ` ${key}` : ''}`}
                    onClick={() => { setFiltroEstado(key); setPage(1) }}
                  >
                    <Icon size={11}/>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '110px 1.8fr 130px 1fr 110px 96px',
              padding: '10px 24px 9px',
              background: 'rgba(4,12,32,0.85)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              {['Folio', 'Asunto', 'Tipo', 'Cliente', 'Estado', 'Acciones'].map(h => (
                <div key={h} style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '10px', fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: '0.09em',
                  color: 'rgba(201,168,76,0.65)',
                }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Body */}
            {loading ? (
              <div>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '110px 1.8fr 130px 1fr 110px 96px',
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    gap: '16px', alignItems: 'center',
                  }}>
                    {[80, 90, 60, 70, 50, 40].map((w, j) => (
                      <div key={j} style={{
                        height: '11px', borderRadius: '6px',
                        background: 'rgba(255,255,255,0.06)',
                        width: `${w}%`,
                      }}/>
                    ))}
                  </div>
                ))}
              </div>
            ) : error ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#FCA5A5' }}>
                  {error}
                </p>
              </div>
            ) : casos.length === 0 ? (
              /* Empty state */
              <div style={{
                padding: '64px 24px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '16px',
                  background: 'rgba(201,168,76,0.06)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '18px',
                }}>
                  <FolderOpen size={24} style={{ color: 'rgba(201,168,76,0.4)' }}/>
                </div>
                <p style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: '700',
                  color: 'rgba(255,255,255,0.65)', margin: '0 0 8px',
                }}>
                  {search || filtroTipo || filtroEstado ? 'Sin resultados' : 'Sin expedientes registrados'}
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '13px',
                  color: 'rgba(255,255,255,0.32)', margin: '0 0 24px', maxWidth: '280px',
                }}>
                  {search || filtroTipo || filtroEstado
                    ? 'Ajusta los filtros para ver más resultados.'
                    : 'Crea el primer expediente del despacho.'}
                </p>
                {canEditCases && !search && !filtroTipo && !filtroEstado && (
                  <button className="cs-btn-primary" onClick={() => navigate('/panel/casos/nuevo')}>
                    <Plus size={14}/> Nuevo caso
                  </button>
                )}
              </div>
            ) : (
              casos.map((caso, idx) => (
                <div
                  key={caso.id_caso}
                  className="cs-row"
                  style={{ gridTemplateColumns: '110px 1.8fr 130px 1fr 110px 96px' }}
                  onClick={() => navigate(`/panel/casos/${caso.id_caso}`)}
                >
                  {/* Folio */}
                  <div>
                    <span style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '11px', fontWeight: '700',
                      color: 'rgba(201,168,76,0.85)',
                      letterSpacing: '0.4px',
                      background: 'rgba(201,168,76,0.08)',
                      border: '1px solid rgba(201,168,76,0.18)',
                      borderRadius: '5px',
                      padding: '3px 7px',
                    }}>
                      {caso.folio}
                    </span>
                  </div>

                  {/* Asunto */}
                  <div style={{ minWidth: 0, paddingRight: '12px' }}>
                    <p style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '13px', fontWeight: '600',
                      color: 'rgba(255,255,255,0.9)', margin: '0 0 2px',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {caso.asunto}
                    </p>
                    <p style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '11px', color: 'rgba(255,255,255,0.35)',
                      margin: 0,
                    }}>
                      Apertura: {new Date(caso.fecha_apertura + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Tipo */}
                  <div>
                    <TipoBadge tipo={caso.tipo}/>
                  </div>

                  {/* Cliente */}
                  <div style={{ minWidth: 0, paddingRight: '8px' }}>
                    <p style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '12px', fontWeight: '500',
                      color: 'rgba(255,255,255,0.55)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      margin: 0,
                    }}>
                      {caso.id_cliente ? `Cliente #${caso.id_cliente}` : '—'}
                    </p>
                  </div>

                  {/* Estado */}
                  <div>
                    <Badge estado={caso.estado}/>
                  </div>

                  {/* Acciones */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button className="cs-action view" title="Ver detalle"
                      onClick={() => navigate(`/panel/casos/${caso.id_caso}`)}>
                      <Eye size={13}/>
                    </button>
                    {canEditCases && (
                      <>
                        <button className="cs-action edit" title="Editar"
                          onClick={() => navigate(`/panel/casos/${caso.id_caso}/editar`)}>
                          <Pencil size={13}/>
                        </button>
                        <button className="cs-action del" title="Eliminar"
                          onClick={() => setDeleteId(caso.id_caso)}>
                          <Trash2 size={13}/>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div style={{
                padding: '13px 24px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(4,12,32,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '12px',
                  color: 'rgba(255,255,255,0.28)', margin: 0,
                }}>
                  Página {page} de {totalPaginas} · {total} expedientes
                </p>
                <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
                  <button className="cs-page-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}>
                    ← Anterior
                  </button>
                  {[...Array(Math.min(5, totalPaginas))].map((_, i) => {
                    const p = i + 1
                    return (
                      <button key={p} onClick={() => setPage(p)} style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: '600',
                        background: page === p ? 'linear-gradient(135deg,#C9A84C,#9A7A32)' : 'rgba(255,255,255,0.04)',
                        border: page === p ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        color: page === p ? '#020818' : 'rgba(255,255,255,0.55)',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}>
                        {p}
                      </button>
                    )
                  })}
                  <button className="cs-page-btn"
                    onClick={() => setPage(p => Math.min(totalPaginas, p + 1))}
                    disabled={page === totalPaginas}>
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal eliminación ────────────────────────────── */}
      {deleteId && (
        <div className="cs-modal-bg" onClick={() => setDeleteId(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: '420px',
            background: 'rgba(6,16,40,0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '20px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.7)',
            padding: '28px 32px',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '18px',
            }}>
              <Trash2 size={22} style={{ color: '#FCA5A5' }}/>
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '19px', fontWeight: '700',
              color: 'rgba(255,255,255,0.95)', margin: '0 0 10px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}>
              Eliminar expediente
            </h2>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: '13px',
              color: 'rgba(255,255,255,0.48)', margin: '0 0 28px', lineHeight: 1.6,
            }}>
              Esta acción es permanente. Se eliminará el expediente y todos sus documentos y citas vinculadas.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={{
                padding: '9px 18px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)',
                fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: '500',
                cursor: 'pointer',
              }}>
                Cancelar
              </button>
              <button onClick={confirmDelete} style={{
                padding: '9px 18px', borderRadius: '8px',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#FCA5A5',
                fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: '600',
                cursor: 'pointer',
              }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}