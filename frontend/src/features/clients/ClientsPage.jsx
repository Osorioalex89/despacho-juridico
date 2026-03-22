/**
 * ClientsPage — Legal Premium Design
 *
 * ── Typography Contract ────────────────────────────────────────────
 *  Playfair Display 700  →  page title "Gestión de Clientes", client names in rows
 *  Inter 600             →  CTA button "Nuevo cliente"
 *  Inter 500             →  table headers (uppercase), search placeholder, pagination
 *  Inter 400             →  data cells (email, phone, address), action icons tooltip
 *  Inter 300             →  secondary data, empty state description
 *
 *  Glass level:
 *    Hero bar   → Deep  (blur 28px, rgba(0,0,0,0.45))
 *    Table panel → Standard (blur 16px, rgba(255,255,255,0.12))
 *    Table rows  → Subtle   (blur  8px, rgba(255,255,255,0.07)) on hover
 *
 *  Gold uses (≤3):
 *    #1 — page title accent word
 *    #2 — "Nuevo cliente" CTA button gradient
 *    #3 — avatar initial ring on hover
 */

import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { useAuth }             from '../../context/AuthContext'
import { getClientes, deleteCliente } from './clientsService'
import {
  Search, Plus, Pencil, Trash2,
  Eye, Users, ChevronLeft, ChevronRight,
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
}

/* ── Avatar colour palette (cycles through clients) ──────────────── */
const AVATAR_GRADIENTS = [
  ['rgba(30,58,95,0.9)',   'rgba(15,23,42,0.95)'],
  ['rgba(55,48,163,0.8)', 'rgba(15,23,42,0.95)'],
  ['rgba(6,78,59,0.8)',   'rgba(15,23,42,0.95)'],
  ['rgba(120,53,15,0.8)', 'rgba(15,23,42,0.95)'],
  ['rgba(88,28,135,0.8)', 'rgba(15,23,42,0.95)'],
]

