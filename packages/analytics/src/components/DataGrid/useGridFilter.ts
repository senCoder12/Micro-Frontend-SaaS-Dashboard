/**
 * useGridFilter — Global search + per-column filter with built-in debounce.
 *
 * WHY debounce (not filter on every keystroke):
 *   Filtering 1,000 rows on every character typed = O(n) × keystrokes.
 *   At 200ms debounce, rapid typing queues ONE filter operation that runs
 *   after the user pauses. The difference is imperceptible to the user
 *   but saves dozens of O(n) passes per second.
 *
 * Architecture:
 *   inputValue (immediate) → debounced 200ms → useMemo filter computation
 *
 *   inputValue updates instantly for responsive UI feel.
 *   The expensive filter only runs when debounced value settles.
 *
 * Two filter modes:
 *   1. Global filter  — searches ALL column values
 *   2. Column filters — per-column substring match
 *   Both are ANDed: a row must pass ALL active column filters AND global filter.
 */
import { useState, useMemo, useCallback, useEffect } from 'react';

// ── Debounce hook ──────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

// ── Filter hook ────────────────────────────────────────────────────────────

export interface GridFilterResult<T> {
  filteredData:    T[];
  globalFilter:    string;    // raw input value (used by controlled input)
  setGlobalFilter: (v: string) => void;
  columnFilters:   Record<string, string>;
  setColumnFilter: (key: string, value: string) => void;
  clearFilters:    () => void;
  activeFilterCount: number;
}

export function useGridFilter<T extends Record<string, unknown>>(
  data: T[],
  debounceMs = 200
): GridFilterResult<T> {
  const [globalFilter, setGlobalFilter]   = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const debouncedGlobal  = useDebounce(globalFilter, debounceMs);
  const debouncedColumns = useDebounce(columnFilters, debounceMs);

  const setColumnFilter = useCallback((key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setGlobalFilter('');
    setColumnFilters({});
  }, []);

  /**
   * filteredData is memoized — only recomputed when:
   *   - data reference changes (new API response)
   *   - debouncedGlobal changes (user stopped typing in global search)
   *   - debouncedColumns changes (user stopped typing in column filter)
   *
   * This means sorting, editing, and scrolling DON'T trigger re-filter.
   */
  const filteredData = useMemo(() => {
    let result = data;

    // ── Global filter ──────────────────────────────────────────────────────
    const globalTerm = debouncedGlobal.trim().toLowerCase();
    if (globalTerm) {
      result = result.filter((row) =>
        Object.values(row).some((v) =>
          String(v ?? '').toLowerCase().includes(globalTerm)
        )
      );
    }

    // ── Column filters (AND logic) ─────────────────────────────────────────
    const activeColumns = Object.entries(debouncedColumns).filter(
      ([, v]) => v.trim() !== ''
    );

    if (activeColumns.length > 0) {
      result = result.filter((row) =>
        activeColumns.every(([key, term]) =>
          String(row[key] ?? '').toLowerCase().includes(term.trim().toLowerCase())
        )
      );
    }

    return result;
  }, [data, debouncedGlobal, debouncedColumns]);

  const activeFilterCount =
    (globalFilter.trim() ? 1 : 0) +
    Object.values(columnFilters).filter((v) => v.trim()).length;

  return {
    filteredData,
    globalFilter,
    setGlobalFilter,
    columnFilters,
    setColumnFilter,
    clearFilters,
    activeFilterCount,
  };
}
