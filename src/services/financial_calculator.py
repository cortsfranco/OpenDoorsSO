from decimal import Decimal
from typing import List, Dict, Optional
from datetime import date
from src.models.invoice import Invoice, TipoFactura, MovimientoCuenta

class FinancialCalculator:
    """
    Calculadora centralizada para lógica fiscal argentina según Joni.
    
    REGLAS DE NEGOCIO CRÍTICAS:
    1. Balance IVA = SOLO facturas tipo A (IVA emitido - IVA recibido)
    2. Balance General = SOLO facturas con movimiento_cuenta=SI (flujo caja real)
    3. Formato moneda: $1.234,56 (punto miles, coma decimales)
    """
    
    @staticmethod
    def calcular_balance_iva(
        facturas_emitidas: List[Invoice],
        facturas_recibidas: List[Invoice]
    ) -> Dict[str, Decimal]:
        """
        Calcula Balance IVA según normativa argentina.
        SOLO facturas tipo A (con IVA discriminado).
        """
        # IVA emitido (facturas de venta tipo A)
        iva_emitido = sum(
            f.monto_iva 
            for f in facturas_emitidas 
            if f.tipo_factura == TipoFactura.A and not f.es_compensacion_iva
        )
        
        # IVA recibido (facturas de compra tipo A)
        iva_recibido = sum(
            f.monto_iva 
            for f in facturas_recibidas 
            if f.tipo_factura == TipoFactura.A and not f.es_compensacion_iva
        )
        
        # Balance = IVA emitido - IVA recibido
        balance = iva_emitido - iva_recibido
        
        return {
            "iva_emitido": iva_emitido,
            "iva_recibido": iva_recibido,
            "balance_iva": balance,
            "estado": "A PAGAR" if balance > 0 else "A FAVOR"
        }
    
    @staticmethod
    def calcular_balance_general(
        facturas: List[Invoice],
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None
    ) -> Dict[str, Decimal]:
        """
        Calcula Balance General (flujo de caja real).
        SOLO considera facturas con movimiento_cuenta=SI.
        """
        # Filtrar por fechas
        facturas_filtradas = facturas
        if fecha_desde:
            facturas_filtradas = [f for f in facturas_filtradas if f.fecha_emision >= fecha_desde]
        if fecha_hasta:
            facturas_filtradas = [f for f in facturas_filtradas if f.fecha_emision <= fecha_hasta]
        
        # SOLO facturas con movimiento_cuenta=SI
        facturas_con_movimiento = [
            f for f in facturas_filtradas 
            if f.movimiento_cuenta == MovimientoCuenta.SI
        ]
        
        # Calcular totales
        total_ingresos = sum(f.total for f in facturas_con_movimiento if f.total > 0)
        total_egresos = sum(abs(f.total) for f in facturas_con_movimiento if f.total < 0)
        
        return {
            "ingresos": total_ingresos,
            "egresos": total_egresos,
            "balance": total_ingresos - total_egresos,
            "cantidad_facturas": len(facturas_con_movimiento)
        }
    
    @staticmethod
    def calcular_balance_por_socio(
        facturas: List[Invoice],
        socio: str
    ) -> Dict[str, any]:
        """Calcula balance específico de un socio"""
        facturas_socio = [f for f in facturas if f.socio_responsable and f.socio_responsable.value == socio]
        
        # Solo facturas con movimiento real
        facturas_reales = [f for f in facturas_socio if f.movimiento_cuenta == MovimientoCuenta.SI]
        
        total_ingresos = sum(f.total for f in facturas_reales if f.total > 0)
        total_egresos = sum(abs(f.total) for f in facturas_reales if f.total < 0)
        balance = total_ingresos - total_egresos
        
        return {
            "socio": socio,
            "total_ingresos": total_ingresos,
            "total_egresos": total_egresos,
            "balance": balance,
            "cantidad_facturas": len(facturas_socio)
        }
    
    @staticmethod
    def validar_coherencia_montos(invoice: Invoice) -> Dict[str, any]:
        """
        Valida que subtotal + IVA + otros = total (PUNTO 9)
        """
        calculado = invoice.subtotal + invoice.monto_iva + invoice.otros_impuestos
        diferencia = abs(invoice.total - calculado)
        
        # Tolerancia de 0.01 por redondeos
        es_coherente = diferencia <= Decimal("0.01")
        
        return {
            "es_coherente": es_coherente,
            "total_declarado": invoice.total,
            "total_calculado": calculado,
            "diferencia": diferencia,
            "mensaje": "Coherente" if es_coherente else f"Diferencia de ${diferencia}"
        }
    
    @staticmethod
    def calcular_iva_desde_total(total: Decimal, alicuota: Decimal = Decimal("0.21")) -> Dict[str, Decimal]:
        """
        Calcula IVA y subtotal desde el total.
        Por defecto usa alícuota 21% (Argentina)
        """
        subtotal = total / (1 + alicuota)
        iva = total - subtotal
        
        return {
            "subtotal": round(subtotal, 2),
            "iva": round(iva, 2),
            "total": total
        }
