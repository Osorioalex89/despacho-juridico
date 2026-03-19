import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { getMisCitas }         from '../appointments/appointmentsService'
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente de confirmación', color: 'bg-amber-100 text-amber-700',  icon: AlertCircle,    dot: 'bg-amber-400'  },
  confirmada: { label: 'Confirmada',                color: 'bg-green-100 text-green-700',  icon: CheckCircle,    dot: 'bg-green-500'  },
  cancelada:  { label: 'Cancelada',                 color: 'bg-red-100   text-red-700',    icon: XCircle,        dot: 'bg-red-400'    },
}

function formatHora(hora) {
  if (!hora) return ''
  const [h, m] = hora.split(':')
  const hNum = parseInt(h)
  return `${hNum > 12 ? hNum - 12 : hNum || 12}:${m} ${hNum >= 12 ? 'pm' : 'am'}`
}

export default function MisCitasPage() {
  const navigate = useNavigate()
  const hoy      = new Date()

  const [año,        setAño]        = useState(hoy.getFullYear())
  const [mes,        setMes]        = useState(hoy.getMonth())
  const [diaSelecto, setDiaSelecto] = useState(hoy.toISOString().split('T')[0])
  const [citas,      setCitas]      = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    getMisCitas()
      .then(r => setCitas(r.data.citas))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const citasDelDia = citas.filter(c => c.fecha === diaSelecto)

  const diasEnMes    = new Date(año, mes + 1, 0).getDate()
  const primerDiaSem = new Date(año, mes, 1).getDay()

  const citasPorDia = (dia) => {
    const fecha = `${año}-${String(mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    return citas.filter(c => c.fecha === fecha)
  }

  const navMes = (dir) => {
    let nm = mes + dir, na = año
    if (nm < 0)  { nm = 11; na-- }
    if (nm > 11) { nm = 0;  na++ }
    setMes(nm); setAño(na)
  }

  const selDia = (dia) => {
    setDiaSelecto(`${año}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`)
  }

  const esHoy = (dia) => dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear()
  const esSel = (dia) => `${año}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}` === diaSelecto

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4
                      flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-800">Mis citas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {citas.length} cita{citas.length !== 1 ? 's' : ''} registrada{citas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => navigate('/cliente/solicitar-cita')}
          className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2d5282]
                     text-white px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus size={16}/> Solicitar cita
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">

        {/* Calendario */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">

          {/* Nav mes */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button onClick={() => navMes(-1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">‹</button>
            <p className="text-sm font-medium text-gray-700">{MESES[mes]} {año}</p>
            <button onClick={() => navMes(1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">›</button>
          </div>

          {/* Días semana */}
          <div className="grid grid-cols-7 px-3 py-2">
            {DIAS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Días mes */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
            {Array.from({ length: primerDiaSem }).map((_,i) => <div key={i}/>)}
            {Array.from({ length: diasEnMes }, (_, i) => i + 1).map(dia => {
              const tiene = citasPorDia(dia)
              return (
                <button key={dia} onClick={() => selDia(dia)}
                  className={`relative flex flex-col items-center justify-center
                              h-9 w-9 mx-auto rounded-full text-sm transition-colors ${
                    esSel(dia)  ? 'bg-[#1e3a5f] text-white' :
                    esHoy(dia)  ? 'bg-[#e8d48a] text-[#1e3a5f] font-medium' :
                                  'hover:bg-gray-100 text-gray-700'
                  }`}>
                  {dia}
                  {tiene.length > 0 && (
                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${
                      esSel(dia) ? 'bg-[#e8d48a]' : 'bg-[#1e3a5f]'
                    }`}/>
                  )}
                </button>
              )
            })}
          </div>

          {/* Leyenda estados */}
          <div className="border-t border-gray-100 px-4 py-3 mt-auto space-y-2">
            <p className="text-xs text-gray-400 mb-1">Estados</p>
            {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${v.dot}`}/>
                <span className="text-xs text-gray-500">{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Citas del día */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={15} className="text-[#1e3a5f]"/>
            <p className="text-sm font-medium text-gray-700">
              {new Date(diaSelecto + 'T12:00:00').toLocaleDateString('es-MX', {
                weekday:'long', day:'numeric', month:'long', year:'numeric'
              }).replace(/^\w/, c => c.toUpperCase())}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-7 h-7 border-2 border-[#1e3a5f] border-t-transparent
                              rounded-full animate-spin"/>
            </div>
          ) : citasDelDia.length === 0 ? (
            <div className="text-center py-16">
              <Clock size={36} className="mx-auto text-gray-300 mb-3"/>
              <p className="text-sm text-gray-400">Sin citas para este día</p>
              <button onClick={() => navigate('/cliente/solicitar-cita')}
                className="mt-3 text-sm text-[#1e3a5f] hover:underline">
                + Solicitar una cita
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {citasDelDia.map(cita => {
                const cfg = ESTADO_CONFIG[cita.estado]
                const Icon = cfg.icon
                return (
                  <div key={cita.id_cita}
                    className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center
                                       flex-shrink-0 ${cfg.color}`}>
                        <Icon size={16}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-800">{cita.motivo}</p>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                                           flex-shrink-0 ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {cita.hora && cita.estado === 'confirmada' && (
                          <p className="text-xs text-[#1e3a5f] font-medium mt-1">
                            🕐 {formatHora(cita.hora)}
                          </p>
                        )}
                        {cita.estado === 'pendiente' && (
                          <p className="text-xs text-amber-600 mt-1">
                            En espera de confirmación del despacho
                          </p>
                        )}
                        {cita.mensaje && (
                          <p className="text-xs text-gray-400 mt-1 italic">
                            "{cita.mensaje}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}