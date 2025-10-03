from decimal import Decimal
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case, Float

from src.models.invoice import Invoice
from src.services.fiscal_year_service import FiscalYearService

class FinancialCalculationsService:
    """Servicio completo de cálculos financieros argentinos."""
    
    def __init__(self, session: AsyncSession, fiscal_year_service: FiscalYearService):
        self.session = session
        self.fiscal_year_service = fiscal_year_service
    
    async def calculate_comprehensive_report(
        self,
        owner: Optional[str] = None,
        fiscal_year: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generar reporte financiero completo con todos los cálculos.
        """
        
        if not fiscal_year:
            fy = await self.fiscal_year_service.get_current_fiscal_year()
        else:
            fy = await self.fiscal_year_service.get_fiscal_year_range(fiscal_year)
        
        fecha_desde = fy['start_date']
        fecha_hasta = fy['end_date']
        
        balance_iva = await self._calculate_balance_iva(
            owner, fecha_desde, fecha_hasta
        )
        
        balance_real = await self._calculate_balance_real(
            owner, fecha_desde, fecha_hasta
        )
        
        balance_fiscal = await self._calculate_balance_fiscal(
            owner, fecha_desde, fecha_hasta
        )
        
        ganancias = await self._calculate_impuesto_ganancias(
            balance_fiscal, fecha_desde, fecha_hasta
        )
        
        cash_flow_projects = await self._calculate_cash_flow_by_project(
            owner, fecha_desde, fecha_hasta
        )
        
        indicators = await self._calculate_financial_indicators(
            balance_real, balance_fiscal
        )
        
        return {
            'period': {
                'fiscal_year': fy['year'],
                'start_date': fecha_desde.isoformat(),
                'end_date': fecha_hasta.isoformat(),
                'label': fy['label']
            },
            'owner': owner,
            'balance_iva': balance_iva,
            'balance_real': balance_real,
            'balance_fiscal': balance_fiscal,
            'impuesto_ganancias': ganancias,
            'cash_flow_projects': cash_flow_projects,
            'indicators': indicators,
            'generated_at': datetime.now().isoformat()
        }
    
    async def _calculate_balance_iva(
        self,
        owner: Optional[str],
        fecha_desde: date,
        fecha_hasta: date
    ) -> Dict[str, Any]:
        """Calcular Balance IVA según normativa argentina."""
        
        # Usar una subconsulta para extraer monto_iva del JSON
        query = select(
            func.sum(
                case(
                    (Invoice.invoice_direction == 'emitida', 
                     func.cast(func.json_extract(Invoice.extracted_data, '$.monto_iva'), Float)),
                    else_=0
                )
            ).label('iva_emitido'),
            func.sum(
                case(
                    (Invoice.invoice_direction == 'recibida', 
                     func.cast(func.json_extract(Invoice.extracted_data, '$.monto_iva'), Float)),
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
                Invoice.is_deleted == False,
                Invoice.status == 'completed',
                Invoice.upload_date >= fecha_desde,
                Invoice.upload_date <= fecha_hasta
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
        fecha_desde: date,
        fecha_hasta: date
    ) -> Dict[str, Any]:
        """Balance REAL - Solo facturas con movimiento de cuenta efectivo."""
        
        query = select(
            func.sum(
                case(
                    (Invoice.invoice_direction == 'emitida', Invoice.monto_total),
                    else_=0
                )
            ).label('ingresos'),
            func.sum(
                case(
                    (Invoice.invoice_direction == 'recibida', Invoice.monto_total),
                    else_=0
                )
            ).label('egresos')
        ).where(
            and_(
                Invoice.movimiento_cuenta == True,
                Invoice.is_deleted == False,
                Invoice.status == 'completed',
                Invoice.fecha_emision >= fecha_desde,
                Invoice.fecha_emision <= fecha_hasta
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
        fecha_desde: date,
        fecha_hasta: date
    ) -> Dict[str, Any]:
        """Balance FISCAL - Todas las facturas (incluye compensación IVA)."""
        
        query = select(
            func.sum(
                case(
                    (Invoice.invoice_direction == 'emitida', Invoice.monto_total),
                    else_=0
                )
            ).label('ingresos'),
            func.sum(
                case(
                    (Invoice.invoice_direction == 'recibida', Invoice.monto_total),
                    else_=0
                )
            ).label('egresos')
        ).where(
            and_(
                Invoice.is_deleted == False,
                Invoice.status == 'completed',
                Invoice.fecha_emision >= fecha_desde,
                Invoice.fecha_emision <= fecha_hasta
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
        fecha_desde: date,
        fecha_hasta: date
    ) -> Dict[str, Any]:
        """Calcular Impuesto a las Ganancias (35% en Argentina)."""
        
        settings = await self.fiscal_year_service.get_fiscal_settings()
        tasa_ganancias = settings.ganancias_rate
        
        base_imponible = Decimal(balance_fiscal['balance'])
        
        if base_imponible <= 0:
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
        fecha_desde: date,
        fecha_hasta: date
    ) -> List[Dict[str, Any]]:
        """Calcular cash flow por proyecto."""
        # TODO: Implementar según modelo de proyectos
        return []
    
    async def _calculate_financial_indicators(
        self,
        balance_real: Dict[str, Any],
        balance_fiscal: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calcular indicadores de gestión."""
        
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