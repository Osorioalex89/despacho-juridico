import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCasoById } from './casesService'
import PageHeader from '../../components/layout/PageHeader'
import {
  ArrowLeft, Pencil, FolderOpen, User, Calendar,
  Clock, FileText, MapPin, Scale, AlertCircle,
  CheckCircle, XCircle, Tag
} from 'lucide-react'

const ESTADO_CONFIG = {
  activo:      { label: 'Activo',       color: 'bg-green-100 text-green-700',  icon: CheckCircle,  dot: 'bg-green-500'  },
  urgente:     { label: 'Urgente',      color: 'bg-red-100 text-red-700',      icon: AlertCircle,  dot: 'bg-red-500'    },
  pendiente:   { label: 'Pendiente',    color: 'bg-amber-100 text-amber-700',  icon: Clock,        dot: 'bg-amber-500'  },
  en_revision: { label: 'En revisión',  color: 'bg-blue-100 text-blue-700',    icon: FileText,     dot: 'bg-blue-500'   },
  cerrado:     { label: 'Cerrado',      color: 'bg-gray-100 text-gray-600',    icon: XCircle,      dot: 'bg-gray-400'   },
}

const CITA_ESTADO = {
  pendiente:  { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700' },
  confirmada: { label: 'Confirmada', color: 'bg-green-100 text-green-700' },
  cancelada:  { label: 'Cancelada',  color: 'bg-red-100 text-red-700'    },
}

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

function formatHora(hora) {
  if (!hora) return ''
  const [h, m] = hora.split(':')
  const hNum = parseInt(h)
  return `${hNum > 12 ? hNum - 12 : hNum || 12}:${m} ${hNum >= 12 ? 'pm' : 'am'}`
}

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center
                        justify-center flex-shrink-0 mt-0.5">
          <Icon size={15} className="text-[#1e3a5f]"/>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm text-gray-700 font-medium">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function CaseDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { canEditCases } = useAuth()

  const [caso,     setCaso]     = useState(null)
  const [cliente,  setCliente]  = useState(null)
  const [citas,    setCitas]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    getCasoById(id)
      .then(res => {
        setCaso(res.data.caso)
        setCliente(res.data.cliente)
        setCitas(res.data.citas || [])
      })
      .catch(() => setError('Error al cargar el caso'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent
                      rounded-full animate-spin"/>
    </div>
  )

  if (error) return (
    <div className="flex-1 flex items-center justify-center py-20">
      <p className="text-red-500 text-sm">{error}</p>
    </div>
  )

  if (!caso) return null

  const estadoCfg  = ESTADO_CONFIG[caso.estado] || ESTADO_CONFIG.activo
  const EstadoIcon = estadoCfg.icon

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title={caso.folio}
        subtitle={caso.asunto}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/panel/casos')}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200
                         rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <ArrowLeft size={15}/> Volver
            </button>
            {canEditCases && (
              <button onClick={() => navigate(`/panel/casos/${id}/editar`)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f]
                           hover:bg-[#2d5282] text-white rounded-lg text-sm transition-colors">
                <Pencil size={15}/> Editar
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* Banner de estado */}
          <div className={`flex items-center gap-4 p-4 rounded-xl border ${
            caso.estado === 'urgente'
              ? 'bg-red-50 border-red-200'
              : caso.estado === 'cerrado'
                ? 'bg-gray-50 border-gray-200'
                : 'bg-blue-50 border-blue-100'
          }`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center
                             flex-shrink-0 ${estadoCfg.color}`}>
              <EstadoIcon size={20}/>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{caso.asunto}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Expediente {caso.folio} · {caso.tipo}
              </p>
            </div>
            <span className={`text-sm font-medium px-4 py-1.5 rounded-full ${estadoCfg.color}`}>
              {estadoCfg.label}
            </span>
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-3 gap-5">

            {/* Columna izquierda — Datos del caso */}
            <div className="col-span-2 space-y-5">

              {/* Información general */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FolderOpen size={16} className="text-[#1e3a5f]"/>
                  <h2 className="text-sm font-medium text-gray-700">Información del caso</h2>
                </div>
                <div className="grid grid-cols-2 gap-x-6">
                  <InfoRow label="Folio"          value={caso.folio}           icon={Tag}      />
                  <InfoRow label="Tipo de caso"   value={caso.tipo}            icon={Scale}    />
                  <InfoRow label="Fecha apertura" value={formatFecha(caso.fecha_apertura)} icon={Calendar}/>
                  <InfoRow label="Fecha límite"   value={formatFecha(caso.fecha_limite)}   icon={Clock}   />
                  <InfoRow label="Juzgado"        value={caso.juzgado}         icon={MapPin}   />
                  <InfoRow label="No. tribunal"   value={caso.exp_externo}     icon={FileText} />
                </div>
                {caso.contraparte && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Contraparte</p>
                    <p className="text-sm text-gray-700 font-medium">{caso.contraparte}</p>
                  </div>
                )}
              </div>

              {/* Descripción / antecedentes */}
              {caso.descripcion && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-[#1e3a5f]"/>
                    <h2 className="text-sm font-medium text-gray-700">Descripción y antecedentes</h2>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{caso.descripcion}</p>
                </div>
              )}

              {/* Notas internas */}
              {caso.notas && (
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={16} className="text-amber-600"/>
                    <h2 className="text-sm font-medium text-amber-700">Notas internas</h2>
                  </div>
                  <p className="text-sm text-amber-800 leading-relaxed">{caso.notas}</p>
                </div>
              )}

              {/* Citas vinculadas */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[#1e3a5f]"/>
                    <h2 className="text-sm font-medium text-gray-700">
                      Citas vinculadas
                      <span className="ml-2 text-xs bg-gray-100 text-gray-500
                                       px-2 py-0.5 rounded-full">
                        {citas.length}
                      </span>
                    </h2>
                  </div>
                  <button onClick={() => navigate('/panel/agenda')}
                    className="text-xs text-[#1e3a5f] hover:underline">
                    Ver agenda →
                  </button>
                </div>

                {citas.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No hay citas vinculadas a este caso
                  </p>
                ) : (
                  <div className="space-y-2">
                    {citas.map(cita => {
                      const cfg = CITA_ESTADO[cita.estado] || CITA_ESTADO.pendiente
                      return (
                        <div key={cita.id_cita}
                          className="flex items-center gap-3 p-3 bg-gray-50
                                     rounded-lg border border-gray-100">
                          <div className="text-center min-w-[70px]">
                            <p className="text-xs font-medium text-[#1e3a5f]">
                              {formatFecha(cita.fecha).split(' de ').slice(0,2).join(' de ')}
                            </p>
                            <p className="text-xs text-gray-400">{formatHora(cita.hora)}</p>
                          </div>
                          <div className="w-px h-8 bg-[#e8d48a] flex-shrink-0"/>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 truncate">{cita.motivo}</p>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full
                                           font-medium flex-shrink-0 ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Columna derecha — Cliente y resumen */}
            <div className="space-y-5">

              {/* Card cliente */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <User size={16} className="text-[#1e3a5f]"/>
                  <h2 className="text-sm font-medium text-gray-700">Cliente</h2>
                </div>
                {cliente ? (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-full bg-[#1e3a5f] flex items-center
                                      justify-center text-white font-medium flex-shrink-0">
                        {cliente.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{cliente.nombre}</p>
                        <p className="text-xs text-gray-400 capitalize">Cliente</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {cliente.telefono && (
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="text-gray-400">Tel.</span> {cliente.telefono}
                        </p>
                      )}
                      {cliente.correo && (
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="text-gray-400">Email</span> {cliente.correo}
                        </p>
                      )}
                      {cliente.direccion && (
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="text-gray-400">Dir.</span> {cliente.direccion}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/panel/clientes/${cliente.id_cliente}/editar`)}
                      className="mt-4 w-full text-center text-xs text-[#1e3a5f]
                                 hover:underline py-2 border border-gray-200
                                 rounded-lg hover:bg-gray-50 transition-colors">
                      Ver datos del cliente →
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Sin cliente asignado
                  </p>
                )}
              </div>

              {/* Resumen / timeline */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-[#1e3a5f]"/>
                  <h2 className="text-sm font-medium text-gray-700">Resumen</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Estado actual',   value: estadoCfg.label,               badge: estadoCfg.color },
                    { label: 'Tipo de materia', value: caso.tipo,                     badge: null            },
                    { label: 'Citas agendadas', value: `${citas.length} cita${citas.length !== 1 ? 's' : ''}`, badge: null },
                    { label: 'Apertura',        value: formatFecha(caso.fecha_apertura), badge: null         },
                  ].map(item => (
                    <div key={item.label}
                      className="flex items-center justify-between py-2
                                 border-b border-gray-50 last:border-0">
                      <p className="text-xs text-gray-400">{item.label}</p>
                      {item.badge ? (
                        <span className={`text-xs px-2.5 py-1 rounded-full
                                         font-medium ${item.badge}`}>
                          {item.value}
                        </span>
                      ) : (
                        <p className="text-xs font-medium text-gray-700">{item.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}