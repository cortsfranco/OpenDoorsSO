import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface BalanceTypeSelectorProps {
  balanceType: 'real' | 'fiscal';
  onValueChange: (value: 'real' | 'fiscal') => void;
}

export function BalanceTypeSelector({ balanceType, onValueChange }: BalanceTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label htmlFor="balance-type-select" className="text-lg font-semibold">Tipo de Balance:</Label>
        <Select value={balanceType} onValueChange={onValueChange}>
          <SelectTrigger id="balance-type-select" className="w-[250px]">
            <SelectValue placeholder="Seleccionar tipo de balance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="real">
              <div className="flex flex-col items-start">
                <span className="font-medium">📊 Balance Real</span>
                <span className="text-xs text-gray-500">Solo movimientos efectivos</span>
              </div>
            </SelectItem>
            <SelectItem value="fiscal">
              <div className="flex flex-col items-start">
                <span className="font-medium">🏛️ Balance Fiscal</span>
                <span className="text-xs text-gray-500">Para presentar a AFIP</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Alert className="bg-blue-50 border-blue-200 text-blue-800">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">
          {balanceType === 'real' 
            ? 'Balance Real - Rentabilidad Efectiva' 
            : 'Balance Fiscal - Declaración AFIP'}
        </AlertTitle>
        <AlertDescription className="text-blue-700">
          {balanceType === 'real' 
            ? 'Muestra solo facturas con movimiento de cuenta real (trabajos facturados y pagos a subcontratos). Excluye facturas de compensación de IVA.'
            : 'Incluye todas las facturas emitidas y recibidas, incluyendo las utilizadas para recuperar IVA (combustible, materiales, etc).'}
        </AlertDescription>
      </Alert>
    </div>
  );
}