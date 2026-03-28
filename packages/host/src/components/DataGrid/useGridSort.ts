/**
 * useGridSort — Manages sort state and produces a sorted copy of the data.
 *
 * WHY useMemo for the sorted result:
 *   Sorting 1,000 rows is O(n log n) — roughly 10,000 comparisons.
 *   Without memoization this runs on EVERY render, including renders
 *   triggered by a filter input changing or a cell being edited.
 *   useMemo caches the result and only re-sorts when `data` or `sortState` changes.
 *
 * Sort cycle: none → asc → desc → none (clicking the same column cycles through)
 * Clicking a different column resets to asc.
 */
import { useState, useMemo, useCallback } from 'react';
import type { SortState } from './types';

export interface GridSortResult<T> {
  sortedData: T[];
  sortState:  SortState;
  toggleSort: (key: string) => void;
  clearSort:  () => void;
}

export function useGridSort<T extends Record<string, unknown>>(
  data: T[]
): GridSortResult<T> {
  const [sortState, setSortState] = useState<SortState>({
    key:       null,
    direction: null,
  });

  const toggleSort = useCallback((key: string) => {
    setSortState((prev) => {
      if (prev.key !== key)       return { key, direction: 'asc'  };
      if (prev.direction === 'asc')  return { key, direction: 'desc' };
      return { key: null, direction: null }; // third click clears sort
    });
  }, []);

  const clearSort = useCallback(() => {
    setSortState({ key: null, direction: null });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortState.key || !sortState.direction) return data;

    const { key, direction } = sortState;
    const multiplier = direction === 'asc' ? 1 : -1;

    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      // Nulls always go to the bottom regardless of direction
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * multiplier;
      }

      // Boolean comparison (true first on asc)
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return (Number(bVal) - Number(aVal)) * multiplier;
      }

      // String comparison — locale-aware, case-insensitive
      const cmp = String(aVal).localeCompare(String(bVal), undefined, {
        sensitivity: 'base',
        numeric:     true, // "10" > "9" instead of "10" < "9"
      });
      return cmp * multiplier;
    });
  }, [data, sortState]);

  return { sortedData, sortState, toggleSort, clearSort };
}
