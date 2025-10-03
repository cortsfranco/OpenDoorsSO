"""
Servicio de cálculos financieros usando el modelo actualizado.
"""

from typing import Optional, Dict, Any
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, case, cast, Float
from src.models.invoice import Invoice


class FinancialService:
    """
    Servicio para cálculos financieros y fiscales usando el nuevo modelo de Invoice.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_balance_iva(
        self,
        owner: Optional[str] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Calcula el Balance IVA según normativa argentina.
        REGLA DE JONI: Solo facturas tipo A.
        
        Balance IVA = IVA de facturas EMITIDAS - IVA de facturas RECIBIDAS
        
        Args:
            owner: Filtrar por propietario (Hernán, Joni, Maxi, Leo, Franco)
            fecha_desde: Fecha inicio del período
            fecha_hasta: Fecha fin del período
        """
        filters = [
            Invoice.tipo_factura == 'A',
            Invoice.is_deleted == False
        ]
        
        if owner:
            filters.append(Invoice.owner == owner)
        if fecha_desde:
            filters.append(Invoice.fecha_emision >= fecha_desde)
        if fecha_hasta:
            filters.append(Invoice.fecha_emision <= fecha_hasta)
        
        query = select(
            func.sum(
                case(
                    (Invoice.invoice_direction == 'emitida', cast(Invoice.iva_monto, Float)),
                    else_=0
                )
            ).label('iva_ventas'),
            func.sum(
                case(
                    (Invoice.invoice_direction == 'recibida', cast(Invoice.iva_monto, Float)),
                    else_=0
                )
            ).label('iva_compras')
        ).where(and_(*filters))
        
        result = await self.session.execute(query)
        row = result.first()
        
        iva_ventas = float(row.iva_ventas or 0) if row else 0.0
        iva_compras = float(row.iva_compras or 0) if row else 0.0
        balance_iva = iva_ventas - iva_compras
        
        return {
            "balance_iva": balance_iva,
            "iva_debito_fiscal": iva_ventas,
            "iva_credito_fiscal": iva_compras,
            "estado": "a_pagar" if balance_iva > 0 else "a_favor" if balance_iva < 0 else "neutro",
            "descripcion": "Balance IVA solo de facturas tipo A (IVA Ventas - IVA Compras)"
        }
    
    async def get_balance_general(
        self,
        owner: Optional[str] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Calcula el Balance General (flujo de caja real).
        REGLA DE JONI: Solo facturas con movimiento_cuenta = True.
        
        Args:
            owner: Filtrar por propietario (Hernán, Joni, Maxi, Leo, Franco)
            fecha_desde: Fecha inicio del período
            fecha_hasta: Fecha fin del período
        """
        filters = [
            Invoice.movimiento_cuenta == True,
            Invoice.is_deleted == False
        ]
        
        if owner:
            filters.append(Invoice.owner == owner)
        if fecha_desde:
            filters.append(Invoice.fecha_emision >= fecha_desde)
        if fecha_hasta:
            filters.append(Invoice.fecha_emision <= fecha_hasta)
        
        query = select(
            func.sum(
                case(
                    (Invoice.invoice_direction == 'emitida', cast(Invoice.total, Float)),
                    else_=0
                )
            ).label('ingresos'),
            func.sum(
                case(
                    (Invoice.invoice_direction == 'recibida', cast(Invoice.total, Float)),
                    else_=0
                )
            ).label('egresos')
        ).where(and_(*filters))
        
        result = await self.session.execute(query)
        row = result.first()
        
        ingresos = float(row.ingresos or 0) if row else 0.0
        egresos = float(row.egresos or 0) if row else 0.0
        balance = ingresos - egresos
        
        return {
            "balance_general": balance,
            "ingresos_totales": ingresos,
            "egresos_totales": egresos,
            "estado": "positivo" if balance > 0 else "negativo" if balance < 0 else "neutro",
            "descripcion": "Flujo de caja real (solo movimiento_cuenta=SI)"
        }
    
    async def get_balance_por_socio(
        self,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Obtiene el balance de IVA y General separado por socio.
        
        Args:
            fecha_desde: Fecha inicio del período
            fecha_hasta: Fecha fin del período
        """
        socios = ['Hernán', 'Joni', 'Maxi', 'Leo', 'Franco']
        resultados = {}
        
        for socio in socios:
            balance_iva = await self.get_balance_iva(socio, fecha_desde, fecha_hasta)
            balance_general = await self.get_balance_general(socio, fecha_desde, fecha_hasta)
            
            resultados[socio] = {
                'balance_iva': balance_iva,
                'balance_general': balance_general
            }
        
        return resultados
