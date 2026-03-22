/**
 * CasesPage — Legal Premium Design
 *
 * ── Typography Contract ────────────────────────────────────────────
 *  Playfair Display 700  →  page title, case asunto in table rows
 *  Inter 800             →  stat numbers on mini-cards
 *  Inter 600             →  CTA "Nuevo caso" button
 *  Inter 500             →  table headers (uppercase), filter chips active, badge text
 *  Inter 400             →  data cells (tipo, fecha), filter selects, search
 *  Inter 300             →  secondary data, empty state description
 *
 *  Gold uses (≤3):
 *    #1 — page title accent word "Casos"
 *    #2 — CTA button gradient
 *    #3 — folio badge text colour on hover
 */

import { useState, useEffect } from 'react'
import { useNavigate }          from 'react-router-dom'
import { useAuth }              from '../../context/AuthContext'
import { getCasos, deleteCaso } from './casesService'
import {
  Search, Plus, Eye, Pencil,
  Trash2, FolderOpen, ChevronLeft, ChevronRight,
} from 'lucide-react'

/* ── Design tokens ────────────────────────────────────────────────── */
const D = {
  fontDisplay:   "'Playfair Display', Georgia, serif",
  fontBody:      "'Inter', system-ui, sans-serif",
  textPrimary:   'rgba(255,255,255,0.95)',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted:     'rgba(255,255,255,0.30)',
  goldPrimary:   '#e8d48a',
  goldMuted:     'rgba(232,212,138,0.60)',
  goldGlow:      'rgba(232,212,138,0.15)',
  goldBorder:    'rgba(232,212,138,0.25)',
  glassLight:    'rgba(255,255,255,0.07)',
  glassMedium:   'rgba(255,255,255,0.12)',
  glassDark:     'rgba(0,0,0,0.45)',
  glassBorder:   'rgba(255,255,255,0.10)',
  statusActive:  { bg:'rgba(134,239,172,0.12)', text:'#86efac', border:'rgba(134,239,172,0.20)' },
  statusPending: { bg:'rgba(253,224,132,0.12)', text:'#fde08c', border:'rgba(253,224,132,0.20)' },
  statusUrgent:  { bg:'rgba(252,165,165,0.12)', text:'#fca5a5', border:'rgba(252,165,165,0.20)' },
  statusReview:  { bg:'rgba(147,197,253,0.12)', text:'#93c5fd', border:'rgba(147,197,253,0.20)' },
  statusClosed:  { bg:'rgba(148,163,184,0.12)', text:'#94a3b8', border:'rgba(148,163,184,0.20)' },
}

const ESTADOS = {
  activo:      { label:'Activo',      ...D.statusActive  },
  urgente:     { label:'Urgente',     ...D.statusUrgent  },
  pendiente:   { label:'Pendiente',   ...D.statusPending },
  en_revision: { label:'En revisión', ...D.statusReview  },
  cerrado:     { label:'Cerrado',     ...D.statusClosed  },
}

const TIPOS = [
  'Penal','Civil','Amparo','Sucesorio',
  'Contratos','Trámite de escrituras',
  'Inscripción de posesión','Asesoría legal',
]

const STATUS_CHIPS = [
  { value:'',           label:'Todos'       },
  { value:'activo',     label:'Activos'     },
  { value:'urgente',    label:'Urgentes'    },
  { value:'pendiente',  label:'Pendientes'  },
  { value:'en_revision',label:'En revisión' },
  { value:'cerrado',    label:'Cerrados'    },
]

