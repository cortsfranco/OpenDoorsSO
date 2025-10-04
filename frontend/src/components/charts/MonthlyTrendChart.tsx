import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyData {
  mes: string;
  ingresos: number;
  egresos: number;
  balance: number;
}

interface MonthlyTrendChartProps {
  data: MonthlyData[];
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  // Formatear moneda argentina
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
        Tendencia Mensual - Ingresos vs Egresos
      </h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
          <XAxis 
            dataKey="mes" 
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
          
          <Line 
            type="monotone" 
            dataKey="ingresos" 
            stroke="var(--color-income-600)" 
            strokeWidth={3}
            name="Ingresos"
            dot={{ fill: 'var(--color-income-600)', r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="egresos" 
            stroke="var(--color-expense-600)" 
            strokeWidth={3}
            name="Egresos"
            dot={{ fill: 'var(--color-expense-600)', r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="balance" 
            stroke="var(--color-balance-600)" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Balance"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
