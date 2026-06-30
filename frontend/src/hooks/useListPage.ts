import { useState, useCallback } from 'react';

/**
 * Shared hook for list pages with pagination and search state.
 * Eliminates the repetitive useState boilerplate duplicated across
 * every admin CRUD page (Customers, Suppliers, Branches, Locations, etc.).
 */

export interface UseListPageOptions {
  /** Default page size (default: 15) */
  defaultPageSize?: number;
}

export interface UseListPageReturn<TFilters extends Record<string, string>> {
  page: number;
  pageSize: number;
  search: string;
  filters: TFilters;
  setPage: (p: number) => void;
  setSearch: (s: string) => void;
  setFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;
  resetFilters: () => void;
}

export function useListPage<TFilters extends Record<string, string> = Record<string, string>>(
  initialFilters: TFilters,
  options: UseListPageOptions = {},
): UseListPageReturn<TFilters> {
  const { defaultPageSize = 15 } = options;

  const [page, setPage] = useState(1);
  const [pageSize] = useState(defaultPageSize);
  const [search, setSearchRaw] = useState('');
  const [filters, setFilters] = useState<TFilters>(initialFilters);

  const setSearch = useCallback((val: string) => {
    setSearchRaw(val);
    setPage(1);
  }, []);

  const setFilter = useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchRaw('');
    setPage(1);
  }, [initialFilters]);

  return { page, pageSize, search, filters, setPage, setSearch, setFilter, resetFilters };
}
