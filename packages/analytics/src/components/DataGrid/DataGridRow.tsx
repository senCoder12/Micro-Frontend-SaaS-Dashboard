/**
 * DataGridRow — A single data row.
 *
 * WHY React.memo here (the most important optimization in the grid):
 *
 *   Without memo: filtering 1,000 rows triggers re-render of ALL visible rows
 *   even though their data hasn't changed. The filter state lives in the parent,
 *   so parent re-renders cascade down.
 *
 *   With memo + stable handler refs (useCallback in parent):
 *     - Row only re-renders if `row` data changes OR `editState` for this row changes
 *     - Scrolling, filter text changes, and sort state don't re-render visible rows
 *       unless they bring different data into the visible window
 *
 * The gridColumns CSS variable is passed as a style prop so every row uses
 * the same column widths as the header — no table layout algorithm needed.
 */
import React from 'react';
import DataGridCell from './DataGridCell';
import type { ColumnDef, EditState } from './types';

interface DataGridRowProps<T extends Record<string, unknown>> {
  row:          T;
  columns:      ColumnDef<T>[];
  rowIndex:     number;
  rowHeight:    number;
  gridColumns:  string;
  isEven:       boolean;
  editState:    EditState | null;
  onRowClick?:  ((row: T, rowIndex: number) => void) | undefined;
  onEditStart:  (rowIndex: number, colKey: string, value: string) => void;
  onEditChange: (draft: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
}

function DataGridRowInner<T extends Record<string, unknown>>({
  row,
  columns,
  rowIndex,
  rowHeight,
  gridColumns,
  isEven,
  editState,
  onRowClick,
  onEditStart,
  onEditChange,
  onEditCommit,
  onEditCancel,
}: DataGridRowProps<T>) {
  const isEditingThisRow = editState?.rowIndex === rowIndex;

  return (
    <div
      className={[
        'grid-row',
        isEven            ? 'grid-row--even'    : '',
        isEditingThisRow  ? 'grid-row--editing' : '',
      ].filter(Boolean).join(' ')}
      style={{
        height:              rowHeight,
        gridTemplateColumns: gridColumns,
      }}
      role="row"
      onClick={() => onRowClick?.(row, rowIndex)}
      aria-rowindex={rowIndex + 1}
    >
      {columns.map((col) => (
        <DataGridCell
          key={col.key}
          col={col}
          row={row}
          rowIndex={rowIndex}
          editState={editState}
          onEditStart={onEditStart}
          onEditChange={onEditChange}
          onEditCommit={onEditCommit}
          onEditCancel={onEditCancel}
        />
      ))}
    </div>
  );
}

/**
 * Custom comparison function:
 * Only re-render if the row's data reference changes OR
 * if the edit state targets this specific row.
 */
const DataGridRow = React.memo(
  DataGridRowInner,
  (prev, next) => {
    if (prev.row !== next.row) return false;            // data changed
    if (prev.rowIndex !== next.rowIndex) return false;  // row shifted (sort/filter)
    if (prev.isEven !== next.isEven) return false;

    // editState: only care if it targets THIS row
    const prevEditing = prev.editState?.rowIndex === prev.rowIndex;
    const nextEditing = next.editState?.rowIndex === next.rowIndex;
    if (prevEditing !== nextEditing) return false;

    // If this row IS being edited, re-render on draft changes
    if (nextEditing && prev.editState?.draft !== next.editState?.draft) return false;

    return true; // nothing relevant changed → skip re-render
  }
) as typeof DataGridRowInner;

export default DataGridRow;
