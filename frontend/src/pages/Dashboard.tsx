import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';
import { MonthlyTrendChart } from '../components/charts/MonthlyTrendChart';
import { InvoiceDistributionChart } from '../components/charts/InvoiceDistributionChart';
import { PartnerBalanceChart } from '../components/charts/PartnerBalanceChart';
import { financialAPI } from '../services/api';

export function Dashboard() {
  // Fetch datos reales
  const { data: balanceGeneral, isLoading: loadingBalance } = useQuery({
    queryKey: ['balance-general'],
    queryFn: async () => {
      return await financialAPI.balanceGeneral();
    }
  });

  const { data: balanceIVA, isLoading: loadingIVA } = useQuery({
    queryKey: ['balance-iva'],
    queryFn: async () => {
      return await financialAPI.balanceIVA();
    }
  });

  const { data: resumen, isLoading: loadingResumen } = useQuery({
    queryKey: ['resumen-completo'],
    queryFn: async () => {
      return await financialAPI.resumenCompleto();
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (loadingBalance || loadingIVA || loadingResumen) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h1>Dashboard Financiero</h1>
        <p style={{ color: 'var(--color-gray-600)' }}>
          Sistema de Facturación Open Doors
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-2xl)'
      }}>
        {/* Card Ingresos */}
        <div className="card card-income">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ 
                color: 'var(--color-gray-600)', 
                fontSize: '0.875rem',
                marginBottom: 'var(--spacing-sm)'
              }}>
                Total Ingresos
              </p>
              <p className="currency-arg positive" style={{ fontSize: '2rem', fontWeight: 700 }}>
                {formatCurrency(balanceGeneral?.ingresos || 0)}
              </p>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                marginTop: 'var(--spacing-sm)',
                color: 'var(--color-income-600)',
                fontSize: '0.875rem'
              }}>
                <TrendingUp size={16} />
                <span>+12.5% vs mes anterior</span>
              </div>
            </div>
            <div style={{ 
              padding: 'var(--spacing-md)', 
              background: 'var(--color-income-100)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <DollarSign size={32} color="var(--color-income-600)" />
            </div>
          </div>
        </div>

        {/* Card Egresos */}
        <div className="card card-expense">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ 
                color: 'var(--color-gray-600)', 
                fontSize: '0.875rem',
                marginBottom: 'var(--spacing-sm)'
              }}>
                Total Egresos
              </p>
              <p className="currency-arg negative" style={{ fontSize: '2rem', fontWeight: 700 }}>
                {formatCurrency(balanceGeneral?.egresos || 0)}
              </p>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                marginTop: 'var(--spacing-sm)',
                color: 'var(--color-expense-600)',
                fontSize: '0.875rem'
              }}>
                <TrendingDown size={16} />
                <span>-3.2% vs mes anterior</span>
              </div>
            </div>
            <div style={{ 
              padding: 'var(--spacing-md)', 
              background: 'var(--color-expense-100)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <DollarSign size={32} color="var(--color-expense-600)" />
            </div>
          </div>
        </div>

        {/* Card Balance IVA */}
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
              <div style={{ 
                marginTop: 'var(--spacing-sm)',
                fontSize: '0.875rem'
              }}>
                <span className={`badge ${balanceIVA?.estado === 'A PAGAR' ? 'badge-expense' : 'badge-income'}`}>
                  {balanceIVA?.estado || 'N/A'}
                </span>
              </div>
            </div>
            <div style={{ 
              padding: 'var(--spacing-md)', 
              background: 'var(--color-iva-100)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <FileText size={32} color="var(--color-iva-600)" />
            </div>
          </div>
        </div>

        {/* Card Balance General */}
        <div className="card card-balance">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ 
                color: 'var(--color-gray-600)', 
                fontSize: '0.875rem',
                marginBottom: 'var(--spacing-sm)'
              }}>
                Balance General
              </p>
              <p className="currency-arg" style={{ fontSize: '2rem', fontWeight: 700 }}>
                {formatCurrency(balanceGeneral?.balance || 0)}
              </p>
              <div style={{ 
                marginTop: 'var(--spacing-sm)',
                color: 'var(--color-gray-600)',
                fontSize: '0.875rem'
              }}>
                Solo mov. cuenta = SI
              </div>
            </div>
            <div style={{ 
              padding: 'var(--spacing-md)', 
              background: 'var(--color-balance-100)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <TrendingUp size={32} color="var(--color-balance-600)" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas */}
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
    </div>
  );
}
