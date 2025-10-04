import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CurrencyInput } from '@/components/CurrencyInput'
import { Save, X } from 'lucide-react'

interface InvoiceFormData {
  tipo_factura: string
  numero_factura: string
  cuit: string
  razon_social: string
  fecha_emision: string
  fecha_vencimiento: string
  subtotal: string
  iva_porcentaje: string
  iva_monto: string
  otros_impuestos: string
  total: string
  invoice_direction: string
  owner: string
  movimiento_cuenta: boolean
  es_compensacion_iva: boolean
  metodo_pago: string
  partner_id?: number
}

interface InvoiceFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: InvoiceFormData) => Promise<void>
  invoice?: any
  mode: 'create' | 'edit'
}

export function InvoiceFormModal({ open, onClose, onSave, invoice, mode }: InvoiceFormModalProps) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    tipo_factura: 'A',
    numero_factura: '',
    cuit: '',
    razon_social: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    subtotal: '0',
    iva_porcentaje: '21.00',
    iva_monto: '0',
    otros_impuestos: '0',
    total: '0',
    invoice_direction: 'recibida',
    owner: 'Franco',
    movimiento_cuenta: true,
    es_compensacion_iva: false,
    metodo_pago: 'transferencia',
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (invoice && mode === 'edit') {
      setFormData({
        tipo_factura: invoice.tipo_factura || 'A',
        numero_factura: invoice.numero_factura || '',
        cuit: invoice.cuit || '',
        razon_social: invoice.razon_social || '',
        fecha_emision: invoice.fecha_emision || new Date().toISOString().split('T')[0],
        fecha_vencimiento: invoice.fecha_vencimiento || '',
        subtotal: invoice.subtotal?.toString() || '0',
        iva_porcentaje: invoice.iva_porcentaje?.toString() || '21.00',
        iva_monto: invoice.iva_monto?.toString() || '0',
        otros_impuestos: invoice.otros_impuestos?.toString() || '0',
        total: invoice.total?.toString() || '0',
        invoice_direction: invoice.invoice_direction || 'recibida',
        owner: invoice.owner || 'Franco',
        movimiento_cuenta: invoice.movimiento_cuenta ?? true,
        es_compensacion_iva: invoice.es_compensacion_iva ?? false,
        metodo_pago: invoice.metodo_pago || 'transferencia',
        partner_id: invoice.partner_id,
      })
    }
  }, [invoice, mode])

  const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      if (field === 'subtotal' || field === 'iva_porcentaje' || field === 'otros_impuestos') {
        const subtotal = parseFloat(field === 'subtotal' ? value : updated.subtotal) || 0
        const ivaPorcentaje = parseFloat(field === 'iva_porcentaje' ? value : updated.iva_porcentaje) || 0
        const otrosImpuestos = parseFloat(field === 'otros_impuestos' ? value : updated.otros_impuestos) || 0
        
        const ivaMonto = (subtotal * ivaPorcentaje) / 100
        const total = subtotal + ivaMonto + otrosImpuestos
        
        updated.iva_monto = ivaMonto.toFixed(2)
        updated.total = total.toFixed(2)
      }
      
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error al guardar factura:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nueva Factura' : 'Editar Factura'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Completa los datos de la nueva factura'
              : 'Modifica los datos de la factura'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_factura">Tipo de Factura *</Label>
              <Select
                value={formData.tipo_factura}
                onValueChange={(value) => handleInputChange('tipo_factura', value)}
              >
                <SelectTrigger id="tipo_factura">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Tipo A (Con IVA discriminado)</SelectItem>
                  <SelectItem value="B">Tipo B (IVA incluido)</SelectItem>
                  <SelectItem value="C">Tipo C (Sin IVA)</SelectItem>
                  <SelectItem value="X">Tipo X (Otros)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_factura">Número de Factura *</Label>
              <Input
                id="numero_factura"
                value={formData.numero_factura}
                onChange={(e) => handleInputChange('numero_factura', e.target.value)}
                placeholder="0001-00001234"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT</Label>
              <Input
                id="cuit"
                value={formData.cuit}
                onChange={(e) => handleInputChange('cuit', e.target.value)}
                placeholder="20-12345678-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="razon_social">Razón Social</Label>
              <Input
                id="razon_social"
                value={formData.razon_social}
                onChange={(e) => handleInputChange('razon_social', e.target.value)}
                placeholder="Nombre de la empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_emision">Fecha de Emisión *</Label>
              <Input
                id="fecha_emision"
                type="date"
                value={formData.fecha_emision}
                onChange={(e) => handleInputChange('fecha_emision', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento</Label>
              <Input
                id="fecha_vencimiento"
                type="date"
                value={formData.fecha_vencimiento}
                onChange={(e) => handleInputChange('fecha_vencimiento', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtotal">Subtotal *</Label>
              <Input
                id="subtotal"
                type="number"
                step="0.01"
                value={formData.subtotal}
                onChange={(e) => handleInputChange('subtotal', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iva_porcentaje">IVA % *</Label>
              <Input
                id="iva_porcentaje"
                type="number"
                step="0.01"
                value={formData.iva_porcentaje}
                onChange={(e) => handleInputChange('iva_porcentaje', e.target.value)}
                placeholder="21.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iva_monto">IVA Monto (calculado)</Label>
              <Input
                id="iva_monto"
                type="number"
                step="0.01"
                value={formData.iva_monto}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otros_impuestos">Otros Impuestos</Label>
              <Input
                id="otros_impuestos"
                type="number"
                step="0.01"
                value={formData.otros_impuestos}
                onChange={(e) => handleInputChange('otros_impuestos', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total">Total (calculado)</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                value={formData.total}
                readOnly
                disabled
                className="bg-muted font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_direction">Dirección *</Label>
              <Select
                value={formData.invoice_direction}
                onValueChange={(value) => handleInputChange('invoice_direction', value)}
              >
                <SelectTrigger id="invoice_direction">
                  <SelectValue placeholder="Selecciona dirección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emitida">Emitida (Venta)</SelectItem>
                  <SelectItem value="recibida">Recibida (Compra)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Socio Responsable *</Label>
              <Select
                value={formData.owner}
                onValueChange={(value) => handleInputChange('owner', value)}
              >
                <SelectTrigger id="owner">
                  <SelectValue placeholder="Selecciona socio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Franco">Franco</SelectItem>
                  <SelectItem value="Joni">Joni</SelectItem>
                  <SelectItem value="Hernán">Hernán</SelectItem>
                  <SelectItem value="Maxi">Maxi</SelectItem>
                  <SelectItem value="Leo">Leo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metodo_pago">Método de Pago</Label>
              <Select
                value={formData.metodo_pago}
                onValueChange={(value) => handleInputChange('metodo_pago', value)}
              >
                <SelectTrigger id="metodo_pago">
                  <SelectValue placeholder="Selecciona método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contado">Contado</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta_credito">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="movimiento_cuenta"
                checked={formData.movimiento_cuenta}
                onCheckedChange={(checked) => handleInputChange('movimiento_cuenta', checked)}
              />
              <Label htmlFor="movimiento_cuenta" className="cursor-pointer">
                Movimiento de Cuenta (afecta flujo de caja real)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="es_compensacion_iva"
                checked={formData.es_compensacion_iva}
                onCheckedChange={(checked) => handleInputChange('es_compensacion_iva', checked)}
              />
              <Label htmlFor="es_compensacion_iva" className="cursor-pointer">
                Es Compensación IVA (solo para recuperar IVA, no es gasto real)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Factura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
