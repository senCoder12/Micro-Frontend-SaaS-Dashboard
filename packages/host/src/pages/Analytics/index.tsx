/**
 * Analytics Page
 *
 * Currently: structured placeholder with date range controls and metric cards.
 * Step 5 → real data grid with sorting/filtering.
 * Step 7 → live metric updates via WebSocket.
 */
import React, { useState } from 'react';

type DateRange = '7d' | '30d' | '90d' | '1y';

interface MetricRow {
  page: string;
  views: string;
  uniqueVisitors: string;
  bounceRate: string;
  avgTime: string;
}

const METRICS: MetricRow[] = [
  { page: '/dashboard',  views: '24,521', uniqueVisitors: '18,320', bounceRate: '22%', avgTime: '4m 12s' },
  { page: '/analytics',  views: '12,804', uniqueVisitors: '9,441',  bounceRate: '31%', avgTime: '3m 05s' },
  { page: '/workflow',   views: '8,932',  uniqueVisitors: '6,122',  bounceRate: '18%', avgTime: '6m 48s' },
  { page: '/settings',   views: '4,201',  uniqueVisitors: '3,880',  bounceRate: '45%', avgTime: '1m 22s' },
  { page: '/onboarding', views: '2,930',  uniqueVisitors: '2,930',  bounceRate: '9%',  avgTime: '8m 14s' },
];

const Analytics: React.FC = () => {
  const [activeRange, setActiveRange] = useState<DateRange>('30d');
  const ranges: DateRange[] = ['7d', '30d', '90d', '1y'];

  return (
    <div className="page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Understand how users interact with your product.</p>
        </div>

        {/* Date range selector */}
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

      {/* Chart placeholders */}
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
              <polyline
                points="0,100 40,80 80,90 120,50 160,60 200,30 240,45 280,20 320,35 360,10 400,25"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
              />
              <polyline
                points="0,100 40,80 80,90 120,50 160,60 200,30 240,45 280,20 320,35 360,10 400,25 400,120 0,120"
                fill="url(#areaGrad)"
                stroke="none"
              />
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="card card--chart">
          <div className="card__header">
            <h2 className="card__title">Unique Visitors</h2>
            <span className="stat-inline">
              <strong>38,201</strong>
              <span className="stat-inline__change stat-inline__change--up">↑ 5.7%</span>
            </span>
          </div>
          <div className="chart-placeholder chart-placeholder--line">
            <svg viewBox="0 0 400 120" className="line-chart-svg" aria-hidden="true">
              <polyline
                points="0,90 40,85 80,70 120,75 160,55 200,60 240,40 280,50 320,30 360,35 400,20"
                fill="none"
                stroke="var(--color-success)"
                strokeWidth="2"
              />
              <polyline
                points="0,90 40,85 80,70 120,75 160,55 200,60 240,40 280,50 320,30 360,35 400,20 400,120 0,120"
                fill="url(#areaGrad2)"
                stroke="none"
              />
              <defs>
                <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-success)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Metrics table */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Top Pages</h2>
          <span className="text-muted text-sm">Last {activeRange}</span>
        </div>
        <div className="table-wrapper">
          <table className="data-table" aria-label="Top pages metrics">
            <thead>
              <tr>
                <th>Page</th>
                <th>Views</th>
                <th>Unique Visitors</th>
                <th>Bounce Rate</th>
                <th>Avg. Time</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map((row) => (
                <tr key={row.page}>
                  <td className="data-table__page-cell">{row.page}</td>
                  <td>{row.views}</td>
                  <td>{row.uniqueVisitors}</td>
                  <td>{row.bounceRate}</td>
                  <td>{row.avgTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
