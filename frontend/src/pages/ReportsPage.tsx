import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Download, 
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  PieChart,
  LineChart
} from 'lucide-react';
import apiService from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';
import { FinancialReportExportUtils } from '@/services/exportService';

interface ReportData {
  period: string;
  financial_summary: {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
    iva_balance: number;
  };
  invoice_stats: {
    total_invoices: number;
    sales_count: number;
    purchases_count: number;
    pending_count: number;
    completed_count: number;
  };
  top_clients: Array<{
    name: string;
    total_amount: number;
    invoice_count: number;
  }>;
  top_suppliers: Array<{
    name: string;
    total_amount: number;
    invoice_count: number;
  }>;
  monthly_trends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

interface ReportFilter {
  label: string;
  value: string;
  days: number;
}

const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');
  const [selectedReport, setSelectedReport] = useState<string>('financial');
  
  const { showSuccess, showError } = useNotifications();

  const periods: ReportFilter[] = [
    { label: 'Últimos 7 días', value: '7', days: 7 },
    { label: 'Últimos 30 días', value: '30', days: 30 },
    { label: 'Últimos 90 días', value: '90', days: 90 },
    { label: 'Último año', value: '365', days: 365 }
  ];

  const reportTypes = [
    { id: 'financial', label: 'Resumen Financiero', icon: DollarSign },
    { id: 'invoices', label: 'Estadísticas de Facturas', icon: FileText },
    { id: 'clients', label: 'Top Clientes', icon: Users },
    { id: 'suppliers', label: 'Top Proveedores', icon: Building2 },
    { id: 'trends', label: 'Tendencias Mensuales', icon: LineChart }
  ];

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Cargar datos reales del backend
      const response = await apiService.getReportData(selectedPeriod);
      setReportData(response);
    } catch (error) {
      console.error('Error fetching report data:', error);
      showError('Error al cargar datos del reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    try {
      if (format === 'excel') {
        const reportData = {
          summary: [reportData?.financial_summary || {}],
          invoices: reportData?.monthly_trends || [],
          partners: [
            ...(reportData?.top_clients || []),
            ...(reportData?.top_suppliers || [])
          ],
          trends: reportData?.monthly_trends || []
        };
        
        FinancialReportExportUtils.exportFinancialReport(reportData);
        showSuccess('Reporte Exportado', 'El reporte fue exportado exitosamente a Excel');
      } else if (format === 'csv') {
        // Exportar datos principales a CSV
        const csvData = [
          { tipo: 'Ingresos Totales', valor: reportData?.financial_summary.total_revenue || 0 },
          { tipo: 'Egresos Totales', valor: reportData?.financial_summary.total_expenses || 0 },
          { tipo: 'Beneficio Neto', valor: reportData?.financial_summary.net_profit || 0 },
          { tipo: 'Margen de Beneficio', valor: reportData?.financial_summary.profit_margin || 0 },
          { tipo: 'Balance IVA', valor: reportData?.financial_summary.iva_balance || 0 }
        ];
        
        const { ExportService } = require('@/services/exportService');
        ExportService.exportToCSV(csvData, { filename: 'reporte_financiero' });
        showSuccess('Reporte Exportado', 'El reporte fue exportado exitosamente a CSV');
      } else {
        showError('Formato no disponible', 'La exportación a PDF no está implementada aún');
      }
    } catch (error) {
      showError('Error al exportar', 'No se pudo exportar el reporte');
      console.error('Export error:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Generando reporte...</div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No se pudieron cargar los datos del reporte</p>
      </div>
    );
  }

  const renderFinancialSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(reportData.financial_summary.total_revenue)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Egresos Totales</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(reportData.financial_summary.total_expenses)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Beneficio Neto</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(reportData.financial_summary.net_profit)}
              </p>
              <p className="text-sm text-gray-500">
                {reportData.financial_summary.profit_margin}% margen
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Balance IVA</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(reportData.financial_summary.iva_balance)}
              </p>
              <p className="text-sm text-gray-500">
                {reportData.financial_summary.iva_balance > 0 ? 'A favor' : 'En contra'}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInvoiceStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <p className="text-2xl font-bold">{reportData.invoice_stats.total_invoices}</p>
          <p className="text-sm text-gray-600">Total Facturas</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className="text-2xl font-bold">{reportData.invoice_stats.sales_count}</p>
          <p className="text-sm text-gray-600">Ventas</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <TrendingDown className="w-8 h-8 mx-auto mb-2 text-red-600" />
          <p className="text-2xl font-bold">{reportData.invoice_stats.purchases_count}</p>
          <p className="text-sm text-gray-600">Compras</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
          <p className="text-2xl font-bold">{reportData.invoice_stats.pending_count}</p>
          <p className="text-sm text-gray-600">Pendientes</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className="text-2xl font-bold">{reportData.invoice_stats.completed_count}</p>
          <p className="text-sm text-gray-600">Completadas</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderTopClients = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Top 5 Clientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reportData.top_clients.map((client, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-gray-500">{client.invoice_count} facturas</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">{formatCurrency(client.total_amount)}</p>
                <Progress value={(client.total_amount / reportData.top_clients[0].total_amount) * 100} className="w-20 h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderTopSuppliers = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Top 5 Proveedores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reportData.top_suppliers.map((supplier, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-red-600">#{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium">{supplier.name}</p>
                  <p className="text-sm text-gray-500">{supplier.invoice_count} facturas</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">{formatCurrency(supplier.total_amount)}</p>
                <Progress value={(supplier.total_amount / reportData.top_suppliers[0].total_amount) * 100} className="w-20 h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderMonthlyTrends = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="w-5 h-5" />
          Tendencias Mensuales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reportData.monthly_trends.map((trend, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{trend.month}</h4>
                <Badge className="bg-blue-500 text-white">
                  {formatCurrency(trend.profit)} beneficio
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Ingresos</p>
                  <p className="font-medium text-green-600">{formatCurrency(trend.revenue)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Egresos</p>
                  <p className="font-medium text-red-600">{formatCurrency(trend.expenses)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Beneficio</p>
                  <p className="font-medium text-blue-600">{formatCurrency(trend.profit)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-2">
            Análisis detallado del rendimiento financiero
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleExportReport('pdf')}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button
            onClick={() => handleExportReport('excel')}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button
            onClick={() => handleExportReport('csv')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">Período del Reporte</h3>
              <div className="flex gap-2 flex-wrap">
                {periods.map((period) => (
                  <Button
                    key={period.value}
                    variant={selectedPeriod === period.value ? "default" : "outline"}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={selectedPeriod === period.value ? "bg-primary text-white" : ""}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="md:w-64">
              <h3 className="text-lg font-medium mb-2">Tipo de Reporte</h3>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {reportTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido del Reporte */}
      <div className="space-y-6">
        {selectedReport === 'financial' && renderFinancialSummary()}
        {selectedReport === 'invoices' && renderInvoiceStats()}
        {selectedReport === 'clients' && renderTopClients()}
        {selectedReport === 'suppliers' && renderTopSuppliers()}
        {selectedReport === 'trends' && renderMonthlyTrends()}
      </div>
    </div>
  );
};

export default ReportsPage;
