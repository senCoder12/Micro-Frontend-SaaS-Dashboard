/**
 * DataGrid — Reusable, virtualized data grid with sort, filter, and inline edit.
 *
 * Rendering pipeline on every state change:
 *
 *   prop `data`
 *     → useGridFilter  (debounced, O(n))   → filteredData
 *     → useGridSort    (memoized, O(n logn)) → sortedData
 *     → useVirtualScroll (O(1))              → startIndex, endIndex
 *     → sortedData.slice(startIndex, endIndex+1) → visibleRows
 *     → render visibleRows (~15 rows)
 *
 * All expensive steps (filter, sort) are memoized and only re-run
 * when their specific inputs change. Scroll events only trigger O(1)
 * math in useVirtualScroll, not re-filter or re-sort.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useGridFilter } from './useGridFilter';
import { useGridSort } from './useGridSort';
import { useVirtualScroll } from './useVirtualScroll';
import DataGridHeader from './DataGridHeader';
import DataGridRow from './DataGridRow';
import type { DataGridProps, EditState } from './types';

const DEFAULT_ROW_HEIGHT  = 44;
const DEFAULT_GRID_HEIGHT = 520;
const DEFAULT_OVERSCAN    = 3;

function DataGridInner<T extends Record<string, unknown>>({
  data,
  columns,
  rowHeight    = DEFAULT_ROW_HEIGHT,
  gridHeight   = DEFAULT_GRID_HEIGHT,
  overscan     = DEFAULT_OVERSCAN,
  onRowUpdate,
  onRowClick,
  emptyMessage = 'No records match your filters.',
}: DataGridProps<T>) {

  // ── Filter → Sort → Virtualize ──────────────────────────────────────────

  const {
    filteredData,
    globalFilter,
    setGlobalFilter,
    columnFilters,
    setColumnFilter,
    clearFilters,
    activeFilterCount,
  } = useGridFilter(data);

  const { sortedData, sortState, toggleSort } = useGridSort(filteredData);

  const {
    startIndex,
    endIndex,
    offsetY,
    bottomSpace,
    totalHeight,
    onScroll,
    containerRef,
  } = useVirtualScroll({
    totalRows:       sortedData.length,
    rowHeight,
    containerHeight: gridHeight,
    overscan,
  });

  // ── Inline edit state ────────────────────────────────────────────────────

  const [editState, setEditState] = useState<EditState | null>(null);

  const handleEditStart = useCallback((rowIndex: number, colKey: string, value: string) => {
    setEditState({ rowIndex, colKey, draft: value });
  }, []);

  const handleEditChange = useCallback((draft: string) => {
    setEditState((prev) => prev ? { ...prev, draft } : null);
  }, []);

  const handleEditCommit = useCallback(() => {
    if (!editState || !onRowUpdate) { setEditState(null); return; }

    const targetRow = sortedData[editState.rowIndex];
    if (targetRow) {
      // Find index in the ORIGINAL data array to pass to the callback
      const originalIndex = data.indexOf(targetRow);
      const updatedRow = { ...targetRow, [editState.colKey]: editState.draft } as T;
      onRowUpdate(updatedRow, originalIndex);
    }
    setEditState(null);
  }, [editState, sortedData, data, onRowUpdate]);

  const handleEditCancel = useCallback(() => {
    setEditState(null);
  }, []);

  // ── Column widths ────────────────────────────────────────────────────────

  /**
   * Build CSS grid-template-columns once.
   * Columns with explicit `width` get fixed pixel sizes.
   * Others share remaining space with `1fr`.
   *
   * e.g., "80px 1fr 120px 1fr 100px 80px"
   */
  const gridColumns = useMemo(
    () => columns.map((c) => c.width ? `${c.width}px` : '1fr').join(' '),
    [columns]
  );

  // ── Visible row slice ────────────────────────────────────────────────────

  const visibleRows = sortedData.slice(startIndex, endIndex + 1);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="data-grid" role="grid" aria-rowcount={sortedData.length}>

      {/* Toolbar: global search + stats */}
      <div className="data-grid__toolbar">
        <div className="data-grid__search-wrap">
          <span className="data-grid__search-icon" aria-hidden="true">⌕</span>
          <input
            className="data-grid__search"
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search all columns…"
            aria-label="Search all columns"
          />
          {activeFilterCount > 0 && (
            <button
              className="data-grid__clear-btn"
              type="button"
              onClick={clearFilters}
              aria-label="Clear all filters"
            >
              ✕ Clear ({activeFilterCount})
            </button>
          )}
        </div>

        <div className="data-grid__meta">
          <span className="data-grid__count">
            {sortedData.length.toLocaleString()}
            {sortedData.length !== data.length && (
              <span className="data-grid__count-total"> of {data.length.toLocaleString()}</span>
            )} rows
          </span>
          {sortState.key && (
            <span className="data-grid__sort-indicator">
              Sorted by <strong>{columns.find(c => c.key === sortState.key)?.header}</strong>
              {' '}{sortState.direction}
            </span>
          )}
        </div>
      </div>

      {/* Sticky header */}
      <DataGridHeader
        columns={columns}
        gridColumns={gridColumns}
        sortState={sortState}
        onSort={toggleSort}
        columnFilters={columnFilters}
        onColumnFilter={setColumnFilter}
      />

      {/* Virtualized body */}
      <div
        ref={containerRef}
        className="data-grid__body"
        style={{ height: gridHeight }}
        onScroll={onScroll}
        role="rowgroup"
        tabIndex={0}
        aria-label="Data grid body"
      >
        {sortedData.length === 0 ? (
          <div className="data-grid__empty">{emptyMessage}</div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            {/* Top spacer — maintains scroll position */}
            <div style={{ height: offsetY }} aria-hidden="true" />

            {/* Visible rows only */}
            {visibleRows.map((row, i) => {
              const absoluteIndex = startIndex + i;
              return (
                <DataGridRow
                  key={absoluteIndex}
                  row={row}
                  columns={columns}
                  rowIndex={absoluteIndex}
                  rowHeight={rowHeight}
                  gridColumns={gridColumns}
                  isEven={absoluteIndex % 2 === 0}
                  editState={editState}
                  onRowClick={onRowClick}
                  onEditStart={handleEditStart}
                  onEditChange={handleEditChange}
                  onEditCommit={handleEditCommit}
                  onEditCancel={handleEditCancel}
                />
              );
            })}

            {/* Bottom spacer — fills remaining scroll range */}
            <div style={{ height: bottomSpace }} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Footer: virtual scroll info (helpful for demos and debugging) */}
      <div className="data-grid__footer">
        <span className="data-grid__footer-text">
          Showing rows {startIndex + 1}–{Math.min(endIndex + 1, sortedData.length)} of {sortedData.length.toLocaleString()}
          {' '}(virtual scroll — only {visibleRows.length} DOM nodes rendered)
        </span>
      </div>
    </div>
  );
}

/**
 * DataGrid is a generic component. TypeScript requires re-declaration
 * after React.memo to preserve the generic type parameter.
 */
const DataGrid = React.memo(DataGridInner) as typeof DataGridInner;
export default DataGrid;
