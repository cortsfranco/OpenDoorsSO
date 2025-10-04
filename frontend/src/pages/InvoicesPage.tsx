import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Pencil, Trash2 } from 'lucide-react'
import { InvoiceFormModal } from '@/components/InvoiceFormModal'
import { DataTable } from '@/components/DataTable'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'

interface Invoice {
  id: number
  tipo_factura: string
  numero_factura: string
  razon_social: string
  fecha_emision: string
  total: number
  invoice_direction: string
  owner: string
  payment_status: string
}

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const navigate = useNavigate()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await axios.get(`${API_URL}/api/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setInvoices(response.data)
    } catch (error) {
      console.error('Error al cargar facturas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvoice = () => {
    setSelectedInvoice(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEditInvoice = async (invoice: Invoice) => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      const response = await axios.get(`${API_URL}/api/invoices/${invoice.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSelectedInvoice(response.data)
      setModalMode('edit')
      setIsModalOpen(true)
    } catch (error) {
      console.error('Error al cargar factura:', error)
    }
  }

  const handleSaveInvoice = async (data: any) => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      if (modalMode === 'create') {
        await axios.post(`${API_URL}/api/invoices`, {
          ...data,
          filename: `factura_${data.numero_factura}.pdf`,
          status: 'completed'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else if (selectedInvoice) {
        await axios.put(`${API_URL}/api/invoices/${selectedInvoice.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      await fetchInvoices()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error al guardar factura:', error)
      throw error
    }
  }

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!confirm(`¿Estás seguro de eliminar la factura ${invoice.numero_factura}?`)) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      await axios.delete(`${API_URL}/api/invoices/${invoice.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await fetchInvoices()
    } catch (error) {
      console.error('Error al eliminar factura:', error)
    }
  }

  const columns = [
    {
      key: 'tipo_factura',
      label: 'Tipo',
      render: (item: Invoice) => (
        <span className="badge badge-secondary font-mono">{item.tipo_factura}</span>
      )
    },
    {
      key: 'numero_factura',
      label: 'Número',
      render: (item: Invoice) => (
        <span className="font-medium">{item.numero_factura}</span>
      )
    },
    {
      key: 'razon_social',
      label: 'Razón Social'
    },
    {
      key: 'fecha_emision',
      label: 'Fecha'
    },
    {
      key: 'invoice_direction',
      label: 'Tipo',
      render: (item: Invoice) => (
        <span className={item.invoice_direction === 'emitida' ? 'badge-income' : 'badge-expense'}>
          {item.invoice_direction === 'emitida' ? 'Venta' : 'Compra'}
        </span>
      )
    },
    {
      key: 'owner',
      label: 'Socio',
      render: (item: Invoice) => (
        <span className="badge badge-primary">{item.owner}</span>
      )
    },
    {
      key: 'total',
      label: 'Total',
      render: (item: Invoice) => (
        <span className="text-currency font-semibold">
          ${item.total?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'payment_status',
      label: 'Estado',
      render: (item: Invoice) => {
        const statusMap: Record<string, { label: string; class: string }> = {
          pending_approval: { label: 'Pendiente', class: 'badge-warning' },
          approved: { label: 'Aprobado', class: 'badge-success' },
          paid: { label: 'Pagado', class: 'badge-income' },
          rejected: { label: 'Rechazado', class: 'badge-danger' }
        }
        const status = statusMap[item.payment_status] || { label: item.payment_status, class: 'badge-secondary' }
        return <span className={status.class}>{status.label}</span>
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (item: Invoice) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleEditInvoice(item)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteInvoice(item)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="container-page">
        <div className="text-center py-12">
          <p className="text-muted">Cargando facturas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page space-y-6">
      <div className="flex-between container-section">
        <div>
          <h1 className="heading-page">Facturas</h1>
          <p className="text-muted mt-2">
            Gestiona las facturas de tu empresa
          </p>
        </div>
        <Button onClick={handleCreateInvoice}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Factura
        </Button>
      </div>

      {invoices.length === 0 ? (
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
                <Button onClick={handleCreateInvoice}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Factura
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <DataTable
          data={invoices}
          columns={columns}
          emptyMessage="No hay facturas disponibles"
          onRowClick={(invoice) => handleEditInvoice(invoice)}
        />
      )}

      <InvoiceFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveInvoice}
        invoice={selectedInvoice}
        mode={modalMode}
      />
    </div>
  )
}
