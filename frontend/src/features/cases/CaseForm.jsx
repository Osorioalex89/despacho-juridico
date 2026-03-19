import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCasoById, createCaso, updateCaso } from './casesService'
import { getClientes } from '../clients/clientsService'
import PageHeader from '../../components/layout/PageHeader'
import { Save, X } from 'lucide-react'

const TIPOS = [
  'Penal', 'Civil', 'Amparo', 'Sucesorio',
  'Contratos', 'Trámite de escrituras',
  'Inscripción de posesión', 'Asesoría legal',
]

const ESTADOS = [
  { value: 'activo',      label: 'Activo'       },
  { value: 'urgente',     label: 'Urgente'       },
  { value: 'pendiente',   label: 'Pendiente'     },
  { value: 'en_revision', label: 'En revisión'   },
  { value: 'cerrado',     label: 'Cerrado'       },
]

const FORM_INICIAL = {
  asunto: '', tipo: '', estado: 'activo', descripcion: '',
  id_cliente: '', juzgado: '', exp_externo: '',
  contraparte: '', fecha_apertura: '', fecha_limite: '', notas: '',
}

export default function CaseForm() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)

  const [form,     setForm]     = useState(FORM_INICIAL)
  const [clientes, setClientes] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    // Carga clientes para el select
    getClientes({ limit: 100 })
      .then(res => setClientes(res.data.clientes))
      .catch(() => {})

    // Si es edición, carga el caso
    if (isEdit) {
      setLoading(true)
      getCasoById(id)
        .then(res => {
          const c = res.data
          setForm({
            asunto:         c.asunto        || '',
            tipo:           c.tipo          || '',
            estado:         c.estado        || 'activo',
            descripcion:    c.descripcion   || '',
            id_cliente:     c.id_cliente    || '',
            juzgado:        c.juzgado       || '',
            exp_externo:    c.exp_externo   || '',
            contraparte:    c.contraparte   || '',
            fecha_apertura: c.fecha_apertura|| '',
            fecha_limite:   c.fecha_limite  || '',
            notas:          c.notas         || '',
          })
        })
        .catch(() => setError('Error al cargar el caso'))
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        await updateCaso(id, form)
      } else {
        await createCaso(form)
      }
      navigate('/panel/casos')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar el caso')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center flex-1">
      <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title={isEdit ? 'Editar caso' : 'Nuevo caso'}
        subtitle={isEdit ? 'Modifica los datos del expediente' : 'Registra un nuevo expediente jurídico'}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700
                            text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

            {/* Asunto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asunto / título <span className="text-red-500">*</span>
              </label>
              <input name="asunto" value={form.asunto} onChange={handleChange}
                required placeholder="Ej. Homicidio culposo — García vs Estado"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
            </div>

            {/* Tipo y Estado */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de caso <span className="text-red-500">*</span>
                </label>
                <select name="tipo" value={form.tipo} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white">
                  <option value="">Seleccionar...</option>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white">
                  {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / antecedentes</label>
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                rows={3} placeholder="Breve descripción del caso y antecedentes relevantes..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-none"/>
            </div>

            {/* Cliente y Fechas */}
            <div className="grid grid-cols-3 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha apertura <span className="text-red-500">*</span>
                </label>
                <input name="fecha_apertura" type="date" value={form.fecha_apertura}
                  onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
                <input name="fecha_limite" type="date" value={form.fecha_limite}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
              </div>
            </div>

            {/* Juzgado y Referencia */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Juzgado / instancia</label>
                <input name="juzgado" value={form.juzgado} onChange={handleChange}
                  placeholder="Ej. Juzgado 3o. Civil, Centla"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. expediente tribunal</label>
                <input name="exp_externo" value={form.exp_externo} onChange={handleChange}
                  placeholder="Ej. 1234/2025"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
              </div>
            </div>

            {/* Contraparte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraparte</label>
              <input name="contraparte" value={form.contraparte} onChange={handleChange}
                placeholder="Nombre de la contraparte"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
              <textarea name="notas" value={form.notas} onChange={handleChange}
                rows={2} placeholder="Notas internas del despacho..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-none"/>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => navigate('/panel/casos')}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200
                           rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <X size={15}/> Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a5f]
                           hover:bg-[#2d5282] text-white rounded-lg text-sm
                           transition-colors disabled:opacity-50">
                <Save size={15}/>
                {saving ? 'Guardando...' : isEdit ? 'Actualizar caso' : 'Guardar caso'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}