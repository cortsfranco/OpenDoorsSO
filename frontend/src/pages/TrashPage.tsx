import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, RotateCcw, Clock, FileText } from 'lucide-react';
import apiService from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';

interface DeletedInvoice {
  id: number;
  filename: string;
  status: string;
  upload_date: string;
  created_at: string;
  deleted_at: string;
  extracted_data?: any;
  blob_url?: string;
  user_id?: number;
  owner?: string;
}

const TrashPage: React.FC = () => {
  const [invoices, setInvoices] = useState<DeletedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);
  
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    fetchDeletedInvoices();
  }, []);

  const fetchDeletedInvoices = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDeletedInvoices();
      setInvoices(response.invoices);
    } catch (error) {
      console.error('Error fetching deleted invoices:', error);
      showError('Error al cargar facturas eliminadas');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (invoiceId: number) => {
    try {
      setRestoring(invoiceId);
      await apiService.restoreInvoice(invoiceId);
      showSuccess('Factura restaurada exitosamente');
      fetchDeletedInvoices(); // Refresh the list
    } catch (error) {
      console.error('Error restoring invoice:', error);
      showError('Error al restaurar la factura');
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInvoiceType = (extractedData: any) => {
    if (!extractedData) return 'Desconocido';
    return extractedData.tipo_factura || 'Desconocido';
  };

  const getInvoiceTotal = (extractedData: any) => {
    if (!extractedData) return 'N/A';
    return extractedData.total ? `$${extractedData.total.toLocaleString()}` : 'N/A';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-warning text-white', text: 'Pendiente' },
      'processing': { color: 'bg-primary text-white', text: 'Procesando' },
      'completed': { color: 'bg-success text-white', text: 'Completada' },
      'error': { color: 'bg-error text-white', text: 'Error' },
      'needs_review': { color: 'bg-orange-500 text-white', text: 'Revisión' }
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
        <div className="text-lg">Cargando papelera...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Papelera de Reciclaje</h1>
          <p className="text-gray-600 mt-2">
            Gestiona las facturas eliminadas y restáuralas si es necesario
          </p>
        </div>
        <Badge variant="secondary" className="bg-warning text-white">
          <Trash2 className="w-4 h-4 mr-2" />
          {invoices.length} eliminadas
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Facturas Eliminadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No hay facturas en la papelera</p>
              <p className="text-sm mt-2">Las facturas eliminadas aparecerán aquí</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-primary">
                  <TableHead className="text-white font-semibold">#</TableHead>
                  <TableHead className="text-white font-semibold">Archivo</TableHead>
                  <TableHead className="text-white font-semibold">Tipo</TableHead>
                  <TableHead className="text-white font-semibold">Total</TableHead>
                  <TableHead className="text-white font-semibold">Estado</TableHead>
                  <TableHead className="text-white font-semibold">Propietario</TableHead>
                  <TableHead className="text-white font-semibold">Eliminada</TableHead>
                  <TableHead className="text-white font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell className="max-w-xs truncate" title={invoice.filename}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {invoice.filename}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getInvoiceType(invoice.extracted_data)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {getInvoiceTotal(invoice.extracted_data)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>{invoice.owner || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(invoice.deleted_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleRestore(invoice.id)}
                        disabled={restoring === invoice.id}
                        className="bg-success text-white hover:bg-success/90"
                        size="sm"
                      >
                        {restoring === invoice.id ? (
                          <>
                            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Restaurando...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restaurar
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrashPage;
