import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface PartnerBalance {
  socio: string;
  ingresos: number;
  egresos: number;
  balance: number;
}

interface PartnerBalanceChartProps {
  data: PartnerBalance[];
}

export function PartnerBalanceChart({ data }: PartnerBalanceChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Colores por socio
  const getBarColor = (socio: string) => {
    const colors: Record<string, string> = {
      'Franco': '#3b82f6',
      'Joni': '#10b981',
      'Hernán': '#f59e0b',
      'Maxi': '#8b5cf6',
      'Leo': '#ec4899'
    };
    return colors[socio] || 'var(--color-gray-500)';
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
        Balance por Socio
      </h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
          <XAxis 
            dataKey="socio" 
            stroke="var(--color-gray-500)"
          />
          <YAxis 
            stroke="var(--color-gray-500)"
            tickFormatter={formatCurrency}
          />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid var(--color-gray-200)',
              borderRadius: 'var(--radius-md)'
            }}
          />
          <Legend />
          
          <Bar 
            dataKey="ingresos" 
            fill="var(--color-income-600)" 
            name="Ingresos"
          />
          <Bar 
            dataKey="egresos" 
            fill="var(--color-expense-600)" 
            name="Egresos"
          />
          <Bar 
            dataKey="balance" 
            name="Balance Neto"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry.socio)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Cards individuales por socio */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--spacing-md)',
        marginTop: 'var(--spacing-lg)'
      }}>
        {data.map((partner) => (
          <div 
            key={partner.socio}
            className="card"
            style={{ 
              borderLeft: `4px solid ${getBarColor(partner.socio)}`,
              padding: 'var(--spacing-md)'
            }}
          >
            <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>{partner.socio}</h4>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
              <div>Ingresos: {formatCurrency(partner.ingresos)}</div>
              <div>Egresos: {formatCurrency(partner.egresos)}</div>
              <div style={{ 
                marginTop: 'var(--spacing-sm)', 
                fontWeight: 600,
                color: partner.balance >= 0 ? 'var(--color-income-600)' : 'var(--color-expense-600)'
              }}>
                Balance: {formatCurrency(partner.balance)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
