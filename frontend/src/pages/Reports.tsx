import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '../components/Layout'
import { MonthlyTrendChart } from '../components/charts/MonthlyTrendChart'
import { InvoiceDistributionChart } from '../components/charts/InvoiceDistributionChart'
import { PartnerBalanceChart } from '../components/charts/PartnerBalanceChart'
import { Download, Calendar, Filter, BarChart3 } from 'lucide-react'
import { financialAPI } from '../services/api'

export function Reports() {
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: '2024-12-31'
  })
  const [reportType, setReportType] = useState('comprehensive')

  const { data: resumen, isLoading } = useQuery({
    queryKey: ['reports', dateRange, reportType],
    queryFn: async () => {
      return await financialAPI.resumenCompleto({
        start_date: dateRange.start,
        end_date: dateRange.end
      })
    }
  })

  const { data: balanceIVA } = useQuery({
    queryKey: ['balance-iva', dateRange],
    queryFn: async () => {
      return await financialAPI.balanceIVA({
        start_date: dateRange.start,
        end_date: dateRange.end
      })
    }
  })

  const { data: balanceGeneral } = useQuery({
    queryKey: ['balance-general', dateRange],
    queryFn: async () => {
      return await financialAPI.balanceGeneral({
        start_date: dateRange.start,
        end_date: dateRange.end
      })
    }
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value)
  }

  if (isLoading) {
    return (
      <Layout title="Reportes Financieros" subtitle="Análisis detallado del sistema">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px' 
        }}>
          <div className="spinner"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout 
      title="Reportes Financieros" 
      subtitle="Análisis detallado y reportes del sistema"
    >
      <div className="page-container">
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
                Fecha Inicio
              </label>
              <input
                type="date"
                className="input"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--spacing-sm)',
                fontWeight: 500
              }}>
                Fecha Fin
              </label>
              <input
                type="date"
                className="input"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--spacing-sm)',
                fontWeight: 500
              }}>
                Tipo de Reporte
              </label>
              <select 
                className="input"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="comprehensive">Resumen Completo</option>
                <option value="iva">Solo Balance IVA</option>
                <option value="general">Solo Balance General</option>
                <option value="partners">Solo Socios</option>
              </select>
            </div>

            <div>
              <button className="btn btn-primary">
                <Download size={20} />
                Exportar PDF
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <div className="card card-income">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ 
                  color: 'var(--color-gray-600)', 
                  fontSize: '0.875rem',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Ingresos Totales
                </p>
                <p className="currency-arg positive" style={{ fontSize: '2rem', fontWeight: 700 }}>
                  {formatCurrency(balanceGeneral?.ingresos || 0)}
                </p>
              </div>
              <div style={{ 
                padding: 'var(--spacing-md)', 
                background: 'var(--color-income-100)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <BarChart3 size={32} color="var(--color-income-600)" />
              </div>
            </div>
          </div>

          <div className="card card-expense">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ 
                  color: 'var(--color-gray-600)', 
                  fontSize: '0.875rem',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Egresos Totales
                </p>
                <p className="currency-arg negative" style={{ fontSize: '2rem', fontWeight: 700 }}>
                  {formatCurrency(balanceGeneral?.egresos || 0)}
                </p>
              </div>
              <div style={{ 
                padding: 'var(--spacing-md)', 
                background: 'var(--color-expense-100)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <BarChart3 size={32} color="var(--color-expense-600)" />
              </div>
            </div>
          </div>

          <div className="card card-iva">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ 
                  color: 'var(--color-gray-600)', 
                  fontSize: '0.875rem',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Balance IVA
                </p>
                <p className="currency-arg" style={{ fontSize: '2rem', fontWeight: 700 }}>
                  {formatCurrency(balanceIVA?.balance_iva || 0)}
                </p>
                <span className={`badge ${balanceIVA?.estado === 'A PAGAR' ? 'badge-expense' : 'badge-income'}`}>
                  {balanceIVA?.estado || 'N/A'}
                </span>
              </div>
              <div style={{ 
                padding: 'var(--spacing-md)', 
                background: 'var(--color-iva-100)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <BarChart3 size={32} color="var(--color-iva-600)" />
              </div>
            </div>
          </div>

          <div className="card card-balance">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ 
                  color: 'var(--color-gray-600)', 
                  fontSize: '0.875rem',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Balance Neto
                </p>
                <p className="currency-arg" style={{ fontSize: '2rem', fontWeight: 700 }}>
                  {formatCurrency(balanceGeneral?.balance || 0)}
                </p>
              </div>
              <div style={{ 
                padding: 'var(--spacing-md)', 
                background: 'var(--color-balance-100)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <BarChart3 size={32} color="var(--color-balance-600)" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div style={{ 
          display: 'grid', 
          gap: 'var(--spacing-xl)',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <MonthlyTrendChart data={resumen?.tendencia_mensual || []} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
            <InvoiceDistributionChart data={resumen?.distribucion_tipo || []} />
            <PartnerBalanceChart data={resumen?.balance_socios || []} />
          </div>
        </div>

        {/* Export Options */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Opciones de Exportación</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-lg)'
          }}>
            <button className="btn btn-primary">
              <Download size={20} />
              Exportar PDF
            </button>
            <button className="btn btn-secondary">
              <Download size={20} />
              Exportar Excel
            </button>
            <button className="btn btn-info">
              <Calendar size={20} />
              Programar Reporte
            </button>
            <button className="btn btn-warning">
              <Filter size={20} />
              Filtros Avanzados
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
