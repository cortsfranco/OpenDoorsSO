import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  User,
  Building2,
  FileCheck
} from 'lucide-react';
import apiService from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';

interface Partner {
  id: number;
  name: string;
  business_type: string;
  cuit?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'duplicate';
  message?: string;
  duplicateData?: any;
}

interface ManualInvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  client_name: string;
  client_cuit: string;
  subtotal: number;
  iva: number;
  total: number;
  invoice_type: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

const UploadInvoicePage: React.FC = () => {
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [customPartnerName, setCustomPartnerName] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualData, setManualData] = useState<ManualInvoiceData>({
    invoice_number: '',
    issue_date: '',
    due_date: '',
    client_name: '',
    client_cuit: '',
    subtotal: 0,
    iva: 0,
    total: 0,
    invoice_type: 'A',
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
  });
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateData, setDuplicateData] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError, showWarning } = useNotifications();

  // Cargar socios al montar el componente
  React.useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const response = await apiService.getPartners();
      setPartners(response);
    } catch (error) {
      console.error('Error loading partners:', error);
      showError('Error al cargar socios');
    }
  };

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
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    // Validar tipos de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      showError('Solo se permiten archivos PDF, JPG y PNG');
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      showError('Los archivos no pueden superar los 10MB');
      return;
    }

    // Verificar si hay un socio seleccionado
    if (!selectedPartner && !customPartnerName.trim()) {
      showError('Debe seleccionar o ingresar un socio');
      return;
    }

    setIsUploading(true);
    
    // Inicializar progreso para cada archivo
    const initialProgress: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));
    setUploadProgress(initialProgress);

    // Procesar cada archivo
    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i], i);
    }

    setIsUploading(false);
  };

  const uploadFile = async (file: File, index: number) => {
    try {
      // Simular progreso de carga
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress(prev => prev.map((item, i) => 
          i === index ? { ...item, progress } : item
        ));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verificar duplicados
      const duplicateCheck = await checkForDuplicates(file);
      if (duplicateCheck.isDuplicate) {
        setUploadProgress(prev => prev.map((item, i) => 
          i === index ? { 
            ...item, 
            status: 'duplicate', 
            message: 'Factura duplicada detectada',
            duplicateData: duplicateCheck.data
          } : item
        ));
        setDuplicateData(duplicateCheck.data);
        setShowDuplicateDialog(true);
        return;
      }

      // Subir archivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('owner', selectedPartner || customPartnerName);

      const response = await apiService.uploadInvoice(formData);
      
      setUploadProgress(prev => prev.map((item, i) => 
        i === index ? { 
          ...item, 
          status: 'completed', 
          message: 'Factura cargada exitosamente' 
        } : item
      ));

      showSuccess('Factura cargada', `La factura ${file.name} fue procesada correctamente`);

    } catch (error: any) {
      setUploadProgress(prev => prev.map((item, i) => 
        i === index ? { 
          ...item, 
          status: 'error', 
          message: error.message || 'Error al cargar factura' 
        } : item
      ));
      showError('Error al cargar', error.message || 'Error desconocido');
    }
  };

  const checkForDuplicates = async (file: File): Promise<{isDuplicate: boolean, data?: any}> => {
    try {
      // Simular verificación de duplicados
      // En la implementación real, esto haría una llamada a la API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simular detección de duplicado (por ahora siempre false)
      return { isDuplicate: false };
    } catch (error) {
      return { isDuplicate: false };
    }
  };

  const handleManualSubmit = async () => {
    try {
      // Validar datos
      if (!manualData.invoice_number || !manualData.client_name || !manualData.total) {
        showError('Por favor complete todos los campos obligatorios');
        return;
      }

      if (!selectedPartner && !customPartnerName.trim()) {
        showError('Debe seleccionar o ingresar un socio');
        return;
      }

      // Crear factura manual
      const invoiceData = {
        ...manualData,
        owner: selectedPartner || customPartnerName,
        status: 'completed',
        extracted_data: manualData
      };

      await apiService.createManualInvoice(invoiceData);
      showSuccess('Factura creada', 'La factura fue creada exitosamente');
      
      // Resetear formulario
      setManualData({
        invoice_number: '',
        issue_date: '',
        due_date: '',
        client_name: '',
        client_cuit: '',
        subtotal: 0,
        iva: 0,
        total: 0,
        invoice_type: 'A',
        items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
      });
      setShowManualForm(false);

    } catch (error: any) {
      showError('Error al crear factura', error.message || 'Error desconocido');
    }
  };

  const addItem = () => {
    setManualData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setManualData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setManualData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotals = () => {
    const subtotal = manualData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const iva = subtotal * 0.21; // IVA 21%
    const total = subtotal + iva;
    
    setManualData(prev => ({
      ...prev,
      subtotal,
      iva,
      total
    }));
  };

  React.useEffect(() => {
    calculateTotals();
  }, [manualData.items]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cargar Facturas</h1>
          <p className="text-gray-600 mt-2">
            Sube facturas PDF o ingresa datos manualmente
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowManualForm(true)}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ingreso Manual
          </Button>
        </div>
      </div>

      {/* Selector de Socio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Propietario de la Factura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {partners.map((partner) => (
              <label key={partner.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="partner"
                  value={partner.name}
                  checked={selectedPartner === partner.name}
                  onChange={(e) => {
                    setSelectedPartner(e.target.value);
                    setCustomPartnerName('');
                  }}
                  className="text-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">{partner.name}</div>
                  <div className="text-sm text-gray-500">{partner.business_type}</div>
                  {partner.cuit && (
                    <div className="text-xs text-gray-400">CUIT: {partner.cuit}</div>
                  )}
                </div>
              </label>
            ))}
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="partner"
                value="custom"
                checked={!selectedPartner && customPartnerName !== ''}
                onChange={() => setSelectedPartner('')}
                className="text-primary"
              />
              <div className="flex-1">
                <div className="font-medium">Otro socio</div>
                <Input
                  placeholder="Nombre del socio"
                  value={customPartnerName}
                  onChange={(e) => setCustomPartnerName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Área de Carga */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Cargar Archivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">
              Arrastra archivos aquí o haz clic para seleccionar
            </h3>
            <p className="text-gray-500 mb-4">
              Formatos soportados: PDF, JPG, PNG (máximo 10MB)
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary text-white hover:bg-primary/90"
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Seleccionar Archivos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Progreso de Carga */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Progreso de Carga
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadProgress.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.file.name}</span>
                  <div className="flex items-center gap-2">
                    {item.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    {item.status === 'duplicate' && (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <Badge
                      className={
                        item.status === 'completed' ? 'bg-green-500 text-white' :
                        item.status === 'error' ? 'bg-red-500 text-white' :
                        item.status === 'duplicate' ? 'bg-yellow-500 text-white' :
                        'bg-blue-500 text-white'
                      }
                    >
                      {item.status === 'uploading' ? 'Subiendo...' :
                       item.status === 'completed' ? 'Completado' :
                       item.status === 'error' ? 'Error' :
                       item.status === 'duplicate' ? 'Duplicado' : item.status}
                    </Badge>
                  </div>
                </div>
                <Progress value={item.progress} className="w-full" />
                {item.message && (
                  <p className="text-sm text-gray-600">{item.message}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Modal de Ingreso Manual */}
      <Dialog open={showManualForm} onOpenChange={setShowManualForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ingreso Manual de Factura</DialogTitle>
            <DialogDescription>
              Complete los datos de la factura manualmente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoice_number">Número de Factura *</Label>
                <Input
                  id="invoice_number"
                  value={manualData.invoice_number}
                  onChange={(e) => setManualData(prev => ({ ...prev, invoice_number: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="invoice_type">Tipo de Factura</Label>
                <select
                  id="invoice_type"
                  value={manualData.invoice_type}
                  onChange={(e) => setManualData(prev => ({ ...prev, invoice_type: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div>
                <Label htmlFor="issue_date">Fecha de Emisión</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={manualData.issue_date}
                  onChange={(e) => setManualData(prev => ({ ...prev, issue_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="due_date">Fecha de Vencimiento</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={manualData.due_date}
                  onChange={(e) => setManualData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Información del Cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información del Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_name">Nombre/Razón Social *</Label>
                  <Input
                    id="client_name"
                    value={manualData.client_name}
                    onChange={(e) => setManualData(prev => ({ ...prev, client_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="client_cuit">CUIT</Label>
                  <Input
                    id="client_cuit"
                    value={manualData.client_cuit}
                    onChange={(e) => setManualData(prev => ({ ...prev, client_cuit: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Items de la Factura</h3>
                <Button onClick={addItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Item
                </Button>
              </div>
              
              {manualData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                  <div className="md:col-span-2">
                    <Label>Descripción</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Precio Unit.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label>Total</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={(item.quantity * item.unit_price).toFixed(2)}
                        readOnly
                      />
                    </div>
                    <Button
                      onClick={() => removeItem(index)}
                      variant="destructive"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Totales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Subtotal</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={manualData.subtotal.toFixed(2)}
                    readOnly
                  />
                </div>
                <div>
                  <Label>IVA (21%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={manualData.iva.toFixed(2)}
                    readOnly
                  />
                </div>
                <div>
                  <Label>Total</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={manualData.total.toFixed(2)}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleManualSubmit} className="bg-primary text-white">
              Crear Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Duplicado */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Factura Duplicada Detectada
            </DialogTitle>
            <DialogDescription>
              Se encontró una factura con datos similares. Revise la información antes de continuar.
            </DialogDescription>
          </DialogHeader>
          
          {duplicateData && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800">Factura Existente:</h4>
                <div className="mt-2 text-sm text-yellow-700">
                  <p><strong>Número:</strong> {duplicateData.invoice_number}</p>
                  <p><strong>Cliente:</strong> {duplicateData.client_name}</p>
                  <p><strong>Total:</strong> ${duplicateData.total}</p>
                  <p><strong>Fecha:</strong> {duplicateData.issue_date}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                ¿Está seguro de que desea continuar con la carga de esta factura?
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                setShowDuplicateDialog(false);
                // Continuar con la carga
              }}
              className="bg-yellow-500 text-white hover:bg-yellow-600"
            >
              Continuar de Todos Modos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UploadInvoicePage;
