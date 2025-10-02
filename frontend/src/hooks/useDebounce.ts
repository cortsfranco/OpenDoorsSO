import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debounce de valores
 * @param value - El valor a debounce
 * @param delay - El delay en milisegundos
 * @returns El valor debounced
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para autoguardado con debounce
 * @param value - El valor a guardar
 * @param saveFunction - Función que realiza el guardado
 * @param delay - Delay en milisegundos (por defecto 800ms)
 * @returns Estado del guardado
 */
export function useAutoSave<T>(
  value: T,
  saveFunction: (value: T) => Promise<void>,
  delay: number = 800
): {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
} {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    if (debouncedValue !== value) return; // Solo guardar cuando el valor se estabilice
    
    const save = async () => {
      setIsSaving(true);
      setError(null);
      
      try {
        await saveFunction(debouncedValue);
        setLastSaved(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar');
      } finally {
        setIsSaving(false);
      }
    };

    save();
  }, [debouncedValue, saveFunction]);

  return { isSaving, lastSaved, error };
}
