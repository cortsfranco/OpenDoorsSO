import { Settings } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configura las opciones del sistema
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Configuración en desarrollo
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Las opciones de configuración estarán disponibles próximamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
