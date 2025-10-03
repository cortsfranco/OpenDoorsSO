import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseRealTimeEditOptions {
  onUpdate?: (id: number, field: string, value: any) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  debounceMs?: number;
}

export function useRealTimeEdit({
  onUpdate,
  onDelete,
  debounceMs = 500
}: UseRealTimeEditOptions) {
  const [editingCells, setEditingCells] = useState<Set<string>>(new Set());
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, any>>(new Map());

  const startEditing = useCallback((cellId: string) => {
    setEditingCells(prev => new Set([...prev, cellId]));
  }, []);

  const stopEditing = useCallback((cellId: string) => {
    setEditingCells(prev => {
      const newSet = new Set(prev);
      newSet.delete(cellId);
      return newSet;
    });
  }, []);

  const updateField = useCallback(async (
    id: number, 
    field: string, 
    value: any, 
    immediate: boolean = false
  ) => {
    const cellId = `${id}-${field}`;
    
    if (immediate) {
      try {
        if (onUpdate) {
          await onUpdate(id, field, value);
        }
        toast.success('Campo actualizado correctamente');
      } catch (error) {
        console.error('Error updating field:', error);
        toast.error('Error al actualizar el campo');
        throw error;
      }
    } else {
      // Debounced update
      setPendingUpdates(prev => new Map(prev.set(cellId, { id, field, value })));
      
      setTimeout(async () => {
        const update = pendingUpdates.get(cellId);
        if (update && onUpdate) {
          try {
            await onUpdate(update.id, update.field, update.value);
            setPendingUpdates(prev => {
              const newMap = new Map(prev);
              newMap.delete(cellId);
              return newMap;
            });
            toast.success('Campo actualizado correctamente');
          } catch (error) {
            console.error('Error updating field:', error);
            toast.error('Error al actualizar el campo');
          }
        }
      }, debounceMs);
    }
  }, [onUpdate, pendingUpdates, debounceMs]);

  const deleteItem = useCallback(async (id: number) => {
    try {
      if (onDelete) {
        await onDelete(id);
        toast.success('Elemento eliminado correctamente');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Error al eliminar el elemento');
      throw error;
    }
  }, [onDelete]);

  const isEditing = useCallback((cellId: string) => {
    return editingCells.has(cellId);
  }, [editingCells]);

  return {
    startEditing,
    stopEditing,
    updateField,
    deleteItem,
    isEditing,
    editingCells: Array.from(editingCells),
    pendingUpdates: Array.from(pendingUpdates.entries())
  };
}
