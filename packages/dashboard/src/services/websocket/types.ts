/**
 * WsStatus type — used by websocketSlice.
 * Minimal copy of the host's websocket/types.ts (only the status enum).
 * The Dashboard remote doesn't run its own WebSocket — it reads status
 * from the host's store via the shared react-redux singleton.
 */
export type WsStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';
