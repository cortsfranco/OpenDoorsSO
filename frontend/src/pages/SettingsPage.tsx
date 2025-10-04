import { Settings } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="container-page">
      <div className="container-section">
        <h1 className="heading-page">Configuración</h1>
        <p className="text-muted mt-2">
          Configura las opciones del sistema
        </p>
      </div>

      <div className="card-enhanced transition-smooth">
        <div className="p-6">
          <div className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 heading-card">
              Configuración en desarrollo
            </h3>
            <p className="text-muted mt-2">
              Las opciones de configuración estarán disponibles próximamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
