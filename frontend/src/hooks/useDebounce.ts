import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 1000): T {
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

// Uso en componentes de edición:
/*
const [invoiceData, setInvoiceData] = useState(initialData);
const debouncedData = useDebounce(invoiceData, 1000);

useEffect(() => {
  if (debouncedData) {
    invoicesAPI.update(id, debouncedData);
    toast.success('Guardado automáticamente');
  }
}, [debouncedData]);
*/