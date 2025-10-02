import { useEffect, useRef } from 'react';
import useDebounce from './useDebounce';
import apiService from '@/services/api';
import { useNotifications } from './useNotifications';

interface AutoSaveOptions {
  delay?: number;
  enabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  showNotifications?: boolean;
}

export function useAutoSave<T>(
  value: T,
  saveFunction: (data: T) => Promise<any>,
  options: AutoSaveOptions = {}
) {
  const {
    delay = 800,
    enabled = true,
    onSuccess,
    onError,
    showNotifications = false
  } = options;

  const debouncedValue = useDebounce(value, delay);
  const previousValueRef = useRef<T>(value);
  const isInitialMount = useRef(true);
  const { success, error } = useNotifications();

  useEffect(() => {
    // No guardar en el primer render
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousValueRef.current = debouncedValue;
      return;
    }

    // No guardar si está deshabilitado
    if (!enabled) return;

    // No guardar si el valor no ha cambiado
    if (JSON.stringify(debouncedValue) === JSON.stringify(previousValueRef.current)) {
      return;
    }

    // No guardar si el valor está vacío o es inválido
    if (!debouncedValue || (typeof debouncedValue === 'object' && Object.keys(debouncedValue).length === 0)) {
      return;
    }

    const performSave = async () => {
      try {
        await saveFunction(debouncedValue);
        previousValueRef.current = debouncedValue;
        
        if (showNotifications) {
          success('Cambios Guardados', 'Los cambios se han guardado automáticamente.');
        }
        
        onSuccess?.();
      } catch (err) {
        console.error('Error en autoguardado:', err);
        
        if (showNotifications) {
          error('Error de Guardado', 'No se pudieron guardar los cambios automáticamente.');
        }
        
        onError?.(err);
      }
    };

    performSave();
  }, [debouncedValue, enabled, saveFunction, onSuccess, onError, showNotifications, success, error]);

  return {
    isAutoSaving: enabled && JSON.stringify(value) !== JSON.stringify(previousValueRef.current)
  };
}

// Hook específico para facturas
export function useInvoiceAutoSave(
  invoiceId: number,
  invoiceData: any,
  options: AutoSaveOptions = {}
) {
  const saveInvoice = async (data: any) => {
    return await apiService.updateInvoice(invoiceId, data);
  };

  return useAutoSave(invoiceData, saveInvoice, {
    delay: 800,
    showNotifications: false, // Las notificaciones se manejan en el componente
    ...options
  });
}

// Hook específico para socios
export function usePartnerAutoSave(
  partnerId: number,
  partnerData: any,
  options: AutoSaveOptions = {}
) {
  const savePartner = async (data: any) => {
    return await apiService.updatePartner(partnerId, data);
  };

  return useAutoSave(partnerData, savePartner, {
    delay: 800,
    showNotifications: false,
    ...options
  });
}
