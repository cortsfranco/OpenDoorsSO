from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, case, Float
from src.models.invoice import Invoice


class FinancialService:
    """Servicio para cálculos financieros y fiscales."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_balance_iva(
        self,
        owner: Optional[str] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Calcula el Balance IVA según normativa argentina.
        
        Balance IVA = IVA de facturas EMITIDAS - IVA de facturas RECIBIDAS
        Solo se consideran facturas fiscales (A, B, C), no las X.
        
        Args:
            owner: Filtrar por propietario (Hernán, Joni, Maxi, Leo)
            fecha_desde: Fecha inicio del período
            fecha_hasta: Fecha fin del período
        """
        filters = [
            Invoice.invoice_type.in_(['A', 'B', 'C'])
        ]
        
        # TODO: Implementar filtro por owner cuando el campo esté disponible
        # if owner:
        #     filters.append(Invoice.owner == owner)
        if fecha_desde:
            filters.append(Invoice.issue_date >= fecha_desde)
        if fecha_hasta:
            filters.append(Invoice.issue_date <= fecha_hasta)
        
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
            ).label('iva_recibido')
        ).where(and_(*filters))
        
        result = await self.session.execute(query)
        row = result.first()
        
        iva_emitido = float(row.iva_emitido or 0)
        iva_recibido = float(row.iva_recibido or 0)
        balance_iva = iva_emitido - iva_recibido
        
        return {
            "balance_iva": balance_iva,
            "iva_emitido_total": iva_emitido,
            "iva_recibido_total": iva_recibido,
            "estado": "A FAVOR" if balance_iva > 0 else "A PAGAR" if balance_iva < 0 else "NEUTRO",
            "descripcion": "Balance IVA = IVA Cobrado (ventas) - IVA Pagado (compras)"
        }
    
    async def get_balance_general(
        self,
        owner: Optional[str] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Calcula el Balance General (flujo de caja real).
        
        Solo cuenta facturas que REALMENTE movieron dinero (movimiento_cuenta = True).
        Balance General = Ingresos (emitidas pagadas) - Egresos (recibidas pagadas)
        
        Args:
            owner: Filtrar por propietario (Hernán, Joni, Maxi, Leo)
            fecha_desde: Fecha inicio del período
            fecha_hasta: Fecha fin del período
        """
        filters = [
            Invoice.movimiento_cuenta == True
        ]
        
        # TODO: Implementar filtro por owner cuando el campo esté disponible
        # if owner:
        #     filters.append(Invoice.owner == owner)
        if fecha_desde:
            filters.append(Invoice.issue_date >= fecha_desde)
        if fecha_hasta:
            filters.append(Invoice.issue_date <= fecha_hasta)
        
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
        ).where(and_(*filters))
        
        result = await self.session.execute(query)
        row = result.first()
        
        ingresos = float(row.ingresos or 0)
        egresos = float(row.egresos or 0)
        balance = ingresos - egresos
        
        return {
            "balance_general": balance,
            "ingresos_totales": ingresos,
            "egresos_totales": egresos,
            "estado": "POSITIVO" if balance > 0 else "NEGATIVO" if balance < 0 else "NEUTRO",
            "descripcion": "Flujo de caja real (solo facturas que movieron dinero en cuenta)"
        }
