import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '../components/Layout'
import { DataTable } from '../components/DataTable'
import { Plus, Search, UserPlus, Shield } from 'lucide-react'

export function Users() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Mock data para usuarios
  const mockUsers = [
    {
      id: 1,
      email: 'cortsfranco@hotmail.com',
      full_name: 'Franco Corts',
      role: 'superadmin',
      is_active: true,
      created_at: '2024-01-15'
    },
    {
      id: 2,
      email: 'joni@opendoors.com',
      full_name: 'Joni Admin',
      role: 'admin',
      is_active: true,
      created_at: '2024-01-20'
    },
    {
      id: 3,
      email: 'contador@opendoors.com',
      full_name: 'Contador Sistema',
      role: 'accountant',
      is_active: true,
      created_at: '2024-02-01'
    }
  ]

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', searchTerm, roleFilter],
    queryFn: async () => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      let filteredUsers = mockUsers
      
      if (searchTerm) {
        filteredUsers = filteredUsers.filter(user => 
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      if (roleFilter) {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter)
      }
      
      return { users: filteredUsers, total: filteredUsers.length }
    }
  })

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true
    },
    {
      key: 'full_name',
      label: 'Nombre',
      sortable: true
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'role',
      label: 'Rol',
      sortable: true,
      render: (value: string) => {
        const roleColors = {
          superadmin: 'badge-danger',
          admin: 'badge-warning',
          accountant: 'badge-info',
          approver: 'badge-secondary',
          editor: 'badge-primary',
          partner: 'badge-success',
          viewer: 'badge-light'
        }
        return (
          <span className={`badge ${roleColors[value as keyof typeof roleColors] || 'badge-light'}`}>
            {value.toUpperCase()}
          </span>
        )
      }
    },
    {
      key: 'is_active',
      label: 'Estado',
      sortable: true,
      render: (value: boolean) => (
        <span className={`badge ${value ? 'badge-success' : 'badge-danger'}`}>
          {value ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Creado',
      sortable: true
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (value: any, row: any) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm btn-primary">
            Editar
          </button>
          <button className="btn btn-sm btn-secondary">
            Roles
          </button>
          <button className="btn btn-sm btn-danger">
            Eliminar
          </button>
        </div>
      )
    }
  ]

  return (
    <Layout 
      title="Gestión de Usuarios" 
      subtitle="Administra usuarios y permisos del sistema"
    >
      <div className="page-container">
        {/* Header Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-xl)',
          flexWrap: 'wrap',
          gap: 'var(--spacing-lg)'
        }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button className="btn btn-primary">
              <UserPlus size={20} />
              Nuevo Usuario
            </button>
            <button className="btn btn-secondary">
              <Shield size={20} />
              Gestión de Roles
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-lg)',
            alignItems: 'end'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--spacing-sm)',
                fontWeight: 500
              }}>
                Buscar
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
                <Search 
                  size={20} 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-gray-400)'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--spacing-sm)',
                fontWeight: 500
              }}>
                Rol
              </label>
              <select 
                className="input"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">Todos los roles</option>
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="accountant">Contador</option>
                <option value="approver">Aprobador</option>
                <option value="editor">Editor</option>
                <option value="partner">Socio</option>
                <option value="viewer">Visualizador</option>
              </select>
            </div>

            <div>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setSearchTerm('')
                  setRoleFilter('')
                }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <DataTable
            data={users?.users || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No hay usuarios disponibles"
          />
        </div>
      </div>
    </Layout>
  )
}