export default function CasesPage() {
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
  const [hoveredRow,   setHoveredRow]   = useState(null)
  const [visible,      setVisible]      = useState(false)

  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  const fetchCasos = async () => {
    setLoading(true)
    try {
      const res = await getCasos({ search, tipo: filtroTipo, estado: filtroEstado, page, limit: 8 })
      setCasos(res.data.casos)
      setTotalPaginas(res.data.totalPaginas)
      setTotal(res.data.total)
    } catch { setError('Error al cargar los casos') }
    finally  { setLoading(false) }
  }

  useEffect(() => { fetchCasos() }, [search, filtroTipo, filtroEstado, page])

  const handleDelete = async (id, asunto) => {
    if (!confirm(`¿Eliminar el caso "${asunto}"?`)) return
    try { await deleteCaso(id); fetchCasos() }
    catch { alert('Error al eliminar el caso') }
  }

  const anim = (delay = 0) => ({
    opacity:   visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(12px)',
    transition: `opacity 0.45s ease ${delay}s, transform 0.45s ease ${delay}s`,
  })

  /* Quick stats from loaded page */
  const urgentes   = casos.filter(c => c.estado === 'urgente').length
  const pendientes = casos.filter(c => c.estado === 'pendiente').length
  const cerrados   = casos.filter(c => c.estado === 'cerrado').length

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@300;400;500;600;800&display=swap"
        rel="stylesheet"
      />

      <style>{`
        /* ── Page root ── */
        .lp-cases-root {
          flex: 1; overflow-y: auto; min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 50% at 20% 20%, rgba(30,58,95,0.60) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(232,212,138,0.04) 0%, transparent 50%),
            linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%);
          background-attachment: fixed;
        }

        /* ── Hero bar ── */
        .lp-hero {
          background: ${D.glassDark};
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border-bottom: 1px solid ${D.glassBorder};
          padding: 28px 36px 24px;
          display: flex; align-items: flex-end;
          justify-content: space-between; gap: 16px;
        }

        /* ── Stat mini-card ── */
        .lp-mini-stat {
          background: ${D.glassMedium};
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid ${D.glassBorder};
          border-top: 1px solid ${D.goldBorder};
          border-radius: 12px;
          padding: 14px 18px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: default;
        }
        .lp-mini-stat:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px ${D.goldBorder};
        }

        /* ── CTA button ── */
        .lp-btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #d4b860, ${D.goldPrimary});
          color: #0a0f1e;
          border: none; border-radius: 10px;
          font-family: ${D.fontBody};
          font-size: 13px; font-weight: 600; letter-spacing: 0.03em;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(232,212,138,0.25);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          white-space: nowrap;
        }
        .lp-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(232,212,138,0.35);
        }

        /* ── Filter chip ── */
        .lp-chip {
          padding: 6px 14px;
          border-radius: 999px;
          font-family: ${D.fontBody};
          font-size: 11px; font-weight: 400;
          border: 1px solid ${D.glassBorder};
          background: rgba(255,255,255,0.05);
          color: ${D.textSecondary};
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .lp-chip:hover { background: rgba(255,255,255,0.09); color: ${D.textPrimary}; }
        .lp-chip.active {
          background: rgba(232,212,138,0.12);
          border-color: ${D.goldBorder};
          color: ${D.goldPrimary};
          font-weight: 500;
        }

        /* ── Search + select inputs ── */
        .lp-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid ${D.glassBorder};
          border-radius: 10px;
          padding: 9px 14px;
          color: ${D.textPrimary};
          font-family: ${D.fontBody};
          font-size: 13px; font-weight: 400;
          backdrop-filter: blur(8px);
          outline: none;
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        }
        .lp-input::placeholder { color: ${D.textMuted}; }
        .lp-input:focus {
          border-color: ${D.goldMuted};
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 3px ${D.goldGlow};
        }
        .lp-input option { background: #0f172a; color: rgba(255,255,255,0.9); }

        /* ── Glass panel ── */
        .lp-panel {
          background: ${D.glassMedium};
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid ${D.glassBorder};
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06);
        }

        /* ── Case table ── */
        .lp-table { width: 100%; border-collapse: separate; border-spacing: 0 3px; }

        .lp-table thead th {
          font-family: ${D.fontBody};
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.10em; text-transform: uppercase;
          color: ${D.textSecondary};
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid ${D.glassBorder};
          white-space: nowrap;
        }
        .lp-table thead th:first-child { padding-left: 22px; }

        /* Row */
        .lp-tr {
          background: ${D.glassLight};
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: background 0.15s ease, box-shadow 0.15s ease;
          cursor: pointer;
        }
        .lp-tr:hover {
          background: rgba(255,255,255,0.11);
          box-shadow: 0 0 0 1px ${D.goldBorder}, 0 4px 16px rgba(0,0,0,0.20);
        }
        .lp-tr td {
          padding: 14px 16px;
          font-family: ${D.fontBody};
          font-size: 13px; font-weight: 400;
          color: ${D.textSecondary};
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          white-space: nowrap;
        }
        .lp-tr td:first-child {
          padding-left: 22px;
          border-left: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px 0 0 8px;
        }
        .lp-tr td:last-child {
          border-right: 1px solid rgba(255,255,255,0.05);
          border-radius: 0 8px 8px 0;
        }

        /* ── Action buttons ── */
        .lp-action {
          display: inline-flex; align-items: center; justify-content: center;
          width: 30px; height: 30px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px; cursor: pointer;
          color: ${D.textSecondary};
          transition: all 0.15s ease;
        }
        .lp-action:hover { background: rgba(255,255,255,0.12); color: ${D.textPrimary}; }
        .lp-action.view:hover { border-color: rgba(147,197,253,0.30); color: #93c5fd; }
        .lp-action.edit:hover { border-color: rgba(253,224,132,0.30); color: #fde08c; }
        .lp-action.del:hover  { border-color: rgba(252,165,165,0.30); color: #fca5a5; background: rgba(252,165,165,0.08); }

        /* ── Pagination ── */
        .lp-page-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid ${D.glassBorder};
          border-radius: 8px;
          font-family: ${D.fontBody};
          font-size: 12px; font-weight: 400;
          color: ${D.textSecondary};
          cursor: pointer; transition: all 0.15s ease;
        }
        .lp-page-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.10);
          border-color: ${D.goldBorder};
          color: ${D.textPrimary};
        }
        .lp-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ── Spinner ── */
        @keyframes lp-spin { to { transform: rotate(360deg); } }
        .lp-spinner {
          width: 28px; height: 28px;
          border: 2px solid rgba(255,255,255,0.10);
          border-top-color: ${D.goldPrimary};
          border-radius: 50%;
          animation: lp-spin 0.8s linear infinite;
        }
      `}</style>

      <div className="lp-cases-root">

        {/* ══ HERO BAR ════════════════════════════════════════════ */}
        <div className="lp-hero" style={anim(0)}>
          <div>
            {/* Eyebrow */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
              <div style={{ width:'16px', height:'1px', background: D.goldMuted }}/>
              <p style={{
                fontFamily: D.fontBody, fontSize:'10px', fontWeight:'500',
                letterSpacing:'0.14em', textTransform:'uppercase',
                color: D.goldMuted, margin:0,
              }}>
                Expedientes
              </p>
            </div>

            {/* Title — Playfair Display 700, gold accent #1 */}
            <h1 style={{
              fontFamily: D.fontDisplay,
              fontSize:'26px', fontWeight:'700',
              color: D.textPrimary, margin:'0 0 4px',
              textShadow:'0 2px 8px rgba(0,0,0,0.50)',
              letterSpacing:'-0.01em',
            }}>
              Casos{' '}
              <span style={{ color: D.goldPrimary }}>Jurídicos</span>
            </h1>

            {/* Subtitle — Inter 300 */}
            <p style={{
              fontFamily: D.fontBody, fontSize:'13px', fontWeight:'300',
              color: D.textSecondary, margin:0,
            }}>
              {total} expediente{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
            </p>
          </div>

          {/* CTA — gold gradient, gold use #2 */}
          {canEditCases && (
            <button className="lp-btn-primary" onClick={() => navigate('/panel/casos/nuevo')}>
              <Plus size={14} strokeWidth={2.5}/>
              Nuevo caso
            </button>
          )}
        </div>

        <div style={{ padding:'24px 36px', maxWidth:'1280px' }}>

          {/* ── Mini stat cards ─────────────────────────────────── */}
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(4,1fr)',
            gap:'12px', marginBottom:'20px', ...anim(0.07),
          }}>
            {[
              { label:'Total',      value: total,     color: D.goldPrimary,              numWeight:'800' },
              { label:'Urgentes',   value: urgentes,  color: D.statusUrgent.text,        numWeight:'800' },
              { label:'Pendientes', value: pendientes,color: D.statusPending.text,       numWeight:'800' },
              { label:'Cerrados',   value: cerrados,  color: D.statusClosed.text,        numWeight:'800' },
            ].map(s => (
              <div key={s.label} className="lp-mini-stat">
                {/* Number — Inter 800 */}
                <p style={{
                  fontFamily: D.fontBody,
                  fontSize:'28px', fontWeight:'800',
                  color: s.color, margin:'0 0 4px', lineHeight:1,
                  fontVariantNumeric:'tabular-nums',
                  letterSpacing:'-0.02em',
                }}>
                  {s.value}
                </p>
                {/* Label — Inter 500 uppercase */}
                <p style={{
                  fontFamily: D.fontBody,
                  fontSize:'9px', fontWeight:'500',
                  letterSpacing:'0.10em', textTransform:'uppercase',
                  color: D.textSecondary, margin:0,
                }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* ── Filters row ─────────────────────────────────────── */}
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'16px', ...anim(0.12) }}>
            {/* Search */}
            <div style={{ position:'relative', flex:'1', minWidth:'200px' }}>
              <Search size={13} style={{
                position:'absolute', left:'12px', top:'50%',
                transform:'translateY(-50%)', color: D.textMuted, pointerEvents:'none',
              }}/>
              <input
                type="text"
                className="lp-input"
                style={{ width:'100%', paddingLeft:'34px', boxSizing:'border-box' }}
                placeholder="Buscar por folio o asunto…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>

            {/* Tipo select */}
            <select
              className="lp-input"
              style={{ minWidth:'180px' }}
              value={filtroTipo}
              onChange={e => { setFiltroTipo(e.target.value); setPage(1) }}
            >
              <option value="">Todos los tipos</option>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Status chips */}
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'20px', ...anim(0.16) }}>
            {STATUS_CHIPS.map(chip => (
              <button
                key={chip.value}
                className={`lp-chip${filtroEstado === chip.value ? ' active' : ''}`}
                onClick={() => { setFiltroEstado(chip.value); setPage(1) }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* ── Glass table panel ───────────────────────────────── */}
          <div className="lp-panel" style={anim(0.20)}>

            {loading ? (
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'64px' }}>
                <div className="lp-spinner"/>
              </div>

            ) : error ? (
              <div style={{
                textAlign:'center', padding:'64px',
                fontFamily: D.fontBody, fontSize:'13px',
                color:'#fca5a5',
              }}>
                {error}
              </div>

            ) : casos.length === 0 ? (
              <div style={{ textAlign:'center', padding:'72px 24px' }}>
                <FolderOpen size={40} style={{ margin:'0 auto 14px', display:'block', color: D.textMuted, opacity:0.4 }}/>
                {/* Empty title — Playfair Display */}
                <p style={{
                  fontFamily: D.fontDisplay, fontSize:'18px', fontWeight:'700',
                  color: D.textSecondary, margin:'0 0 8px',
                }}>
                  Sin expedientes
                </p>
                {/* Empty sub — Inter 300 */}
                <p style={{
                  fontFamily: D.fontBody, fontSize:'13px', fontWeight:'300',
                  color: D.textMuted, margin:0,
                }}>
                  {search || filtroTipo || filtroEstado
                    ? 'No se encontraron casos con los filtros aplicados'
                    : 'Aún no hay casos registrados en el sistema'}
                </p>
              </div>

            ) : (
              <>
                <table className="lp-table">
                  <thead>
                    <tr>
                      <th>Folio</th>
                      <th>Asunto</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Apertura</th>
                      <th style={{ textAlign:'right', paddingRight:'22px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {casos.map(caso => {
                      const e = ESTADOS[caso.estado] || ESTADOS.activo
                      const isHov = hoveredRow === caso.id_caso
                      return (
                        <tr
                          key={caso.id_caso}
                          className="lp-tr"
                          onMouseEnter={() => setHoveredRow(caso.id_caso)}
                          onMouseLeave={() => setHoveredRow(null)}
                          onClick={() => navigate(`/panel/casos/${caso.id_caso}`)}
                        >
                          {/* Folio — gold text on hover (gold use #3 conditional) */}
                          <td>
                            <span style={{
                              display:'inline-block',
                              background: isHov ? 'rgba(232,212,138,0.10)' : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${isHov ? D.goldBorder : 'rgba(255,255,255,0.08)'}`,
                              borderRadius:'6px',
                              padding:'3px 9px',
                              fontFamily: D.fontBody,
                              fontSize:'10px', fontWeight:'600',
                              color: isHov ? D.goldPrimary : D.textMuted,
                              letterSpacing:'0.05em',
                              fontVariantNumeric:'tabular-nums',
                              transition:'all 0.15s ease',
                            }}>
                              {caso.folio}
                            </span>
                          </td>

                          {/* Asunto — Playfair Display 700 */}
                          <td style={{ maxWidth:'220px' }}>
                            <p style={{
                              fontFamily: D.fontDisplay,
                              fontSize:'14px', fontWeight:'700',
                              color: D.textPrimary, margin:0,
                              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                              textShadow:'0 1px 2px rgba(0,0,0,0.40)',
                            }}>
                              {caso.asunto}
                            </p>
                          </td>

                          {/* Tipo — Inter 400, pill */}
                          <td>
                            <span style={{
                              display:'inline-block',
                              background:'rgba(255,255,255,0.05)',
                              border:'1px solid rgba(255,255,255,0.08)',
                              borderRadius:'6px',
                              padding:'3px 9px',
                              fontFamily: D.fontBody,
                              fontSize:'11px', fontWeight:'400',
                              color: D.textSecondary,
                            }}>
                              {caso.tipo}
                            </span>
                          </td>

                          {/* Estado — pastel badge */}
                          <td>
                            <span style={{
                              display:'inline-flex', alignItems:'center', gap:'5px',
                              padding:'3px 10px', borderRadius:'999px',
                              background: e.bg, color: e.text,
                              border:`1px solid ${e.border}`,
                              fontFamily: D.fontBody,
                              fontSize:'11px', fontWeight:'500',
                            }}>
                              <span style={{
                                width:'5px', height:'5px', borderRadius:'50%',
                                background: e.text,
                                boxShadow:`0 0 5px ${e.text}`,
                              }}/>
                              {e.label}
                            </span>
                          </td>

                          {/* Fecha apertura — Inter 400 tabular */}
                          <td style={{ fontVariantNumeric:'tabular-nums' }}>
                            {caso.fecha_apertura
                              ? new Date(caso.fecha_apertura + 'T12:00:00').toLocaleDateString('es-MX', {
                                  day:'2-digit', month:'short', year:'numeric',
                                })
                              : '—'}
                          </td>

                          {/* Actions */}
                          <td onClick={e => e.stopPropagation()}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'6px' }}>
                              <button
                                className="lp-action view"
                                title="Ver detalle"
                                onClick={() => navigate(`/panel/casos/${caso.id_caso}`)}
                              >
                                <Eye size={13}/>
                              </button>
                              {canEditCases && (
                                <>
                                  <button
                                    className="lp-action edit"
                                    title="Editar caso"
                                    onClick={() => navigate(`/panel/casos/${caso.id_caso}/editar`)}
                                  >
                                    <Pencil size={13}/>
                                  </button>
                                  <button
                                    className="lp-action del"
                                    title="Eliminar caso"
                                    onClick={() => handleDelete(caso.id_caso, caso.asunto)}
                                  >
                                    <Trash2 size={13}/>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPaginas > 1 && (
                  <div style={{
                    padding:'14px 22px',
                    borderTop:`1px solid rgba(255,255,255,0.06)`,
                    background:'rgba(0,0,0,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                  }}>
                    <p style={{
                      fontFamily: D.fontBody, fontSize:'12px', fontWeight:'400',
                      color: D.textMuted, margin:0,
                    }}>
                      Página{' '}
                      <span style={{ color: D.textSecondary, fontWeight:'500' }}>{page}</span>
                      {' '}de {totalPaginas}
                    </p>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button
                        className="lp-page-btn"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                      >
                        <ChevronLeft size={13}/> Anterior
                      </button>
                      <button
                        className="lp-page-btn"
                        disabled={page === totalPaginas}
                        onClick={() => setPage(p => Math.min(totalPaginas, p + 1))}
                      >
                        Siguiente <ChevronRight size={13}/>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}