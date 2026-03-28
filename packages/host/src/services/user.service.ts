/**
 * User Service — HTTP calls for the user domain.
 * Same rules as dashboardService: typed returns, no Redux, no side effects.
 */
import { apiClient } from './api/client';
import { ENDPOINTS } from './api/endpoints';
import type { ApiResponse } from '@/types';
import type { UserProfile, UserPreferences } from '@/store/slices/userSlice';

export const userService = {
  /** Fetch the authenticated user's profile. Called on app boot (Step 12: after JWT verified). */
  async getMe(): Promise<UserProfile> {
    const res = await apiClient.get<ApiResponse<UserProfile>>(ENDPOINTS.user.me);
    return res.data.data;
  },

  /**
   * Persist a partial preferences update to the server.
   * Returns the full updated preferences object for Redux to replace.
   *
   * PATCH semantics: only the keys in `patch` are updated.
   * e.g., { compactMode: true } does not reset notifications.
   */
  async updatePreferences(patch: Partial<UserPreferences>): Promise<UserPreferences> {
    const res = await apiClient.patch<ApiResponse<UserPreferences>>(
      ENDPOINTS.user.preferences,
      patch
    );
    return res.data.data;
  },
};
