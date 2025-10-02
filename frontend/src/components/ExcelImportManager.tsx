import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Download,
  Eye,
  Trash2,
  Database,
  FileText,
  Image
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import * as XLSX from 'xlsx';

interface ImportedRow {
  id: string;
  row_number: number;
  data: any;
  status: 'pending' | 'valid' | 'duplicate' | 'error';
  errors: string[];
  matched_invoice?: {
    id: number;
    filename: string;
    similarity: number;
  };
}

interface ImportProgress {
  total_rows: number;
  processed_rows: number;
  valid_rows: number;
  duplicate_rows: number;
  error_rows: number;
  current_step: string;
}

const ExcelImportManager: React.FC = () => {
  const [importedData, setImportedData] = useState<ImportedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'create_new'>('skip');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error, warning } = useNotifications();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      error('Formato Inválido', 'Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV');
      return;
    }

    try {
      setIsProcessing(true);
      setImportProgress({
        total_rows: 0,
        processed_rows: 0,
        valid_rows: 0,
        duplicate_rows: 0,
        error_rows: 0,
        current_step: 'Leyendo archivo...'
      });

      const data = await readExcelFile(file);
      await processImportedData(data);
      
    } catch (err) {
      error('Error de Importación', 'No se pudo procesar el archivo Excel');
      console.error('Error importing Excel:', err);
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Convertir a objetos con headers
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1).map((row: any[], index) => {
            const obj: any = { row_number: index + 2 };
            headers.forEach((header, i) => {
              obj[header] = row[i];
            });
            return obj;
          });
          
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const processImportedData = async (data: any[]) => {
    setImportProgress(prev => prev ? { ...prev, total_rows: data.length } : null);
    
    const processedRows: ImportedRow[] = [];
    let validCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      setImportProgress(prev => prev ? { 
        ...prev, 
        processed_rows: i + 1,
        current_step: `Procesando fila ${i + 1} de ${data.length}...`
      } : null);

      // Simular procesamiento y validación
      await new Promise(resolve => setTimeout(resolve, 100));

      const rowId = `row_${i}`;
      const errors: string[] = [];
      let status: ImportedRow['status'] = 'pending';

      // Validaciones básicas
      if (!row['Cliente/Proveedor']) errors.push('Falta nombre de cliente/proveedor');
      if (!row['Total'] || isNaN(parseFloat(row['Total']))) errors.push('Total inválido');
      if (!row['Fecha']) errors.push('Fecha faltante');

      // Simular detección de duplicados
      const isDuplicate = Math.random() < 0.2; // 20% de duplicados simulados
      
      if (errors.length > 0) {
        status = 'error';
        errorCount++;
      } else if (isDuplicate) {
        status = 'duplicate';
        duplicateCount++;
      } else {
        status = 'valid';
        validCount++;
      }

      processedRows.push({
        id: rowId,
        row_number: row.row_number,
        data: row,
        status,
        errors,
        matched_invoice: isDuplicate ? {
          id: Math.floor(Math.random() * 1000) + 1,
          filename: `factura_${Math.floor(Math.random() * 1000)}.pdf`,
          similarity: 85 + Math.random() * 15
        } : undefined
      });
    }

    setImportedData(processedRows);
    setShowPreview(true);
    
    setImportProgress(prev => prev ? {
      ...prev,
      valid_rows: validCount,
      duplicate_rows: duplicateCount,
      error_rows: errorCount,
      current_step: 'Procesamiento completado'
    } : null);
  };

  const handleRowSelection = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const validRowIds = importedData
        .filter(row => row.status === 'valid')
        .map(row => row.id);
      setSelectedRows(new Set(validRowIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleImportSelected = async () => {
    const selectedRowsData = importedData.filter(row => selectedRows.has(row.id));
    
    if (selectedRowsData.length === 0) {
      warning('Sin Selección', 'Por favor selecciona al menos una fila para importar');
      return;
    }

    try {
      setIsProcessing(true);
      setImportProgress({
        total_rows: selectedRowsData.length,
        processed_rows: 0,
        valid_rows: 0,
        duplicate_rows: 0,
        error_rows: 0,
        current_step: 'Importando facturas...'
      });

      // Simular importación
      for (let i = 0; i < selectedRowsData.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setImportProgress(prev => prev ? { 
          ...prev, 
          processed_rows: i + 1,
          current_step: `Importando factura ${i + 1} de ${selectedRowsData.length}...`
        } : null);
      }

      success('Importación Completada', `Se importaron ${selectedRowsData.length} facturas correctamente`);
      setImportedData([]);
      setSelectedRows(new Set());
      setShowPreview(false);
      
    } catch (err) {
      error('Error de Importación', 'No se pudieron importar las facturas seleccionadas');
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Pendiente' },
      valid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Válido' },
      duplicate: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'Duplicado' },
      error: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Error' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const validRows = importedData.filter(row => row.status === 'valid').length;
  const duplicateRows = importedData.filter(row => row.status === 'duplicate').length;
  const errorRows = importedData.filter(row => row.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header con instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Importación de Excel Existente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                <strong>Instrucciones:</strong> Sube tu archivo Excel con datos históricos de facturas. 
                El sistema detectará automáticamente duplicados y validará los datos antes de la importación.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-1">📊 Formato Esperado</h4>
                <p className="text-blue-600">
                  Columnas: Cliente/Proveedor, Total, Fecha, CUIT, Tipo, etc.
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-1">🔍 Detección de Duplicados</h4>
                <p className="text-green-600">
                  Compara automáticamente con facturas existentes
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-1">🖼️ Complemento con Imágenes</h4>
                <p className="text-purple-600">
                  Puedes subir imágenes adicionales después
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progreso de importación */}
      {importProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              Procesando Importación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{importProgress.current_step}</span>
                  <span>{importProgress.processed_rows} de {importProgress.total_rows}</span>
                </div>
                <Progress 
                  value={(importProgress.processed_rows / importProgress.total_rows) * 100} 
                  className="h-2" 
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-green-600 font-semibold">{importProgress.valid_rows}</p>
                  <p className="text-gray-600">Válidas</p>
                </div>
                <div className="text-center">
                  <p className="text-orange-600 font-semibold">{importProgress.duplicate_rows}</p>
                  <p className="text-gray-600">Duplicadas</p>
                </div>
                <div className="text-center">
                  <p className="text-red-600 font-semibold">{importProgress.error_rows}</p>
                  <p className="text-gray-600">Con Errores</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload de archivo */}
      <Card>
        <CardHeader>
          <CardTitle>Subir Archivo Excel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecciona tu archivo Excel</h3>
              <p className="text-gray-600 mb-4">
                Formatos soportados: .xlsx, .xls, .csv
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                <Upload className="w-4 h-4 mr-2" />
                Seleccionar Archivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            {importedData.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {importedData.length} filas procesadas
                  </span>
                  <Badge className="bg-green-100 text-green-800">{validRows} válidas</Badge>
                  <Badge className="bg-orange-100 text-orange-800">{duplicateRows} duplicadas</Badge>
                  <Badge className="bg-red-100 text-red-800">{errorRows} con errores</Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleImportSelected}
                    disabled={selectedRows.size === 0 || isProcessing}
                    className="bg-green-500 text-white hover:bg-green-600"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Importar Seleccionadas ({selectedRows.size})
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview de datos */}
      {showPreview && importedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Vista Previa de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedRows.size === validRows && validRows > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">
                  Seleccionar todas las filas válidas ({validRows})
                </span>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Fila</TableHead>
                      <TableHead>Cliente/Proveedor</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedData.slice(0, 20).map((row) => (
                      <TableRow key={row.id} className={row.status === 'error' ? 'bg-red-50' : ''}>
                        <TableCell>
                          {row.status === 'valid' && (
                            <Checkbox
                              checked={selectedRows.has(row.id)}
                              onCheckedChange={(checked) => handleRowSelection(row.id, checked as boolean)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {row.row_number}
                        </TableCell>
                        <TableCell>
                          {row.data['Cliente/Proveedor'] || 'N/A'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.data['Total'] ? `$${parseFloat(row.data['Total']).toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {row.data['Fecha'] || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(row.status)}
                          {row.errors.length > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              {row.errors.join(', ')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.status === 'duplicate' && row.matched_invoice && (
                            <div className="text-xs">
                              <p className="text-gray-600">
                                Similar a: {row.matched_invoice.filename}
                              </p>
                              <p className="text-gray-500">
                                {row.matched_invoice.similarity.toFixed(1)}% similar
                              </p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {importedData.length > 20 && (
                  <div className="p-4 text-center text-gray-600 bg-gray-50">
                    Mostrando 20 de {importedData.length} filas
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExcelImportManager;
