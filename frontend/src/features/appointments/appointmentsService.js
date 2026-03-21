import api from '../../services/axios.config'

export const getCitas          = (params)     => api.get('/citas', { params })
export const getCitaById       = (id)         => api.get(`/citas/${id}`)
export const createCita        = (data)       => api.post('/citas', data)
export const updateCita        = (id, data)   => api.put(`/citas/${id}`, data)
export const updateEstadoCita  = (id, estado) => api.patch(`/citas/${id}/estado`, { estado })
export const deleteCita        = (id)         => api.delete(`/citas/${id}`)
export const solicitarCita = (data)  => api.post('/citas/solicitar', data)
export const getMisCitas   = ()      => api.get('/citas/mis-citas')
