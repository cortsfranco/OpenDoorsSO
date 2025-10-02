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
  User
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
  Legend
} from 'recharts';
import apiService from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';

interface FinancialSummary {
  total_income: number;
  total_expenses: number;
  iva_balance: number;
  general_balance: number;
  monthly_data: Array<{
    month: string;
    income: number;
    expenses: number;
    profit: number;
  }>;
  balances_por_socio: Array<{
    socio: string;
    balance_iva: number;
    balance_general: number;
    total_ingresos: number;
    total_egresos: number;
  }>;
}

const FinancialOverview: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  
  const { error } = useNotifications();

  useEffect(() => {
    fetchFinancialSummary();
  }, []);

  const fetchFinancialSummary = async () => {
    try {
      setLoading(true);
      
      // Usar datos de ejemplo por ahora hasta que las APIs estén completamente implementadas
      const exampleData = {
        total_income: 2500000,
        total_expenses: 1800000,
        iva_balance: 450000,
        general_balance: 700000
      };
      
      // Generar datos mensuales de ejemplo para los últimos 12 meses
      const monthlyData = generateMonthlyData(exampleData);
      
      // Datos de ejemplo para balances por socio
      const balancesPorSocio = [
        {
          socio: "Franco",
          balance_iva: 150000,
          balance_general: 250000,
          total_ingresos: 800000,
          total_egresos: 550000
        },
        {
          socio: "Joni",
          balance_iva: 200000,
          balance_general: 300000,
          total_ingresos: 1000000,
          total_egresos: 700000
        },
        {
          socio: "Hernán",
          balance_iva: 100000,
          balance_general: 150000,
          total_ingresos: 700000,
          total_egresos: 550000
        }
      ];
      
      setSummary({
        total_income: exampleData.total_income,
        total_expenses: exampleData.total_expenses,
        iva_balance: exampleData.iva_balance,
        general_balance: exampleData.general_balance,
        monthly_data: monthlyData,
        balances_por_socio: balancesPorSocio
      });
    } catch (err: any) {
      console.error('Error fetching financial summary:', err);
      // No mostrar error al usuario por ahora, usar datos de ejemplo
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (response: any) => {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    // Datos de ejemplo basados en los totales del resumen
    const totalIncome = response.total_income || 2000000;
    const totalExpenses = response.total_expenses || 1500000;
    
    return months.map((month, index) => {
      const variation = (Math.random() - 0.5) * 0.3; // ±15% variación
      const income = Math.round((totalIncome / 12) * (1 + variation));
      const expenses = Math.round((totalExpenses / 12) * (1 + variation * 0.5));
      
      return {
        month,
        income,
        expenses,
        profit: income - expenses
      };
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatTooltipValue = (value: number) => {
    return formatCurrency(value);
  };

  const getKPIStatus = (value: number, type: 'income' | 'expense' | 'balance') => {
    if (type === 'balance') {
      return value >= 0 ? 'positive' : 'negative';
    }
    return 'neutral';
  };

  const getKPIStatusColor = (status: string) => {
    switch (status) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getKPIStatusIcon = (status: string) => {
    switch (status) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="main-container">
        <div className="flex items-center justify-center h-64">
          <div className="loading-shimmer w-64 h-8 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Financiero</h1>
          <p className="text-gray-600 mt-2">
            Resumen ejecutivo de la situación financiera
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-500 text-white px-3 py-1">
            <Calendar className="w-4 h-4 mr-2" />
            Últimos 12 meses
          </Badge>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={chartType === 'area' ? 'default' : 'outline'}
              onClick={() => setChartType('area')}
              className="btn-animated"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Área
            </Button>
            <Button
              size="sm"
              variant={chartType === 'bar' ? 'default' : 'outline'}
              onClick={() => setChartType('bar')}
              className="btn-animated"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Barras
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Total Ingresos */}
        <Card className="card-theme-income">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Ingresos</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(summary?.total_income || 0)}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-xs text-green-600 font-medium">+12.5%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Egresos */}
        <Card className="card-theme-expense">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Egresos</p>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(summary?.total_expenses || 0)}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
                  <span className="text-xs text-red-600 font-medium">-8.3%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance IVA */}
        <Card className="card-theme-iva">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Balance IVA</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {formatCurrency(summary?.iva_balance || 0)}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  📋 Solo facturas tipo A
                </p>
                <div className="flex items-center mt-2">
                  <Minus className="w-4 h-4 text-yellow-600 mr-1" />
                  <span className="text-xs text-yellow-600 font-medium">Neutro</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Receipt className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance General */}
        <Card className="card-theme-balance">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Balance General</p>
                <p className={`text-2xl font-bold ${getKPIStatusColor(getKPIStatus(summary?.general_balance || 0, 'balance'))}`}>
                  {formatCurrency(summary?.general_balance || 0)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  💰 Solo facturas con Mov. Cta. = SI
                </p>
                <div className="flex items-center mt-2">
                  {summary && summary.general_balance >= 0 ? (
                    <>
                      <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-xs text-green-600 font-medium">Positivo</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
                      <span className="text-xs text-red-600 font-medium">Negativo</span>
                    </>
                  )}
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Principal */}
      <Card className="card-theme-purple">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Ingresos vs Egresos
            </span>
            <Badge variant="outline" className="text-purple-600 border-purple-300">
              Últimos 12 meses
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={summary?.monthly_data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatTooltipValue(value), '']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Ingresos"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="1"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.6}
                    name="Egresos"
                  />
                </AreaChart>
              ) : (
                <BarChart data={summary?.monthly_data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatTooltipValue(value), '']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#10B981" name="Ingresos" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#EF4444" name="Egresos" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Operaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Ventas (Emitidas) */}
        <Card className="card-theme-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Ventas (Emitidas)</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency((summary?.total_income || 0) * 0.7)}
                </p>
                <p className="text-xs text-gray-500 mt-1">70% del total</p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compras (Recibidas) */}
        <Card className="card-theme-expense">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Compras (Recibidas)</p>
                <p className="text-xl font-bold text-red-700">
                  {formatCurrency((summary?.total_expenses || 0) * 0.8)}
                </p>
                <p className="text-xs text-gray-500 mt-1">80% del total</p>
              </div>
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <Minus className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Neutras (Compensación) */}
        <Card className="card-theme-orange">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Neutras (Compensación)</p>
                <p className="text-xl font-bold text-orange-700">
                  {formatCurrency((summary?.total_income || 0) * 0.3)}
                </p>
                <p className="text-xs text-gray-500 mt-1">30% del total</p>
              </div>
              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Minus className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balances por Socio */}
      {summary?.balances_por_socio && summary.balances_por_socio.length > 0 && (
        <Card className="card-theme-blue">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Balances por Socio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.balances_por_socio.map((socio, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{socio.socio}</h4>
                    <Badge className={socio.balance_general >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {socio.balance_general >= 0 ? "Positivo" : "Negativo"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Balance General:</span>
                      <span className={`font-medium ${socio.balance_general >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(socio.balance_general)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Balance IVA:</span>
                      <span className={`font-medium ${socio.balance_iva >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(socio.balance_iva)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ingresos:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(socio.total_ingresos)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Egresos:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(socio.total_egresos)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      💰 Balance General: Solo facturas con Mov. Cta. = SI
                    </p>
                    <p className="text-xs text-gray-500">
                      📋 Balance IVA: Solo facturas tipo A
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialOverview;