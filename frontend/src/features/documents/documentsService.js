import api from '../../services/axios.config'

export const getDocumentos    = (id_caso)  => api.get('/documentos', { params: { id_caso } })
export const deleteDocumento  = (id)       => api.delete(`/documentos/${id}`)
export const descargarDoc     = (id)       => `http://localhost:3001/api/documentos/${id}/descargar`

export const uploadDocumento  = (id_caso, archivo, categoria, descripcion) => {
  const formData = new FormData()
  formData.append('archivo',     archivo)
  formData.append('id_caso',     id_caso)
  formData.append('categoria',   categoria)
  formData.append('descripcion', descripcion)
  return api.post('/documentos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
export const getMisDocumentos    = (id_caso) =>
  api.get('/documentos/mis-documentos', { params: id_caso ? { id_caso } : {} })

export const analizarDocumentoIA = (id) => api.post(`/documentos/${id}/analizar`)
export const toggleBloqueoDoc    = (id) => api.patch(`/documentos/${id}/toggle-bloqueo`)