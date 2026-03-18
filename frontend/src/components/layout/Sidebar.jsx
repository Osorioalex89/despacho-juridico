import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, FolderOpen,
  Calendar, FileText, UserCheck, LogOut, Scale
} from 'lucide-react'

const navItems = [
  {
    label: 'Dashboard',
    path: '/panel/dashboard',
    icon: LayoutDashboard,
    roles: ['abogado', 'secretario'],
  },
  {
    label: 'Clientes',
    path: '/panel/clientes',
    icon: Users,
    roles: ['abogado', 'secretario'],
  },
  {
    label: 'Casos',
    path: '/panel/casos',
    icon: FolderOpen,
    roles: ['abogado', 'secretario'],
  },
  {
    label: 'Agenda',
    path: '/panel/agenda',
    icon: Calendar,
    roles: ['abogado', 'secretario'],
  },
  {
    label: 'Documentos',
    path: '/panel/documentos',
    icon: FileText,
    roles: ['abogado', 'secretario'],
  },
  {
    label: 'Solicitudes',
    path: '/panel/usuarios-pendientes',
    icon: UserCheck,
    roles: ['abogado', 'secretario'],
  },
]

export default function Sidebar() {
  const { user, logout, canManageUsers } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Filtra items según el rol
  const filteredItems = navItems.filter(item =>
    item.roles.includes(user?.rol)
  )

  return (
    <aside className="w-56 min-h-screen bg-[#1e3a5f] flex flex-col flex-shrink-0">

      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#2d5282]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#e8d48a] rounded-lg flex items-center justify-center flex-shrink-0">
            <Scale size={18} className="text-[#1e3a5f]" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[#f0e6c8] text-sm font-medium leading-tight">Lic. Oracio</p>
            <p className="text-[#7a9abf] text-xs leading-tight">Sánchez Cerino</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {filteredItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                ? 'bg-[#2d5282] text-[#e8d48a] font-medium'
                : 'text-[#7a9abf] hover:bg-[#2d5282] hover:text-[#c8daf0]'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {/* Solo abogado ve gestión de usuarios */}
        {canManageUsers && (
          <>
            <div className="border-t border-[#2d5282] my-3" />
            <NavLink
              to="/panel/usuarios"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                  ? 'bg-[#2d5282] text-[#e8d48a] font-medium'
                  : 'text-[#7a9abf] hover:bg-[#2d5282] hover:text-[#c8daf0]'
                }`
              }
            >
              <Users size={16} />
              Usuarios
            </NavLink>
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-3 border-t border-[#2d5282]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#2d5282] border border-[#e8d48a]
                          flex items-center justify-center text-[#e8d48a] text-xs
                          font-medium flex-shrink-0">
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#f0e6c8] text-xs font-medium truncate">{user?.nombre}</p>
            <p className="text-[#7a9abf] text-xs capitalize">{user?.rol}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                     text-[#7a9abf] hover:bg-[#2d5282] hover:text-red-400
                     transition-colors text-xs"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}