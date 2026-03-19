import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { solicitarCita } from '../appointments/appointmentsService'
import { CheckCircle, Calendar, X } from 'lucide-react'

export default function SolicitarCitaPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fecha: '', motivo: '', mensaje: '',
  })
  const [saving,  setSaving]  = useState(false)
  const [exito,   setExito]   = useState(false)
  const [error,   setError]   = useState('')

  const hoy = new Date().toISOString().split('T')[0]

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await solicitarCita(form)
      setExito(true)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al enviar la solicitud')
    } finally {
      setSaving(false)
    }
  }

  if (exito) return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center max-w-sm w-full">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center
                        justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-green-600"/>
        </div>
        <h2 className="text-lg font-medium text-gray-800 mb-2">
          ¡Solicitud enviada!
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Tu solicitud fue recibida. El secretario del despacho confirmará
          la fecha y hora de tu cita a la brevedad.
        </p>
        <button
          onClick={() => navigate('/cliente/mis-citas')}
          className="w-full bg-[#1e3a5f] hover:bg-[#2d5282] text-white
                     py-2.5 rounded-lg text-sm font-medium transition-colors">
          Ver mis citas
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-800">Solicitar cita</h1>
          <p className="text-sm text-gray-500 mt-1">
            Completa el formulario y el despacho confirmará tu cita.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
                          text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

          {/* Fecha preferida */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha preferida <span className="text-red-500">*</span>
            </label>
            <input name="fecha" type="date" value={form.fecha}
              min={hoy} onChange={handleChange} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
            <p className="text-xs text-gray-400 mt-1">
              El despacho puede ajustar la fecha según disponibilidad.
            </p>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de la cita <span className="text-red-500">*</span>
            </label>
            <input name="motivo" value={form.motivo} onChange={handleChange}
              required placeholder="Ej. Consulta sobre mi caso, firma de documentos..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
          </div>

          {/* Mensaje adicional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje adicional
            </label>
            <textarea name="mensaje" value={form.mensaje} onChange={handleChange}
              rows={4}
              placeholder="Cuéntanos brevemente en qué te podemos ayudar o cualquier
detalle adicional que debamos saber antes de la cita..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-none"/>
          </div>

          {/* Info del despacho */}
          <div className="bg-[#f0f4f8] rounded-lg p-4 flex gap-3">
            <Calendar size={16} className="text-[#1e3a5f] flex-shrink-0 mt-0.5"/>
            <div>
              <p className="text-xs font-medium text-[#1e3a5f]">Lic. Horacio Sánchez Cerino</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Francisco Javier Mina #25, Villa Vicente Guerrero, Centla, Tabasco
              </p>
              <p className="text-xs text-gray-500">Tel. 913-100-44-13</p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => navigate('/cliente/mis-citas')}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                         text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f]
                         hover:bg-[#2d5282] text-white rounded-lg text-sm
                         font-medium transition-colors disabled:opacity-50">
              <Calendar size={15}/>
              {saving ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}