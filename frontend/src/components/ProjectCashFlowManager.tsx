import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  FolderOpen, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  User,
  Plus,
  Edit,
  Eye,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealTimeEdit } from '@/hooks/useRealTimeEdit';
import { EditableCell } from '@/components/EditableCell';

interface Project {
  id: string;
  name: string;
  description: string;
  client: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  budget: number;
  owner: string;
  created_at: string;
}

interface ProjectTransaction {
  id: string;
  project_id: string;
  invoice_id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
  owner: string;
}

interface ProjectCashFlow {
  project_id: string;
  total_income: number;
  total_expenses: number;
  net_cash_flow: number;
  budget_utilization: number;
  transactions_count: number;
}

const ProjectCashFlowManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<ProjectTransaction[]>([]);
  const [cashFlowData, setCashFlowData] = useState<ProjectCashFlow[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [viewMode, setViewMode] = useState<'overview' | 'details'>('overview');
  const [loading, setLoading] = useState(true);
  const { success, error } = useNotifications();

  // Hook para edición en tiempo real
  const { updateField, deleteItem } = useRealTimeEdit({
    onUpdate: async (id, field, value) => {
      // Aquí se implementaría la actualización en el backend
      console.log(`Updating project ${id}, field: ${field}, value: ${value}`);
      // Actualizar estado local
      if (field.startsWith('project.')) {
        const projectField = field.replace('project.', '');
        setProjects(prev => prev.map(project => 
          project.id === id 
            ? { ...project, [projectField]: value }
            : project
        ));
      } else if (field.startsWith('transaction.')) {
        const transactionField = field.replace('transaction.', '');
        setTransactions(prev => prev.map(transaction => 
          transaction.id === id 
            ? { ...transaction, [transactionField]: value }
            : transaction
        ));
      }
    },
    onDelete: async (id) => {
      // Aquí se implementaría la eliminación en el backend
      console.log(`Deleting item ${id}`);
      // Actualizar estado local
      setProjects(prev => prev.filter(project => project.id !== id));
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    }
  });

  // Los datos vendrán del backend
  const mockProjects: Project[] = [];
  const mockTransactions: ProjectTransaction[] = [];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setProjects(mockProjects);
      setTransactions(mockTransactions);
      calculateCashFlow();
      setLoading(false);
    }, 1000);
  }, []);

  const calculateCashFlow = () => {
    const cashFlow: ProjectCashFlow[] = projects.map(project => {
      const projectTransactions = transactions.filter(tx => tx.project_id === project.id);
      const totalIncome = projectTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const totalExpenses = projectTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const netCashFlow = totalIncome - totalExpenses;
      const budgetUtilization = (totalIncome / project.budget) * 100;

      return {
        project_id: project.id,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_cash_flow: netCashFlow,
        budget_utilization: budgetUtilization,
        transactions_count: projectTransactions.length
      };
    });

    setCashFlowData(cashFlow);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Activo' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Completado' },
      paused: { color: 'bg-yellow-100 text-yellow-800', label: 'Pausado' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const getCashFlowColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getCashFlowIcon = (amount: number) => {
    if (amount > 0) return <TrendingUp className="w-4 h-4" />;
    if (amount < 0) return <TrendingDown className="w-4 h-4" />;
    return <DollarSign className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Cargando proyectos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cash Flow por Proyecto</h2>
          <p className="text-gray-600">Seguimiento financiero detallado por proyecto</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Seleccionar proyecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proyectos</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="btn-animated"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proyecto
            </Button>
            <Button
              variant={viewMode === 'overview' ? 'default' : 'outline'}
              onClick={() => setViewMode('overview')}
              size="sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Resumen
            </Button>
            <Button
              variant={viewMode === 'details' ? 'default' : 'outline'}
              onClick={() => setViewMode('details')}
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Detalles
            </Button>
          </div>
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Proyectos Activos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(cashFlowData.reduce((sum, cf) => sum + cf.total_income, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Gastos Totales</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(cashFlowData.reduce((sum, cf) => sum + cf.total_expenses, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Cash Flow Neto</p>
                <p className={`text-2xl font-bold ${getCashFlowColor(cashFlowData.reduce((sum, cf) => sum + cf.net_cash_flow, 0))}`}>
                  {formatCurrency(cashFlowData.reduce((sum, cf) => sum + cf.net_cash_flow, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de proyectos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Proyectos y Cash Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-500">
                <TableHead className="text-white font-semibold">Proyecto</TableHead>
                <TableHead className="text-white font-semibold">Cliente</TableHead>
                <TableHead className="text-white font-semibold">Estado</TableHead>
                <TableHead className="text-white font-semibold">Presupuesto</TableHead>
                <TableHead className="text-white font-semibold">Ingresos</TableHead>
                <TableHead className="text-white font-semibold">Gastos</TableHead>
                <TableHead className="text-white font-semibold">Cash Flow</TableHead>
                <TableHead className="text-white font-semibold">Utilización</TableHead>
                <TableHead className="text-white font-semibold">Detalle</TableHead>
                <TableHead className="text-white font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects
                .filter(project => selectedProject === "all" || !selectedProject || project.id === selectedProject)
                .map(project => {
                  const cashFlow = cashFlowData.find(cf => cf.project_id === project.id);
                  if (!cashFlow) return null;

                  return (
                    <TableRow key={project.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <EditableCell
                            value={project.name}
                            onSave={(value) => updateField(project.id, 'project.name', value)}
                            placeholder="Nombre del proyecto"
                            className="font-semibold"
                          />
                          <EditableCell
                            value={project.description}
                            onSave={(value) => updateField(project.id, 'project.description', value)}
                            placeholder="Descripción del proyecto"
                            className="text-sm text-gray-600 truncate max-w-xs"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <EditableCell
                            value={project.client}
                            onSave={(value) => updateField(project.id, 'project.client', value)}
                            placeholder="Cliente"
                            className="text-sm"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(project.status)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <EditableCell
                          value={project.budget}
                          onSave={(value) => updateField(project.id, 'project.budget', value)}
                          type="number"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(cashFlow.total_income)}
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        {formatCurrency(cashFlow.total_expenses)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className={`flex items-center gap-1 ${getCashFlowColor(cashFlow.net_cash_flow)}`}>
                          {getCashFlowIcon(cashFlow.net_cash_flow)}
                          {formatCurrency(cashFlow.net_cash_flow)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{cashFlow.budget_utilization.toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={Math.min(cashFlow.budget_utilization, 100)} 
                            className="h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value=""
                          onSave={(value) => updateField(project.id, 'project.detail', value)}
                          placeholder="Agregar detalle..."
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="btn-animated"
                            onClick={() => setSelectedProject(project.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="btn-animated text-red-600 hover:text-red-700"
                            onClick={() => deleteItem(project.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detalles de transacciones para proyecto seleccionado */}
      {selectedProject && viewMode === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Transacciones del Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Responsable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions
                  .filter(tx => selectedProject !== "all" && tx.project_id === selectedProject)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }>
                          {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        #{transaction.invoice_id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{transaction.owner}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectCashFlowManager;
