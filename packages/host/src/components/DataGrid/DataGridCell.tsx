/**
 * DataGridCell — Renders a single cell.
 *
 * Two modes:
 *   READ  — displays formatted value (respects column `type`)
 *   EDIT  — renders a controlled <input>, commits on Enter/blur, cancels on Escape
 *
 * Cell formatting by type:
 *   currency → "$1,234.56"
 *   duration → "4m 32s"
 *   date     → "Mar 28, 2026"
 *   badge    → colored pill based on value
 *   boolean  → "Yes" / "No"
 *   number   → locale-formatted with numeric tabular font
 *   text     → as-is
 */
import React, { useRef, useEffect } from 'react';
import type { ColumnDef, EditState, CellType } from './types';

// ── Value formatters ───────────────────────────────────────────────────────

function formatValue(value: unknown, type?: CellType): string {
  if (value == null) return '—';

  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style:                 'currency',
        currency:              'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(value));

    case 'number':
      return new Intl.NumberFormat('en-US').format(Number(value));

    case 'duration': {
      const secs = Number(value);
      const m    = Math.floor(secs / 60);
      const s    = secs % 60;
      return `${m}m ${String(s).padStart(2, '0')}s`;
    }

    case 'date':
      return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }).format(new Date(String(value)));

    case 'boolean':
      return value ? 'Yes' : 'No';

    default:
      return String(value);
  }
}

const BADGE_COLORS: Record<string, string> = {
  // browsers
  chrome:  'badge-cell--blue',
  firefox: 'badge-cell--orange',
  safari:  'badge-cell--purple',
  edge:    'badge-cell--teal',
  opera:   'badge-cell--red',
  // countries — just a few
  'united states': 'badge-cell--blue',
  germany:         'badge-cell--yellow',
  'united kingdom': 'badge-cell--purple',
  india:           'badge-cell--orange',
  japan:           'badge-cell--red',
};

function BadgeCell({ value }: { value: string }) {
  const colorClass = BADGE_COLORS[value.toLowerCase()] ?? 'badge-cell--default';
  return <span className={`badge-cell ${colorClass}`}>{value}</span>;
}

// ── Cell component ─────────────────────────────────────────────────────────

interface DataGridCellProps<T extends Record<string, unknown>> {
  col:          ColumnDef<T>;
  row:          T;
  rowIndex:     number;
  editState:    EditState | null;
  onEditStart:  (rowIndex: number, colKey: string, currentValue: string) => void;
  onEditChange: (draft: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
}

function DataGridCellInner<T extends Record<string, unknown>>({
  col,
  row,
  rowIndex,
  editState,
  onEditStart,
  onEditChange,
  onEditCommit,
  onEditCancel,
}: DataGridCellProps<T>) {
  const isEditing =
    editState?.rowIndex === rowIndex && editState.colKey === col.key;

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input when edit mode activates
  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const rawValue = row[col.key];

  // ── Edit mode ────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div className="grid-cell grid-cell--editing">
        <input
          ref={inputRef}
          className="grid-cell__input"
          value={editState.draft}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter')  { e.preventDefault(); onEditCommit();  }
            if (e.key === 'Escape') { e.preventDefault(); onEditCancel(); }
          }}
          aria-label={`Edit ${col.header}`}
        />
      </div>
    );
  }

  // ── Custom render ─────────────────────────────────────────────────────────
  if (col.renderCell) {
    return (
      <div className="grid-cell">
        {col.renderCell(rawValue, row, rowIndex)}
      </div>
    );
  }

  // ── Formatted read mode ───────────────────────────────────────────────────
  const displayValue = formatValue(rawValue, col.type);
  const isBadge      = col.type === 'badge';
  const isNumeric    = col.type === 'number' || col.type === 'currency' || col.type === 'duration';

  const handleClick = () => {
    if (col.editable) {
      onEditStart(rowIndex, col.key, String(rawValue ?? ''));
    }
  };

  return (
    <div
      className={[
        'grid-cell',
        col.editable  ? 'grid-cell--editable'  : '',
        isNumeric     ? 'grid-cell--numeric'    : '',
      ].filter(Boolean).join(' ')}
      onClick={handleClick}
      title={col.editable ? `Click to edit ${col.header}` : undefined}
    >
      {isBadge
        ? <BadgeCell value={String(rawValue ?? '')} />
        : <span className="grid-cell__text">{displayValue}</span>
      }
    </div>
  );
}

// Memo: re-render only when this specific cell's data or edit state changes
const DataGridCell = React.memo(DataGridCellInner) as typeof DataGridCellInner;
export default DataGridCell;
