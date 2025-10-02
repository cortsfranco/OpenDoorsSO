import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Target,
  BarChart3,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface TrainingDataset {
  id: string;
  name: string;
  type: 'invoice_format' | 'disordered_doc' | 'multi_invoice_pdf';
  description: string;
  sample_count: number;
  accuracy: number;
  status: 'trained' | 'training' | 'pending' | 'error';
  last_trained: string;
}

interface TrainingProgress {
  dataset_id: string;
  progress: number;
  current_step: string;
  estimated_time: string;
}

const AITrainingManager: React.FC = () => {
  const [datasets, setDatasets] = useState<TrainingDataset[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [trainingConfig, setTrainingConfig] = useState({
    epochs: 100,
    learning_rate: 0.001,
    batch_size: 32,
    validation_split: 0.2
  });
  const [customInstructions, setCustomInstructions] = useState('');
  const { success, error, warning } = useNotifications();

  // Datos de ejemplo para los datasets de entrenamiento
  const mockDatasets: TrainingDataset[] = [
    {
      id: 'invoice_format_standard',
      name: 'Formatos Estándar de Facturas',
      type: 'invoice_format',
      description: 'Facturas A, B, C en formatos estándar argentinos',
      sample_count: 1250,
      accuracy: 94.5,
      status: 'trained',
      last_trained: '2025-01-15'
    },
    {
      id: 'disordered_documents',
      name: 'Documentos Desordenados',
      type: 'disordered_doc',
      description: 'Facturas con datos desorganizados o mal estructurados',
      sample_count: 850,
      accuracy: 87.2,
      status: 'trained',
      last_trained: '2025-01-10'
    },
    {
      id: 'multi_invoice_pdfs',
      name: 'PDFs Multi-Factura',
      type: 'multi_invoice_pdf',
      description: 'PDFs que contienen múltiples facturas en un solo documento',
      sample_count: 420,
      accuracy: 91.8,
      status: 'trained',
      last_trained: '2025-01-12'
    },
    {
      id: 'custom_formats',
      name: 'Formatos Personalizados',
      type: 'invoice_format',
      description: 'Formatos específicos de clientes/proveedores únicos',
      sample_count: 180,
      accuracy: 0,
      status: 'pending',
      last_trained: 'Nunca'
    }
  ];

  useEffect(() => {
    setDatasets(mockDatasets);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      trained: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Entrenado' },
      training: { color: 'bg-blue-100 text-blue-800', icon: Zap, label: 'Entrenando' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Pendiente' },
      error: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Error' }
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

  const getTypeIcon = (type: string) => {
    const typeIcons = {
      invoice_format: '📄',
      disordered_doc: '🗂️',
      multi_invoice_pdf: '📚'
    };
    
    return typeIcons[type as keyof typeof typeIcons] || '📄';
  };

  const getTypeLabel = (type: string) => {
    const typeLabels = {
      invoice_format: 'Formato de Factura',
      disordered_doc: 'Documento Desordenado',
      multi_invoice_pdf: 'PDF Multi-Factura'
    };
    
    return typeLabels[type as keyof typeof typeLabels] || 'Desconocido';
  };

  const handleStartTraining = async (datasetId: string) => {
    try {
      setIsTraining(true);
      setSelectedDataset(datasetId);
      
      // Simular progreso de entrenamiento
      const progressSteps = [
        'Inicializando modelo...',
        'Cargando dataset...',
        'Preparando datos...',
        'Entrenando modelo...',
        'Validando resultados...',
        'Guardando modelo...'
      ];
      
      for (let i = 0; i < progressSteps.length; i++) {
        setTrainingProgress({
          dataset_id: datasetId,
          progress: ((i + 1) / progressSteps.length) * 100,
          current_step: progressSteps[i],
          estimated_time: `${Math.max(0, (progressSteps.length - i - 1) * 30)}s restantes`
        });
        
        // Simular tiempo de entrenamiento
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Actualizar el dataset como entrenado
      setDatasets(prev => prev.map(dataset => 
        dataset.id === datasetId 
          ? { ...dataset, status: 'trained', accuracy: 92.5, last_trained: new Date().toISOString().split('T')[0] }
          : dataset
      ));
      
      setTrainingProgress(null);
      setIsTraining(false);
      success('Entrenamiento Completado', 'El modelo se ha entrenado exitosamente');
      
    } catch (err) {
      setTrainingProgress(null);
      setIsTraining(false);
      error('Error de Entrenamiento', 'No se pudo completar el entrenamiento');
    }
  };

  const handleStopTraining = () => {
    setTrainingProgress(null);
    setIsTraining(false);
    warning('Entrenamiento Detenido', 'El entrenamiento ha sido cancelado');
  };

  const handleRetrainAll = async () => {
    const pendingDatasets = datasets.filter(d => d.status !== 'trained');
    
    if (pendingDatasets.length === 0) {
      warning('Sin Datasets Pendientes', 'Todos los datasets ya están entrenados');
      return;
    }
    
    for (const dataset of pendingDatasets) {
      await handleStartTraining(dataset.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Modelos Entrenados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {datasets.filter(d => d.status === 'trained').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Precisión Promedio</p>
                <p className="text-2xl font-bold text-green-600">
                  {(datasets.filter(d => d.status === 'trained').reduce((acc, d) => acc + d.accuracy, 0) / 
                    Math.max(1, datasets.filter(d => d.status === 'trained').length)).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Samples</p>
                <p className="text-2xl font-bold text-purple-600">
                  {datasets.reduce((acc, d) => acc + d.sample_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {datasets.filter(d => d.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuración de entrenamiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración de Entrenamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="epochs">Épocas</Label>
              <Input
                id="epochs"
                type="number"
                value={trainingConfig.epochs}
                onChange={(e) => setTrainingConfig(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="learning_rate">Tasa de Aprendizaje</Label>
              <Input
                id="learning_rate"
                type="number"
                step="0.001"
                value={trainingConfig.learning_rate}
                onChange={(e) => setTrainingConfig(prev => ({ ...prev, learning_rate: parseFloat(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="batch_size">Tamaño de Lote</Label>
              <Input
                id="batch_size"
                type="number"
                value={trainingConfig.batch_size}
                onChange={(e) => setTrainingConfig(prev => ({ ...prev, batch_size: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="validation_split">División Validación</Label>
              <Input
                id="validation_split"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={trainingConfig.validation_split}
                onChange={(e) => setTrainingConfig(prev => ({ ...prev, validation_split: parseFloat(e.target.value) }))}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="custom_instructions">Instrucciones Personalizadas</Label>
            <Textarea
              id="custom_instructions"
              placeholder="Instrucciones específicas para el entrenamiento (ej: 'Priorizar reconocimiento de CUIT', 'Mejorar detección de montos')"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleRetrainAll}
              disabled={isTraining || datasets.filter(d => d.status === 'pending').length === 0}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              <Play className="w-4 h-4 mr-2" />
              Entrenar Todos los Pendientes
            </Button>
            {isTraining && (
              <Button
                onClick={handleStopTraining}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                <Pause className="w-4 h-4 mr-2" />
                Detener Entrenamiento
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progreso de entrenamiento */}
      {trainingProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Entrenamiento en Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{trainingProgress.current_step}</span>
                  <span>{trainingProgress.estimated_time}</span>
                </div>
                <Progress value={trainingProgress.progress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de datasets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Datasets de Entrenamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {datasets.map((dataset) => (
              <div key={dataset.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getTypeIcon(dataset.type)}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{dataset.name}</h3>
                        <p className="text-sm text-gray-600">{dataset.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{dataset.sample_count} muestras</span>
                      <span>•</span>
                      <span>Tipo: {getTypeLabel(dataset.type)}</span>
                      <span>•</span>
                      <span>Último entrenamiento: {dataset.last_trained}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {dataset.status === 'trained' && (
                        <div>
                          <p className="text-sm text-gray-600">Precisión</p>
                          <p className="text-lg font-bold text-green-600">{dataset.accuracy}%</p>
                        </div>
                      )}
                      {getStatusBadge(dataset.status)}
                    </div>
                    
                    <div className="flex gap-2">
                      {dataset.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleStartTraining(dataset.id)}
                          disabled={isTraining}
                          className="bg-blue-500 text-white hover:bg-blue-600"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Entrenar
                        </Button>
                      )}
                      
                      {dataset.status === 'trained' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartTraining(dataset.id)}
                          disabled={isTraining}
                          className="btn-animated"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Re-entrenar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AITrainingManager;
