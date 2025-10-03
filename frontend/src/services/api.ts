/**
 * Servicio de API para comunicación con el backend.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin.replace(':5000', ':8000');

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token de autenticación
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar respuestas y errores
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Métodos de autenticación
  async login(email: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await this.api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const { access_token } = response.data;
    
    // Obtener información del usuario después del login
    const userResponse = await this.api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    
    return {
      access_token,
      user: userResponse.data,
    };
  }

  async register(userData: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
  }) {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Métodos de facturas
  async uploadInvoice(file: File, owner: string = 'Hernán Pagani') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('owner', owner);

    const response = await this.api.post('/v1/invoices/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getInvoiceStatus(taskId: string) {
    const response = await this.api.get(`/v1/invoices/upload/status/${taskId}`);
    return response.data;
  }

  async getInvoicesSummary() {
    const response = await this.api.get('/invoices/summary');
    return response.data;
  }

  async getInvoices(page: number = 1, limit: number = 10) {
    const response = await this.api.get('/invoices', {
      params: { page, limit },
    });
    return response.data;
  }

  // Métodos de usuarios
  async getUsers(page: number = 1, limit: number = 10) {
    const response = await this.api.get('/users', {
      params: { page, limit },
    });
    return response.data;
  }

  async createUser(userData: {
    email: string;
    password: string;
    full_name: string;
    role: string;
  }) {
    const response = await this.api.post('/users', userData);
    return response.data;
  }


          async deleteUser(userId: number) {
            const response = await this.api.delete(`/users/${userId}`);
            return response.data;
          }

          // Métodos de facturas con autoguardado
          async updateInvoice(invoiceId: number, updates: Partial<{
            extracted_data: any;
            owner: string;
            status: string;
          }>) {
            const response = await this.api.patch(`/invoices/${invoiceId}`, updates);
            return response.data;
          }

          // Métodos de aprobación
          async getPendingApprovals() {
            // Simular datos de ejemplo mientras se implementa el endpoint
            return []; // Devolver array vacío directamente
          }

          async getInvoiceApprovalDetails(invoiceId: number) {
            const response = await this.api.get(`/approval/${invoiceId}/details`);
            return response.data;
          }

          async approveInvoice(invoiceId: number, data: { reason?: string }) {
            const response = await this.api.post(`/approval/${invoiceId}/approve`, data);
            return response.data;
          }

          async rejectInvoice(invoiceId: number, data: { reason: string }) {
            const response = await this.api.post(`/approval/${invoiceId}/reject`, data);
            return response.data;
          }

          // Métodos de análisis financiero
          async getInvoiceSummary() {
            const response = await this.api.get('/invoices/summary');
            return response.data;
          }

          async analyzeFinancialData(query: string, period?: string) {
            const response = await this.api.post('/analysis/', { query, period });
            return response;
          }

          // Métodos de reportes financieros (nuevos endpoints)
  async getBalanceIVA(owner?: string, fechaDesde?: string, fechaHasta?: string) {
    const params = new URLSearchParams();
    if (owner) params.append('owner', owner);
    if (fechaDesde) params.append('fecha_desde', fechaDesde);
    if (fechaHasta) params.append('fecha_hasta', fechaHasta);
    const response = await this.api.get(`/v1/financial/balance-iva?${params.toString()}`);
    return response.data;
  }

  async getBalanceGeneral(owner?: string, fechaDesde?: string, fechaHasta?: string) {
    const params = new URLSearchParams();
    if (owner) params.append('owner', owner);
    if (fechaDesde) params.append('fecha_desde', fechaDesde);
    if (fechaHasta) params.append('fecha_hasta', fechaHasta);
    const response = await this.api.get(`/v1/financial/balance-general?${params.toString()}`);
    return response.data;
  }

  async getBalancePorSocio(fechaDesde?: string, fechaHasta?: string) {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fecha_desde', fechaDesde);
    if (fechaHasta) params.append('fecha_hasta', fechaHasta);
    const response = await this.api.get(`/v1/financial/balance-por-socio?${params.toString()}`);
    return response.data;
  }

          // Métodos de papelera (soft delete)
          async deleteInvoice(invoiceId: number) {
            const response = await this.api.delete(`/invoices/${invoiceId}`);
            return response.data;
          }

          async restoreInvoice(invoiceId: number) {
            const response = await this.api.post(`/invoices/${invoiceId}/restore`);
            return response.data;
          }

          async getDeletedInvoices() {
            // Simular datos de ejemplo mientras se implementa el endpoint
            return {
              invoices: []
            };
          }

          // Métodos de socios
          async getPartners(search?: string, businessType?: string, isActive?: boolean) {
            // Simular datos de ejemplo mientras se implementa el endpoint
            const examplePartners = [
              {
                id: 1,
                name: "Cliente A",
                cuit: "20-12345678-9",
                email: "cliente@example.com",
                phone: "+54 11 1234-5678",
                address: "Av. Corrientes 1234, CABA",
                business_type: "Cliente",
                is_active: true,
                created_at: "2024-01-15T10:00:00Z"
              },
              {
                id: 2,
                name: "Proveedor B",
                cuit: "30-87654321-0",
                email: "proveedor@example.com",
                phone: "+54 11 8765-4321",
                address: "Av. Santa Fe 5678, CABA",
                business_type: "Proveedor",
                is_active: true,
                created_at: "2024-01-16T14:30:00Z"
              }
            ];
            
            let filteredPartners = examplePartners;
            
            if (search) {
              filteredPartners = filteredPartners.filter(partner =>
                partner.name.toLowerCase().includes(search.toLowerCase()) ||
                partner.cuit.includes(search) ||
                partner.email.toLowerCase().includes(search.toLowerCase())
              );
            }
            
            if (businessType) {
              filteredPartners = filteredPartners.filter(partner =>
                partner.business_type === businessType
              );
            }
            
            if (isActive !== undefined) {
              filteredPartners = filteredPartners.filter(partner =>
                partner.is_active === isActive
              );
            }
            
            return {
              partners: filteredPartners,
              total: filteredPartners.length
            };
          }

          async getPartner(partnerId: number) {
            const response = await this.api.get(`/partners/${partnerId}`);
            return response.data;
          }

          async createPartner(partnerData: any) {
            const response = await this.api.post('/partners', partnerData);
            return response.data;
          }

          async updatePartner(partnerId: number, partnerData: any) {
            const response = await this.api.put(`/partners/${partnerId}`, partnerData);
            return response.data;
          }

          async deletePartner(partnerId: number) {
            const response = await this.api.delete(`/partners/${partnerId}`);
            return response.data;
          }

          // Métodos de facturas manuales
          async createManualInvoice(invoiceData: any) {
            const response = await this.api.post('/invoices/manual', invoiceData);
            return response.data;
          }

  // Método de verificación de duplicados
  async checkDuplicateInvoice(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post('/invoices/check-duplicate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // Métodos de gestión de usuarios
  async getUser(userId: number) {
    const response = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  async updateUser(userId: number, userData: any) {
    const response = await this.api.put(`/users/${userId}`, userData);
    return response.data;
  }

  async uploadProfilePhoto(userId: number, file: File) {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await this.api.post(`/users/${userId}/profile-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async deleteProfilePhoto(userId: number) {
    const response = await this.api.delete(`/users/${userId}/profile-photo`);
    return response.data;
  }

  async getUserStatistics(userId: number) {
    // Simular datos de ejemplo mientras se implementa el endpoint
    return {
      total_invoices: 25,
      total_amount: 2500000,
      pending_invoices: 3,
      approved_invoices: 20,
      rejected_invoices: 2,
      monthly_stats: [
        { month: "Enero", invoices: 5, amount: 500000 },
        { month: "Febrero", invoices: 8, amount: 800000 },
        { month: "Marzo", invoices: 12, amount: 1200000 }
      ]
    };
  }

  // Métodos de configuraciones del sistema
  async getCurrencySettings() {
    const response = await this.api.get('/v1/system/currency');
    return response.data;
  }

  async setCurrencySettings(settings: any) {
    const response = await this.api.put('/v1/system/currency', settings);
    return response.data;
  }

  async getNumberFormatSettings() {
    const response = await this.api.get('/v1/system/number-format');
    return response.data;
  }

  async setNumberFormatSettings(settings: any) {
    const response = await this.api.put('/v1/system/number-format', settings);
    return response.data;
  }

  async getCurrentFiscalYear() {
    const response = await this.api.get('/v1/system/fiscal-year/current');
    return response.data;
  }

  async createFiscalYear(yearData: any) {
    const response = await this.api.post('/v1/system/fiscal-year', yearData);
    return response.data;
  }

  async setCurrentFiscalYear(year: number) {
    const response = await this.api.put(`/v1/system/fiscal-year/${year}/set-current`);
    return response.data;
  }

  async getBackupSettings() {
    const response = await this.api.get('/v1/system/backup/settings');
    return response.data;
  }

  async setBackupSettings(settings: any) {
    const response = await this.api.put('/v1/system/backup/settings', settings);
    return response.data;
  }

  async performBackup() {
    const response = await this.api.post('/v1/system/backup/perform');
    return response.data;
  }

  async getBackupLogs(limit: number = 50) {
    const response = await this.api.get(`/v1/system/backup/logs?limit=${limit}`);
    return response.data;
  }

  async getUISettings() {
    const response = await this.api.get('/v1/system/ui');
    return response.data;
  }

  async setUISettings(settings: any) {
    const response = await this.api.put('/v1/system/ui', settings);
    return response.data;
  }

  async formatNumber(number: number, decimalPlaces?: number) {
    const response = await this.api.post('/v1/system/format/number', {
      number,
      decimal_places: decimalPlaces
    });
    return response.data;
  }

  async formatCurrency(amount: number) {
    const response = await this.api.post('/v1/system/format/currency', { amount });
    return response.data;
  }
}

// Instancia singleton del servicio
const apiService = new ApiService();

export default apiService;
