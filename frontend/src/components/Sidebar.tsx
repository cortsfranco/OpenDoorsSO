import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  UserCheck, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Vista general financiera'
    },
    {
      path: '/invoices',
      label: 'Facturas',
      icon: FileText,
      description: 'Gestión de facturas'
    },
    {
      path: '/users',
      label: 'Usuarios',
      icon: Users,
      description: 'Gestión de usuarios',
      adminOnly: true
    },
    {
      path: '/partners',
      label: 'Socios',
      icon: UserCheck,
      description: 'Gestión de socios'
    },
    {
      path: '/reports',
      label: 'Reportes',
      icon: BarChart3,
      description: 'Reportes financieros'
    },
    {
      path: '/settings',
      label: 'Configuración',
      icon: Settings,
      description: 'Configuración del sistema',
      adminOnly: true
    }
  ]

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && user?.role !== 'superadmin' && user?.role !== 'admin') {
      return false
    }
    return true
  })

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onToggle}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40
          }}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '280px',
          background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          zIndex: 50,
          padding: 'var(--spacing-xl)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <div>
            <h2 style={{ 
              color: 'white', 
              fontSize: '1.5rem', 
              fontWeight: 700,
              marginBottom: '4px'
            }}>
              Open Doors
            </h2>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: '0.875rem' 
            }}>
              Sistema de Facturación
            </p>
          </div>
          <button
            onClick={onToggle}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600
            }}>
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <p style={{ 
                color: 'white', 
                fontWeight: 600,
                marginBottom: '2px'
              }}>
                {user?.full_name || 'Usuario'}
              </p>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '0.875rem' 
              }}>
                {user?.role || 'Usuario'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <li key={item.path} style={{ marginBottom: '8px' }}>
                  <Link
                    to={item.path}
                    onClick={onToggle}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: 'var(--spacing-md)',
                      borderRadius: 'var(--radius-md)',
                      color: isActive ? 'white' : 'rgba(255, 255, 255, 0.8)',
                      background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      fontSize: '0.95rem',
                      fontWeight: isActive ? 600 : 400
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                        e.currentTarget.style.color = 'white'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
                      }
                    }}
                  >
                    <Icon size={20} />
                    <div>
                      <div>{item.label}</div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginTop: '2px'
                      }}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: 'var(--spacing-md)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  )
}
