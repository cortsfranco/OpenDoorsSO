import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  onSelectionChange?: (selectedItems: T[]) => void;
  selectable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  itemsPerPage?: number;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  onRowClick,
  onSelectionChange,
  selectable = false,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No hay datos disponibles',
  itemsPerPage = 10
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number | string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar datos por término de búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return columns.some(column => {
        const value = (item as any)[column.key];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  // Ordenar datos
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = (a as any)[sortConfig.key];
      const bVal = (b as any)[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginación
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Manejar ordenamiento
  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  // Manejar selección
  const handleSelectAll = () => {
    if (selectedItems.size === paginatedData.length) {
      setSelectedItems(new Set());
      onSelectionChange?.([]);
    } else {
      const newSelected = new Set(paginatedData.map(item => item.id));
      setSelectedItems(newSelected);
      onSelectionChange?.(paginatedData);
    }
  };

  const handleSelectItem = (item: T) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.add(item.id);
    }
    setSelectedItems(newSelected);
    onSelectionChange?.(Array.from(newSelected).map(id => data.find(d => d.id === id)!).filter(Boolean));
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      {searchable && (
        <div className="stack-mobile">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base pl-10"
            />
          </div>
          {selectedItems.size > 0 && (
            <span className="text-muted">
              {selectedItems.size} seleccionado{selectedItems.size !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Vista Desktop: Tabla */}
      <div className="hide-mobile table-container">
        <table className="table-base table-sorter">
            <thead className="table-header">
              <tr>
                {selectable && (
                  <th className="table-header-cell w-12">
                    <Checkbox
                      checked={paginatedData.length > 0 && selectedItems.size === paginatedData.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`table-header-cell ${column.sortable !== false ? 'sortable' : ''} ${column.width || ''} ${
                      sortConfig?.key === column.key 
                        ? sortConfig.direction === 'asc' ? 'sort-asc' : 'sort-desc'
                        : ''
                    }`}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <span>{column.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="table-body">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="table-cell text-center py-8 text-muted"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className={`table-row transition-smooth
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${selectedItems.has(item.id) ? 'bg-primary/5' : ''}
                    `}
                    onClick={() => onRowClick?.(item)}
                  >
                    {selectable && (
                      <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => handleSelectItem(item)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className="table-cell">
                        {column.render ? column.render(item) : (item as any)[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {/* Vista Mobile: Cards */}
      <div className="show-mobile space-y-3">
        {paginatedData.length === 0 ? (
          <div className="card-base p-8 text-center text-muted">
            {emptyMessage}
          </div>
        ) : (
          paginatedData.map((item) => (
            <div
              key={item.id}
              className={`card-base p-4 transition-smooth
                ${onRowClick ? 'cursor-pointer hover:shadow-md' : ''}
                ${selectedItems.has(item.id) ? 'bg-primary/5 border-primary' : ''}
              `}
              onClick={() => onRowClick?.(item)}
            >
              {selectable && (
                <div className="mb-3 pb-3 border-b" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => handleSelectItem(item)}
                    className="mr-2"
                  />
                  <span className="text-sm text-muted">Seleccionar</span>
                </div>
              )}
              <div className="space-y-2">
                {columns.map((column) => (
                  <div key={column.key} className="flex justify-between items-start gap-2">
                    <span className="text-muted text-sm font-medium min-w-[100px]">
                      {column.label}:
                    </span>
                    <span className="text-sm text-right flex-1">
                      {column.render ? column.render(item) : (item as any)[column.key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="stack-mobile">
          <div className="text-muted hide-mobile">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, sortedData.length)} de {sortedData.length} resultados
          </div>
          <div className="flex items-center gap-2 justify-center md:justify-end flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-sm"
            >
              Anterior
            </Button>
            <span className="text-muted text-sm whitespace-nowrap">
              Pág. {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-sm"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
