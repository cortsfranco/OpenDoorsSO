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
}
