/**
 * Dashboard Remote — Mock adapter (dashboard endpoints only).
 * Only registers the three routes this remote's service layer calls.
 */
import MockAdapter from 'axios-mock-adapter';
import type { AxiosInstance } from 'axios';
import { ENDPOINTS }          from '../api/endpoints';
import {
  generateStats,
  generateStatChanges,
  generateActivityFeed,
} from './data/dashboard.mock';
import type { ApiResponse } from '@/types';

const MOCK_DELAY_MS = 700;

function ok<T>(data: T): ApiResponse<T> {
  return { data, status: 'success', timestamp: new Date().toISOString() };
}

export function setupMockAdapter(axiosInstance: AxiosInstance): void {
  const mock = new MockAdapter(axiosInstance, {
    delayResponse: MOCK_DELAY_MS,
    onNoMatch:     'throwException',
  });

  mock.onGet(ENDPOINTS.dashboard.stats).reply(200,    ok(generateStats()));
  mock.onGet(ENDPOINTS.dashboard.changes).reply(200,  ok(generateStatChanges()));
  mock.onGet(ENDPOINTS.dashboard.activity).reply(200, ok(generateActivityFeed(8)));

  console.info('[Dashboard MockAdapter] Registered — standalone dev mode.');
}
