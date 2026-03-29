/** Generic API response envelope — mirrors the host's version. */
export interface ApiResponse<T> {
  data:      T;
  status:    'success' | 'error';
  message?:  string;
  timestamp: string;
}
