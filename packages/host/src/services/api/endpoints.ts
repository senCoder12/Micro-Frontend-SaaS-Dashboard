/**
 * API Endpoint Registry — all URL paths in one place.
 *
 * WHY a constants file (not inline strings):
 *   - Change /api/v1 → /api/v2 in one file, not across 20 service methods
 *   - TypeScript prevents typos — `ENDPOINTS.dashbord.stats` fails at compile time
 *   - Documents the entire API surface in one scannable place
 *
 * `as const` makes the object deeply readonly and gives string literal types
 * instead of `string`, which TypeScript can use for exhaustiveness checks.
 */
export const ENDPOINTS = {
  dashboard: {
    stats:    '/dashboard/stats',
    changes:  '/dashboard/stat-changes',
    activity: '/dashboard/activity',
  },
  user: {
    me:          '/users/me',
    preferences: '/users/me/preferences',
  },
  analytics: {
    pageViews: '/analytics/page-views',
    topPages:  '/analytics/top-pages',
  },
  workflow: {
    tasks:  '/workflow/tasks',
    update: (id: string) => `/workflow/tasks/${id}`,
  },
} as const;
