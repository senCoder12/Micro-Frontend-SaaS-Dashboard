/**
 * useVirtualScroll — The engine behind the data grid.
 *
 * MENTAL MODEL:
 *
 *   ┌─────────────────────────────────────┐  ← containerRef (overflow: scroll)
 *   │                                     │
 *   │  ▓▓▓▓ top spacer (offsetY px) ▓▓▓▓  │
 *   │  ─────────────────────────────────  │
 *   │  Row 12  ← overscan (above viewport)│
 *   │  ─────────────────────────────────  │
 *   │  Row 13  ┐                          │
 *   │  Row 14  │ visible rows             │  ← 520px containerHeight
 *   │  Row 15  │                          │
 *   │  Row 16  ┘                          │
 *   │  ─────────────────────────────────  │
 *   │  Row 17  ← overscan (below viewport)│
 *   │  ▓▓▓▓ bottom spacer ▓▓▓▓           │
 *   └─────────────────────────────────────┘
 *
 *   totalHeight = totalRows × rowHeight  ← the div inside container has this height
 *                                          so the scrollbar knows the full range
 *
 *   startIndex  = floor(scrollTop / rowHeight) - overscan
 *   endIndex    = startIndex + visibleCount + 2*overscan
 *   offsetY     = startIndex × rowHeight        ← top spacer height
 *   bottomSpace = totalHeight - offsetY - renderedRows × rowHeight
 *
 * WHY overscan:
 *   Without it, rows are created/destroyed exactly at the viewport edge.
 *   If the user scrolls fast, they see a white flash before React commits
 *   the new rows. Overscan pre-renders a few rows in each direction as a buffer.
 *
 * WHY fixed rowHeight (not measured):
 *   Variable heights require two-pass rendering (measure then position).
 *   For enterprise grids, fixed height is standard — it makes scroll math exact
 *   and eliminates layout recalculation on every scroll event.
 */
import { useState, useCallback, useRef } from 'react';

export interface VirtualScrollResult {
  startIndex:    number;
  endIndex:      number;
  /** Height of the spacer div above the rendered rows (px) */
  offsetY:       number;
  /** Height of the spacer div below the rendered rows (px) */
  bottomSpace:   number;
  /** Full inner height (maintains scroll range) */
  totalHeight:   number;
  /** Attach to the scrollable container's onScroll */
  onScroll:      (e: React.UIEvent<HTMLDivElement>) => void;
  /** Ref to the scrollable container — for programmatic scroll (e.g., jump to row) */
  containerRef:  React.RefObject<HTMLDivElement>;
  /** Imperatively scroll to a specific row index */
  scrollToRow:   (index: number) => void;
}

interface Options {
  totalRows:       number;
  rowHeight:       number;
  containerHeight: number;
  overscan?:       number;
}

export function useVirtualScroll({
  totalRows,
  rowHeight,
  containerHeight,
  overscan = 3,
}: Options): VirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Derived geometry ─────────────────────────────────────────────────────

  const totalHeight = totalRows * rowHeight;

  /**
   * How many rows fit in the visible area.
   * +1 ensures we never have a gap at the bottom of the container.
   */
  const visibleCount = Math.ceil(containerHeight / rowHeight) + 1;

  /** First row index to render (clamped to 0) */
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);

  /**
   * Last row index to render (clamped to totalRows - 1).
   * visibleCount + 2*overscan = total rendered row count.
   */
  const endIndex = Math.min(
    totalRows - 1,
    startIndex + visibleCount + overscan * 2
  );

  /** Top spacer height — pushes rendered rows to their correct scroll position */
  const offsetY = startIndex * rowHeight;

  /** Bottom spacer height — fills the remaining scroll range */
  const renderedRowCount = endIndex - startIndex + 1;
  const bottomSpace = Math.max(
    0,
    totalHeight - offsetY - renderedRowCount * rowHeight
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // requestAnimationFrame batches DOM reads and prevents scroll jank
    const top = e.currentTarget.scrollTop;
    requestAnimationFrame(() => setScrollTop(top));
  }, []);

  const scrollToRow = useCallback((index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * rowHeight;
    }
  }, [rowHeight]);

  return {
    startIndex,
    endIndex,
    offsetY,
    bottomSpace,
    totalHeight,
    onScroll,
    containerRef,
    scrollToRow,
  };
}
