import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Calendar,
  Filter,
  Download,
  BarChart3
} from 'lucide-react';
import apiService from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';

interface SalesVsPurchasesData {
  period: string;
  sales: {
    total: number;
    count: number;
    invoices: Array<{
      id: number;
      invoice_number: string;
      client_name: string;
      total: number;
      date: string;
      status: string;
    }>;
  };
  purchases: {
    total: number;
    count: number;
    invoices: Array<{
      id: number;
      invoice_number: string;
      supplier_name: string;
      total: number;
      date: string;
      status: string;
    }>;
  };
  balance: {
    net_balance: number;
    iva_balance: number;
    profit_margin: number;
  };
}

interface PeriodFilter {
  label: string;
  value: string;
  days: number;
}

const SalesVsPurchasesPage: React.FC = () => {
  const [data, setData] = useState<SalesVsPurchasesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');
  const [showDetails, setShowDetails] = useState<'sales' | 'purchases' | null>(null);
  
  const { showSuccess, showError } = useNotifications();

  const periods: PeriodFilter[] = [
    { label: 'Últimos 7 días', value: '7', days: 7 },
    { label: 'Últimos 30 días', value: '30', days: 30 },
    { label: 'Últimos 90 días', value: '90', days: 90 },
    { label: 'Último año', value: '365', days: 365 }
  ];

  useEffect(() => {
    fetchSalesVsPurchasesData();
  }, [selectedPeriod]);

  const fetchSalesVsPurchasesData = async () => {
    try {
      setLoading(true);
      // Cargar datos reales del backend
      const response = await apiService.getSalesVsPurchasesData(selectedPeriod);
      setData(response);
    } catch (error) {
      console.error('Error fetching sales vs purchases data:', error);
      showError('Error al cargar datos de ventas vs compras');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: 'sales' | 'purchases' | 'all') => {
    showSuccess('Exportación iniciada', `Exportando datos de ${type === 'all' ? 'ventas y compras' : type === 'sales' ? 'ventas' : 'compras'}`);
    // Implementar lógica de exportación
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'completed': { color: 'bg-green-500 text-white', text: 'Completada' },
      'pending': { color: 'bg-yellow-500 text-white', text: 'Pendiente' },
      'processing': { color: 'bg-blue-500 text-white', text: 'Procesando' },
      'error': { color: 'bg-red-500 text-white', text: 'Error' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-500 text-white', text: status };
    
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando datos de ventas vs compras...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No se pudieron cargar los datos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventas vs Compras</h1>
          <p className="text-gray-600 mt-2">
            Análisis comparativo de ingresos y egresos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleExport('all')}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Todo
          </Button>
        </div>
      </div>

      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtro de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.sales.total)}
                </p>
                <p className="text-sm text-gray-500">{data.sales.count} facturas</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Compras</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.purchases.total)}
                </p>
                <p className="text-sm text-gray-500">{data.purchases.count} facturas</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Balance Neto</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.balance.net_balance)}
                </p>
                <p className="text-sm text-gray-500">
                  {data.balance.profit_margin}% margen
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
                  {formatCurrency(data.balance.iva_balance)}
                </p>
                <p className="text-sm text-gray-500">
                  {data.balance.iva_balance > 0 ? 'A favor' : 'En contra'}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Comparación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Comparación Ventas vs Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Ventas</span>
                <span className="text-sm text-gray-600">{formatCurrency(data.sales.total)}</span>
              </div>
              <Progress 
                value={75} 
                className="h-3"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Compras</span>
                <span className="text-sm text-gray-600">{formatCurrency(data.purchases.total)}</span>
              </div>
              <Progress 
                value={50} 
                className="h-3"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalles de Facturas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Facturas de Venta
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowDetails(showDetails === 'sales' ? null : 'sales')}
                  size="sm"
                  variant="outline"
                >
                  {showDetails === 'sales' ? 'Ocultar' : 'Ver Detalles'}
                </Button>
                <Button
                  onClick={() => handleExport('sales')}
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.sales.invoices.slice(0, showDetails === 'sales' ? undefined : 3).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{invoice.invoice_number}</span>
                    </div>
                    <p className="text-sm text-gray-600">{invoice.client_name}</p>
                    <p className="text-xs text-gray-500">{formatDate(invoice.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{formatCurrency(invoice.total)}</p>
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>
              ))}
              {showDetails !== 'sales' && data.sales.invoices.length > 3 && (
                <p className="text-sm text-gray-500 text-center">
                  ... y {data.sales.invoices.length - 3} facturas más
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compras */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                Facturas de Compra
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowDetails(showDetails === 'purchases' ? null : 'purchases')}
                  size="sm"
                  variant="outline"
                >
                  {showDetails === 'purchases' ? 'Ocultar' : 'Ver Detalles'}
                </Button>
                <Button
                  onClick={() => handleExport('purchases')}
                  size="sm"
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.purchases.invoices.slice(0, showDetails === 'purchases' ? undefined : 3).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{invoice.invoice_number}</span>
                    </div>
                    <p className="text-sm text-gray-600">{invoice.supplier_name}</p>
                    <p className="text-xs text-gray-500">{formatDate(invoice.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">{formatCurrency(invoice.total)}</p>
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>
              ))}
              {showDetails !== 'purchases' && data.purchases.invoices.length > 3 && (
                <p className="text-sm text-gray-500 text-center">
                  ... y {data.purchases.invoices.length - 3} facturas más
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesVsPurchasesPage;
