import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginPage from '../features/auth/LoginPage'
import CasesPage from '../features/cases/CasesPage'
import CaseForm from '../features/cases/CaseForm'
import DashboardPage from '../features/dashboard/DashboardPage'
import PanelLayout from '../components/layout/PanelLayout'
import ClientsPage from '../features/clients/ClientsPage'
import ClientForm from '../features/clients/ClientForm'
import AgendaPage from '../features/appointments/AgendaPage'
import MisCitasPage from '../features/clientPortal/MisCitasPage'
import SolicitarCitaPage from '../features/clientPortal/SolicitarCitaPage'
import ClientNavbar from '../components/layout/ClientNavbar'
import CaseDetail from '../features/cases/CaseDetail'
import UsuariosPendientesPage from '../features/users/UsuariosPendientesPage'
import RegisterPage from '../features/auth/RegisterPage'
import PendientePage from '../features/auth/PendientePage'
import MisCasosPage from '../features/clientportal/MisCasosPage'
import DocumentosPage from '../features/documents/DocumentosPage'
import ClientDetail from '../features/clients/ClientDetail'





const Placeholder = ({ title, badge }) => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="text-center">
      {badge && (
        <span className="text-xs font-medium bg-teal-100 text-teal-800
                         px-3 py-1 rounded-full mb-4 inline-block">
          {badge}
        </span>
      )}
      <h1 className="text-3xl font-bold text-gray-800 mt-2">{title}</h1>
      <p className="text-gray-400 mt-2 text-sm">En construcción 🚧</p>
    </div>
  </div>
)

function ProtectedRoute({ children, requiredRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.rol)) {
    const roleHome = {
      abogado: '/panel/dashboard',
      secretario: '/panel/dashboard',
      cliente: '/cliente/mis-citas',
      usuario: '/pendiente',
    }
    return <Navigate to={roleHome[user?.rol] ?? '/login'} replace />
  }
  return children
}

function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  const destinations = {
    abogado: '/panel/dashboard',
    secretario: '/panel/dashboard',
    cliente: '/cliente/mis-citas',
    usuario: '/pendiente',
  }
  return <Navigate to={destinations[user?.rol] ?? '/login'} replace />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Públicas ── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

        {/* ── Usuario pendiente de aprobación ── */}
        <Route path="/pendiente" element={
          <ProtectedRoute requiredRoles={['usuario']}>
            <PendientePage />
          </ProtectedRoute>
        } />

        {/* ── Panel interno (Abogado + Secretario) ── */}
        <Route path="/panel/dashboard" element={
          <ProtectedRoute requiredRoles={['abogado', 'secretario']}>
            <PanelLayout><DashboardPage /></PanelLayout>
          </ProtectedRoute>
        } />

        <Route path="/panel/clientes" element={
          <ProtectedRoute requiredRoles={['abogado', 'secretario']}>
            <PanelLayout><ClientsPage /></PanelLayout>
          </ProtectedRoute>
        } />
        <Route path="/panel/clientes/nuevo" element={
          <ProtectedRoute requiredRoles={['abogado', 'secretario']}>
            <PanelLayout><ClientForm /></PanelLayout>
          </ProtectedRoute>
        } />
        <Route path="/panel/clientes/:id/editar" element={
          <ProtectedRoute requiredRoles={['abogado', 'secretario']}>
            <PanelLayout><ClientForm /></PanelLayout>
          </ProtectedRoute>
        } />
        <Route path="/panel/clientes/:id" element={
          <ProtectedRoute requiredRoles={['abogado', 'secretario']}>
            <PanelLayout><ClientDetail /></PanelLayout>
          </ProtectedRoute>
        } />
        <Route path="/panel/casos" element={
          <ProtectedRoute requiredRoles={['abogado', 'secretario']}>
            <PanelLayout><CasesPage /></PanelLayout>
          </ProtectedRoute>
        } />
        <Route path="/panel/casos/nuevo" element={
          <ProtectedRoute requiredRoles={['abogado']}>
            <PanelLayout><CaseForm /></PanelLayout>
          </ProtectedRoute>
        } />
        <Route path="/panel/casos/:id/editar" element={
          <ProtectedRoute requiredRoles={['abogado']}>
            <PanelLayout><CaseForm /></PanelLayout>
          </ProtectedRoute>
        } />
        <Route path="/panel/casos/:id" element={
          <ProtectedRoute requiredRoles={['abogado', 'secretario']}>
            <PanelLayout><CaseDetail /></PanelLayout>
          </ProtectedRoute>
        } />
        <Route path="/panel/agenda" element={
          <ProtectedRoute requiredRoles={['abogado', 'secretario']}>
            <PanelLayout><AgendaPage /></PanelLayout>
          </ProtectedRoute>
        } />

        <Route path="/panel/usuarios-pendientes" element={
          <ProtectedRoute requiredRoles={['abogado', 'secretario']}>
            <PanelLayout><UsuariosPendientesPage defaultEstado="pendiente" /></PanelLayout>
          </ProtectedRoute>
        } />
        <Route path="/panel/usuarios" element={
          <ProtectedRoute requiredRoles={['abogado']}>
            <PanelLayout><UsuariosPendientesPage defaultEstado="" /></PanelLayout>
          </ProtectedRoute>
        } />
        <Route path="/panel/documentos" element={
          <ProtectedRoute requiredRoles={['abogado', 'secretario']}>
            <PanelLayout><DocumentosPage /></PanelLayout>
          </ProtectedRoute>
        } />


        {/* ── Portal del Cliente ── */}

        <Route path="/cliente/mis-citas" element={
          <ProtectedRoute requiredRoles={['cliente']}>
            <ClientNavbar><MisCitasPage /></ClientNavbar>
          </ProtectedRoute>
        } />
        <Route path="/cliente/solicitar-cita" element={
          <ProtectedRoute requiredRoles={['cliente']}>
            <ClientNavbar><SolicitarCitaPage /></ClientNavbar>
          </ProtectedRoute>
        } />
        <Route path="/cliente/mis-casos" element={
          <ProtectedRoute requiredRoles={['cliente']}>
            <ClientNavbar><MisCasosPage /></ClientNavbar>
          </ProtectedRoute>
        } />

        {/* ── Redirecciones ── */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}