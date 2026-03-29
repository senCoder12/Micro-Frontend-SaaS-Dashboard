/**
 * WebSocket slice — identical contract to the host's version.
 * Tracks connection status so the Dashboard page can show the LIVE badge.
 * In standalone mode this stays 'idle' (no WebSocket in standalone dev).
 * In integrated mode the host's useWebSocket() hook drives this slice.
 */
import { createSlice }     from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState }  from '../index';
import type { WsStatus }   from '@/services/websocket/types';

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
    wsEventReceived(state) {
      state.lastEventAt = Date.now();
      state.unreadCount += 1;
    },
    clearUnreadCount(state) {
      state.unreadCount = 0;
    },
  },
});

export const {
  wsStatusChanged,
  wsRetrying,
  wsError,
  wsEventReceived,
  clearUnreadCount,
} = websocketSlice.actions;

export const selectWsStatus      = (state: RootState) => state.websocket.status;
export const selectWsRetryCount  = (state: RootState) => state.websocket.retryCount;
export const selectWsUnreadCount = (state: RootState) => state.websocket.unreadCount;
export const selectWsLastEventAt = (state: RootState) => state.websocket.lastEventAt;
export const selectWsIsLive      = (state: RootState) => state.websocket.status === 'connected';

export default websocketSlice.reducer;
