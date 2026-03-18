import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/axios.config'

export default function LoginPage() {
  const { login }   = useAuth()
  const navigate    = useNavigate()

  const [correo,     setCorreo]     = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/auth/login', { correo, contrasena })

      const { token, user } = res.data

      // Guardar sesión
      login(user, token)

      // Redirigir según rol y estado
      if (user.estado === 'pendiente') {
        navigate('/pendiente')
        return
      }

      const destinations = {
        abogado:    '/panel/dashboard',
        secretario: '/panel/dashboard',
        cliente:    '/cliente/mis-casos',
      }
      navigate(destinations[user.rol] ?? '/login')

    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-96">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Despacho Jurídico</h1>
          <p className="text-gray-400 text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
                          text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5
                         text-sm focus:outline-none focus:ring-2 focus:ring-teal-500
                         focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5
                         text-sm focus:outline-none focus:ring-2 focus:ring-teal-500
                         focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-700 hover:bg-teal-600 disabled:bg-teal-300
                       text-white py-3 rounded-lg transition-colors font-medium
                       text-sm mt-2">
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Link registro */}
        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <a href="/registro"
             className="text-teal-600 hover:text-teal-500 font-medium">
            Regístrate aquí
          </a>
        </p>

      </div>
    </div>
  )
}