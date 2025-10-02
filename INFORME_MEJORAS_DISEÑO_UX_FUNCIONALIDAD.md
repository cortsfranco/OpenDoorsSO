# 🎨 INFORME COMPLETO - MEJORAS DE DISEÑO, UX Y FUNCIONALIDAD
## Sistema Open Doors - Análisis Basado en Requisitos de Joni y Hernán

**Fecha:** 2 de Octubre, 2025  
**Desarrollador:** Franco Nicolás Corts Romeo  
**Sistema:** Open Doors - Sistema de Gestión Empresarial con IA  
**Stakeholders:** Hernán, Joni, Leo, Maxi

---

## 📑 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Requisitos según Transcripciones](#análisis-de-requisitos-según-transcripciones)
3. [Mejoras de Diseño y Coherencia Visual](#mejoras-de-diseño-y-coherencia-visual)
4. [Arquitectura de Navegación y Menú Lateral](#arquitectura-de-navegación-y-menú-lateral)
5. [Sistema de Gestión de Usuarios y Permisos](#sistema-de-gestión-de-usuarios-y-permisos)
6. [Año Fiscal y Configuración General](#año-fiscal-y-configuración-general)
7. [Responsividad y Experiencia Móvil](#responsividad-y-experiencia-móvil)
8. [Procesamiento Inteligente de Facturas](#procesamiento-inteligente-de-facturas)
9. [Edición Inline y Validaciones](#edición-inline-y-validaciones)
10. [Cálculos Financieros Argentinos](#cálculos-financieros-argentinos)
11. [Integraciones con APIs Externas](#integraciones-con-apis-externas)
12. [Seguridad y Cumplimiento](#seguridad-y-cumplimiento)
13. [Plan de Implementación Detallado](#plan-de-implementación-detallado)

---

## 1. RESUMEN EJECUTIVO

### 🎯 Objetivo del Informe
Documentar todas las mejoras de diseño, UX/UI y funcionalidades técnicas necesarias para que el sistema Open Doors cumpla con los requisitos específicos de Hernán, Joni, Leo y Maxi según sus necesidades operativas reales.

### 📊 Hallazgos Clave de las Transcripciones

#### **Necesidades de Joni:**
1. **Balance de IVA detallado** - Distinguir IVA emitido vs recibido
2. **Movimiento de cuenta** - Flag para saber qué facturas generan cash flow real
3. **Balance por propietario** - Track individual de Hernán, Joni, Leo, Maxi
4. **Dos contabilidades paralelas:**
   - Balance REAL (solo facturas de trabajo y subcontratos)
   - Balance FISCAL (incluye facturas para recuperar IVA)
5. **Cash flow por proyecto** - Seguimiento de rentabilidad por obra
6. **Año fiscal:** Mayo a Abril (no calendario)

#### **Necesidades de Hernán:**
1. **Indicadores de gestión** - Rentabilidad real de la empresa
2. **Separación de facturas:**
   - Facturas de servicios (movimiento de cuenta = Sí)
   - Facturas para recuperar IVA (movimiento de cuenta = No)
3. **Dashboard configurable** - Cada socio puede ver datos filtrados a su gusto
4. **Interfaz intuitiva** - Acceso desde móvil para cargar facturas en obra
5. **Automatización con IA** - Procesamiento automático via Azure Document Intelligence

### 🚨 Problemas Identificados

| Categoría | Problema | Impacto | Prioridad |
|-----------|----------|---------|-----------|
| **Diseño** | No hay año fiscal configurado | Alto | CRÍTICA |
| **Diseño** | Menú lateral plano sin submenús | Medio | ALTA |
| **Diseño** | Tipografía inconsistente en títulos | Medio | ALTA |
| **Funcional** | No existe gestión de usuarios/roles | Alto | CRÍTICA |
| **Funcional** | Falta configuración general del sistema | Alto | CRÍTICA |
| **Funcional** | No hay edición inline de facturas | Medio | ALTA |
| **Funcional** | Balance IVA no distingue "movimiento cuenta" | Alto | CRÍTICA |
| **Funcional** | No hay balance REAL vs FISCAL | Alto | CRÍTICA |
| **Funcional** | No existe cash flow por proyecto | Alto | ALTA |
| **UX** | No es responsive en móviles | Alto | CRÍTICA |
| **UX** | Datos no editables directamente en tablas | Medio | ALTA |
| **Seguridad** | No hay API con AFIP | Alto | ALTA |
| **Seguridad** | No hay roles granulares (admin/contador/socio) | Alto | CRÍTICA |

---

## 2. ANÁLISIS DE REQUISITOS SEGÚN TRANSCRIPCIONES

### 📋 Requisito #1: Sistema de Dos Contabilidades

**Contexto (Transcripción de Joni):**
> "Nosotros tenemos dos balances: el balance de la empresa actual [...] y el balance real. El balance real dice que nosotros no sé todas las facturas de combustible de caramelo lo que sea que que que hagamos facturar que pidamos para recuperar eliva todo eso esas no son reales la empresa no son reales las empresas las hacemos para compensar un día pero no son reales una factura real de la empresa sería por ejemplo hasta ahora sería la la factura que nosotros emitimos por los trabajos y la plata que nosotros pagamos que nos hacen una factura a nosotros por los por los por el pago de esos trabajos viste"

**Implementación Necesaria:**

#### Base de Datos - Agregar campo:
```sql
-- Modificar tabla invoices
ALTER TABLE invoices 
ADD COLUMN movimiento_cuenta BOOLEAN DEFAULT FALSE;

ALTER TABLE invoices 
ADD COLUMN tipo_contabilidad VARCHAR(20) DEFAULT 'fiscal';
-- Valores posibles: 'real', 'fiscal', 'ambas'

COMMENT ON COLUMN invoices.movimiento_cuenta IS 
'TRUE = Genera movimiento de cuenta real (ingresos/egresos efectivos). FALSE = Solo para compensar IVA';

COMMENT ON COLUMN invoices.tipo_contabilidad IS 
'real = Solo aparece en balance real. fiscal = Solo en balance fiscal. ambas = En ambos balances';
```

#### Backend - Nuevo Endpoint:
```python
# src/api/routers/financial_reports.py

@router.get("/balance-real")
async def get_balance_real(
    owner: Optional[str] = None,
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Balance REAL - Solo facturas que generan movimiento de cuenta efectivo.
    
    Incluye:
    - Facturas emitidas por trabajos realizados
    - Facturas recibidas por subcontratos pagados
    
    Excluye:
    - Facturas solo para compensar IVA (combustible, caramelos, etc)
    """
    service = FinancialService(db)
    
    # Filtrar SOLO facturas con movimiento_cuenta = TRUE
    return await service.get_balance_real(
        owner=owner,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        only_real_movement=True  # ← CLAVE
    )

@router.get("/balance-fiscal")
async def get_balance_fiscal(
    owner: Optional[str] = None,
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Balance FISCAL - Todas las facturas (incluye las de compensación IVA).
    Este es el balance que se presenta a AFIP.
    """
    service = FinancialService(db)
    
    # Incluir TODAS las facturas
    return await service.get_balance_fiscal(
        owner=owner,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        include_all=True
    )
```

#### Frontend - Selector de Tipo de Balance:
```tsx
// frontend/src/pages/ReportsPage.tsx

export function ReportsPage() {
  const [balanceType, setBalanceType] = useState<'real' | 'fiscal'>('real');
  const [balanceData, setBalanceData] = useState(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reportes Financieros</h1>
        
        {/* Selector de tipo de balance */}
        <div className="flex items-center gap-4">
          <Label>Tipo de Balance:</Label>
          <Select value={balanceType} onValueChange={setBalanceType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="real">
                📊 Balance Real
                <span className="text-xs text-gray-500 block">
                  Solo movimientos efectivos
                </span>
              </SelectItem>
              <SelectItem value="fiscal">
                🏛️ Balance Fiscal
                <span className="text-xs text-gray-500 block">
                  Para presentar a AFIP
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Card explicativa */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>
          {balanceType === 'real' 
            ? 'Balance Real - Rentabilidad Efectiva' 
            : 'Balance Fiscal - Declaración AFIP'}
        </AlertTitle>
        <AlertDescription>
          {balanceType === 'real' 
            ? 'Muestra solo facturas con movimiento de cuenta real (trabajos facturados y pagos a subcontratos). Excluye facturas de compensación de IVA.'
            : 'Incluye todas las facturas emitidas y recibidas, incluyendo las utilizadas para recuperar IVA (combustible, materiales, etc).'}
        </AlertDescription>
      </Alert>

      {/* Visualización del balance */}
      <BalanceCards data={balanceData} type={balanceType} />
    </div>
  );
}
```

---

### 📋 Requisito #2: Año Fiscal (Mayo a Abril)

**Contexto (Transcripción de Joni):**
> "nuestro período de de análisis va desde desde um eh abril eh desde mayo de de de un año hasta abril del otro año entonces justo nosotros agarramos empezamos a tener movimiento de cuenta en el periodo justo unos dos meses o un mes antes de abril"

**Implementación Necesaria:**

#### Base de Datos - Nueva Tabla:
```sql
CREATE TABLE fiscal_settings (
    id SERIAL PRIMARY KEY,
    
    -- Configuración del año fiscal
    fiscal_year_start_month INTEGER NOT NULL DEFAULT 5, -- Mayo
    fiscal_year_end_month INTEGER NOT NULL DEFAULT 4,   -- Abril
    
    -- País y normativa
    country_code VARCHAR(2) DEFAULT 'AR',
    tax_authority VARCHAR(50) DEFAULT 'AFIP',
    
    -- Tasas impositivas
    iva_rate_general DECIMAL(5,2) DEFAULT 21.00,
    iva_rate_reduced DECIMAL(5,2) DEFAULT 10.50,
    ganancias_rate DECIMAL(5,2) DEFAULT 35.00,
    
    -- Tipos de facturas válidas
    valid_invoice_types JSON DEFAULT '["A", "B", "C", "X"]'::json,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);

-- Insertar configuración inicial
INSERT INTO fiscal_settings (
    fiscal_year_start_month,
    fiscal_year_end_month,
    country_code,
    iva_rate_general,
    ganancias_rate
) VALUES (5, 4, 'AR', 21.00, 35.00);

COMMENT ON TABLE fiscal_settings IS 
'Configuración del año fiscal y parámetros tributarios de Open Doors';
```

#### Backend - Servicio de Año Fiscal:
```python
# src/services/fiscal_year_service.py

from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from sqlalchemy import select
from src.models.fiscal_settings import FiscalSettings

class FiscalYearService:
    """Servicio para manejo de año fiscal argentino."""
    
    def __init__(self, session):
        self.session = session
    
    async def get_fiscal_settings(self) -> FiscalSettings:
        """Obtener configuración fiscal actual."""
        result = await self.session.execute(
            select(FiscalSettings).order_by(FiscalSettings.id.desc()).limit(1)
        )
        return result.scalar_one()
    
    async def get_current_fiscal_year(self) -> dict:
        """
        Determinar el año fiscal actual.
        
        Ejemplo: Si estamos en Marzo 2025 → Año Fiscal 2024 (Mayo 2024 - Abril 2025)
        Ejemplo: Si estamos en Mayo 2025 → Año Fiscal 2025 (Mayo 2025 - Abril 2026)
        
        Returns:
            {
                'year': 2024,
                'start_date': datetime(2024, 5, 1),
                'end_date': datetime(2025, 4, 30),
                'label': '2024 (Mayo 2024 - Abril 2025)'
            }
        """
        settings = await self.get_fiscal_settings()
        today = datetime.now().date()
        
        fiscal_start_month = settings.fiscal_year_start_month  # 5 (Mayo)
        
        # Determinar año fiscal actual
        if today.month >= fiscal_start_month:
            # Estamos después de Mayo → año fiscal actual
            fiscal_year = today.year
        else:
            # Estamos antes de Mayo → año fiscal anterior
            fiscal_year = today.year - 1
        
        # Calcular fechas de inicio y fin
        start_date = date(fiscal_year, fiscal_start_month, 1)
        
        # Fin: 1 año después, último día del mes
        end_date = start_date + relativedelta(years=1, days=-1)
        
        return {
            'year': fiscal_year,
            'start_date': start_date,
            'end_date': end_date,
            'label': f"{fiscal_year} (Mayo {fiscal_year} - Abril {fiscal_year + 1})",
            'current': True
        }
    
    async def get_fiscal_year_range(self, fiscal_year: int) -> dict:
        """Obtener rango de fechas de un año fiscal específico."""
        settings = await self.get_fiscal_settings()
        
        start_date = date(fiscal_year, settings.fiscal_year_start_month, 1)
        end_date = start_date + relativedelta(years=1, days=-1)
        
        return {
            'year': fiscal_year,
            'start_date': start_date,
            'end_date': end_date,
            'label': f"{fiscal_year} (Mayo {fiscal_year} - Abril {fiscal_year + 1})"
        }
    
    async def get_fiscal_years_list(self, limit: int = 5) -> list:
        """
        Obtener lista de años fiscales disponibles.
        
        Returns:
            [
                {'year': 2025, 'label': '2025 (Mayo 2025 - Abril 2026)', 'current': False},
                {'year': 2024, 'label': '2024 (Mayo 2024 - Abril 2025)', 'current': True},
                {'year': 2023, 'label': '2023 (Mayo 2023 - Abril 2024)', 'current': False},
            ]
        """
        current_fy = await self.get_current_fiscal_year()
        current_year = current_fy['year']
        
        fiscal_years = []
        
        for i in range(limit):
            fy = current_year - i
            fy_data = await self.get_fiscal_year_range(fy)
            fy_data['current'] = (fy == current_year)
            fiscal_years.append(fy_data)
        
        return fiscal_years
```

#### Frontend - Selector de Año Fiscal:
```tsx
// frontend/src/components/FiscalYearSelector.tsx

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import apiService from '@/services/api';

interface FiscalYear {
  year: number;
  label: string;
  start_date: string;
  end_date: string;
  current: boolean;
}

interface Props {
  value?: number;
  onChange: (year: number, dateRange: { start: string; end: string }) => void;
}

export function FiscalYearSelector({ value, onChange }: Props) {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiscalYears();
  }, []);

  const fetchFiscalYears = async () => {
    try {
      const data = await apiService.getFiscalYears();
      setFiscalYears(data);
      
      // Seleccionar año fiscal actual por defecto
      const current = data.find(fy => fy.current);
      if (current && !value) {
        onChange(current.year, {
          start: current.start_date,
          end: current.end_date
        });
      }
    } catch (error) {
      console.error('Error fetching fiscal years:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <Select
        value={value?.toString()}
        onValueChange={(yearStr) => {
          const year = parseInt(yearStr);
          const fy = fiscalYears.find(f => f.year === year);
          if (fy) {
            onChange(year, {
              start: fy.start_date,
              end: fy.end_date
            });
          }
        }}
        disabled={loading}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Seleccionar año fiscal..." />
        </SelectTrigger>
        <SelectContent>
          {fiscalYears.map((fy) => (
            <SelectItem key={fy.year} value={fy.year.toString()}>
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{fy.label}</span>
                {fy.current && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Actual
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

---

### 📋 Requisito #3: Balance por Propietario (Hernán, Joni, Leo, Maxi)

**Contexto (Transcripción de Joni):**
> "tenemos el ingreso y egreso de facturas o de dinero [...] para tener una idea más o menos cuánto es la plata que tiene cada uno en la cuenta porque si el Leo metió dos trabajos yo metí uno el Hernán dos y y el Maxi ninguno bueno son distintas las las las las cuentas que tenemos ahí adentro"

**Implementación Necesaria:**

#### Frontend - Filtro Avanzado por Propietario:
```tsx
// frontend/src/components/OwnerBalanceView.tsx

export function OwnerBalanceView() {
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [ownerBalances, setOwnerBalances] = useState<any[]>([]);
  
  const owners = [
    { id: 'all', name: 'Todos los Socios', avatar: '👥' },
    { id: 'Hernán', name: 'Hernán', avatar: '👨‍💼' },
    { id: 'Joni', name: 'Joni', avatar: '👨‍💻' },
    { id: 'Leo', name: 'Leo', avatar: '👨‍🔧' },
    { id: 'Maxi', name: 'Maxi', avatar: '👨‍🎨' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Balance por Socio</h2>
        
        {/* Selector de propietario */}
        <Select value={selectedOwner} onValueChange={setSelectedOwner}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {owners.map(owner => (
              <SelectItem key={owner.id} value={owner.id}>
                <div className="flex items-center gap-2">
                  <span>{owner.avatar}</span>
                  <span>{owner.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards de balance individual */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ownerBalances.map(balance => (
          <Card key={balance.owner} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {balance.owner}
                </CardTitle>
                <span className="text-2xl">{balance.avatar}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Ingresos</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(balance.total_income)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Egresos</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(balance.total_expenses)}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-gray-500">Balance Neto</p>
                  <p className={`text-xl font-bold ${
                    balance.net_balance >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(balance.net_balance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">IVA a Favor</p>
                  <p className="text-sm font-semibold text-purple-600">
                    {formatCurrency(balance.iva_favor)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla detallada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceHistoryTable 
            owner={selectedOwner !== 'all' ? selectedOwner : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 3. MEJORAS DE DISEÑO Y COHERENCIA VISUAL

### 🎨 Problema: Tipografía y Estilos Inconsistentes

**Análisis del Código Actual:**

**Títulos inconsistentes detectados:**
```tsx
// ❌ INCONSISTENTE - Múltiples estilos para títulos H1

// DashboardPage.tsx
<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

// InvoicesPage.tsx
<h1 className="text-2xl font-bold">Facturas</h1>

// ReportsPage.tsx
<h1 className="text-xl font-semibold">Reportes</h1>

// SettingsPage.tsx
<h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
```

**Solución: Sistema de Tipografía Unificado**

#### Crear Design Tokens:
```typescript
// frontend/src/lib/design-tokens.ts

export const typography = {
  // Headings
  h1: 'text-3xl font-bold tracking-tight text-gray-900',
  h2: 'text-2xl font-bold text-gray-800',
  h3: 'text-xl font-semibold text-gray-700',
  h4: 'text-lg font-semibold text-gray-700',
  h5: 'text-base font-semibold text-gray-600',
  h6: 'text-sm font-semibold text-gray-600',
  
  // Body text
  bodyLarge: 'text-base text-gray-700',
  bodyRegular: 'text-sm text-gray-600',
  bodySmall: 'text-xs text-gray-500',
  
  // Special
  lead: 'text-lg text-gray-600',
  caption: 'text-xs text-gray-500',
  label: 'text-sm font-medium text-gray-700',
  
  // Numbers
  metricLarge: 'text-4xl font-bold tabular-nums',
  metricRegular: 'text-2xl font-semibold tabular-nums',
  metricSmall: 'text-lg font-medium tabular-nums',
};

export const colors = {
  // Semantic colors
  primary: {
    DEFAULT: 'text-blue-600',
    light: 'text-blue-500',
    dark: 'text-blue-700',
  },
  success: {
    DEFAULT: 'text-green-600',
    light: 'text-green-500',
    dark: 'text-green-700',
  },
  danger: {
    DEFAULT: 'text-red-600',
    light: 'text-red-500',
    dark: 'text-red-700',
  },
  warning: {
    DEFAULT: 'text-yellow-600',
    light: 'text-yellow-500',
    dark: 'text-yellow-700',
  },
  // Financial colors
  income: 'text-green-600',
  expense: 'text-red-600',
  iva: 'text-blue-600',
  balance: 'text-purple-600',
};
```

#### Componentes de Tipografía:
```tsx
// frontend/src/components/ui/Typography.tsx

import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-tokens';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function Heading({ as: Component = 'h1', className, children, ...props }: HeadingProps) {
  return (
    <Component 
      className={cn(typography[Component], className)} 
      {...props}
    >
      {children}
    </Component>
  );
}

export function Text({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn(typography.bodyRegular, className)} {...props}>
      {children}
    </p>
  );
}

export function Metric({ 
  value, 
  size = 'regular',
  color,
  className,
  ...props 
}: {
  value: string | number;
  size?: 'small' | 'regular' | 'large';
  color?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const sizeClass = {
    small: typography.metricSmall,
    regular: typography.metricRegular,
    large: typography.metricLarge,
  }[size];
  
  return (
    <span className={cn(sizeClass, color, className)} {...props}>
      {value}
    </span>
  );
}
```

#### Refactorizar Páginas:
```tsx
// frontend/src/pages/DashboardPage.tsx (DESPUÉS)

import { Heading, Text, Metric } from '@/components/ui/Typography';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* ✅ CONSISTENTE - Usando componentes unificados */}
      <div>
        <Heading as="h1">Dashboard</Heading>
        <Text className="mt-1">
          Resumen financiero de Open Doors
        </Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <Heading as="h3">Ingresos Totales</Heading>
          </CardHeader>
          <CardContent>
            <Metric value={formatCurrency(totalIncome)} size="large" color="text-green-600" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 4. ARQUITECTURA DE NAVEGACIÓN Y MENÚ LATERAL

### 📱 Problema: Menú Lateral Plano Sin Submenús

**Situación Actual:**
```
Dashboard
Cargar Factura
Facturas
Aprobaciones
Reportes
Socios
Configuración
Usuarios
```

**Propuesta: Menú con Jerarquía y Submenús**

```
📊 Dashboard

📄 FACTURACIÓN
  ├─ 📤 Cargar Factura
  ├─ 📋 Historial de Facturas
  ├─ ✅ Aprobaciones Pendientes
  └─ 🗑️ Facturas Eliminadas

💰 FINANZAS
  ├─ 📊 Balance IVA
  ├─ 💵 Balance General
  ├─ 🏦 Balance por Socio
  ├─ 📈 Cash Flow por Proyecto
  └─ 📑 Reportes Fiscales

👥 GESTIÓN
  ├─ 🤝 Socios
  ├─ 👤 Clientes
  ├─ 🏢 Proveedores
  └─ 📦 Proyectos

⚙️ CONFIGURACIÓN
  ├─ 👥 Usuarios y Permisos
  ├─ 📅 Año Fiscal
  ├─ 🔌 Integraciones (AFIP, Bancos)
  └─ 🔧 Configuración General
```

#### Implementación del Sidebar con Submenús:
```tsx
// frontend/src/components/Sidebar.tsx

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: MenuItem[];
  badge?: number;
}

const menuStructure: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: '/',
  },
  {
    id: 'facturacion',
    label: 'Facturación',
    icon: <FileText className="h-5 w-5" />,
    children: [
      {
        id: 'upload',
        label: 'Cargar Factura',
        icon: <Upload className="h-4 w-4" />,
        href: '/invoices/upload',
      },
      {
        id: 'invoices',
        label: 'Historial',
        icon: <List className="h-4 w-4" />,
        href: '/invoices',
      },
      {
        id: 'approvals',
        label: 'Aprobaciones',
        icon: <CheckCircle className="h-4 w-4" />,
        href: '/approvals',
        badge: 5, // Pendientes
      },
      {
        id: 'deleted',
        label: 'Eliminadas',
        icon: <Trash2 className="h-4 w-4" />,
        href: '/invoices/deleted',
      },
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: <DollarSign className="h-5 w-5" />,
    children: [
      {
        id: 'balance-iva',
        label: 'Balance IVA',
        icon: <Receipt className="h-4 w-4" />,
        href: '/reports/balance-iva',
      },
      {
        id: 'balance-general',
        label: 'Balance General',
        icon: <TrendingUp className="h-4 w-4" />,
        href: '/reports/balance-general',
      },
      {
        id: 'balance-socios',
        label: 'Balance por Socio',
        icon: <Users className="h-4 w-4" />,
        href: '/reports/by-owner',
      },
      {
        id: 'cash-flow',
        label: 'Cash Flow Proyectos',
        icon: <BarChart3 className="h-4 w-4" />,
        href: '/reports/cash-flow',
      },
      {
        id: 'reportes-fiscales',
        label: 'Reportes Fiscales',
        icon: <FileSpreadsheet className="h-4 w-4" />,
        href: '/reports/fiscal',
      },
    ],
  },
  {
    id: 'gestion',
    label: 'Gestión',
    icon: <Building2 className="h-5 w-5" />,
    children: [
      {
        id: 'partners',
        label: 'Socios',
        icon: <Handshake className="h-4 w-4" />,
        href: '/partners',
      },
      {
        id: 'clients',
        label: 'Clientes',
        icon: <UserCheck className="h-4 w-4" />,
        href: '/clients',
      },
      {
        id: 'suppliers',
        label: 'Proveedores',
        icon: <Package className="h-4 w-4" />,
        href: '/suppliers',
      },
      {
        id: 'projects',
        label: 'Proyectos',
        icon: <FolderOpen className="h-4 w-4" />,
        href: '/projects',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: <Settings className="h-5 w-5" />,
    children: [
      {
        id: 'users',
        label: 'Usuarios y Permisos',
        icon: <Users className="h-4 w-4" />,
        href: '/settings/users',
      },
      {
        id: 'fiscal-year',
        label: 'Año Fiscal',
        icon: <Calendar className="h-4 w-4" />,
        href: '/settings/fiscal-year',
      },
      {
        id: 'integrations',
        label: 'Integraciones',
        icon: <Plug className="h-4 w-4" />,
        href: '/settings/integrations',
      },
      {
        id: 'general',
        label: 'Configuración General',
        icon: <Cog className="h-4 w-4" />,
        href: '/settings/general',
      },
    ],
  },
];

function SidebarMenuItem({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(depth === 0); // Expandir por defecto nivel 1
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <button
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors',
          depth === 0 ? 'font-semibold' : 'font-normal',
          'hover:bg-gray-100',
          'text-gray-700 hover:text-gray-900'
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <div className="flex items-center gap-3">
          {item.icon}
          <span>{item.label}</span>
          {item.badge && (
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </div>
        {hasChildren && (
          isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Submenú */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <SidebarMenuItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xl font-bold text-blue-600">Open Doors</h2>
        <p className="text-xs text-gray-500">Sistema de Gestión</p>
      </div>

      <nav className="px-3 py-4 space-y-2">
        {menuStructure.map((item) => (
          <SidebarMenuItem key={item.id} item={item} />
        ))}
      </nav>
    </aside>
  );
}
```

---

## 5. SISTEMA DE GESTIÓN DE USUARIOS Y PERMISOS

### 🔐 Problema: No Existe Gestión de Roles

**Necesidad:**
- **Admin:** Acceso total
- **Contador:** Solo lectura de reportes fiscales
- **Socio:** Ver sus propias facturas y balance
- **Operario:** Solo cargar facturas

#### Base de Datos - Sistema de Roles:
```sql
-- Enum de roles
CREATE TYPE user_role AS ENUM ('admin', 'contador', 'socio', 'operario', 'readonly');

-- Modificar tabla users
ALTER TABLE users 
ADD COLUMN role user_role DEFAULT 'socio',
ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN is_owner BOOLEAN DEFAULT FALSE,
ADD COLUMN owner_name VARCHAR(50);

-- Tabla de permisos
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar permisos base
INSERT INTO permissions (name, description, category) VALUES
-- Facturas
('invoices.view', 'Ver facturas', 'facturacion'),
('invoices.create', 'Cargar facturas', 'facturacion'),
('invoices.edit', 'Editar facturas', 'facturacion'),
('invoices.delete', 'Eliminar facturas', 'facturacion'),
('invoices.approve', 'Aprobar facturas', 'facturacion'),

-- Reportes
('reports.view_all', 'Ver todos los reportes', 'finanzas'),
('reports.view_own', 'Ver solo sus propios reportes', 'finanzas'),
('reports.export', 'Exportar reportes', 'finanzas'),

-- Usuarios
('users.view', 'Ver usuarios', 'administracion'),
('users.create', 'Crear usuarios', 'administracion'),
('users.edit', 'Editar usuarios', 'administracion'),
('users.delete', 'Eliminar usuarios', 'administracion'),

-- Configuración
('settings.view', 'Ver configuración', 'administracion'),
('settings.edit', 'Editar configuración', 'administracion');

-- Tabla relacional users_permissions
CREATE TABLE user_permissions (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT NOW(),
    granted_by INTEGER REFERENCES users(id),
    PRIMARY KEY (user_id, permission_id)
);
```

#### Backend - Middleware de Permisos:
```python
# src/core/permissions.py

from functools import wraps
from fastapi import HTTPException, status
from typing import List

class PermissionChecker:
    """Decorador para verificar permisos."""
    
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions
    
    def __call__(self, func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Obtener usuario actual (inyectado por Depends)
            current_user = kwargs.get('current_user')
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No autenticado"
                )
            
            # Admin siempre tiene todos los permisos
            if current_user.role == 'admin':
                return await func(*args, **kwargs)
            
            # Verificar permisos específicos
            user_permissions = await self._get_user_permissions(current_user.id)
            
            missing_permissions = set(self.required_permissions) - set(user_permissions)
            
            if missing_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permisos insuficientes. Faltan: {', '.join(missing_permissions)}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    
    async def _get_user_permissions(self, user_id: int) -> List[str]:
        """Obtener lista de permisos del usuario."""
        # Implementar query a base de datos
        pass

# Uso en endpoints
@router.delete("/invoices/{invoice_id}")
@PermissionChecker(['invoices.delete'])
async def delete_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Solo usuarios con permiso 'invoices.delete' pueden eliminar."""
    # Lógica de eliminación
    pass
```

#### Frontend - Página de Gestión de Usuarios:
```tsx
// frontend/src/pages/UsersManagementPage.tsx

export function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const roles = [
    {
      value: 'admin',
      label: 'Administrador',
      description: 'Acceso total al sistema',
      color: 'red',
    },
    {
      value: 'contador',
      label: 'Contador',
      description: 'Acceso a reportes fiscales',
      color: 'blue',
    },
    {
      value: 'socio',
      label: 'Socio',
      description: 'Ver sus propias facturas y balance',
      color: 'green',
    },
    {
      value: 'operario',
      label: 'Operario',
      description: 'Solo cargar facturas',
      color: 'yellow',
    },
    {
      value: 'readonly',
      label: 'Solo Lectura',
      description: 'Ver información sin modificar',
      color: 'gray',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Heading as="h1">Gestión de Usuarios</Heading>
          <Text>Administra usuarios, roles y permisos del sistema</Text>
        </div>
        <Button onClick={() => setShowCreateUserModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Propietario</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>
                        {user.full_name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.full_name}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.is_owner ? (
                    <div className="flex items-center gap-1">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span>{user.owner_name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {user.is_active ? (
                    <Badge variant="success">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleManagePermissions(user)}>
                        <Shield className="h-4 w-4 mr-2" />
                        Permisos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                        <Key className="h-4 w-4 mr-2" />
                        Resetear Contraseña
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleToggleActive(user)}
                        className="text-yellow-600"
                      >
                        {user.is_active ? (
                          <>
                            <Ban className="h-4 w-4 mr-2" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Modal de permisos */}
      <PermissionsModal
        user={selectedUser}
        open={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
      />
    </div>
  );
}
```

---

## 6. RESPONSIVIDAD Y EXPERIENCIA MÓVIL

### 📱 Problema: Sistema No Responsive

**Contexto (Transcripción de Hernán):**
> "Interfaz intuitiva - Acceso desde móvil para cargar facturas en obra"

#### Implementar Diseño Mobile-First:
```tsx
// frontend/src/components/ResponsiveLayout.tsx

export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Drawer en móvil */}
      {isMobile ? (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
      ) : (
        <Sidebar />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header móvil */}
        {isMobile && (
          <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-bold">Open Doors</h1>
            <Avatar>
              <AvatarFallback>FC</AvatarFallback>
            </Avatar>
          </header>
        )}

        {/* Contenido scrolleable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### Componentes Adaptados a Móvil:
```tsx
// frontend/src/components/FinancialOverview.tsx (versión responsive)

export function FinancialOverview() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Cards apilados en móvil, grid en desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ingresos Totales"
          value={formatCurrency(totalIncome)}
          icon={<TrendingUp className="h-5 w-5" />}
          trend="+12.5%"
          trendDirection="up"
        />
        {/* ... más cards */}
      </div>

      {/* Tabla con scroll horizontal en móvil */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Facturas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              {/* Tabla con min-width para scroll */}
              <TableBody className="min-w-[600px]">
                {/* contenido */}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 7. PROCESAMIENTO INTELIGENTE DE FACTURAS

### 🤖 Mejora: Azure Document Intelligence + Validaciones

**Contexto (Transcripción de Hernán):**
> "para una carga y un procesamiento correcto de las facturas y de los datos que vamos a ver en las facturas [...] necesitamos un modelo de inteligencia artificial"

#### Mejorar Agente de Procesamiento:
```python
# src/agents/enhanced_invoice_processing_agent.py (MEJORADO)

from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
import re

class EnhancedInvoiceProcessingAgent:
    """Agente mejorado para procesamiento de facturas argentinas."""
    
    def __init__(self):
        self.document_client = DocumentAnalysisClient(
            endpoint=settings.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
            credential=AzureKeyCredential(settings.AZURE_DOCUMENT_INTELLIGENCE_KEY)
        )
    
    async def process_invoice(self, file_path: str, owner: str) -> dict:
        """
        Procesar factura con validaciones exhaustivas.
        
        Extrae y valida:
        - CUIT emisor y receptor
        - Tipo de factura (A, B, C, X)
        - Número de factura
        - Fecha de emisión
        - Conceptos y montos
        - IVA y subtotales
        - CAE y fecha de vencimiento
        """
        
        # 1. OCR con Azure Document Intelligence
        with open(file_path, "rb") as f:
            poller = self.document_client.begin_analyze_document(
                "prebuilt-invoice",  # Modelo preentrenado de facturas
                document=f
            )
        
        result = poller.result()
        
        # 2. Extraer datos clave
        extracted_data = {
            'cuit_emisor': None,
            'cuit_receptor': None,
            'tipo_factura': None,
            'numero_factura': None,
            'fecha_emision': None,
            'subtotal': 0.0,
            'iva': 0.0,
            'total': 0.0,
            'cae': None,
            'vencimiento_cae': None,
            'items': [],
            'confidence_score': 0.0
        }
        
        # 3. Extraer campos del OCR
        for document in result.documents:
            fields = document.fields
            
            # CUIT (expresión regular argentina)
            if 'CustomerTaxId' in fields:
                cuit_raw = fields['CustomerTaxId'].value
                extracted_data['cuit_receptor'] = self._normalize_cuit(cuit_raw)
            
            if 'VendorTaxId' in fields:
                cuit_raw = fields['VendorTaxId'].value
                extracted_data['cuit_emisor'] = self._normalize_cuit(cuit_raw)
            
            # Número de factura
            if 'InvoiceId' in fields:
                extracted_data['numero_factura'] = fields['InvoiceId'].value
            
            # Fecha
            if 'InvoiceDate' in fields:
                extracted_data['fecha_emision'] = fields['InvoiceDate'].value
            
            # Montos
            if 'SubTotal' in fields:
                extracted_data['subtotal'] = float(fields['SubTotal'].value)
            
            if 'TotalTax' in fields:
                extracted_data['iva'] = float(fields['TotalTax'].value)
            
            if 'InvoiceTotal' in fields:
                extracted_data['total'] = float(fields['InvoiceTotal'].value)
            
            # Items
            if 'Items' in fields:
                for item in fields['Items'].value:
                    extracted_data['items'].append({
                        'description': item.value.get('Description', {}).value,
                        'quantity': item.value.get('Quantity', {}).value,
                        'unit_price': item.value.get('UnitPrice', {}).value,
                        'amount': item.value.get('Amount', {}).value,
                    })
        
        # 4. Detectar tipo de factura (A, B, C, X)
        extracted_data['tipo_factura'] = await self._detect_invoice_type(result)
        
        # 5. Extraer CAE (específico Argentina)
        extracted_data['cae'] = await self._extract_cae(result)
        
        # 6. Validaciones
        validations = await self._validate_invoice(extracted_data)
        extracted_data['validations'] = validations
        extracted_data['is_valid'] = validations['is_valid']
        
        # 7. Clasificar dirección (emitida/recibida)
        extracted_data['direction'] = await self._classify_direction(
            extracted_data['cuit_receptor'],
            extracted_data['cuit_emisor']
        )
        
        # 8. Determinar si genera movimiento de cuenta
        extracted_data['movimiento_cuenta'] = await self._determine_movement(
            extracted_data,
            owner
        )
        
        return extracted_data
    
    def _normalize_cuit(self, cuit_raw: str) -> str:
        """
        Normalizar CUIT argentino a formato XX-XXXXXXXX-X.
        
        Examples:
            '30-71877732-8' → '30-71877732-8'
            '30718777328' → '30-71877732-8'
            'CUIT: 30-71877732-8' → '30-71877732-8'
        """
        # Remover todo excepto dígitos
        digits = re.sub(r'\D', '', cuit_raw)
        
        if len(digits) == 11:
            return f"{digits[0:2]}-{digits[2:10]}-{digits[10]}"
        
        return cuit_raw  # Retornar original si no matchea
    
    async def _detect_invoice_type(self, ocr_result) -> str:
        """
        Detectar tipo de factura argentina (A, B, C, X).
        
        Busca:
        - Letra en header (FACTURA A, FACTURA B, etc)
        - Código AFIP (COD. 01 = A, COD. 06 = B, etc)
        """
        text = ocr_result.content.upper()
        
        # Buscar patrón "FACTURA [LETRA]"
        match = re.search(r'FACTURA\s+([ABCX])', text)
        if match:
            return match.group(1)
        
        # Buscar código AFIP
        codigo_match = re.search(r'COD(?:IGO)?[\.\s:]+(\d+)', text)
        if codigo_match:
            codigo = codigo_match.group(1)
            codigo_map = {
                '01': 'A',
                '06': 'B',
                '11': 'C',
                '51': 'X',
            }
            return codigo_map.get(codigo, 'X')
        
        return 'X'  # Por defecto
    
    async def _extract_cae(self, ocr_result) -> str:
        """Extraer CAE (Código de Autorización Electrónica) de AFIP."""
        text = ocr_result.content
        
        # Buscar patrón CAE: 14 dígitos
        match = re.search(r'CAE[\s:Nn°]+(\d{14})', text)
        if match:
            return match.group(1)
        
        return None
    
    async def _validate_invoice(self, data: dict) -> dict:
        """
        Validar factura según normativa argentina.
        
        Validaciones:
        1. CUIT válido (formato y dígito verificador)
        2. Tipo de factura válido (A, B, C, X)
        3. Montos coherentes (subtotal + IVA = total)
        4. CAE presente y válido
        5. Fecha de emisión no futura
        """
        errors = []
        warnings = []
        
        # 1. Validar CUIT
        if not self._validate_cuit(data['cuit_emisor']):
            errors.append(f"CUIT emisor inválido: {data['cuit_emisor']}")
        
        if not self._validate_cuit(data['cuit_receptor']):
            errors.append(f"CUIT receptor inválido: {data['cuit_receptor']}")
        
        # 2. Validar tipo de factura
        if data['tipo_factura'] not in ['A', 'B', 'C', 'X']:
            errors.append(f"Tipo de factura inválido: {data['tipo_factura']}")
        
        # 3. Validar montos
        calculated_total = data['subtotal'] + data['iva']
        if abs(calculated_total - data['total']) > 1.0:  # Tolerancia de $1
            warnings.append(
                f"Discrepancia en montos: Subtotal ({data['subtotal']}) + "
                f"IVA ({data['iva']}) ≠ Total ({data['total']})"
            )
        
        # 4. Validar CAE (solo facturas electrónicas A, B, C)
        if data['tipo_factura'] in ['A', 'B', 'C'] and not data['cae']:
            warnings.append("CAE no encontrado (obligatorio para facturas electrónicas)")
        
        # 5. Validar fecha
        if data['fecha_emision'] and data['fecha_emision'] > datetime.now():
            errors.append("Fecha de emisión es futura")
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'score': 100 - (len(errors) * 25) - (len(warnings) * 5)
        }
    
    def _validate_cuit(self, cuit: str) -> bool:
        """
        Validar CUIT argentino (dígito verificador).
        
        Algorithm:
        XX-YYYYYYYY-Z donde Z es el dígito verificador calculado.
        """
        if not cuit:
            return False
        
        # Extraer solo dígitos
        digits = re.sub(r'\D', '', cuit)
        
        if len(digits) != 11:
            return False
        
        # Calcular dígito verificador
        multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
        suma = sum(int(digits[i]) * multiplicadores[i] for i in range(10))
        resto = suma % 11
        verificador = 11 - resto
        
        if verificador == 11:
            verificador = 0
        elif verificador == 10:
            verificador = 9
        
        return int(digits[10]) == verificador
    
    async def _classify_direction(self, cuit_receptor: str, cuit_emisor: str) -> str:
        """
        Clasificar si la factura es emitida o recibida.
        
        - Si cuit_emisor = CUIT de Open Doors → emitida
        - Si cuit_receptor = CUIT de Open Doors → recibida
        """
        OPENDOORS_CUIT = "30-71877732-8"  # CUIT de Open Doors S.A.S.
        
        if self._normalize_cuit(cuit_emisor) == OPENDOORS_CUIT:
            return 'emitida'
        elif self._normalize_cuit(cuit_receptor) == OPENDOORS_CUIT:
            return 'recibida'
        
        return 'recibida'  # Por defecto
    
    async def _determine_movement(self, data: dict, owner: str) -> bool:
        """
        Determinar si la factura genera movimiento de cuenta.
        
        Lógica (según transcripciones):
        - Facturas emitidas por trabajos → SÍ
        - Facturas recibidas por subcontratos → SÍ
        - Facturas para recuperar IVA (combustible, etc) → NO
        
        Se puede mejorar con ML o reglas más sofisticadas.
        """
        # Por ahora, preguntar al usuario al cargar
        # En futuro, usar ML para predecir basado en emisor/conceptos
        return None  # Usuario debe especificar
```

---

## 8. EDICIÓN INLINE Y VALIDACIONES

### ✏️ Implementar Edición Inline de Tablas

```tsx
// frontend/src/components/EditableInvoiceTable.tsx

interface EditableCell {
  value: any;
  field: string;
  invoiceId: number;
  editable: boolean;
}

export function EditableInvoiceTable({ invoices }: { invoices: Invoice[] }) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>(null);

  const handleStartEdit = (invoiceId: number, field: string, currentValue: any) => {
    setEditingCell(`${invoiceId}-${field}`);
    setEditValue(currentValue);
  };

  const handleSaveEdit = async (invoiceId: number, field: string) => {
    try {
      // Validar antes de guardar
      const validation = validateField(field, editValue);
      
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }

      // Guardar cambio
      await apiService.updateInvoiceField(invoiceId, field, editValue);
      
      toast.success('Campo actualizado correctamente');
      setEditingCell(null);
      
      // Refrescar datos
      await fetchInvoices();
    } catch (error) {
      toast.error('Error al actualizar campo');
    }
  };

  const validateField = (field: string, value: any) => {
    switch (field) {
      case 'total_amount':
      case 'subtotal':
      case 'tax_amount':
        if (isNaN(value) || value < 0) {
          return { isValid: false, error: 'Monto inválido' };
        }
        break;
      
      case 'invoice_date':
      case 'issue_date':
        if (!isValidDate(value)) {
          return { isValid: false, error: 'Fecha inválida' };
        }
        break;
      
      case 'cuit':
        if (!validateCUIT(value)) {
          return { isValid: false, error: 'CUIT inválido' };
        }
        break;
    }
    
    return { isValid: true };
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Número</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>CUIT</TableHead>
          <TableHead>Subtotal</TableHead>
          <TableHead>IVA</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Movimiento</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            {/* Celda editable - Fecha */}
            <TableCell>
              {editingCell === `${invoice.id}-issue_date` ? (
                <Input
                  type="date"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleSaveEdit(invoice.id, 'issue_date')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(invoice.id, 'issue_date');
                    if (e.key === 'Escape') setEditingCell(null);
                  }}
                  autoFocus
                  className="w-full"
                />
              ) : (
                <div
                  onClick={() => handleStartEdit(invoice.id, 'issue_date', invoice.issue_date)}
                  className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                >
                  {formatDate(invoice.issue_date)}
                </div>
              )}
            </TableCell>

            {/* Celda NO editable - Número */}
            <TableCell>
              <span className="font-mono">{invoice.invoice_number}</span>
            </TableCell>

            {/* Celda editable - Tipo */}
            <TableCell>
              {editingCell === `${invoice.id}-invoice_type` ? (
                <Select
                  value={editValue}
                  onValueChange={(value) => {
                    setEditValue(value);
                    handleSaveEdit(invoice.id, 'invoice_type');
                  }}
                  autoFocus
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="X">X</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  onClick={() => handleStartEdit(invoice.id, 'invoice_type', invoice.invoice_type)}
                  className="cursor-pointer hover:opacity-80"
                >
                  {invoice.invoice_type}
                </Badge>
              )}
            </TableCell>

            {/* Celda editable - Total */}
            <TableCell>
              {editingCell === `${invoice.id}-total_amount` ? (
                <Input
                  type="number"
                  step="0.01"
                  value={editValue}
                  onChange={(e) => setEditValue(parseFloat(e.target.value))}
                  onBlur={() => handleSaveEdit(invoice.id, 'total_amount')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(invoice.id, 'total_amount');
                    if (e.key === 'Escape') setEditingCell(null);
                  }}
                  autoFocus
                  className="w-32"
                />
              ) : (
                <div
                  onClick={() => handleStartEdit(invoice.id, 'total_amount', invoice.total_amount)}
                  className="cursor-pointer hover:bg-gray-50 p-1 rounded font-semibold"
                >
                  {formatCurrency(invoice.total_amount)}
                </div>
              )}
            </TableCell>

            {/* Toggle Movimiento de Cuenta */}
            <TableCell>
              <Switch
                checked={invoice.movimiento_cuenta}
                onCheckedChange={async (checked) => {
                  await apiService.updateInvoiceField(
                    invoice.id,
                    'movimiento_cuenta',
                    checked
                  );
                  toast.success('Movimiento de cuenta actualizado');
                  fetchInvoices();
                }}
              />
            </TableCell>

            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDeleteInvoice(invoice)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 9. CÁLCULOS FINANCIEROS ARGENTINOS

### 💰 Requisitos Específicos de Cálculo

**Según transcripciones:**

1. **Balance IVA:**
   - IVA Emitido (facturas A, B emitidas)
   - IVA Recibido (facturas A, B recibidas)
   - Balance = IVA Emitido - IVA Recibido

2. **Balance General:**
   - Ingresos (facturas emitidas con movimiento=TRUE)
   - Egresos (facturas recibidas con movimiento=TRUE)
   - Balance = Ingresos - Egresos

3. **Impuesto a las Ganancias:**
   - 35% sobre (Ingresos - Egresos)

4. **Impuestos adicionales:**
   - Impuesto al cheque
   - Ingresos brutos
   - Otros tributos

#### Backend - Servicio Completo de Cálculos:
```python
# src/services/financial_calculations_service.py

from decimal import Decimal
from typing import Optional, Dict, Any
from datetime import datetime

class FinancialCalculationsService:
    """Servicio completo de cálculos financieros argentinos."""
    
    def __init__(self, session, fiscal_year_service):
        self.session = session
        self.fiscal_year_service = fiscal_year_service
    
    async def calculate_comprehensive_report(
        self,
        owner: Optional[str] = None,
        fiscal_year: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generar reporte financiero completo con todos los cálculos.
        
        Incluye:
        - Balance IVA
        - Balance General (real y fiscal)
        - Impuesto a las Ganancias
        - Cash flow por proyecto
        - Indicadores de rentabilidad
        """
        
        # Determinar período fiscal
        if not fiscal_year:
            fy = await self.fiscal_year_service.get_current_fiscal_year()
        else:
            fy = await self.fiscal_year_service.get_fiscal_year_range(fiscal_year)
        
        fecha_desde = fy['start_date']
        fecha_hasta = fy['end_date']
        
        # 1. Balance IVA
        balance_iva = await self._calculate_balance_iva(
            owner, fecha_desde, fecha_hasta
        )
        
        # 2. Balance General REAL
        balance_real = await self._calculate_balance_real(
            owner, fecha_desde, fecha_hasta
        )
        
        # 3. Balance General FISCAL
        balance_fiscal = await self._calculate_balance_fiscal(
            owner, fecha_desde, fecha_hasta
        )
        
        # 4. Impuesto a las Ganancias (35%)
        ganancias = await self._calculate_impuesto_ganancias(
            balance_fiscal, fecha_desde, fecha_hasta
        )
        
        # 5. Cash flow por proyecto
        cash_flow_projects = await self._calculate_cash_flow_by_project(
            owner, fecha_desde, fecha_hasta
        )
        
        # 6. Indicadores de rentabilidad
        indicators = await self._calculate_financial_indicators(
            balance_real, balance_fiscal
        )
        
        return {
            'period': {
                'fiscal_year': fy['year'],
                'start_date': fecha_desde,
                'end_date': fecha_hasta,
                'label': fy['label']
            },
            'owner': owner,
            'balance_iva': balance_iva,
            'balance_real': balance_real,
            'balance_fiscal': balance_fiscal,
            'impuesto_ganancias': ganancias,
            'cash_flow_projects': cash_flow_projects,
            'indicators': indicators,
            'generated_at': datetime.now()
        }
    
    async def _calculate_balance_iva(
        self,
        owner: Optional[str],
        fecha_desde: datetime,
        fecha_hasta: datetime
    ) -> Dict[str, Any]:
        """
        Calcular Balance IVA según normativa argentina.
        
        Solo facturas tipo A, B, C (fiscales).
        Facturas X no tienen IVA.
        """
        
        # Query facturas tipo A, B, C
        query = select(
            func.sum(
                case(
                    (Invoice.invoice_direction == 'emitida', Invoice.tax_amount),
                    else_=0
                )
            ).label('iva_emitido'),
            func.sum(
                case(
                    (Invoice.invoice_direction == 'recibida', Invoice.tax_amount),
                    else_=0
                )
            ).label('iva_recibido'),
            func.count(
                case(
                    (Invoice.invoice_direction == 'emitida', 1)
                )
            ).label('facturas_emitidas'),
            func.count(
                case(
                    (Invoice.invoice_direction == 'recibida', 1)
                )
            ).label('facturas_recibidas')
        ).where(
            and_(
                Invoice.invoice_type.in_(['A', 'B', 'C']),  # Solo fiscales
                Invoice.is_deleted == False,
                Invoice.status == 'completed',
                Invoice.issue_date >= fecha_desde,
                Invoice.issue_date <= fecha_hasta
            )
        )
        
        if owner:
            query = query.where(Invoice.owner == owner)
        
        result = await self.session.execute(query)
        row = result.first()
        
        iva_emitido = Decimal(row.iva_emitido or 0)
        iva_recibido = Decimal(row.iva_recibido or 0)
        balance_iva = iva_emitido - iva_recibido
        
        return {
            'iva_emitido': float(iva_emitido),
            'iva_recibido': float(iva_recibido),
            'balance_iva': float(balance_iva),
            'estado': 'A_PAGAR' if balance_iva > 0 else 'A_FAVOR' if balance_iva < 0 else 'NEUTRO',
            'iva_a_favor': float(abs(balance_iva)) if balance_iva < 0 else 0,
            'iva_a_pagar': float(balance_iva) if balance_iva > 0 else 0,
            'facturas_emitidas': row.facturas_emitidas,
            'facturas_recibidas': row.facturas_recibidas,
            'descripcion': 'Balance IVA = IVA Cobrado (ventas) - IVA Pagado (compras)'
        }
    
    async def _calculate_balance_real(
        self,
        owner: Optional[str],
        fecha_desde: datetime,
        fecha_hasta: datetime
    ) -> Dict[str, Any]:
        """
        Balance REAL - Solo facturas con movimiento de cuenta efectivo.
        
        Excluye facturas para recuperar IVA (combustible, etc).
        """
        
        query = select(
            func.sum(
                case(
                    (Invoice.invoice_direction == 'emitida', Invoice.total_amount),
                    else_=0
                )
            ).label('ingresos'),
            func.sum(
                case(
                    (Invoice.invoice_direction == 'recibida', Invoice.total_amount),
                    else_=0
                )
            ).label('egresos')
        ).where(
            and_(
                Invoice.movimiento_cuenta == True,  # ← CLAVE: solo movimiento real
                Invoice.is_deleted == False,
                Invoice.status == 'completed',
                Invoice.issue_date >= fecha_desde,
                Invoice.issue_date <= fecha_hasta
            )
        )
        
        if owner:
            query = query.where(Invoice.owner == owner)
        
        result = await self.session.execute(query)
        row = result.first()
        
        ingresos = Decimal(row.ingresos or 0)
        egresos = Decimal(row.egresos or 0)
        balance = ingresos - egresos
        
        return {
            'ingresos': float(ingresos),
            'egresos': float(egresos),
            'balance': float(balance),
            'margen': float((balance / ingresos * 100)) if ingresos > 0 else 0,
            'tipo': 'BALANCE_REAL',
            'descripcion': 'Solo facturas con movimiento de cuenta efectivo'
        }
    
    async def _calculate_balance_fiscal(
        self,
        owner: Optional[str],
        fecha_desde: datetime,
        fecha_hasta: datetime
    ) -> Dict[str, Any]:
        """
        Balance FISCAL - Todas las facturas (incluye compensación IVA).
        Este es el que se presenta a AFIP.
        """
        
        query = select(
            func.sum(
                case(
                    (Invoice.invoice_direction == 'emitida', Invoice.total_amount),
                    else_=0
                )
            ).label('ingresos'),
            func.sum(
                case(
                    (Invoice.invoice_direction == 'recibida', Invoice.total_amount),
                    else_=0
                )
            ).label('egresos')
        ).where(
            and_(
                # NO filtrar por movimiento_cuenta (incluir todas)
                Invoice.is_deleted == False,
                Invoice.status == 'completed',
                Invoice.issue_date >= fecha_desde,
                Invoice.issue_date <= fecha_hasta
            )
        )
        
        if owner:
            query = query.where(Invoice.owner == owner)
        
        result = await self.session.execute(query)
        row = result.first()
        
        ingresos = Decimal(row.ingresos or 0)
        egresos = Decimal(row.egresos or 0)
        balance = ingresos - egresos
        
        return {
            'ingresos': float(ingresos),
            'egresos': float(egresos),
            'balance': float(balance),
            'tipo': 'BALANCE_FISCAL',
            'descripcion': 'Todas las facturas (incluye compensación IVA para AFIP)'
        }
    
    async def _calculate_impuesto_ganancias(
        self,
        balance_fiscal: Dict[str, Any],
        fecha_desde: datetime,
        fecha_hasta: datetime
    ) -> Dict[str, Any]:
        """
        Calcular Impuesto a las Ganancias (35% en Argentina).
        
        Base imponible = Ingresos - Egresos (del balance fiscal).
        """
        
        settings = await self.fiscal_year_service.get_fiscal_settings()
        tasa_ganancias = settings.ganancias_rate  # 35.00%
        
        base_imponible = Decimal(balance_fiscal['balance'])
        
        if base_imponible <= 0:
            # No hay ganancias, no se paga impuesto
            return {
                'base_imponible': 0,
                'tasa': float(tasa_ganancias),
                'impuesto': 0,
                'estado': 'SIN_GANANCIAS',
                'descripcion': 'No hay ganancias imponibles en el período'
            }
        
        impuesto = base_imponible * (tasa_ganancias / 100)
        
        return {
            'base_imponible': float(base_imponible),
            'tasa': float(tasa_ganancias),
            'impuesto': float(impuesto),
            'estado': 'A_PAGAR',
            'descripcion': f'Impuesto a las Ganancias ({tasa_ganancias}% sobre utilidad fiscal)'
        }
    
    async def _calculate_cash_flow_by_project(
        self,
        owner: Optional[str],
        fecha_desde: datetime,
        fecha_hasta: datetime
    ) -> List[Dict[str, Any]]:
        """
        Calcular cash flow por proyecto.
        
        Agrupa facturas por proyecto (campo project_id o project_name).
        """
        
        # Implementar según modelo de proyectos
        # Por ahora retornar estructura esperada
        
        return []
    
    async def _calculate_financial_indicators(
        self,
        balance_real: Dict[str, Any],
        balance_fiscal: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calcular indicadores de gestión.
        
        - Rentabilidad real
        - Rentabilidad fiscal
        - Ratio ingresos/egresos
        - Margen de utilidad
        """
        
        ingresos_reales = Decimal(balance_real['ingresos'])
        egresos_reales = Decimal(balance_real['egresos'])
        
        return {
            'rentabilidad_real': float(balance_real['margen']),
            'ratio_ingresos_egresos': float(ingresos_reales / egresos_reales) if egresos_reales > 0 else 0,
            'utilidad_neta': float(balance_real['balance']),
            'utilidad_fiscal': float(balance_fiscal['balance']),
            'diferencia_real_fiscal': float(
                Decimal(balance_fiscal['balance']) - Decimal(balance_real['balance'])
            ),
        }
```

---

## 10. INTEGRACIONES CON APIs EXTERNAS

### 🔌 Integración con AFIP (Clave)

**Contexto:**
Según transcripciones, necesitan validar CAE, consultar padrón de contribuyentes, y generar comprobantes electrónicos.

#### SDK de AFIP:
```python
# src/integrations/afip_client.py

import zeep
from zeep.transports import Transport
from requests import Session
from lxml import etree

class AFIPClient:
    """Cliente para integración con AFIP (Argentina)."""
    
    WSAA_URL = 'https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl'
    WSFEv1_URL = 'https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL'
    
    def __init__(self, cuit: str, certificate_path: str, private_key_path: str):
        self.cuit = cuit
        self.certificate_path = certificate_path
        self.private_key_path = private_key_path
        self.token = None
        self.sign = None
    
    async def authenticate(self):
        """
        Autenticar con WSAA (Web Service de Autenticación y Autorización).
        
        Retorna token y sign válidos por 12 horas.
        """
        # Generar TRA (Ticket de Requerimiento de Acceso)
        tra = self._generate_tra('wsfe')
        
        # Firmar TRA con certificado
        cms = self._sign_tra(tra)
        
        # Enviar a WSAA
        client = zeep.Client(wsdl=self.WSAA_URL)
        response = client.service.loginCms(in0=cms)
        
        # Parsear respuesta
        tree = etree.fromstring(response.encode('utf-8'))
        
        self.token = tree.find('.//token').text
        self.sign = tree.find('.//sign').text
        
        return {
            'token': self.token,
            'sign': self.sign
        }
    
    async def validate_cae(self, cae: str, tipo_cbte: int, punto_venta: int, numero_cbte: int) -> bool:
        """
        Validar CAE (Código de Autorización Electrónica) con AFIP.
        
        Args:
            cae: CAE a validar (14 dígitos)
            tipo_cbte: Tipo de comprobante (1=Factura A, 6=Factura B, etc)
            punto_venta: Punto de venta
            numero_cbte: Número de comprobante
        
        Returns:
            True si el CAE es válido
        """
        if not self.token:
            await self.authenticate()
        
        client = zeep.Client(wsdl=self.WSFEv1_URL)
        
        response = client.service.FECAEASinMovimientoConsultar(
            Auth={
                'Token': self.token,
                'Sign': self.sign,
                'Cuit': self.cuit
            },
            CAEA=cae,
            PtoVta=punto_venta
        )
        
        return response.ResultGet.Resultado == 'A'  # A = Aprobado
    
    async def get_taxpayer_info(self, cuit: str) -> dict:
        """
        Consultar información de contribuyente en padrón AFIP.
        
        Returns:
            {
                'cuit': '30-71877732-8',
                'razon_social': 'RESOURCES OPEN DOORS S.A.S.',
                'tipo_persona': 'JURIDICA',
                'estado': 'ACTIVO',
                'condicion_iva': 'RESPONSABLE_INSCRIPTO',
                'actividades': [...]
            }
        """
        # Implementar consulta a ws_sr_padron_a5
        pass
    
    async def generate_electronic_invoice(
        self,
        tipo_cbte: int,
        punto_venta: int,
        concepto: int,
        doc_tipo: int,
        doc_nro: str,
        importe_total: float,
        importe_neto: float,
        importe_iva: float
    ) -> dict:
        """
        Generar factura electrónica en AFIP.
        
        Returns:
            {
                'cae': '75311342565054',
                'fecha_vto_cae': '2025-08-09',
                'numero_cbte': 305,
                'resultado': 'A',
                'observaciones': []
            }
        """
        if not self.token:
            await self.authenticate()
        
        client = zeep.Client(wsdl=self.WSFEv1_URL)
        
        # Obtener último número de comprobante
        ultimo_cbte = client.service.FECompUltimoAutorizado(
            Auth={
                'Token': self.token,
                'Sign': self.sign,
                'Cuit': self.cuit
            },
            PtoVta=punto_venta,
            CbteTipo=tipo_cbte
        )
        
        numero_cbte = ultimo_cbte.CbteNro + 1
        
        # Solicitar CAE
        response = client.service.FECAESolicitar(
            Auth={
                'Token': self.token,
                'Sign': self.sign,
                'Cuit': self.cuit
            },
            FeCAEReq={
                'FeCabReq': {
                    'CantReg': 1,
                    'PtoVta': punto_venta,
                    'CbteTipo': tipo_cbte
                },
                'FeDetReq': {
                    'FECAEDetRequest': {
                        'Concepto': concepto,
                        'DocTipo': doc_tipo,
                        'DocNro': doc_nro,
                        'CbteDesde': numero_cbte,
                        'CbteHasta': numero_cbte,
                        'CbteFch': datetime.now().strftime('%Y%m%d'),
                        'ImpTotal': importe_total,
                        'ImpTotConc': 0,
                        'ImpNeto': importe_neto,
                        'ImpOpEx': 0,
                        'ImpIVA': importe_iva,
                        'ImpTrib': 0,
                        'MonId': 'PES',
                        'MonCotiz': 1,
                        'Iva': {
                            'AlicIva': {
                                'Id': 5,  # 21%
                                'BaseImp': importe_neto,
                                'Importe': importe_iva
                            }
                        }
                    }
                }
            }
        )
        
        if response.FeCabResp.Resultado == 'A':
            det_response = response.FeDetResp.FECAEDetResponse[0]
            
            return {
                'cae': det_response.CAE,
                'fecha_vto_cae': det_response.CAEFchVto,
                'numero_cbte': numero_cbte,
                'resultado': 'A',
                'observaciones': []
            }
        else:
            # Error en la solicitud
            return {
                'resultado': 'R',  # Rechazado
                'errores': response.Errors.Err if response.Errors else [],
                'observaciones': response.Obs.Obs if response.Obs else []
            }
```

#### Frontend - Configuración de Integración:
```tsx
// frontend/src/pages/IntegrationsPage.tsx

export function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <Heading as="h1">Integraciones</Heading>

      {/* AFIP */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>AFIP (Argentina)</CardTitle>
                <Text className="text-sm">
                  Validación de CAE, consulta de padrón, facturación electrónica
                </Text>
              </div>
            </div>
            <Badge variant={afipConnected ? 'success' : 'secondary'}>
              {afipConnected ? 'Conectado' : 'No configurado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>CUIT de la Empresa</Label>
              <Input
                placeholder="XX-XXXXXXXX-X"
                value={afipCuit}
                onChange={(e) => setAfipCuit(e.target.value)}
              />
            </div>
            
            <div>
              <Label>Certificado (.crt)</Label>
              <Input
                type="file"
                accept=".crt"
                onChange={handleCertificateUpload}
              />
            </div>
            
            <div>
              <Label>Clave Privada (.key)</Label>
              <Input
                type="file"
                accept=".key"
                onChange={handlePrivateKeyUpload}
              />
            </div>

            <Button onClick={handleTestAFIPConnection}>
              <Zap className="h-4 w-4 mr-2" />
              Probar Conexión
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bancos */}
      <Card>
        <CardHeader>
          <CardTitle>Integración Bancaria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BankIntegrationCard
              name="Banco Nación"
              icon="🏦"
              connected={false}
            />
            <BankIntegrationCard
              name="Banco Galicia"
              icon="🏦"
              connected={false}
            />
            <BankIntegrationCard
              name="Mercado Pago"
              icon="💳"
              connected={false}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 11. SEGURIDAD Y CUMPLIMIENTO

### 🔒 Medidas de Seguridad

1. **Encriptación de datos sensibles**
2. **Auditoría de acciones**
3. **2FA opcional**
4. **Backup automático**
5. **Cumplimiento GDPR/Ley de Protección de Datos Argentina**

```python
# src/core/security.py (MEJORADO)

from cryptography.fernet import Fernet
import hashlib
import secrets

class SecurityService:
    """Servicio de seguridad mejorado."""
    
    @staticmethod
    def encrypt_sensitive_data(data: str, key: bytes) -> str:
        """Encriptar datos sensibles (CUIT, CAE, etc)."""
        f = Fernet(key)
        return f.encrypt(data.encode()).decode()
    
    @staticmethod
    def decrypt_sensitive_data(encrypted_data: str, key: bytes) -> str:
        """Desencriptar datos sensibles."""
        f = Fernet(key)
        return f.decrypt(encrypted_data.encode()).decode()
    
    @staticmethod
    async def log_audit_event(
        user_id: int,
        action: str,
        resource: str,
        details: dict,
        session: AsyncSession
    ):
        """
        Registrar evento de auditoría.
        
        Examples:
            - action: 'invoice.delete'
            - resource: 'Invoice #305'
            - details: {'invoice_id': 305, 'reason': 'Duplicada'}
        """
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            details=details,
            ip_address=request.client.host,
            user_agent=request.headers.get('user-agent'),
            timestamp=datetime.now()
        )
        session.add(audit_log)
        await session.commit()
```

---

## 12. PLAN DE IMPLEMENTACIÓN DETALLADO

### 📅 FASE 1: Fundaciones (Semana 1-2)

#### Sprint 1.1: Base de Datos y Configuración
- [ ] Crear tabla `fiscal_settings`
- [ ] Crear tabla `user_permissions`
- [ ] Agregar campos `movimiento_cuenta`, `tipo_contabilidad` a `invoices`
- [ ] Migración de base de datos
- [ ] Seeders de datos iniciales

#### Sprint 1.2: Sistema de Usuarios y Permisos
- [ ] Implementar modelo de roles
- [ ] Middleware de permisos
- [ ] Página de gestión de usuarios
- [ ] Tests de autorización

---

### 📅 FASE 2: Diseño y UX (Semana 3-4)

#### Sprint 2.1: Sistema de Diseño
- [ ] Definir design tokens
- [ ] Crear componentes de tipografía
- [ ] Refactorizar páginas con nuevos componentes
- [ ] Guía de estilo (Storybook opcional)

#### Sprint 2.2: Navegación y Menú
- [ ] Implementar sidebar con submenús
- [ ] Breadcrumbs
- [ ] Responsive layout
- [ ] Mobile menu (drawer)

---

### 📅 FASE 3: Funcionalidad Core (Semana 5-7)

#### Sprint 3.1: Año Fiscal
- [ ] Servicio de año fiscal
- [ ] Selector de año fiscal en frontend
- [ ] Filtros por período fiscal

#### Sprint 3.2: Dos Contabilidades
- [ ] Endpoints balance real vs fiscal
- [ ] UI para selector de tipo de balance
- [ ] Reportes comparativos

#### Sprint 3.3: Balance por Propietario
- [ ] Cálculos individuales
- [ ] UI de balance por socio
- [ ] Exportación de reportes

---

### 📅 FASE 4: Procesamiento Inteligente (Semana 8-9)

#### Sprint 4.1: Mejora de Agente IA
- [ ] Validaciones exhaustivas (CUIT, montos, CAE)
- [ ] Detección automática de tipo de factura
- [ ] Sugerencia de movimiento_cuenta con ML

#### Sprint 4.2: Edición Inline
- [ ] Componente EditableTable
- [ ] Validaciones en tiempo real
- [ ] Guardado optimista con rollback

---

### 📅 FASE 5: Integraciones (Semana 10-11)

#### Sprint 5.1: AFIP
- [ ] Cliente AFIP (WSAA, WSFEv1)
- [ ] Validación de CAE
- [ ] Consulta de padrón
- [ ] Facturación electrónica

#### Sprint 5.2: Bancos y Billeteras
- [ ] Integración Mercado Pago
- [ ] Integración banco (API disponible)
- [ ] Reconciliación automática

---

### 📅 FASE 6: Cash Flow y Proyectos (Semana 12-13)

#### Sprint 6.1: Modelo de Proyectos
- [ ] Tabla `projects`
- [ ] Relación invoices ↔ projects
- [ ] CRUD de proyectos

#### Sprint 6.2: Cash Flow por Proyecto
- [ ] Cálculos de cash flow
- [ ] Dashboard de proyecto individual
- [ ] Gráficos de rentabilidad

---

### 📅 FASE 7: Testing y Optimización (Semana 14)

#### Sprint 7.1: Testing
- [ ] Tests unitarios (>70% coverage)
- [ ] Tests E2E con Playwright
- [ ] Tests de carga (Locust)

#### Sprint 7.2: Optimización
- [ ] Índices de base de datos
- [ ] Caché de API
- [ ] Lazy loading
- [ ] Compresión GZip

---

### 📅 FASE 8: Documentación y Deploy (Semana 15)

#### Sprint 8.1: Documentación
- [ ] Manual de usuario
- [ ] Documentación técnica
- [ ] Videos tutoriales

#### Sprint 8.2: Deploy
- [ ] Setup staging
- [ ] Setup producción
- [ ] Monitoreo (Sentry, logs)
- [ ] Backup automático

---

## 📊 RESUMEN DE MÉTRICAS OBJETIVO

### Diseño y UX
- ✅ **Tipografía unificada:** Sistema de design tokens implementado
- ✅ **Menú organizado:** 4 categorías con submenús
- ✅ **Mobile responsive:** Funcional en dispositivos 375px+
- ✅ **Tiempo de carga:** < 2 segundos (LCP)

### Funcionalidad
- ✅ **Año fiscal:** Configurable (Mayo-Abril por defecto)
- ✅ **Dos contabilidades:** Real y Fiscal separadas
- ✅ **Balance por socio:** Hernán, Joni, Leo, Maxi
- ✅ **Edición inline:** Facturas editables directamente en tabla
- ✅ **Validación CUIT:** 100% de CUITs válidos

### Procesamiento IA
- ✅ **Precisión OCR:** > 95% en campos clave
- ✅ **Detección tipo factura:** > 98% accuracy
- ✅ **Validación CAE:** 100% (con AFIP)
- ✅ **Tiempo procesamiento:** < 5 segundos por factura

### Seguridad
- ✅ **Roles implementados:** 5 niveles (admin, contador, socio, operario, readonly)
- ✅ **Auditoría:** Log de todas las acciones críticas
- ✅ **Encriptación:** Datos sensibles encriptados (CUIT, CAE)
- ✅ **Backup:** Diario automático

### Integraciones
- ✅ **AFIP:** Validación CAE, facturación electrónica
- ✅ **Bancos:** Al menos 1 integración funcional
- ✅ **Billeteras:** Mercado Pago conectado

---

## 🎯 CONCLUSIÓN

Este informe documenta **14 áreas de mejora** con **87 tareas específicas** para llevar Open Doors a un sistema de gestión empresarial completo y profesional que cumpla con todos los requisitos de Hernán, Joni, Leo y Maxi.

**Tiempo estimado total:** 15 semanas (3.5 meses) con 1 desarrollador full-time

**Beneficios esperados:**
- 🎨 100% coherencia visual y UX intuitiva
- 📊 Sistema completo de dos contabilidades (real + fiscal)
- 💰 Cálculos financieros precisos según normativa argentina
- 🤖 Procesamiento inteligente de facturas con IA
- 🔐 Seguridad y permisos granulares
- 📱 Experiencia móvil optimizada
- 🔌 Integración con AFIP y bancos

**Stakeholders satisfechos:**
- ✅ Hernán: Indicadores de gestión, dashboards configurables
- ✅ Joni: Balance IVA, balance por socio, cash flow por proyecto
- ✅ Leo/Maxi: Tracking individual de facturas y balance personal
- ✅ Contador: Reportes fiscales listos para AFIP

---

**Fecha del Informe:** 2 de Octubre, 2025  
**Versión:** 2.0  
**Estado:** Listo para implementación completa

---

**Contacto:**
- Franco Nicolás Corts Romeo
- Email: cortsfranco@hotmail.com
- Sistema: Open Doors - Gestión Empresarial con IA
