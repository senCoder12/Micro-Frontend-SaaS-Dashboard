/**
 * Global TypeScript types shared across the host app.
 * Types specific to a feature live alongside that feature's files.
 */

/** Generic API response envelope */
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  timestamp: string;
}

/** Paginated list response */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** User roles for RBAC (implemented in Step 12) */
export type UserRole = 'admin' | 'manager' | 'viewer';

/** Navigation route definition */
export interface NavRoute {
  path: string;
  label: string;
  icon?: string;
  roles?: UserRole[]; // undefined = accessible to all roles
}
