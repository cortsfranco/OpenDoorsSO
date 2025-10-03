import axios from 'axios'

const API_BASE = 'http://localhost:5000/api'

// Configurar axios con token automático
const api = axios.create({
  baseURL: API_BASE
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ========== AUTH ========== 
export const authAPI = {
  login: async (email: string, password: string) => {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)
    
    const response = await api.post('/auth/login', formData)
    localStorage.setItem('access_token', response.data.access_token)
    return response.data
  },
  
  logout: () => {
    localStorage.removeItem('access_token')
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  }
}

// ========== INVOICES ========== 
export const invoicesAPI = {
  list: async (filters?: any) => {
    const response = await api.get('/invoices', { params: filters })
    return response.data
  },
  
  get: async (id: number) => {
    const response = await api.get(`/invoices/${id}`)
    return response.data
  },
  
  create: async (data: any) => {
    const response = await api.post('/invoices', data)
    return response.data
  },
  
  // Auto-save con debounce
  update: async (id: number, data: any) => {
    const response = await api.put(`/invoices/${id}`, data)
    return response.data
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/invoices/${id}`)
    return response.data
  },
  
  restore: async (id: number) => {
    const response = await api.post(`/invoices/${id}/restore`)
    return response.data
  },
  
  approve: async (id: number) => {
    const response = await api.post(`/invoices/${id}/approve`)
    return response.data
  }
}

// ========== FINANCIAL ========== 
export const financialAPI = {
  balanceIVA: async (params?: any) => {
    const response = await api.get('/v1/financial/balance-iva', { params })
    return response.data
  },
  
  balanceGeneral: async (params?: any) => {
    const response = await api.get('/v1/financial/balance-general', { params })
    return response.data
  },
  
  balancePorSocio: async (socio: string) => {
    const response = await api.get('/v1/financial/balance-por-socio', { 
      params: { socio } 
    })
    return response.data
  },
  
  resumenCompleto: async (params?: any) => {
    const response = await api.get('/v1/financial/resumen-completo', { params })
    return response.data
  }
}

// ========== PARTNERS ========== 
export const partnersAPI = {
  list: async () => {
    const response = await api.get('/partners')
    return response.data
  },
  
  get: async (id: number) => {
    const response = await api.get(`/partners/${id}`)
    return response.data
  },
  
  create: async (data: any) => {
    const response = await api.post('/partners', data)
    return response.data
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/partners/${id}`, data)
    return response.data
  }
}

// Export por defecto para compatibilidad
export default {
  authAPI,
  invoicesAPI,
  financialAPI,
  partnersAPI
}