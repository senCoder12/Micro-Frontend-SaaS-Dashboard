/**
 * Root Redux store — single source of truth for the host application.
 *
 * configureStore does three things automatically:
 *   1. Combines all slice reducers under their key
 *   2. Adds redux-thunk middleware (needed for Step 4 async thunks)
 *   3. Enables Redux DevTools Extension in development only
 *
 * PHASE 3 — Module Federation sharing:
 *   This store instance is exported as a singleton.
 *   In webpack.config.ts (Step 11) we'll add it to the Module Federation
 *   `shared` config alongside react and react-redux so remote apps
 *   import the SAME instance, not their own copy.
 *
 *   If two copies of react-redux were loaded, each would create its own
 *   Context and they'd never see each other's state.
 */
import { configureStore } from '@reduxjs/toolkit';
import authReducer      from './slices/authSlice';
import userReducer      from './slices/userSlice';
import dashboardReducer from './slices/dashboardSlice';
import websocketReducer from './slices/websocketSlice';

export const store = configureStore({
  reducer: {
    auth:      authReducer,
    user:      userReducer,
    dashboard: dashboardReducer,
    websocket: websocketReducer,
  },
  // devTools: RTK enables this automatically in development.
  // You can install the Redux DevTools browser extension to inspect state.
});

/**
 * RootState — the full shape of the Redux store.
 * Derived from the store itself so it stays in sync as slices are added.
 *
 * Usage: const value = useAppSelector((state: RootState) => state.user.profile)
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * AppDispatch — the typed dispatch function.
 * Using this (instead of plain Dispatch) ensures TypeScript validates
 * thunk actions in Step 4.
 */
export type AppDispatch = typeof store.dispatch;
