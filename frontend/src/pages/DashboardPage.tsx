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

  // Los datos vendrán del backend a través de FinancialOverview
  const stats = []
  const recentInvoices = []

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="px-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.full_name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Aquí tienes un resumen de tu actividad empresarial
        </p>
      </div>

      {/* Componente FinancialOverview */}
      <div className="px-4">
        <FinancialOverview />
      </div>

      {/* Contenido principal */}
      <div className="px-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Facturas recientes */}
        <div className="card-enhanced">
          <div className="px-6 py-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Facturas Recientes
            </h3>
            <div className="space-y-3">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg list-item-hover cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-gray-900">{invoice.number}</p>
                    <p className="text-sm text-gray-500">{invoice.client}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{invoice.amount}</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === 'Pagada'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'Pendiente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
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
        <div className="card-enhanced">
          <div className="px-6 py-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Actividad Reciente
            </h3>
            <div className="space-y-3">
              <div className="flex items-center list-item-hover p-2 rounded-lg cursor-pointer">
                <div className="flex-shrink-0">
                  <FileText className="h-5 w-5 text-gray-400 icon-hover" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900">
                    Nueva factura creada para Cliente D
                  </p>
                  <p className="text-xs text-gray-500">Hace 2 horas</p>
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
