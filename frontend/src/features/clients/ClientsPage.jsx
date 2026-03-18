import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { useAuth }             from '../../context/AuthContext'
import { getClientes, deleteCliente } from './clientsService'
import PageHeader from '../../components/layout/PageHeader'
import { Search, Plus, Pencil, Trash2, Eye, Users } from 'lucide-react'

export default function ClientsPage() {
  const { canEditCases } = useAuth()
  const navigate = useNavigate()

  const [clientes,     setClientes]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [page,         setPage]         = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total,        setTotal]        = useState(0)
  const [error,        setError]        = useState('')

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

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar al cliente "${nombre}"?`)) return
    try {
      await deleteCliente(id)
      fetchClientes()
    } catch {
      alert('Error al eliminar el cliente')
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title="Gestión de Clientes"
        subtitle={`${total} clientes registrados`}
        action={
          <button
            onClick={() => navigate('/panel/clientes/nuevo')}
            className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5282]
                       text-white px-4 py-2 rounded-lg text-sm transition-colors">
            <Plus size={16}/> Nuevo cliente
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">

        {/* Buscador */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o teléfono..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg
                       text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]
                       focus:border-transparent bg-white"
          />
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
          ) : clientes.length === 0 ? (
            <div className="text-center py-20">
              <Users size={40} className="mx-auto text-gray-300 mb-3"/>
              <p className="text-gray-400 text-sm">No se encontraron clientes</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Nombre</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Teléfono</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Correo</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Dirección</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clientes.map(cliente => (
                    <tr key={cliente.id_cliente}
                        className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center
                                          justify-center text-white text-xs font-medium flex-shrink-0">
                            {cliente.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {cliente.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {cliente.telefono || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {cliente.correo || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 max-w-[180px] truncate">
                        {cliente.direccion || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/panel/clientes/${cliente.id_cliente}`)}
                            className="p-1.5 text-gray-400 hover:text-[#1e3a5f]
                                       hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye size={15}/>
                          </button>
                          <button
                            onClick={() => navigate(`/panel/clientes/${cliente.id_cliente}/editar`)}
                            className="p-1.5 text-gray-400 hover:text-amber-600
                                       hover:bg-amber-50 rounded-lg transition-colors">
                            <Pencil size={15}/>
                          </button>
                          <button
                            onClick={() => handleDelete(cliente.id_cliente, cliente.nombre)}
                            className="p-1.5 text-gray-400 hover:text-red-500
                                       hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={15}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Página {page} de {totalPaginas}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 text-xs border border-gray-200 rounded-lg
                                 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                      ← Ant
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPaginas, p + 1))}
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