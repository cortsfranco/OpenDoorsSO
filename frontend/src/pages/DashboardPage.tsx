import { useAuth } from '@/contexts/AuthContext'
import FinancialOverview from '@/components/FinancialOverview'
import { 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp,
  Calendar,
  AlertCircle
} from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuth()

  // Datos de ejemplo - en una implementación real vendrían del backend
  const stats = [
    {
      name: 'Facturas del Mes',
      value: '24',
      change: '+4.75%',
      changeType: 'positive',
      icon: FileText,
    },
    {
      name: 'Clientes Activos',
      value: '156',
      change: '+12.5%',
      changeType: 'positive',
      icon: Users,
    },
    {
      name: 'Ingresos del Mes',
      value: '$2,450,000',
      change: '+8.2%',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      name: 'Facturas Vencidas',
      value: '3',
      change: '-2',
      changeType: 'negative',
      icon: AlertCircle,
    },
  ]

  const recentInvoices = [
    { id: 1, number: 'INV-001', client: 'Cliente A', amount: '$150,000', status: 'Pagada' },
    { id: 2, number: 'INV-002', client: 'Cliente B', amount: '$75,000', status: 'Pendiente' },
    { id: 3, number: 'INV-003', client: 'Cliente C', amount: '$200,000', status: 'Enviada' },
  ]

  return (
    <div className="container-page">
      {/* Header */}
      <div className="container-section">
        <h1 className="heading-page">
          Bienvenido, {user?.full_name}
        </h1>
        <p className="text-muted mt-2">
          Aquí tienes un resumen de tu actividad empresarial
        </p>
      </div>

      {/* Componente FinancialOverview */}
      <div className="container-section">
        <FinancialOverview />
      </div>

      {/* Contenido principal */}
      <div className="grid-cards-2 container-section">
        {/* Facturas recientes */}
        <div className="card-enhanced transition-smooth">
          <div className="p-6">
            <h3 className="heading-card mb-4">
              Facturas Recientes
            </h3>
            <div className="space-y-3">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex-between p-3 bg-gray-50 rounded-lg list-item-hover cursor-pointer"
                >
                  <div>
                    <p className="font-medium">{invoice.number}</p>
                    <p className="text-muted">{invoice.client}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-currency">{invoice.amount}</p>
                    <span
                      className={`${
                        invoice.status === 'Pagada'
                          ? 'badge-invoice-approved'
                          : invoice.status === 'Pendiente'
                          ? 'badge-invoice-pending'
                          : 'badge-invoice-processing'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="card-enhanced transition-smooth">
          <div className="p-6">
            <h3 className="heading-card mb-4">
              Actividad Reciente
            </h3>
            <div className="space-y-3">
              <div className="flex-start list-item-hover p-2 rounded-lg cursor-pointer">
                <div className="flex-shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground icon-hover" />
                </div>
                <div className="ml-3">
                  <p className="text-sm">
                    Nueva factura creada para Cliente D
                  </p>
                  <p className="text-muted text-xs">Hace 2 horas</p>
                </div>
              </div>
              <div className="flex items-center list-item-hover p-2 rounded-lg cursor-pointer">
                <div className="flex-shrink-0">
                  <Users className="h-5 w-5 text-gray-400 icon-hover" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900">
                    Cliente E agregado al sistema
                  </p>
                  <p className="text-xs text-gray-500">Hace 4 horas</p>
                </div>
              </div>
              <div className="flex items-center list-item-hover p-2 rounded-lg cursor-pointer">
                <div className="flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-gray-400 icon-hover" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900">
                    Pago recibido de Cliente A
                  </p>
                  <p className="text-xs text-gray-500">Ayer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
