import { apiClient }  from './api/client';
import { ENDPOINTS }  from './api/endpoints';
import type { ApiResponse } from '@/types';
import type {
  DashboardStats,
  StatChanges,
  ActivityItem,
} from '@/store/slices/dashboardSlice';

export interface DashboardPayload {
  stats:       DashboardStats;
  statChanges: StatChanges;
  activity:    ActivityItem[];
}

export const dashboardService = {
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
};
