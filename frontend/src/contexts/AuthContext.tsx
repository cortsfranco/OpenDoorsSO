/**
 * Contexto de autenticación para manejar el estado del usuario.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '../services/api';

// Tipos de datos
interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
  }) => Promise<void>;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Props del provider
interface AuthProviderProps {
  children: ReactNode;
}

// Componente provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay token guardado al cargar la aplicación
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      
      // Verificar si el token sigue siendo válido
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Verificar la validez del token
  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await apiService.getCurrentUser();
      setUser(response);
      localStorage.setItem('user', JSON.stringify(response));
    } catch (error) {
      // Token inválido, limpiar datos
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  // Función de login
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiService.login(email, password);
      
      // Guardar token y datos del usuario
      const { access_token, user: userData } = response;
      
      setToken(access_token);
      setUser(userData);
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  // Función de logout
  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  // Función de registro
  const register = async (userData: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
  }): Promise<void> => {
    try {
      await apiService.register(userData);
      // Después del registro exitoso, hacer login automáticamente
      await login(userData.email, userData.password);
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  };

  // Calcular si está autenticado
  const isAuthenticated = !!user && !!token;

  // Valor del contexto
  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};