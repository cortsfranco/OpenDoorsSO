import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '../components/Layout'
import { DataTable } from '../components/DataTable'
import { Plus, Upload, Search, Filter } from 'lucide-react'
import { invoicesAPI } from '../services/api'

export function Invoices() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    tipo: '',
    estado: '',
    socio: ''
  })

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['invoices', searchTerm, filters],
    queryFn: async () => {
      return await invoicesAPI.list({ 
        search: searchTerm,
        ...filters 
      })
    }
  })

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true
    },
    {
      key: 'filename',
      label: 'Archivo',
      sortable: true
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value: number) => (
        <span className="currency-arg">
          {new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
          }).format(value)}
        </span>
      )
    },
    {
      key: 'tipo_factura',
      label: 'Tipo',
      sortable: true,
      render: (value: string) => (
        <span className={`badge ${value === 'A' ? 'badge-income' : 'badge-expense'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'fecha_emision',
      label: 'Fecha',
      sortable: true
    },
    {
      key: 'socio_responsable',
      label: 'Socio',
      sortable: true
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (value: any, row: any) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm btn-primary">
            Ver
          </button>
          <button className="btn btn-sm btn-secondary">
            Editar
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
      title="Gestión de Facturas" 
      subtitle="Administra todas las facturas del sistema"
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
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flex: 1 }}>
            <button className="btn btn-primary">
              <Plus size={20} />
              Nueva Factura
            </button>
            <button className="btn btn-secondary">
              <Upload size={20} />
              Subir Facturas
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
                  placeholder="Buscar facturas..."
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
                Tipo
              </label>
              <select 
                className="input"
                value={filters.tipo}
                onChange={(e) => setFilters({...filters, tipo: e.target.value})}
              >
                <option value="">Todos</option>
                <option value="A">Tipo A</option>
                <option value="B">Tipo B</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--spacing-sm)',
                fontWeight: 500
              }}>
                Socio
              </label>
              <select 
                className="input"
                value={filters.socio}
                onChange={(e) => setFilters({...filters, socio: e.target.value})}
              >
                <option value="">Todos</option>
                <option value="Franco">Franco</option>
                <option value="Joni">Joni</option>
              </select>
            </div>

            <div>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setSearchTerm('')
                  setFilters({ tipo: '', estado: '', socio: '' })
                }}
              >
                <Filter size={20} />
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <DataTable
            data={invoices?.invoices || []}
            columns={columns}
            isLoading={isLoading}
            onRefresh={refetch}
            emptyMessage="No hay facturas disponibles"
          />
        </div>
      </div>
    </Layout>
  )
}
