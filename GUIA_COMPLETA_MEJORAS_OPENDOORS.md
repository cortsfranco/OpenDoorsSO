# GUÍA COMPLETA DE MEJORAS - SISTEMA OPEN DOORS
## Análisis Exhaustivo y Plan de Implementación Local

**Fecha**: 03 de Octubre de 2025  
**Desarrollador**: Franco (Superadmin)  
**Sistema**: Open Doors - Gestión de Facturación y Análisis Financiero  
**Entorno**: Desarrollo Local con Docker + PostgreSQL  
**Tecnologías**: Python/FastAPI (Backend) + React/TypeScript (Frontend) + Azure AI

---

## TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Problemas Críticos Identificados](#2-problemas-críticos-identificados)
3. [Arquitectura y Base de Datos](#3-arquitectura-y-base-de-datos)
4. [Correcciones del Backend (Python/FastAPI)](#4-correcciones-del-backend-pythonfastapi)
5. [Correcciones del Frontend (React/TypeScript)](#5-correcciones-del-frontend-reacttypescript)
6. [Integración con Azure AI](#6-integración-con-azure-ai)
7. [Formato de Moneda Argentina](#7-formato-de-moneda-argentina)
8. [Diseño y UX Consistente](#8-diseño-y-ux-consistente)
9. [Sistema de Permisos y Roles](#9-sistema-de-permisos-y-roles)
10. [Gráficas y Analytics](#10-gráficas-y-analytics)
11. [Plan de Implementación por Fases](#11-plan-de-implementación-por-fases)
12. [Checklist de Verificación](#12-checklist-de-verificación)

---

## 1. RESUMEN EJECUTIVO

### Estado Actual del Sistema
Tu sistema Open Doors tiene una base sólida pero presenta varios problemas que impiden su funcionamiento óptimo:

**✅ Puntos Fuertes:**
- Arquitectura bien estructurada (Backend/Frontend separados)
- Integración con Azure AI configurada correctamente
- Base de datos PostgreSQL con Docker
- Sistema de autenticación implementado
- Diseño visual moderno con Tailwind CSS

**❌ Problemas Principales:**
1. **Endpoints incompletos**: Muchos botones llaman a endpoints que no existen o retornan datos simulados
2. **Datos no se guardan**: Falta sincronización entre frontend y backend
3. **Cálculos incorrectos**: Lógica fiscal argentina no implementada completamente
4. **Interfaz inconsistente**: Cada página tiene su propio diseño
5. **Azure AI no se usa completamente**: Credenciales configuradas pero flujo incompleto
6. **Duplicación de código**: Lógica repetida en múltiples archivos
7. **Formato de moneda**: No valida correctamente formato argentino $1.234,56

### Impacto en el Negocio
Según las transcripciones de Joni y Hernán, el sistema debe:
- Gestionar facturas A, B, C con lógica fiscal argentina
- Calcular IVA correctamente (solo facturas tipo A)
- Diferenciar entre "Balance IVA" y "Balance General"
- Filtrar por "Movimiento de Cuenta" (SI/NO)
- Soportar múltiples socios (Franco, Joni, Hernán, Maxi, Leo)
- Procesar facturas con Azure AI para extracción automática

**🚨 CRÍTICO**: Actualmente el sistema NO cumple con estos requisitos por los problemas listados arriba.

---

## 2. PROBLEMAS CRÍTICOS IDENTIFICADOS

### 2.1 Duplicaciones Ineficientes

#### Base de Datos
**Problema**: La tabla `invoices` tiene campos duplicados y confusos.

**Archivo**: `src/models/invoice.py`

**Campos Problemáticos:**
```python
# DUPLICADOS - Mismo propósito, diferente nombre
invoice_direction = Column(String(20))  # 'emitida' o 'recibida'
# vs el campo extracted_data que también tiene esta info

# CONFUSIÓN - No está claro qué representa
owner = Column(String(100))  # ¿Es el socio? ¿El cliente?
```

**Solución**:
```python
# Agregar campos claros y eliminar ambigüedades
tipo_factura = Column(String(1))  # 'A', 'B', 'C'
direccion = Column(String(10))  # 'emitida' o 'recibida'  
socio_responsable = Column(String(100))  # Franco, Joni, Hernán, etc.
cliente_proveedor = Column(String(255))  # Nombre del cliente/proveedor
cuit = Column(String(13))  # XX-XXXXXXXX-X
```

#### Backend - Lógica Duplicada
**Problema**: La lógica de cálculos está repetida en varios archivos.

**Archivos afectados:**
- `src/services/financial_service.py`
- `src/api/routers/financial_reports.py`
- `frontend/src/components/FinancialOverview.tsx`

**Ejemplo de duplicación**:
```python
# En financial_service.py línea 50
total = factura.get('total', 0) + factura.get('iva', 0)

# En financial_reports.py línea 35
total_factura = datos['subtotal'] + datos['iva']

# En FinancialOverview.tsx línea 156
const total = income + expenses
```

**Solución**: Crear una clase centralizada de cálculos:
```python
# Crear: src/core/financial_calculations.py

from decimal import Decimal
from typing import Dict, Any

class FinancialCalculator:
    """Calculadora centralizada para operaciones financieras."""
    
    @staticmethod
    def calcular_total_factura(subtotal: Decimal, iva: Decimal, otros_impuestos: Decimal = Decimal('0')) -> Decimal:
        """Calcula el total de una factura según normativa argentina."""
        return subtotal + iva + otros_impuestos
    
    @staticmethod
    def calcular_iva(subtotal: Decimal, porcentaje_iva: Decimal = Decimal('21')) -> Decimal:
        """Calcula el IVA según porcentaje (21% por defecto)."""
        return subtotal * (porcentaje_iva / Decimal('100'))
    
    @staticmethod
    def validar_coherencia_factura(factura_data: Dict[str, Any]) -> tuple[bool, str]:
        """Valida que los montos de la factura sean coherentes."""
        subtotal = Decimal(str(factura_data.get('subtotal', 0)))
        iva = Decimal(str(factura_data.get('iva', 0)))
        total = Decimal(str(factura_data.get('total', 0)))
        
        total_calculado = subtotal + iva
        diferencia = abs(total - total_calculado)
        
        # Tolerancia del 1% para redondeos
        tolerancia = total * Decimal('0.01')
        
        if diferencia > tolerancia:
            return False, f"Total no coincide. Esperado: {total_calculado}, Encontrado: {total}"
        
        return True, "OK"
```

### 2.2 Endpoints Faltantes o Incompletos

#### Endpoints que NO funcionan actualmente:

**Archivo**: `frontend/src/services/api.ts`

| Método | Endpoint | Estado | Impacto |
|--------|----------|--------|---------|
| `getPendingApprovals()` | `/api/v1/approval` | ❌ Retorna array vacío | Cola de aprobación no funciona |
| `getDeletedInvoices()` | `/api/invoices/trash` | ❌ Retorna datos simulados | Papelera no funciona |
| `getPartners()` | `/api/v1/partners` | ❌ Retorna datos hardcodeados | Clientes/Proveedores no reales |
| `getUserStatistics()` | `/api/users/:id/stats` | ❌ Retorna datos simulados | Estadísticas de usuario falsas |

**Solución**: Implementar cada endpoint en el backend.

**Ejemplo - Cola de Aprobación**:

```python
# src/api/routers/approval.py

@router.get("/pending", response_model=List[PendingApprovalResponse])
async def get_pending_approvals(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session)
):
    """Obtiene facturas pendientes de aprobación."""
    # Verificar que el usuario tenga rol de aprobador
    if current_user.role not in ['admin', 'approver']:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para ver aprobaciones pendientes"
        )
    
    # Consultar facturas pendientes
    query = select(Invoice).where(
        and_(
            Invoice.payment_status == "pending_approval",
            Invoice.is_deleted == False
        )
    ).options(
        selectinload(Invoice.user),
        selectinload(Invoice.partner)
    ).order_by(Invoice.upload_date.desc())
    
    result = await session.execute(query)
    invoices = result.scalars().all()
    
    # Transformar a response model
    pending_approvals = []
    for invoice in invoices:
        approval_data = {
            "invoice_id": invoice.id,
            "invoice_number": invoice.extracted_data.get('numero_factura'),
            "amount": invoice.extracted_data.get('total'),
            "vendor": invoice.extracted_data.get('proveedor'),
            "submitted_by": invoice.user.full_name,
            "submitted_at": invoice.upload_date,
            "status": invoice.payment_status
        }
        pending_approvals.append(approval_data)
    
    return pending_approvals
```

### 2.3 Interfaz Inconsistente

**Problema**: Cada página usa componentes diferentes y estilos distintos.

**Ejemplos**:
- `DashboardPage.tsx`: usa `Card` con clases personalizadas
- `InvoicesPage.tsx`: usa `div` con shadow y rounded
- `FinancialOverview.tsx`: usa `Card` con temas especiales
- `ClientsSuppliersPage.tsx`: usa tabla HTML nativa

**Solución**: Crear componentes reutilizables estandarizados.

```tsx
// Crear: frontend/src/components/shared/DataTable.tsx

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  Edit,
  Trash2
} from 'lucide-react'

interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  searchable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  editable?: boolean
  deletable?: boolean
  searchPlaceholder?: string
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  onEdit,
  onDelete,
  editable = false,
  deletable = false,
  searchPlaceholder = 'Buscar...'
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filtrar datos según búsqueda
  const filteredData = data.filter(item => {
    if (!search) return true
    
    const searchLower = search.toLowerCase()
    return columns.some(col => {
      if (!col.searchable) return false
      const value = item[col.key as keyof T]
      return String(value).toLowerCase().includes(searchLower)
    })
  })

  // Ordenar datos
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortBy) return 0
    
    const aValue = a[sortBy as keyof T]
    const bValue = b[sortBy as keyof T]
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort(column.key)}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
              {(editable || deletable) && (
                <TableHead>Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item) => (
              <TableRow key={item.id}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.render 
                      ? column.render(item)
                      : String(item[column.key as keyof T] || '-')
                    }
                  </TableCell>
                ))}
                {(editable || deletable) && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {editable && onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {deletable && onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} de {sortedData.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### 2.4 Botones que No Funcionan

**Ubicación**: `frontend/src/pages/InvoicesPage.tsx`

**Problema**:
```tsx
// Línea 14-17: Botón sin funcionalidad
<Button>
  <Plus className="h-4 w-4 mr-2" />
  Nueva Factura
</Button>
```

**Solución**:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function InvoicesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const navigate = useNavigate()

  const handleCreateInvoice = () => {
    // Opción 1: Mostrar diálogo de creación manual
    setShowCreateDialog(true)
    
    // Opción 2: Navegar a página de carga
    // navigate('/upload')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las facturas de tu empresa
          </p>
        </div>
        <Button onClick={handleCreateInvoice}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Factura
        </Button>
      </div>

      {/* Diálogo de creación */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Factura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              className="w-full"
              onClick={() => navigate('/upload')}
            >
              Subir desde archivo (PDF, imagen)
            </Button>
            <Button 
              className="w-full"
              variant="outline"
              onClick={() => {
                // Implementar creación manual
                console.log('Crear manualmente')
              }}
            >
              Crear manualmente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

### 2.5 Datos que No se Guardan

**Problema**: El componente `InvoiceHistoryTable.tsx` permite editar facturas pero los cambios no se guardan.

**Archivo**: `frontend/src/components/InvoiceHistoryTable.tsx` (probable ubicación)

**Solución**: Implementar autoguardado con debounce.

```tsx
import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useNotifications } from '@/hooks/useNotifications'
import apiService from '@/services/api'

interface InvoiceEditableFields {
  numero_factura?: string
  total?: number
  iva?: number
  cliente_proveedor?: string
}

export function InvoiceEditCell({ 
  invoiceId, 
  field, 
  initialValue 
}: { 
  invoiceId: number
  field: keyof InvoiceEditableFields
  initialValue: any
}) {
  const [value, setValue] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  const debouncedValue = useDebounce(value, 1000) // Esperar 1 segundo después del último cambio
  const { success, error } = useNotifications()

  useEffect(() => {
    // Solo guardar si el valor cambió respecto al inicial
    if (debouncedValue !== initialValue) {
      saveChanges()
    }
  }, [debouncedValue])

  const saveChanges = async () => {
    try {
      setSaving(true)
      
      await apiService.updateInvoice(invoiceId, {
        extracted_data: {
          [field]: debouncedValue
        }
      })
      
      success('Cambios guardados automáticamente')
    } catch (err) {
      error('Error al guardar cambios')
      console.error('Error guardando:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border rounded px-2 py-1 w-full"
        disabled={saving}
      />
      {saving && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  )
}
```

Crear el hook de debounce si no existe:

```tsx
// frontend/src/hooks/useDebounce.ts

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

---

## 3. ARQUITECTURA Y BASE DE DATOS

### 3.1 Esquema Actual vs Esquema Necesario

**Problema**: La tabla `invoices` no tiene todos los campos que necesita la lógica fiscal argentina.

**Campos Faltantes en la BD:**

```sql
-- Ejecutar en tu PostgreSQL local con Docker

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tipo_factura VARCHAR(1);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS numero_factura VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cuit VARCHAR(13);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS razon_social VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fecha_emision DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15, 2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS iva_porcentaje DECIMAL(5, 2) DEFAULT 21.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS iva_monto DECIMAL(15, 2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total DECIMAL(15, 2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS moneda VARCHAR(3) DEFAULT 'ARS';

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_invoices_tipo_factura ON invoices(tipo_factura);
CREATE INDEX IF NOT EXISTS idx_invoices_fecha_emision ON invoices(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_invoices_movimiento_cuenta ON invoices(movimiento_cuenta);
CREATE INDEX IF NOT EXISTS idx_invoices_socio ON invoices(owner);
CREATE INDEX IF NOT EXISTS idx_invoices_tipo_direccion ON invoices(invoice_direction);

-- Constraint para tipo de factura
ALTER TABLE invoices ADD CONSTRAINT chk_tipo_factura CHECK (tipo_factura IN ('A', 'B', 'C'));
```

**Actualizar el modelo de SQLAlchemy**:

```python
# src/models/invoice.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, Float, Date, DECIMAL, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from decimal import Decimal
from .base import Base

class Invoice(Base):
    """
    Modelo de factura del sistema Open Doors.
    Cumple con normativa fiscal argentina.
    """
    
    __tablename__ = "invoices"
    
    # Identificación
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    
    # Estado de procesamiento
    status = Column(String(50), default="pending", nullable=False)
    # Valores: pending, processing, completed, error, needs_review
    
    # Datos fiscales argentinos
    tipo_factura = Column(String(1), nullable=True, index=True)  # A, B, C
    numero_factura = Column(String(50), nullable=True, index=True)
    cuit = Column(String(13), nullable=True)  # XX-XXXXXXXX-X
    razon_social = Column(String(255), nullable=True)
    
    # Fechas
    fecha_emision = Column(Date, nullable=True, index=True)
    fecha_vencimiento = Column(Date, nullable=True)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Montos (usar DECIMAL para precisión)
    subtotal = Column(DECIMAL(15, 2), nullable=True)
    iva_porcentaje = Column(DECIMAL(5, 2), default=Decimal('21.00'))
    iva_monto = Column(DECIMAL(15, 2), nullable=True)
    otros_impuestos = Column(DECIMAL(15, 2), default=Decimal('0.00'))
    total = Column(DECIMAL(15, 2), nullable=True)
    moneda = Column(String(3), default='ARS')
    
    # Dirección y clasificación
    invoice_direction = Column(String(10), nullable=False, default="recibida", index=True)
    # Valores: emitida, recibida
    
    # Socio responsable (Franco, Joni, Hernán, etc.)
    owner = Column(String(100), nullable=True, index=True)
    
    # Lógica fiscal CRÍTICA
    movimiento_cuenta = Column(Boolean, default=True, nullable=False, index=True)
    # SI = afecta flujo de caja real (Balance General)
    # NO = solo para compensar IVA
    
    es_compensacion_iva = Column(Boolean, default=False, nullable=False)
    # True = solo se usa para compensar IVA, no es movimiento real de dinero
    
    # Partner (cliente/proveedor)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=True, index=True)
    
    # Aprobación
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    payment_status = Column(String(50), default="pending_approval", nullable=False)
    # Valores: pending_approval, approved, paid, rejected
    metodo_pago = Column(String(50), default="transferencia")
    # Valores: contado, transferencia, tarjeta_credito, cheque
    
    # Datos extraídos por Azure AI
    extracted_data = Column(JSON, nullable=True)
    blob_url = Column(String(500), nullable=True)
    
    # Soft delete
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    user = relationship("User", back_populates="invoices", foreign_keys=[user_id])
    partner = relationship("Partner", back_populates="invoices")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("tipo_factura IN ('A', 'B', 'C')", name="chk_tipo_factura"),
        CheckConstraint("invoice_direction IN ('emitida', 'recibida')", name="chk_direccion"),
        CheckConstraint("payment_status IN ('pending_approval', 'approved', 'paid', 'rejected')", name="chk_payment_status"),
    )
    
    def __repr__(self):
        return f"<Invoice(id={self.id}, tipo={self.tipo_factura}, numero='{self.numero_factura}', total={self.total})>"
```

### 3.2 Migración de Datos Existentes

Si ya tienes facturas en la base de datos, necesitas migrar los datos del campo `extracted_data` (JSON) a los nuevos campos estructurados.

```python
# scripts/migrate_invoice_data.py

import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import async_session_maker, init_db
from src.models.invoice import Invoice
from decimal import Decimal
from datetime import datetime

async def migrate_extracted_data_to_columns():
    """Migra datos de extracted_data (JSON) a columnas estructuradas."""
    
    async with async_session_maker() as session:
        # Obtener todas las facturas
        result = await session.execute(select(Invoice))
        invoices = result.scalars().all()
        
        print(f"Migrando {len(invoices)} facturas...")
        
        for invoice in invoices:
            if not invoice.extracted_data:
                continue
            
            data = invoice.extracted_data
            
            # Migrar campos
            if 'tipo_factura' in data:
                invoice.tipo_factura = data['tipo_factura']
            
            if 'numero_factura' in data:
                invoice.numero_factura = str(data['numero_factura'])
            
            if 'cuit_proveedor' in data or 'cuit' in data:
                invoice.cuit = data.get('cuit_proveedor') or data.get('cuit')
            
            if 'proveedor' in data or 'razon_social' in data:
                invoice.razon_social = data.get('razon_social') or data.get('proveedor')
            
            if 'fecha_emision' in data:
                try:
                    if isinstance(data['fecha_emision'], str):
                        invoice.fecha_emision = datetime.fromisoformat(data['fecha_emision']).date()
                    elif isinstance(data['fecha_emision'], datetime):
                        invoice.fecha_emision = data['fecha_emision'].date()
                except:
                    pass
            
            if 'subtotal' in data:
                try:
                    invoice.subtotal = Decimal(str(data['subtotal']))
                except:
                    pass
            
            if 'iva' in data:
                try:
                    invoice.iva_monto = Decimal(str(data['iva']))
                except:
                    pass
            
            if 'total' in data:
                try:
                    invoice.total = Decimal(str(data['total']))
                except:
                    pass
            
            print(f"✓ Factura {invoice.id} migrada")
        
        await session.commit()
        print("✅ Migración completada")

if __name__ == "__main__":
    asyncio.run(migrate_extracted_data_to_columns())
```

**Ejecutar la migración**:
```bash
cd /path/to/tu/proyecto
python scripts/migrate_invoice_data.py
```

---

## 4. CORRECCIONES DEL BACKEND (Python/FastAPI)

### 4.1 Crear Servicio Centralizado de Cálculos Financieros

```python
# src/services/financial_calculator.py

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, List, Optional, Tuple
from datetime import date, datetime

class FinancialCalculator:
    """
    Calculadora centralizada para todas las operaciones financieras.
    Implementa la lógica fiscal argentina.
    """
    
    IVA_STANDARD = Decimal('21.0')  # 21%
    IVA_REDUCIDO = Decimal('10.5')  # 10.5%
    
    @staticmethod
    def normalizar_monto(valor: Any) -> Decimal:
        """Convierte cualquier valor a Decimal, manejando formato argentino."""
        if isinstance(valor, Decimal):
            return valor
        
        if isinstance(valor, (int, float)):
            return Decimal(str(valor))
        
        if isinstance(valor, str):
            # Remover símbolos de moneda
            valor = valor.replace('$', '').replace('ARS', '').strip()
            
            # Detectar formato argentino: 1.234,56
            if '.' in valor and ',' in valor:
                # Verificar cuál es el separador decimal
                punto_pos = valor.rfind('.')
                coma_pos = valor.rfind(',')
                
                if coma_pos > punto_pos:
                    # Formato argentino: 1.234,56
                    valor = valor.replace('.', '').replace(',', '.')
                else:
                    # Formato inglés: 1,234.56
                    valor = valor.replace(',', '')
            elif ',' in valor:
                # Solo coma, asumir formato argentino
                valor = valor.replace(',', '.')
            
            try:
                return Decimal(valor)
            except:
                return Decimal('0')
        
        return Decimal('0')
    
    @staticmethod
    def calcular_iva(subtotal: Decimal, porcentaje: Decimal = IVA_STANDARD) -> Decimal:
        """
        Calcula el IVA según el porcentaje especificado.
        
        Args:
            subtotal: Monto sin IVA
            porcentaje: Porcentaje de IVA (21% por defecto)
        
        Returns:
            Monto de IVA calculado
        """
        iva = subtotal * (porcentaje / Decimal('100'))
        return iva.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    @staticmethod
    def calcular_total(subtotal: Decimal, iva: Decimal, otros_impuestos: Decimal = Decimal('0')) -> Decimal:
        """
        Calcula el total de una factura.
        
        Args:
            subtotal: Monto sin impuestos
            iva: Monto de IVA
            otros_impuestos: Otros impuestos aplicables
        
        Returns:
            Total de la factura
        """
        total = subtotal + iva + otros_impuestos
        return total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    @staticmethod
    def validar_coherencia(
        subtotal: Decimal,
        iva: Decimal,
        total: Decimal,
        tolerancia_porcentaje: Decimal = Decimal('1.0')
    ) -> Tuple[bool, str]:
        """
        Valida que los montos de una factura sean coherentes.
        
        Args:
            subtotal: Monto sin IVA
            iva: Monto de IVA declarado
            total: Total declarado
            tolerancia_porcentaje: Tolerancia permitida en porcentaje (1% por defecto)
        
        Returns:
            Tupla (es_valido, mensaje)
        """
        total_calculado = subtotal + iva
        diferencia = abs(total - total_calculado)
        tolerancia = total * (tolerancia_porcentaje / Decimal('100'))
        
        if diferencia > tolerancia:
            return False, f"Total inconsistente. Calculado: ${total_calculado}, Declarado: ${total}, Diferencia: ${diferencia}"
        
        # Validar que el IVA sea coherente con el subtotal
        iva_calculado_21 = FinancialCalculator.calcular_iva(subtotal, Decimal('21.0'))
        iva_calculado_10_5 = FinancialCalculator.calcular_iva(subtotal, Decimal('10.5'))
        
        diferencia_21 = abs(iva - iva_calculado_21)
        diferencia_10_5 = abs(iva - iva_calculado_10_5)
        
        tolerancia_iva = iva * (tolerancia_porcentaje / Decimal('100'))
        
        if diferencia_21 > tolerancia_iva and diferencia_10_5 > tolerancia_iva:
            return False, f"IVA inconsistente. Declarado: ${iva}, Esperado 21%: ${iva_calculado_21}, Esperado 10.5%: ${iva_calculado_10_5}"
        
        return True, "OK"
    
    @staticmethod
    def calcular_balance_iva(facturas_tipo_a: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calcula el balance de IVA según normativa argentina.
        Solo considera facturas tipo A.
        
        Args:
            facturas_tipo_a: Lista de facturas tipo A
        
        Returns:
            Diccionario con balance de IVA
        """
        iva_ventas = Decimal('0')  # IVA de facturas emitidas (débito fiscal)
        iva_compras = Decimal('0')  # IVA de facturas recibidas (crédito fiscal)
        
        for factura in facturas_tipo_a:
            iva_monto = FinancialCalculator.normalizar_monto(factura.get('iva_monto', 0))
            direccion = factura.get('invoice_direction', 'recibida')
            
            if direccion == 'emitida':
                iva_ventas += iva_monto
            elif direccion == 'recibida':
                iva_compras += iva_monto
        
        balance_iva = iva_ventas - iva_compras
        
        return {
            'iva_debito_fiscal': float(iva_ventas),  # IVA a pagar
            'iva_credito_fiscal': float(iva_compras),  # IVA a favor
            'balance_iva': float(balance_iva),  # Positivo = a pagar, Negativo = a favor
            'estado': 'a_pagar' if balance_iva > 0 else 'a_favor' if balance_iva < 0 else 'neutro'
        }
    
    @staticmethod
    def calcular_balance_general(facturas_con_movimiento: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calcula el balance general (ingreso - egreso).
        Solo considera facturas con movimiento_cuenta = True.
        
        Args:
            facturas_con_movimiento: Lista de facturas que afectan flujo de caja
        
        Returns:
            Diccionario con balance general
        """
        ingresos = Decimal('0')
        egresos = Decimal('0')
        
        for factura in facturas_con_movimiento:
            total = FinancialCalculator.normalizar_monto(factura.get('total', 0))
            direccion = factura.get('invoice_direction', 'recibida')
            
            if direccion == 'emitida':
                ingresos += total
            elif direccion == 'recibida':
                egresos += total
        
        balance = ingresos - egresos
        
        return {
            'ingresos_totales': float(ingresos),
            'egresos_totales': float(egresos),
            'balance_general': float(balance),
            'estado': 'positivo' if balance > 0 else 'negativo' if balance < 0 else 'neutro'
        }
    
    @staticmethod
    def formatear_moneda_argentina(monto: Decimal) -> str:
        """
        Formatea un monto en formato argentino: $1.234,56
        
        Args:
            monto: Monto a formatear
        
        Returns:
            String formateado
        """
        # Separar parte entera y decimal
        partes = str(abs(monto)).split('.')
        parte_entera = partes[0]
        parte_decimal = partes[1] if len(partes) > 1 else '00'
        
        # Asegurar 2 decimales
        parte_decimal = parte_decimal.ljust(2, '0')[:2]
        
        # Agregar separadores de miles
        parte_entera_formateada = ''
        for i, digito in enumerate(reversed(parte_entera)):
            if i > 0 and i % 3 == 0:
                parte_entera_formateada = '.' + parte_entera_formateada
            parte_entera_formateada = digito + parte_entera_formateada
        
        # Construir resultado
        signo = '-' if monto < 0 else ''
        return f"{signo}${parte_entera_formateada},{parte_decimal}"
```

### 4.2 Actualizar Endpoints de Reportes Financieros

```python
# src/api/routers/financial_reports.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import Optional
from datetime import date

from src.core.database import get_session
from src.core.security import get_current_user
from src.models.user import User
from src.models.invoice import Invoice
from src.services.financial_calculator import FinancialCalculator

router = APIRouter()

@router.get("/balance-iva")
async def get_balance_iva(
    owner: Optional[str] = Query(None, description="Filtrar por socio"),
    fecha_desde: Optional[date] = Query(None, description="Fecha inicio"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha fin"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Calcula el balance de IVA (solo facturas tipo A).
    Según normativa argentina: IVA ventas - IVA compras.
    """
    try:
        # Construir query base: facturas tipo A, no eliminadas
        query = select(Invoice).where(
            and_(
                Invoice.tipo_factura == 'A',
                Invoice.is_deleted == False
            )
        )
        
        # Filtros opcionales
        if owner:
            query = query.where(Invoice.owner == owner)
        
        if fecha_desde:
            query = query.where(Invoice.fecha_emision >= fecha_desde)
        
        if fecha_hasta:
            query = query.where(Invoice.fecha_emision <= fecha_hasta)
        
        # Ejecutar query
        result = await session.execute(query)
        facturas = result.scalars().all()
        
        # Convertir a diccionarios para el calculador
        facturas_data = []
        for f in facturas:
            facturas_data.append({
                'iva_monto': f.iva_monto,
                'invoice_direction': f.invoice_direction
            })
        
        # Calcular balance usando el servicio centralizado
        balance = FinancialCalculator.calcular_balance_iva(facturas_data)
        
        return {
            **balance,
            'total_facturas_analizadas': len(facturas),
            'filtros_aplicados': {
                'owner': owner,
                'fecha_desde': fecha_desde,
                'fecha_hasta': fecha_hasta
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular balance IVA: {str(e)}")


@router.get("/balance-general")
async def get_balance_general(
    owner: Optional[str] = Query(None, description="Filtrar por socio"),
    fecha_desde: Optional[date] = Query(None, description="Fecha inicio"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha fin"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Calcula el balance general (ingresos - egresos).
    Solo considera facturas con movimiento_cuenta = True.
    """
    try:
        # Construir query: facturas con movimiento de cuenta, no eliminadas
        query = select(Invoice).where(
            and_(
                Invoice.movimiento_cuenta == True,
                Invoice.is_deleted == False
            )
        )
        
        # Filtros opcionales
        if owner:
            query = query.where(Invoice.owner == owner)
        
        if fecha_desde:
            query = query.where(Invoice.fecha_emision >= fecha_desde)
        
        if fecha_hasta:
            query = query.where(Invoice.fecha_emision <= fecha_hasta)
        
        # Ejecutar query
        result = await session.execute(query)
        facturas = result.scalars().all()
        
        # Convertir a diccionarios
        facturas_data = []
        for f in facturas:
            facturas_data.append({
                'total': f.total,
                'invoice_direction': f.invoice_direction
            })
        
        # Calcular balance
        balance = FinancialCalculator.calcular_balance_general(facturas_data)
        
        return {
            **balance,
            'total_facturas_analizadas': len(facturas),
            'filtros_aplicados': {
                'owner': owner,
                'fecha_desde': fecha_desde,
                'fecha_hasta': fecha_hasta
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular balance general: {str(e)}")


@router.get("/balance-por-socio")
async def get_balance_por_socio(
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Obtiene el balance de IVA y general para cada socio.
    """
    try:
        # Obtener lista de socios únicos
        socios_query = select(Invoice.owner).where(
            Invoice.owner.isnot(None)
        ).distinct()
        
        result = await session.execute(socios_query)
        socios = [row[0] for row in result.all()]
        
        # Calcular balance para cada socio
        balances = []
        
        for socio in socios:
            # Balance IVA
            iva_query = select(Invoice).where(
                and_(
                    Invoice.owner == socio,
                    Invoice.tipo_factura == 'A',
                    Invoice.is_deleted == False
                )
            )
            
            if fecha_desde:
                iva_query = iva_query.where(Invoice.fecha_emision >= fecha_desde)
            if fecha_hasta:
                iva_query = iva_query.where(Invoice.fecha_emision <= fecha_hasta)
            
            iva_result = await session.execute(iva_query)
            facturas_iva = iva_result.scalars().all()
            
            facturas_iva_data = [
                {'iva_monto': f.iva_monto, 'invoice_direction': f.invoice_direction}
                for f in facturas_iva
            ]
            
            balance_iva = FinancialCalculator.calcular_balance_iva(facturas_iva_data)
            
            # Balance General
            general_query = select(Invoice).where(
                and_(
                    Invoice.owner == socio,
                    Invoice.movimiento_cuenta == True,
                    Invoice.is_deleted == False
                )
            )
            
            if fecha_desde:
                general_query = general_query.where(Invoice.fecha_emision >= fecha_desde)
            if fecha_hasta:
                general_query = general_query.where(Invoice.fecha_emision <= fecha_hasta)
            
            general_result = await session.execute(general_query)
            facturas_general = general_result.scalars().all()
            
            facturas_general_data = [
                {'total': f.total, 'invoice_direction': f.invoice_direction}
                for f in facturas_general
            ]
            
            balance_general = FinancialCalculator.calcular_balance_general(facturas_general_data)
            
            balances.append({
                'socio': socio,
                'balance_iva': balance_iva['balance_iva'],
                'balance_general': balance_general['balance_general'],
                'ingresos': balance_general['ingresos_totales'],
                'egresos': balance_general['egresos_totales']
            })
        
        return {
            'balances_por_socio': balances,
            'periodo': {
                'desde': fecha_desde,
                'hasta': fecha_hasta
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular balances por socio: {str(e)}")
```

---

## 5. CORRECCIONES DEL FRONTEND (React/TypeScript)

### 5.1 Actualizar Servicio de API

```typescript
// frontend/src/services/api.ts

// Agregar métodos faltantes para balance por socio

async getBalancePorSocio(fechaDesde?: string, fechaHasta?: string) {
  const params = new URLSearchParams();
  if (fechaDesde) params.append('fecha_desde', fechaDesde);
  if (fechaHasta) params.append('fecha_hasta', fechaHasta);
  const response = await this.api.get(`/v1/financial/balance-por-socio?${params.toString()}`);
  return response.data;
}

// Método para formatear moneda al estilo argentino
formatCurrencyArgentine(amount: number): string {
  const parts = Math.abs(amount).toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1];
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${integerPart},${decimalPart}`;
}

// Método para parsear moneda argentina a número
parseCurrencyArgentine(value: string): number {
  // Remover símbolos y espacios
  let cleaned = value.replace(/[$\s]/g, '');
  
  // Detectar formato
  const hasDot = cleaned.includes('.');
  const hasComma = cleaned.includes(',');
  
  if (hasDot && hasComma) {
    // Verificar posición para determinar formato
    const dotPos = cleaned.lastIndexOf('.');
    const commaPos = cleaned.lastIndexOf(',');
    
    if (commaPos > dotPos) {
      // Formato argentino: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato inglés: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Solo coma, asumir argentino
    cleaned = cleaned.replace(',', '.');
  }
  
  return parseFloat(cleaned) || 0;
}
```

### 5.2 Crear Hook de Formato de Moneda

```typescript
// frontend/src/hooks/useCurrencyFormat.ts

import { useState, useCallback } from 'react';

interface CurrencyOptions {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function useCurrencyFormat(options: CurrencyOptions = {}) {
  const {
    locale = 'es-AR',
    currency = 'ARS',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  const formatCurrency = useCallback((value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) return '$0,00';
    
    // Formato argentino manual
    const parts = Math.abs(numValue).toFixed(maximumFractionDigits).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1] || '00';
    const sign = numValue < 0 ? '-' : '';
    
    return `${sign}$${integerPart},${decimalPart}`;
  }, [maximumFractionDigits]);

  const parseCurrency = useCallback((value: string): number => {
    // Remover símbolos
    let cleaned = value.replace(/[$\s]/g, '');
    
    // Detectar y convertir formato
    const hasDot = cleaned.includes('.');
    const hasComma = cleaned.includes(',');
    
    if (hasDot && hasComma) {
      const dotPos = cleaned.lastIndexOf('.');
      const commaPos = cleaned.lastIndexOf(',');
      
      if (commaPos > dotPos) {
        // Formato argentino: 1.234,56 -> 1234.56
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // Formato inglés: 1,234.56 -> 1234.56
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (hasComma) {
      // Solo coma, asumir argentino
      cleaned = cleaned.replace(',', '.');
    }
    
    const result = parseFloat(cleaned);
    return isNaN(result) ? 0 : result;
  }, []);

  const validateCurrency = useCallback((value: string): boolean => {
    // Regex para formato argentino: permite $1.234,56 o 1234,56
    const argentinePattern = /^-?\$?\s?(\d{1,3}(\.\d{3})*|\d+)(,\d{1,2})?$/;
    // Regex para formato inglés: permite $1,234.56 o 1234.56
    const englishPattern = /^-?\$?\s?(\d{1,3}(,\d{3})*|\d+)(\.\d{1,2})?$/;
    
    return argentinePattern.test(value) || englishPattern.test(value);
  }, []);

  return {
    formatCurrency,
    parseCurrency,
    validateCurrency
  };
}
```

### 5.3 Componente de Input de Moneda

```typescript
// frontend/src/components/ui/currency-input.tsx

import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value?: number;
  onChange?: (value: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoCorrect?: boolean; // Activar auto-corrección de formato
}

export function CurrencyInput({
  value = 0,
  onChange,
  onBlur,
  placeholder = '$0,00',
  className,
  disabled = false,
  autoCorrect = true
}: CurrencyInputProps) {
  const { formatCurrency, parseCurrency, validateCurrency } = useCurrencyFormat();
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);

  // Sincronizar valor externo con display
  useEffect(() => {
    setDisplayValue(formatCurrency(value));
  }, [value, formatCurrency]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValue(input);
    
    // Validar en tiempo real
    const valid = validateCurrency(input) || input === '' || input === '-';
    setIsValid(valid);
    
    if (valid) {
      const numValue = parseCurrency(input);
      onChange?.(numValue);
    }
  };

  const handleBlur = () => {
    if (autoCorrect) {
      // Auto-corregir formato al perder foco
      const numValue = parseCurrency(displayValue);
      setDisplayValue(formatCurrency(numValue));
      setIsValid(true);
      onChange?.(numValue);
    }
    onBlur?.();
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          className,
          !isValid && 'border-red-500 focus:border-red-500'
        )}
      />
      {!isValid && (
        <div className="absolute -bottom-5 left-0 text-xs text-red-500">
          Formato inválido. Use: $1.234,56
        </div>
      )}
    </div>
  );
}
```

### 5.4 Actualizar FinancialOverview con Datos Reales

```typescript
// frontend/src/components/FinancialOverview.tsx

// REEMPLAZAR el método fetchFinancialSummary completo:

const fetchFinancialSummary = async () => {
  try {
    setLoading(true);
    
    const fechaDesde = dateRange?.from?.toISOString().split('T')[0];
    const fechaHasta = dateRange?.to?.toISOString().split('T')[0];
    
    // Llamar a los endpoints REALES (ya implementados en backend)
    const [ivaBalance, generalBalance, balancePorSocio] = await Promise.all([
      apiService.getBalanceIVA(selectedOwner, fechaDesde, fechaHasta),
      apiService.getBalanceGeneral(selectedOwner, fechaDesde, fechaHasta),
      apiService.getBalancePorSocio(fechaDesde, fechaHasta)
    ]);
    
    // Construir datos mensuales (temporal hasta tener endpoint específico)
    const monthlyData = generateMonthlyDataFromReal({
      total_income: generalBalance.ingresos_totales,
      total_expenses: generalBalance.egresos_totales
    });
    
    setSummary({
      total_income: generalBalance.ingresos_totales,
      total_expenses: generalBalance.egresos_totales,
      iva_balance: ivaBalance.balance_iva,
      general_balance: generalBalance.balance_general,
      monthly_data: monthlyData,
      balances_por_socio: balancePorSocio.balances_por_socio
    });
    
  } catch (err: any) {
    console.error('Error fetching financial summary:', err);
    showError('Error al cargar el resumen financiero');
    // NO usar datos de fallback - mostrar error al usuario
  } finally {
    setLoading(false);
  }
};

// REEMPLAZAR el método formatCurrency para usar formato argentino:

const formatCurrency = (amount: number) => {
  const { formatCurrency: formatArg } = useCurrencyFormat();
  return formatArg(amount);
};
```

---

## 6. INTEGRACIÓN CON AZURE AI

### 6.1 Verificar Credenciales

**Problema**: Mencionas que ves "un círculo con una diagonal" al lado del archivo `.env`, lo que indica que el archivo no está siendo reconocido correctamente.

**Solución**:

1. Verificar que el archivo se llama exactamente `.env` (con el punto al inicio)
2. Verificar que está en la raíz del proyecto
3. Verificar que docker-compose.yml lo está cargando correctamente

```yaml
# docker-compose.yml - Sección backend

backend:
  env_file:
    - .env  # Cargar archivo .env
  environment:
    # Estas variables sobreescriben las del .env si es necesario
    POSTGRES_SERVER: db
    POSTGRES_PORT: 5432
```

**Crear script de validación**:

```python
# scripts/verify_azure_credentials.py

import os
from dotenv import load_dotenv

load_dotenv()

def verificar_credenciales():
    """Verifica que todas las credenciales de Azure estén configuradas."""
    
    credenciales = {
        'AZURE_STORAGE_ACCOUNT_NAME': os.getenv('AZURE_STORAGE_ACCOUNT_NAME'),
        'AZURE_STORAGE_ACCOUNT_KEY': os.getenv('AZURE_STORAGE_ACCOUNT_KEY'),
        'AZURE_STORAGE_CONTAINER_NAME': os.getenv('AZURE_STORAGE_CONTAINER_NAME'),
        'AZURE_OPENAI_ENDPOINT': os.getenv('AZURE_OPENAI_ENDPOINT'),
        'AZURE_OPENAI_API_KEY': os.getenv('AZURE_OPENAI_API_KEY'),
        'AZURE_OPENAI_DEPLOYMENT_NAME': os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME'),
        'AZURE_DOC_INTELLIGENCE_ENDPOINT': os.getenv('AZURE_DOC_INTELLIGENCE_ENDPOINT'),
        'AZURE_DOC_INTELLIGENCE_KEY': os.getenv('AZURE_DOC_INTELLIGENCE_KEY'),
        'AZURE_SEARCH_ENDPOINT': os.getenv('AZURE_SEARCH_ENDPOINT'),
        'AZURE_SEARCH_ADMIN_KEY': os.getenv('AZURE_SEARCH_ADMIN_KEY'),
        'AZURE_SEARCH_INDEX_NAME': os.getenv('AZURE_SEARCH_INDEX_NAME'),
    }
    
    print("=== VERIFICACIÓN DE CREDENCIALES AZURE ===\n")
    
    todas_ok = True
    for nombre, valor in credenciales.items():
        if not valor or valor == "":
            print(f"❌ {nombre}: NO CONFIGURADA")
            todas_ok = False
        else:
            # Mostrar solo los primeros y últimos caracteres por seguridad
            valor_ofuscado = valor[:8] + "..." + valor[-4:] if len(valor) > 12 else "***"
            print(f"✅ {nombre}: {valor_ofuscado}")
    
    print("\n" + "="*50)
    
    if todas_ok:
        print("✅ TODAS LAS CREDENCIALES ESTÁN CONFIGURADAS")
        return True
    else:
        print("❌ FALTAN CREDENCIALES - REVISAR ARCHIVO .env")
        return False

if __name__ == "__main__":
    verificar_credenciales()
```

**Ejecutar**:
```bash
python scripts/verify_azure_credentials.py
```

### 6.2 Mejorar el Procesamiento con Azure AI

El archivo `src/agents/enhanced_invoice_processing_agent.py` ya tiene una buena implementación, pero falta manejo de errores y reintentos.

```python
# src/agents/enhanced_invoice_processing_agent.py

# AGREGAR al inicio del archivo:

from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from azure.core.exceptions import ServiceRequestError, HttpResponseError

# MODIFICAR el método extract_with_doc_intelligence:

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type((ServiceRequestError, HttpResponseError)),
    reraise=True
)
async def extract_with_doc_intelligence(self, blob_url: str) -> Dict[str, Any]:
    """
    Extrae datos usando Azure Document Intelligence con reintentos automáticos.
    """
    try:
        logger.info(f"Extrayendo datos con Azure Document Intelligence: {blob_url}")
        
        if not self.doc_client:
            raise ValueError("Azure Document Intelligence no está configurado. Verificar credenciales en .env")
        
        # Determinar si es un archivo local o un blob de Azure
        if blob_url.startswith('file://'):
            # Archivo local
            file_path = blob_url.replace('file://', '')
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Archivo no encontrado: {file_path}")
            
            with open(file_path, 'rb') as f:
                blob_data = f.read()
        else:
            # Blob de Azure Storage
            if not self.blob_client:
                raise ValueError("Azure Blob Storage no está configurado")
            
            blob_name = blob_url.split('/')[-1]
            blob_client = self.blob_client.get_blob_client(
                container=settings.AZURE_STORAGE_CONTAINER_NAME,
                blob=blob_name
            )
            
            # Verificar que el blob existe
            if not blob_client.exists():
                raise FileNotFoundError(f"Blob no encontrado: {blob_name}")
            
            blob_data = blob_client.download_blob().readall()
        
        logger.info(f"Archivo cargado, tamaño: {len(blob_data)} bytes")
        
        # Analizar documento con Azure Document Intelligence
        poller = self.doc_client.begin_analyze_document(
            "prebuilt-invoice",
            document=blob_data
        )
        result = poller.result()
        
        logger.info("Análisis completado con Azure Document Intelligence")
        
        # Extraer datos relevantes
        extracted_data = {}
        
        # Mapeo de campos
        field_mapping = {
            'VendorName': 'proveedor',
            'CustomerName': 'cliente',
            'InvoiceId': 'numero_factura',
            'InvoiceDate': 'fecha_emision',
            'DueDate': 'fecha_vencimiento',
            'InvoiceTotal': 'total',
            'SubTotal': 'subtotal',
            'TotalTax': 'iva',
            'Items': 'items'
        }
        
        for document in result.documents:
            for name, field in document.fields.items():
                if name in field_mapping:
                    mapped_name = field_mapping[name]
                    
                    # Convertir valores según tipo
                    if field.value_type == 'currency' or field.value_type == 'number':
                        extracted_data[mapped_name] = float(field.value.amount) if hasattr(field.value, 'amount') else float(field.value)
                    elif field.value_type == 'date':
                        extracted_data[mapped_name] = field.value.isoformat() if field.value else None
                    else:
                        extracted_data[mapped_name] = field.value
                else:
                    extracted_data[name.lower()] = field.value
        
        # Extraer información fiscal específica
        extracted_data = await self._extract_fiscal_info(extracted_data, result)
        
        logger.info(f"Datos extraídos: {len(extracted_data)} campos")
        
        return extracted_data
        
    except FileNotFoundError as e:
        logger.error(f"Archivo no encontrado: {str(e)}")
        raise
    except ValueError as e:
        logger.error(f"Error de configuración: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error en extracción con Document Intelligence: {str(e)}")
        raise
```

**Instalar dependencia**:
```bash
# Agregar a requirements.txt
tenacity==8.2.3
```

---

## 7. FORMATO DE MONEDA ARGENTINA

### 7.1 Validación y Corrección Automática

**Crear servicio de validación en el backend**:

```python
# src/services/currency_validator.py

import re
from decimal import Decimal, InvalidOperation
from typing import Tuple, Optional

class CurrencyValidator:
    """Validador y normalizador de formatos de moneda argentina."""
    
    # Patrones regex
    PATTERN_ARGENTINE = re.compile(r'^-?\$?\s?(\d{1,3}(\.\d{3})*|\d+)(,\d{1,2})?$')
    PATTERN_ENGLISH = re.compile(r'^-?\$?\s?(\d{1,3}(,\d{3})*|\d+)(\.\d{1,2})?$')
    PATTERN_CUIT = re.compile(r'^\d{2}-\d{8}-\d$')
    
    @staticmethod
    def detectar_formato(valor: str) -> str:
        """
        Detecta si un valor está en formato argentino o inglés.
        
        Returns:
            'argentino', 'ingles' o 'invalido'
        """
        valor_limpio = valor.replace('$', '').replace(' ', '')
        
        if CurrencyValidator.PATTERN_ARGENTINE.match(valor_limpio):
            # Verificar que no sea ambiguo
            if '.' in valor_limpio and ',' in valor_limpio:
                dot_pos = valor_limpio.rfind('.')
                comma_pos = valor_limpio.rfind(',')
                return 'argentino' if comma_pos > dot_pos else 'ingles'
            elif ',' in valor_limpio:
                return 'argentino'
            return 'argentino'  # Por defecto asumir argentino
        
        if CurrencyValidator.PATTERN_ENGLISH.match(valor_limpio):
            return 'ingles'
        
        return 'invalido'
    
    @staticmethod
    def normalizar_a_decimal(valor: str) -> Tuple[bool, Optional[Decimal], str]:
        """
        Normaliza un valor en cualquier formato a Decimal.
        
        Returns:
            Tupla (exito, decimal_value, mensaje)
        """
        try:
            # Limpiar valor
            valor_limpio = valor.replace('$', '').replace(' ', '').replace('ARS', '').strip()
            
            if not valor_limpio or valor_limpio == '-':
                return True, Decimal('0'), "OK"
            
            # Detectar formato
            formato = CurrencyValidator.detectar_formato(valor)
            
            if formato == 'invalido':
                return False, None, f"Formato inválido: '{valor}'. Use $1.234,56 (argentino) o $1,234.56 (inglés)"
            
            # Convertir según formato
            if formato == 'argentino':
                # 1.234,56 -> 1234.56
                valor_normalizado = valor_limpio.replace('.', '').replace(',', '.')
            else:  # ingles
                # 1,234.56 -> 1234.56
                valor_normalizado = valor_limpio.replace(',', '')
            
            decimal_value = Decimal(valor_normalizado)
            return True, decimal_value, "OK"
            
        except (InvalidOperation, ValueError) as e:
            return False, None, f"Error al convertir '{valor}': {str(e)}"
    
    @staticmethod
    def formatear_argentino(valor: Decimal, incluir_simbolo: bool = True) -> str:
        """
        Formatea un Decimal al formato argentino $1.234,56
        """
        # Separar parte entera y decimal
        valor_str = str(abs(valor))
        partes = valor_str.split('.')
        parte_entera = partes[0]
        parte_decimal = partes[1] if len(partes) > 1 else '00'
        
        # Asegurar 2 decimales
        parte_decimal = parte_decimal.ljust(2, '0')[:2]
        
        # Agregar separadores de miles
        parte_entera_formateada = ''
        for i, digito in enumerate(reversed(parte_entera)):
            if i > 0 and i % 3 == 0:
                parte_entera_formateada = '.' + parte_entera_formateada
            parte_entera_formateada = digito + parte_entera_formateada
        
        # Construir resultado
        signo = '-' if valor < 0 else ''
        simbolo = '$' if incluir_simbolo else ''
        
        return f"{signo}{simbolo}{parte_entera_formateada},{parte_decimal}"
    
    @staticmethod
    def validar_cuit(cuit: str) -> Tuple[bool, str]:
        """
        Valida formato de CUIT argentino.
        
        Returns:
            Tupla (es_valido, mensaje)
        """
        cuit_limpio = cuit.replace(' ', '').replace('-', '')
        
        # Debe tener exactamente 11 dígitos
        if len(cuit_limpio) != 11 or not cuit_limpio.isdigit():
            return False, "CUIT debe tener 11 dígitos en formato XX-XXXXXXXX-X"
        
        # Validar dígito verificador (algoritmo oficial)
        multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
        suma = sum(int(cuit_limpio[i]) * multiplicadores[i] for i in range(10))
        verificador = 11 - (suma % 11)
        
        if verificador == 11:
            verificador = 0
        elif verificador == 10:
            verificador = 9
        
        if int(cuit_limpio[10]) != verificador:
            return False, f"Dígito verificador incorrecto. Esperado: {verificador}"
        
        return True, "OK"
    
    @staticmethod
    def formatear_cuit(cuit: str) -> str:
        """Formatea CUIT al formato XX-XXXXXXXX-X"""
        cuit_limpio = cuit.replace(' ', '').replace('-', '')
        
        if len(cuit_limpio) != 11:
            return cuit  # Devolver sin cambios si no es válido
        
        return f"{cuit_limpio[:2]}-{cuit_limpio[2:10]}-{cuit_limpio[10]}"
```

### 7.2 Endpoint de Validación

```python
# src/api/routers/system_settings.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.services.currency_validator import CurrencyValidator
from decimal import Decimal

router = APIRouter()

class ValidateCurrencyRequest(BaseModel):
    value: str

class ValidateCurrencyResponse(BaseModel):
    is_valid: bool
    normalized_value: Optional[Decimal]
    formatted_argentine: Optional[str]
    detected_format: str
    message: str

@router.post("/validate-currency", response_model=ValidateCurrencyResponse)
async def validate_currency(request: ValidateCurrencyRequest):
    """Valida y normaliza un valor de moneda."""
    
    # Detectar formato
    formato = CurrencyValidator.detectar_formato(request.value)
    
    # Normalizar
    exito, decimal_value, mensaje = CurrencyValidator.normalizar_a_decimal(request.value)
    
    # Formatear
    formatted = None
    if decimal_value is not None:
        formatted = CurrencyValidator.formatear_argentino(decimal_value)
    
    return ValidateCurrencyResponse(
        is_valid=exito,
        normalized_value=decimal_value,
        formatted_argentine=formatted,
        detected_format=formato,
        message=mensaje
    )


class ValidateCUITRequest(BaseModel):
    cuit: str

class ValidateCUITResponse(BaseModel):
    is_valid: bool
    formatted_cuit: str
    message: str

@router.post("/validate-cuit", response_model=ValidateCUITResponse)
async def validate_cuit(request: ValidateCUITRequest):
    """Valida y formatea un CUIT argentino."""
    
    es_valido, mensaje = CurrencyValidator.validar_cuit(request.cuit)
    formatted = CurrencyValidator.formatear_cuit(request.cuit) if es_valido else request.cuit
    
    return ValidateCUITResponse(
        is_valid=es_valido,
        formatted_cuit=formatted,
        message=mensaje
    )
```

---

## 8. DISEÑO Y UX CONSISTENTE

### 8.1 Sistema de Diseño Unificado

**Crear archivo de variables CSS**:

```css
/* frontend/src/styles/design-system.css */

:root {
  /* Colores Primarios */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-light: #dbeafe;
  
  /* Colores Secundarios */
  --color-secondary: #8b5cf6;
  --color-secondary-hover: #7c3aed;
  --color-secondary-light: #ede9fe;
  
  /* Colores de Estado */
  --color-success: #10b981;
  --color-success-light: #d1fae5;
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-error: #ef4444;
  --color-error-light: #fee2e2;
  --color-info: #3b82f6;
  --color-info-light: #dbeafe;
  
  /* Colores Financieros */
  --color-income: #10b981;
  --color-income-bg: #d1fae5;
  --color-expense: #ef4444;
  --color-expense-bg: #fee2e2;
  --color-iva: #f59e0b;
  --color-iva-bg: #fef3c7;
  --color-balance: #2563eb;
  --color-balance-bg: #dbeafe;
  
  /* Grises */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  
  /* Espaciado */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
  
  /* Bordes */
  --radius-sm: 0.375rem;   /* 6px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-xl: 1rem;       /* 16px */
  
  /* Sombras */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Transiciones */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}

/* Clases de Utilidad para Cards */
.card-base {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg);
  transition: box-shadow var(--transition-base);
}

.card-base:hover {
  box-shadow: var(--shadow-md);
}

.card-theme-income {
  border-left: 4px solid var(--color-income);
  background: linear-gradient(to right, var(--color-income-bg), white);
}

.card-theme-expense {
  border-left: 4px solid var(--color-expense);
  background: linear-gradient(to right, var(--color-expense-bg), white);
}

.card-theme-iva {
  border-left: 4px solid var(--color-iva);
  background: linear-gradient(to right, var(--color-iva-bg), white);
}

.card-theme-balance {
  border-left: 4px solid var(--color-balance);
  background: linear-gradient(to right, var(--color-balance-bg), white);
}

/* Botones Estándar */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: background-color var(--transition-fast);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tablas Estándar */
.table-container {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.table-header {
  background-color: var(--color-gray-50);
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-gray-200);
  font-weight: 600;
  color: var(--color-gray-700);
}

.table-row {
  border-bottom: 1px solid var(--color-gray-100);
  transition: background-color var(--transition-fast);
}

.table-row:hover {
  background-color: var(--color-gray-50);
}

.table-cell {
  padding: var(--spacing-md);
  color: var(--color-gray-700);
}

/* Estados de Loading */
.loading-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-gray-200) 25%,
    var(--color-gray-100) 50%,
    var(--color-gray-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Animaciones de Entrada */
.fade-in {
  animation: fadeIn var(--transition-base);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.slide-in-up {
  animation: slideInUp var(--transition-base);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Badges de Estado */
.badge-success {
  background-color: var(--color-success-light);
  color: var(--color-success);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-warning {
  background-color: var(--color-warning-light);
  color: var(--color-warning);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-error {
  background-color: var(--color-error-light);
  color: var(--color-error);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-info {
  background-color: var(--color-info-light);
  color: var(--color-info);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

/* Contenedores de Página */
.page-container {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-sm);
}

.page-subtitle {
  font-size: 1rem;
  color: var(--color-gray-600);
}
```

**Importar en el index.css**:

```css
/* frontend/src/index.css */

@import './styles/design-system.css';

/* Resto del código... */
```

### 8.2 Reorganizar Menú de Navegación

**Orden sugerido basado en las necesidades de Joni y Hernán**:

```tsx
// frontend/src/components/MainLayout.tsx

const menuItems = [
  // Operaciones principales
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { id: 'upload', label: 'Cargar Facturas', icon: Upload, section: 'main' },
  { id: 'history', label: 'Historial Facturas', icon: FileText, section: 'main' },
  
  // Análisis Financiero
  { id: 'separator-1', label: 'ANÁLISIS', icon: null, section: 'separator' },
  { id: 'sales-vs-purchases', label: 'Ventas vs Compras', icon: TrendingUp, section: 'analysis' },
  { id: 'analytics', label: 'Balance General e IVA', icon: BarChart3, section: 'analysis' },
  { id: 'project-cashflow', label: 'Cash Flow Proyectos', icon: TrendingUp, section: 'analysis' },
  { id: 'reports', label: 'Reportes', icon: FileText, section: 'analysis' },
  
  // Gestión
  { id: 'separator-2', label: 'GESTIÓN', icon: null, section: 'separator' },
  { id: 'clients', label: 'Clientes/Proveedores', icon: Users, section: 'management' },
  { id: 'approval-queue', label: 'Cola de Aprobación', icon: Clock, section: 'management', badge: true },
  
  // Importación y IA
  { id: 'separator-3', label: 'HERRAMIENTAS', icon: null, section: 'separator' },
  { id: 'excel-import', label: 'Importar Excel', icon: Upload, section: 'tools' },
  { id: 'ai-training', label: 'Entrenamiento IA', icon: Brain, section: 'tools' },
  
  // Sistema
  { id: 'separator-4', label: 'SISTEMA', icon: null, section: 'separator' },
  { id: 'user-management', label: 'Usuarios', icon: Users, section: 'system', adminOnly: true },
  { id: 'activity-log', label: 'Registro de Actividad', icon: Activity, section: 'system' },
  { id: 'trash', label: 'Papelera', icon: Trash2, section: 'system' },
  { id: 'user-settings', label: 'Mi Perfil', icon: User, section: 'system' },
];

// Actualizar el renderizado para incluir separadores:

<nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
  {menuItems.map((item) => {
    // Verificar permisos de admin
    if (item.adminOnly && user?.role !== 'admin' && user?.role !== 'superadmin') {
      return null;
    }
    
    // Renderizar separador
    if (item.section === 'separator') {
      return (
        <div key={item.id} className="pt-4 pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
            {item.label}
          </p>
        </div>
      );
    }
    
    const Icon = item.icon;
    const isActive = activeView === item.id;
    
    return (
      <Button
        key={item.id}
        variant="ghost"
        className={`
          w-full justify-start transition-all duration-200 rounded-lg px-3 py-2.5
          ${isActive 
            ? 'bg-blue-600 text-white shadow-sm border-l-4 border-blue-700' 
            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
          }
        `}
        onClick={() => {
          setActiveView(item.id as ViewType);
          setSidebarOpen(false);
        }}
      >
        <Icon className={`mr-3 h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
        <span className="truncate font-medium">{item.label}</span>
        {item.badge && (
          <div className="ml-auto w-2 h-2 bg-red-500 rounded-full"></div>
        )}
      </Button>
    );
  })}
</nav>
```

---

## 9. SISTEMA DE PERMISOS Y ROLES

### 9.1 Definir Roles Claramente

**Actualizar modelo de usuario**:

```python
# src/models/user.py

from enum import Enum

class UserRole(str, Enum):
    """Roles de usuario en el sistema."""
    SUPERADMIN = "superadmin"  # Franco - control total
    ADMIN = "admin"            # Hernán, Joni - gestión completa
    ACCOUNTANT = "accountant"  # Contador - solo lectura y reportes
    VIEWER = "viewer"          # Solo visualización
    PARTNER = "partner"        # Socio - ver solo sus datos

class Permission(str, Enum):
    """Permisos específicos en el sistema."""
    # Facturas
    VIEW_INVOICES = "view_invoices"
    CREATE_INVOICES = "create_invoices"
    EDIT_INVOICES = "edit_invoices"
    DELETE_INVOICES = "delete_invoices"
    APPROVE_INVOICES = "approve_invoices"
    
    # Usuarios
    VIEW_USERS = "view_users"
    CREATE_USERS = "create_users"
    EDIT_USERS = "edit_users"
    DELETE_USERS = "delete_users"
    
    # Reportes
    VIEW_REPORTS = "view_reports"
    EXPORT_REPORTS = "export_reports"
    VIEW_ALL_DATA = "view_all_data"  # Ver datos de todos los socios
    VIEW_OWN_DATA = "view_own_data"  # Solo ver propios datos
    
    # Sistema
    MANAGE_SETTINGS = "manage_settings"
    VIEW_AUDIT_LOG = "view_audit_log"
    TRAIN_AI = "train_ai"

# Matriz de permisos por rol
ROLE_PERMISSIONS = {
    UserRole.SUPERADMIN: [p for p in Permission],  # Todos los permisos
    
    UserRole.ADMIN: [
        Permission.VIEW_INVOICES,
        Permission.CREATE_INVOICES,
        Permission.EDIT_INVOICES,
        Permission.DELETE_INVOICES,
        Permission.APPROVE_INVOICES,
        Permission.VIEW_USERS,
        Permission.CREATE_USERS,
        Permission.EDIT_USERS,
        Permission.VIEW_REPORTS,
        Permission.EXPORT_REPORTS,
        Permission.VIEW_ALL_DATA,
        Permission.VIEW_AUDIT_LOG,
        Permission.TRAIN_AI,
    ],
    
    UserRole.ACCOUNTANT: [
        Permission.VIEW_INVOICES,
        Permission.VIEW_REPORTS,
        Permission.EXPORT_REPORTS,
        Permission.VIEW_ALL_DATA,
    ],
    
    UserRole.PARTNER: [
        Permission.VIEW_INVOICES,
        Permission.CREATE_INVOICES,
        Permission.VIEW_REPORTS,
        Permission.VIEW_OWN_DATA,
    ],
    
    UserRole.VIEWER: [
        Permission.VIEW_INVOICES,
        Permission.VIEW_REPORTS,
        Permission.VIEW_OWN_DATA,
    ],
}

def has_permission(user_role: UserRole, permission: Permission) -> bool:
    """Verifica si un rol tiene un permiso específico."""
    return permission in ROLE_PERMISSIONS.get(user_role, [])
```

### 9.2 Middleware de Permisos

```python
# src/core/permissions.py

from fastapi import Depends, HTTPException, status
from src.models.user import User, Permission, has_permission
from src.core.security import get_current_user

def require_permission(permission: Permission):
    """Decorator para requerir un permiso específico."""
    
    async def permission_checker(current_user: User = Depends(get_current_user)):
        if not has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tienes permiso para realizar esta acción. Permiso requerido: {permission.value}"
            )
        return current_user
    
    return permission_checker

# Uso en routers:
from src.core.permissions import require_permission
from src.models.user import Permission

@router.delete("/{invoice_id}")
async def delete_invoice(
    invoice_id: int,
    current_user: User = Depends(require_permission(Permission.DELETE_INVOICES)),
    session: AsyncSession = Depends(get_session)
):
    # Solo usuarios con permiso DELETE_INVOICES pueden ejecutar esto
    ...
```

---

## 10. GRÁFICAS Y ANALYTICS

### 10.1 Gráficas Adicionales Recomendadas

```tsx
// frontend/src/components/analytics/MonthlyTrendChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthlyTrendChartProps {
  data: Array<{
    month: string;
    income: number;
    expenses: number;
    profit: number;
  }>;
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia Mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: '#374151' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Ingresos"
              dot={{ fill: '#10b981' }}
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Egresos"
              dot={{ fill: '#ef4444' }}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#2563eb" 
              strokeWidth={2}
              name="Ganancia"
              dot={{ fill: '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

```tsx
// frontend/src/components/analytics/InvoiceDistributionChart.tsx

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InvoiceDistributionChartProps {
  data: Array<{
    tipo: string;
    cantidad: number;
    monto: number;
  }>;
}

export function InvoiceDistributionChart({ data }: InvoiceDistributionChartProps) {
  const COLORS = {
    'Tipo A': '#3b82f6',
    'Tipo B': '#8b5cf6',
    'Tipo C': '#f59e0b'
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución por Tipo de Factura</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ tipo, percent }) => `${tipo}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="monto"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.tipo as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

```tsx
// frontend/src/components/analytics/PartnerBalanceChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PartnerBalanceChartProps {
  data: Array<{
    socio: string;
    ingresos: number;
    egresos: number;
    balance: number;
  }>;
}

export function PartnerBalanceChart({ data }: PartnerBalanceChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance por Socio</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="socio" />
            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" />
            <Bar dataKey="egresos" fill="#ef4444" name="Egresos" />
            <Bar dataKey="balance" fill="#2563eb" name="Balance" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### 10.2 Dashboard Ejecutivo Completo

```tsx
// frontend/src/pages/ExecutiveAnalyticsPage.tsx

import { useState, useEffect } from 'react';
import { MonthlyTrendChart } from '@/components/analytics/MonthlyTrendChart';
import { InvoiceDistributionChart } from '@/components/analytics/InvoiceDistributionChart';
import { PartnerBalanceChart } from '@/components/analytics/PartnerBalanceChart';
import apiService from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';

export default function ExecutiveAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [partnerData, setPartnerData] = useState([]);
  const { error: showError } = useNotifications();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Llamar a endpoints específicos de analytics
      // (Por implementar en backend)
      const [monthly, distribution, partners] = await Promise.all([
        apiService.getMonthlyTrends(),
        apiService.getInvoiceDistribution(),
        apiService.getPartnerBalances()
      ]);
      
      setMonthlyData(monthly);
      setDistributionData(distribution);
      setPartnerData(partners);
      
    } catch (err) {
      console.error('Error fetching analytics:', err);
      showError('Error al cargar analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="loading-shimmer w-64 h-8 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Analytics Ejecutivos</h1>
        <p className="page-subtitle">
          Análisis profundo de la situación financiera de Open Doors
        </p>
      </div>

      <div className="space-y-6">
        {/* Tendencia Mensual */}
        <MonthlyTrendChart data={monthlyData} />

        {/* Fila de gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InvoiceDistributionChart data={distributionData} />
          <PartnerBalanceChart data={partnerData} />
        </div>
      </div>
    </div>
  );
}
```

---

## 11. PLAN DE IMPLEMENTACIÓN POR FASES

### FASE 1: BASE DE DATOS Y BACKEND (1-2 semanas)

**Prioridad: CRÍTICA**

#### Semana 1
- [ ] Día 1-2: Actualizar modelo de `Invoice` con nuevos campos
- [ ] Día 2-3: Crear y ejecutar migración SQL
- [ ] Día 3-4: Migrar datos existentes de JSON a columnas
- [ ] Día 4-5: Implementar `FinancialCalculator` centralizado
- [ ] Día 5-7: Crear tests unitarios para cálculos

#### Semana 2
- [ ] Día 1-2: Implementar endpoints de reportes financieros
  - `/financial/balance-iva`
  - `/financial/balance-general`
  - `/financial/balance-por-socio`
- [ ] Día 3-4: Implementar `CurrencyValidator`
- [ ] Día 5: Implementar endpoint de validación de moneda
- [ ] Día 6-7: Tests de integración para endpoints

### FASE 2: INTEGRACIÓN AZURE AI (1 semana)

**Prioridad: ALTA**

- [ ] Día 1: Verificar credenciales con script
- [ ] Día 2-3: Mejorar `EnhancedInvoiceProcessingAgent` con reintentos
- [ ] Día 4-5: Implementar manejo de errores y logging
- [ ] Día 6-7: Pruebas de carga de facturas reales

### FASE 3: FRONTEND - COMPONENTES BASE (1-2 semanas)

**Prioridad: ALTA**

#### Semana 1
- [ ] Día 1-2: Crear sistema de diseño (design-system.css)
- [ ] Día 3-4: Crear componente `DataTable` reutilizable
- [ ] Día 5-6: Crear hook `useCurrencyFormat`
- [ ] Día 7: Crear componente `CurrencyInput`

#### Semana 2
- [ ] Día 1-2: Actualizar `FinancialOverview` con datos reales
- [ ] Día 3-4: Implementar autoguardado en tablas editables
- [ ] Día 5-6: Reorganizar menú de navegación
- [ ] Día 7: Aplicar diseño consistente a todas las páginas

### FASE 4: FUNCIONALIDADES FALTANTES (1 semana)

**Prioridad: MEDIA**

- [ ] Día 1-2: Implementar cola de aprobación
- [ ] Día 3: Implementar papelera (soft delete)
- [ ] Día 4-5: Implementar gestión de clientes/proveedores
- [ ] Día 6-7: Implementar registro de actividad

### FASE 5: SISTEMA DE PERMISOS (3-4 días)

**Prioridad: MEDIA**

- [ ] Día 1: Implementar roles y permisos en backend
- [ ] Día 2: Crear middleware de permisos
- [ ] Día 3: Aplicar permisos a endpoints sensibles
- [ ] Día 4: Aplicar permisos en frontend (ocultar botones)

### FASE 6: GRÁFICAS Y ANALYTICS (3-4 días)

**Prioridad: BAJA**

- [ ] Día 1: Crear endpoints de analytics
- [ ] Día 2: Implementar gráficas adicionales
- [ ] Día 3: Crear página de analytics ejecutivos
- [ ] Día 4: Optimización y pulido

### FASE 7: TESTING Y OPTIMIZACIÓN (1 semana)

**Prioridad: ALTA**

- [ ] Día 1-2: Tests de integración end-to-end
- [ ] Día 3-4: Tests de carga y performance
- [ ] Día 5: Corregir bugs encontrados
- [ ] Día 6-7: Optimización de queries y caching

---

## 12. CHECKLIST DE VERIFICACIÓN

### Backend

#### Base de Datos
- [ ] Tabla `invoices` tiene todos los campos necesarios
- [ ] Índices creados para búsquedas rápidas
- [ ] Constraints de validación implementados
- [ ] Datos existentes migrados correctamente

#### Servicios
- [ ] `FinancialCalculator` implementado y testeado
- [ ] `CurrencyValidator` implementado y testeado
- [ ] Lógica de cálculos centralizada (sin duplicación)

#### Endpoints
- [ ] `/financial/balance-iva` funciona correctamente
- [ ] `/financial/balance-general` funciona correctamente
- [ ] `/financial/balance-por-socio` funciona correctamente
- [ ] `/approval/pending` retorna datos reales
- [ ] `/invoices/trash` retorna datos reales
- [ ] Todos los endpoints tienen manejo de errores

#### Azure AI
- [ ] Credenciales validadas y funcionando
- [ ] `EnhancedInvoiceProcessingAgent` procesa facturas
- [ ] Manejo de errores y reintentos implementado
- [ ] Logs detallados del procesamiento

### Frontend

#### Diseño
- [ ] Sistema de diseño aplicado (design-system.css)
- [ ] Todas las páginas usan el mismo estilo
- [ ] Todas las tablas tienen el mismo diseño
- [ ] Cards consistentes en toda la aplicación

#### Componentes
- [ ] `DataTable` implementado y reutilizado
- [ ] `CurrencyInput` implementado
- [ ] Hook `useCurrencyFormat` creado
- [ ] Componentes de gráficas creados

#### Funcionalidad
- [ ] Todos los botones funcionan
- [ ] Datos se guardan correctamente (autoguardado)
- [ ] Formato de moneda argentina validado
- [ ] Auto-corrección de formato activada

#### Datos
- [ ] `FinancialOverview` usa datos reales (no simulados)
- [ ] Filtros funcionan correctamente
- [ ] Búsqueda funciona en todas las tablas
- [ ] Ordenamiento funciona en todas las tablas

### Sistema

#### Permisos
- [ ] Roles definidos claramente
- [ ] Permisos asignados por rol
- [ ] Middleware de permisos funciona
- [ ] Franco es superadmin

#### Performance
- [ ] Queries optimizadas
- [ ] Índices creados
- [ ] Caching implementado donde corresponde
- [ ] Tiempo de carga < 2 segundos

#### Seguridad
- [ ] Credenciales en .env (no hardcodeadas)
- [ ] Tokens JWT funcionando
- [ ] CORS configurado correctamente
- [ ] Validación de datos en backend

---

## INSTRUCCIONES FINALES

### Cómo Aplicar Estos Cambios Localmente

1. **Backup de tu base de datos actual**:
```bash
docker exec opendoors_db pg_dump -U postgres opendoors > backup_$(date +%Y%m%d).sql
```

2. **Aplicar cambios en orden**:
   - Primero: Actualizar modelos y migraciones de BD
   - Segundo: Implementar servicios del backend
   - Tercero: Actualizar endpoints
   - Cuarto: Actualizar frontend
   - Quinto: Testing completo

3. **Verificar cada fase**:
   - Después de cada cambio, reiniciar Docker:
   ```bash
   docker-compose down
   docker-compose up --build
   ```
   - Probar que funciona antes de continuar

4. **Monitorear logs**:
```bash
# Backend
docker logs -f opendoors_backend

# Frontend
docker logs -f opendoors_frontend

# Base de datos
docker logs -f opendoors_db
```

### Recursos Adicionales

- **Documentación Azure AI**: https://learn.microsoft.com/azure/ai-services/
- **FastAPI Best Practices**: https://fastapi.tiangolo.com/tutorial/
- **React + TypeScript**: https://react-typescript-cheatsheet.netlify.app/
- **PostgreSQL Performance**: https://www.postgresql.org/docs/current/performance-tips.html

---

## CONTACTO Y SOPORTE

Si tienes dudas o problemas durante la implementación:

1. Consulta este documento
2. Revisa los logs de Docker
3. Verifica las credenciales de Azure
4. Contacta con el equipo (Hernán/Joni)

---

**Documento generado el**: 03 de Octubre de 2025  
**Versión**: 1.0  
**Autor**: Análisis de Código Open Doors  
**Para**: Franco (Superadmin)

---

Este documento es tu guía completa para llevar el sistema Open Doors al siguiente nivel. Sigue las fases en orden y verifica cada checklist antes de continuar. ¡Éxito con la implementación!
