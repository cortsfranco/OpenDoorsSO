import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  Activity,
  User,
  Calendar,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import apiService from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';

interface ActivityLogEntry {
  id: number;
  timestamp: string;
  user_id: number | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  user_email?: string;
  user_name?: string;
}

interface FilterState {
  search: string;
  user: string;
  action: string;
  dateFrom: string;
  dateTo: string;
}

const ActivityLogPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    user: '',
    action: '',
    dateFrom: '',
    dateTo: ''
  });
  
  const { success, error } = useNotifications();

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      // TODO: Implementar endpoint real para activity logs
      // Por ahora usamos datos de ejemplo
      const mockLogs: ActivityLogEntry[] = [
        {
          id: 1,
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          user_id: 1,
          action: 'LOGIN',
          details: 'Usuario inició sesión exitosamente',
          ip_address: '192.168.1.100',
          user_email: 'franco@opendoors.com',
          user_name: 'Franco Corts'
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          user_id: 1,
          action: 'UPLOAD_INVOICE',
          details: 'Factura "factura_001.pdf" cargada exitosamente',
          ip_address: '192.168.1.100',
          user_email: 'franco@opendoors.com',
          user_name: 'Franco Corts'
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          user_id: 2,
          action: 'APPROVE_INVOICE',
          details: 'Factura #123 aprobada para pago',
          ip_address: '192.168.1.101',
          user_email: 'hernan@opendoors.com',
          user_name: 'Hernán Pagani'
        },
        {
          id: 4,
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          user_id: 1,
          action: 'EDIT_CLIENT',
          details: 'Cliente "Empresa ABC" actualizado',
          ip_address: '192.168.1.100',
          user_email: 'franco@opendoors.com',
          user_name: 'Franco Corts'
        },
        {
          id: 5,
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          user_id: 3,
          action: 'CREATE_PARTNER',
          details: 'Nuevo socio "Proveedor XYZ" creado',
          ip_address: '192.168.1.102',
          user_email: 'joni@opendoors.com',
          user_name: 'Joni Tagua'
        },
        {
          id: 6,
          timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
          user_id: 1,
          action: 'EXPORT_DATA',
          details: 'Datos exportados a Excel: facturas_2024.xlsx',
          ip_address: '192.168.1.100',
          user_email: 'franco@opendoors.com',
          user_name: 'Franco Corts'
        },
        {
          id: 7,
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          user_id: 2,
          action: 'REJECT_INVOICE',
          details: 'Factura #124 rechazada - Datos inconsistentes',
          ip_address: '192.168.1.101',
          user_email: 'hernan@opendoors.com',
          user_name: 'Hernán Pagani'
        },
        {
          id: 8,
          timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
          user_id: null,
          action: 'SYSTEM_BACKUP',
          details: 'Respaldo automático de base de datos completado',
          ip_address: 'system',
          user_email: undefined,
          user_name: 'Sistema'
        }
      ];
      
      setLogs(mockLogs);
    } catch (err: any) {
      error('Error', 'No se pudieron cargar los registros de actividad.');
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Filtro de búsqueda general
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchLower) ||
        (log.details && log.details.toLowerCase().includes(searchLower)) ||
        (log.user_name && log.user_name.toLowerCase().includes(searchLower)) ||
        (log.user_email && log.user_email.toLowerCase().includes(searchLower))
      );
    }

    // Filtro por usuario
    if (filters.user) {
      filtered = filtered.filter(log => 
        log.user_name === filters.user
      );
    }

    // Filtro por acción
    if (filters.action) {
      filtered = filtered.filter(log => 
        log.action === filters.action
      );
    }

    // Filtros de fecha
    if (filters.dateFrom) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) <= new Date(filters.dateTo)
      );
    }

    setFilteredLogs(filtered);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      user: '',
      action: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const getActionBadge = (action: string) => {
    const actionConfig = {
      'LOGIN': { color: 'bg-green-500 text-white', label: 'Inicio de Sesión' },
      'LOGOUT': { color: 'bg-gray-500 text-white', label: 'Cierre de Sesión' },
      'UPLOAD_INVOICE': { color: 'bg-blue-500 text-white', label: 'Carga Factura' },
      'APPROVE_INVOICE': { color: 'bg-green-600 text-white', label: 'Aprobar Factura' },
      'REJECT_INVOICE': { color: 'bg-red-500 text-white', label: 'Rechazar Factura' },
      'EDIT_CLIENT': { color: 'bg-yellow-500 text-white', label: 'Editar Cliente' },
      'CREATE_PARTNER': { color: 'bg-purple-500 text-white', label: 'Crear Socio' },
      'EXPORT_DATA': { color: 'bg-indigo-500 text-white', label: 'Exportar Datos' },
      'SYSTEM_BACKUP': { color: 'bg-gray-600 text-white', label: 'Respaldo Sistema' }
    };
    
    const config = actionConfig[action as keyof typeof actionConfig] || 
                  { color: 'bg-gray-500 text-white', label: action };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getUniqueUsers = () => {
    const users = logs
      .filter(log => log.user_name)
      .map(log => log.user_name!)
      .filter((user, index, arr) => arr.indexOf(user) === index);
    return users;
  };

  const getUniqueActions = () => {
    const actions = logs
      .map(log => log.action)
      .filter((action, index, arr) => arr.indexOf(action) === index);
    return actions;
  };

  const exportToCSV = () => {
    const headers = [
      'ID', 'Fecha/Hora', 'Usuario', 'Acción', 'Descripción', 'IP'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        log.id,
        format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss'),
        `"${log.user_name || 'Sistema'}"`,
        `"${log.action}"`,
        `"${log.details || 'N/A'}"`,
        log.ip_address || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `registro_actividades_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    success('Exportación Exitosa', 'El registro de actividades se ha exportado correctamente.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registro de Actividades</h1>
          <p className="text-gray-600 mt-2">
            Auditoría completa de todas las acciones realizadas en el sistema
          </p>
        </div>
        <Badge className="bg-blue-500 text-white">
          <Activity className="w-4 h-4 mr-2" />
          {filteredLogs.length} actividades
        </Badge>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Búsqueda Simple */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Búsqueda General</Label>
              <Input
                id="search"
                placeholder="Buscar por acción, usuario, descripción..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="bg-background text-text-primary border-gray-300"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros Avanzados
              {advancedFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="text-red-600 hover:text-red-700"
            >
              Limpiar
            </Button>
          </div>

          {/* Filtros Avanzados Colapsables */}
          {advancedFiltersOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="user">Usuario</Label>
                <Select value={filters.user} onValueChange={(value) => setFilters({...filters, user: value})}>
                  <SelectTrigger className="bg-background text-text-primary border-gray-300">
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los usuarios</SelectItem>
                    {getUniqueUsers().map(user => (
                      <SelectItem key={user} value={user}>{user}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="action">Tipo de Acción</Label>
                <Select value={filters.action} onValueChange={(value) => setFilters({...filters, action: value})}>
                  <SelectTrigger className="bg-background text-text-primary border-gray-300">
                    <SelectValue placeholder="Seleccionar acción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las acciones</SelectItem>
                    {getUniqueActions().map(action => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateFrom">Fecha Desde</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="bg-background text-text-primary border-gray-300"
                />
              </div>

              <div>
                <Label htmlFor="dateTo">Fecha Hasta</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="bg-background text-text-primary border-gray-300"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón de Exportación */}
      <Card>
        <CardContent className="p-4">
          <Button
            onClick={exportToCSV}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </CardContent>
      </Card>

      {/* Tabla de Actividades */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Cargando registro de actividades...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No se encontraron actividades</p>
              <p className="text-sm mt-2">Ajusta los filtros para ver más resultados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-500">
                  <TableHead className="text-white font-semibold">ID</TableHead>
                  <TableHead className="text-white font-semibold">Fecha/Hora</TableHead>
                  <TableHead className="text-white font-semibold">Usuario</TableHead>
                  <TableHead className="text-white font-semibold">Acción</TableHead>
                  <TableHead className="text-white font-semibold">Descripción</TableHead>
                  <TableHead className="text-white font-semibold">IP</TableHead>
                  <TableHead className="text-white font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{log.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div className="text-sm">
                          <div>{format(new Date(log.timestamp), 'dd/MM/yyyy')}</div>
                          <div className="text-gray-500">{format(new Date(log.timestamp), 'HH:mm:ss')}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{log.user_name || 'Sistema'}</div>
                          {log.user_email && (
                            <div className="text-xs text-gray-500">{log.user_email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={log.details || 'N/A'}>
                        {log.details || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {log.ip_address || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => console.log('Ver detalles:', log.id)}
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
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

export default ActivityLogPage;