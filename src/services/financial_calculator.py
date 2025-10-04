<<<<<<< HEAD
"""
Calculadora centralizada para operaciones financieras.
Implementa la lógica fiscal argentina según explicación de Joni/Hernán.
"""

from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from typing import Dict, Any, List, Tuple
from datetime import date

class FinancialCalculator:
    """
    Calculadora centralizada para TODAS las operaciones financieras del sistema.
    
    Lógica fiscal argentina implementada:
    1. Balance IVA = Solo facturas tipo A (IVA ventas - IVA compras)
    2. Balance General = Solo facturas con movimiento_cuenta=SI (Ingresos - Egresos)
    3. Formato moneda argentina: $1.234,56 (punto=miles, coma=decimales)
    """
    
    # Porcentajes de IVA según normativa argentina
    IVA_STANDARD = Decimal('21.0')    # 21%
    IVA_REDUCIDO = Decimal('10.5')    # 10.5%
    IVA_CERO = Decimal('0.0')          # 0% (exento)
    
    @staticmethod
    def normalizar_monto(valor: Any) -> Decimal:
        """
        Convierte cualquier valor a Decimal, manejando formato argentino.
        
        Formatos soportados:
        - Argentino: $1.234,56 o 1.234,56
        - Inglés: $1,234.56 o 1234.56
        - Número: 1234.56
        
        Args:
            valor: Valor a normalizar (str, int, float, Decimal)
            
        Returns:
            Decimal normalizado
        """
        if isinstance(valor, Decimal):
            return valor
        
        if isinstance(valor, (int, float)):
            return Decimal(str(valor))
        
        if isinstance(valor, str):
            # Remover símbolos de moneda y espacios
            valor = valor.replace('$', '').replace('ARS', '').replace(' ', '').strip()
            
            if not valor or valor == '-':
                return Decimal('0')
            
            # Detectar formato: argentino ($1.234,56) o inglés ($1,234.56)
            tiene_punto = '.' in valor
            tiene_coma = ',' in valor
            
            if tiene_punto and tiene_coma:
                # Ambos presentes: detectar cuál es el separador decimal
                pos_punto = valor.rfind('.')
                pos_coma = valor.rfind(',')
                
                if pos_coma > pos_punto:
                    # Formato argentino: 1.234,56
                    valor = valor.replace('.', '').replace(',', '.')
                else:
                    # Formato inglés: 1,234.56
                    valor = valor.replace(',', '')
            elif tiene_coma:
                # Solo coma: asumir formato argentino (1.234,56 o 1234,56)
                valor = valor.replace(',', '.')
            
            try:
                return Decimal(valor)
            except (InvalidOperation, ValueError):
                return Decimal('0')
        
        return Decimal('0')
    
    @staticmethod
    def calcular_iva(subtotal: Decimal, porcentaje: Decimal = IVA_STANDARD) -> Decimal:
        """
        Calcula el IVA según porcentaje especificado.
        
        Args:
            subtotal: Monto sin IVA
            porcentaje: Porcentaje de IVA (21% por defecto)
            
        Returns:
            Monto de IVA calculado con 2 decimales
        """
        iva = subtotal * (porcentaje / Decimal('100'))
        return iva.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    @staticmethod
    def calcular_total(
        subtotal: Decimal,
        iva: Decimal,
        otros_impuestos: Decimal = Decimal('0')
    ) -> Decimal:
        """
        Calcula el total de una factura.
        
        Args:
            subtotal: Monto sin impuestos
            iva: Monto de IVA
            otros_impuestos: Otros impuestos (ingresos brutos, impuesto al cheque, etc.)
            
        Returns:
            Total de la factura con 2 decimales
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
        
        Validaciones:
        1. total ≈ subtotal + iva (con tolerancia del 1%)
        2. iva ≈ subtotal * 21% o subtotal * 10.5% (con tolerancia)
        
        Args:
            subtotal: Monto sin IVA
            iva: Monto de IVA declarado
            total: Total declarado
            tolerancia_porcentaje: Tolerancia permitida en % (1% por defecto)
            
        Returns:
            Tupla (es_valido, mensaje_error)
        """
        # Validar coherencia del total
        total_calculado = subtotal + iva
        diferencia = abs(total - total_calculado)
        tolerancia = total * (tolerancia_porcentaje / Decimal('100'))
        
        if diferencia > tolerancia:
            return False, f"Total inconsistente. Calculado: ${total_calculado}, Declarado: ${total}, Diferencia: ${diferencia}"
        
        # Validar coherencia del IVA
        iva_21 = FinancialCalculator.calcular_iva(subtotal, Decimal('21.0'))
        iva_10_5 = FinancialCalculator.calcular_iva(subtotal, Decimal('10.5'))
        
        dif_21 = abs(iva - iva_21)
        dif_10_5 = abs(iva - iva_10_5)
        
        tolerancia_iva = iva * (tolerancia_porcentaje / Decimal('100')) if iva > 0 else Decimal('1.0')
        
        # El IVA debe coincidir con 21% o 10.5%
        if dif_21 > tolerancia_iva and dif_10_5 > tolerancia_iva:
            return False, f"IVA inconsistente. Declarado: ${iva}, Esperado (21%): ${iva_21}, Esperado (10.5%): ${iva_10_5}"
        
        return True, "OK"
    
    @staticmethod
    def calcular_balance_iva(facturas_tipo_a: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calcula el Balance IVA según normativa argentina.
        
        REGLA DE JONI: Solo se consideran facturas tipo A.
        
        Balance IVA = IVA de facturas emitidas (débito fiscal) - IVA de facturas recibidas (crédito fiscal)
        
        - IVA emitido (ventas): Es lo que cobramos de IVA → Se debe PAGAR a AFIP
        - IVA recibido (compras): Es lo que pagamos de IVA → Se puede RECUPERAR de AFIP
        - Balance positivo: Debemos pagar IVA a AFIP
        - Balance negativo: AFIP nos debe IVA (a favor)
        
        Args:
            facturas_tipo_a: Lista de facturas tipo A con campos 'iva_monto' e 'invoice_direction'
            
        Returns:
            Diccionario con balance de IVA
        """
        iva_ventas = Decimal('0')   # IVA de facturas emitidas (débito fiscal)
        iva_compras = Decimal('0')  # IVA de facturas recibidas (crédito fiscal)
        
        for factura in facturas_tipo_a:
            iva = FinancialCalculator.normalizar_monto(factura.get('iva_monto', 0))
            direccion = factura.get('invoice_direction', 'recibida')
            
            if direccion == 'emitida':
                iva_ventas += iva
            elif direccion == 'recibida':
                iva_compras += iva
        
        balance_iva = iva_ventas - iva_compras
        
        return {
            'iva_debito_fiscal': float(iva_ventas),      # IVA a pagar
            'iva_credito_fiscal': float(iva_compras),    # IVA a favor
            'balance_iva': float(balance_iva),           # Positivo = a pagar, Negativo = a favor
            'estado': 'a_pagar' if balance_iva > 0 else 'a_favor' if balance_iva < 0 else 'neutro',
            'descripcion': 'Balance IVA = IVA Ventas (débito fiscal) - IVA Compras (crédito fiscal). Solo facturas tipo A.'
        }
    
    @staticmethod
    def calcular_balance_general(facturas_con_movimiento: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calcula el Balance General (ingreso - egreso).
        
        REGLA DE JONI: Solo se consideran facturas con movimiento_cuenta = True.
        Estas son facturas que REALMENTE movieron dinero, no son compensación de IVA.
        
        Ejemplo de lo que NO se cuenta:
        - Factura de caramelos para compensar IVA (movimiento_cuenta = False)
        - Factura de combustible solo para recuperar IVA (movimiento_cuenta = False)
        
        Ejemplo de lo que SÍ se cuenta:
        - Pago real a un subcontratista (movimiento_cuenta = True)
        - Cobro real de un trabajo facturado (movimiento_cuenta = True)
        
        Args:
            facturas_con_movimiento: Lista de facturas con mov_cuenta=True
            
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
            'estado': 'positivo' if balance > 0 else 'negativo' if balance < 0 else 'neutro',
            'descripcion': 'Balance General = Ingresos - Egresos. Solo facturas con movimiento de cuenta real.'
        }
    
    @staticmethod
    def formatear_moneda_argentina(monto: Decimal, incluir_simbolo: bool = True) -> str:
        """
        Formatea un monto en formato argentino: $1.234,56
        
        Args:
            monto: Monto a formatear
            incluir_simbolo: Si incluir el símbolo $
            
        Returns:
            String formateado en formato argentino
        """
        # Separar parte entera y decimal
        monto_abs = abs(monto)
        partes = str(monto_abs).split('.')
        parte_entera = partes[0]
        parte_decimal = partes[1] if len(partes) > 1 else '00'
        
        # Asegurar 2 decimales
        parte_decimal = parte_decimal.ljust(2, '0')[:2]
        
        # Agregar separadores de miles (punto)
        parte_entera_formateada = ''
        for i, digito in enumerate(reversed(parte_entera)):
            if i > 0 and i % 3 == 0:
                parte_entera_formateada = '.' + parte_entera_formateada
            parte_entera_formateada = digito + parte_entera_formateada
        
        # Construir resultado
        signo = '-' if monto < 0 else ''
        simbolo = '$' if incluir_simbolo else ''
        
        return f"{signo}{simbolo}{parte_entera_formateada},{parte_decimal}"
    
    @staticmethod
    def parsear_moneda_argentina(valor: str) -> Decimal:
        """
        Parsea una cadena en formato argentino a Decimal.
        Alias de normalizar_monto para compatibilidad.
        
        Args:
            valor: String en formato argentino ($1.234,56)
            
        Returns:
            Decimal parseado
        """
        return FinancialCalculator.normalizar_monto(valor)
=======
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
>>>>>>> refs/remotes/origin/master
