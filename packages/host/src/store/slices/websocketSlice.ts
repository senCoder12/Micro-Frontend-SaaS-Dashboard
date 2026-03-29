/**
 * websocketSlice — Real-time connection state.
 *
 * Tracks:
 *   - `status`      — is the socket live? (used for the Header indicator)
 *   - `retryCount`  — how many reconnection attempts so far
 *   - `lastEventAt` — epoch ms of last received message (for "x seconds ago")
 *   - `unreadCount` — activity events received since last "clear" (bell badge)
 *   - `error`       — human-readable message when status === 'error'
 *
 * WHY this lives in Redux (not local state):
 *   The connection status is needed by multiple unrelated components:
 *     - Header shows the live indicator + notification badge
 *     - Dashboard shows the "LIVE" badge
 *   Without Redux, we'd need prop drilling or a separate React context.
 *   The connection itself (WebSocketService instance) lives in the
 *   useWebSocket hook — that's NOT in Redux, because an imperative object
 *   is not serializable.
 *
 * RULE: Redux holds serializable data (strings, numbers, booleans).
 *       Imperative objects (sockets, refs, timeouts) live in hooks/refs.
 */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { WsStatus } from '@/services/websocket/types';

// ── State ─────────────────────────────────────────────────────────────────

export interface WebSocketState {
  status:      WsStatus;
  retryCount:  number;
  lastEventAt: number | null;
  unreadCount: number;
  error:       string | null;
}

const initialState: WebSocketState = {
  status:      'idle',
  retryCount:  0,
  lastEventAt: null,
  unreadCount: 0,
  error:       null,
};

// ── Slice ─────────────────────────────────────────────────────────────────

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    wsStatusChanged(state, action: PayloadAction<WsStatus>) {
      state.status = action.payload;
      if (action.payload === 'connected') {
        state.retryCount = 0;
        state.error      = null;
      }
    },

    wsRetrying(state, action: PayloadAction<number>) {
      state.status     = 'connecting';
      state.retryCount = action.payload;
    },

    wsError(state, action: PayloadAction<string>) {
      state.status = 'error';
      state.error  = action.payload;
    },

    /**
     * Called whenever a message arrives (stats_update or activity).
     * Bumps lastEventAt and increments unreadCount for the bell badge.
     */
    wsEventReceived(state) {
      state.lastEventAt = Date.now();
      state.unreadCount += 1;
    },

    /** Called when the user opens the notification panel */
    clearUnreadCount(state) {
      state.unreadCount = 0;
    },
  },
});

// ── Actions ───────────────────────────────────────────────────────────────

export const {
  wsStatusChanged,
  wsRetrying,
  wsError,
  wsEventReceived,
  clearUnreadCount,
} = websocketSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────

export const selectWsStatus      = (state: RootState) => state.websocket.status;
export const selectWsRetryCount  = (state: RootState) => state.websocket.retryCount;
export const selectWsUnreadCount = (state: RootState) => state.websocket.unreadCount;
export const selectWsLastEventAt = (state: RootState) => state.websocket.lastEventAt;

/** Convenience: true only when the socket is fully open and messages are flowing */
export const selectWsIsLive = (state: RootState) => state.websocket.status === 'connected';

export default websocketSlice.reducer;
