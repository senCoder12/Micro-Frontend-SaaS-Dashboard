/**
 * authSlice — session token and login request state.
 *
 * ── Separation of concerns ────────────────────────────────────────────────
 * authSlice  = "are you authenticated, and how?" (token, login status)
 * userSlice  = "who are you?" (profile, role, preferences)
 *
 * Keeping them apart means:
 *   - You can swap the auth mechanism (JWT → OAuth2) without touching
 *     the user profile logic.
 *   - userSlice can be consumed by remotes (they care about role) without
 *     pulling in auth infrastructure.
 *
 * ── Session persistence (sessionStorage) ─────────────────────────────────
 * Token stored in sessionStorage, not localStorage.
 * sessionStorage:  cleared when the browser tab closes → forces re-login
 *                  per tab, reasonable for a dashboard.
 * localStorage:    persists across tabs and restarts → longer sessions,
 *                  but higher XSS risk (token survives indefinitely).
 *
 * In production, the access token would be in-memory Redux state ONLY,
 * and the refresh token would be an httpOnly cookie (not readable by JS).
 * sessionStorage is a pragmatic middle ground for a demo.
 *
 * ── Synchronous session check ─────────────────────────────────────────────
 * sessionStorage is synchronous. We read it at module load time (before
 * React mounts) and bake the result into initialState. This means:
 *   - No "flash of login page" for returning users
 *   - No useEffect/useLayoutEffect needed for session restoration
 *   - authChecked is always `true` from the first render
 *
 * ── Cross-slice coupling avoidance ────────────────────────────────────────
 * loginAsync does NOT dispatch setUser internally.
 * Instead, it returns the full LoginResponse and the Login page component
 * dispatches setUser separately. This avoids a circular import:
 *   authSlice → userSlice → store/index → authSlice
 *
 * Likewise, logout() only clears auth state. The Sidebar dispatches
 * clearUser() from userSlice separately. The component is the coordinator.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService }                   from '@/services/auth.service';
import { ApiError }                      from '@/services/api/client';
import type { LoginCredentials, LoginResponse } from '@/services/auth.service';
import type { RootState }                from '@/store';

// ── Types ──────────────────────────────────────────────────────────────────

export interface AuthState {
  token:       string | null;
  /** Status of the current login HTTP request (not the session itself). */
  status:      'idle' | 'loading' | 'succeeded' | 'failed';
  error:       string | null;
  /**
   * True once we know whether the user has an active session.
   * Always `true` because sessionStorage is synchronous — we know immediately
   * at module load time. Present as an explicit flag so future async token
   * validation (e.g. refresh on mount) can set it to false while checking.
   */
  authChecked: boolean;
}

// ── Synchronous session restoration ───────────────────────────────────────

/**
 * Read the token at module load time — before React renders.
 * If sessionStorage is unavailable (e.g. iframe with restrictive policy),
 * the catch returns null and the user sees the login page.
 */
const _restoredToken = (() => {
  try { return sessionStorage.getItem('auth_token'); }
  catch { return null; }
})();

const initialState: AuthState = {
  token:       _restoredToken,
  status:      _restoredToken ? 'succeeded' : 'idle',
  error:       null,
  authChecked: true,
};

// ── Async thunks ───────────────────────────────────────────────────────────

/**
 * loginAsync — POST /auth/login with credentials.
 *
 * Returns LoginResponse { token, user } on success.
 * The Login page component is responsible for:
 *   1. Receiving the returned user and dispatching setUser()
 *   2. Navigating to the intended page after success
 *
 * This thunk only handles the HTTP call + sessionStorage.
 * It does NOT touch userSlice — that avoids a circular slice dependency.
 */
export const loginAsync = createAsyncThunk<
  LoginResponse,
  LoginCredentials,
  { rejectValue: string }
>(
  'auth/loginAsync',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      // Persist for session restoration on page reload
      sessionStorage.setItem('auth_token', response.token);
      sessionStorage.setItem('auth_user', JSON.stringify(response.user));
      return response;
    } catch (err) {
      return rejectWithValue(
        err instanceof ApiError ? err.message : 'Login failed. Please try again.',
      );
    }
  },
);

// ── Slice ──────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Clears the session token and removes persisted data.
     *
     * Does NOT clear the user profile — that's userSlice's job.
     * The caller (Sidebar) dispatches both logout() + clearUser() together.
     * Two dispatches are explicit and debuggable in Redux DevTools.
     */
    logout(state) {
      state.token  = null;
      state.status = 'idle';
      state.error  = null;
      try {
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
      } catch { /* ignore restricted environments */ }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.status = 'loading';
        state.error  = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.token  = action.payload.token;
        state.status = 'succeeded';
        state.error  = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error  = action.payload ?? 'Unknown error';
      });
  },
});

// ── Actions ────────────────────────────────────────────────────────────────

export const { logout } = authSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────

export const selectAuthStatus  = (state: RootState) => state.auth.status;
export const selectAuthError   = (state: RootState) => state.auth.error;
export const selectAuthChecked = (state: RootState) => state.auth.authChecked;

// ── Reducer ────────────────────────────────────────────────────────────────

export default authSlice.reducer;
