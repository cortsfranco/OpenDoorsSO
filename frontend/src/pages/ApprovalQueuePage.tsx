import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText,
  User,
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import apiService from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';

interface PendingInvoice {
  id: number;
  filename: string;
  invoice_number?: string;
  client_name?: string;
  total?: number;
  upload_date: string;
  owner?: string;
  extracted_data?: any;
  user_name: string;
  movimiento_cuenta: boolean;
  metodo_pago: string;
  invoice_direction: string;
  es_compensacion_iva: boolean;
  payment_status: string;
}

interface ApprovalModalData extends PendingInvoice {
  status: string;
  payment_status: string;
  uploaded_by: string;
  blob_url?: string;
  created_at: string;
  updated_at: string;
}

const ApprovalQueuePage: React.FC = () => {
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<ApprovalModalData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [approvalReason, setApprovalReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  const { success, error, warning } = useNotifications();

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPendingApprovals();
      // Asegurar que siempre sea un array
      setPendingInvoices(Array.isArray(response) ? response : []);
    } catch (err: any) {
      error('Error', 'No se pudieron cargar las facturas pendientes de aprobación.');
      console.error('Error fetching pending approvals:', err);
      setPendingInvoices([]); // Asegurar array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = async (invoice: PendingInvoice) => {
    try {
      const details = await apiService.getInvoiceApprovalDetails(invoice.id);
      setSelectedInvoice(details);
      setIsModalOpen(true);
      setApprovalReason('');
      setRejectionReason('');
    } catch (err: any) {
      error('Error', 'No se pudieron cargar los detalles de la factura.');
      console.error('Error fetching invoice details:', err);
    }
  };

  const handleApprove = async () => {
    if (!selectedInvoice) return;
    
    setIsApproving(true);
    try {
      await apiService.approveInvoice(selectedInvoice.id, { reason: approvalReason });
      success('Factura Aprobada', `La factura ${selectedInvoice.filename} ha sido aprobada exitosamente.`);
      setIsModalOpen(false);
      fetchPendingApprovals(); // Refresh the list
    } catch (err: any) {
      error('Error al Aprobar', 'No se pudo aprobar la factura.');
      console.error('Error approving invoice:', err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedInvoice || !rejectionReason.trim()) {
      error('Razón Requerida', 'Debe proporcionar una razón para rechazar la factura.');
      return;
    }
    
    setIsRejecting(true);
    try {
      await apiService.rejectInvoice(selectedInvoice.id, { reason: rejectionReason });
      success('Factura Rechazada', `La factura ${selectedInvoice.filename} ha sido rechazada.`);
      setIsModalOpen(false);
      fetchPendingApprovals(); // Refresh the list
    } catch (err: any) {
      error('Error al Rechazar', 'No se pudo rechazar la factura.');
      console.error('Error rejecting invoice:', err);
    } finally {
      setIsRejecting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
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

  const getPriorityColor = (invoice: PendingInvoice) => {
    const daysSinceUpload = (Date.now() - new Date(invoice.upload_date).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpload > 3) return 'bg-red-500 text-white'; // Urgente
    if (daysSinceUpload > 1) return 'bg-yellow-500 text-white'; // Moderado
    return 'bg-green-500 text-white'; // Normal
  };

  const getPriorityText = (invoice: PendingInvoice) => {
    const daysSinceUpload = (Date.now() - new Date(invoice.upload_date).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpload > 3) return 'Urgente';
    if (daysSinceUpload > 1) return 'Moderado';
    return 'Normal';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando facturas pendientes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cola de Aprobación</h1>
          <p className="text-gray-600 mt-2">
            Revisión y aprobación de facturas pendientes - Inspirado en Mendel
          </p>
        </div>
        <Badge className="bg-blue-500 text-white">
          <Clock className="w-4 h-4 mr-2" />
          {pendingInvoices.length} pendientes
        </Badge>
      </div>

      {/* Resumen de Prioridades */}
      {pendingInvoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgentes</p>
                  <p className="text-2xl font-bold text-red-600">
                    {pendingInvoices.filter(inv => {
                      const days = (Date.now() - new Date(inv.upload_date).getTime()) / (1000 * 60 * 60 * 24);
                      return days > 3;
                    }).length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Moderadas</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {pendingInvoices.filter(inv => {
                      const days = (Date.now() - new Date(inv.upload_date).getTime()) / (1000 * 60 * 60 * 24);
                      return days > 1 && days <= 3;
                    }).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Normales</p>
                  <p className="text-2xl font-bold text-green-600">
                    {pendingInvoices.filter(inv => {
                      const days = (Date.now() - new Date(inv.upload_date).getTime()) / (1000 * 60 * 60 * 24);
                      return days <= 1;
                    }).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de Facturas Pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Facturas Pendientes de Aprobación
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No hay facturas pendientes de aprobación</p>
              <p className="text-sm mt-2">Todas las facturas han sido procesadas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-500">
                  <TableHead className="text-white font-semibold">Prioridad</TableHead>
                  <TableHead className="text-white font-semibold">Archivo</TableHead>
                  <TableHead className="text-white font-semibold">Cliente</TableHead>
                  <TableHead className="text-white font-semibold">Total</TableHead>
                  <TableHead className="text-white font-semibold">Mov. Cta.</TableHead>
                  <TableHead className="text-white font-semibold">Método Pago</TableHead>
                  <TableHead className="text-white font-semibold">Dirección</TableHead>
                  <TableHead className="text-white font-semibold">Propietario</TableHead>
                  <TableHead className="text-white font-semibold">Cargado Por</TableHead>
                  <TableHead className="text-white font-semibold">Fecha Carga</TableHead>
                  <TableHead className="text-white font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Badge className={getPriorityColor(invoice)}>
                        {getPriorityText(invoice)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={invoice.filename}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {invoice.filename}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.client_name || 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {invoice.total ? formatCurrency(invoice.total) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        invoice.movimiento_cuenta 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }>
                        {invoice.movimiento_cuenta ? 'SI' : 'NO'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {invoice.metodo_pago === 'contado' && '💰 Contado'}
                        {invoice.metodo_pago === 'transferencia' && '🏦 Transferencia'}
                        {invoice.metodo_pago === 'tarjeta_credito' && '💳 Crédito'}
                        {invoice.metodo_pago === 'tarjeta_debito' && '💳 Débito'}
                        {invoice.metodo_pago === 'cheque' && '📝 Cheque'}
                        {!invoice.metodo_pago && '🏦 Transferencia'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        invoice.invoice_direction === 'emitida' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }>
                        {invoice.invoice_direction === 'emitida' ? '📤 Emitida' : '📥 Recibida'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {invoice.owner || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {invoice.user_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(invoice.upload_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleReviewClick(invoice)}
                        className="bg-blue-500 text-white hover:bg-blue-600"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Revisar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Revisión */}
      {selectedInvoice && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Revisar Factura: {selectedInvoice.filename}
              </DialogTitle>
              <DialogDescription>
                Revisa los detalles de la factura antes de aprobar o rechazar
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Información Básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Número de Factura</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {selectedInvoice.extracted_data?.invoice_number || 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cliente</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {selectedInvoice.extracted_data?.client_name || 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Total</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded font-medium text-green-600">
                    {selectedInvoice.extracted_data?.total ? 
                      formatCurrency(selectedInvoice.extracted_data.total) : 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Propietario</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {selectedInvoice.owner || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Datos Extraídos Completos */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Datos Extraídos</Label>
                <div className="bg-gray-50 p-4 rounded max-h-60 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedInvoice.extracted_data, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Campos de Razón */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="approval-reason">Razón de Aprobación (Opcional)</Label>
                  <Textarea
                    id="approval-reason"
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    placeholder="Motivo de la aprobación..."
                    className="bg-background text-text-primary border-gray-300"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Razón de Rechazo *</Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Motivo del rechazo..."
                    className="bg-background text-text-primary border-gray-300"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isApproving || isRejecting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                disabled={isApproving || isRejecting}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                {isRejecting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Rechazando...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Rechazar
                  </>
                )}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                {isApproving ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Aprobando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprobar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ApprovalQueuePage;