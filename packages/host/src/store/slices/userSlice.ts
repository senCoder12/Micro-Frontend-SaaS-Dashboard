/**
 * userSlice — User identity, role, and UI preferences.
 *
 * Step 4 additions:
 *   - `fetchCurrentUser` async thunk — fetches from /users/me
 *   - `savePreferences` async thunk  — PATCHes /users/me/preferences
 *   - extraReducers for both thunks
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { userService } from '@/services/user.service';
import { ApiError } from '@/services/api/client';
import type { UserRole } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  id:             string;
  name:           string;
  email:          string;
  role:           UserRole;
  avatarInitials: string;
}

export interface UserPreferences {
  theme:         'dark' | 'light';
  notifications: boolean;
  compactMode:   boolean;
}

export interface UserState {
  profile:         UserProfile | null;
  preferences:     UserPreferences;
  isAuthenticated: boolean;
  /** Tracks /users/me fetch status separately from dashboard */
  profileStatus:   'idle' | 'loading' | 'succeeded' | 'failed';
}

// ── Session restoration (synchronous) ─────────────────────────────────────
//
// authSlice stores the user object in sessionStorage on login.
// userSlice reads it back here at module load time — before React renders.
// This eliminates the "flash of login page" for returning users.
//
// The token is verified by authSlice (same timing, same mechanism).
// If the token is missing but the user object is present (or vice versa),
// we treat the session as invalid and start unauthenticated.

const _restoredProfile = (() => {
  try {
    const token    = sessionStorage.getItem('auth_token');
    const userJson = sessionStorage.getItem('auth_user');
    if (!token || !userJson) return null;
    return JSON.parse(userJson) as UserProfile;
  } catch {
    return null;
  }
})();

// ── Initial state ──────────────────────────────────────────────────────────

const initialState: UserState = {
  profile:         _restoredProfile,
  preferences: {
    theme:         'dark',
    notifications: true,
    compactMode:   false,
  },
  isAuthenticated: _restoredProfile !== null,
  profileStatus:   'idle',
};

// ── Async thunks ───────────────────────────────────────────────────────────

/**
 * Fetch the authenticated user's profile from the server.
 * Called once on app boot (Step 12: after JWT is validated).
 * For now, the mock returns the same static profile as initialState.
 */
export const fetchCurrentUser = createAsyncThunk<
  UserProfile,
  void,
  { rejectValue: string }
>(
  'user/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getMe();
    } catch (err) {
      return rejectWithValue(
        err instanceof ApiError ? err.message : 'Failed to load user profile'
      );
    }
  }
);

/**
 * Persist a preferences patch to the server and update local state.
 * Optimistic update pattern: Redux is updated immediately on fulfilled,
 * not on dispatch (no rollback needed for low-stakes preferences).
 */
export const savePreferences = createAsyncThunk<
  UserPreferences,
  Partial<UserPreferences>,
  { rejectValue: string }
>(
  'user/savePreferences',
  async (patch, { rejectWithValue }) => {
    try {
      return await userService.updatePreferences(patch);
    } catch (err) {
      return rejectWithValue(
        err instanceof ApiError ? err.message : 'Failed to save preferences'
      );
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /** Called after a successful login (Step 12) */
    setUser(state, action: PayloadAction<UserProfile>) {
      state.profile         = action.payload;
      state.isAuthenticated = true;
    },

    /** Called on logout — clears profile, keeps preferences */
    clearUser(state) {
      state.profile         = null;
      state.isAuthenticated = false;
    },

    /**
     * Synchronous local-only preferences update.
     * Use this for instant UI feedback (e.g. theme toggle).
     * Use savePreferences thunk when persistence to server is needed.
     */
    updatePreferences(state, action: PayloadAction<Partial<UserPreferences>>) {
      Object.assign(state.preferences, action.payload);
    },
  },

  extraReducers: (builder) => {
    // ── fetchCurrentUser ────────────────────────────────────────────────────
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.profileStatus = 'loading';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.profile         = action.payload;
        state.isAuthenticated = true;
        state.profileStatus   = 'succeeded';
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        // Don't clear the optimistic profile — user still sees the app
        state.profileStatus = 'failed';
      });

    // ── savePreferences ─────────────────────────────────────────────────────
    builder
      .addCase(savePreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      });
      // rejected: silently ignore — local state already updated via updatePreferences

    // ── auth/logout (cross-slice listener) ──────────────────────────────────
    //
    // WHY match by type string instead of importing logout from authSlice:
    //   Importing would create a circular reference:
    //   userSlice → authSlice → (RootState type) → store/index → userSlice
    //   TypeScript handles `import type` cycles, but runtime circular requires
    //   can produce undefined values at execution time.
    //
    //   Matching the action type string keeps slices fully decoupled.
    //   authSlice dispatches 'auth/logout'; both slices react to it.
    builder.addMatcher(
      (action): action is { type: 'auth/logout' } => action.type === 'auth/logout',
      (state) => {
        state.profile         = null;
        state.isAuthenticated = false;
        state.profileStatus   = 'idle';
      },
    );
  },
});

// ── Actions ────────────────────────────────────────────────────────────────

export const { setUser, clearUser, updatePreferences } = userSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────

export const selectUser            = (state: RootState) => state.user.profile;
export const selectUserRole        = (state: RootState) => state.user.profile?.role;
export const selectIsAuthenticated = (state: RootState) => state.user.isAuthenticated;
export const selectPreferences     = (state: RootState) => state.user.preferences;
export const selectProfileStatus   = (state: RootState) => state.user.profileStatus;

// ── Reducer ────────────────────────────────────────────────────────────────

export default userSlice.reducer;
