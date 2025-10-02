/**
 * Servicio de validaciones para reglas de negocio específicas
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ValidationService {
  /**
   * Valida datos de factura
   */
  static validateInvoice(invoiceData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validaciones obligatorias
    if (!invoiceData.invoice_number?.trim()) {
      errors.push('El número de factura es obligatorio');
    }

    if (!invoiceData.client_name?.trim()) {
      errors.push('El nombre del cliente es obligatorio');
    }

    if (!invoiceData.issue_date) {
      errors.push('La fecha de emisión es obligatoria');
    }

    if (!invoiceData.total || invoiceData.total <= 0) {
      errors.push('El total debe ser mayor a 0');
    }

    // Validaciones de formato
    if (invoiceData.cuit && !this.validateCUIT(invoiceData.cuit)) {
      errors.push('El CUIT ingresado no es válido');
    }

    if (invoiceData.email && !this.validateEmail(invoiceData.email)) {
      errors.push('El email ingresado no es válido');
    }

    // Validaciones de consistencia
    if (invoiceData.items && invoiceData.items.length > 0) {
      const calculatedSubtotal = invoiceData.items.reduce(
        (sum: number, item: any) => sum + (item.quantity * item.unit_price), 0
      );
      
      if (invoiceData.subtotal && Math.abs(calculatedSubtotal - invoiceData.subtotal) > 0.01) {
        warnings.push('El subtotal calculado no coincide con el ingresado');
      }

      const calculatedIva = calculatedSubtotal * 0.21;
      if (invoiceData.iva && Math.abs(calculatedIva - invoiceData.iva) > 0.01) {
        warnings.push('El IVA calculado no coincide con el ingresado');
      }

      const calculatedTotal = calculatedSubtotal + calculatedIva;
      if (invoiceData.total && Math.abs(calculatedTotal - invoiceData.total) > 0.01) {
        errors.push('El total calculado no coincide con el ingresado');
      }
    }

    // Validaciones de fechas
    if (invoiceData.issue_date && invoiceData.due_date) {
      const issueDate = new Date(invoiceData.issue_date);
      const dueDate = new Date(invoiceData.due_date);
      
      if (dueDate < issueDate) {
        errors.push('La fecha de vencimiento no puede ser anterior a la fecha de emisión');
      }
    }

    // Validaciones de negocio
    if (invoiceData.total > 1000000) {
      warnings.push('Factura de alto monto - verificar datos antes de procesar');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida datos de socio/proveedor
   */
  static validatePartner(partnerData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validaciones obligatorias
    if (!partnerData.name?.trim()) {
      errors.push('El nombre del socio es obligatorio');
    }

    if (!partnerData.business_type) {
      errors.push('El tipo de negocio es obligatorio');
    }

    // Validaciones de formato
    if (partnerData.email && !this.validateEmail(partnerData.email)) {
      errors.push('El email ingresado no es válido');
    }

    if (partnerData.cuit && !this.validateCUIT(partnerData.cuit)) {
      errors.push('El CUIT ingresado no es válido');
    }

    if (partnerData.phone && !this.validatePhone(partnerData.phone)) {
      warnings.push('El formato del teléfono podría no ser correcto');
    }

    // Validaciones de negocio
    if (partnerData.business_type === 'socio' && !partnerData.cuit) {
      warnings.push('Los socios deberían tener CUIT registrado');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida CUIT argentino
   */
  static validateCUIT(cuit: string): boolean {
    // Remover guiones y espacios
    const cleanCuit = cuit.replace(/[-\s]/g, '');
    
    // Verificar que tenga 11 dígitos
    if (!/^\d{11}$/.test(cleanCuit)) {
      return false;
    }

    // Validar dígito verificador
    const digits = cleanCuit.split('').map(Number);
    const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += digits[i] * multipliers[i];
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? remainder : 11 - remainder;
    
    return checkDigit === digits[10];
  }

  /**
   * Valida email
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida teléfono argentino
   */
  static validatePhone(phone: string): boolean {
    // Remover espacios, guiones y paréntesis
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Verificar formato argentino (10-11 dígitos, puede empezar con +54)
    const phoneRegex = /^(\+54)?[0-9]{10,11}$/;
    return phoneRegex.test(cleanPhone);
  }

  /**
   * Valida archivo de factura
   */
  static validateInvoiceFile(file: File): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('Solo se permiten archivos PDF, JPG y PNG');
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push('El archivo no puede superar los 10MB');
    }

    // Validar nombre del archivo
    if (file.name.length > 255) {
      errors.push('El nombre del archivo es demasiado largo');
    }

    // Warnings para archivos grandes
    if (file.size > 5 * 1024 * 1024) { // 5MB
      warnings.push('Archivo grande - el procesamiento puede tardar más');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida datos financieros
   */
  static validateFinancialData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar que los números sean positivos
    const numericFields = ['total_revenue', 'total_expenses', 'net_profit'];
    numericFields.forEach(field => {
      if (data[field] !== undefined && (isNaN(data[field]) || data[field] < 0)) {
        errors.push(`${field} debe ser un número positivo`);
      }
    });

    // Validar márgenes lógicos
    if (data.total_revenue && data.total_expenses && data.net_profit) {
      const calculatedProfit = data.total_revenue - data.total_expenses;
      if (Math.abs(calculatedProfit - data.net_profit) > 0.01) {
        errors.push('El beneficio neto no coincide con ingresos - egresos');
      }

      const profitMargin = (data.net_profit / data.total_revenue) * 100;
      if (profitMargin < 0) {
        warnings.push('Margen de beneficio negativo - revisar datos');
      } else if (profitMargin > 50) {
        warnings.push('Margen de beneficio muy alto - verificar datos');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Sanitiza texto para prevenir inyecciones
   */
  static sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '') // Remover < y >
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, '') // Remover event handlers
      .trim();
  }

  /**
   * Valida y sanitiza datos de entrada
   */
  static sanitizeAndValidate(data: any): { data: any; validation: ValidationResult } {
    const sanitizedData = { ...data };
    const errors: string[] = [];
    const warnings: string[] = [];

    // Sanitizar campos de texto
    const textFields = ['name', 'client_name', 'supplier_name', 'description', 'notes'];
    textFields.forEach(field => {
      if (sanitizedData[field] && typeof sanitizedData[field] === 'string') {
        const original = sanitizedData[field];
        sanitizedData[field] = this.sanitizeText(original);
        
        if (original !== sanitizedData[field]) {
          warnings.push(`El campo ${field} fue sanitizado por seguridad`);
        }
      }
    });

    return {
      data: sanitizedData,
      validation: {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    };
  }
}

// Utilidades específicas para validación de facturas argentinas
export class ArgentineInvoiceValidation {
  /**
   * Valida tipo de comprobante argentino
   */
  static validateInvoiceType(type: string): boolean {
    const validTypes = ['A', 'B', 'C', 'E', 'M'];
    return validTypes.includes(type.toUpperCase());
  }

  /**
   * Valida condición frente al IVA
   */
  static validateTaxCondition(condition: string): boolean {
    const validConditions = [
      'responsable_inscripto',
      'monotributo',
      'exento',
      'consumidor_final',
      'no_responsable'
    ];
    return validConditions.includes(condition.toLowerCase());
  }

  /**
   * Valida número de comprobante argentino
   */
  static validateInvoiceNumber(number: string, type: string): boolean {
    // Formato básico: punto y guión (ej: 0001-00000001)
    const invoiceRegex = /^\d{4}-\d{8}$/;
    
    if (!invoiceRegex.test(number)) {
      return false;
    }

    // Validaciones específicas por tipo
    switch (type.toUpperCase()) {
      case 'A':
      case 'B':
      case 'C':
        return true; // Facturas A, B, C
      case 'E':
        return true; // Exportación
      case 'M':
        return true; // Monotributo
      default:
        return false;
    }
  }

  /**
   * Calcula IVA argentino
   */
  static calculateArgentineIVA(subtotal: number, condition: string): number {
    switch (condition.toLowerCase()) {
      case 'responsable_inscripto':
        return subtotal * 0.21; // IVA 21%
      case 'monotributo':
        return 0; // Sin IVA
      case 'exento':
        return 0; // Sin IVA
      case 'consumidor_final':
        return subtotal * 0.21; // IVA 21%
      default:
        return subtotal * 0.21; // Por defecto 21%
    }
  }
}
