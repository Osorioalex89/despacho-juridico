import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getClienteById, createCliente, updateCliente } from './clientsService'
import PageHeader from '../../components/layout/PageHeader'
import { Save, X } from 'lucide-react'

export default function ClientForm() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)

  const [form, setForm] = useState({
    nombre: '', telefono: '', correo: '',
    direccion: '', rfc: '', notas: '',
  })
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (isEdit) {
      setLoading(true)
      getClienteById(id)
        .then(res => setForm(res.data))
        .catch(() => setError('Error al cargar el cliente'))
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        await updateCliente(id, form)
      } else {
        await createCliente(form)
      }
      navigate('/panel/clientes')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center flex-1">
      <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent
                      rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}
        subtitle={isEdit ? 'Modifica los datos del cliente' : 'Registra un nuevo cliente'}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700
                            text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input name="nombre" value={form.nombre} onChange={handleChange}
                  required placeholder="Ej. Juan González"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={handleChange}
                  placeholder="Ej. 555-1234"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <input name="correo" type="email" value={form.correo} onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RFC</label>
                <input name="rfc" value={form.rfc} onChange={handleChange}
                  placeholder="Ej. GOGG800101XXX"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange}
                placeholder="Calle, número, colonia, ciudad..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5
                           text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
              <textarea name="notas" value={form.notas} onChange={handleChange}
                rows={3} placeholder="Observaciones del cliente..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5
                           text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]
                           resize-none"/>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => navigate('/panel/clientes')}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200
                           rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <X size={15}/> Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a5f]
                           hover:bg-[#2d5282] text-white rounded-lg text-sm
                           transition-colors disabled:opacity-50">
                <Save size={15}/>
                {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Guardar cliente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}