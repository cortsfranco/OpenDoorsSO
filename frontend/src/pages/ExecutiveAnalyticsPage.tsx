import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Send,
  Loader2
} from 'lucide-react';
import apiService from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';

interface AnalysisResponse {
  query: string;
  analysis: {
    iva_balance?: {
      credito_fiscal: number;
      debito_fiscal: number;
      balance_iva: number;
      interpretacion: string;
    };
    profitability?: {
      total_income: number;
      total_expenses: number;
      gross_profit: number;
      profit_margin: number;
      analysis: string;
    };
    fiscal_year?: {
      fiscal_year: number;
      current_quarter: string;
      periods: any;
    };
    summary?: {
      total_invoices: number;
      status_breakdown: any;
      pending_approval: number;
    };
  };
  insights: string[];
  recommendations: string[];
  timestamp: string;
}

interface ChartData {
  chart_type: string;
  data: any[];
  total?: number;
  average_monthly?: number;
}

const ExecutiveAnalyticsPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([
    "¿Cuál es el balance de IVA del último trimestre?",
    "¿Cómo está la rentabilidad del negocio?",
    "Muéstrame las tendencias de ingresos",
    "¿Cuántas facturas están pendientes de aprobación?",
    "Análisis de categorías de gastos"
  ]);
  
  const { success, error } = useNotifications();

  const handleAnalyze = async () => {
    if (!query.trim()) {
      error('Consulta Vacía', 'Por favor, ingresa una consulta para analizar.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.analyzeFinancialData({ 
        query: query.trim(),
        period: "last_quarter" 
      });
      
      setAnalysis(response.analysis_result);
      
      // Agregar a consultas recientes si no existe
      if (!recentQueries.includes(query.trim())) {
        setRecentQueries(prev => [query.trim(), ...prev.slice(0, 4)]);
      }
      
      success('Análisis Completado', 'El análisis financiero se ha completado exitosamente.');
    } catch (err: any) {
      error('Error de Análisis', 'No se pudo completar el análisis financiero.');
      console.error('Error analyzing financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Datos de ejemplo para gráficos
  const monthlyIncomeData = [
    { month: 'Ene', income: 150000, expenses: 120000, profit: 30000 },
    { month: 'Feb', income: 180000, expenses: 140000, profit: 40000 },
    { month: 'Mar', income: 220000, expenses: 160000, profit: 60000 },
    { month: 'Abr', income: 190000, expenses: 130000, profit: 60000 },
    { month: 'May', income: 250000, expenses: 170000, profit: 80000 },
    { month: 'Jun', income: 280000, expenses: 180000, profit: 100000 }
  ];

  const categoryData = [
    { name: 'Servicios', value: 400000, color: '#3B82F6' },
    { name: 'Productos', value: 300000, color: '#10B981' },
    { name: 'Consultoría', value: 250000, color: '#F59E0B' },
    { name: 'Mantenimiento', value: 180000, color: '#EF4444' }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Ejecutivos</h1>
          <p className="text-gray-600 mt-2">
            Análisis financiero inteligente con IA - Consulta en lenguaje natural
          </p>
        </div>
        <Badge className="bg-blue-500 text-white">
          <Brain className="w-4 h-4 mr-2" />
          Powered by AI
        </Badge>
      </div>

      {/* Consultas Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Consultas Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {recentQueries.map((quickQuery, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickQuery(quickQuery)}
                className="text-sm"
              >
                {quickQuery}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Área de Consulta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Consulta de Análisis Financiero
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="query" className="text-sm font-medium">
              Escribe tu consulta en lenguaje natural:
            </Label>
            <Textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: ¿Cuál es el balance de IVA del último trimestre? ¿Cómo está la rentabilidad? Muéstrame las tendencias de ingresos..."
              className="mt-2 bg-background text-text-primary border-gray-300"
              rows={4}
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={loading || !query.trim()}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Analizar
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados del Análisis */}
      {analysis && (
        <div className="space-y-6">
          {/* Resumen Ejecutivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Resumen Ejecutivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Balance de IVA */}
                {analysis.analysis.iva_balance && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Balance de IVA</h4>
                    <div className="space-y-1 text-sm">
                      <p>Crédito Fiscal: <span className="font-medium text-green-600">
                        {formatCurrency(analysis.analysis.iva_balance.credito_fiscal)}
                      </span></p>
                      <p>Débito Fiscal: <span className="font-medium text-red-600">
                        {formatCurrency(analysis.analysis.iva_balance.debito_fiscal)}
                      </span></p>
                      <p className="font-semibold">Balance: <span className={
                        analysis.analysis.iva_balance.balance_iva >= 0 
                          ? "text-green-600" 
                          : "text-red-600"
                      }>
                        {formatCurrency(analysis.analysis.iva_balance.balance_iva)}
                      </span></p>
                    </div>
                  </div>
                )}

                {/* Rentabilidad */}
                {analysis.analysis.profitability && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Rentabilidad</h4>
                    <div className="space-y-1 text-sm">
                      <p>Ingresos: <span className="font-medium text-green-600">
                        {formatCurrency(analysis.analysis.profitability.total_income)}
                      </span></p>
                      <p>Egresos: <span className="font-medium text-red-600">
                        {formatCurrency(analysis.analysis.profitability.total_expenses)}
                      </span></p>
                      <p>Margen: <span className="font-semibold text-blue-600">
                        {formatPercentage(analysis.analysis.profitability.profit_margin)}
                      </span></p>
                    </div>
                  </div>
                )}

                {/* Resumen de Facturas */}
                {analysis.analysis.summary && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Facturas</h4>
                    <div className="space-y-1 text-sm">
                      <p>Total: <span className="font-medium">
                        {analysis.analysis.summary.total_invoices}
                      </span></p>
                      <p>Pendientes: <span className="font-medium text-yellow-600">
                        {analysis.analysis.summary.pending_approval}
                      </span></p>
                      <p>Completadas: <span className="font-medium text-green-600">
                        {analysis.analysis.summary.completed || 0}
                      </span></p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Insights y Recomendaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Insights Clave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recomendaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Recomendaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de Análisis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Ingresos vs Egresos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Ingresos vs Egresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyIncomeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="income" fill="#10B981" name="Ingresos" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Egresos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Tendencias de Ganancia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="w-5 h-5" />
                  Tendencias de Ganancia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyIncomeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      name="Ganancia" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Categorías */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Distribución por Categorías
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Área de Ingresos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Evolución de Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyIncomeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.3}
                      name="Ingresos"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Timestamp */}
          <div className="text-center text-sm text-gray-500">
            Análisis generado el {new Date(analysis.timestamp).toLocaleString('es-ES')}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveAnalyticsPage;