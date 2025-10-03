import re
from decimal import Decimal
from typing import Tuple, Optional

class CurrencyValidator:
    """
    Validador y auto-corrector de formato de moneda argentina.
    Formato esperado: $1.234,56 (punto para miles, coma para decimales)
    """
    
    # Patrón formato argentino: $1.234,56
    PATTERN_ARG = r'^\$?\s*(\d{1,3}(?:\.\d{3})*),(\d{2})$'
    
    # Patrón formato inglés: $1,234.56
    PATTERN_ENG = r'^\$?\s*(\d{1,3}(?:,\d{3})*)\.(\d{2})$'
    
    @staticmethod
    def validar_formato_argentino(valor: str) -> Tuple[bool, Optional[str]]:
        """
        Valida si un string está en formato argentino.
        Retorna (es_valido, mensaje_error)
        """
        valor = valor.strip()
        
        if re.match(CurrencyValidator.PATTERN_ARG, valor):
            return (True, None)
        
        return (False, f"Formato incorrecto. Use formato argentino: $1.234,56")
    
    @staticmethod
    def auto_corregir(valor: str) -> Tuple[Decimal, str]:
        """
        Detecta automáticamente el formato y convierte a Decimal.
        Retorna (valor_decimal, formato_detectado)
        """
        valor = valor.strip().replace('$', '').replace(' ', '')
        
        # Formato argentino: 1.234,56
        if re.match(r'^\d{1,3}(?:\.\d{3})*,\d{2}$', valor):
            valor_limpio = valor.replace('.', '').replace(',', '.')
            return (Decimal(valor_limpio), "argentino")
        
        # Formato inglés: 1,234.56
        elif re.match(r'^\d{1,3}(?:,\d{3})*\.\d{2}$', valor):
            valor_limpio = valor.replace(',', '')
            return (Decimal(valor_limpio), "inglés_corregido")
        
        # Número simple
        else:
            try:
                return (Decimal(valor), "simple")
            except:
                raise ValueError(f"No se pudo parsear: {valor}")
    
    @staticmethod
    def formatear_argentino(valor: Decimal) -> str:
        """
        Convierte Decimal a formato argentino $1.234,56
        """
        valor_str = f"{valor:.2f}"
        partes = valor_str.split('.')
        parte_entera = partes[0]
        parte_decimal = partes[1]
        
        # Agregar puntos de miles
        parte_entera_formateada = ""
        for i, digito in enumerate(reversed(parte_entera)):
            if i > 0 and i % 3 == 0:
                parte_entera_formateada = "." + parte_entera_formateada
            parte_entera_formateada = digito + parte_entera_formateada
        
        return f"${parte_entera_formateada},{parte_decimal}"
    
    @staticmethod
    def parsear_a_decimal(valor: str) -> Decimal:
        """
        Parsea cualquier formato de moneda a Decimal
        """
        decimal_value, _ = CurrencyValidator.auto_corregir(valor)
        return decimal_value
