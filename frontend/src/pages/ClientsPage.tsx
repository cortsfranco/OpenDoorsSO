import { Button } from '@/components/ui/button'
import { Users, Plus } from 'lucide-react'

export function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona tu base de clientes
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay clientes
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza agregando tu primer cliente.
            </p>
            <div className="mt-6">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cliente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
