import { Button } from '@/components/ui/button'
import { FileText, Plus } from 'lucide-react'

export function InvoicesPage() {
  return (
    <div className="container-page space-y-6">
      <div className="flex-between container-section">
        <div>
          <h1 className="heading-page">Facturas</h1>
          <p className="text-muted mt-2">
            Gestiona las facturas de tu empresa
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Factura
        </Button>
      </div>

      <div className="card-enhanced transition-smooth">
        <div className="p-6">
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 heading-card">
              No hay facturas
            </h3>
            <p className="text-muted mt-2">
              Comienza creando tu primera factura.
            </p>
            <div className="mt-6">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Factura
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
