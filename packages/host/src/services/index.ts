/**
 * Services public API.
 * Import services from '@/services', not from individual files.
 *
 * WHY barrel exports:
 *   import { dashboardService } from '@/services'      ← clean
 *   import { dashboardService } from '@/services/dashboard.service'  ← leaks internals
 *
 *   The barrel lets us reorganise the service layer without touching
 *   every import in the codebase.
 */
export { dashboardService } from './dashboard.service';
export { userService } from './user.service';
export { apiClient, ApiError } from './api/client';
export { ENDPOINTS } from './api/endpoints';
export type { DashboardPayload } from './dashboard.service';
