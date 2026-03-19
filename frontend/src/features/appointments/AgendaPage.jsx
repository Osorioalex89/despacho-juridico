import { useState, useEffect } from 'react'
import { getCitas, updateEstadoCita, deleteCita } from './appointmentsService'
import { getClientes } from '../clients/clientsService'
import PageHeader from '../../components/layout/PageHeader'
import CitaModal  from './CitaModal'
import {
  ChevronLeft, ChevronRight, Plus,
  Check, X, Trash2, Clock, Calendar, AlertCircle
} from 'lucide-react'
const DIAS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MESES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400'  },
  confirmada: { label: 'Confirmada', color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  cancelada:  { label: 'Cancelada',  color: 'bg-red-100   text-red-700',    dot: 'bg-red-400'    },
}

function formatHora(hora) {
  if (!hora) return ''
  const [h, m] = hora.split(':')
  const hNum = parseInt(h)
  return `${hNum > 12 ? hNum - 12 : hNum || 12}:${m} ${hNum >= 12 ? 'pm' : 'am'}`
}

export default function AgendaPage() {
  const hoy = new Date()

  const [año,         setAño]         = useState(hoy.getFullYear())
  const [mes,         setMes]         = useState(hoy.getMonth())
  const [diaSelecto,  setDiaSelecto]  = useState(hoy.toISOString().split('T')[0])
  const [citas,       setCitas]       = useState([])
  const [citasDelDia, setCitasDelDia] = useState([])
  const [clientes,    setClientes]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [citaEdit,    setCitaEdit]    = useState(null)

  const fetchCitas = async () => {
    setLoading(true)
    try {
      const res = await getCitas({ limit: 200 })
      setCitas(res.data.citas)
    } catch {
      console.error('Error al cargar citas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCitas()
    getClientes({ limit: 100 }).then(r => setClientes(r.data.clientes)).catch(() => {})
  }, [])

  useEffect(() => {
    setCitasDelDia(citas.filter(c => c.fecha === diaSelecto))
  }, [diaSelecto, citas])

  const diasEnMes    = new Date(año, mes + 1, 0).getDate()
  const primerDiaSem = new Date(año, mes, 1).getDay()

  const citasPorDia = (dia) => {
    const fecha = `${año}-${String(mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    return citas.filter(c => c.fecha === fecha)
  }

  const navMes = (dir) => {
    let nuevoMes = mes + dir
    let nuevoAño = año
    if (nuevoMes < 0)  { nuevoMes = 11; nuevoAño-- }
    if (nuevoMes > 11) { nuevoMes = 0;  nuevoAño++ }
    setMes(nuevoMes)
    setAño(nuevoAño)
  }

  const seleccionarDia = (dia) => {
    const fecha = `${año}-${String(mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    setDiaSelecto(fecha)
  }

  const handleEstado = async (id, estado) => {
    try {
      await updateEstadoCita(id, estado)
      fetchCitas()
    } catch { alert('Error al actualizar estado') }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta cita?')) return
    try {
      await deleteCita(id)
      fetchCitas()
    } catch { alert('Error al eliminar') }
  }

  const abrirNueva = () => { setCitaEdit(null); setModalOpen(true) }
  const abrirEdit  = (c)  => { setCitaEdit(c);  setModalOpen(true) }
  const onGuardado = () => { setModalOpen(false); fetchCitas() }

  const esHoy = (dia) => {
    const h = new Date()
    return dia === h.getDate() && mes === h.getMonth() && año === h.getFullYear()
  }

  const esDiaSelecto = (dia) => {
    const fecha = `${año}-${String(mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    return fecha === diaSelecto
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title="Agenda de Citas"
        subtitle={`${citasDelDia.length} cita${citasDelDia.length !== 1 ? 's' : ''} para el día seleccionado`}
        action={
          <button onClick={abrirNueva}
            className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5282]
                       text-white px-4 py-2 rounded-lg text-sm transition-colors">
            <Plus size={16}/> Nueva cita
          </button>
        }
      />

      <div className="flex-1 overflow-hidden flex gap-0">

        {/* Calendario */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">

          {/* Navegación mes */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button onClick={() => navMes(-1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={16} className="text-gray-500"/>
            </button>
            <p className="text-sm font-medium text-gray-700">
              {MESES[mes]} {año}
            </p>
            <button onClick={() => navMes(1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={16} className="text-gray-500"/>
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 px-3 py-2">
            {DIAS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
            {Array.from({ length: primerDiaSem }).map((_, i) => (
              <div key={`empty-${i}`}/>
            ))}
            {Array.from({ length: diasEnMes }, (_, i) => i + 1).map(dia => {
              const citasDia   = citasPorDia(dia)
              const tieneHoy   = esHoy(dia)
              const tieneSelec = esDiaSelecto(dia)
              return (
                <button key={dia} onClick={() => seleccionarDia(dia)}
                  className={`relative flex flex-col items-center justify-center
                              h-9 w-9 mx-auto rounded-full text-sm transition-colors ${
                    tieneSelec
                      ? 'bg-[#1e3a5f] text-white'
                      : tieneHoy
                        ? 'bg-[#e8d48a] text-[#1e3a5f] font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                  }`}>
                  {dia}
                  {citasDia.length > 0 && (
                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${
                      tieneSelec ? 'bg-[#e8d48a]' : 'bg-[#1e3a5f]'
                    }`}/>
                  )}
                </button>
              )
            })}
          </div>

          {/* Mini resumen del mes */}
          <div className="border-t border-gray-100 px-4 py-3 mt-auto">
            <p className="text-xs text-gray-400 mb-2">Este mes</p>
            <div className="space-y-1.5">
              {['pendiente','confirmada','cancelada'].map(e => {
                const count = citas.filter(c => {
                  const d = new Date(c.fecha)
                  return c.estado === e && d.getMonth() === mes && d.getFullYear() === año
                }).length
                return (
                  <div key={e} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${ESTADO_CONFIG[e].dot}`}/>
                      <span className="text-xs text-gray-500 capitalize">{ESTADO_CONFIG[e].label}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Panel derecho — citas del día */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Aviso solicitudes pendientes ← AQUÍ adentro del panel derecho */}
          {citas.filter(c => c.estado === 'pendiente').length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4
                            flex items-center gap-3">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0"/>
              <p className="text-sm text-amber-700">
                <span className="font-medium">
                  {citas.filter(c => c.estado === 'pendiente').length} cita
                  {citas.filter(c => c.estado === 'pendiente').length !== 1 ? 's' : ''} pendiente
                  {citas.filter(c => c.estado === 'pendiente').length !== 1 ? 's' : ''} de confirmación
                </span>
                {' '}— revisa el calendario y confirma o ajusta la fecha.
              </p>
            </div>
          )}

          {/* Encabezado del día */}
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={16} className="text-[#1e3a5f]"/>
            <p className="text-sm font-medium text-gray-700">
              {new Date(diaSelecto + 'T12:00:00').toLocaleDateString('es-MX', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              }).replace(/^\w/, c => c.toUpperCase())}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent
                              rounded-full animate-spin"/>
            </div>
          ) : citasDelDia.length === 0 ? (
            <div className="text-center py-20">
              <Clock size={40} className="mx-auto text-gray-300 mb-3"/>
              <p className="text-gray-400 text-sm">Sin citas para este día</p>
              <button onClick={abrirNueva}
                className="mt-4 text-sm text-[#1e3a5f] hover:underline">
                + Agendar una cita
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {citasDelDia
                .sort((a, b) => a.hora.localeCompare(b.hora))
                .map(cita => {
                  const cfg     = ESTADO_CONFIG[cita.estado]
                  const cliente = clientes.find(c => c.id_cliente === cita.id_cliente)
                  return (
                    <div key={cita.id_cita}
                      className="bg-white border border-gray-200 rounded-xl p-4
                                 hover:border-[#2d5282] transition-colors">
                      <div className="flex items-start justify-between gap-3">

                        {/* Hora + línea */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="text-center min-w-[52px] flex-shrink-0">
                            <p className="text-sm font-medium text-[#1e3a5f]">
                              {formatHora(cita.hora)}
                            </p>
                          </div>
                          <div className="w-px h-full min-h-[40px] bg-[#e8d48a] flex-shrink-0"/>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{cita.motivo}</p>
                            {cliente && (
                              <p className="text-xs text-gray-400 mt-0.5">{cliente.nombre}</p>
                            )}
                            {cita.notas && (
                              <p className="text-xs text-gray-400 mt-1 italic">{cita.notas}</p>
                            )}
                          </div>
                        </div>

                        {/* Badge estado + acciones */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          {cita.estado === 'pendiente' && (
                            <button onClick={() => handleEstado(cita.id_cita, 'confirmada')}
                              title="Confirmar"
                              className="p-1.5 text-gray-400 hover:text-green-600
                                         hover:bg-green-50 rounded-lg transition-colors">
                              <Check size={14}/>
                            </button>
                          )}
                          {cita.estado !== 'cancelada' && (
                            <button onClick={() => handleEstado(cita.id_cita, 'cancelada')}
                              title="Cancelar"
                              className="p-1.5 text-gray-400 hover:text-amber-600
                                         hover:bg-amber-50 rounded-lg transition-colors">
                              <X size={14}/>
                            </button>
                          )}
                          <button onClick={() => abrirEdit(cita)}
                            title="Editar"
                            className="p-1.5 text-gray-400 hover:text-[#1e3a5f]
                                       hover:bg-blue-50 rounded-lg transition-colors">
                            <Clock size={14}/>
                          </button>
                          <button onClick={() => handleDelete(cita.id_cita)}
                            title="Eliminar"
                            className="p-1.5 text-gray-400 hover:text-red-500
                                       hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <CitaModal
          cita={citaEdit}
          fechaInicial={diaSelecto}
          clientes={clientes}
          onClose={() => setModalOpen(false)}
          onGuardado={onGuardado}
        />
      )}
    </div>
  )
}