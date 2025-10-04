<<<<<<< HEAD
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface CurrencyInputProps {
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  id?: string
}

export function CurrencyInput({ 
  value, 
  onChange, 
  placeholder,
  required,
  disabled,
  className,
  id
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
    if (numValue === 0 && !value) {
      setDisplayValue('')
    } else {
      const formatted = formatArgentineCurrency(numValue)
      setDisplayValue(formatted)
    }
  }, [value])

  const formatArgentineCurrency = (num: number): string => {
    const parts = num.toFixed(2).split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return parts.join(',')
  }

  const parseArgentineCurrency = (str: string): string => {
    const cleaned = str.replace(/[^\d,]/g, '')
    const normalized = cleaned.replace('.', '').replace(',', '.')
    return normalized || '0'
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const allowedChars = /^[\d.,]*$/
    
    if (!allowedChars.test(inputValue)) {
      return
    }
    
    setDisplayValue(inputValue)
    const numericValue = parseArgentineCurrency(inputValue)
    onChange(numericValue)
  }

  const handleBlur = () => {
    const numValue = parseFloat(parseArgentineCurrency(displayValue))
    if (!isNaN(numValue)) {
      setDisplayValue(formatArgentineCurrency(numValue))
    }
  }

  return (
    <Input
      id={id}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder || '0,00'}
      required={required}
      disabled={disabled}
      className={className}
    />
  )
=======
import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, Check } from 'lucide-react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  label,
  placeholder = "$0,00",
  error,
  disabled = false
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [formatDetected, setFormatDetected] = useState<'argentino' | 'inglés' | 'simple' | null>(null);

  // Convertir número a formato argentino
  const numberToArgentine = (num: number): string => {
    const parts = num.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$${integerPart},${parts[1]}`;
  };

  // Parsear formato argentino a número
  const argentineToNumber = (str: string): { value: number; format: string } | null => {
    const cleaned = str.trim().replace('$', '').replace(/\s/g, '');
    
    // Formato argentino: 1.234,56
    if (/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(cleaned)) {
      const normalized = cleaned.replace(/\./g, '').replace(',', '.');
      return { value: parseFloat(normalized), format: 'argentino' };
    }
    
    // Formato inglés: 1,234.56 (auto-corrección)
    if (/^\d{1,3}(?:,\d{3})*\.\d{2}$/.test(cleaned)) {
      const normalized = cleaned.replace(/,/g, '');
      return { value: parseFloat(normalized), format: 'inglés' };
    }
    
    // Número simple
    try {
      const num = parseFloat(cleaned);
      if (!isNaN(num)) {
        return { value: num, format: 'simple' };
      }
    } catch {}
    
    return null;
  };

  // Inicializar valor
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setInputValue(numberToArgentine(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Validar y parsear
    const parsed = argentineToNumber(newValue);
    
    if (parsed) {
      setIsValid(true);
      setFormatDetected(parsed.format as any);
      onChange(parsed.value);
    } else {
      setIsValid(false);
      setFormatDetected(null);
    }
  };

  const handleBlur = () => {
    // Re-formatear al salir del input
    if (isValid && inputValue) {
      const parsed = argentineToNumber(inputValue);
      if (parsed) {
        setInputValue(numberToArgentine(parsed.value));
      }
    }
  };

  return (
    <div className="currency-input-container" style={{ marginBottom: 'var(--spacing-md)' }}>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: 'var(--spacing-sm)',
          fontWeight: 500,
          color: 'var(--color-gray-700)'
        }}>
          {label}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
        <div style={{ 
          position: 'absolute', 
          left: '12px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          color: 'var(--color-gray-500)'
        }}>
          <DollarSign size={20} />
        </div>
        
        <input
          type="text"
          className={`input input-currency ${!isValid ? 'input-error' : ''}`}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            paddingLeft: '40px',
            paddingRight: '40px',
            fontFamily: 'Courier New, monospace'
          }}
        />
        
        <div style={{ 
          position: 'absolute', 
          right: '12px', 
          top: '50%', 
          transform: 'translateY(-50%)'
        }}>
          {isValid ? (
            <Check size={20} color="var(--color-income-600)" />
          ) : inputValue && (
            <AlertCircle size={20} color="var(--color-expense-600)" />
          )}
        </div>
      </div>

      {/* Mensajes de ayuda */}
      {formatDetected && formatDetected !== 'argentino' && (
        <div style={{ 
          marginTop: 'var(--spacing-xs)', 
          fontSize: '0.875rem',
          color: 'var(--color-iva-700)'
        }}>
          ℹ️ Formato {formatDetected} detectado y auto-corregido
        </div>
      )}
      
      {!isValid && inputValue && (
        <div style={{ 
          marginTop: 'var(--spacing-xs)', 
          fontSize: '0.875rem',
          color: 'var(--color-expense-600)'
        }}>
          ❌ Formato incorrecto. Use formato argentino: $1.234,56
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginTop: 'var(--spacing-xs)', 
          fontSize: '0.875rem',
          color: 'var(--color-expense-600)'
        }}>
          {error}
        </div>
      )}
    </div>
  );
>>>>>>> refs/remotes/origin/master
}
