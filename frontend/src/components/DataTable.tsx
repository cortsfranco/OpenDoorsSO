import React, { useState, useMemo } from 'react';
<<<<<<< HEAD
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
=======
import { Search, ChevronUp, ChevronDown, Pencil, Trash2, Check } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  editable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  selectable?: boolean;
  pagination?: boolean;
  pageSize?: number;
}

export function DataTable<T extends { id?: number | string }>({
  data,
  columns,
  onEdit,
  onDelete,
  onRowClick,
  searchable = true,
  selectable = false,
  pagination = true,
  pageSize = 10
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number | string>>(new Set());

  // Filtrado
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row => {
      return columns.some(col => {
        const value = (row as any)[col.key];
>>>>>>> refs/remotes/origin/master
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

<<<<<<< HEAD
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
                    onClick={(e) => {
                      // No ejecutar onRowClick si se clickeó un elemento interactivo
                      const target = e.target as HTMLElement;
                      if (target.closest('button, a, input, [role="button"]')) {
                        return;
                      }
                      onRowClick?.(item);
                    }}
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
              onClick={(e) => {
                // No ejecutar onRowClick si se clickeó un elemento interactivo
                const target = e.target as HTMLElement;
                if (target.closest('button, a, input, [role="button"]')) {
                  return;
                }
                onRowClick?.(item);
              }}
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
=======
  // Ordenamiento
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = (a as any)[sortColumn];
      const bVal = (b as any)[sortColumn];
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginación
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleRowSelection = (id: number | string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="data-table-container">
      {/* Barra de búsqueda */}
      {searchable && (
        <div className="search-bar" style={{ marginBottom: 'var(--spacing-md)' }}>
          <div className="input-group">
            <Search size={20} />
            <input
              type="text"
              className="input"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: '50px' }}>
                  <input type="checkbox" />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key.toString()}
                  onClick={() => col.sortable && handleSort(col.key.toString())}
                  style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {col.label}
                    {col.sortable && sortColumn === col.key && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && <th style={{ width: '100px' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {selectable && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id!)}
                      onChange={() => toggleRowSelection(row.id!)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key.toString()}>
                    {col.render 
                      ? col.render((row as any)[col.key], row)
                      : (row as any)[col.key]
                    }
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {onEdit && (
                        <button
                          className="btn btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(row);
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(row);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination && totalPages > 1 && (
        <div className="pagination" style={{ 
          marginTop: 'var(--spacing-md)', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span style={{ padding: '8px 16px' }}>
              Página {currentPage} de {totalPages}
            </span>
            <button
              className="btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
>>>>>>> refs/remotes/origin/master
          </div>
        </div>
      )}
    </div>
  );
}
