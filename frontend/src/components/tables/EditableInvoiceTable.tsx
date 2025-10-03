import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Edit2, 
  Save, 
  AlertCircle,
  DollarSign,
  Calendar,
  FileText,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import apiService from '@/services/api';

interface Invoice {
  id: number;
  numero: string;
  fecha_emision: string;
  clase: string;
  cliente: string;
  monto_total: number;
  monto_iva: number;
  subtotal: number;
  owner: string;
  invoice_direction: 'emitida' | 'recibida';
  movimiento_cuenta: boolean;
  metodo_pago: string;
  es_compensacion_iva: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface EditableInvoiceTableProps {
  invoices: Invoice[];
  onUpdate: (invoice: Invoice) => void;
  onDelete?: (invoiceId: number) => void;
  className?: string;
}

interface EditingState {
  [key: string]: {
    field: string;
    value: any;
  };
}

interface ValidationErrors {
  [key: string]: string;
}

export function EditableInvoiceTable({ 
  invoices, 
  onUpdate, 
  onDelete,
  className 
}: EditableInvoiceTableProps) {
  const [editing, setEditing] = useState<EditingState>({});
  const [saving, setSaving] = useState<Set<number>>(new Set());
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Validaciones en tiempo real
  const validateField = useCallback((field: string, value: any): string | null => {
    switch (field) {
      case 'numero':
        if (!value || value.trim().length === 0) {
          return 'Número de factura es requerido';
        }
        break;
      
      case 'monto_total':
      case 'monto_iva':
      case 'subtotal':
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          return 'Debe ser un número válido mayor o igual a 0';
        }
        break;
      
      case 'fecha_emision':
        if (!value || !Date.parse(value)) {
          return 'Fecha inválida';
        }
        break;
      
      case 'clase':
        if (!['A', 'B', 'C', 'X'].includes(value)) {
          return 'Tipo de factura inválido';
        }
        break;
      
      case 'metodo_pago':
        if (!['contado', 'transferencia', 'tarjeta_credito', 'cheque'].includes(value)) {
          return 'Método de pago inválido';
        }
        break;
    }
    return null;
  }, []);

