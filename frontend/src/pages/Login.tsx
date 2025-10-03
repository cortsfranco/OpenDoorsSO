import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user, login } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      toast.success('¡Login exitoso!')
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.detail || 'Error en el login'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: 'var(--spacing-2xl)',
        boxShadow: 'var(--shadow-xl)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            background: 'var(--color-balance-100)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--spacing-md)'
          }}>
            <LogIn size={32} color="var(--color-balance-600)" />
          </div>
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: 700, 
            color: 'var(--color-gray-900)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Open Doors
          </h1>
          <p style={{ 
            color: 'var(--color-gray-600)',
            fontSize: '1rem'
          }}>
            Sistema de Facturación
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 500,
              color: 'var(--color-gray-700)'
            }}>
              Email
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cortsfranco@hotmail.com"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 500,
              color: 'var(--color-gray-700)'
            }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                style={{ width: '100%', paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-gray-500)'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ 
              width: '100%', 
              padding: 'var(--spacing-md)',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                Iniciando sesión...
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div style={{ 
          marginTop: 'var(--spacing-xl)', 
          padding: 'var(--spacing-md)',
          background: 'var(--color-gray-50)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
          color: 'var(--color-gray-600)'
        }}>
          <strong>Credenciales de prueba:</strong><br />
          Email: cortsfranco@hotmail.com<br />
          Contraseña: Ncc1701E@
        </div>
      </div>
    </div>
  )
}
