import { useState, useEffect } from 'react'
import { createCita, updateCita } from './appointmentsService'
import { getCasos } from '../cases/casesService'
import { X, Save } from 'lucide-react'

const FORM_INICIAL = {
  id_cliente: '', id_caso: '', fecha: '',
  hora: '', motivo: '', estado: 'pendiente', notas: '',
}

export default function CitaModal({ cita, fechaInicial, clientes, onClose, onGuardado }) {
  const isEdit = Boolean(cita)
  const [form,   setForm]   = useState(FORM_INICIAL)
  const [casos,  setCasos]  = useState([])
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  useEffect(() => {
    getCasos({ limit: 100 }).then(r => setCasos(r.data.casos)).catch(() => {})

    if (isEdit) {
      setForm({
        id_cliente: cita.id_cliente || '',
        id_caso:    cita.id_caso    || '',
        fecha:      cita.fecha      || '',
        hora:       cita.hora?.slice(0, 5) || '',
        motivo:     cita.motivo     || '',
        estado:     cita.estado     || 'pendiente',
        notas:      cita.notas      || '',
      })
    } else {
      setForm(prev => ({ ...prev, fecha: fechaInicial || '' }))
    }
  }, [])

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        await updateCita(cita.id_cita, form)
      } else {
        await createCita(form)
      }
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar la cita')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-medium text-gray-800">
            {isEdit ? 'Editar cita' : 'Nueva cita'}
          </h2>
          <button onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-gray-500"/>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700
                            text-sm rounded-lg px-3 py-2">{error}</div>
          )}

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo <span className="text-red-500">*</span>
            </label>
            <input name="motivo" value={form.motivo} onChange={handleChange}
              required placeholder="Ej. Consulta inicial, firma de documentos..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input name="fecha" type="date" value={form.fecha}
                onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora <span className="text-red-500">*</span>
              </label>
              <input name="hora" type="time" value={form.hora}
                onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select name="id_cliente" value={form.id_cliente} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white">
              <option value="">Sin asignar</option>
              {clientes.map(c => (
                <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Caso vinculado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caso vinculado</label>
            <select name="id_caso" value={form.id_caso} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white">
              <option value="">Sin vincular</option>
              {casos.map(c => (
                <option key={c.id_caso} value={c.id_caso}>{c.folio} — {c.asunto}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select name="estado" value={form.estado} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white">
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea name="notas" value={form.notas} onChange={handleChange}
              rows={2} placeholder="Observaciones adicionales..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-none"/>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                         text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a5f]
                         hover:bg-[#2d5282] text-white rounded-lg text-sm
                         transition-colors disabled:opacity-50">
              <Save size={15}/>
              {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Agendar cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}