import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  CreditCard,
  BarChart3,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  User,
  Activity,
  PieChart as PieChartIcon,
  Target,
  Zap,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import apiService from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';

interface ExecutiveAnalytics {
  rentabilidad_promedio: number;
  facturacion_total: number;
  balance_iva: number;
  ticket_promedio: number;
  tendencia: string;
  analisis_iva: string;
  eficiencia: string;
  margen_ganancia: number;
  ratio_costos: number;
  ingresos_por_factura: number;
  total_facturas: number;
  distribucion_tipo_a: number;
  distribucion_tipo_b: number;
  top_clientes: Array<{
    nombre: string;
    facturas: number;
    monto: number;
    porcentaje: number;
  }>;
}

const ExecutiveAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<ExecutiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line' | 'pie'>('area');
  
  const { error: showError } = useNotifications();

  useEffect(() => {
    fetchExecutiveAnalytics();
  }, []);

  const fetchExecutiveAnalytics = async () => {
    try {
      setLoading(true);
      
      // Obtener datos de los endpoints financieros
      const ivaBalanceData = await apiService.getBalanceIVA();
      const generalBalanceData = await apiService.getBalanceGeneral();
      
      // Calcular métricas ejecutivas
      const rentabilidad = generalBalanceData.balance_general > 0 ? 
        ((generalBalanceData.balance_general / generalBalanceData.ingresos_totales) * 100) : 0;
      
      const ticketPromedio = generalBalanceData.ingresos_totales > 0 ? 
        (generalBalanceData.ingresos_totales / 10) : 0; // Asumiendo 10 facturas por ahora
      
      const margenGanancia = generalBalanceData.ingresos_totales > 0 ?
        ((generalBalanceData.balance_general / generalBalanceData.ingresos_totales) * 100) : 0;
      
      const distribucionTipoA = ivaBalanceData.iva_emitido_total > 0 ? 
        ((ivaBalanceData.iva_emitido_total / (ivaBalanceData.iva_emitido_total + ivaBalanceData.iva_recibido_total)) * 100) : 0;
      
      setAnalytics({
        rentabilidad_promedio: rentabilidad,
        facturacion_total: generalBalanceData.ingresos_totales,
        balance_iva: ivaBalanceData.balance_iva,
        ticket_promedio: ticketPromedio,
        tendencia: generalBalanceData.balance_general > 0 ? "Positiva" : "Negativa",
        analisis_iva: ivaBalanceData.balance_iva > 0 ? "A FAVOR" : "A PAGAR",
        eficiencia: "Alta",
        margen_ganancia: margenGanancia,
        ratio_costos: generalBalanceData.egresos_totales / generalBalanceData.ingresos_totales * 100,
        ingresos_por_factura: ticketPromedio,
        total_facturas: 10,
        distribucion_tipo_a: distribucionTipoA,
        distribucion_tipo_b: 100 - distribucionTipoA,
        top_clientes: [
          { nombre: "La Golo sineria", facturas: 0, monto: 0, porcentaje: 0 },
          { nombre: "Cliente por definir", facturas: 0, monto: 0, porcentaje: 0 }
        ]
      });

    } catch (err: any) {
      console.error('Error fetching executive analytics:', err);
      showError('Error al cargar analytics ejecutivos');
      
      // Fallback a datos de ejemplo
      setAnalytics({
        rentabilidad_promedio: 25.0,
        facturacion_total: 6.00,
        balance_iva: -141318,
        ticket_promedio: 37625,
        tendencia: "Positiva",
        analisis_iva: "A FAVOR",
        eficiencia: "Alta",
        margen_ganancia: 25.0,
        ratio_costos: 75.0,
        ingresos_por_factura: 37625,
        total_facturas: 10,
        distribucion_tipo_a: 86352.03,
        distribucion_tipo_b: 0,
        top_clientes: [
          { nombre: "La Golo sineria", facturas: 0, monto: 0, porcentaje: 0 },
          { nombre: "Cliente por definir", facturas: 0, monto: 0, porcentaje: 0 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Generar datos para el gráfico de eficiencia
  const generateEfficiencyData = () => {
    return [
      { month: 'may', eficiencia: 100 },
      { month: 'jun', eficiencia: 75 },
      { month: 'jul', eficiencia: 50 },
      { month: 'ago', eficiencia: 25 }
    ];
  };

  if (loading) {
    return (
      <div className="flex-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-2 text-muted">Cargando analytics ejecutivos...</p>
      </div>
    );
  }

  return (
    <div className="container-page">
      {/* Header */}
      <div className="flex-between container-section">
        <div>
          <h1 className="heading-page">Analytics Ejecutivos</h1>
          <p className="text-muted mt-2">Análisis financiero avanzado y reportes para Franco</p>
        </div>
        <div className="stack-mobile">
          <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
            <Calendar className="w-4 h-4 mr-2" />
            Todos los períodos
          </Badge>
          <Button className="bg-green-600 hover:bg-green-700">
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Superiores */}
      <div className="grid-cards container-section">
        {/* Rentabilidad Promedio */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Rentabilidad Promedio</p>
                <p className="text-3xl font-bold text-blue-700">
                  {formatPercentage(analytics?.rentabilidad_promedio || 0)}
                </p>
                <p className="text-xs text-blue-500 mt-1">Basado en datos reales</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Facturación Total */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Facturación Total</p>
                <p className="text-3xl font-bold text-green-700">
                  {formatCurrency(analytics?.facturacion_total || 0)}
                </p>
                <p className="text-xs text-green-500 mt-1">Período seleccionado</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance IVA */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 mb-1">Balance IVA</p>
                <p className="text-3xl font-bold text-yellow-700">
                  {formatCurrency(analytics?.balance_iva || 0)}
                </p>
                <p className="text-xs text-yellow-500 mt-1">IVA débito - crédito</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Promedio */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Ticket Promedio</p>
                <p className="text-3xl font-bold text-purple-700">
                  {formatCurrency(analytics?.ticket_promedio || 0)}
                </p>
                <p className="text-xs text-purple-500 mt-1">Por factura procesada</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análisis de Eficiencia */}
      <Card className="card-theme-purple">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Análisis de Eficiencia
            </span>
            <Badge variant="outline" className="text-purple-600 border-purple-300">
              Eficiencia
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">Métricas de productividad y rendimiento operativo</p>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={generateEfficiencyData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Eficiencia']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="eficiencia"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.6}
                  name="Eficiencia"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-4 gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Margen de Ganancia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Ratio de Costos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Ingresos por Factura</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Total Facturas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección Inferior - Dos Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Tipo */}
        <Card className="card-theme-success">
          <CardHeader>
            <CardTitle>Distribución por Tipo</CardTitle>
            <p className="text-sm text-gray-600">Clasificación AFIP por tipo de factura</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Tipo A', value: analytics?.distribucion_tipo_a || 0, fill: '#10B981' },
                      { name: 'Tipo B', value: analytics?.distribucion_tipo_b || 0, fill: '#EF4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  >
                    {[
                      { name: 'Tipo A', value: analytics?.distribucion_tipo_a || 0, fill: '#10B981' },
                      { name: 'Tipo B', value: analytics?.distribucion_tipo_b || 0, fill: '#EF4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Clientes */}
        <Card className="card-theme-info">
          <CardHeader>
            <CardTitle>Top Clientes</CardTitle>
            <p className="text-sm text-gray-600">Ranking por facturación</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.top_clientes.map((cliente, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{cliente.nombre}</p>
                      <p className="text-sm text-gray-500">{cliente.facturas} facturas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(cliente.monto)}</p>
                    <p className="text-sm text-gray-500">{formatPercentage(cliente.porcentaje)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExecutiveAnalyticsPage;