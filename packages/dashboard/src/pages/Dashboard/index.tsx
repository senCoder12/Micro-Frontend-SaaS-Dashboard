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
 *
 * ── Step 6: useMemo + useCallback + React.memo ────────────────────────────
 *
 * THREE QUESTIONS to ask before memoizing:
 *
 *   1. Is the computation actually expensive?
 *      Rule of thumb: if it loops over data or calls sort/filter/map on
 *      an array > 100 items, memoize it.  A .toFixed() call? Don't bother.
 *
 *   2. Does the parent re-render more than the data changes?
 *      If the parent re-renders every 100ms (e.g. from a scroll event)
 *      but the data changes every 10s, memoization saves ~99% of work.
 *
 *   3. Do you pass callbacks to memoized children?
 *      React.memo is useless if you pass a new function reference every
 *      render. useCallback stabilizes the ref so the child's memo check
 *      actually passes.
 *
 * COMMON MISTAKES:
 *
 *   ✗ Memoizing everything "just in case"
 *     memo() and useMemo both have a cost: the comparison itself.
 *     For trivial values (string, boolean, a 3-element array of numbers),
 *     the comparison costs MORE than re-computing.
 *
 *   ✗ Missing dependencies in useMemo/useCallback
 *     Stale closures. The exhaustive-deps ESLint rule catches this —
 *     never disable it.
 *
 *   ✗ Memoizing an object created inside useMemo
 *     useMemo(() => ({ x: a, y: b }), [a, b]) is fine.
 *     useMemo(() => ({ x: a, y: b }), []) is a stale closure bug.
 *
 *   ✗ React.memo without useCallback on handlers
 *     // Parent:
 *     const handler = () => doSomething();   // new ref every render
 *     <MemoizedChild onClick={handler} />    // memo is bypassed every render
 *
 * HOW TO MEASURE:
 *   React DevTools Profiler → record → interact → flame chart.
 *   Gray bars = skipped renders. Colored bars = actual renders.
 *   Before: all stat cards re-render on every dispatch.
 *   After:  only the changed card re-renders.
 */
import React, { useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectFormattedStats,
  selectRecentActivity,
  selectDashboardStatus,
  selectDashboardError,
  fetchDashboardData,
  selectWsIsLive,
  selectWsStatus,
} from '@/store/slices';
import type { ActivityItem } from '@/store/slices';

// ── Sub-components ─────────────────────────────────────────────────────────

interface StatCardProps {
  label:  string;
  value:  string;
  change: number;
}

/**
 * StatCard wrapped with React.memo.
 *
 * BEFORE (plain function component):
 *   const StatCard: React.FC<StatCardProps> = ({ label, value, change }) => ...
 *
 *   Problem: every time the Dashboard re-renders (e.g. from "Simulate Live
 *   Update" dispatching to Redux), ALL four stat cards re-render even if
 *   three of them received identical props.
 *
 * AFTER (React.memo with default shallow comparison):
 *   Memo does a shallow === comparison on each prop.
 *   - label: string  → === check
 *   - value: string  → === check
 *   - change: number → === check
 *   All primitives → default memo is perfect here. No custom comparator needed.
 *
 * Result: when updateStats({ revenue }) fires, only the Revenue card
 * re-renders. The other three (Users, Sessions, Bounce Rate) are skipped.
 */
const StatCard = React.memo<StatCardProps>(function StatCard({ label, value, change }) {
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
});

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

  const isLive    = useAppSelector(selectWsIsLive);
  const wsStatus  = useAppSelector(selectWsStatus);

  const isLoading = status === 'loading';
  const isFailed  = status === 'failed';

  /**
   * useCallback for retry.
   * Stable reference ensures ErrorBanner's onClick prop doesn't change on
   * every Dashboard render (relevant when ErrorBanner is React.memo'd).
   */
  const handleRetry = useCallback(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  /**
   * useMemo — derive the chart bar heights from live stat data.
   *
   * BEFORE:
   *   Hardcoded: [40, 65, 50, 80, 60, 90, 75, 85, 70, 95, 80, 100]
   *   Static array literal — re-created on every render as a new reference,
   *   even though the values never change.
   *
   * AFTER:
   *   useMemo derives bar heights from the revenue change value.
   *   The array reference is stable between renders unless formattedStats
   *   changes. If this array were passed to a charting component wrapped
   *   with React.memo, the memo check would correctly skip re-renders.
   *
   * WHY this specific computation is a good useMemo candidate:
   *   - It reads from formattedStats (derived from Redux state)
   *   - It produces an array (new reference on every call without memo)
   *   - The result feeds a visual element that doesn't need to recompute
   *     just because, say, recentActivity changed
   */
  const chartBarHeights = useMemo(() => {
    if (formattedStats.length === 0) {
      return [40, 65, 50, 80, 60, 90, 75, 85, 70, 95, 80, 100];
    }
    // Use the revenue stat's change percentage to shift the sparkline baseline
    const revenueStat = formattedStats.find(s => s.key === 'revenue');
    const bias        = revenueStat ? Math.min(30, Math.max(-30, revenueStat.change)) : 0;
    const base        = 50 + bias;
    return Array.from({ length: 12 }, (_, i) =>
      Math.round(Math.min(100, Math.max(15, base + Math.sin(i * 0.7) * 28 + i * 2)))
    );
  }, [formattedStats]);

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
          {/* Real-time connection badge — driven by WebSocket state */}
          {isLive ? (
            <span className="live-badge" aria-label="Receiving live updates">
              <span className="live-badge__pulse" aria-hidden="true" />
              LIVE
            </span>
          ) : (
            <span className="live-badge live-badge--offline" aria-label={`Connection: ${wsStatus}`}>
              {wsStatus === 'connecting' ? 'Connecting…' : 'Offline'}
            </span>
          )}
          <button className="btn btn--primary" type="button" disabled={isLoading}>
            Export Report
          </button>
        </div>
      </div>

      {/* Error state */}
      {isFailed && error !== null && (
        <ErrorBanner
          message={error}
          onRetry={handleRetry}
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

        {/* Revenue sparkline — bar heights derived from live stat data via useMemo */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Revenue Over Time</h2>
            <span className="badge badge--purple">Live Sparkline</span>
          </div>
          <div className="chart-placeholder">
            <div className="chart-placeholder__bars" aria-hidden="true">
              {chartBarHeights.map((h, i) => (
                <div key={i} className="chart-placeholder__bar" style={{ height: `${h}%` }} />
              ))}
            </div>
            <p className="chart-placeholder__label">
              Bar heights reflect live revenue data — try "Simulate Live Update"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
