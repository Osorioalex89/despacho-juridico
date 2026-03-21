import { useState, useEffect, useRef } from 'react'
import { useAuth }       from '../../context/AuthContext'
import { getCasos }      from '../cases/casesService'
import { getClientes }   from '../clients/clientsService'
import { getDocumentos, uploadDocumento, deleteDocumento } from './documentsService'
import PageHeader from '../../components/layout/PageHeader'
import {
  Upload, Trash2, Download, FileText,
  File, Image, FileBadge, Search, FolderOpen, User
} from 'lucide-react'

const CATEGORIA_CONFIG = {
  general:      { label: 'General',      color: 'bg-blue-100 text-blue-700' },
  confidencial: { label: 'Confidencial', color: 'bg-red-100 text-red-700'  },
}

function getFileIcon(tipo) {
  if (!tipo) return File
  if (tipo.includes('pdf'))   return FileText
  if (tipo.includes('image')) return Image
  if (tipo.includes('word') || tipo.includes('document')) return FileBadge
  return File
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentosPage() {
  const { canEditCases, canUploadConfidential } = useAuth()
  const fileInputRef = useRef(null)

  const [casos,       setCasos]       = useState([])
  const [clientes,    setClientes]    = useState([])
  const [casoSel,     setCasoSel]     = useState('')
  const [docs,        setDocs]        = useState([])
  const [loading,     setLoading]     = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [search,      setSearch]      = useState('')
  const [categoria,   setCategoria]   = useState('')
  const [archivos,    setArchivos]    = useState([])
  const [descripcion, setDescripcion] = useState('')
  const [catUpload,   setCatUpload]   = useState('general')
  const [dragOver,    setDragOver]    = useState(false)

  useEffect(() => {
    getCasos({ limit: 100 })
      .then(r => setCasos(r.data.casos))
      .catch(() => {})
    getClientes({ limit: 100 })
      .then(r => setClientes(r.data.clientes))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!casoSel) { setDocs([]); return }
    setLoading(true)
    getDocumentos(casoSel)
      .then(r => setDocs(r.data.documentos))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [casoSel])

  const docsFiltrados = docs.filter(d => {
    const matchQ = !search || d.nombre_original.toLowerCase().includes(search.toLowerCase())
    const matchC = !categoria || d.categoria === categoria
    return matchQ && matchC
  })

  const handleFiles = (files) => {
    setArchivos(prev => {
      const nombres = new Set(prev.map(f => f.name))
      return [...prev, ...Array.from(files).filter(f => !nombres.has(f.name))]
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleUpload = async () => {
    if (!casoSel || archivos.length === 0) return
    setUploading(true)
    try {
      await Promise.all(
        archivos.map(f => uploadDocumento(casoSel, f, catUpload, descripcion))
      )
      setArchivos([])
      setDescripcion('')
      const r = await getDocumentos(casoSel)
      setDocs(r.data.documentos)
    } catch { alert('Error al subir archivos') }
    finally  { setUploading(false) }
  }

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    try {
      await deleteDocumento(id)
      setDocs(prev => prev.filter(d => d.id_documento !== id))
    } catch { alert('Error al eliminar') }
  }

  const handleDescargar = async (id, nombre) => {
    const token = localStorage.getItem('token')
    const res   = await fetch(
      `http://localhost:3001/api/documentos/${id}/descargar`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = nombre
    a.click()
    URL.revokeObjectURL(url)
  }

  const casoActual    = casos.find(c => String(c.id_caso) === String(casoSel))
  const clienteActual = casoActual
    ? clientes.find(cl => cl.id_cliente === casoActual.id_cliente)
    : null

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title="Documentos"
        subtitle="Gestión de archivos por expediente"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Selector de caso */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Seleccionar expediente
              </label>
              <select value={casoSel} onChange={e => setCasoSel(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5
                           text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                <option value="">Selecciona un caso para ver sus documentos...</option>
                {casos.map(c => {
                  const cli = clientes.find(cl => cl.id_cliente === c.id_cliente)
                  return (
                    <option key={c.id_caso} value={c.id_caso}>
                      {c.folio} — {c.asunto}{cli ? ` · ${cli.nombre}` : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Card del caso seleccionado */}
            {casoActual && (
              <div className="flex items-center gap-3 px-4 py-3 bg-blue-50
                              border border-blue-100 rounded-xl">
                <FolderOpen size={16} className="text-[#1e3a5f] flex-shrink-0"/>
                <div>
                  <p className="text-xs font-medium text-[#1e3a5f]">{casoActual.folio}</p>
                  <p className="text-xs text-gray-600 truncate max-w-[200px]">{casoActual.asunto}</p>
                  {clienteActual && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <User size={10}/> {clienteActual.nombre}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {casoSel && (
          <>
            {/* Zona de subida */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Upload size={15} className="text-[#1e3a5f]"/>
                Subir documentos
                {clienteActual && (
                  <span className="text-xs text-gray-400 font-normal ml-1">
                    — {clienteActual.nombre}
                  </span>
                )}
              </h2>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center
                            cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-[#1e3a5f] bg-blue-50'
                    : 'border-gray-200 hover:border-[#1e3a5f] hover:bg-gray-50'
                }`}>
                <Upload size={28} className="mx-auto text-gray-300 mb-2"/>
                <p className="text-sm text-gray-500">
                  Arrastra archivos aquí o{' '}
                  <span className="text-[#1e3a5f] font-medium">haz clic para seleccionar</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, Word, Excel, JPG, PNG — máx. 20 MB
                </p>
              </div>
              <input ref={fileInputRef} type="file" multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                className="hidden"
                onChange={e => handleFiles(e.target.files)}/>

              {/* Lista archivos seleccionados */}
              {archivos.length > 0 && (
                <div className="mt-3 space-y-2">
                  {archivos.map(f => (
                    <div key={f.name} className="flex items-center gap-2 px-3 py-2
                                                  bg-gray-50 rounded-lg border border-gray-200">
                      <FileText size={14} className="text-gray-400 flex-shrink-0"/>
                      <span className="flex-1 text-sm text-gray-700 truncate">{f.name}</span>
                      <span className="text-xs text-gray-400">{formatSize(f.size)}</span>
                      <button onClick={() => setArchivos(prev => prev.filter(x => x.name !== f.name))}
                        className="text-gray-400 hover:text-red-500 text-sm ml-1">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {archivos.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Categoría
                    </label>
                    <select value={catUpload} onChange={e => setCatUpload(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2
                                 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                      <option value="general">General</option>
                      {canUploadConfidential && (
                        <option value="confidencial">Confidencial</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Descripción (opcional)
                    </label>
                    <input type="text" value={descripcion}
                      onChange={e => setDescripcion(e.target.value)}
                      placeholder="Breve descripción del documento"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2
                                 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
                  </div>
                </div>
              )}

              {archivos.length > 0 && (
                <div className="mt-4 flex justify-end gap-3">
                  <button onClick={() => setArchivos([])}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm
                               text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleUpload} disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f]
                               hover:bg-[#2d5282] text-white rounded-lg text-sm
                               font-medium transition-colors disabled:opacity-50">
                    <Upload size={14}/>
                    {uploading ? 'Subiendo...' : `Subir ${archivos.length} archivo${archivos.length > 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
            </div>

            {/* Lista de documentos */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FileText size={15} className="text-[#1e3a5f]"/>
                  Documentos del expediente
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {docsFiltrados.length}
                  </span>
                </h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="text" value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar archivo..."
                      className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg
                                 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] w-44"/>
                  </div>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                               bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                    <option value="">Todas las categorías</option>
                    <option value="general">General</option>
                    <option value="confidencial">Confidencial</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-7 h-7 border-2 border-[#1e3a5f] border-t-transparent
                                  rounded-full animate-spin"/>
                </div>
              ) : docsFiltrados.length === 0 ? (
                <div className="text-center py-14">
                  <FileText size={36} className="mx-auto text-gray-300 mb-3"/>
                  <p className="text-sm text-gray-400">
                    {docs.length === 0
                      ? 'No hay documentos en este expediente'
                      : 'Sin resultados para los filtros aplicados'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {docsFiltrados.map(doc => {
                    const Icon = getFileIcon(doc.tipo)
                    const cfg  = CATEGORIA_CONFIG[doc.categoria] || CATEGORIA_CONFIG.general
                    return (
                      <div key={doc.id_documento}
                        className="flex items-center gap-3 p-3 border border-gray-100
                                   rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center
                                        justify-center flex-shrink-0">
                          <Icon size={18} className="text-[#1e3a5f]"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {doc.nombre_original}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            <span className="text-xs text-gray-400">{formatSize(doc.tamanio)}</span>
                            {doc.descripcion && (
                              <span className="text-xs text-gray-400 truncate max-w-[150px]">
                                · {doc.descripcion}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(doc.createdAt).toLocaleDateString('es-MX')}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => handleDescargar(doc.id_documento, doc.nombre_original)}
                            className="p-1.5 text-gray-400 hover:text-[#1e3a5f]
                                       hover:bg-blue-50 rounded-lg transition-colors">
                            <Download size={14}/>
                          </button>
                          {canEditCases && (
                            <button onClick={() => handleDelete(doc.id_documento, doc.nombre_original)}
                              className="p-1.5 text-gray-400 hover:text-red-500
                                         hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={14}/>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Estado vacío */}
        {!casoSel && (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <FolderOpen size={48} className="mx-auto text-gray-300 mb-4"/>
            <p className="text-gray-500 text-sm font-medium mb-1">Selecciona un expediente</p>
            <p className="text-gray-400 text-xs">
              Elige un caso del selector de arriba para ver y gestionar sus documentos
            </p>
          </div>
        )}
      </div>
    </div>
  )
}