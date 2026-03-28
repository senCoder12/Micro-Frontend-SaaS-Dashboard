/**
 * Mock Adapter — intercepts Axios requests in development.
 *
 * HOW IT WORKS:
 *   axios-mock-adapter sits between the Axios instance and the network.
 *   When a request matches a registered route, the adapter returns
 *   the mock response WITHOUT hitting the network at all.
 *
 *   GET /api/v1/dashboard/stats
 *     → mock adapter intercepts
 *     → waits `MOCK_DELAY_MS` (simulates network latency)
 *     → returns { data: generateStats(), status: 'success', ... }
 *
 * WHY simulate latency:
 *   Without delay, data appears instantly — the loading skeleton
 *   from Step 3 flashes for 0ms and is invisible. Realistic latency
 *   lets us test and demo the loading states we built.
 *
 * HOW TO DISABLE (when a real backend is available):
 *   In bootstrap.tsx, comment out: setupMockAdapter(apiClient)
 *   Nothing else changes — services and Redux thunks are unaffected.
 *
 * SWITCHING TO PRODUCTION:
 *   1. Comment out setupMockAdapter() in bootstrap.tsx
 *   2. Set API_BASE_URL env variable to the real server
 *   3. Done — the service layer is backend-agnostic
 */
import MockAdapter from 'axios-mock-adapter';
import type { AxiosInstance } from 'axios';
import { ENDPOINTS } from '../api/endpoints';
import {
  generateStats,
  generateStatChanges,
  generateActivityFeed,
} from './data/dashboard.mock';
import {
  MOCK_USER_PROFILE,
  MOCK_USER_PREFERENCES,
} from './data/user.mock';
import type { ApiResponse } from '@/types';

/** Simulated network round-trip in milliseconds */
const MOCK_DELAY_MS = 700;

/** Wrap data in the standard ApiResponse envelope */
function ok<T>(data: T): ApiResponse<T> {
  return {
    data,
    status:    'success',
    timestamp: new Date().toISOString(),
  };
}

export function setupMockAdapter(axiosInstance: AxiosInstance): void {
  /**
   * `onNoMatch: 'throwException'` — any request to an unregistered route
   * throws an error immediately. This catches missing mock registrations
   * during development instead of silently hanging.
   */
  const mock = new MockAdapter(axiosInstance, {
    delayResponse: MOCK_DELAY_MS,
    onNoMatch:     'throwException',
  });

  // ── Dashboard ────────────────────────────────────────────────────────────

  mock.onGet(ENDPOINTS.dashboard.stats).reply(200, ok(generateStats()));

  mock.onGet(ENDPOINTS.dashboard.changes).reply(200, ok(generateStatChanges()));

  mock.onGet(ENDPOINTS.dashboard.activity).reply(200, ok(generateActivityFeed(8)));

  // ── User ─────────────────────────────────────────────────────────────────

  mock.onGet(ENDPOINTS.user.me).reply(200, ok(MOCK_USER_PROFILE));

  mock.onPatch(ENDPOINTS.user.preferences).reply((config) => {
    // Echo back the patch body merged with existing preferences
    const patch = JSON.parse(config.data as string) as Partial<typeof MOCK_USER_PREFERENCES>;
    const updated = { ...MOCK_USER_PREFERENCES, ...patch };
    return [200, ok(updated)];
  });

  // ── Analytics ────────────────────────────────────────────────────────────

  mock.onGet(ENDPOINTS.analytics.pageViews).reply(200, ok({
    total: 124_832,
    change: 9.2,
    series: [42, 55, 61, 48, 70, 83, 79, 91, 88, 105, 98, 124],
  }));

  mock.onGet(ENDPOINTS.analytics.topPages).reply(200, ok([
    { page: '/dashboard',  views: 24_521, uniqueVisitors: 18_320, bounceRate: 22, avgTime: '4m 12s' },
    { page: '/analytics',  views: 12_804, uniqueVisitors:  9_441, bounceRate: 31, avgTime: '3m 05s' },
    { page: '/workflow',   views:  8_932, uniqueVisitors:  6_122, bounceRate: 18, avgTime: '6m 48s' },
    { page: '/settings',   views:  4_201, uniqueVisitors:  3_880, bounceRate: 45, avgTime: '1m 22s' },
    { page: '/onboarding', views:  2_930, uniqueVisitors:  2_930, bounceRate:  9, avgTime: '8m 14s' },
  ]));

  // ── Workflow ─────────────────────────────────────────────────────────────

  mock.onGet(ENDPOINTS.workflow.tasks).reply(200, ok([
    { id: 't1', title: 'Design new onboarding flow',  status: 'todo',        priority: 'high',   assignee: 'JD', dueDate: 'Apr 02' },
    { id: 't2', title: 'Set up CI/CD pipeline',       status: 'todo',        priority: 'high',   assignee: 'SM', dueDate: 'Apr 05' },
    { id: 't3', title: 'Write API documentation',     status: 'todo',        priority: 'medium', assignee: 'JD', dueDate: 'Apr 10' },
    { id: 't4', title: 'Implement Redux store',       status: 'in-progress', priority: 'high',   assignee: 'AR', dueDate: 'Mar 30' },
    { id: 't5', title: 'Build data grid component',   status: 'in-progress', priority: 'medium', assignee: 'JD', dueDate: 'Apr 01' },
    { id: 't6', title: 'Project scaffolding',         status: 'done',        priority: 'high',   assignee: 'JD', dueDate: 'Mar 28' },
    { id: 't7', title: 'Routing setup',               status: 'done',        priority: 'medium', assignee: 'JD', dueDate: 'Mar 28' },
  ]));

  mock.onPatch(new RegExp(`${ENDPOINTS.workflow.tasks.replace('/', '\\/')}/.*`)).reply((config) => {
    const patch = JSON.parse(config.data as string) as Record<string, unknown>;
    return [200, ok({ id: config.url?.split('/').pop(), ...patch })];
  });

  console.info('[MockAdapter] Registered. Backend calls are intercepted in development.');
}
