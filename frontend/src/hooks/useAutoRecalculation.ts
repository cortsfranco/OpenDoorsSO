import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseAutoRecalculationOptions {
  onDataChange?: () => void;
  debounceMs?: number;
}

export function useAutoRecalculation({
  onDataChange,
  debounceMs = 1000
}: UseAutoRecalculationOptions) {
  const { user } = useAuth();

  const triggerRecalculation = useCallback(async () => {
    if (!user) return;

    try {
      // Aquí puedes agregar lógica para recálculo automático
      // Por ejemplo, invalidar caché, refrescar datos, etc.
      if (onDataChange) {
        onDataChange();
      }

      // Opcional: Mostrar notificación de recálculo
      console.log('Datos recalculados automáticamente');
    } catch (error) {
      console.error('Error en recálculo automático:', error);
    }
  }, [user, onDataChange]);

  // Función para ser llamada cuando se actualicen datos
  const onDataUpdated = useCallback(() => {
    // Debounce para evitar múltiples recálculos
    const timeoutId = setTimeout(() => {
      triggerRecalculation();
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [triggerRecalculation, debounceMs]);

  return {
    onDataUpdated,
    triggerRecalculation
  };
}
