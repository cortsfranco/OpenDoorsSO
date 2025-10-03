import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Shield,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useRealTimeEdit } from '@/hooks/useRealTimeEdit';
import { EditableCell } from '@/components/EditableCell';
import { useNotifications } from '@/hooks/useNotifications';
import apiService from '@/services/api';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
  role: 'admin' | 'user';
}

interface UserCreateData {
  email: string;
  password: string;
  full_name: string;
  is_admin: boolean;
}

const UserManagementTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState<UserCreateData>({
    email: '',
    password: '',
    full_name: '',
    is_admin: false
  });
  const [showPassword, setShowPassword] = useState(false);

  const { success, error } = useNotifications();

  // Hook para edición en tiempo real
  const { updateField, deleteItem } = useRealTimeEdit({
    onUpdate: async (id, field, value) => {
      await apiService.updateUser(id, { [field]: value });
      setUsers(prev => prev.map(user => 
        user.id === id 
          ? { ...user, [field]: value }
          : user
      ));
    },
    onDelete: async (id) => {
      await apiService.deleteUser(id);
      setUsers(prev => prev.filter(user => user.id !== id));
      setFilteredUsers(prev => prev.filter(user => user.id !== id));
    }
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiService.getUsers();
      setUsers(response.users || []);
    } catch (err) {
      error('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const filtered = users.filter(user => 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    try {
      const userData = {
        email: newUser.email,
        password: newUser.password,
        full_name: newUser.full_name,
        is_admin: newUser.is_admin
      };
      
      await apiService.createUser(userData);
      success('Éxito', 'Usuario creado correctamente');
      setShowCreateForm(false);
      setNewUser({ email: '', password: '', full_name: '', is_admin: false });
      fetchUsers();
    } catch (err) {
      error('Error', 'No se pudo crear el usuario');
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => new Set([...prev, userId]));
    } else {
      setSelectedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    
    try {
      for (const userId of selectedUsers) {
        await apiService.deleteUser(userId);
      }
      success('Éxito', `${selectedUsers.size} usuarios eliminados correctamente`);
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (err) {
      error('Error', 'No se pudieron eliminar los usuarios');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con búsqueda y acciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestión de Usuarios</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn-animated"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Formulario de creación */}
      {showCreateForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Crear Nuevo Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <Input
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Contraseña"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_admin"
                  checked={newUser.is_admin}
                  onCheckedChange={(checked) => setNewUser({ ...newUser, is_admin: checked as boolean })}
                />
                <label htmlFor="is_admin" className="text-sm font-medium text-gray-700">
                  Administrador
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateUser} className="btn-animated">
                <CheckCircle className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones en lote */}
      {selectedUsers.size > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-700">
                {selectedUsers.size} usuario(s) seleccionado(s)
              </span>
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                size="sm"
                className="btn-animated"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Seleccionados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de usuarios */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Rol</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold">Creado</th>
                  <th className="px-4 py-3 text-left font-semibold">Último Login</th>
                  <th className="px-4 py-3 text-left font-semibold">Detalle</th>
                  <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{user.id}</td>
                    <td className="px-4 py-3">
                      <EditableCell
                        value={user.full_name}
                        onSave={(value) => updateField(user.id, 'full_name', value)}
                        placeholder="Nombre completo"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <EditableCell
                        value={user.email}
                        onSave={(value) => updateField(user.id, 'email', value)}
                        placeholder="Email"
                        type="email"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <EditableCell
                        value={user.is_admin ? 'admin' : 'user'}
                        onSave={(value) => updateField(user.id, 'is_admin', value === 'admin')}
                        type="select"
                        options={[
                          { value: 'user', label: 'Usuario' },
                          { value: 'admin', label: 'Administrador' }
                        ]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <EditableCell
                        value={user.is_active ? 'activo' : 'inactivo'}
                        onSave={(value) => updateField(user.id, 'is_active', value === 'activo')}
                        type="select"
                        options={[
                          { value: 'activo', label: 'Activo' },
                          { value: 'inactivo', label: 'Inactivo' }
                        ]}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.last_login ? formatDate(user.last_login) : 'Nunca'}
                    </td>
                    <td className="px-4 py-3">
                      <EditableCell
                        value=""
                        onSave={(value) => updateField(user.id, 'detail', value)}
                        placeholder="Agregar detalle..."
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteItem(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementTable;
