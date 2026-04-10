import api from '../../services/axios.config'

export const getCasos    = (params)     => api.get('/casos', { params })
export const getCasoById = (id)         => api.get(`/casos/${id}`)
export const createCaso  = (data)       => api.post('/casos', data)
export const updateCaso  = (id, data)   => api.put(`/casos/${id}`, data)
export const deleteCaso  = (id)         => api.delete(`/casos/${id}`)
export const getMisCasos      = ()           => api.get('/casos/mis-casos')
export const getTimeline      = (id)         => api.get(`/casos/${id}/timeline`)
export const getMovimientos   = (id)         => api.get(`/casos/${id}/movimientos`)
export const addMovimiento    = (id, data)   => api.post(`/casos/${id}/movimientos`, data)
export const chatCaso         = (id, data)   => api.post(`/casos/${id}/chat`, data)