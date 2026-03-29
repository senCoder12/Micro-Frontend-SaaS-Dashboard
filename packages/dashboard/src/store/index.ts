/**
 * Dashboard Remote — Redux store.
 *
 * USED IN: standalone dev mode only (bootstrap.tsx).
 *
 * When the dashboard is loaded as a remote inside the host, the host's
 * <Provider store={hostStore}> wraps everything. react-redux is shared as
 * a singleton, so useSelector/useDispatch in this remote read from the
 * HOST's store — this file's store is never involved.
 *
 * WHY still create one:
 *   1. Standalone dev needs a real Redux store.
 *   2. The store shape here (dashboard + websocket slices) is a subset of
 *      the host's store shape — the same keys, the same reducers.
 *      This documents the "contract": the host store MUST register these
 *      two slices for the dashboard remote to work inside it.
 */
import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer   from './slices/dashboardSlice';
import websocketReducer   from './slices/websocketSlice';

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    websocket: websocketReducer,
  },
});

export type RootState  = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
