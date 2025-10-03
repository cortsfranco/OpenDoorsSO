import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

interface User {
  id: number
  email: string
  full_name: string
  role: string
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (token) {
          const userData = await authAPI.getCurrentUser()
          setUser(userData)
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error)
        localStorage.removeItem('access_token')
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password)
      setUser(response.user)
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}