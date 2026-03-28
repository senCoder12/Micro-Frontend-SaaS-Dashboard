/**
 * dashboardSlice — Core business metrics and activity feed.
 *
 * State model decisions:
 *
 *  ✓ Raw numbers (not formatted strings) — formatting is a display concern,
 *    not a data concern. The `selectFormattedStats` memoized selector handles
 *    formatting at read time so the store stays serializable and testable.
 *
 *  ✓ `status` field follows the RTK convention ('idle' | 'loading' | 'succeeded'
 *    | 'failed'). Step 4 will add createAsyncThunk actions that transition this
 *    field automatically via extraReducers.
 *
 *  ✓ Activity list is capped at MAX_ACTIVITY_ITEMS. Step 7 (WebSocket) will
 *    call addActivity() on every live event — without the cap the list would
 *    grow unboundedly in memory.
 */
import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// ── Types ──────────────────────────────────────────────────────────────────

export type LoadingStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
export type ActivityType = 'signup' | 'payment' | 'alert' | 'info';

export interface DashboardStats {
  revenue: number;       // raw dollars
  users: number;         // count
  sessions: number;      // count
  conversionRate: number; // percentage (e.g. 4.8 means 4.8%)
}

export interface StatChanges {
  revenue: number;        // % vs previous period
  users: number;
  sessions: number;
  conversionRate: number;
}

export interface ActivityItem {
  id: string;
  message: string;
  /** Human-readable relative time ("2m ago") — updated in Step 7 */
  time: string;
  type: ActivityType;
  /** Unix ms — used for sorting and deduplication in WebSocket handler */
  timestamp: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_ACTIVITY_ITEMS = 20;

// ── Initial state ──────────────────────────────────────────────────────────

const now = Date.now();

const initialState = {
  stats: {
    revenue: 48200,
    users: 3842,
    sessions: 12431,
    conversionRate: 4.8,
  } satisfies DashboardStats,

  statChanges: {
    revenue: 12.5,
    users: 8.3,
    sessions: -2.1,
    conversionRate: 0.4,
  } satisfies StatChanges,

  recentActivity: [
    { id: '1', message: 'New user signup — john@acme.com',     time: '2m ago',  type: 'signup'  as ActivityType, timestamp: now - 120_000 },
    { id: '2', message: 'Payment received — $299 / Pro plan',  time: '5m ago',  type: 'payment' as ActivityType, timestamp: now - 300_000 },
    { id: '3', message: 'API rate limit warning — /v1/export', time: '12m ago', type: 'alert'   as ActivityType, timestamp: now - 720_000 },
    { id: '4', message: 'New user signup — sara@beta.io',      time: '18m ago', type: 'signup'  as ActivityType, timestamp: now - 1_080_000 },
    { id: '5', message: 'Payment received — $49 / Starter',    time: '34m ago', type: 'payment' as ActivityType, timestamp: now - 2_040_000 },
    { id: '6', message: 'Deployment completed — v2.4.1',       time: '1h ago',  type: 'info'    as ActivityType, timestamp: now - 3_600_000 },
  ] satisfies ActivityItem[],

  status: 'idle' as LoadingStatus,
  error: null as string | null,
  lastUpdated: new Date().toISOString(),
};

export type DashboardState = typeof initialState;

// ── Slice ──────────────────────────────────────────────────────────────────

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    /**
     * Merge a partial stats update into the current stats.
     * Step 7: WebSocket handler dispatches this on every live tick.
     * e.g., dispatch(updateStats({ revenue: 48350 }))
     */
    updateStats(state, action: PayloadAction<Partial<DashboardStats>>) {
      Object.assign(state.stats, action.payload);
      state.lastUpdated = new Date().toISOString();
    },

    /**
     * Update percentage-change figures independently from raw stats.
     * (They arrive on a different API cadence in a real system.)
     */
    updateStatChanges(state, action: PayloadAction<Partial<StatChanges>>) {
      Object.assign(state.statChanges, action.payload);
    },

    /**
     * Prepend a new activity item and cap the list.
     * Immer lets us mutate directly — no spread needed.
     * Step 7: Called by WebSocket message handler.
     */
    addActivity(state, action: PayloadAction<ActivityItem>) {
      state.recentActivity.unshift(action.payload);
      if (state.recentActivity.length > MAX_ACTIVITY_ITEMS) {
        state.recentActivity.pop();
      }
    },

    /**
     * Drive the loading skeleton UI.
     * Step 4: createAsyncThunk's pending/fulfilled/rejected will
     * replace these manual dispatches with extraReducers.
     */
    setStatus(state, action: PayloadAction<LoadingStatus>) {
      state.status = action.payload;
      if (action.payload !== 'failed') {
        state.error = null;
      }
    },

    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.status = 'failed';
    },
  },
});

// ── Actions ────────────────────────────────────────────────────────────────

export const {
  updateStats,
  updateStatChanges,
  addActivity,
  setStatus,
  setError,
} = dashboardSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────

/** Primitive selectors — cheap, always fresh */
export const selectStats = (state: RootState) => state.dashboard.stats;
export const selectStatChanges = (state: RootState) => state.dashboard.statChanges;
export const selectRecentActivity = (state: RootState) => state.dashboard.recentActivity;
export const selectDashboardStatus = (state: RootState) => state.dashboard.status;
export const selectDashboardError = (state: RootState) => state.dashboard.error;
export const selectLastUpdated = (state: RootState) => state.dashboard.lastUpdated;

/**
 * Memoized selector — only recomputes when `stats` or `statChanges` change.
 *
 * WHY createSelector here:
 *   This selector transforms raw numbers into display-ready objects.
 *   Without memoization, this object is re-created on every render of
 *   every component that calls useAppSelector — even renders triggered
 *   by unrelated state changes. createSelector caches the last result
 *   and returns it unchanged when inputs haven't changed, preventing
 *   unnecessary child re-renders.
 *
 *   Step 6 (Performance) will cover this pattern in depth.
 */
export const selectFormattedStats = createSelector(
  [selectStats, selectStatChanges],
  (stats, changes) => [
    {
      key: 'revenue',
      label: 'Monthly Revenue',
      value: `$${(stats.revenue / 1000).toFixed(1)}K`,
      change: changes.revenue,
    },
    {
      key: 'users',
      label: 'Active Users',
      value: stats.users.toLocaleString('en-US'),
      change: changes.users,
    },
    {
      key: 'sessions',
      label: 'Sessions',
      value: stats.sessions.toLocaleString('en-US'),
      change: changes.sessions,
    },
    {
      key: 'conversion',
      label: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      change: changes.conversionRate,
    },
  ]
);

// ── Reducer ────────────────────────────────────────────────────────────────

export default dashboardSlice.reducer;
