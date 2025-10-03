import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DistributionData {
  tipo: string;
  cantidad: number;
  monto: number;
}

interface InvoiceDistributionChartProps {
  data: DistributionData[];
}

const COLORS = {
  'A': 'var(--color-iva-600)',    // Amarillo - facturas con IVA
  'B': 'var(--color-balance-600)', // Azul - facturas B
  'C': 'var(--color-gray-500)',    // Gris - sin IVA
  'X': 'var(--color-gray-300)'     // Gris claro - otros
};

export function InvoiceDistributionChart({ data }: InvoiceDistributionChartProps) {
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
        Distribución por Tipo de Factura
      </h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ tipo, cantidad, percent }) => 
              `${tipo}: ${cantidad} (${(percent * 100).toFixed(1)}%)`
            }
            outerRadius={120}
            fill="#8884d8"
            dataKey="cantidad"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.tipo as keyof typeof COLORS] || 'var(--color-gray-400)'}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: any) => {
              if (name === 'cantidad') {
                return [`${value} facturas`, 'Cantidad'];
              }
              return [formatCurrency(props.payload.monto), 'Monto Total'];
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* Tabla resumen */}
      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Monto Total</th>
              <th>Promedio</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.tipo}>
                <td>
                  <span className="badge badge-income">Factura {item.tipo}</span>
                </td>
                <td>{item.cantidad}</td>
                <td className="currency-arg">{formatCurrency(item.monto)}</td>
                <td className="currency-arg">
                  {formatCurrency(item.monto / item.cantidad)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
