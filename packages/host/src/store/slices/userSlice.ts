/**
 * userSlice — User identity, role, and UI preferences.
 *
 * WHY this lives in Redux (not Context):
 *   The user object is read by the Sidebar (avatar), Header (breadcrumb),
 *   every page guard (RBAC in Step 12), and the Analytics page (user filter).
 *   These are completely unrelated parts of the tree — passing via props
 *   would require drilling through every layout component. Redux is the
 *   correct tool here.
 *
 * PHASE 3 NOTE:
 *   When Dashboard and Analytics become remote micro-frontends, they will
 *   read this slice via the shared react-redux singleton. No extra wiring
 *   needed — they just call useAppSelector(selectUser) as if it were local.
 */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { UserRole } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Two-letter initials rendered in avatar circles */
  avatarInitials: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  notifications: boolean;
  compactMode: boolean;
}

export interface UserState {
  profile: UserProfile | null;
  preferences: UserPreferences;
  /**
   * Mocked as true until Step 12 (Auth).
   * Drives ProtectedRoute — unauthenticated users get redirected to /login.
   */
  isAuthenticated: boolean;
}

// ── Initial state ──────────────────────────────────────────────────────────

const initialState: UserState = {
  profile: {
    id: 'usr_001',
    name: 'John Doe',
    email: 'john@acme.com',
    role: 'admin',
    avatarInitials: 'JD',
  },
  preferences: {
    theme: 'dark',
    notifications: true,
    compactMode: false,
  },
  isAuthenticated: true, // replaced by real JWT check in Step 12
};

// ── Slice ──────────────────────────────────────────────────────────────────

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /**
     * Called after a successful login (Step 12).
     * Sets the profile and marks the session as authenticated.
     */
    setUser(state, action: PayloadAction<UserProfile>) {
      state.profile = action.payload;
      state.isAuthenticated = true;
    },

    /**
     * Called on logout — clears profile, keeps preferences.
     * Preferences are preserved so they persist after re-login
     * (in a real app these would be synced to the server).
     */
    clearUser(state) {
      state.profile = null;
      state.isAuthenticated = false;
    },

    /**
     * Partial update — only the keys provided are overwritten.
     * e.g., dispatch(updatePreferences({ compactMode: true }))
     */
    updatePreferences(state, action: PayloadAction<Partial<UserPreferences>>) {
      Object.assign(state.preferences, action.payload);
    },
  },
});

// ── Actions ────────────────────────────────────────────────────────────────

export const { setUser, clearUser, updatePreferences } = userSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────
// Selectors are co-located with the slice — they know the shape of this state.
// Components never access state.user.x directly; they go through selectors.
// This means we can refactor the state shape without touching components.

export const selectUser = (state: RootState) => state.user.profile;
export const selectUserRole = (state: RootState) => state.user.profile?.role;
export const selectIsAuthenticated = (state: RootState) => state.user.isAuthenticated;
export const selectPreferences = (state: RootState) => state.user.preferences;

// ── Reducer ────────────────────────────────────────────────────────────────

export default userSlice.reducer;
