/**
 * useWebSocket — Ties the WebSocketService to React and Redux.
 *
 * This hook is the only place in the codebase that knows about both
 * the service layer and the Redux store. Everything else is decoupled:
 *
 *   WebSocketService  →  pure class, no React/Redux dependencies
 *   websocketSlice    →  pure Redux, no service dependency
 *   useWebSocket      →  the bridge (this file)
 *
 * LIFECYCLE:
 *   mount   → create WebSocketService → connect
 *   unmount → disconnect (cleanup)
 *
 * WHY useRef for the service instance:
 *   We need the SAME service object for the duration of the component's
 *   life — connect on mount, disconnect on unmount. useRef persists a
 *   value without triggering re-renders, unlike useState.
 *
 *   If we created the service inside the effect (no ref), we'd create a
 *   new one on every re-render, causing connect/disconnect thrashing.
 *
 * WHY empty [] dependency array:
 *   The connection should be established once when App mounts and torn
 *   down when App unmounts. It should NOT reconnect on prop/state changes
 *   (that would cause a fresh connection on every Redux state update).
 *
 * STRICT MODE note:
 *   React StrictMode in dev runs effects twice (mount → unmount → mount).
 *   The cleanup function calls disconnect(), so the first connection is
 *   torn down cleanly before the second starts. You'll see two connection
 *   events in the console in dev — this is normal and expected.
 */
import { useEffect, useRef } from 'react';
import { useAppDispatch }    from '@/store/hooks';
import {
  updateStats,
  addActivity,
}                            from '@/store/slices/dashboardSlice';
import {
  wsStatusChanged,
  wsRetrying,
  wsError,
  wsEventReceived,
}                            from '@/store/slices/websocketSlice';
import { WebSocketService }  from '@/services/websocket/WebSocketService';
import { MockWebSocket }     from '@/services/websocket/MockWebSocket';
import type { WsMessage }    from '@/services/websocket/types';

/** In production, swap MockWebSocket for the real WebSocket global */
const WS_IMPL = process.env.NODE_ENV !== 'production'
  ? MockWebSocket
  : WebSocket;

/**
 * The URL a real server would listen on.
 * MockWebSocket receives this but ignores it — the URL is there so
 * the swap to a real server requires zero other code changes.
 */
const WS_URL = 'wss://dashboard.example.com/realtime';

export function useWebSocket(): void {
  const dispatch   = useAppDispatch();
  const serviceRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    // Create the service once and store it in the ref
    const service = new WebSocketService(WS_IMPL);
    serviceRef.current = service;

    service.connect(WS_URL, {
      // ── Status changes ──────────────────────────────────────────────────
      onStatus(status) {
        if (status === 'error') {
          dispatch(wsError('Connection lost — unable to reconnect after max retries.'));
        } else {
          dispatch(wsStatusChanged(status));
        }
      },

      // ── Retry events ────────────────────────────────────────────────────
      onRetry(attempt) {
        dispatch(wsRetrying(attempt));
      },

      // ── Incoming messages ───────────────────────────────────────────────
      onMessage(msg: WsMessage) {
        dispatch(wsEventReceived());

        switch (msg.type) {
          case 'stats_update':
            dispatch(updateStats(msg.payload));
            break;

          case 'activity':
            dispatch(addActivity(msg.payload));
            break;

          // 'ping' is handled inside WebSocketService — never reaches here
        }
      },
    });

    // Cleanup: disconnect when App unmounts (or in StrictMode, between the two mount passes)
    return () => {
      service.disconnect();
      serviceRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ dispatch is stable (Redux guarantees it). Empty array is intentional.
}
