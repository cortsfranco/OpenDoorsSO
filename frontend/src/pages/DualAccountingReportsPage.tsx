import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DollarSign, TrendingUp, Scale, Percent, CalendarDays } from 'lucide-react';
import { BalanceTypeSelector } from '@/components/BalanceTypeSelector';
import { FiscalYearSelector } from '@/components/FiscalYearSelector';
import apiService from '@/services/api';
import { toast } from 'sonner';

interface FinancialReportData {
  period: {
    fiscal_year: number;
    start_date: string;
    end_date: string;
    label: string;
  };
  owner: string | null;
  balance_iva: {
    iva_emitido: number;
    iva_recibido: number;
    balance_iva: number;
    estado: string;
    iva_a_favor: number;
    iva_a_pagar: number;
    facturas_emitidas: number;
    facturas_recibidas: number;
    descripcion: string;
  };
  balance_real: {
    ingresos: number;
    egresos: number;
    balance: number;
    margen: number;
    tipo: string;
    descripcion: string;
  };
  balance_fiscal: {
    ingresos: number;
    egresos: number;
    balance: number;
    tipo: string;
    descripcion: string;
  };
  impuesto_ganancias: {
    base_imponible: number;
    tasa: number;
    impuesto: number;
    estado: string;
    descripcion: string;
  };
  cash_flow_projects: any[]; // TODO: Define interface for project cash flow
  indicators: {
    rentabilidad_real: number;
    ratio_ingresos_egresos: number;
    utilidad_neta: number;
    utilidad_fiscal: number;
    diferencia_real_fiscal: number;
  };
  generated_at: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatPercentage = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100); // Assuming value is already 0-100
};

export function DualAccountingReportsPage() {
  const [balanceType, setBalanceType] = useState<'real' | 'fiscal'>('real');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number | undefined>(undefined);
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportData();
  }, [selectedFiscalYear]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getComprehensiveReport(undefined, selectedFiscalYear);
      setReportData(data);
    } catch (error) {
      console.error('Error fetching comprehensive report:', error);
      const errorMessage = 'Error al cargar el reporte financiero completo.';
      setError(errorMessage);
      toast.error(errorMessage);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFiscalYearChange = (year: number, dateRange: { start: string; end: string }) => {
    setSelectedFiscalYear(year);
  };

  const currentBalance = balanceType === 'real' ? reportData?.balance_real : reportData?.balance_fiscal;

  // Funciones auxiliares para acceso seguro a propiedades
  const safeGet = (obj: any, path: string, defaultValue: any = 0) => {
    return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
  };

  const getBalanceReal = () => safeGet(reportData, 'balance_real', {});
  const getBalanceIva = () => safeGet(reportData, 'balance_iva', {});
  const getImpuestoGanancias = () => safeGet(reportData, 'impuesto_ganancias', {});
  const getIndicators = () => safeGet(reportData, 'indicators', {});

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Reportes de Doble Contabilidad</h1>
        <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 text-center">
            <p className="text-lg font-semibold mb-2">Error al cargar los datos</p>
            <p className="text-sm mb-4">{error || 'No se pudieron cargar los reportes'}</p>
            <button 
              onClick={fetchReportData}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Reportes de Doble Contabilidad</h1>
      <p className="text-gray-600">
        Visualiza el rendimiento financiero de la empresa desde una perspectiva real (flujo de caja) y fiscal (declaración AFIP).
      </p>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <BalanceTypeSelector balanceType={balanceType} onValueChange={setBalanceType} />
        <FiscalYearSelector value={selectedFiscalYear} onChange={handleFiscalYearChange} />
      </div>

      {reportData && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                {balanceType === 'real' ? 'Balance Real Neto' : 'Balance Fiscal Neto'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {formatCurrency(currentBalance?.balance || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ingresos: {formatCurrency(currentBalance?.ingresos || 0)} | Egresos: {formatCurrency(currentBalance?.egresos || 0)}
              </p>
              {balanceType === 'real' && (
                <p className="text-xs text-gray-500 mt-1">
                  Margen: {formatPercentage(getBalanceReal().margen || 0)}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance IVA</CardTitle>
                <Scale className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(getBalanceIva().balance_iva || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getBalanceIva().estado === 'A_FAVOR' ? 'IVA a Favor' : 'IVA a Pagar'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Emitido: {formatCurrency(getBalanceIva().iva_emitido || 0)} | Recibido: {formatCurrency(getBalanceIva().iva_recibido || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impuesto a las Ganancias</CardTitle>
                <Percent className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(getImpuestoGanancias().impuesto || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Base Imponible: {formatCurrency(getImpuestoGanancias().base_imponible || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Tasa: {formatPercentage(getImpuestoGanancias().tasa || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Diferencia Real vs Fiscal</CardTitle>
                <CalendarDays className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(getIndicators().diferencia_real_fiscal || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Utilidad Real: {formatCurrency(getIndicators().utilidad_neta || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Utilidad Fiscal: {formatCurrency(getIndicators().utilidad_fiscal || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cash Flow por Proyectos (En Desarrollo)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Esta sección mostrará el detalle del flujo de caja por cada proyecto.
                Actualmente en desarrollo.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}