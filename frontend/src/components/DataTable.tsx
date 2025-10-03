import React, { useState, useMemo } from 'react';
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
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

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
          </div>
        </div>
      )}
    </div>
  );
}
