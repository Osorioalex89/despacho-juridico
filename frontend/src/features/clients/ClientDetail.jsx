import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getClienteById } from './clientsService'
import PageHeader from '../../components/layout/PageHeader'
import { useAuth } from '../../context/AuthContext'
import {
  User, Phone, Mail, MapPin,
  FileText, ArrowLeft, Pencil
} from 'lucide-react'

export default function ClientDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { canManageClients } = useAuth()

  const [cliente, setCliente]  = useState(null)
  const [loading, setLoading]  = useState(true)
  const [error,   setError]    = useState('')

  useEffect(() => {
    getClienteById(id)
      .then(res => setCliente(res.data))
      .catch(() => setError('Error al cargar el cliente'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent
                      rounded-full animate-spin"/>
    </div>
  )

  if (error || !cliente) return (
    <div className="flex-1 flex items-center justify-center py-20">
      <p className="text-red-500 text-sm">{error || 'Cliente no encontrado'}</p>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title="Perfil del cliente"
        subtitle={cliente.nombre}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/panel/clientes')}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200
                         rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <ArrowLeft size={15}/> Volver
            </button>
            {canManageClients && (
              <button onClick={() => navigate(`/panel/clientes/${id}/editar`)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f]
                           hover:bg-[#2d5282] text-white rounded-lg text-sm transition-colors">
                <Pencil size={15}/> Editar
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-5">

          {/* Card principal */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#1e3a5f] flex items-center
                              justify-center text-white text-2xl font-medium flex-shrink-0">
                {cliente.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-medium text-gray-800">{cliente.nombre}</h2>
                <p className="text-sm text-gray-400 mt-0.5">Cliente del despacho</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Phone,   label: 'Teléfono',  value: cliente.telefono  },
                { icon: Mail,    label: 'Correo',    value: cliente.correo    },
                { icon: MapPin,  label: 'Dirección', value: cliente.direccion },
                { icon: FileText,label: 'RFC',       value: cliente.rfc       },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 p-3
                                            bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200
                                  flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-[#1e3a5f]"/>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm text-gray-700 font-medium">{value || '—'}</p>
                  </div>
                </div>
              ))}
            </div>

            {cliente.notas && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Notas</p>
                <p className="text-sm text-gray-600">{cliente.notas}</p>
              </div>
            )}
          </div>

          {/* Fechas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Información del registro
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Fecha de registro</p>
                <p className="text-sm text-gray-700 font-medium mt-0.5">
                  {new Date(cliente.createdAt).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Última actualización</p>
                <p className="text-sm text-gray-700 font-medium mt-0.5">
                  {new Date(cliente.updatedAt).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}