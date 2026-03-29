/**
 * DataGrid Type System
 *
 * Generic over T — the row data shape.
 * All column/sort/filter types reference keyof T so the compiler
 * catches column key typos and value type mismatches at build time.
 */

// ── Column definition ──────────────────────────────────────────────────────

export type CellType = 'text' | 'number' | 'currency' | 'date' | 'duration' | 'badge' | 'boolean';

export interface ColumnDef<T> {
  /** Must match a key in the row data type */
  key:        keyof T & string;
  header:     string;
  /** Pixel width — omit for equal flex distribution */
  width?:     number;
  minWidth?:  number;
  /** Controls sort arrow visibility */
  sortable?:  boolean;
  /** Shows a per-column filter input in the filter row */
  filterable?: boolean;
  /** Enables click-to-edit on this cell */
  editable?:  boolean;
  /** How to display the value — affects formatting and styling */
  type?:      CellType;
  /**
   * Override rendering entirely.
   * Takes precedence over `type`.
   * e.g., render a colored badge based on row data.
   */
  renderCell?: (value: T[keyof T], row: T, rowIndex: number) => React.ReactNode;
}

// ── Sort state ─────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key:       string | null;
  direction: SortDirection | null;
}

// ── Edit state ─────────────────────────────────────────────────────────────

export interface EditState {
  /** Index in the full (sorted+filtered) dataset — not the visible slice */
  rowIndex: number;
  colKey:   string;
  /** Draft value while editing — committed on blur/Enter, discarded on Escape */
  draft:    string;
}

// ── DataGrid props ─────────────────────────────────────────────────────────

export interface DataGridProps<T extends Record<string, unknown>> {
  data:          T[];
  columns:       ColumnDef<T>[];
  /** Fixed row height in px (required for virtualization math) */
  rowHeight?:    number;
  /** Visible body height in px — header is outside this */
  gridHeight?:   number;
  /** Extra rows above/below the visible window to reduce blank-flash on fast scroll */
  overscan?:     number;
  /** Called when user commits an inline edit */
  onRowUpdate?:  (updatedRow: T, dataIndex: number) => void;
  /** Optional row-level click handler */
  onRowClick?:   (row: T, dataIndex: number) => void;
  /** Placeholder shown when filtered data is empty */
  emptyMessage?: string;
}
