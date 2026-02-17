import { useState, useMemo, ReactNode, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Download, Search, Filter } from 'lucide-react';
import { clsx } from 'clsx';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'date' | 'number';
  filterOptions?: { label: string; value: string }[];
  className?: string;
  headerClassName?: string;
}

interface EnhancedDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  emptyMessage?: string;
  loading?: boolean;
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  // Filters
  filterable?: boolean;
  onFilterChange?: (filters: Record<string, any>) => void;
  // Pagination
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  };
  // Export
  exportable?: boolean;
  exportFileName?: string;
  onExport?: () => void;
  // Sticky headers
  stickyHeader?: boolean;
  maxHeight?: string;
}

export default function EnhancedDataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  selectable = false,
  onSelectionChange,
  emptyMessage = 'No data available',
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search...',
  onSearch,
  filterable = true,
  onFilterChange,
  pagination,
  exportable = true,
  exportFileName = 'data',
  onExport,
  stickyHeader = true,
  maxHeight = 'calc(100vh - 300px)',
}: EnhancedDataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  const tableRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLTableSectionElement>(null);

  // Handle search
  useEffect(() => {
    if (onSearch) {
      const timeoutId = setTimeout(() => {
        onSearch(searchQuery);
      }, 300); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, onSearch]);

  // Handle filter changes
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(columnFilters);
    }
  }, [columnFilters, onFilterChange]);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    if (sortColumn === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column.key);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set(data.map(keyExtractor));
      setSelectedRows(allKeys);
      if (onSelectionChange) {
        onSelectionChange(data);
      }
    } else {
      setSelectedRows(new Set());
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectRow = (item: T, checked: boolean) => {
    const key = keyExtractor(item);
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(key);
    } else {
      newSelected.delete(key);
    }
    setSelectedRows(newSelected);
    if (onSelectionChange) {
      const selectedItems = data.filter((item) => newSelected.has(keyExtractor(item)));
      onSelectionChange(selectedItems);
    }
  };

  const handleFilterChange = (columnKey: string, value: any) => {
    setColumnFilters((prev) => {
      if (value === '' || value === null || value === undefined) {
        const newFilters = { ...prev };
        delete newFilters[columnKey];
        return newFilters;
      }
      return { ...prev, [columnKey]: value };
    });
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }

    // Default CSV export
    const headers = columns.map((col) => col.label);
    const rows = data.map((item) =>
      columns.map((col) => {
        const value = col.render ? col.render(item) : (item as any)[col.key];
        return String(value || '').replace(/,/g, ';'); // Replace commas to avoid CSV issues
      })
    );

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${exportFileName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    const column = columns.find((col) => col.key === sortColumn);
    if (!column || !column.sortable) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortColumn];
      const bValue = (b as any)[sortColumn];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection, columns]);

  const filterableColumns = columns.filter((col) => col.filterable);

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4 p-6">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          {searchable && (
            <div className="relative flex-1 w-full min-w-0 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 min-h-[2.75rem] sm:min-h-0 text-base sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label="Search"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {filterable && filterableColumns.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={clsx(
                  'min-h-[2.75rem] px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                  showFilters
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                )}
              >
                <Filter className="w-4 h-4 flex-shrink-0" />
                Filters
                {Object.keys(columnFilters).length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-primary-700 rounded-full text-xs">
                    {Object.keys(columnFilters).length}
                  </span>
                )}
              </button>
            )}
            {exportable && (
              <button
                type="button"
                onClick={handleExport}
                className="min-h-[2.75rem] px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4 flex-shrink-0" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && filterableColumns.length > 0 && (
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Column Filters</h3>
              <button
                onClick={() => {
                  setColumnFilters({});
                  setShowFilters(false);
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterableColumns.map((column) => (
                <div key={column.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {column.label}
                  </label>
                  {column.filterType === 'select' && column.filterOptions ? (
                    <select
                      value={columnFilters[column.key] || ''}
                      onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">All</option>
                      {column.filterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : column.filterType === 'date' ? (
                    <input
                      type="date"
                      value={columnFilters[column.key] || ''}
                      onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : column.filterType === 'number' ? (
                    <input
                      type="number"
                      value={columnFilters[column.key] || ''}
                      onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={`Filter ${column.label}...`}
                      value={columnFilters[column.key] || ''}
                      onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  )}
                  {columnFilters[column.key] && (
                    <button
                      onClick={() => handleFilterChange(column.key, '')}
                      className="mt-1 text-xs text-red-600 hover:text-red-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table – horizontal scroll on small screens, touch-friendly */}
      <div
        ref={tableRef}
        className="table-responsive overflow-x-auto overflow-y-auto"
        style={{ maxHeight: stickyHeader ? maxHeight : 'none' }}
      >
        <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '600px' }}>
          <thead
            ref={headerRef}
            className={clsx(
              'bg-gray-50',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:bg-gray-100 transition-colors',
                    column.headerClassName || column.className,
                    stickyHeader && 'bg-gray-50'
                  )}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary-600" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item) => {
                const key = keyExtractor(item);
                const isSelected = selectedRows.has(key);
                return (
                  <tr
                    key={key}
                    className={clsx(
                      'hover:bg-gray-50 transition-colors',
                      isSelected && 'bg-primary-50',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick && onRowClick(item)}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(item, e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={clsx(
                          'px-4 py-3 whitespace-nowrap text-sm text-gray-900',
                          column.className
                        )}
                      >
                        {column.render ? column.render(item) : (item as any)[column.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(
                  pagination.currentPage * pagination.itemsPerPage,
                  pagination.totalItems
                )}
              </span>{' '}
              of <span className="font-medium">{pagination.totalItems}</span> results
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="min-h-[2.75rem] px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first page, last page, current page, and pages around current
                    return (
                      page === 1 ||
                      page === pagination.totalPages ||
                      (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                    );
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showEllipsis && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => pagination.onPageChange(page)}
                          className={clsx(
                            'min-h-[2.75rem] min-w-[2.75rem] px-3 py-2 text-sm font-medium rounded-lg',
                            page === pagination.currentPage
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          )}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}
              </div>
              <button
                type="button"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="min-h-[2.75rem] px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

