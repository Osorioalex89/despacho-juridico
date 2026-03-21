import { useState, useEffect } from 'react'
import { getMisCasos }         from '../cases/casesService'
import { getMisDocumentos }    from '../documents/documentsService'
import {
  FolderOpen, Clock, CheckCircle, XCircle,
  AlertCircle, FileText, Calendar,
  ChevronRight, ChevronDown, Download
} from 'lucide-react'

const ESTADO_CONFIG = {
  activo:      { label: 'Activo',      color: 'bg-green-100 text-green-700', icon: CheckCircle, dot: '#22c55e' },
  urgente:     { label: 'Urgente',     color: 'bg-red-100 text-red-700',     icon: AlertCircle, dot: '#ef4444' },
  pendiente:   { label: 'Pendiente',   color: 'bg-amber-100 text-amber-700', icon: Clock,       dot: '#f59e0b' },
  en_revision: { label: 'En revisión', color: 'bg-blue-100 text-blue-700',   icon: FileText,    dot: '#3b82f6' },
  cerrado:     { label: 'Cerrado',     color: 'bg-gray-100 text-gray-600',   icon: XCircle,     dot: '#9ca3af' },
}

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default function MisCasosPage() {
  const [casos,        setCasos]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [filtro,       setFiltro]       = useState('')
  const [casoExpandido,setCasoExpandido]= useState(null)
  const [docsPorCaso,  setDocsPorCaso]  = useState({})
  const [loadingDocs,  setLoadingDocs]  = useState(false)

  useEffect(() => {
    getMisCasos()
      .then(r => setCasos(r.data.casos))
      .catch(() => setError('Error al cargar tus casos'))
      .finally(() => setLoading(false))
  }, [])

  const filtrados  = filtro ? casos.filter(c => c.estado === filtro) : casos
  const activos    = casos.filter(c => ['activo','urgente','en_revision'].includes(c.estado)).length
  const pendientes = casos.filter(c => c.estado === 'pendiente').length
  const cerrados   = casos.filter(c => c.estado === 'cerrado').length

  const toggleCaso = async (id_caso) => {
    if (casoExpandido === id_caso) { setCasoExpandido(null); return }
    setCasoExpandido(id_caso)
    if (docsPorCaso[id_caso]) return
    setLoadingDocs(true)
    try {
      const r = await getMisDocumentos(id_caso)
      setDocsPorCaso(prev => ({ ...prev, [id_caso]: r.data.documentos }))
    } catch {
      setDocsPorCaso(prev => ({ ...prev, [id_caso]: [] }))
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleDescargar = async (id, nombre) => {
    const token = localStorage.getItem('token')
    const res   = await fetch(
      `http://localhost:3001/api/documentos/mis-documentos/${id}/descargar`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = nombre
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '26px', fontWeight: '700',
          color: '#1e3a5f', margin: '0 0 6px',
        }}>Mis Casos</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          Expedientes jurídicos vinculados a tu cuenta
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px', marginBottom: '24px',
      }}>
        {[
          { label: 'Casos activos', val: activos,    color: '#1e3a5f', bg: '#e8f0f8' },
          { label: 'Pendientes',    val: pendientes, color: '#d97706', bg: '#fef3c7' },
          { label: 'Cerrados',      val: cerrados,   color: '#6b7280', bg: '#f3f4f6' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: '12px',
            padding: '16px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '26px', fontWeight: '600', color: s.color, margin: '0 0 4px' }}>
              {s.val}
            </p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[
          { val: '',            label: 'Todos'       },
          { val: 'activo',      label: 'Activos'     },
          { val: 'urgente',     label: 'Urgentes'    },
          { val: 'pendiente',   label: 'Pendientes'  },
          { val: 'en_revision', label: 'En revisión' },
          { val: 'cerrado',     label: 'Cerrados'    },
        ].map(opt => (
          <button key={opt.val} onClick={() => setFiltro(opt.val)}
            style={{
              padding: '7px 16px', borderRadius: '20px',
              border: filtro === opt.val ? '1.5px solid #1e3a5f' : '1px solid #e2e8f0',
              background: filtro === opt.val ? '#1e3a5f' : '#ffffff',
              color: filtro === opt.val ? '#ffffff' : '#64748b',
              fontSize: '13px', fontWeight: filtro === opt.val ? '500' : '400',
              cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: "'Inter', sans-serif",
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{
            width: '36px', height: '36px',
            border: '2px solid #1e3a5f', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            margin: '0 auto',
          }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : error ? (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '12px', padding: '20px',
          color: '#dc2626', fontSize: '14px', textAlign: 'center',
        }}>{error}</div>
      ) : filtrados.length === 0 ? (
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: '16px', padding: '60px 24px', textAlign: 'center',
        }}>
          <FolderOpen size={44} color="#cbd5e1" style={{ margin: '0 auto 14px', display: 'block' }}/>
          <p style={{ fontSize: '15px', color: '#94a3b8', margin: '0 0 6px', fontWeight: '500' }}>
            {filtro ? 'No hay casos con ese estado' : 'No tienes casos asignados aún'}
          </p>
          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0 }}>
            El despacho te asignará un expediente cuando inicie tu proceso
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtrados.map(caso => {
            const cfg  = ESTADO_CONFIG[caso.estado] || ESTADO_CONFIG.activo
            const Icon = cfg.icon
            return (
              <div key={caso.id_caso} style={{
                background: '#ffffff',
                border: casoExpandido === caso.id_caso ? '1.5px solid #1e3a5f' : '1px solid #e2e8f0',
                borderRadius: '16px', overflow: 'hidden',
                transition: 'all 0.15s',
                boxShadow: casoExpandido === caso.id_caso ? '0 4px 16px rgba(30,58,95,0.08)' : 'none',
              }}>

                {/* Cabecera — clic para expandir */}
                <div onClick={() => toggleCaso(caso.id_caso)} style={{
                  padding: '20px 24px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: cfg.color.includes('green') ? '#f0fdf4' :
                                cfg.color.includes('red')   ? '#fef2f2' :
                                cfg.color.includes('amber') ? '#fffbeb' :
                                cfg.color.includes('blue')  ? '#eff6ff' : '#f9fafb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={20} color={cfg.dot}/>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: '600', color: '#1e3a5f',
                        background: '#e8f0f8', padding: '2px 8px', borderRadius: '6px',
                      }}>{caso.folio}</span>
                      <span style={{
                        fontSize: '11px', color: '#94a3b8', background: '#f8fafc',
                        padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0',
                      }}>{caso.tipo}</span>
                    </div>
                    <p style={{
                      fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px',
                      fontFamily: "'Playfair Display', serif",
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{caso.asunto}</p>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={11}/> {formatFecha(caso.fecha_apertura)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <span style={{ fontSize: '12px', fontWeight: '500', padding: '5px 12px', borderRadius: '20px' }}
                          className={cfg.color}>
                      {cfg.label}
                    </span>
                    {casoExpandido === caso.id_caso
                      ? <ChevronDown size={16} color="#94a3b8"/>
                      : <ChevronRight size={16} color="#94a3b8"/>
                    }
                  </div>
                </div>

                {/* Panel expandido — documentos */}
                {casoExpandido === caso.id_caso && (
                  <div style={{
                    borderTop: '1px solid #f1f5f9',
                    padding: '16px 24px 20px',
                    background: '#fafafa',
                  }}>
                    <p style={{
                      fontSize: '12px', fontWeight: '600', color: '#1e3a5f',
                      marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <FileText size={13}/> Documentos del expediente
                    </p>

                    {loadingDocs ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{
                          width: '24px', height: '24px',
                          border: '2px solid #1e3a5f', borderTopColor: 'transparent',
                          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                          margin: '0 auto',
                        }}/>
                      </div>
                    ) : (docsPorCaso[caso.id_caso] || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                        <FileText size={28} color="#e2e8f0" style={{ margin: '0 auto 8px', display: 'block' }}/>
                        No hay documentos disponibles para este caso
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(docsPorCaso[caso.id_caso] || []).map(doc => (
                          <div key={doc.id_documento} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', background: '#ffffff',
                            border: '1px solid #e2e8f0', borderRadius: '10px',
                          }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: '#e8f0f8', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <FileText size={15} color="#1e3a5f"/>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontSize: '13px', fontWeight: '500', color: '#1e293b', margin: 0,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>{doc.nombre_original}</p>
                              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                                {new Date(doc.createdAt).toLocaleDateString('es-MX')}
                                {doc.descripcion ? ` · ${doc.descripcion}` : ''}
                              </p>
                            </div>
                            <button onClick={() => handleDescargar(doc.id_documento, doc.nombre_original)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '6px 12px', background: '#1e3a5f', color: '#ffffff',
                                border: 'none', borderRadius: '8px',
                                fontSize: '12px', cursor: 'pointer', flexShrink: 0,
                              }}>
                              <Download size={12}/> Descargar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}