/**
 * Dashboard Service — all HTTP calls for the dashboard domain.
 *
 * Rules this service follows:
 *   1. Returns typed domain objects — NOT raw Axios responses
 *   2. Throws ApiError on failure — callers never see AxiosError
 *   3. No Redux imports — services are UI-framework-agnostic
 *   4. No side effects — pure request/response, no state mutations
 *
 * These rules make the service trivially testable:
 *   jest.mock('@/services/api/client') → swap httpClient for a stub
 *   Call dashboardService.getStats() → assert return shape
 *   No Redux store, no React, no DOM needed in tests.
 */
import { apiClient } from './api/client';
import { ENDPOINTS } from './api/endpoints';
import type { ApiResponse } from '@/types';
import type {
  DashboardStats,
  StatChanges,
  ActivityItem,
} from '@/store/slices/dashboardSlice';

// ── Response types ─────────────────────────────────────────────────────────

/** Full payload returned by fetchDashboardData (parallel fetch result) */
export interface DashboardPayload {
  stats:       DashboardStats;
  statChanges: StatChanges;
  activity:    ActivityItem[];
}

// ── Service ────────────────────────────────────────────────────────────────

export const dashboardService = {
  /**
   * Fetches stats, stat-changes, and activity in parallel.
   *
   * WHY Promise.all (not sequential awaits):
   *   Three sequential awaits = 3 × 700ms = 2.1s wait.
   *   Promise.all fires all three simultaneously = ~700ms total.
   *   The requests are independent — there is no reason to serialize them.
   */
  async fetchAll(): Promise<DashboardPayload> {
    const [statsRes, changesRes, activityRes] = await Promise.all([
      apiClient.get<ApiResponse<DashboardStats>>(ENDPOINTS.dashboard.stats),
      apiClient.get<ApiResponse<StatChanges>>(ENDPOINTS.dashboard.changes),
      apiClient.get<ApiResponse<ActivityItem[]>>(ENDPOINTS.dashboard.activity),
    ]);

    return {
      stats:       statsRes.data.data,
      statChanges: changesRes.data.data,
      activity:    activityRes.data.data,
    };
  },

  /** Refresh only the numeric metrics (used by WebSocket handler in Step 7) */
  async getStats(): Promise<DashboardStats> {
    const res = await apiClient.get<ApiResponse<DashboardStats>>(
      ENDPOINTS.dashboard.stats
    );
    return res.data.data;
  },

  /** Refresh only the activity feed */
  async getActivity(): Promise<ActivityItem[]> {
    const res = await apiClient.get<ApiResponse<ActivityItem[]>>(
      ENDPOINTS.dashboard.activity
    );
    return res.data.data;
  },
};
