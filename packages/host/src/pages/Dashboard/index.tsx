/**
 * Dashboard Page — fully connected to Redux + API layer.
 *
 * Data flow (Step 4):
 *   bootstrap.tsx → dispatch(fetchDashboardData())
 *     → dashboardService.fetchAll()        (parallel HTTP calls)
 *     → mock adapter intercepts            (700ms delay)
 *     → extraReducers.fulfilled            (populates store)
 *     → selectFormattedStats/selectRecentActivity (re-derive UI)
 *     → Dashboard re-renders with live data
 *
 * Status transitions: idle → loading → succeeded | failed
 */
import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectFormattedStats,
  selectRecentActivity,
  selectDashboardStatus,
  selectDashboardError,
  updateStats,
  addActivity,
  fetchDashboardData,
} from '@/store/slices';
import type { ActivityItem } from '@/store/slices';

// ── Sub-components ─────────────────────────────────────────────────────────

interface StatCardProps {
  label:  string;
  value:  string;
  change: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, change }) => {
  const isPositive = change >= 0;
  return (
    <div className="stat-card">
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
      <span className={`stat-card__change stat-card__change--${isPositive ? 'up' : 'down'}`}>
        {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        <span className="stat-card__change-label"> vs last month</span>
      </span>
    </div>
  );
};

/** Skeleton card shown while status === 'loading' */
const StatCardSkeleton: React.FC = () => (
  <div className="stat-card stat-card--skeleton" aria-hidden="true">
    <span className="skeleton skeleton--label" />
    <span className="skeleton skeleton--value" />
    <span className="skeleton skeleton--change" />
  </div>
);

const ACTIVITY_DOT_CLASS: Record<ActivityItem['type'], string> = {
  signup:  'activity-dot--green',
  payment: 'activity-dot--blue',
  alert:   'activity-dot--orange',
  info:    'activity-dot--purple',
};

// ── Error banner ───────────────────────────────────────────────────────────

const ErrorBanner: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="error-banner" role="alert">
    <span className="error-banner__icon" aria-hidden="true">⚠</span>
    <span className="error-banner__message">{message}</span>
    <button className="error-banner__retry btn btn--ghost" type="button" onClick={onRetry}>
      Retry
    </button>
  </div>
);

// ── Page ───────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const dispatch       = useAppDispatch();
  const formattedStats = useAppSelector(selectFormattedStats);
  const recentActivity = useAppSelector(selectRecentActivity);
  const status         = useAppSelector(selectDashboardStatus);
  const error          = useAppSelector(selectDashboardError);

  const isLoading = status === 'loading';
  const isFailed  = status === 'failed';

  /** Simulate a live stat update — replaced by WebSocket in Step 7 */
  const handleSimulateUpdate = () => {
    dispatch(updateStats({ revenue: Math.floor(48_000 + Math.random() * 5_000) }));
    dispatch(addActivity({
      id:        `evt_${Date.now()}`,
      message:   `Payment received — $${Math.floor(49 + Math.random() * 499)} / Pro plan`,
      time:      'just now',
      type:      'payment',
      timestamp: Date.now(),
    }));
  };

  return (
    <div className="page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {isLoading
              ? 'Loading metrics…'
              : 'Welcome back. Here\'s what\'s happening.'}
          </p>
        </div>
        <div className="page-header__actions">
          <button
            className="btn btn--ghost"
            type="button"
            onClick={handleSimulateUpdate}
            disabled={isLoading}
            title="Simulate a live update (Step 7 replaces this with WebSocket)"
          >
            Simulate Live Update
          </button>
          <button className="btn btn--primary" type="button" disabled={isLoading}>
            Export Report
          </button>
        </div>
      </div>

      {/* Error state */}
      {isFailed && error !== null && (
        <ErrorBanner
          message={error}
          onRetry={() => dispatch(fetchDashboardData())}
        />
      )}

      {/* Stat cards — skeleton while loading, real data when succeeded */}
      <div className="stat-grid">
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)
          : formattedStats.map((stat) => (
              <StatCard key={stat.key} label={stat.label} value={stat.value} change={stat.change} />
            ))
        }
      </div>

      {/* Activity + chart */}
      <div className="dashboard-body">
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Recent Activity</h2>
            <button className="btn-link" type="button">View all</button>
          </div>

          {isLoading ? (
            <ul className="activity-list" aria-label="Loading activity" aria-busy="true">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="activity-item">
                  <span className="skeleton skeleton--dot" aria-hidden="true" />
                  <span className="skeleton skeleton--activity-text" aria-hidden="true" />
                  <span className="skeleton skeleton--time" aria-hidden="true" />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="activity-list" aria-label="Recent activity">
              {recentActivity.map((item) => (
                <li key={item.id} className="activity-item">
                  <span
                    className={`activity-dot ${ACTIVITY_DOT_CLASS[item.type]}`}
                    aria-hidden="true"
                  />
                  <span className="activity-item__message">{item.message}</span>
                  <time
                    className="activity-item__time"
                    dateTime={new Date(item.timestamp).toISOString()}
                  >
                    {item.time}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chart placeholder — replaced in Step 5 */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Revenue Over Time</h2>
            <span className="badge badge--purple">Step 5</span>
          </div>
          <div className="chart-placeholder">
            <div className="chart-placeholder__bars" aria-hidden="true">
              {[40, 65, 50, 80, 60, 90, 75, 85, 70, 95, 80, 100].map((h, i) => (
                <div key={i} className="chart-placeholder__bar" style={{ height: `${h}%` }} />
              ))}
            </div>
            <p className="chart-placeholder__label">
              Real chart added in Step 5 — Data Grid &amp; Visualization
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
