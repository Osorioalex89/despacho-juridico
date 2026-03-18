import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen, Users, Calendar,
  Clock, TrendingUp, AlertCircle
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'

// Datos de prueba — los reemplazaremos con API real después
const mockData = {
  casosActivos:    12,
  citasHoy:        3,
  totalClientes:   28,
  pendientes:       1,
  casosRecientes: [
    { id: 1, titulo: 'Divorcio González',    cliente: 'Juan González',  estado: 'activo',     fecha: '01/01/2026' },
    { id: 2, titulo: 'Herencia Martínez',    cliente: 'Ana Martínez',   estado: 'en_proceso', fecha: '15/02/2026' },
    { id: 3, titulo: 'Contrato Ramírez',     cliente: 'Luis Ramírez',   estado: 'activo',     fecha: '10/03/2026' },
    { id: 4, titulo: 'Pensión López',        cliente: 'María López',    estado: 'cerrado',    fecha: '05/01/2026' },
  ],
  citasHoyLista: [
    { id: 1, hora: '9:00 am',  cliente: 'Juan González',  motivo: 'Revisión de expediente', estado: 'confirmada' },
    { id: 2, hora: '11:00 am', cliente: 'Ana Martínez',   motivo: 'Firma de documentos',    estado: 'pendiente'  },
    { id: 3, hora: '3:00 pm',  cliente: 'Luis Ramírez',   motivo: 'Consulta inicial',       estado: 'confirmada' },
  ],
}

const estadoConfig = {
  activo:     { label: 'Activo',     color: 'bg-green-100 text-green-700' },
  en_proceso: { label: 'En proceso', color: 'bg-blue-100  text-blue-700'  },
  cerrado:    { label: 'Cerrado',    color: 'bg-gray-100  text-gray-600'  },
  suspendido: { label: 'Suspendido', color: 'bg-red-100   text-red-700'   },
}

const citaEstadoConfig = {
  confirmada: { label: 'Confirmada', color: 'bg-green-100 text-green-700'  },
  pendiente:  { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700' },
  cancelada:  { label: 'Cancelada',  color: 'bg-red-100   text-red-700'    },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [data, setData] = useState(mockData)

  // Saludo según la hora
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  // Fecha actual formateada
  const fechaActual = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric',
    month:   'long', day: 'numeric',
  })

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Header */}
      <PageHeader
        title={`${getGreeting()}, ${user?.nombre}`}
        subtitle={fechaActual.charAt(0).toUpperCase() + fechaActual.slice(1)}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Tarjetas de métricas */}
        <div className="grid grid-cols-3 gap-4">

          <div className="bg-white rounded-xl border border-gray-200 p-5
                          hover:border-[#2d5282] transition-colors cursor-pointer"
               onClick={() => navigate('/panel/casos')}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">Casos activos</p>
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <FolderOpen size={18} className="text-[#1e3a5f]"/>
              </div>
            </div>
            <p className="text-3xl font-medium text-gray-800">{data.casosActivos}</p>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp size={12}/> +2 este mes
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5
                          hover:border-[#2d5282] transition-colors cursor-pointer"
               onClick={() => navigate('/panel/agenda')}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">Citas hoy</p>
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                <Calendar size={18} className="text-amber-600"/>
              </div>
            </div>
            <p className="text-3xl font-medium text-gray-800">{data.citasHoy}</p>
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Clock size={12}/> Próxima: 9:00 am
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5
                          hover:border-[#2d5282] transition-colors cursor-pointer"
               onClick={() => navigate('/panel/clientes')}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">Clientes</p>
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                <Users size={18} className="text-green-600"/>
              </div>
            </div>
            <p className="text-3xl font-medium text-gray-800">{data.totalClientes}</p>
            {data.pendientes > 0 && (
              <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12}/> {data.pendientes} pendiente de aprobación
              </p>
            )}
          </div>
        </div>

        {/* Grid inferior */}
        <div className="grid grid-cols-2 gap-4">

          {/* Casos recientes */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">Casos recientes</h2>
              <button onClick={() => navigate('/panel/casos')}
                className="text-xs text-[#1e3a5f] hover:underline">
                Ver todos
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {data.casosRecientes.map(caso => (
                <div key={caso.id}
                     className="px-5 py-3 flex items-center justify-between
                                hover:bg-gray-50 cursor-pointer transition-colors"
                     onClick={() => navigate(`/panel/casos/${caso.id}`)}>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{caso.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{caso.cliente}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                                   ${estadoConfig[caso.estado]?.color}`}>
                    {estadoConfig[caso.estado]?.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Citas de hoy */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">Citas de hoy</h2>
              <button onClick={() => navigate('/panel/agenda')}
                className="text-xs text-[#1e3a5f] hover:underline">
                Ver agenda
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {data.citasHoyLista.map(cita => (
                <div key={cita.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="text-center min-w-[52px]">
                    <p className="text-xs font-medium text-[#1e3a5f]">{cita.hora}</p>
                  </div>
                  <div className="w-0.5 h-8 bg-[#e8d48a] rounded flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{cita.cliente}</p>
                    <p className="text-xs text-gray-400 truncate">{cita.motivo}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0
                                   ${citaEstadoConfig[cita.estado]?.color}`}>
                    {citaEstadoConfig[cita.estado]?.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}