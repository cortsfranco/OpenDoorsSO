"""
Servicio de validaciones para facturas argentinas.
Incluye validaciones de CUIT, CAE, tipos de factura y normativas AFIP.
"""

import re
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, date
from dataclasses import dataclass

@dataclass
class ValidationResult:
    """Resultado de una validación."""
    is_valid: bool
    error_message: Optional[str] = None
    warning_message: Optional[str] = None
    suggestions: list = None

    def __post_init__(self):
        if self.suggestions is None:
            self.suggestions = []

class ArgentineValidationService:
    """Servicio de validaciones específicas para Argentina."""
    
    def __init__(self):
        # Tipos de factura válidos en Argentina
        self.valid_invoice_types = ["A", "B", "C", "X", "E"]
        
        # Códigos de condición ante IVA
        self.iva_conditions = {
            "Responsable Inscripto": "RI",
            "Exento": "EX",
            "No Responsable": "NR",
            "Consumidor Final": "CF",
            "Monotributo": "MT",
            "No Alcanzado": "NA"
        }
        
        # Códigos de condición de venta
        self.sale_conditions = {
            "Contado": "01",
            "Cuenta Corriente": "02",
            "Tarjeta de Crédito": "03",
            "Tarjeta de Débito": "04",
            "Cheque": "05",
            "Transferencia": "06"
        }
    
    def validate_cuit(self, cuit: str) -> ValidationResult:
        """
        Validar CUIT/CUIL argentino.
        
        Formato: XX-XXXXXXXX-X
        """
        if not cuit:
            return ValidationResult(False, "CUIT es requerido")
        
        # Limpiar formato
        clean_cuit = re.sub(r'[^\d]', '', cuit)
        
        if len(clean_cuit) != 11:
            return ValidationResult(False, "CUIT debe tener 11 dígitos")
        
        # Validar prefijo (debe ser 20, 23, 24, 25, 26, 27, 30, 33, 34)
        prefix = clean_cuit[:2]
        valid_prefixes = ["20", "23", "24", "25", "26", "27", "30", "33", "34"]
        
        if prefix not in valid_prefixes:
            return ValidationResult(
                False, 
                f"Prefijo de CUIT inválido: {prefix}",
                suggestions=["Verificar que el CUIT pertenezca a una persona física o jurídica válida"]
            )
        
        # Validar dígito verificador
        multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
        total = sum(int(digit) * mult for digit, mult in zip(clean_cuit[:10], multipliers))
        remainder = total % 11
        check_digit = 11 - remainder if remainder > 1 else remainder
        
        if int(clean_cuit[10]) != check_digit:
            return ValidationResult(
                False,
                "CUIT inválido: dígito verificador incorrecto",
                suggestions=["Verificar el número de CUIT completo"]
            )
        
        return ValidationResult(True)
    
    def validate_cae(self, cae: str, invoice_type: str, point_of_sale: str, invoice_number: str) -> ValidationResult:
        """
        Validar CAE (Código de Autorización Electrónica).
        
        CAE tiene 14 dígitos y debe ser válido según AFIP.
        """
        if not cae:
            return ValidationResult(False, "CAE es requerido para facturas electrónicas")
        
        # Limpiar formato
        clean_cae = re.sub(r'[^\d]', '', cae)
        
        if len(clean_cae) != 14:
            return ValidationResult(False, "CAE debe tener 14 dígitos")
        
        # Validar que sea numérico
        if not clean_cae.isdigit():
            return ValidationResult(False, "CAE debe contener solo números")
        
        # Validar formato básico (primeros 2 dígitos son el año)
        current_year = datetime.now().year
        cae_year = int(clean_cae[:2]) + 2000
        
        if cae_year < current_year - 1 or cae_year > current_year + 1:
            return ValidationResult(
                False,
                f"Año del CAE inválido: {cae_year}",
                suggestions=["Verificar que el CAE corresponda al período fiscal actual"]
            )
        
        return ValidationResult(True)
    
    def validate_invoice_type(self, invoice_type: str, cuit: str = None) -> ValidationResult:
        """
        Validar tipo de factura según normativa argentina.
        """
        if not invoice_type:
            return ValidationResult(False, "Tipo de factura es requerido")
        
        if invoice_type not in self.valid_invoice_types:
            return ValidationResult(
                False,
                f"Tipo de factura inválido: {invoice_type}",
                suggestions=[f"Tipos válidos: {', '.join(self.valid_invoice_types)}"]
            )
        
        # Validaciones específicas por tipo
        if invoice_type == "A" and cuit:
            # Factura A requiere CUIT de Responsable Inscripto
            cuit_result = self.validate_cuit(cuit)
            if not cuit_result.is_valid:
                return ValidationResult(
                    False,
                    "Factura A requiere CUIT válido de Responsable Inscripto",
                    suggestions=["Verificar CUIT del cliente"]
                )
        
        if invoice_type == "B":
            # Factura B es para Consumidor Final
            pass
        
        if invoice_type == "C":
            # Factura C es para exportación
            pass
        
        return ValidationResult(True)
    
    def validate_invoice_date(self, invoice_date: str, invoice_type: str) -> ValidationResult:
        """
        Validar fecha de emisión de factura.
        """
        try:
            if isinstance(invoice_date, str):
                date_obj = datetime.strptime(invoice_date, "%Y-%m-%d").date()
            else:
                date_obj = invoice_date
            
            today = date.today()
            
            # La factura no puede ser del futuro
            if date_obj > today:
                return ValidationResult(
                    False,
                    "La fecha de emisión no puede ser futura",
                    suggestions=["Verificar la fecha de emisión de la factura"]
                )
            
            # La factura no puede ser muy antigua (más de 2 años)
            if date_obj < date(today.year - 2, today.month, today.day):
                return ValidationResult(
                    False,
                    "La fecha de emisión es muy antigua (más de 2 años)",
                    suggestions=["Verificar que la factura corresponda al período fiscal actual"]
                )
            
            return ValidationResult(True)
            
        except ValueError:
            return ValidationResult(
                False,
                "Formato de fecha inválido",
                suggestions=["Usar formato YYYY-MM-DD"]
            )
    
    def validate_invoice_amounts(self, amounts: Dict[str, Any]) -> ValidationResult:
        """
        Validar montos de factura según normativa argentina.
        """
        subtotal = amounts.get('subtotal', 0)
        iva = amounts.get('iva', 0)
        total = amounts.get('total', 0)
        
        if subtotal < 0:
            return ValidationResult(False, "El subtotal no puede ser negativo")
        
        if iva < 0:
            return ValidationResult(False, "El IVA no puede ser negativo")
        
        if total < 0:
            return ValidationResult(False, "El total no puede ser negativo")
        
        # Validar que el total sea aproximadamente igual a subtotal + iva
        expected_total = subtotal + iva
        tolerance = 0.01  # Tolerancia de 1 centavo
        
        if abs(total - expected_total) > tolerance:
            return ValidationResult(
                False,
                f"El total ({total}) no coincide con subtotal + IVA ({expected_total})",
                suggestions=["Verificar los cálculos de la factura"]
            )
        
        return ValidationResult(True)
    
    def determine_invoice_direction(self, invoice_data: Dict[str, Any]) -> str:
        """
        Determinar automáticamente la dirección de la factura.
        """
        # Lógica simple: si tiene datos del cliente, es emitida; si no, es recibida
        client_data = invoice_data.get('client_data', {})
        if client_data and client_data.get('name'):
            return 'emitida'
        return 'recibida'
    
    def determine_movimiento_cuenta(self, invoice_data: Dict[str, Any]) -> bool:
        """
        Determinar si la factura afecta el movimiento de cuenta.
        """
        # Por defecto, todas las facturas afectan el movimiento de cuenta
        # Esto puede ser refinado con lógica específica
        return True
    
    def validate_complete_invoice(self, invoice_data: Dict[str, Any]) -> Dict[str, ValidationResult]:
        """
        Validar una factura completa.
        """
        results = {}
        
        # Validar CUIT
        cuit = invoice_data.get('cuit')
        if cuit:
            results['cuit'] = self.validate_cuit(cuit)
        
        # Validar tipo de factura
        invoice_type = invoice_data.get('clase')
        if invoice_type:
            results['invoice_type'] = self.validate_invoice_type(invoice_type, cuit)
        
        # Validar CAE
        cae = invoice_data.get('cae')
        if cae:
            results['cae'] = self.validate_cae(
                cae, 
                invoice_type, 
                invoice_data.get('punto_venta', ''),
                invoice_data.get('numero', '')
            )
        
        # Validar fecha
        invoice_date = invoice_data.get('fecha_emision')
        if invoice_date:
            results['invoice_date'] = self.validate_invoice_date(invoice_date, invoice_type)
        
        # Validar montos
        amounts = {
            'subtotal': invoice_data.get('subtotal', 0),
            'iva': invoice_data.get('monto_iva', 0),
            'total': invoice_data.get('monto_total', 0)
        }
        results['amounts'] = self.validate_invoice_amounts(amounts)
        
        return results
    
    def get_validation_summary(self, results: Dict[str, ValidationResult]) -> Dict[str, Any]:
        """
        Obtener resumen de validaciones.
        """
        total_validations = len(results)
        passed_validations = sum(1 for r in results.values() if r.is_valid)
        
        errors = [r.error_message for r in results.values() if not r.is_valid and r.error_message]
        warnings = [r.warning_message for r in results.values() if r.warning_message]
        
        return {
            'total_validations': total_validations,
            'passed_validations': passed_validations,
            'failed_validations': total_validations - passed_validations,
            'success_rate': (passed_validations / total_validations * 100) if total_validations > 0 else 0,
            'errors': errors,
            'warnings': warnings,
            'is_valid': len(errors) == 0
        }

