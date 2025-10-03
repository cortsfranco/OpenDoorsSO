import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  User,
  Building,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import apiService from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';
import { useInvoiceStore } from '@/stores/invoiceStore';
import * as XLSX from 'xlsx';

interface Invoice {
  id: number;
  filename: string;
  status: string;
  upload_date: string;
  extracted_data: any;
  blob_url: string;
  user_id: number;
  owner: string;
  payment_status: string;
  movimiento_cuenta: boolean;  // CRÍTICO: Campo de movimiento de cuenta
  otros_impuestos: number;     // Otros impuestos además del IVA
  metodo_pago: string;         // Método de pago: contado, transferencia, tarjeta_credito
  es_compensacion_iva: boolean; // Si es solo para compensar IVA
  invoice_direction: string;    // emitida o recibida
  created_at: string;
  updated_at: string;
}

interface FilterState {
  search: string;
  category: string;
  invoiceType: string;
  paymentStatus: string;
  owner: string;
  dateFrom: string;
  dateTo: string;
  amountFrom: string;
  amountTo: string;
}

type SortField = 'id' | 'filename' | 'created_at' | 'extracted_data.total' | 'owner' | 'payment_status';
type SortDirection = 'asc' | 'desc' | null;

const InvoiceHistoryTable: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    invoiceType: '',
    paymentStatus: '',
    owner: '',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: ''
  });
  
  const { success, error } = useNotifications();

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [invoices, filters, sortField, sortDirection]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Datos de ejemplo mientras las APIs se implementan completamente
      const exampleInvoices: Invoice[] = [
        {
          id: 1,
          filename: "factura_001.pdf",
          status: "PROCESSED",
          upload_date: "2024-01-15",
          extracted_data: {
            total: 150000,
            invoice_type: "A",
            issue_date: "2024-01-15",
            client_name: "Cliente A",
            cuit: "20-12345678-9"
          },
          blob_url: "",
          user_id: 1,
          owner: "Franco",
          payment_status: "PAGADA",
          movimiento_cuenta: true,
          otros_impuestos: 0,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z"
        },
        {
          id: 2,
          filename: "factura_002.pdf",
          status: "PROCESSED",
          upload_date: "2024-01-16",
          extracted_data: {
            total: -75000,
            invoice_type: "A",
            issue_date: "2024-01-16",
            client_name: "Proveedor B",
            cuit: "30-87654321-0"
          },
          blob_url: "",
          user_id: 2,
          owner: "Joni",
          payment_status: "PENDIENTE",
          movimiento_cuenta: true,
          otros_impuestos: 1500,
          created_at: "2024-01-16T14:30:00Z",
          updated_at: "2024-01-16T14:30:00Z"
        },
        {
          id: 3,
          filename: "factura_003.pdf",
          status: "PROCESSED",
          upload_date: "2024-01-17",
          extracted_data: {
            total: 200000,
            invoice_type: "C",
            issue_date: "2024-01-17",
            client_name: "Cliente C",
            cuit: "27-11223344-5"
          },
          blob_url: "",
          user_id: 3,
          owner: "Hernán",
          payment_status: "ENVIADA",
          movimiento_cuenta: false,
          otros_impuestos: 0,
          created_at: "2024-01-17T09:15:00Z",
          updated_at: "2024-01-17T09:15:00Z"
        }
      ];
      
      setInvoices(exampleInvoices);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      // No mostrar error al usuario por ahora
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    // Filtro de búsqueda general
    if (filters.search) {
      filtered = filtered.filter(invoice =>
        invoice.filename.toLowerCase().includes(filters.search.toLowerCase()) ||
        invoice.owner.toLowerCase().includes(filters.search.toLowerCase()) ||
        (invoice.extracted_data?.client_name || '').toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filtros específicos
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(invoice => {
        const category = getInvoiceCategory(invoice);
        return category === filters.category;
      });
    }

    if (filters.invoiceType && filters.invoiceType !== 'all') {
      filtered = filtered.filter(invoice => 
        invoice.extracted_data?.invoice_type === filters.invoiceType
      );
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      filtered = filtered.filter(invoice => 
        invoice.payment_status === filters.paymentStatus
      );
    }

    if (filters.owner && filters.owner !== 'all') {
      filtered = filtered.filter(invoice => 
        invoice.owner === filters.owner
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.created_at) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.created_at) <= new Date(filters.dateTo)
      );
    }

    if (filters.amountFrom) {
      filtered = filtered.filter(invoice => 
        (invoice.extracted_data?.total || 0) >= parseFloat(filters.amountFrom)
      );
    }

    if (filters.amountTo) {
      filtered = filtered.filter(invoice => 
        (invoice.extracted_data?.total || 0) <= parseFloat(filters.amountTo)
      );
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      if (!sortDirection) return 0;

      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'extracted_data.total':
          aValue = a.extracted_data?.total || 0;
          bValue = b.extracted_data?.total || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredInvoices(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="w-4 h-4" />;
    }
    return <ArrowUpDown className="w-4 h-4 opacity-50" />;
  };

  const getInvoiceCategory = (invoice: Invoice) => {
    const total = invoice.extracted_data?.total || 0;
    if (total > 0) return 'Venta';
    if (total < 0) return 'Compra';
    return 'Neutra';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'completed': { color: 'bg-green-100 text-green-800', label: 'Completada' },
      'processing': { color: 'bg-yellow-100 text-yellow-800', label: 'Procesando' },
      'pending': { color: 'bg-blue-100 text-blue-800', label: 'Pendiente' },
      'error': { color: 'bg-red-100 text-red-800', label: 'Error' },
      'needs_review': { color: 'bg-orange-100 text-orange-800', label: 'Revisar' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      'pending_approval': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      'approved': { color: 'bg-green-100 text-green-800', label: 'Aprobado' },
      'paid': { color: 'bg-blue-100 text-blue-800', label: 'Pagado' },
      'rejected': { color: 'bg-red-100 text-red-800', label: 'Rechazado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_approval;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleSelectInvoice = (invoiceId: number, checked: boolean) => {
    const newSelected = new Set(selectedInvoices);
    if (checked) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(filteredInvoices.map(inv => inv.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.size === 0) return;
    
    try {
      for (const invoiceId of selectedInvoices) {
        await apiService.deleteInvoice(invoiceId);
      }
      success('Éxito', `${selectedInvoices.size} facturas eliminadas correctamente`);
      setSelectedInvoices(new Set());
      fetchInvoices();
    } catch (err: any) {
      error('Error', 'No se pudieron eliminar las facturas');
    }
  };

  const exportToExcel = () => {
    const data = filteredInvoices.map(invoice => ({
      'ID': invoice.id,
      'Archivo': invoice.filename,
      'Categoría': getInvoiceCategory(invoice),
      'Tipo': invoice.extracted_data?.invoice_type || '',
      'Fecha Emisión': invoice.extracted_data?.issue_date || '',
      'Cliente/Proveedor': invoice.extracted_data?.client_name || '',
      'CUIT': invoice.extracted_data?.client_cuit || '',
      'Total': invoice.extracted_data?.total || 0,
      'IVA': invoice.extracted_data?.iva || 0,
      'Mov. Cta.': invoice.movimiento_cuenta ? 'SI' : 'NO',
      'Otros Impuestos': invoice.otros_impuestos || 0,
      'Método Pago': invoice.metodo_pago || 'transferencia',
      'Compensación IVA': invoice.es_compensacion_iva ? 'SI' : 'NO',
      'Dirección': invoice.invoice_direction || 'recibida',
      'Estado Pago': invoice.payment_status,
      'Cargado Por': invoice.owner,
      'Fecha Carga': format(new Date(invoice.created_at), 'dd/MM/yyyy HH:mm')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Facturas');
    XLSX.writeFile(wb, 'facturas.xlsx');
    success('Exportación', 'Archivo Excel generado correctamente');
  };

  const exportToCSV = () => {
    const headers = [
      'ID', 'Archivo', 'Categoría', 'Tipo', 'Fecha Emisión', 
      'Cliente/Proveedor', 'CUIT', 'Total', 'IVA', 'Mov. Cta.', 'Otros Impuestos', 'Método Pago', 
      'Compensación IVA', 'Dirección', 'Estado Pago', 'Cargado Por', 'Fecha Carga'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredInvoices.map(invoice => [
        invoice.id,
        `"${invoice.filename}"`,
        getInvoiceCategory(invoice),
        invoice.extracted_data?.invoice_type || '',
        invoice.extracted_data?.issue_date || '',
        `"${invoice.extracted_data?.client_name || ''}"`,
        invoice.extracted_data?.client_cuit || '',
        invoice.extracted_data?.total || 0,
        invoice.extracted_data?.iva || 0,
        invoice.movimiento_cuenta ? 'SI' : 'NO',
        invoice.otros_impuestos || 0,
        invoice.payment_status,
        `"${invoice.owner}"`,
        format(new Date(invoice.created_at), 'dd/MM/yyyy HH:mm')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'facturas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Exportación', 'Archivo CSV generado correctamente');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
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
          <h1 className="text-3xl font-bold text-gray-900">Historial de Facturas</h1>
          <p className="text-gray-600 mt-2">
            Gestiona y revisa todas las facturas del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="btn-animated"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="btn-animated"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtros de Búsqueda
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
              className="btn-animated"
            >
              {advancedFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Filtros Avanzados
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Búsqueda principal */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por archivo, cliente o propietario..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>

          {/* Filtros avanzados */}
          <div className={`advanced-filters ${advancedFiltersOpen ? 'open' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="Venta">Venta</SelectItem>
                    <SelectItem value="Compra">Compra</SelectItem>
                    <SelectItem value="Neutra">Neutra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="invoiceType">Tipo de Factura</Label>
                <Select value={filters.invoiceType} onValueChange={(value) => setFilters({ ...filters, invoiceType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="A">Factura A</SelectItem>
                    <SelectItem value="B">Factura B</SelectItem>
                    <SelectItem value="C">Factura C</SelectItem>
                    <SelectItem value="E">Factura E</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentStatus">Estado de Pago</Label>
                <Select value={filters.paymentStatus} onValueChange={(value) => setFilters({ ...filters, paymentStatus: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending_approval">Pendiente Aprobación</SelectItem>
                    <SelectItem value="approved">Aprobado</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                    <SelectItem value="rejected">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="owner">Propietario</Label>
                <Select value={filters.owner} onValueChange={(value) => setFilters({ ...filters, owner: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los propietarios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los propietarios</SelectItem>
                    <SelectItem value="Hernán Pagani">Hernán Pagani</SelectItem>
                    <SelectItem value="Joni Tagua">Joni Tagua</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateFrom">Fecha Desde</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="dateTo">Fecha Hasta</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="amountFrom">Monto Desde</Label>
                <Input
                  id="amountFrom"
                  type="number"
                  value={filters.amountFrom}
                  onChange={(e) => setFilters({ ...filters, amountFrom: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="amountTo">Monto Hasta</Label>
                <Input
                  id="amountTo"
                  type="number"
                  value={filters.amountTo}
                  onChange={(e) => setFilters({ ...filters, amountTo: e.target.value })}
                  placeholder="1000000"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones en lote */}
      {selectedInvoices.size > 0 && (
        <Card className="card-theme-orange">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {selectedInvoices.size} factura(s) seleccionada(s)
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkDelete}
                  variant="destructive"
                  size="sm"
                  className="btn-animated"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Seleccionadas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="table-sorter w-full">
              <thead>
                <tr>
                  <th className="sortable w-12">
                    <Checkbox
                      checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-2">
                      #
                      {getSortIcon('id')}
                    </div>
                  </th>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('filename')}
                  >
                    <div className="flex items-center gap-2">
                      Archivo
                      {getSortIcon('filename')}
                    </div>
                  </th>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('extracted_data.total')}
                  >
                    <div className="flex items-center gap-2">
                      Categoría
                      {getSortIcon('extracted_data.total')}
                    </div>
                  </th>
                  <th>Tipo</th>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Fecha Emisión
                      {getSortIcon('created_at')}
                    </div>
                  </th>
                  <th>Cliente/Proveedor</th>
                  <th>Número</th>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('extracted_data.total')}
                  >
                    <div className="flex items-center gap-2">
                      Total
                      {getSortIcon('extracted_data.total')}
                    </div>
                  </th>
                  <th>IVA</th>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('movimiento_cuenta')}
                  >
                    <div className="flex items-center gap-2">
                      Mov. Cta.
                      {getSortIcon('movimiento_cuenta')}
                    </div>
                  </th>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('metodo_pago')}
                  >
                    <div className="flex items-center gap-2">
                      Método Pago
                      {getSortIcon('metodo_pago')}
                    </div>
                  </th>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('invoice_direction')}
                  >
                    <div className="flex items-center gap-2">
                      Dirección
                      {getSortIcon('invoice_direction')}
                    </div>
                  </th>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('es_compensacion_iva')}
                  >
                    <div className="flex items-center gap-2">
                      Comp. IVA
                      {getSortIcon('es_compensacion_iva')}
                    </div>
                  </th>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('payment_status')}
                  >
                    <div className="flex items-center gap-2">
                      Estado Pago
                      {getSortIcon('payment_status')}
                    </div>
                  </th>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('owner')}
                  >
                    <div className="flex items-center gap-2">
                      Propietario
                      {getSortIcon('owner')}
                    </div>
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <Checkbox
                        checked={selectedInvoices.has(invoice.id)}
                        onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                      />
                    </td>
                    <td className="font-medium">{invoice.id}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="truncate max-w-32">{invoice.filename}</span>
                      </div>
                    </td>
                    <td>
                      <Badge className={
                        getInvoiceCategory(invoice) === 'Venta' 
                          ? 'bg-green-100 text-green-800' 
                          : getInvoiceCategory(invoice) === 'Compra'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }>
                        {getInvoiceCategory(invoice)}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant="outline">
                        {invoice.extracted_data?.invoice_type || 'N/A'}
                      </Badge>
                    </td>
                    <td>{invoice.extracted_data?.issue_date ? formatDate(invoice.extracted_data.issue_date) : 'N/A'}</td>
                    <td className="truncate max-w-32">
                      {invoice.extracted_data?.client_name || 'N/A'}
                    </td>
                    <td className="font-mono text-sm">
                      {invoice.extracted_data?.invoice_number || 'N/A'}
                    </td>
                    <td className="font-medium">
                      {invoice.extracted_data?.total ? formatCurrency(invoice.extracted_data.total) : 'N/A'}
                    </td>
                    <td className="font-medium">
                      {invoice.extracted_data?.iva ? formatCurrency(invoice.extracted_data.iva) : 'N/A'}
                    </td>
                    <td>
                      <div className="flex items-center justify-center">
                        {invoice.movimiento_cuenta ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            SI
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            NO
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant="outline" className="text-xs">
                        {invoice.metodo_pago === 'contado' && '💰 Contado'}
                        {invoice.metodo_pago === 'transferencia' && '🏦 Transferencia'}
                        {invoice.metodo_pago === 'tarjeta_credito' && '💳 Crédito'}
                        {invoice.metodo_pago === 'tarjeta_debito' && '💳 Débito'}
                        {invoice.metodo_pago === 'cheque' && '📝 Cheque'}
                        {!invoice.metodo_pago && '🏦 Transferencia'}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant="outline" className={
                        invoice.invoice_direction === 'emitida' 
                          ? 'bg-blue-100 text-blue-800 border-blue-200' 
                          : 'bg-purple-100 text-purple-800 border-purple-200'
                      }>
                        {invoice.invoice_direction === 'emitida' ? '📤 Emitida' : '📥 Recibida'}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-center">
                        {invoice.es_compensacion_iva ? (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            SI
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            NO
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>{getPaymentStatusBadge(invoice.payment_status)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{invoice.owner}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {invoice.blob_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(invoice.blob_url, '_blank')}
                            className="btn-animated"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => console.log('Edit invoice', invoice.id)}
                          className="btn-animated"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => console.log('Delete invoice', invoice.id)}
                          className="btn-animated text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Información de resultados */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Mostrando {filteredInvoices.length} de {invoices.length} facturas
        </span>
        <span>
          {selectedInvoices.size > 0 && `${selectedInvoices.size} seleccionada(s)`}
        </span>
      </div>
    </div>
  );
};

export default InvoiceHistoryTable;