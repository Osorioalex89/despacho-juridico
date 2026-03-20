import api from '../../services/axios.config'

export const getUsuarios          = (params)        => api.get('/usuarios', { params })
export const updateEstadoUsuario  = (id, data)      => api.patch(`/usuarios/${id}/estado`, data)
export const deleteUsuario        = (id)            => api.delete(`/usuarios/${id}`)