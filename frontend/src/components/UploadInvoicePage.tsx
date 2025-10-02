import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X,
  Download,
  Eye,
  Plus,
  Edit,
  FileInput,
  AlertTriangle
} from 'lucide-react';
import apiService from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';

interface UploadProgress {
  id: string;
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  owner: string;
  extractedData?: any;
}

interface ManualInvoiceData {
  invoice_number: string;
  client_name: string;
  client_cuit: string;
  invoice_type: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  iva: number;
  total: number;
  description: string;
  owner: string;
  movimiento_cuenta: boolean;  // CRÍTICO: Campo de movimiento de cuenta
  otros_impuestos: number;     // Otros impuestos además del IVA
  metodo_pago: string;         // Método de pago: contado, transferencia, tarjeta_credito
  es_compensacion_iva: boolean; // Si es solo para compensar IVA
  invoice_direction: string;    // emitida o recibida
}

interface DuplicateCheck {
  is_duplicate: boolean;
  confidence: number;
  similar_invoices: Array<{
    id: number;
    filename: string;
    total: number;
    date: string;
  }>;
}

const UploadInvoicePage: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState('Hernán Pagani');
  const [customOwnerName, setCustomOwnerName] = useState('');
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheck | null>(null);
  const [manualInvoiceData, setManualInvoiceData] = useState<ManualInvoiceData>({
    invoice_number: '',
    client_name: '',
    client_cuit: '',
    invoice_type: 'A',
    issue_date: '',
    due_date: '',
    subtotal: 0,
    iva: 0,
    total: 0,
    description: '',
    owner: 'Hernán Pagani',
    movimiento_cuenta: true,        // CRÍTICO: Por defecto True
    otros_impuestos: 0.0,           // Por defecto 0
    metodo_pago: 'transferencia',   // Por defecto transferencia
    es_compensacion_iva: false,     // Por defecto FALSE
    invoice_direction: 'recibida',  // Por defecto recibida
  });

  const { success, error, warning } = useNotifications();

  const owners = [
    { value: 'Hernán Pagani', label: 'Hernán Pagani' },
    { value: 'Joni Tagua', label: 'Joni Tagua' },
    { value: 'Otro socio', label: 'Otro socio' }
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [selectedOwner]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const checkForDuplicates = async (file: File): Promise<DuplicateCheck> => {
    try {
      const response = await apiService.checkDuplicateInvoice(file);
      return response;
    } catch (err) {
      console.error('Error checking duplicates:', err);
      return { is_duplicate: false, confidence: 0, similar_invoices: [] };
    }
  };

  const handleFiles = async (files: FileList) => {
    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of Array.from(files)) {
      if (!supportedTypes.includes(file.type)) {
        error('Tipo de archivo no soportado', `El archivo ${file.name} no es un tipo soportado. Formatos permitidos: PDF, JPG, PNG`);
        continue;
      }

      if (file.size > maxSize) {
        error('Archivo demasiado grande', `El archivo ${file.name} es demasiado grande. Tamaño máximo: 10MB`);
        continue;
      }

      // Verificar duplicados
      const duplicateCheck = await checkForDuplicates(file);
      if (duplicateCheck.is_duplicate && duplicateCheck.confidence > 0.8) {
        setDuplicateCheck(duplicateCheck);
        setShowDuplicateModal(true);
        // Pausar el procesamiento hasta que el usuario decida
        continue;
      }

      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const uploadId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newUpload: UploadProgress = {
      id: uploadId,
      file,
      status: 'uploading',
      progress: 0,
      message: 'Preparando archivo...',
      owner: selectedOwner === 'Otro socio' ? customOwnerName : selectedOwner
    };

    setUploads(prev => [...prev, newUpload]);

    try {
      setIsUploading(true);
      
      // Simular progreso de carga
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, progress: i, message: `Subiendo archivo... ${i}%` }
            : upload
        ));
      }

      // Actualizar estado a procesando
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'processing', message: 'Procesando con IA...' }
          : upload
      ));

      // Simular procesamiento con IA
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular datos extraídos
      const extractedData = {
        invoice_number: `FAC-${Math.floor(Math.random() * 10000)}`,
        client_name: 'Cliente Ejemplo S.A.',
        client_cuit: '20-12345678-9',
        invoice_type: 'A',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: Math.floor(Math.random() * 100000) + 10000,
        iva: Math.floor(Math.random() * 21000) + 2000,
        total: 0,
        description: 'Servicios profesionales'
      };
      extractedData.total = extractedData.subtotal + extractedData.iva;

      // Mostrar modal de previsualización
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'completed', message: 'Procesamiento completado', extractedData }
          : upload
      ));

      // Mostrar modal de previsualización para confirmar
      setShowPreviewModal(true);

    } catch (err) {
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'error', message: 'Error en el procesamiento' }
          : upload
      ));
      error('Error de procesamiento', 'No se pudo procesar el archivo correctamente');
    } finally {
      setIsUploading(false);
    }
  };

  // Función para calcular total automáticamente
  const calculateTotal = () => {
    const subtotal = parseFloat(manualInvoiceData.subtotal.toString()) || 0;
    const iva = parseFloat(manualInvoiceData.iva.toString()) || 0;
    const otrosImpuestos = parseFloat(manualInvoiceData.otros_impuestos.toString()) || 0;
    return subtotal + iva + otrosImpuestos;
  };

  const handleManualInvoiceSubmit = async () => {
    if (!manualInvoiceData.invoice_number || !manualInvoiceData.client_name) {
      error('Error', 'Por favor completa los campos obligatorios');
      return;
    }

    try {
      setIsUploading(true);
      
      // Calcular total automáticamente
      const total = calculateTotal();
      
      const invoiceData = {
        ...manualInvoiceData,
        total: total,
        owner: selectedOwner === 'Otro socio' ? customOwnerName : selectedOwner
      };

      const response = await apiService.createManualInvoice(invoiceData);
      
      success('Factura Creada', 'La factura manual se ha creado exitosamente');
      
      // Limpiar formulario
      setManualInvoiceData({
        invoice_number: '',
        client_name: '',
        client_cuit: '',
        invoice_type: 'A',
        issue_date: '',
        due_date: '',
        subtotal: 0,
        iva: 0,
        total: 0,
        description: '',
        owner: 'Hernán Pagani',
        movimiento_cuenta: true,
        otros_impuestos: 0.0,
        metodo_pago: 'transferencia',
        es_compensacion_iva: false,
        invoice_direction: 'recibida'
      });
      setShowManualForm(false);
      
    } catch (err: any) {
      error('Error', 'No se pudo crear la factura manual');
      console.error('Error creating manual invoice:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const confirmUpload = async () => {
    // Aquí se guardaría la factura procesada
    success('Factura Guardada', 'La factura se ha guardado exitosamente');
    setShowPreviewModal(false);
  };

  const handleDuplicateProceed = () => {
    setShowDuplicateModal(false);
    // Procesar el archivo de todas formas
    if (duplicateCheck?.similar_invoices[0]) {
      // Procesar con advertencia
    }
  };

  const handleDuplicateCancel = () => {
    setShowDuplicateModal(false);
    setDuplicateCheck(null);
  };

  const removeUpload = (uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-50 border-blue-200';
      case 'processing':
        return 'bg-yellow-50 border-yellow-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="main-container space-y-6 fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Cargar Facturas</h2>
        <p className="text-sm text-gray-500">
          Sube facturas en formato PDF, JPG o PNG para procesamiento automático, o ingresa datos manualmente
        </p>
      </div>

      {/* Selector de Propietario */}
      <Card className="card-theme-blue">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Propietario de la Factura</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label htmlFor="owner-select">Selecciona el propietario de la factura:</Label>
            <div className="flex space-x-4">
              {owners.map((owner) => (
                <label key={owner.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="owner"
                    value={owner.value}
                    checked={selectedOwner === owner.value}
                    onChange={(e) => setSelectedOwner(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">{owner.label}</span>
                </label>
              ))}
            </div>
            
            {/* Campo para nombre de otro socio */}
            {selectedOwner === 'Otro socio' && (
              <div className="mt-4">
                <Label htmlFor="custom-owner">Nombre del socio:</Label>
                <Input
                  id="custom-owner"
                  type="text"
                  value={customOwnerName}
                  onChange={(e) => setCustomOwnerName(e.target.value)}
                  placeholder="Ingresa el nombre del socio"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botones de Acción */}
      <div className="flex gap-4">
        <Button
          onClick={() => setShowManualForm(!showManualForm)}
          variant={showManualForm ? "outline" : "default"}
          className="flex items-center gap-2"
        >
          <FileInput className="h-4 w-4" />
          {showManualForm ? 'Cancelar Ingreso Manual' : 'Ingreso Manual'}
        </Button>
      </div>

      {/* Formulario de Ingreso Manual */}
      {showManualForm && (
        <Card className="card-theme-purple">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Ingreso Manual de Factura</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoice-number">Número de Factura</Label>
                <Input
                  id="invoice-number"
                  value={manualInvoiceData.invoice_number}
                  onChange={(e) => setManualInvoiceData({...manualInvoiceData, invoice_number: e.target.value})}
                  placeholder="Ej: FAC-001-2024"
                />
              </div>
              <div>
                <Label htmlFor="client-name">Cliente/Proveedor</Label>
                <Input
                  id="client-name"
                  value={manualInvoiceData.client_name}
                  onChange={(e) => setManualInvoiceData({...manualInvoiceData, client_name: e.target.value})}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <Label htmlFor="client-cuit">CUIT</Label>
                <Input
                  id="client-cuit"
                  value={manualInvoiceData.client_cuit}
                  onChange={(e) => setManualInvoiceData({...manualInvoiceData, client_cuit: e.target.value})}
                  placeholder="20-12345678-9"
                />
              </div>
              <div>
                <Label htmlFor="invoice-type">Tipo de Factura</Label>
                <select
                  id="invoice-type"
                  value={manualInvoiceData.invoice_type}
                  onChange={(e) => setManualInvoiceData({...manualInvoiceData, invoice_type: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="A">Factura A</option>
                  <option value="B">Factura B</option>
                  <option value="C">Factura C</option>
                  <option value="E">Factura E</option>
                </select>
              </div>
              <div>
                <Label htmlFor="issue-date">Fecha de Emisión</Label>
                <Input
                  id="issue-date"
                  type="date"
                  value={manualInvoiceData.issue_date}
                  onChange={(e) => setManualInvoiceData({...manualInvoiceData, issue_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="due-date">Fecha de Vencimiento</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={manualInvoiceData.due_date}
                  onChange={(e) => setManualInvoiceData({...manualInvoiceData, due_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="subtotal">Subtotal</Label>
                <Input
                  id="subtotal"
                  type="number"
                  value={manualInvoiceData.subtotal}
                  onChange={(e) => {
                    const subtotal = parseFloat(e.target.value) || 0;
                    const iva = subtotal * 0.21;
                    setManualInvoiceData({
                      ...manualInvoiceData, 
                      subtotal, 
                      iva,
                      total: subtotal + iva
                    });
                  }}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="iva">IVA</Label>
                <Input
                  id="iva"
                  type="number"
                  value={manualInvoiceData.iva}
                  onChange={(e) => {
                    const iva = parseFloat(e.target.value) || 0;
                    setManualInvoiceData({
                      ...manualInvoiceData, 
                      iva,
                      total: manualInvoiceData.subtotal + iva
                    });
                  }}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="total">Total</Label>
                <Input
                  id="total"
                  type="number"
                  value={calculateTotal()}
                  readOnly
                  placeholder="0"
                  className="bg-gray-50 font-semibold"
                />
              </div>
              
              {/* CRÍTICO: Campo de Movimiento de Cuenta */}
              <div className="col-span-2">
                <div className="flex items-center space-x-3 p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <Switch
                    id="movimiento_cuenta"
                    checked={manualInvoiceData.movimiento_cuenta}
                    onCheckedChange={(checked) => 
                      setManualInvoiceData({...manualInvoiceData, movimiento_cuenta: checked})
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="movimiento_cuenta" className="text-sm font-medium text-blue-900">
                      Movimiento de Cuenta
                    </Label>
                    <p className="text-xs text-blue-700 mt-1">
                      {manualInvoiceData.movimiento_cuenta 
                        ? "✅ Afecta el flujo de caja (ingreso/egreso real)"
                        : "❌ Factura neutra (solo para compensar IVA)"
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="otros_impuestos">Otros Impuestos</Label>
                <Input
                  id="otros_impuestos"
                  type="number"
                  step="0.01"
                  value={manualInvoiceData.otros_impuestos}
                  onChange={(e) => 
                    setManualInvoiceData({
                      ...manualInvoiceData, 
                      otros_impuestos: parseFloat(e.target.value) || 0
                    })
                  }
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Impuestos adicionales al IVA (ej: IIBB, Ganancias)
                </p>
              </div>
              
              <div>
                <Label htmlFor="metodo_pago">Método de Pago</Label>
                <Select
                  value={manualInvoiceData.metodo_pago}
                  onValueChange={(value) => 
                    setManualInvoiceData({
                      ...manualInvoiceData, 
                      metodo_pago: value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contado">💰 Contado</SelectItem>
                    <SelectItem value="transferencia">🏦 Transferencia</SelectItem>
                    <SelectItem value="tarjeta_credito">💳 Tarjeta de Crédito</SelectItem>
                    <SelectItem value="tarjeta_debito">💳 Tarjeta de Débito</SelectItem>
                    <SelectItem value="cheque">📝 Cheque</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Cómo se pagó/cobró esta factura
                </p>
              </div>
              
              <div>
                <Label htmlFor="invoice_direction">Dirección de Factura</Label>
                <Select
                  value={manualInvoiceData.invoice_direction}
                  onValueChange={(value) => 
                    setManualInvoiceData({
                      ...manualInvoiceData, 
                      invoice_direction: value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar dirección" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emitida">📤 Emitida (Venta - Tú cobras)</SelectItem>
                    <SelectItem value="recibida">📥 Recibida (Compra - Tú pagas)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {manualInvoiceData.invoice_direction === 'emitida' 
                    ? "Factura que emites a tus clientes" 
                    : "Factura que recibes de proveedores"
                  }
                </p>
              </div>
              
              <div className="col-span-2">
                <div className="flex items-center space-x-3 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <Switch
                    id="es_compensacion_iva"
                    checked={manualInvoiceData.es_compensacion_iva}
                    onCheckedChange={(checked) => 
                      setManualInvoiceData({...manualInvoiceData, es_compensacion_iva: checked})
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="es_compensacion_iva" className="text-sm font-medium text-yellow-900">
                      Factura de Compensación IVA
                    </Label>
                    <p className="text-xs text-yellow-700 mt-1">
                      {manualInvoiceData.es_compensacion_iva 
                        ? "⚠️ Solo para compensar IVA (no afecta caja real)"
                        : "✅ Factura normal (afecta tanto IVA como caja)"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={manualInvoiceData.description}
                onChange={(e) => setManualInvoiceData({...manualInvoiceData, description: e.target.value})}
                placeholder="Descripción de la factura"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleManualInvoiceSubmit}
                disabled={isUploading || !manualInvoiceData.invoice_number || !manualInvoiceData.client_name}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Factura
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Área de Carga */}
      <Card className="card-theme-info">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Cargar Archivos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Arrastra archivos aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500">
                  Formatos soportados: PDF, JPG, PNG (máximo 10MB por archivo)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cargas */}
      {uploads.length > 0 && (
        <Card className="card-theme-success">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Archivos en Procesamiento</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className={`p-4 rounded-lg border ${getStatusColor(upload.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(upload.status)}
                      <div>
                        <p className="font-medium text-gray-900">{upload.file.name}</p>
                        <p className="text-sm text-gray-500">{upload.message}</p>
                        <p className="text-xs text-gray-400">Propietario: {upload.owner}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeUpload(upload.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {(upload.status === 'uploading' || upload.status === 'processing') && (
                    <div className="mt-3">
                      <Progress value={upload.progress} className="h-2" />
                    </div>
                  )}
                  
                  {upload.status === 'completed' && upload.extractedData && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-sm font-medium text-gray-900 mb-2">Datos extraídos:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="font-medium">Número:</span> {upload.extractedData.invoice_number}</div>
                        <div><span className="font-medium">Cliente:</span> {upload.extractedData.client_name}</div>
                        <div><span className="font-medium">Total:</span> ${upload.extractedData.total?.toLocaleString()}</div>
                        <div><span className="font-medium">Fecha:</span> {upload.extractedData.issue_date}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Previsualización */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Previsualización de Factura Procesada
            </DialogTitle>
            <DialogDescription>
              Revisa los datos extraídos antes de confirmar y guardar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Número de Factura</Label>
                <p className="text-sm text-gray-600">FAC-12345</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Cliente/Proveedor</Label>
                <p className="text-sm text-gray-600">Cliente Ejemplo S.A.</p>
              </div>
              <div>
                <Label className="text-sm font-medium">CUIT</Label>
                <p className="text-sm text-gray-600">20-12345678-9</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Tipo</Label>
                <Badge className="bg-blue-500 text-white">Factura A</Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Fecha Emisión</Label>
                <p className="text-sm text-gray-600">2024-01-15</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Total</Label>
                <p className="text-sm font-medium text-green-600">$125,000</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Descripción</Label>
              <p className="text-sm text-gray-600">Servicios profesionales</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmUpload} className="bg-blue-500 text-white hover:bg-blue-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar y Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Duplicados */}
      <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Factura Posiblemente Duplicada
            </DialogTitle>
            <DialogDescription>
              Se detectó una factura similar en el sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Confianza:</strong> {duplicateCheck?.confidence ? Math.round(duplicateCheck.confidence * 100) : 0}%
              </p>
            </div>
            
            {duplicateCheck?.similar_invoices.map((invoice) => (
              <div key={invoice.id} className="p-3 border rounded-lg">
                <p className="font-medium">Factura #{invoice.id}</p>
                <p className="text-sm text-gray-600">Archivo: {invoice.filename}</p>
                <p className="text-sm text-gray-600">Total: ${invoice.total?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Fecha: {invoice.date}</p>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleDuplicateCancel}>
              Cancelar Carga
            </Button>
            <Button onClick={handleDuplicateProceed} className="bg-yellow-500 text-white hover:bg-yellow-600">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Proceder de Todas Formas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UploadInvoicePage;