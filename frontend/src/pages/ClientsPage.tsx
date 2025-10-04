import { Button } from '@/components/ui/button'
import { Users, Plus } from 'lucide-react'

export function ClientsPage() {
  return (
    <div className="container-page space-y-6">
      <div className="flex-between container-section">
        <div>
          <h1 className="heading-page">Clientes</h1>
          <p className="text-muted mt-2">
            Gestiona tu base de clientes
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="card-enhanced transition-smooth">
        <div className="p-6">
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 heading-card">
              No hay clientes
            </h3>
            <p className="text-muted mt-2">
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
