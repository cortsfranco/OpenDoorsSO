/**
 * Servicio de cache y optimización de rendimiento
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class CacheService {
  private static cache = new Map<string, CacheItem<any>>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Almacena datos en cache
   */
  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl
    });
  }

  /**
   * Obtiene datos del cache
   */
  static get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Verifica si existe un elemento en cache
   */
  static has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Elimina un elemento del cache
   */
  static delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpia todo el cache
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del cache
   */
  static getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    this.cache.forEach(item => {
      if (now - item.timestamp > item.expiresIn) {
        expired++;
      } else {
        valid++;
      }
    });

    return {
      total: this.cache.size,
      valid,
      expired,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estima el uso de memoria del cache
   */
  private static estimateMemoryUsage(): string {
    let totalSize = 0;
    
    this.cache.forEach((item, key) => {
      totalSize += key.length * 2; // UTF-16
      totalSize += JSON.stringify(item).length * 2;
    });

    if (totalSize < 1024) {
      return `${totalSize} B`;
    } else if (totalSize < 1024 * 1024) {
      return `${(totalSize / 1024).toFixed(2)} KB`;
    } else {
      return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
    }
  }
}

export class PaginationService {
  /**
   * Aplica paginación a un array de datos
   */
  static paginate<T>(
    data: T[], 
    options: PaginationOptions
  ): PaginatedResponse<T> {
    const { page, limit, sortBy, sortOrder = 'desc' } = options;
    
    // Ordenar datos si se especifica
    let sortedData = [...data];
    if (sortBy) {
      sortedData.sort((a, b) => {
        const aValue = this.getNestedValue(a, sortBy);
        const bValue = this.getNestedValue(b, sortBy);
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Calcular paginación
    const total = sortedData.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedData = sortedData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Obtiene un valor anidado de un objeto usando notación de punto
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

export class OptimizedApiService {
  private static requestCache = new Map<string, Promise<any>>();
  private static debounceTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Realiza una petición con cache y debounce
   */
  static async request<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: {
      cache?: boolean;
      ttl?: number;
      debounce?: number;
    } = {}
  ): Promise<T> {
    const { cache = true, ttl = 5 * 60 * 1000, debounce = 300 } = options;

    // Verificar cache primero
    if (cache) {
      const cachedData = CacheService.get<T>(key);
      if (cachedData) {
        return cachedData;
      }
    }

    // Verificar si hay una petición en curso
    if (this.requestCache.has(key)) {
      return this.requestCache.get(key)!;
    }

    // Aplicar debounce si está habilitado
    if (debounce > 0) {
      return new Promise((resolve, reject) => {
        // Limpiar timer anterior
        if (this.debounceTimers.has(key)) {
          clearTimeout(this.debounceTimers.get(key)!);
        }

        // Crear nuevo timer
        const timer = setTimeout(async () => {
          try {
            const result = await this.executeRequest(key, requestFn, cache, ttl);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.debounceTimers.delete(key);
          }
        }, debounce);

        this.debounceTimers.set(key, timer);
      });
    }

    return this.executeRequest(key, requestFn, cache, ttl);
  }

  /**
   * Ejecuta la petición real
   */
  private static async executeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    cache: boolean,
    ttl: number
  ): Promise<T> {
    try {
      const promise = requestFn();
      this.requestCache.set(key, promise);

      const result = await promise;

      // Almacenar en cache
      if (cache) {
        CacheService.set(key, result, ttl);
      }

      return result;
    } finally {
      this.requestCache.delete(key);
    }
  }

  /**
   * Invalida el cache para una clave específica
   */
  static invalidateCache(key: string): void {
    CacheService.delete(key);
    this.requestCache.delete(key);
  }

  /**
   * Invalida múltiples claves de cache
   */
  static invalidateCachePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    
    CacheService.getStats(); // Trigger cleanup
    this.requestCache.forEach((_, key) => {
      if (regex.test(key)) {
        CacheService.delete(key);
        this.requestCache.delete(key);
      }
    });
  }
}

// Hooks de React para usar el cache
export const useCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    cache?: boolean;
    ttl?: number;
    debounce?: number;
  } = {}
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await OptimizedApiService.request(key, fetcher, options);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key]);

  const refetch = React.useCallback(() => {
    OptimizedApiService.invalidateCache(key);
    // El useEffect se ejecutará automáticamente
  }, [key]);

  return { data, loading, error, refetch };
};

export const usePagination = <T>(
  data: T[],
  options: PaginationOptions
) => {
  const [paginationOptions, setPaginationOptions] = React.useState(options);

  const paginatedData = React.useMemo(() => {
    return PaginationService.paginate(data, paginationOptions);
  }, [data, paginationOptions]);

  const setPage = React.useCallback((page: number) => {
    setPaginationOptions(prev => ({ ...prev, page }));
  }, []);

  const setLimit = React.useCallback((limit: number) => {
    setPaginationOptions(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const setSort = React.useCallback((sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    setPaginationOptions(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  }, []);

  return {
    ...paginatedData,
    setPage,
    setLimit,
    setSort,
    paginationOptions
  };
};

// Importar React para los hooks
import React from 'react';
