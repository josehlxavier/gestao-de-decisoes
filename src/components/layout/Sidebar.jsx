import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  CheckSquare,
  AlertTriangle,
  LogOut,
  Menu,
  X,
  BookOpen,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard GUT' },
  { to: '/grupos', icon: Users, label: 'Grupos de Trabalho' },
  { to: '/reunioes', icon: FileText, label: 'Atas de Reunião' },
  { to: '/decisoes', icon: BookOpen, label: 'Decisões' },
  { to: '/tarefas', icon: CheckSquare, label: 'Planos de Ação' },
  { to: '/issues', icon: AlertTriangle, label: 'Matriz GUT' },
]

function SidebarContent({ profile, onSignOut, onNavClick }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-blue-700">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <h1 className="text-white font-bold text-sm leading-tight">Gestão de</h1>
          <h1 className="text-blue-200 font-bold text-sm leading-tight">Decisões</h1>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-white' : 'text-blue-300 group-hover:text-white')} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-blue-300" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Perfil e logout */}
      <div className="border-t border-blue-700 px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile?.name || 'Usuário'}</p>
            <p className="text-blue-300 text-xs truncate">{profile?.role || 'member'}</p>
          </div>
          <button
            onClick={onSignOut}
            className="text-blue-300 hover:text-white transition-colors p-1 rounded"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-blue-800 min-h-screen flex-shrink-0">
        <SidebarContent profile={profile} onSignOut={handleSignOut} onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* Botão mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-blue-800 text-white rounded-lg shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-64 bg-blue-800 h-full z-50">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent profile={profile} onSignOut={handleSignOut} onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
