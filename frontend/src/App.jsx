import AppRouter from './router/AppRouter'
import { AuthProvider } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <AppRouter />
      </NotificationsProvider>
    </AuthProvider>
  )
}

export default App