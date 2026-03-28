/**
 * dashboardSlice — Core business metrics and activity feed.
 *
 * Step 4 additions:
 *   - `fetchDashboardData` async thunk (createAsyncThunk)
 *   - `extraReducers` that transition status automatically:
 *       pending    → status: 'loading'
 *       fulfilled  → status: 'succeeded', store populated
 *       rejected   → status: 'failed',   error captured
 *
 * WHY extraReducers (not manual setStatus dispatches):
 *   Before Step 4, the Dashboard page dispatched setStatus('loading') before
 *   fetching and setStatus('succeeded') after. That's fragile — if the fetch
 *   throws, the developer must remember to dispatch setStatus('failed') in
 *   the catch block. extraReducers does this automatically, every time,
 *   with no chance of forgetting.
 */
import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardPayload } from '@/services/dashboard.service';
import { ApiError } from '@/services/api/client';

// ── Types ──────────────────────────────────────────────────────────────────

export type LoadingStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
export type ActivityType = 'signup' | 'payment' | 'alert' | 'info';

export interface DashboardStats {
  revenue:        number;
  users:          number;
  sessions:       number;
  conversionRate: number;
}

export interface StatChanges {
  revenue:        number;
  users:          number;
  sessions:       number;
  conversionRate: number;
}

export interface ActivityItem {
  id:        string;
  message:   string;
  time:      string;
  type:      ActivityType;
  timestamp: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_ACTIVITY_ITEMS = 20;

// ── Initial state ──────────────────────────────────────────────────────────

const now = Date.now();

const initialState = {
  stats: {
    revenue:        48_200,
    users:          3_842,
    sessions:       12_431,
    conversionRate: 4.8,
  } satisfies DashboardStats,

  statChanges: {
    revenue:        12.5,
    users:           8.3,
    sessions:       -2.1,
    conversionRate:  0.4,
  } satisfies StatChanges,

  recentActivity: [
    { id: '1', message: 'New user signup — john@acme.com',     time: '2m ago',  type: 'signup'  as ActivityType, timestamp: now - 120_000   },
    { id: '2', message: 'Payment received — $299 / Pro plan',  time: '5m ago',  type: 'payment' as ActivityType, timestamp: now - 300_000   },
    { id: '3', message: 'API rate limit warning — /v1/export', time: '12m ago', type: 'alert'   as ActivityType, timestamp: now - 720_000   },
    { id: '4', message: 'New user signup — sara@beta.io',      time: '18m ago', type: 'signup'  as ActivityType, timestamp: now - 1_080_000 },
    { id: '5', message: 'Payment received — $49 / Starter',    time: '34m ago', type: 'payment' as ActivityType, timestamp: now - 2_040_000 },
    { id: '6', message: 'Deployment completed — v2.4.1',       time: '1h ago',  type: 'info'    as ActivityType, timestamp: now - 3_600_000 },
  ] satisfies ActivityItem[],

  status:      'idle' as LoadingStatus,
  error:       null as string | null,
  lastUpdated: new Date().toISOString(),
};

export type DashboardState = typeof initialState;

// ── Async thunk ────────────────────────────────────────────────────────────

/**
 * Fetches stats, stat-changes, and activity in parallel via the service layer.
 *
 * `createAsyncThunk` generates three action types automatically:
 *   dashboard/fetchData/pending
 *   dashboard/fetchData/fulfilled   ← payload = DashboardPayload
 *   dashboard/fetchData/rejected    ← payload = error message string
 *
 * The second generic argument is the return type of the thunk callback.
 * The third is the ThunkAPI config — we type rejectValue as string so
 * extraReducers receives action.payload as string in the rejected case.
 */
export const fetchDashboardData = createAsyncThunk<
  DashboardPayload,       // fulfilled payload type
  void,                   // argument type (none)
  { rejectValue: string } // rejected payload type
>(
  'dashboard/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      return await dashboardService.fetchAll();
    } catch (err) {
      /**
       * rejectWithValue() passes a serializable error to the rejected action.
       * Without it, RTK would serialize the Error object which loses the message.
       *
       * Using ApiError instanceof check lets us extract the HTTP status code
       * for specific error handling (e.g. show "Session expired" on 401).
       */
      const message = err instanceof ApiError
        ? err.message
        : 'Failed to load dashboard data';
      return rejectWithValue(message);
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    /** Merge a partial stats update — dispatched by WebSocket handler in Step 7 */
    updateStats(state, action: PayloadAction<Partial<DashboardStats>>) {
      Object.assign(state.stats, action.payload);
      state.lastUpdated = new Date().toISOString();
    },

    updateStatChanges(state, action: PayloadAction<Partial<StatChanges>>) {
      Object.assign(state.statChanges, action.payload);
    },

    /** Prepend a new activity item, cap at MAX_ACTIVITY_ITEMS */
    addActivity(state, action: PayloadAction<ActivityItem>) {
      state.recentActivity.unshift(action.payload);
      if (state.recentActivity.length > MAX_ACTIVITY_ITEMS) {
        state.recentActivity.pop();
      }
    },

    setStatus(state, action: PayloadAction<LoadingStatus>) {
      state.status = action.payload;
      if (action.payload !== 'failed') state.error = null;
    },

    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.status = 'failed';
    },
  },

  /**
   * extraReducers handles actions from OUTSIDE this slice.
   * The builder pattern gives full TypeScript inference on action.payload.
   */
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.status = 'loading';
        state.error  = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.stats          = action.payload.stats;
        state.statChanges    = action.payload.statChanges;
        state.recentActivity = action.payload.activity;
        state.status         = 'succeeded';
        state.lastUpdated    = new Date().toISOString();
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.status = 'failed';
        state.error  = action.payload ?? 'Unknown error';
      });
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

export const selectStats            = (state: RootState) => state.dashboard.stats;
export const selectStatChanges      = (state: RootState) => state.dashboard.statChanges;
export const selectRecentActivity   = (state: RootState) => state.dashboard.recentActivity;
export const selectDashboardStatus  = (state: RootState) => state.dashboard.status;
export const selectDashboardError   = (state: RootState) => state.dashboard.error;
export const selectLastUpdated      = (state: RootState) => state.dashboard.lastUpdated;

export const selectFormattedStats = createSelector(
  [selectStats, selectStatChanges],
  (stats, changes) => [
    { key: 'revenue',    label: 'Monthly Revenue',  value: `$${(stats.revenue / 1000).toFixed(1)}K`,      change: changes.revenue        },
    { key: 'users',      label: 'Active Users',      value: stats.users.toLocaleString('en-US'),           change: changes.users          },
    { key: 'sessions',   label: 'Sessions',           value: stats.sessions.toLocaleString('en-US'),        change: changes.sessions       },
    { key: 'conversion', label: 'Conversion Rate',   value: `${stats.conversionRate.toFixed(1)}%`,         change: changes.conversionRate },
  ]
);

// ── Reducer ────────────────────────────────────────────────────────────────

export default dashboardSlice.reducer;
