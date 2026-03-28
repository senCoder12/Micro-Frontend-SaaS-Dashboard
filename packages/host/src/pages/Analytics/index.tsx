/**
 * Analytics Page — powered by the virtual DataGrid.
 *
 * Demonstrates:
 *   - 1,000 row dataset rendered with ~15 DOM nodes via virtual scroll
 *   - Multi-column sort (click header)
 *   - Global search + per-column filter (Country, Browser)
 *   - Inline editing (User name column)
 *   - Column types: text, badge, currency, duration, date
 */
import React, { useState, useCallback } from 'react';
import { DataGrid } from '@/components/DataGrid';
import type { ColumnDef } from '@/components/DataGrid';
import { SESSION_DATA } from '@/services/mock/data/sessions.mock';
import type { SessionRecord } from '@/services/mock/data/sessions.mock';

// ── Column definitions ─────────────────────────────────────────────────────

const COLUMNS: ColumnDef<SessionRecord>[] = [
  {
    key:      'id',
    header:   'Session ID',
    width:    110,
    sortable: true,
    type:     'text',
  },
  {
    key:        'user',
    header:     'User',
    minWidth:   140,
    sortable:   true,
    filterable: true,
    editable:   true,   // ← click to edit
    type:       'text',
  },
  {
    key:        'country',
    header:     'Country',
    width:      160,
    sortable:   true,
    filterable: true,
    type:       'badge',
  },
  {
    key:      'browser',
    header:   'Browser',
    width:    110,
    sortable: true,
    filterable: true,
    type:     'badge',
  },
  {
    key:      'page',
    header:   'Landing Page',
    width:    150,
    sortable: true,
    type:     'text',
    renderCell: (value) => (
      <code style={{
        fontFamily: 'var(--font-mono)',
        fontSize:   'var(--text-xs)',
        color:      'var(--color-primary)',
      }}>
        {String(value)}
      </code>
    ),
  },
  {
    key:      'duration',
    header:   'Duration',
    width:    100,
    sortable: true,
    type:     'duration',
  },
  {
    key:      'revenue',
    header:   'Revenue',
    width:    100,
    sortable: true,
    type:     'currency',
    renderCell: (value) => {
      const amount = Number(value);
      if (amount === 0) return <span style={{ color: 'var(--color-text-faint)' }}>—</span>;
      return (
        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount)}
        </span>
      );
    },
  },
  {
    key:      'date',
    header:   'Date',
    width:    120,
    sortable: true,
    type:     'date',
  },
];

// ── Page ───────────────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '90d' | '1y';

const Analytics: React.FC = () => {
  const [activeRange, setActiveRange] = useState<DateRange>('30d');
  const ranges: DateRange[] = ['7d', '30d', '90d', '1y'];

  /**
   * Inline edit handler.
   * In a real app this would dispatch to Redux + call an API.
   * Here we just log to show the callback works.
   */
  const handleRowUpdate = useCallback((updatedRow: SessionRecord, index: number) => {
    console.info('[Analytics] Row updated at index', index, updatedRow);
    // Step 4: dispatch(updateSession(updatedRow))
  }, []);

  return (
    <div className="page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">
            {SESSION_DATA.length.toLocaleString()} user sessions — scroll, sort, filter, and edit.
          </p>
        </div>
        <div className="btn-group" role="group" aria-label="Date range">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              className={`btn-group__btn${activeRange === r ? ' btn-group__btn--active' : ''}`}
              onClick={() => setActiveRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary charts (kept from Step 2, will be upgraded in later steps) */}
      <div className="analytics-charts">
        <div className="card card--chart">
          <div className="card__header">
            <h2 className="card__title">Page Views</h2>
            <span className="stat-inline">
              <strong>124,832</strong>
              <span className="stat-inline__change stat-inline__change--up">↑ 9.2%</span>
            </span>
          </div>
          <div className="chart-placeholder chart-placeholder--line">
            <svg viewBox="0 0 400 120" className="line-chart-svg" aria-hidden="true">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--color-primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points="0,100 40,80 80,90 120,50 160,60 200,30 240,45 280,20 320,35 360,10 400,25"
                fill="none" stroke="var(--color-primary)" strokeWidth="2" />
              <polyline points="0,100 40,80 80,90 120,50 160,60 200,30 240,45 280,20 320,35 360,10 400,25 400,120 0,120"
                fill="url(#areaGrad)" stroke="none" />
            </svg>
          </div>
        </div>

        <div className="card card--chart">
          <div className="card__header">
            <h2 className="card__title">Revenue Breakdown</h2>
            <span className="stat-inline">
              <strong>$38,920</strong>
              <span className="stat-inline__change stat-inline__change--up">↑ 5.7%</span>
            </span>
          </div>
          <div className="chart-placeholder chart-placeholder--line">
            <svg viewBox="0 0 400 120" className="line-chart-svg" aria-hidden="true">
              <defs>
                <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--color-success)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points="0,90 40,85 80,70 120,75 160,55 200,60 240,40 280,50 320,30 360,35 400,20"
                fill="none" stroke="var(--color-success)" strokeWidth="2" />
              <polyline points="0,90 40,85 80,70 120,75 160,55 200,60 240,40 280,50 320,30 360,35 400,20 400,120 0,120"
                fill="url(#areaGrad2)" stroke="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Data Grid ─────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card__header" style={{ padding: 'var(--space-5) var(--space-6)' }}>
          <h2 className="card__title">User Sessions</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className="badge badge--blue">Virtual Scroll</span>
            <span className="badge badge--green">Sortable</span>
            <span className="badge badge--purple">Editable</span>
            <span className="text-muted text-sm">Last {activeRange}</span>
          </div>
        </div>

        <DataGrid<SessionRecord>
          data={SESSION_DATA}
          columns={COLUMNS}
          rowHeight={44}
          gridHeight={528}
          overscan={4}
          onRowUpdate={handleRowUpdate}
          emptyMessage="No sessions match your search. Try clearing the filters."
        />
      </div>
    </div>
  );
};

export default Analytics;
