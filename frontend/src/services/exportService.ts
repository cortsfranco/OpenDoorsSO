/**
 * Servicio para exportar datos a diferentes formatos (Excel, CSV, PDF)
 */

import * as XLSX from 'xlsx';

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  includeHeaders?: boolean;
}

export class ExportService {
  /**
   * Exporta datos a Excel (.xlsx)
   */
  static exportToExcel(data: any[], options: ExportOptions): void {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Datos');
      
      // Generar archivo Excel
      XLSX.writeFile(workbook, `${options.filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Error al exportar a Excel');
    }
  }

  /**
   * Exporta datos a CSV
   */
  static exportToCSV(data: any[], options: ExportOptions): void {
    try {
      if (data.length === 0) {
        throw new Error('No hay datos para exportar');
      }

      // Obtener headers del primer objeto
      const headers = Object.keys(data[0]);
      
      // Crear contenido CSV
      const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escapar comillas y agregar comillas si contiene comas
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${options.filename}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Error al exportar a CSV');
    }
  }

  /**
   * Exporta datos a JSON
   */
  static exportToJSON(data: any[], options: ExportOptions): void {
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${options.filename}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw new Error('Error al exportar a JSON');
    }
  }

  /**
   * Formatea datos para exportación
   */
  static formatDataForExport(data: any[], formatOptions?: {
    dateFormat?: string;
    currencyFormat?: boolean;
    numberFormat?: boolean;
  }): any[] {
    return data.map(item => {
      const formattedItem = { ...item };
      
      // Formatear fechas
      if (formatOptions?.dateFormat) {
        Object.keys(formattedItem).forEach(key => {
          if (formattedItem[key] instanceof Date) {
            formattedItem[key] = formattedItem[key].toLocaleDateString('es-ES');
          } else if (typeof formattedItem[key] === 'string' && formattedItem[key].match(/^\d{4}-\d{2}-\d{2}/)) {
            formattedItem[key] = new Date(formattedItem[key]).toLocaleDateString('es-ES');
          }
        });
      }
      
      // Formatear números
      if (formatOptions?.numberFormat) {
        Object.keys(formattedItem).forEach(key => {
          if (typeof formattedItem[key] === 'number') {
            formattedItem[key] = formattedItem[key].toLocaleString('es-AR');
          }
        });
      }
      
      // Formatear moneda
      if (formatOptions?.currencyFormat) {
        Object.keys(formattedItem).forEach(key => {
          if (key.toLowerCase().includes('total') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('precio')) {
            if (typeof formattedItem[key] === 'number') {
              formattedItem[key] = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS'
              }).format(formattedItem[key]);
            }
          }
        });
      }
      
      return formattedItem;
    });
  }

  /**
   * Exporta múltiples hojas a Excel
   */
  static exportMultipleSheetsToExcel(sheets: Array<{
    name: string;
    data: any[];
  }>, filename: string): void {
    try {
      const workbook = XLSX.utils.book_new();
      
      sheets.forEach(sheet => {
        const worksheet = XLSX.utils.json_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
      });
      
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting multiple sheets to Excel:', error);
      throw new Error('Error al exportar múltiples hojas a Excel');
    }
  }

  /**
   * Genera un reporte PDF usando jsPDF (requiere instalación)
   */
  static async exportToPDF(data: any[], options: ExportOptions & {
    title?: string;
    columns?: string[];
  }): Promise<void> {
    try {
      // Esta función requeriría jsPDF
      // Por ahora, lanzamos un error indicando que no está implementado
      throw new Error('Exportación a PDF no implementada. Use Excel o CSV.');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Error al exportar a PDF');
    }
  }
}

// Funciones de utilidad para exportación específica
export const InvoiceExportUtils = {
  /**
   * Exporta facturas con formato específico
   */
  exportInvoices: (invoices: any[], format: 'excel' | 'csv' | 'json') => {
    const formattedData = ExportService.formatDataForExport(invoices, {
      dateFormat: true,
      currencyFormat: true,
      numberFormat: true
    });

    const options: ExportOptions = {
      filename: `facturas_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Facturas'
    };

    switch (format) {
      case 'excel':
        return ExportService.exportToExcel(formattedData, options);
      case 'csv':
        return ExportService.exportToCSV(formattedData, options);
      case 'json':
        return ExportService.exportToJSON(formattedData, options);
      default:
        throw new Error('Formato no soportado');
    }
  }
};

export const PartnerExportUtils = {
  /**
   * Exporta socios con formato específico
   */
  exportPartners: (partners: any[], format: 'excel' | 'csv' | 'json') => {
    const formattedData = ExportService.formatDataForExport(partners, {
      dateFormat: true,
      numberFormat: true
    });

    const options: ExportOptions = {
      filename: `socios_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Socios'
    };

    switch (format) {
      case 'excel':
        return ExportService.exportToExcel(formattedData, options);
      case 'csv':
        return ExportService.exportToCSV(formattedData, options);
      case 'json':
        return ExportService.exportToJSON(formattedData, options);
      default:
        throw new Error('Formato no soportado');
    }
  }
};

export const FinancialReportExportUtils = {
  /**
   * Exporta reporte financiero completo
   */
  exportFinancialReport: (reportData: {
    summary: any[];
    invoices: any[];
    partners: any[];
    trends: any[];
  }) => {
    const sheets = [
      {
        name: 'Resumen',
        data: ExportService.formatDataForExport(reportData.summary, {
          currencyFormat: true,
          numberFormat: true
        })
      },
      {
        name: 'Facturas',
        data: ExportService.formatDataForExport(reportData.invoices, {
          dateFormat: true,
          currencyFormat: true,
          numberFormat: true
        })
      },
      {
        name: 'Socios',
        data: ExportService.formatDataForExport(reportData.partners, {
          dateFormat: true,
          numberFormat: true
        })
      },
      {
        name: 'Tendencias',
        data: ExportService.formatDataForExport(reportData.trends, {
          dateFormat: true,
          currencyFormat: true,
          numberFormat: true
        })
      }
    ];

    const filename = `reporte_financiero_${new Date().toISOString().split('T')[0]}`;
    return ExportService.exportMultipleSheetsToExcel(sheets, filename);
  }
};
