import React, { useState } from 'react'
import { Layout } from '../components/Layout'
import { Save, Database, Shield, Bell, Palette, Globe } from 'lucide-react'

export function Settings() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    general: {
      company_name: 'Open Doors',
      currency: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires',
      language: 'es'
    },
    fiscal: {
      iva_rate: 21,
      tax_id: '30-12345678-9',
      fiscal_year_start: '01-01'
    },
    notifications: {
      email_notifications: true,
      invoice_approval: true,
      monthly_reports: true,
      system_alerts: true
    },
    security: {
      session_timeout: 30,
      require_2fa: false,
      password_policy: 'strong'
    }
  })

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'fiscal', label: 'Fiscal', icon: Database },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'appearance', label: 'Apariencia', icon: Palette }
  ]

  const handleSave = () => {
    // Aquí se guardarían los settings
    console.log('Settings saved:', settings)
  }

  return (
    <Layout 
      title="Configuración del Sistema" 
      subtitle="Administra la configuración general del sistema"
    >
      <div className="page-container">
        <div style={{ display: 'flex', gap: 'var(--spacing-xl)' }}>
          {/* Sidebar */}
          <div style={{
            width: '250px',
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
            height: 'fit-content',
            position: 'sticky',
            top: 'var(--spacing-xl)'
          }}>
            <nav>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <li key={tab.id} style={{ marginBottom: '8px' }}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          padding: 'var(--spacing-md)',
                          background: activeTab === tab.id ? 'var(--color-primary-100)' : 'transparent',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          color: activeTab === tab.id ? 'var(--color-primary-600)' : 'var(--color-gray-600)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.95rem',
                          fontWeight: activeTab === tab.id ? 600 : 400,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Icon size={20} />
                        {tab.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <div className="card">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div>
                  <h3 style={{ marginBottom: 'var(--spacing-xl)' }}>Configuración General</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 'var(--spacing-lg)'
                  }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)',
                        fontWeight: 500
                      }}>
                        Nombre de la Empresa
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={settings.general.company_name}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, company_name: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)',
                        fontWeight: 500
                      }}>
                        Moneda
                      </label>
                      <select 
                        className="input"
                        value={settings.general.currency}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, currency: e.target.value }
                        })}
                      >
                        <option value="ARS">Peso Argentino (ARS)</option>
                        <option value="USD">Dólar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)',
                        fontWeight: 500
                      }}>
                        Zona Horaria
                      </label>
                      <select 
                        className="input"
                        value={settings.general.timezone}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, timezone: e.target.value }
                        })}
                      >
                        <option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
                        <option value="America/Argentina/Cordoba">Córdoba</option>
                        <option value="America/Argentina/Mendoza">Mendoza</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)',
                        fontWeight: 500
                      }}>
                        Idioma
                      </label>
                      <select 
                        className="input"
                        value={settings.general.language}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, language: e.target.value }
                        })}
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Fiscal Settings */}
              {activeTab === 'fiscal' && (
                <div>
                  <h3 style={{ marginBottom: 'var(--spacing-xl)' }}>Configuración Fiscal</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 'var(--spacing-lg)'
                  }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)',
                        fontWeight: 500
                      }}>
                        Alícuota IVA (%)
                      </label>
                      <input
                        type="number"
                        className="input"
                        value={settings.fiscal.iva_rate}
                        onChange={(e) => setSettings({
                          ...settings,
                          fiscal: { ...settings.fiscal, iva_rate: Number(e.target.value) }
                        })}
                      />
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)',
                        fontWeight: 500
                      }}>
                        CUIT/CUIL
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={settings.fiscal.tax_id}
                        onChange={(e) => setSettings({
                          ...settings,
                          fiscal: { ...settings.fiscal, tax_id: e.target.value }
                        })}
                        placeholder="30-12345678-9"
                      />
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)',
                        fontWeight: 500
                      }}>
                        Inicio del Año Fiscal
                      </label>
                      <input
                        type="date"
                        className="input"
                        value={`2024-${settings.fiscal.fiscal_year_start}`}
                        onChange={(e) => setSettings({
                          ...settings,
                          fiscal: { ...settings.fiscal, fiscal_year_start: e.target.value.split('-').slice(1).join('-') }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div>
                  <h3 style={{ marginBottom: 'var(--spacing-xl)' }}>Configuración de Notificaciones</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 'var(--spacing-lg)'
                  }}>
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--spacing-md)',
                        background: 'var(--color-gray-50)',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <div>
                          <p style={{ fontWeight: 500, marginBottom: '4px' }}>
                            {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                            Recibir notificaciones por email
                          </p>
                        </div>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, [key]: e.target.checked }
                            })}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div>
                  <h3 style={{ marginBottom: 'var(--spacing-xl)' }}>Configuración de Seguridad</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 'var(--spacing-lg)'
                  }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)',
                        fontWeight: 500
                      }}>
                        Timeout de Sesión (minutos)
                      </label>
                      <input
                        type="number"
                        className="input"
                        value={settings.security.session_timeout}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, session_timeout: Number(e.target.value) }
                        })}
                      />
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)',
                        fontWeight: 500
                      }}>
                        Política de Contraseñas
                      </label>
                      <select 
                        className="input"
                        value={settings.security.password_policy}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, password_policy: e.target.value }
                        })}
                      >
                        <option value="weak">Débil</option>
                        <option value="medium">Media</option>
                        <option value="strong">Fuerte</option>
                      </select>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--spacing-md)',
                      background: 'var(--color-gray-50)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div>
                        <p style={{ fontWeight: 500, marginBottom: '4px' }}>
                          Autenticación de Dos Factores
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                          Requerir 2FA para todos los usuarios
                        </p>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={settings.security.require_2fa}
                          onChange={(e) => setSettings({
                            ...settings,
                            security: { ...settings.security, require_2fa: e.target.checked }
                          })}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div>
                  <h3 style={{ marginBottom: 'var(--spacing-xl)' }}>Configuración de Apariencia</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 'var(--spacing-lg)'
                  }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)',
                        fontWeight: 500
                      }}>
                        Tema
                      </label>
                      <select className="input">
                        <option value="light">Claro</option>
                        <option value="dark">Oscuro</option>
                        <option value="auto">Automático</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)',
                        fontWeight: 500
                      }}>
                        Color Primario
                      </label>
                      <input
                        type="color"
                        className="input"
                        defaultValue="#667eea"
                        style={{ height: '40px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div style={{
                marginTop: 'var(--spacing-2xl)',
                paddingTop: 'var(--spacing-xl)',
                borderTop: '1px solid var(--color-gray-200)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--spacing-md)'
              }}>
                <button className="btn btn-secondary">
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  <Save size={20} />
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
