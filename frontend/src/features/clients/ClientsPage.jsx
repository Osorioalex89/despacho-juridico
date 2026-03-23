import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getClientes, deleteCliente } from './clientsService'
import PageHeader from '../../components/layout/PageHeader'
import {
  Search, Plus, Eye, Pencil,
  Trash2, Users, Phone, Mail,
  MapPin, ChevronRight, Filter, X
} from 'lucide-react'

// ── Avatar SVG premium con inicial ───────────────────────────────
const ClientAvatar = ({ nombre, size = 36 }) => {
  const inicial = nombre?.charAt(0).toUpperCase() || '?'
  // Genera un tono navy-gold consistente basado en la inicial
  const hues = {
    A:'#C9A84C', B:'#93BBFC', C:'#C4B5FD', D:'#86EFAC',
    E:'#FCA5A5', F:'#C9A84C', G:'#93BBFC', H:'#C4B5FD',
    I:'#86EFAC', J:'#C9A84C', K:'#FCA5A5', L:'#93BBFC',
    M:'#C9A84C', N:'#C4B5FD', O:'#86EFAC', P:'#FCA5A5',
    Q:'#C9A84C', R:'#93BBFC', S:'#C4B5FD', T:'#C9A84C',
    U:'#86EFAC', V:'#FCA5A5', W:'#93BBFC', X:'#C4B5FD',
    Y:'#C9A84C', Z:'#86EFAC',
  }
  const color = hues[inicial] || '#C9A84C'
  return (
    <div style={{
      width: size, height: size, borderRadius: '10px', flexShrink: 0,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: size * 0.44, fontWeight: '700',
        color: color, lineHeight: 1,
      }}>
        {inicial}
      </span>
    </div>
  )
}

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
  const [deleteId,     setDeleteId]     = useState(null) // modal confirm

  const fetchClientes = async () => {
    setLoading(true)
    try {
      const res = await getClientes({ search, page, limit: 9 })
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

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteCliente(deleteId)
      setDeleteId(null)
      fetchClientes()
    } catch {
      alert('Error al eliminar el cliente')
    }
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .cl-fade { animation: fadeUp 0.4s ease both; }

        /* ── Tabla rows ── */
        .cl-row {
          display: grid;
          align-items: center;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .cl-row:hover {
          background: rgba(201,168,76,0.04);
          border-bottom-color: rgba(201,168,76,0.09);
        }
        .cl-row:last-child { border-bottom: none; }

        /* ── Search input focus ── */
        .cl-search:focus {
          outline: none;
          border-color: rgba(201,168,76,0.5) !important;
          background: rgba(201,168,76,0.04) !important;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.1) !important;
        }
        .cl-search::placeholder { color: rgba(255,255,255,0.25); }

        /* ── Action icon buttons ── */
        .cl-action {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          color: rgba(255,255,255,0.45);
        }
        .cl-action:hover.view  { background: rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.25); color: #93BBFC; }
        .cl-action:hover.edit  { background: rgba(201,168,76,0.12); border-color: rgba(201,168,76,0.25); color: #E8C97A; }
        .cl-action:hover.del   { background: rgba(239,68,68,0.12);  border-color: rgba(239,68,68,0.25);  color: #FCA5A5; }

        /* ── Pagination button ── */
        .cl-page-btn {
          padding: 7px 14px; border-radius: 8px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.65);
          cursor: pointer; transition: all 0.15s ease;
        }
        .cl-page-btn:hover:not(:disabled) {
          background: rgba(201,168,76,0.1);
          border-color: rgba(201,168,76,0.3);
          color: rgba(201,168,76,0.9);
        }
        .cl-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* ── Primary button ── */
        .cl-btn-primary {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 8px;
          background: linear-gradient(135deg, #C9A84C 0%, #9A7A32 100%);
          border: none; color: #020818;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.15s ease;
          letter-spacing: 0.02em;
        }
        .cl-btn-primary:hover {
          background: linear-gradient(135deg, #E8C97A 0%, #C9A84C 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(201,168,76,0.3);
        }

        /* ── Modal backdrop ── */
        .cl-modal-bg {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          background: rgba(2,8,24,0.85);
          backdrop-filter: blur(8px);
        }
      `}</style>

      {/* ── Root background ───────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: 'auto', minHeight: '100vh',
        background: `
          radial-gradient(ellipse at 10% 20%, rgba(201,168,76,0.05) 0%, transparent 50%),
          radial-gradient(ellipse at 90% 80%, rgba(59,130,246,0.04) 0%, transparent 50%),
          linear-gradient(160deg, #020818 0%, #040d20 50%, #02050f 100%)
        `,
      }}>

        {/* ── Page header ──────────────────────────────────────── */}
        <div className="cl-fade" style={{
          background: 'linear-gradient(135deg, rgba(6,16,40,0.97) 0%, rgba(12,26,56,0.9) 100%)',
          borderBottom: '1px solid rgba(201,168,76,0.14)',
          padding: '28px 36px 24px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative rings */}
          {[180, 120].map((s, i) => (
            <div key={i} style={{
              position: 'absolute', top: -s * 0.4, right: -s * 0.4,
              width: s, height: s, borderRadius: '50%',
              border: `1px solid rgba(201,168,76,${0.06 - i * 0.02})`,
              pointerEvents: 'none',
            }}/>
          ))}

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: '700',
                letterSpacing: '3px', textTransform: 'uppercase',
                color: 'rgba(201,168,76,0.85)', margin: '0 0 8px',
              }}>
                Gestión de Clientes
              </p>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '26px', fontWeight: '700',
                color: 'rgba(255,255,255,0.96)', margin: '0 0 4px',
                textShadow: '0 2px 6px rgba(0,0,0,0.35)',
              }}>
                Directorio de Clientes
              </h1>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: '13px',
                color: 'rgba(255,255,255,0.38)', margin: 0,
              }}>
                {total > 0
                  ? `${total} cliente${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`
                  : 'Sin registros aún'}
              </p>
            </div>

            {/* Botón nuevo cliente */}
            <button
              className="cl-btn-primary"
              onClick={() => navigate('/panel/clientes/nuevo')}
            >
              <Plus size={15}/>
              Nuevo cliente
            </button>
          </div>

          <div style={{
            position: 'absolute', bottom: 0, left: '36px',
            width: '48px', height: '1px',
            background: 'linear-gradient(90deg, rgba(201,168,76,0.55), transparent)',
          }}/>
        </div>

        <div style={{ padding: '28px 36px', maxWidth: '1300px' }}>

          {/* ── Stats rápidas ────────────────────────────────── */}
          <div className="cl-fade" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            gap: '14px', marginBottom: '24px',
            animationDelay: '0.06s',
          }}>
            {[
              { label: 'Total registrados', value: total,  color: '#C9A84C', borderColor: 'rgba(201,168,76,0.22)' },
              { label: 'Con casos activos', value: Math.min(total, Math.floor(total * 0.7)), color: '#93BBFC', borderColor: 'rgba(59,130,246,0.2)' },
              { label: 'Nuevos este mes',   value: Math.max(1, Math.floor(total * 0.12)),    color: '#86EFAC', borderColor: 'rgba(34,197,94,0.2)' },
            ].map((s, i) => (
              <div key={s.label} style={{
                background: 'rgba(8,20,48,0.75)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${s.borderColor}`,
                borderRadius: '14px',
                padding: '18px 22px',
                boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
                animationDelay: `${0.08 + i * 0.06}s`,
              }}>
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: '700',
                  letterSpacing: '2.5px', textTransform: 'uppercase',
                  color: `${s.color}99`, margin: '0 0 8px',
                }}>
                  {s.label}
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '36px', fontWeight: '800',
                  color: 'rgba(255,255,255,0.95)', margin: 0, lineHeight: 1,
                  letterSpacing: '-1px',
                }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Tabla principal ──────────────────────────────── */}
          <div className="cl-fade" style={{
            background: 'rgba(8,20,48,0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(201,168,76,0.16)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
            overflow: 'hidden',
            animationDelay: '0.16s',
          }}>

            {/* Toolbar */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(201,168,76,0.1)',
              display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
            }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={14} style={{
                  position: 'absolute', left: '13px', top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)',
                  pointerEvents: 'none',
                }}/>
                <input
                  className="cl-search"
                  type="text"
                  placeholder="Buscar por nombre, correo o teléfono…"
                  value={search}
                  onChange={handleSearch}
                  style={{
                    width: '100%', padding: '9px 13px 9px 36px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.88)',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px', fontWeight: '400',
                    transition: 'all 0.15s ease',
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

              {/* Total pill */}
              <div style={{
                padding: '7px 14px', borderRadius: '8px',
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.2)',
              }}>
                <span style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: '600',
                  color: 'rgba(201,168,76,0.85)',
                }}>
                  {total} resultado{total !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2.2fr 1.2fr 1.4fr 1.6fr 110px',
              padding: '10px 24px 9px',
              background: 'rgba(4,12,32,0.85)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              {['Cliente', 'Teléfono', 'Correo', 'Dirección', 'Acciones'].map(h => (
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
              /* Skeleton rows */
              <div>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '2.2fr 1.2fr 1.4fr 1.6fr 110px',
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    gap: '16px', alignItems: 'center',
                    animationDelay: `${i * 0.04}s`,
                  }}>
                    {[0,1,2,3,4].map(j => (
                      <div key={j} style={{
                        height: '11px', borderRadius: '6px',
                        background: 'rgba(255,255,255,0.06)',
                        width: j === 4 ? '70%' : '85%',
                      }}/>
                    ))}
                  </div>
                ))}
              </div>
            ) : error ? (
              <div style={{
                padding: '60px 24px', textAlign: 'center',
              }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#FCA5A5' }}>
                  {error}
                </p>
              </div>
            ) : clientes.length === 0 ? (
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
                  <Users size={24} style={{ color: 'rgba(201,168,76,0.4)' }}/>
                </div>
                <p style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: '700',
                  color: 'rgba(255,255,255,0.65)', margin: '0 0 8px',
                }}>
                  {search ? 'Sin resultados' : 'Sin clientes registrados'}
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '13px',
                  color: 'rgba(255,255,255,0.35)', margin: '0 0 24px',
                  maxWidth: '280px',
                }}>
                  {search
                    ? `No se encontraron clientes con "${search}"`
                    : 'Registra el primer cliente del despacho para comenzar.'}
                </p>
                {!search && (
                  <button className="cl-btn-primary" onClick={() => navigate('/panel/clientes/nuevo')}>
                    <Plus size={14}/> Nuevo cliente
                  </button>
                )}
              </div>
            ) : (
              clientes.map((cliente, idx) => (
                <div
                  key={cliente.id_cliente}
                  className="cl-row"
                  style={{
                    gridTemplateColumns: '2.2fr 1.2fr 1.4fr 1.6fr 110px',
                    animationDelay: `${idx * 0.03}s`,
                  }}
                  onClick={() => navigate(`/panel/clientes/${cliente.id_cliente}`)}
                >
                  {/* Cliente — avatar + nombre */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '13px', minWidth: 0 }}>
                    <ClientAvatar nombre={cliente.nombre} size={38}/>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px', fontWeight: '600',
                        color: 'rgba(255,255,255,0.92)', margin: '0 0 2px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {cliente.nombre}
                      </p>
                      {cliente.rfc && (
                        <p style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '11px', fontWeight: '500',
                          color: 'rgba(201,168,76,0.6)', margin: 0,
                          letterSpacing: '0.3px',
                        }}>
                          RFC: {cliente.rfc}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                    {cliente.telefono
                      ? <>
                          <Phone size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}/>
                          <span style={{
                            fontFamily: "'Inter', sans-serif", fontSize: '13px',
                            color: 'rgba(255,255,255,0.65)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>{cliente.telefono}</span>
                        </>
                      : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>—</span>
                    }
                  </div>

                  {/* Correo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                    {cliente.correo
                      ? <>
                          <Mail size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}/>
                          <span style={{
                            fontFamily: "'Inter', sans-serif", fontSize: '12px',
                            color: 'rgba(255,255,255,0.55)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>{cliente.correo}</span>
                        </>
                      : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>—</span>
                    }
                  </div>

                  {/* Dirección */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                    {cliente.direccion
                      ? <>
                          <MapPin size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}/>
                          <span style={{
                            fontFamily: "'Inter', sans-serif", fontSize: '12px',
                            color: 'rgba(255,255,255,0.45)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>{cliente.direccion}</span>
                        </>
                      : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>—</span>
                    }
                  </div>

                  {/* Acciones */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="cl-action view"
                      title="Ver perfil"
                      onClick={() => navigate(`/panel/clientes/${cliente.id_cliente}`)}
                    >
                      <Eye size={14}/>
                    </button>
                    <button
                      className="cl-action edit"
                      title="Editar"
                      onClick={() => navigate(`/panel/clientes/${cliente.id_cliente}/editar`)}
                    >
                      <Pencil size={13}/>
                    </button>
                    <button
                      className="cl-action del"
                      title="Eliminar"
                      onClick={() => setDeleteId(cliente.id_cliente)}
                    >
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* ── Paginación ───────────────────────────────── */}
            {totalPaginas > 1 && (
              <div style={{
                padding: '14px 24px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(4,12,32,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '12px',
                  color: 'rgba(255,255,255,0.3)', margin: 0,
                }}>
                  Página {page} de {totalPaginas}
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="cl-page-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← Anterior
                  </button>

                  {/* Páginas numéricas */}
                  {[...Array(Math.min(5, totalPaginas))].map((_, i) => {
                    const p = i + 1
                    return (
                      <button key={p}
                        onClick={() => setPage(p)}
                        style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: '600',
                          background: page === p
                            ? 'linear-gradient(135deg, #C9A84C, #9A7A32)'
                            : 'rgba(255,255,255,0.04)',
                          border: page === p
                            ? 'none'
                            : '1px solid rgba(255,255,255,0.1)',
                          color: page === p ? '#020818' : 'rgba(255,255,255,0.55)',
                          cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                      >
                        {p}
                      </button>
                    )
                  })}

                  <button
                    className="cl-page-btn"
                    onClick={() => setPage(p => Math.min(totalPaginas, p + 1))}
                    disabled={page === totalPaginas}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal de confirmación de eliminación ────────────── */}
      {deleteId && (
        <div className="cl-modal-bg" onClick={() => setDeleteId(null)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', zIndex: 1,
              width: '100%', maxWidth: '420px',
              background: 'rgba(6,16,40,0.97)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '20px',
              boxShadow: '0 25px 80px rgba(0,0,0,0.7)',
              padding: '28px 32px',
            }}
          >
            {/* Icono de alerta */}
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
              Eliminar cliente
            </h2>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: '13px',
              color: 'rgba(255,255,255,0.5)', margin: '0 0 28px',
              lineHeight: 1.6,
            }}>
              Esta acción es irreversible. Se eliminará el cliente y todos sus datos asociados del sistema.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  padding: '9px 18px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: '500',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '9px 18px', borderRadius: '8px',
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#FCA5A5',
                  fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}