import apiService from './api';

export interface InvoiceUpdateData {
  id: number;
  field: string;
  value: any;
}

export interface InvoiceDeleteData {
  id: number;
}

class InvoiceService {
  /**
   * Actualiza un campo específico de una factura
   */
  async updateInvoiceField(id: number, field: string, value: any): Promise<void> {
    try {
      const updateData: any = {};
      
      // Mapear campos del frontend a campos del backend
      switch (field) {
        case 'client_name':
          updateData.extracted_data = { client_name: value };
          break;
        case 'client_cuit':
          updateData.extracted_data = { client_cuit: value };
          break;
        case 'invoice_number':
          updateData.extracted_data = { invoice_number: value };
          break;
        case 'total':
          updateData.extracted_data = { total: parseFloat(value) };
          break;
        case 'iva':
          updateData.extracted_data = { iva: parseFloat(value) };
          break;
        case 'issue_date':
          updateData.extracted_data = { issue_date: value };
          break;
        case 'invoice_type':
          updateData.extracted_data = { invoice_type: value };
          break;
        case 'payment_status':
          updateData.payment_status = value;
          break;
        case 'owner':
          updateData.owner = value;
          break;
        case 'movimiento_cuenta':
          updateData.movimiento_cuenta = value === 'true' || value === true;
          break;
        case 'otros_impuestos':
          updateData.otros_impuestos = parseFloat(value);
          break;
        case 'metodo_pago':
          updateData.metodo_pago = value;
          break;
        case 'es_compensacion_iva':
          updateData.es_compensacion_iva = value === 'true' || value === true;
          break;
        case 'invoice_direction':
          updateData.invoice_direction = value;
          break;
        default:
          updateData[field] = value;
      }

      await apiService.updateInvoice(id, updateData);
    } catch (error) {
      console.error('Error updating invoice field:', error);
      throw error;
    }
  }

  /**
   * Elimina una factura
   */
  async deleteInvoice(id: number): Promise<void> {
    try {
      await apiService.deleteInvoice(id);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  /**
   * Actualiza múltiples facturas en lote
   */
  async bulkUpdateInvoices(updates: InvoiceUpdateData[]): Promise<void> {
    try {
      const bulkUpdateData = updates.map(update => ({
        id: update.id,
        field: update.field,
        value: update.value
      }));

      await apiService.bulkUpdateInvoices(bulkUpdateData);
    } catch (error) {
      console.error('Error bulk updating invoices:', error);
      throw error;
    }
  }

  /**
   * Elimina múltiples facturas en lote
   */
  async bulkDeleteInvoices(ids: number[]): Promise<void> {
    try {
      await apiService.bulkDeleteInvoices(ids);
    } catch (error) {
      console.error('Error bulk deleting invoices:', error);
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();
