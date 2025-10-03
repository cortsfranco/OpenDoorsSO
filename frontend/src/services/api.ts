/**
 * Servicio de API para comunicación con el backend.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

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
            const response = await this.api.get('/v1/approval/pending');
            return response.data;
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

  // Métodos de sistema de dos contabilidades
  async getBalanceReal(owner?: string, fiscalYear?: number) {
    const params = new URLSearchParams();
    if (owner) params.append('owner', owner);
    if (fiscalYear) params.append('fiscal_year', fiscalYear.toString());
    const response = await this.api.get(`/v1/dual-accounting/balance-real?${params.toString()}`);
    return response.data;
  }

  async getBalanceFiscal(owner?: string, fiscalYear?: number) {
    const params = new URLSearchParams();
    if (owner) params.append('owner', owner);
    if (fiscalYear) params.append('fiscal_year', fiscalYear.toString());
    const response = await this.api.get(`/v1/dual-accounting/balance-fiscal?${params.toString()}`);
    return response.data;
  }

  async getComprehensiveReport(owner?: string, fiscalYear?: number) {
    const params = new URLSearchParams();
    if (owner) params.append('owner', owner);
    if (fiscalYear) params.append('fiscal_year', fiscalYear.toString());
    const response = await this.api.get(`/v1/dual-accounting/comprehensive-report?${params.toString()}`);
    return response.data;
  }

  async getFiscalYears() {
    const response = await this.api.get('/v1/dual-accounting/fiscal-years');
    return response.data;
  }

  async getBalanceByOwner(fiscalYear?: number) {
    const params = new URLSearchParams();
    if (fiscalYear) params.append('fiscal_year', fiscalYear.toString());
    const response = await this.api.get(`/v1/dual-accounting/balance-by-owner?${params.toString()}`);
    return response.data;
  }

          // Métodos de papelera (soft delete)
          async deleteInvoice(invoiceId: number) {
            const response = await this.api.delete(`/invoices/${invoiceId}`);
            return response.data;
          }

          // Métodos de actualización en lote
          async bulkUpdateInvoices(updates: Array<{id: number, field: string, value: any}>) {
            const response = await this.api.patch('/invoices/bulk-update', { updates });
            return response.data;
          }

          async bulkDeleteInvoices(invoiceIds: number[]) {
            const response = await this.api.delete('/invoices/bulk-delete', { 
              data: { invoice_ids: invoiceIds } 
            });
            return response.data;
          }

          async restoreInvoice(invoiceId: number) {
            const response = await this.api.post(`/invoices/${invoiceId}/restore`);
            return response.data;
          }

          async getDeletedInvoices() {
            const response = await this.api.get('/invoices/deleted');
            return response.data;
          }

          // Métodos de socios
          async getPartners(search?: string, businessType?: string, isActive?: boolean) {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (businessType) params.append('business_type', businessType);
            if (isActive !== undefined) params.append('is_active', isActive.toString());
            
            const response = await this.api.get(`/v1/partners/?${params.toString()}`);
            return response.data;
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
    const response = await this.api.get(`/users/${userId}/statistics`);
    return response.data;
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
