import React, { useState, useMemo } from 'react';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from './DashboardIcons';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  defaultPageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  actions?: (item: T) => React.ReactNode;
  actionsHeader?: string;
  filterComponent?: React.ReactNode;
  extraHeaderActions?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  searchPlaceholder = 'Rechercher...',
  searchKeys,
  defaultPageSize = 10,
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
  actions,
  actionsHeader = 'Actions',
  filterComponent,
  extraHeaderActions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filtrage par terme de recherche
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const term = searchTerm.toLowerCase();
    return data.filter((item) => {
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const val = item[key as string];
          if (val === null || val === undefined) return false;
          if (typeof val === 'object') {
            return JSON.stringify(val).toLowerCase().includes(term);
          }
          return String(val).toLowerCase().includes(term);
        });
      }

      // Par défaut, cherche dans toutes les valeurs directes
      return Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return JSON.stringify(val).toLowerCase().includes(term);
        }
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, searchKeys]);

  // Tri
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, safeCurrentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const startEntry = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endEntry = Math.min(safeCurrentPage * pageSize, totalItems);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm overflow-hidden">
      {/* Barre d'outils de recherche et filtres */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {filterComponent}
          {extraHeaderActions}
        </div>
      </div>

      {/* Contenu du tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/75 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold uppercase tracking-wider">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-5 py-3.5 ${col.className || ''} ${
                    col.sortable ? 'cursor-pointer select-none hover:text-teal transition-colors' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-gray-400 text-xs">
                        {sortKey === col.key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-5 py-3.5 text-right" style={{ width: '120px' }}>
                  {actionsHeader}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-12 text-center">
                  <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <div className="w-5 h-5 border-2 border-teal border-t-transparent rounded-full animate-spin"></div>
                    <span>Chargement des données...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-5 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-5 py-3.5 text-gray-700 dark:text-gray-200 ${col.className || ''}`}>
                      {col.render ? col.render(item) : item[col.key] ?? '-'}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Barre de pagination */}
      {!loading && totalItems > 0 && (
        <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-700/80 bg-gray-50/40 dark:bg-gray-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>Affichage de</span>
            <span className="font-semibold text-gray-900 dark:text-white">{startEntry}</span>
            <span>à</span>
            <span className="font-semibold text-gray-900 dark:text-white">{endEntry}</span>
            <span>sur</span>
            <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span>
            <span>éléments</span>

            <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>

            <label htmlFor="pageSizeSelect" className="sr-only">Éléments par page</label>
            <select
              id="pageSizeSelect"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-teal"
            >
              <option value={10}>10 par page</option>
              <option value={25}>25 par page</option>
              <option value={50}>50 par page</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Page précédente"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-medium text-gray-700 dark:text-gray-300">
              Page {safeCurrentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Page suivante"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;

