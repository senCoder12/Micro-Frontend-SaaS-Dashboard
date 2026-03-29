/**
 * Dashboard Remote — API client.
 * Each remote owns its own axios instance so its mock adapter
 * is isolated. Does not conflict with the host's instance.
 */
import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error: unknown) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; code?: string }>) => {
    const statusCode    = error.response?.status;
    const serverMessage = error.response?.data?.message;
    const serverCode    = error.response?.data?.code;

    const message =
      serverMessage ??
      (statusCode === 401 ? 'Unauthorized — please log in'         :
       statusCode === 403 ? 'Forbidden — insufficient permissions'  :
       statusCode === 404 ? 'Resource not found'                    :
       statusCode === 429 ? 'Too many requests — please slow down'  :
       statusCode != null && statusCode >= 500 ? 'Server error — please try again' :
       error.message ?? 'An unexpected error occurred');

    return Promise.reject(new ApiError(message, statusCode, serverCode));
  }
);
