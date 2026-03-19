import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { useAuth }             from '../../context/AuthContext'
import { getCasos, deleteCaso } from './casesService'
import PageHeader from '../../components/layout/PageHeader'
import {
  Search, Plus, Eye, Pencil,
  Trash2, FolderOpen, Filter
} from 'lucide-react'

const TIPOS = [
  'Penal', 'Civil', 'Amparo', 'Sucesorio',
  'Contratos', 'Trámite de escrituras',
  'Inscripción de posesión', 'Asesoría legal',
]

const ESTADOS = [
  { value: 'activo',      label: 'Activo',       color: 'bg-green-100 text-green-700'  },
  { value: 'urgente',     label: 'Urgente',       color: 'bg-red-100 text-red-700'      },
  { value: 'pendiente',   label: 'Pendiente',     color: 'bg-amber-100 text-amber-700'  },
  { value: 'en_revision', label: 'En revisión',   color: 'bg-blue-100 text-blue-700'    },
  { value: 'cerrado',     label: 'Cerrado',       color: 'bg-gray-100 text-gray-600'    },
]

function getBadge(estado) {
  const e = ESTADOS.find(x => x.value === estado)
  return e ? { label: e.label, color: e.color } : { label: estado, color: 'bg-gray-100 text-gray-600' }
}

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

  const fetchCasos = async () => {
    setLoading(true)
    try {
      const res = await getCasos({
        search, tipo: filtroTipo, estado: filtroEstado, page, limit: 8
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

  const handleDelete = async (id, asunto) => {
    if (!confirm(`¿Eliminar el caso "${asunto}"?`)) return
    try {
      await deleteCaso(id)
      fetchCasos()
    } catch {
      alert('Error al eliminar el caso')
    }
  }

  // Stats rápidas
  const statsConfig = [
    { label: 'Total',       value: total,                                         color: 'text-[#1e3a5f]' },
    { label: 'Urgentes',    value: casos.filter(c => c.estado === 'urgente').length,  color: 'text-red-600'   },
    { label: 'Pendientes',  value: casos.filter(c => c.estado === 'pendiente').length,color: 'text-amber-600' },
    { label: 'Cerrados',    value: casos.filter(c => c.estado === 'cerrado').length,  color: 'text-gray-500'  },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title="Casos Jurídicos"
        subtitle={`${total} expedientes registrados`}
        action={
          canEditCases && (
            <button
              onClick={() => navigate('/panel/casos/nuevo')}
              className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5282]
                         text-white px-4 py-2 rounded-lg text-sm transition-colors">
              <Plus size={16}/> Nuevo caso
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {statsConfig.map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
              <p className={`text-2xl font-medium ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              type="text"
              placeholder="Buscar por folio o asunto..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg
                         text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white"
            />
          </div>

          <select
            value={filtroTipo}
            onChange={e => { setFiltroTipo(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                       bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
          >
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>

          <select
            value={filtroEstado}
            onChange={e => { setFiltroEstado(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                       bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>

        {/* Chips de estado rápido */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setFiltroEstado(''); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filtroEstado === ''
                ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >Todos</button>
          {ESTADOS.map(e => (
            <button key={e.value}
              onClick={() => { setFiltroEstado(e.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filtroEstado === e.value
                  ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >{e.label}</button>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent
                              rounded-full animate-spin"/>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500 text-sm">{error}</div>
          ) : casos.length === 0 ? (
            <div className="text-center py-20">
              <FolderOpen size={40} className="mx-auto text-gray-300 mb-3"/>
              <p className="text-gray-400 text-sm">No se encontraron casos</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Folio</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Asunto</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Tipo</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Estado</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Apertura</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {casos.map(caso => {
                    const badge = getBadge(caso.estado)
                    return (
                      <tr key={caso.id_caso} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-mono font-medium text-[#1e3a5f]
                                           bg-blue-50 px-2 py-1 rounded">
                            {caso.folio}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-700">{caso.asunto}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1
                                           rounded border border-gray-200">
                            {caso.tipo}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-500">
                          {new Date(caso.fecha_apertura).toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/panel/casos/${caso.id_caso}`)}
                              className="p-1.5 text-gray-400 hover:text-[#1e3a5f]
                                         hover:bg-blue-50 rounded-lg transition-colors">
                              <Eye size={15}/>
                            </button>
                            {canEditCases && (
                              <>
                                <button
                                  onClick={() => navigate(`/panel/casos/${caso.id_caso}/editar`)}
                                  className="p-1.5 text-gray-400 hover:text-amber-600
                                             hover:bg-amber-50 rounded-lg transition-colors">
                                  <Pencil size={15}/>
                                </button>
                                <button
                                  onClick={() => handleDelete(caso.id_caso, caso.asunto)}
                                  className="p-1.5 text-gray-400 hover:text-red-500
                                             hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 size={15}/>
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

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400">Página {page} de {totalPaginas}</p>
                  <div className="flex gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 text-xs border border-gray-200 rounded-lg
                                 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                      ← Ant
                    </button>
                    <button onClick={() => setPage(p => Math.min(totalPaginas, p + 1))}
                      disabled={page === totalPaginas}
                      className="px-3 py-1 text-xs border border-gray-200 rounded-lg
                                 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                      Sig →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}