export default function ClientsPage() {
  const { canManageClients } = useAuth()
  const navigate = useNavigate()

  const [clientes,     setClientes]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [page,         setPage]         = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total,        setTotal]        = useState(0)
  const [error,        setError]        = useState('')
  const [hoveredRow,   setHoveredRow]   = useState(null)
  const [visible,      setVisible]      = useState(false)

  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  const fetchClientes = async () => {
    setLoading(true)
    try {
      const res = await getClientes({ search, page, limit: 8 })
      setClientes(res.data.clientes)
      setTotalPaginas(res.data.totalPaginas)
      setTotal(res.data.total)
    } catch {
      setError('Error al cargar los clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClientes() }, [search, page])

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1) }

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar al cliente "${nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteCliente(id)
      fetchClientes()
    } catch {
      alert('Error al eliminar el cliente')
    }
  }

  const anim = (delay = 0) => ({
    opacity:   visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(12px)',
    transition: `opacity 0.45s ease ${delay}s, transform 0.45s ease ${delay}s`,
  })

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@300;400;500;600;800&display=swap"
        rel="stylesheet"
      />

      <style>{`
        /* ── Page background ── */
        .lp-clients-root {
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
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 16px;
        }

        /* ── CTA button — gold gradient (gold use #2) ── */
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

        /* ── Search input — form-input spec ── */
        .lp-search {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid ${D.glassBorder};
          border-radius: 10px;
          padding: 10px 14px 10px 38px;
          color: ${D.textPrimary};
          font-family: ${D.fontBody};
          font-size: 13px; font-weight: 400;
          backdrop-filter: blur(8px);
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
          outline: none;
        }
        .lp-search::placeholder { color: ${D.textMuted}; }
        .lp-search:focus {
          border-color: ${D.goldMuted};
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 3px ${D.goldGlow};
        }

        /* ── Glass panel (table container) ── */
        .lp-panel {
          background: ${D.glassMedium};
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid ${D.glassBorder};
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06);
        }

        /* ── Table ── */
        .lp-table { width: 100%; border-collapse: separate; border-spacing: 0 3px; }

        .lp-table thead th {
          font-family: ${D.fontBody};
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.10em; text-transform: uppercase;
          color: ${D.textSecondary};
          padding: 14px 18px;
          text-align: left;
          border-bottom: 1px solid ${D.glassBorder};
          white-space: nowrap;
        }
        .lp-table thead th:first-child { padding-left: 22px; }

        /* ── Table row — subtle glass ── */
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
          padding: 14px 18px;
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

        /* ── Action icon buttons ── */
        .lp-action {
          display: inline-flex; align-items: center; justify-content: center;
          width: 30px; height: 30px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px;
          cursor: pointer; transition: all 0.15s ease;
          color: ${D.textSecondary};
        }
        .lp-action:hover { background: rgba(255,255,255,0.12); color: ${D.textPrimary}; }
        .lp-action.view:hover  { border-color: rgba(147,197,253,0.3); color: #93c5fd; }
        .lp-action.edit:hover  { border-color: rgba(253,224,132,0.3); color: #fde08c; }
        .lp-action.del:hover   { border-color: rgba(252,165,165,0.3); color: #fca5a5; background: rgba(252,165,165,0.08); }

        /* ── Pagination button ── */
        .lp-page-btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 5px;
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

      <div className="lp-clients-root">

        {/* ══ HERO BAR ═════════════════════════════════════════════ */}
        <div className="lp-hero" style={anim(0)}>
          <div>
            {/* Eyebrow — Inter 500 uppercase */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
              <div style={{ width:'16px', height:'1px', background: D.goldMuted }}/>
              <p style={{
                fontFamily: D.fontBody, fontSize:'10px', fontWeight:'500',
                letterSpacing:'0.14em', textTransform:'uppercase',
                color: D.goldMuted, margin:0,
              }}>
                Directorio
              </p>
            </div>

            {/* Title — Playfair Display 700 (gold use #1 on accent word) */}
            <h1 style={{
              fontFamily: D.fontDisplay,
              fontSize: '26px', fontWeight:'700',
              color: D.textPrimary, margin:'0 0 4px',
              textShadow:'0 2px 8px rgba(0,0,0,0.50)',
              letterSpacing:'-0.01em',
            }}>
              Gestión de{' '}
              <span style={{ color: D.goldPrimary }}>Clientes</span>
            </h1>

            {/* Subtitle — Inter 300 */}
            <p style={{
              fontFamily: D.fontBody, fontSize:'13px', fontWeight:'300',
              color: D.textSecondary, margin:0,
            }}>
              {total} cliente{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
            </p>
          </div>

          {/* CTA — gold gradient button */}
          <button
            className="lp-btn-primary"
            onClick={() => navigate('/panel/clientes/nuevo')}
          >
            <Plus size={14} strokeWidth={2.5}/>
            Nuevo cliente
          </button>
        </div>

        {/* ══ CONTENT ══════════════════════════════════════════════ */}
        <div style={{ padding:'24px 36px', maxWidth:'1280px' }}>

          {/* Search bar */}
          <div style={{ position:'relative', marginBottom:'20px', ...anim(0.07) }}>
            <Search
              size={14}
              style={{
                position:'absolute', left:'13px', top:'50%',
                transform:'translateY(-50%)',
                color: D.textMuted, pointerEvents:'none',
              }}
            />
            <input
              type="text"
              className="lp-search"
              placeholder="Buscar por nombre, correo o teléfono…"
              value={search}
              onChange={handleSearch}
            />
          </div>

          {/* Glass table panel */}
          <div className="lp-panel" style={anim(0.13)}>

            {loading ? (
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'64px' }}>
                <div className="lp-spinner"/>
              </div>

            ) : error ? (
              <div style={{
                textAlign:'center', padding:'64px',
                fontFamily: D.fontBody, fontSize:'13px', fontWeight:'400',
                color:'#fca5a5',
              }}>
                {error}
              </div>

            ) : clientes.length === 0 ? (
              <div style={{ textAlign:'center', padding:'72px 24px' }}>
                <Users size={40} style={{ margin:'0 auto 14px', display:'block', color: D.textMuted, opacity:0.5 }}/>
                {/* Empty title — Playfair Display */}
                <p style={{
                  fontFamily: D.fontDisplay, fontSize:'18px', fontWeight:'700',
                  color: D.textSecondary, margin:'0 0 8px',
                }}>
                  Sin resultados
                </p>
                {/* Empty sub — Inter 300 */}
                <p style={{
                  fontFamily: D.fontBody, fontSize:'13px', fontWeight:'300',
                  color: D.textMuted, margin:0,
                }}>
                  {search
                    ? `No se encontraron clientes para "${search}"`
                    : 'Aún no hay clientes registrados en el sistema'}
                </p>
              </div>

            ) : (
              <>
                <table className="lp-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Teléfono</th>
                      <th>Correo</th>
                      <th>Dirección</th>
                      <th style={{ textAlign:'right', paddingRight:'22px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((cliente, idx) => {
                      const [g1, g2] = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]
                      const isHovered = hoveredRow === cliente.id_cliente
                      return (
                        <tr
                          key={cliente.id_cliente}
                          className="lp-tr"
                          onMouseEnter={() => setHoveredRow(cliente.id_cliente)}
                          onMouseLeave={() => setHoveredRow(null)}
                          onClick={() => navigate(`/panel/clientes/${cliente.id_cliente}`)}
                        >
                          {/* Client name cell */}
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:'11px' }}>
                              {/* Avatar — gold ring on hover (gold use #3) */}
                              <div style={{
                                width:'34px', height:'34px', borderRadius:'50%',
                                background: `linear-gradient(135deg, ${g1}, ${g2})`,
                                border: isHovered
                                  ? `2px solid ${D.goldPrimary}`
                                  : `1px solid rgba(255,255,255,0.12)`,
                                boxShadow: isHovered
                                  ? `0 0 0 3px ${D.goldGlow}, 0 0 12px rgba(232,212,138,0.12)`
                                  : 'none',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                flexShrink:0,
                                transition:'border 0.15s ease, box-shadow 0.15s ease',
                              }}>
                                <span style={{
                                  fontFamily: D.fontBody,
                                  fontSize:'13px', fontWeight:'600',
                                  color: D.textPrimary,
                                }}>
                                  {cliente.nombre.charAt(0).toUpperCase()}
                                </span>
                              </div>

                              {/* Name — Playfair Display 700 */}
                              <span style={{
                                fontFamily: D.fontDisplay,
                                fontSize:'14px', fontWeight:'700',
                                color: D.textPrimary,
                                textShadow:'0 1px 2px rgba(0,0,0,0.4)',
                              }}>
                                {cliente.nombre}
                              </span>
                            </div>
                          </td>

                          {/* Data cells — Inter 400, text-secondary */}
                          <td style={{ fontVariantNumeric:'tabular-nums' }}>
                            {cliente.telefono || <span style={{ color: D.textMuted }}>—</span>}
                          </td>
                          <td>
                            {cliente.correo || <span style={{ color: D.textMuted }}>—</span>}
                          </td>
                          <td style={{ maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {cliente.direccion || <span style={{ color: D.textMuted }}>—</span>}
                          </td>

                          {/* Actions */}
                          <td onClick={e => e.stopPropagation()}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'6px' }}>
                              <button
                                className="lp-action view"
                                title="Ver perfil"
                                onClick={() => navigate(`/panel/clientes/${cliente.id_cliente}`)}
                              >
                                <Eye size={13}/>
                              </button>
                              <button
                                className="lp-action edit"
                                title="Editar"
                                onClick={() => navigate(`/panel/clientes/${cliente.id_cliente}/editar`)}
                              >
                                <Pencil size={13}/>
                              </button>
                              <button
                                className="lp-action del"
                                title="Eliminar"
                                onClick={() => handleDelete(cliente.id_cliente, cliente.nombre)}
                              >
                                <Trash2 size={13}/>
                              </button>
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
                    {/* Counter — Inter 400 */}
                    <p style={{
                      fontFamily: D.fontBody, fontSize:'12px', fontWeight:'400',
                      color: D.textMuted, margin:0,
                    }}>
                      Página <span style={{ color: D.textSecondary, fontWeight:'500' }}>{page}</span> de {totalPaginas}
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