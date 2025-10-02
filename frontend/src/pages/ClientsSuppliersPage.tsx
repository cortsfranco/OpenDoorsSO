import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  MapPin,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import apiService from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';

interface Partner {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  cuit?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  contact_person?: string;
  business_type: string;
  tax_category?: string;
  payment_terms?: string;
  notes?: string;
  fiscal_data?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Estadísticas calculadas
  total_invoices?: number;
  total_amount?: number;
  last_invoice_date?: string;
}

const ClientsSuppliersPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<Partial<Partner>>({});
  
  const { showSuccess, showError } = useNotifications();

  const businessTypes = [
    { value: 'all', label: 'Todos' },
    { value: 'cliente', label: 'Clientes' },
    { value: 'proveedor', label: 'Proveedores' },
    { value: 'socio', label: 'Socios' }
  ];

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPartners(searchTerm, businessTypeFilter === 'all' ? undefined : businessTypeFilter);
      // Asegurar que siempre sea un array
      setPartners(Array.isArray(response) ? response : response.partners || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      showError('Error al cargar socios/proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPartners();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, businessTypeFilter]);

  const handleCreatePartner = async () => {
    try {
      await apiService.createPartner(formData);
      showSuccess('Socio creado', 'El socio fue creado exitosamente');
      setShowCreateModal(false);
      setFormData({});
      fetchPartners();
    } catch (error: any) {
      showError('Error al crear socio', error.message || 'Error desconocido');
    }
  };

  const handleUpdatePartner = async () => {
    if (!editingPartner) return;
    
    try {
      await apiService.updatePartner(editingPartner.id, formData);
      showSuccess('Socio actualizado', 'Los datos del socio fueron actualizados');
      setEditingPartner(null);
      setFormData({});
      fetchPartners();
    } catch (error: any) {
      showError('Error al actualizar socio', error.message || 'Error desconocido');
    }
  };

  const handleDeletePartner = async (partnerId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este socio?')) return;
    
    try {
      await apiService.deletePartner(partnerId);
      showSuccess('Socio eliminado', 'El socio fue eliminado exitosamente');
      fetchPartners();
    } catch (error: any) {
      showError('Error al eliminar socio', error.message || 'Error desconocido');
    }
  };

  const openEditModal = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData(partner);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingPartner(null);
    setFormData({});
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getBusinessTypeBadge = (type: string) => {
    const config = {
      'cliente': { color: 'bg-blue-500 text-white', text: 'Cliente' },
      'proveedor': { color: 'bg-green-500 text-white', text: 'Proveedor' },
      'socio': { color: 'bg-purple-500 text-white', text: 'Socio' }
    };
    
    const typeConfig = config[type as keyof typeof config] || 
                      { color: 'bg-gray-500 text-white', text: type };
    
    return (
      <Badge className={typeConfig.color}>
        {typeConfig.text}
      </Badge>
    );
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = !searchTerm || 
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.cuit?.includes(searchTerm);
    
    const matchesType = businessTypeFilter === 'all' || partner.business_type === businessTypeFilter;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando socios y proveedores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes y Proveedores</h1>
          <p className="text-gray-600 mt-2">
            Gestión completa de socios, clientes y proveedores
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-white hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Socio
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, email o CUIT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={businessTypeFilter}
                onChange={(e) => setBusinessTypeFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {businessTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-blue-600">
                  {partners.filter(p => p.business_type === 'cliente').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
                <p className="text-2xl font-bold text-green-600">
                  {partners.filter(p => p.business_type === 'proveedor').length}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Socios Activos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {partners.filter(p => p.business_type === 'socio' && p.is_active).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Registros</p>
                <p className="text-2xl font-bold text-gray-600">
                  {partners.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Socios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista de Socios ({filteredPartners.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-primary">
                <TableHead className="text-white font-semibold">Nombre</TableHead>
                <TableHead className="text-white font-semibold">Tipo</TableHead>
                <TableHead className="text-white font-semibold">Contacto</TableHead>
                <TableHead className="text-white font-semibold">CUIT</TableHead>
                <TableHead className="text-white font-semibold">Ubicación</TableHead>
                <TableHead className="text-white font-semibold">Estado</TableHead>
                <TableHead className="text-white font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow key={partner.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{partner.name}</div>
                      {partner.contact_person && (
                        <div className="text-sm text-gray-500">{partner.contact_person}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getBusinessTypeBadge(partner.business_type)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {partner.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {partner.email}
                        </div>
                      )}
                      {partner.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" />
                          {partner.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {partner.cuit || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {partner.city && partner.province 
                          ? `${partner.city}, ${partner.province}`
                          : partner.city || partner.province || '-'
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={partner.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                      {partner.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => openEditModal(partner)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeletePartner(partner.id)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPartners.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No se encontraron socios</p>
              <p className="text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Crear/Editar Socio */}
      <Dialog open={showCreateModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? 'Editar Socio' : 'Nuevo Socio'}
            </DialogTitle>
            <DialogDescription>
              {editingPartner ? 'Modifica los datos del socio' : 'Complete la información del nuevo socio'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre/Razón Social *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="business_type">Tipo de Negocio *</Label>
                <select
                  id="business_type"
                  value={formData.business_type || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_type: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Seleccionar...</option>
                  <option value="cliente">Cliente</option>
                  <option value="proveedor">Proveedor</option>
                  <option value="socio">Socio</option>
                </select>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="cuit">CUIT</Label>
                <Input
                  id="cuit"
                  value={formData.cuit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cuit: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="contact_person">Persona de Contacto</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="province">Provincia</Label>
                <Input
                  id="province"
                  value={formData.province || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="payment_terms">Términos de Pago</Label>
                <select
                  id="payment_terms"
                  value={formData.payment_terms || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Seleccionar...</option>
                  <option value="contado">Contado</option>
                  <option value="30_dias">30 días</option>
                  <option value="60_dias">60 días</option>
                  <option value="90_dias">90 días</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-2 border rounded-md"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button 
              onClick={editingPartner ? handleUpdatePartner : handleCreatePartner}
              className="bg-primary text-white"
              disabled={!formData.name || !formData.business_type}
            >
              {editingPartner ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsSuppliersPage;
