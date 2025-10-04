import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '../components/Layout'
import { DataTable } from '../components/DataTable'
import { Plus, Search, UserCheck, TrendingUp } from 'lucide-react'
import { partnersAPI } from '../services/api'

export function Partners() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: partners, isLoading, refetch } = useQuery({
    queryKey: ['partners', searchTerm],
    queryFn: async () => {
      return await partnersAPI.list()
    }
  })

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true
    },
    {
      key: 'name',
      label: 'Nombre',
      sortable: true
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'balance',
      label: 'Balance',
      sortable: true,
      render: (value: number) => (
        <span className={`currency-arg ${value >= 0 ? 'positive' : 'negative'}`}>
          {new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
          }).format(value || 0)}
        </span>
      )
    },
    {
      key: 'facturas_count',
      label: 'Facturas',
      sortable: true,
      render: (value: number) => (
        <span className="badge badge-info">
          {value || 0}
        </span>
      )
    },
    {
      key: 'ultima_actividad',
      label: 'Última Actividad',
      sortable: true
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (value: any, row: any) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm btn-primary">
            Ver Detalles
          </button>
          <button className="btn btn-sm btn-secondary">
            Editar
          </button>
          <button className="btn btn-sm btn-info">
            <TrendingUp size={16} />
            Balance
          </button>
        </div>
      )
    }
  ]

  return (
    <Layout 
      title="Gestión de Socios" 
      subtitle="Administra socios y sus balances financieros"
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
              <Plus size={20} />
              Nuevo Socio
            </button>
            <button className="btn btn-secondary">
              <TrendingUp size={20} />
              Reporte de Balances
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
                  placeholder="Buscar socios..."
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
              <button 
                className="btn btn-secondary"
                onClick={() => setSearchTerm('')}
              >
                Limpiar Búsqueda
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)'
        }}>
          <div className="card card-income">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '12px',
                background: 'var(--color-income-100)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <UserCheck size={24} color="var(--color-income-600)" />
              </div>
              <div>
                <p style={{ 
                  color: 'var(--color-gray-600)', 
                  fontSize: '0.875rem',
                  marginBottom: '4px'
                }}>
                  Total Socios
                </p>
                <p style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700,
                  color: 'var(--color-income-600)',
                  margin: 0
                }}>
                  {partners?.partners?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card card-balance">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '12px',
                background: 'var(--color-balance-100)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <TrendingUp size={24} color="var(--color-balance-600)" />
              </div>
              <div>
                <p style={{ 
                  color: 'var(--color-gray-600)', 
                  fontSize: '0.875rem',
                  marginBottom: '4px'
                }}>
                  Balance Total
                </p>
                <p className="currency-arg" style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700,
                  margin: 0
                }}>
                  $ 0,00
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <DataTable
            data={partners?.partners || []}
            columns={columns}
            isLoading={isLoading}
            onRefresh={refetch}
            emptyMessage="No hay socios disponibles"
          />
        </div>
      </div>
    </Layout>
  )
}
