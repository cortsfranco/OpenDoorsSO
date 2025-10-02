import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Camera, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Building, 
  DollarSign,
  Settings,
  Save,
  Upload,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import apiService from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  profile_photo_url?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  position?: string;
  department?: string;
  hire_date?: string;
  salary?: number;
  preferences?: any;
  created_at: string;
  updated_at: string;
}

interface UserStatistics {
  total_invoices: number;
  active_since: string;
  last_activity: string;
  profile_completion: number;
}

const UserSettingsPage: React.FC = () => {
  const { user: currentUser, updateUser } = useAuth();
  const { success, error } = useNotifications();
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Form data
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    birth_date: '',
    position: '',
    department: '',
    hire_date: '',
    salary: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [userResponse, statsResponse] = await Promise.all([
        apiService.getCurrentUser(),
        apiService.getUserStatistics(currentUser!.id)
      ]);
      
      setUser(userResponse);
      setStatistics(statsResponse);
      
      // Llenar formulario con datos del usuario
      setFormData({
        full_name: userResponse.full_name || '',
        email: userResponse.email || '',
        phone: userResponse.phone || '',
        address: userResponse.address || '',
        birth_date: userResponse.birth_date ? userResponse.birth_date.split('T')[0] : '',
        position: userResponse.position || '',
        department: userResponse.department || '',
        hire_date: userResponse.hire_date ? userResponse.hire_date.split('T')[0] : '',
        salary: userResponse.salary?.toString() || '',
        new_password: '',
        confirm_password: ''
      });
      
    } catch (err: any) {
      error('Error', 'No se pudieron cargar los datos del usuario');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Preparar datos para enviar
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        birth_date: formData.birth_date || null,
        position: formData.position,
        department: formData.department,
        hire_date: formData.hire_date || null,
        salary: formData.salary ? parseInt(formData.salary) : null
      };
      
      // Agregar contraseña solo si se proporcionó
      if (formData.new_password) {
        if (formData.new_password !== formData.confirm_password) {
          error('Error', 'Las contraseñas no coinciden');
          return;
        }
        updateData.password = formData.new_password;
      }
      
      await apiService.updateUser(currentUser!.id, updateData);
      
      // Actualizar usuario en contexto
      updateUser({ ...user!, ...updateData });
      
      success('Éxito', 'Datos actualizados correctamente');
      
      // Limpiar campos de contraseña
      setFormData(prev => ({
        ...prev,
        new_password: '',
        confirm_password: ''
      }));
      
    } catch (err: any) {
      error('Error', 'No se pudieron actualizar los datos');
      console.error('Error updating user:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const response = await apiService.uploadProfilePhoto(currentUser!.id, file);
      setUser(prev => prev ? { ...prev, profile_photo_url: response.photo_url } : null);
      success('Éxito', 'Foto de perfil actualizada correctamente');
    } catch (err: any) {
      error('Error', 'No se pudo subir la foto de perfil');
      console.error('Error uploading photo:', err);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      await apiService.deleteProfilePhoto(currentUser!.id);
      setUser(prev => prev ? { ...prev, profile_photo_url: undefined } : null);
      success('Éxito', 'Foto de perfil eliminada correctamente');
    } catch (err: any) {
      error('Error', 'No se pudo eliminar la foto de perfil');
      console.error('Error deleting photo:', err);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="main-container">
        <div className="flex items-center justify-center h-64">
          <div className="loading-shimmer w-64 h-8 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="main-container">
        <div className="text-center py-12">
          <p className="text-gray-500">No se pudieron cargar los datos del usuario</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración de Usuario</h1>
          <p className="text-gray-600 mt-2">
            Gestiona tu información personal y configuraciones
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-500 text-white">
            <Settings className="w-4 h-4 mr-2" />
            {user.role}
          </Badge>
          {statistics && (
            <Badge variant="outline">
              Perfil {statistics.profile_completion}% completo
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Información del Perfil */}
        <div className="lg:col-span-1">
          <Card className="card-theme-blue">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage src={user.profile_photo_url} alt={user.full_name} />
                  <AvatarFallback className="text-lg">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0">
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors">
                      <Camera className="h-4 w-4" />
                    </div>
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              
              {user.profile_photo_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeletePhoto}
                  className="mt-3 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Foto
                </Button>
              )}
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Facturas:</span>
                  <span className="font-medium">{statistics?.total_invoices || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Miembro desde:</span>
                  <span className="font-medium">{formatDate(user.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulario de Configuración */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="laboral">Laboral</TabsTrigger>
              <TabsTrigger value="security">Seguridad</TabsTrigger>
              <TabsTrigger value="preferences">Preferencias</TabsTrigger>
            </TabsList>

            {/* Información Personal */}
            <TabsContent value="personal">
              <Card className="card-theme-success">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Nombre Completo</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="pl-10"
                          placeholder="tu@email.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="pl-10"
                          placeholder="+54 11 1234-5678"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="birth_date"
                          type="date"
                          value={formData.birth_date}
                          onChange={(e) => handleInputChange('birth_date', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Dirección</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="pl-10"
                        rows={3}
                        placeholder="Tu dirección completa"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Información Laboral */}
            <TabsContent value="laboral">
              <Card className="card-theme-purple">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Información Laboral
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="position">Cargo/Posición</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => handleInputChange('position', e.target.value)}
                        placeholder="Tu cargo en la empresa"
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Departamento</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          className="pl-10"
                          placeholder="Departamento"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="hire_date">Fecha de Contratación</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="hire_date"
                          type="date"
                          value={formData.hire_date}
                          onChange={(e) => handleInputChange('hire_date', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="salary">Salario</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="salary"
                          type="number"
                          value={formData.salary}
                          onChange={(e) => handleInputChange('salary', e.target.value)}
                          className="pl-10"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Seguridad */}
            <TabsContent value="security">
              <Card className="card-theme-warning">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Seguridad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new_password">Nueva Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="new_password"
                          type={showPassword ? "text" : "password"}
                          value={formData.new_password}
                          onChange={(e) => handleInputChange('new_password', e.target.value)}
                          placeholder="Nueva contraseña"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirm_password">Confirmar Contraseña</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={formData.confirm_password}
                        onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                        placeholder="Confirmar nueva contraseña"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Nota:</strong> Deja los campos de contraseña vacíos si no quieres cambiar la contraseña actual.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferencias */}
            <TabsContent value="preferences">
              <Card className="card-theme-info">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Preferencias del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Las preferencias del sistema se configuran desde la sección de administración.</p>
                    <p className="text-sm text-gray-400">Contacta al administrador para cambios en configuraciones globales.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Botón de Guardar */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="btn-animated bg-blue-500 text-white hover:bg-blue-600"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPage;