  const startEditing = (invoiceId: number, field: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    setEditing(prev => ({
      ...prev,
      [invoiceId]: {
        field,
        value: invoice[field as keyof Invoice]
      }
    }));
    
    // Limpiar errores de validación para este campo
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${invoiceId}-${field}`];
      return newErrors;
    });
  };

  const updateEditingValue = (invoiceId: number, value: any) => {
    setEditing(prev => ({
      ...prev,
      [invoiceId]: {
        ...prev[invoiceId],
        value
      }
    }));

    // Validar en tiempo real
    const field = editing[invoiceId]?.field;
    if (field) {
      const error = validateField(field, value);
      setValidationErrors(prev => ({
        ...prev,
        [`${invoiceId}-${field}`]: error || ''
      }));
    }
  };

  const cancelEditing = (invoiceId: number) => {
    setEditing(prev => {
      const newEditing = { ...prev };
      delete newEditing[invoiceId];
      return newEditing;
    });
    
    // Limpiar errores
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${invoiceId}-`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const saveField = async (invoiceId: number) => {
    const editingState = editing[invoiceId];
    if (!editingState) return;

    const { field, value } = editingState;
    
    // Validar antes de guardar
    const error = validateField(field, value);
    if (error) {
      setValidationErrors(prev => ({
        ...prev,
        [`${invoiceId}-${field}`]: error
      }));
      return;
    }

    setSaving(prev => new Set([...prev, invoiceId]));

    try {
      // Actualizar en el backend
      await apiService.updateInvoice(invoiceId, { [field]: value });
      
      // Actualizar en el estado local
      const updatedInvoice = invoices.find(inv => inv.id === invoiceId);
      if (updatedInvoice) {
        const updated = { ...updatedInvoice, [field]: value };
        onUpdate(updated);
      }

      // Limpiar estado de edición
      cancelEditing(invoiceId);
      
      toast.success('Factura actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar factura:', error);
      toast.error('Error al actualizar la factura');
    } finally {
      setSaving(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoiceId);
        return newSet;
      });
    }
  };

  const renderEditableCell = (invoice: Invoice, field: string, displayValue: any) => {
    const isEditing = editing[invoice.id]?.field === field;
    const isSaving = saving.has(invoice.id);
    const error = validationErrors[`${invoice.id}-${field}`];

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          {field === 'clase' ? (
            <Select
              value={editing[invoice.id]?.value || ''}
              onValueChange={(value) => updateEditingValue(invoice.id, value)}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="X">X</SelectItem>
              </SelectContent>
            </Select>
          ) : field === 'invoice_direction' ? (
            <Select
              value={editing[invoice.id]?.value || ''}
              onValueChange={(value) => updateEditingValue(invoice.id, value)}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emitida">Emitida</SelectItem>
                <SelectItem value="recibida">Recibida</SelectItem>
              </SelectContent>
            </Select>
          ) : field === 'metodo_pago' ? (
            <Select
              value={editing[invoice.id]?.value || ''}
              onValueChange={(value) => updateEditingValue(invoice.id, value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contado">Contado</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="tarjeta_credito">Tarjeta Crédito</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          ) : field === 'movimiento_cuenta' || field === 'es_compensacion_iva' ? (
            <Select
              value={editing[invoice.id]?.value ? 'true' : 'false'}
              onValueChange={(value) => updateEditingValue(invoice.id, value === 'true')}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Sí</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          ) : field === 'fecha_emision' ? (
            <Input
              type="date"
              value={editing[invoice.id]?.value || ''}
              onChange={(e) => updateEditingValue(invoice.id, e.target.value)}
              className="w-32"
            />
          ) : (
            <Input
              type={['monto_total', 'monto_iva', 'subtotal'].includes(field) ? 'number' : 'text'}
              step={['monto_total', 'monto_iva', 'subtotal'].includes(field) ? '0.01' : undefined}
              value={editing[invoice.id]?.value || ''}
              onChange={(e) => updateEditingValue(invoice.id, e.target.value)}
              className={cn(
                "w-full",
                error && "border-error"
              )}
            />
          )}
          
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => saveField(invoice.id)}
              disabled={isSaving || !!error}
              className="h-6 w-6 p-0"
            >
              {isSaving ? (
                <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <Check className="h-3 w-3 text-success" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => cancelEditing(invoice.id)}
              disabled={isSaving}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3 text-error" />
            </Button>
          </div>
          
          {error && (
            <AlertCircle className="h-4 w-4 text-error" title={error} />
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between group">
        <span className="truncate">{displayValue}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => startEditing(invoice.id, field)}
          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 transition-opacity"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'completed': 'success',
      'pending': 'warning',
      'needs_review': 'error',
      'processing': 'info'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className={cn("w-full", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead>IVA</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Mov. Cta.</TableHead>
            <TableHead>Método Pago</TableHead>
            <TableHead>Propietario</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-20">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                {renderEditableCell(invoice, 'numero', invoice.numero)}
              </TableCell>
              <TableCell>
                {renderEditableCell(invoice, 'fecha_emision', formatDate(invoice.fecha_emision))}
              </TableCell>
              <TableCell>
                {renderEditableCell(invoice, 'clase', invoice.clase)}
              </TableCell>
              <TableCell>
                {renderEditableCell(invoice, 'cliente', invoice.cliente)}
              </TableCell>
              <TableCell>
                {renderEditableCell(invoice, 'subtotal', formatCurrency(invoice.subtotal))}
              </TableCell>
              <TableCell>
                {renderEditableCell(invoice, 'monto_iva', formatCurrency(invoice.monto_iva))}
              </TableCell>
              <TableCell>
                {renderEditableCell(invoice, 'monto_total', formatCurrency(invoice.monto_total))}
              </TableCell>
              <TableCell>
                {renderEditableCell(invoice, 'invoice_direction', 
                  invoice.invoice_direction === 'emitida' ? 'Emitida' : 'Recibida'
                )}
              </TableCell>
              <TableCell>
                {renderEditableCell(invoice, 'movimiento_cuenta', 
                  invoice.movimiento_cuenta ? 'Sí' : 'No'
                )}
              </TableCell>
              <TableCell>
                {renderEditableCell(invoice, 'metodo_pago', invoice.metodo_pago)}
              </TableCell>
              <TableCell>
                {renderEditableCell(invoice, 'owner', invoice.owner)}
              </TableCell>
              <TableCell>
                {getStatusBadge(invoice.status)}
              </TableCell>
              <TableCell>
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(invoice.id)}
                    className="text-error hover:text-error"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

