/**
 * API Client — Axios instance with interceptors.
 *
 * This is the ONLY file in the codebase that imports from 'axios' directly.
 * Every service goes through this instance so that:
 *
 *   - Auth headers are attached automatically (Step 12: JWT interceptor)
 *   - Error format is normalised — services receive ApiError, not raw AxiosError
 *   - Timeout + base URL is configured once, not in every fetch call
 *   - The mock adapter (development) can intercept all calls via one attachment point
 *
 * WHY export the instance (not just the methods):
 *   The mock adapter needs the instance reference to register intercepts.
 *   `setupMockAdapter(apiClient)` in bootstrap.tsx attaches before any call is made.
 */
import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ── Custom error ───────────────────────────────────────────────────────────

/**
 * Structured error thrown by every failed API call.
 *
 * Using a class (not a plain object) lets us do:
 *   if (err instanceof ApiError) { ... }
 * in catch blocks and in createAsyncThunk's rejectWithValue handler.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    /** Machine-readable error code from the server (e.g. 'RATE_LIMITED') */
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    // Restore prototype chain (required when extending built-ins in TypeScript)
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// ── Axios instance ─────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor ────────────────────────────────────────────────────

/**
 * Attaches the auth token on every outgoing request.
 * Currently a no-op placeholder — Step 12 wires the real JWT here.
 *
 * WHY interceptor (not per-service):
 *   If each service method called `getToken()` and set the header manually,
 *   adding token refresh logic later would require editing every service.
 *   The interceptor is a single choke point.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Step 12: uncomment after auth is wired
    // const token = localStorage.getItem('access_token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// ── Response interceptor ───────────────────────────────────────────────────

/**
 * Normalises every error into ApiError before it reaches service code.
 *
 * Without this, services would receive different error shapes depending on:
 *   - Network failure → no response object
 *   - 4xx/5xx → response.data.message or response.statusText
 *   - Timeout → AxiosError with code 'ECONNABORTED'
 *
 * After this interceptor, services always catch ApiError — one shape to handle.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; code?: string }>) => {
    const statusCode = error.response?.status;
    const serverMessage = error.response?.data?.message;
    const serverCode = error.response?.data?.code;

    const message =
      serverMessage ??
      (statusCode === 401 ? 'Unauthorized — please log in' :
       statusCode === 403 ? 'Forbidden — insufficient permissions' :
       statusCode === 404 ? 'Resource not found' :
       statusCode === 429 ? 'Too many requests — please slow down' :
       statusCode != null && statusCode >= 500 ? 'Server error — please try again' :
       error.message ?? 'An unexpected error occurred');

    return Promise.reject(new ApiError(message, statusCode, serverCode));
  }
);
