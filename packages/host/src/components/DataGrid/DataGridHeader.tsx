/**
 * DataGridHeader — Sticky column headers with sort indicators and filter inputs.
 *
 * Two rows:
 *   Row 1: column names + sort arrows (click to sort)
 *   Row 2: per-column filter inputs (empty = inactive)
 *
 * The header is position: sticky so it stays visible during scroll.
 * It uses the SAME gridTemplateColumns as the data rows —
 * this is how column widths stay aligned without a <table> layout.
 */
import React from 'react';
import type { ColumnDef, SortState } from './types';

interface DataGridHeaderProps<T> {
  columns:       ColumnDef<T>[];
  gridColumns:   string;
  sortState:     SortState;
  onSort:        (key: string) => void;
  columnFilters: Record<string, string>;
  onColumnFilter: (key: string, value: string) => void;
}

function SortArrow({ direction }: { direction: 'asc' | 'desc' | null }) {
  if (!direction) {
    return <span className="sort-arrow sort-arrow--none" aria-hidden="true">⇅</span>;
  }
  return (
    <span className={`sort-arrow sort-arrow--${direction}`} aria-hidden="true">
      {direction === 'asc' ? '↑' : '↓'}
    </span>
  );
}

function DataGridHeaderInner<T>({
  columns,
  gridColumns,
  sortState,
  onSort,
  columnFilters,
  onColumnFilter,
}: DataGridHeaderProps<T>) {
  return (
    <div className="grid-header" role="rowgroup">
      {/* Column name row */}
      <div
        className="grid-header__row grid-header__row--labels"
        style={{ gridTemplateColumns: gridColumns }}
        role="row"
      >
        {columns.map((col) => {
          const isActive = sortState.key === col.key;
          return (
            <div
              key={col.key}
              className={[
                'grid-header__cell',
                col.sortable ? 'grid-header__cell--sortable' : '',
                isActive     ? 'grid-header__cell--active'   : '',
              ].filter(Boolean).join(' ')}
              role="columnheader"
              aria-sort={
                isActive
                  ? sortState.direction === 'asc' ? 'ascending' : 'descending'
                  : 'none'
              }
              onClick={() => col.sortable && onSort(col.key)}
            >
              <span className="grid-header__label">{col.header}</span>
              {col.sortable && (
                <SortArrow direction={isActive ? sortState.direction : null} />
              )}
            </div>
          );
        })}
      </div>

      {/* Column filter row — only shown if any column is filterable */}
      {columns.some((c) => c.filterable) && (
        <div
          className="grid-header__row grid-header__row--filters"
          style={{ gridTemplateColumns: gridColumns }}
          role="row"
        >
          {columns.map((col) => (
            <div key={col.key} className="grid-header__filter-cell" role="columnheader">
              {col.filterable ? (
                <input
                  className="grid-header__filter-input"
                  value={columnFilters[col.key] ?? ''}
                  onChange={(e) => onColumnFilter(col.key, e.target.value)}
                  placeholder={`Filter ${col.header}…`}
                  aria-label={`Filter by ${col.header}`}
                  type="search"
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DataGridHeader = React.memo(DataGridHeaderInner) as typeof DataGridHeaderInner;
export default DataGridHeader;
