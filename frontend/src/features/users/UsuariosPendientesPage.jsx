import { useState, useEffect } from 'react'
import { useAuth }             from '../../context/AuthContext'
import { getUsuarios, updateEstadoUsuario, deleteUsuario } from './usersService'
import PageHeader from '../../components/layout/PageHeader'
import {
  CheckCircle, XCircle, Trash2, Search,
  UserCheck, Clock, Users, ShieldCheck
} from 'lucide-react'

const ROL_OPTS = [
  { value: 'cliente',    label: 'Cliente'    },
  { value: 'secretario', label: 'Secretario' },
  { value: 'abogado',    label: 'Abogado'    },
]

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400'  },
  aprobado:   { label: 'Aprobado',   color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  rechazado:  { label: 'Rechazado',  color: 'bg-red-100 text-red-700',      dot: 'bg-red-400'    },
}

const ROL_CONFIG = {
  abogado:    { color: 'bg-[#1e3a5f] text-white'          },
  secretario: { color: 'bg-purple-100 text-purple-700'    },
  cliente:    { color: 'bg-blue-100 text-blue-700'         },
  usuario:    { color: 'bg-gray-100 text-gray-600'         },
}

export default function UsuariosPendientesPage() {
  const { canManageUsers } = useAuth()

  const [usuarios,    setUsuarios]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filtroEstado,setFiltroEstado]= useState('pendiente')
  const [error,       setError]       = useState('')
  const [rolModal,    setRolModal]    = useState(null) // { id, nombre }
  const [rolSel,      setRolSel]      = useState('cliente')

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const res = await getUsuarios({ estado: filtroEstado, search })
      setUsuarios(res.data.usuarios)
    } catch {
      setError('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsuarios() }, [filtroEstado, search])

  const handleAprobar = (id, nombre) => {
    setRolModal({ id, nombre })
    setRolSel('cliente')
  }

  const confirmarAprobacion = async () => {
    try {
      await updateEstadoUsuario(rolModal.id, { estado: 'aprobado', rol: rolSel })
      setRolModal(null)
      fetchUsuarios()
    } catch { alert('Error al aprobar') }
  }

  const handleRechazar = async (id) => {
    if (!confirm('¿Rechazar este usuario?')) return
    try {
      await updateEstadoUsuario(id, { estado: 'rechazado' })
      fetchUsuarios()
    } catch { alert('Error al rechazar') }
  }

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteUsuario(id)
      fetchUsuarios()
    } catch { alert('Error al eliminar') }
  }

  // Stats
  const pendientes = usuarios.filter(u => u.estado === 'pendiente').length
  const aprobados  = usuarios.filter(u => u.estado === 'aprobado').length
  const rechazados = usuarios.filter(u => u.estado === 'rechazado').length

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title="Gestión de Usuarios"
        subtitle="Aprobación y administración de cuentas"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pendientes de aprobación', val: pendientes, icon: Clock,       color: 'text-amber-600', bg: 'bg-amber-50'  },
            { label: 'Usuarios aprobados',        val: aprobados,  icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50'  },
            { label: 'Usuarios rechazados',       val: rechazados, icon: XCircle,     color: 'text-red-500',   bg: 'bg-red-50'    },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4
                                          flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                               flex-shrink-0 ${s.bg}`}>
                <s.icon size={18} className={s.color}/>
              </div>
              <div>
                <p className={`text-2xl font-medium ${s.color}`}>{s.val}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" value={search}
              onChange={e => { setSearch(e.target.value) }}
              placeholder="Buscar por nombre o correo..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg
                         text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white"/>
          </div>

          {/* Chips de estado */}
          <div className="flex gap-2">
            {[
              { val: 'pendiente', label: 'Pendientes' },
              { val: 'aprobado',  label: 'Aprobados'  },
              { val: 'rechazado', label: 'Rechazados' },
              { val: '',          label: 'Todos'       },
            ].map(opt => (
              <button key={opt.val}
                onClick={() => setFiltroEstado(opt.val)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  filtroEstado === opt.val
                    ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent
                              rounded-full animate-spin"/>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-20">
              <Users size={40} className="mx-auto text-gray-300 mb-3"/>
              <p className="text-gray-400 text-sm">
                {filtroEstado === 'pendiente'
                  ? 'No hay solicitudes pendientes'
                  : 'No se encontraron usuarios'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Usuario</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Correo</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Rol</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Registro</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuarios.map(u => {
                  const estadoCfg = ESTADO_CONFIG[u.estado] || ESTADO_CONFIG.pendiente
                  const rolCfg    = ROL_CONFIG[u.rol]       || ROL_CONFIG.usuario
                  return (
                    <tr key={u.id_usuario} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center
                                          justify-center text-white text-xs font-medium flex-shrink-0">
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{u.nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{u.correo}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                                         capitalize ${rolCfg.color}`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${estadoCfg.dot}`}/>
                          <span className="text-xs text-gray-600">{estadoCfg.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Aprobar */}
                          {u.estado === 'pendiente' && (
                            <button onClick={() => handleAprobar(u.id_usuario, u.nombre)}
                              title="Aprobar"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50
                                         hover:bg-green-100 text-green-700 rounded-lg
                                         text-xs font-medium transition-colors">
                              <CheckCircle size={13}/> Aprobar
                            </button>
                          )}
                          {/* Rechazar */}
                          {u.estado === 'pendiente' && (
                            <button onClick={() => handleRechazar(u.id_usuario)}
                              title="Rechazar"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50
                                         hover:bg-red-100 text-red-600 rounded-lg
                                         text-xs font-medium transition-colors">
                              <XCircle size={13}/> Rechazar
                            </button>
                          )}
                          {/* Eliminar — solo abogado */}
                          {canManageUsers && (
                            <button onClick={() => handleEliminar(u.id_usuario, u.nombre)}
                              title="Eliminar"
                              className="p-1.5 text-gray-400 hover:text-red-500
                                         hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={14}/>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de aprobación con selección de rol */}
      {rolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
             style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <UserCheck size={20} className="text-green-600"/>
              </div>
              <div>
                <h2 className="text-base font-medium text-gray-800">Aprobar usuario</h2>
                <p className="text-sm text-gray-500">{rolModal.nombre}</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asignar rol
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ROL_OPTS.map(opt => (
                  <button key={opt.value}
                    onClick={() => setRolSel(opt.value)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      rolSel === opt.value
                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setRolModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm
                           text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmarAprobacion}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white
                           rounded-lg text-sm font-medium transition-colors">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}