export const ROLES = {
  ABOGADO:    'abogado',
  SECRETARIO: 'secretario',
  CLIENTE:    'cliente',
  USUARIO:    'usuario',
}

export const CASE_STATUS_COLORS = {
  activo:     'bg-green-100 text-green-800',
  en_proceso: 'bg-blue-100  text-blue-800',
  cerrado:    'bg-gray-100  text-gray-700',
  suspendido: 'bg-red-100   text-red-800',
}

export const APPOINTMENT_STATUS_COLORS = {
  pendiente:  'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-green-100  text-green-800',
  cancelada:  'bg-red-100    text-red-800',
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'