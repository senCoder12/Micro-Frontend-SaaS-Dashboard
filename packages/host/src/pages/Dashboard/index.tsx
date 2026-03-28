/**
 * Dashboard Page — connected to Redux store.
 *
 * Data flow:
 *   store.dashboard.stats → selectFormattedStats → StatCard[]
 *   store.dashboard.recentActivity → ActivityItem[]
 *
 * Step 4: API thunk will populate the store on mount (replacing initial state).
 * Step 7: WebSocket handler will call addActivity() + updateStats() live.
 */
import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectFormattedStats,
  selectRecentActivity,
  selectDashboardStatus,
  updateStats,
  addActivity,
} from '@/store/slices';
import type { ActivityItem } from '@/store/slices';

// ── Sub-components ─────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  change: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, change }) => {
  const isPositive = change >= 0;
  return (
    <div className="stat-card">
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
      <span className={`stat-card__change stat-card__change--${isPositive ? 'up' : 'down'}`}>
        {isPositive ? '↑' : '↓'} {Math.abs(change)}%
        <span className="stat-card__change-label"> vs last month</span>
      </span>
    </div>
  );
};

const ACTIVITY_DOT_CLASS: Record<ActivityItem['type'], string> = {
  signup:  'activity-dot--green',
  payment: 'activity-dot--blue',
  alert:   'activity-dot--orange',
  info:    'activity-dot--purple',
};

// ── Page ───────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();

  /**
   * selectFormattedStats is memoized via createSelector.
   * This component only re-renders when stats or statChanges change —
   * not on every store update (e.g., a new activity item won't trigger
   * a StatCard re-render because they read from different parts of state).
   */
  const formattedStats = useAppSelector(selectFormattedStats);
  const recentActivity = useAppSelector(selectRecentActivity);
  const status = useAppSelector(selectDashboardStatus);

  /**
   * Demo: simulate a live stat update dispatched from the UI.
   * Step 7 will replace this button with a WebSocket that fires automatically.
   */
  const handleSimulateUpdate = () => {
    dispatch(updateStats({ revenue: Math.floor(48000 + Math.random() * 5000) }));
    dispatch(addActivity({
      id: `evt_${Date.now()}`,
      message: `Payment received — $${Math.floor(49 + Math.random() * 499)} / Pro plan`,
      time: 'just now',
      type: 'payment',
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
            Welcome back. Here's what's happening.
            {status === 'loading' && (
              <span className="loading-indicator" aria-live="polite"> Refreshing…</span>
            )}
          </p>
        </div>
        <div className="page-header__actions">
          {/* Temporary demo button — replaced by WebSocket in Step 7 */}
          <button
            className="btn btn--ghost"
            type="button"
            onClick={handleSimulateUpdate}
            title="Simulate a live update (WebSocket arrives in Step 7)"
          >
            Simulate Live Update
          </button>
          <button className="btn btn--primary" type="button">
            Export Report
          </button>
        </div>
      </div>

      {/* Stat cards — driven by memoized Redux selector */}
      <div className="stat-grid">
        {formattedStats.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            change={stat.change}
          />
        ))}
      </div>

      {/* Lower section: activity + chart */}
      <div className="dashboard-body">
        {/* Activity feed — driven by Redux slice */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Recent Activity</h2>
            <button className="btn-link" type="button">View all</button>
          </div>
          <ul className="activity-list" aria-label="Recent activity">
            {recentActivity.map((item) => (
              <li key={item.id} className="activity-item">
                <span
                  className={`activity-dot ${ACTIVITY_DOT_CLASS[item.type]}`}
                  aria-hidden="true"
                />
                <span className="activity-item__message">{item.message}</span>
                <time className="activity-item__time" dateTime={new Date(item.timestamp).toISOString()}>
                  {item.time}
                </time>
              </li>
            ))}
          </ul>
        </div>

        {/* Bar chart placeholder — replaced in Step 5 */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Revenue Over Time</h2>
            <span className="badge badge--purple">Step 5</span>
          </div>
          <div className="chart-placeholder">
            <div className="chart-placeholder__bars" aria-hidden="true">
              {[40, 65, 50, 80, 60, 90, 75, 85, 70, 95, 80, 100].map((h, i) => (
                <div
                  key={i}
                  className="chart-placeholder__bar"
                  style={{ height: `${h}%` }}
                />
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
