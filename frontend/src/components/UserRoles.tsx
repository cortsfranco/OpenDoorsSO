import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  User, 
  Shield, 
  CheckCircle, 
  XCircle,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'approver' | 'uploader' | 'viewer';
  is_active: boolean;
}

interface UserRolesProps {
  onRoleChange?: (userId: number, newRole: string) => void;
}

const UserRoles: React.FC<UserRolesProps> = ({ onRoleChange }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [tempRole, setTempRole] = useState<string>('');
  const { success, error } = useNotifications();

  // Datos de ejemplo (en producción vendrían de la API)
  const mockUsers: User[] = [
    {
      id: 1,
      name: 'Franco Cortés',
      email: 'cortsfranco@hotmail.com',
      role: 'admin',
      is_active: true
    },
    {
      id: 2,
      name: 'Joni Tagua',
      email: 'joni@opendoors.com',
      role: 'approver',
      is_active: true
    },
    {
      id: 3,
      name: 'Hernán Pagani',
      email: 'hernan@opendoors.com',
      role: 'uploader',
      is_active: true
    }
  ];

  useEffect(() => {
    // Simular carga de usuarios
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { color: 'bg-red-100 text-red-800', icon: '👑', label: 'Administrador' },
      approver: { color: 'bg-green-100 text-green-800', icon: '✅', label: 'Aprobador' },
      uploader: { color: 'bg-blue-100 text-blue-800', icon: '📤', label: 'Cargador' },
      viewer: { color: 'bg-gray-100 text-gray-800', icon: '👁️', label: 'Visualizador' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer;
    
    return (
      <Badge className={config.color}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  const getRoleDescription = (role: string) => {
    const descriptions = {
      admin: 'Acceso completo al sistema, puede gestionar usuarios y configuraciones',
      approver: 'Puede aprobar y rechazar facturas, gestionar cola de aprobaciones',
      uploader: 'Puede cargar facturas y crear facturas manuales',
      viewer: 'Solo puede ver reportes y datos, sin permisos de modificación'
    };
    
    return descriptions[role as keyof typeof descriptions] || descriptions.viewer;
  };

  const handleEditRole = (user: User) => {
    setEditingUser(user.id);
    setTempRole(user.role);
  };

  const handleSaveRole = async (userId: number) => {
    try {
      // Aquí se haría la llamada a la API para actualizar el rol
      // await apiService.updateUserRole(userId, tempRole);
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: tempRole as any } : user
      ));
      
      setEditingUser(null);
      success('Rol Actualizado', 'El rol del usuario se ha actualizado correctamente');
      
      if (onRoleChange) {
        onRoleChange(userId, tempRole);
      }
    } catch (err) {
      error('Error', 'No se pudo actualizar el rol del usuario');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setTempRole('');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gestión de Roles de Usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Cargando usuarios...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Gestión de Roles de Usuario
        </CardTitle>
        <p className="text-sm text-gray-600">
          Administra los roles y permisos de los usuarios del sistema
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Información de roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">👑</span>
                <span className="font-semibold text-red-800">Administrador</span>
              </div>
              <p className="text-xs text-red-600">
                Acceso completo al sistema
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✅</span>
                <span className="font-semibold text-green-800">Aprobador</span>
              </div>
              <p className="text-xs text-green-600">
                Aprobar y rechazar facturas
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📤</span>
                <span className="font-semibold text-blue-800">Cargador</span>
              </div>
              <p className="text-xs text-blue-600">
                Cargar facturas y crear manuales
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">👁️</span>
                <span className="font-semibold text-gray-800">Visualizador</span>
              </div>
              <p className="text-xs text-gray-600">
                Solo lectura de reportes
              </p>
            </div>
          </div>

          {/* Tabla de usuarios */}
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-500">
                <TableHead className="text-white font-semibold">Usuario</TableHead>
                <TableHead className="text-white font-semibold">Email</TableHead>
                <TableHead className="text-white font-semibold">Rol Actual</TableHead>
                <TableHead className="text-white font-semibold">Estado</TableHead>
                <TableHead className="text-white font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {editingUser === user.id ? (
                      <Select value={tempRole} onValueChange={setTempRole}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">👑 Administrador</SelectItem>
                          <SelectItem value="approver">✅ Aprobador</SelectItem>
                          <SelectItem value="uploader">📤 Cargador</SelectItem>
                          <SelectItem value="viewer">👁️ Visualizador</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      getRoleBadge(user.role)
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {user.is_active ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Activo
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactivo
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {editingUser === user.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSaveRole(user.id)}
                            className="bg-green-500 text-white hover:bg-green-600"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRole(user)}
                          className="btn-animated"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Descripción de permisos */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3">Descripción de Permisos:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-red-800 mb-2">👑 Administrador</h5>
                <p className="text-gray-600">{getRoleDescription('admin')}</p>
              </div>
              <div>
                <h5 className="font-medium text-green-800 mb-2">✅ Aprobador</h5>
                <p className="text-gray-600">{getRoleDescription('approver')}</p>
              </div>
              <div>
                <h5 className="font-medium text-blue-800 mb-2">📤 Cargador</h5>
                <p className="text-gray-600">{getRoleDescription('uploader')}</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-2">👁️ Visualizador</h5>
                <p className="text-gray-600">{getRoleDescription('viewer')}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserRoles;
