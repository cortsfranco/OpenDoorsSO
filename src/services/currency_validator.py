"""
Validador y normalizador de formatos de moneda argentina y CUIT.
"""

import re
from decimal import Decimal, InvalidOperation
from typing import Tuple, Optional

class CurrencyValidator:
    """
    Validador y normalizador de formatos de moneda argentina.
    
    Funcionalidades:
    1. Detectar si un valor está en formato argentino o inglés
    2. Normalizar automáticamente a Decimal
    3. Validar y formatear CUIT argentino
    4. Auto-corrección de comas/puntos intercambiados
    """
    
    # Patrones regex para validación
    PATTERN_ARGENTINE = re.compile(r'^-?\$?\s?(\d{1,3}(\.\d{3})*|\d+)(,\d{1,2})?$')
    PATTERN_ENGLISH = re.compile(r'^-?\$?\s?(\d{1,3}(,\d{3})*|\d+)(\.\d{1,2})?$')
    PATTERN_CUIT = re.compile(r'^\d{2}-\d{8}-\d$')
    
    @staticmethod
    def detectar_formato(valor: str) -> str:
        """
        Detecta si un valor está en formato argentino o inglés.
        
        Args:
            valor: String con el valor a detectar
            
        Returns:
            'argentino', 'ingles' o 'invalido'
        """
        valor_limpio = valor.replace('$', '').replace(' ', '').strip()
        
        if not valor_limpio:
            return 'invalido'
        
        # Detectar formato basado en posición de separadores
        tiene_punto = '.' in valor_limpio
        tiene_coma = ',' in valor_limpio
        
        if tiene_punto and tiene_coma:
            # Ambos presentes: verificar posiciones
            pos_punto = valor_limpio.rfind('.')
            pos_coma = valor_limpio.rfind(',')
            
            if pos_coma > pos_punto:
                return 'argentino'  # 1.234,56
            else:
                return 'ingles'  # 1,234.56
        elif tiene_coma:
            # Solo coma: verificar si es separador de miles o decimal
            partes = valor_limpio.split(',')
            if len(partes) == 2 and len(partes[1]) <= 2:
                return 'argentino'  # Probablemente 1234,56
            return 'ingles'  # Probablemente 1,234 o 12,345
        elif tiene_punto:
            # Solo punto: verificar si es separador de miles o decimal
            partes = valor_limpio.split('.')
            if len(partes) == 2 and len(partes[1]) <= 2:
                return 'ingles'  # Probablemente 1234.56
            return 'argentino'  # Probablemente 1.234 o 12.345
        
        # Sin separadores: válido para ambos
        if CurrencyValidator.PATTERN_ARGENTINE.match(valor_limpio):
            return 'argentino'
        if CurrencyValidator.PATTERN_ENGLISH.match(valor_limpio):
            return 'ingles'
        
        return 'invalido'
    
    @staticmethod
    def normalizar_a_decimal(valor: str) -> Tuple[bool, Optional[Decimal], str]:
        """
        Normaliza un valor en cualquier formato a Decimal.
        AUTO-CORRIGE formato argentino con comas/puntos intercambiados.
        
        Args:
            valor: String con el valor a normalizar
            
        Returns:
            Tupla (exito, decimal_value, mensaje)
        """
        try:
            # Limpiar valor
            valor_limpio = valor.replace('$', '').replace(' ', '').replace('ARS', '').strip()
            
            if not valor_limpio or valor_limpio == '-':
                return True, Decimal('0'), "Valor vacío, convertido a 0"
            
            # Detectar formato
            formato = CurrencyValidator.detectar_formato(valor)
            
            if formato == 'invalido':
                return False, None, f"Formato inválido: '{valor}'. Use $1.234,56 (argentino) o $1,234.56 (inglés)"
            
            # Convertir según formato detectado
            if formato == 'argentino':
                # 1.234,56 → 1234.56
                valor_normalizado = valor_limpio.replace('.', '').replace(',', '.')
            else:  # ingles
                # 1,234.56 → 1234.56
                valor_normalizado = valor_limpio.replace(',', '')
            
            decimal_value = Decimal(valor_normalizado)
            
            mensaje = "OK"
            if formato == 'ingles':
                mensaje = "Formato inglés detectado y convertido automáticamente"
            
            return True, decimal_value, mensaje
            
        except (InvalidOperation, ValueError) as e:
            return False, None, f"Error al convertir '{valor}': {str(e)}"
    
    @staticmethod
    def formatear_argentino(valor: Decimal, incluir_simbolo: bool = True) -> str:
        """
        Formatea un Decimal al formato argentino $1.234,56
        
        Args:
            valor: Decimal a formatear
            incluir_simbolo: Si incluir el símbolo $
            
        Returns:
            String formateado
        """
        # Separar parte entera y decimal
        valor_str = str(abs(valor))
        partes = valor_str.split('.')
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
        signo = '-' if valor < 0 else ''
        simbolo = '$' if incluir_simbolo else ''
        
        return f"{signo}{simbolo}{parte_entera_formateada},{parte_decimal}"
    
    @staticmethod
    def validar_cuit(cuit: str) -> Tuple[bool, str]:
        """
        Valida formato y dígito verificador de CUIT argentino.
        
        Algoritmo oficial de validación de CUIT según AFIP.
        
        Args:
            cuit: String con el CUIT (puede incluir guiones o no)
            
        Returns:
            Tupla (es_valido, mensaje)
        """
        # Limpiar CUIT (remover guiones y espacios)
        cuit_limpio = cuit.replace(' ', '').replace('-', '')
        
        # Debe tener exactamente 11 dígitos
        if len(cuit_limpio) != 11 or not cuit_limpio.isdigit():
            return False, "CUIT debe tener 11 dígitos en formato XX-XXXXXXXX-X"
        
        # Validar dígito verificador según algoritmo oficial AFIP
        multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
        suma = sum(int(cuit_limpio[i]) * multiplicadores[i] for i in range(10))
        
        verificador = 11 - (suma % 11)
        if verificador == 11:
            verificador = 0
        elif verificador == 10:
            verificador = 9
        
        digito_verificador_real = int(cuit_limpio[10])
        
        if digito_verificador_real != verificador:
            return False, f"Dígito verificador incorrecto. Esperado: {verificador}, Encontrado: {digito_verificador_real}"
        
        return True, "CUIT válido"
    
    @staticmethod
    def formatear_cuit(cuit: str) -> str:
        """
        Formatea CUIT al formato estándar XX-XXXXXXXX-X
        
        Args:
            cuit: CUIT sin formato o con formato parcial
            
        Returns:
            CUIT formateado o el original si no es válido
        """
        # Limpiar CUIT
        cuit_limpio = cuit.replace(' ', '').replace('-', '')
        
        if len(cuit_limpio) != 11 or not cuit_limpio.isdigit():
            return cuit  # Devolver sin cambios si no es válido
        
        return f"{cuit_limpio[:2]}-{cuit_limpio[2:10]}-{cuit_limpio[10]}"
    
    @staticmethod
    def auto_corregir_formato(valor: str) -> Tuple[str, bool]:
        """
        Intenta auto-corregir un valor con formato incorrecto.
        
        Casos comunes:
        - Comas/puntos intercambiados: 1,234.56 → $1.234,56
        - Sin separadores: 1234.56 → $1.234,56
        
        Args:
            valor: String con el valor a corregir
            
        Returns:
            Tupla (valor_corregido, fue_corregido)
        """
        exito, decimal_val, _ = CurrencyValidator.normalizar_a_decimal(valor)
        
        if not exito:
            return valor, False
        
        # Formatear al estándar argentino
        valor_corregido = CurrencyValidator.formatear_argentino(decimal_val, incluir_simbolo=True)
        
        # Verificar si hubo cambios
        valor_limpio_original = valor.replace('$', '').replace(' ', '').strip()
        valor_limpio_corregido = valor_corregido.replace('$', '').replace(' ', '').strip()
        
        fue_corregido = valor_limpio_original != valor_limpio_corregido
        
        return valor_corregido, fue_corregido
