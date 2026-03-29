/**
 * WebSocketService — Connection manager with automatic reconnection.
 *
 * RESPONSIBILITY:
 *   Own the WebSocket lifecycle: connect → receive messages → handle
 *   disconnects → reconnect with backoff → give up after MAX_RETRIES.
 *   It knows nothing about React or Redux — it takes callbacks.
 *
 * CONNECTION STATE MACHINE:
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │                                                         │
 *   │   IDLE ──connect()──► CONNECTING                        │
 *   │                           │                             │
 *   │                    ┌──────┴──────┐                      │
 *   │                 onopen       onerror / onclose(dirty)   │
 *   │                    │              │                      │
 *   │               CONNECTED    DISCONNECTED                  │
 *   │                    │              │                      │
 *   │           onclose(dirty)   scheduleReconnect()           │
 *   │                    │              │                      │
 *   │               DISCONNECTED  CONNECTING  (loop)           │
 *   │                                                         │
 *   │   disconnect() from any state → CLOSED (no retry)       │
 *   │   MAX_RETRIES exceeded → ERROR (terminal)               │
 *   └─────────────────────────────────────────────────────────┘
 *
 * EXPONENTIAL BACKOFF:
 *   Attempt 0:  1 s
 *   Attempt 1:  2 s
 *   Attempt 2:  4 s
 *   Attempt 3:  8 s
 *   Attempt 4: 16 s
 *   Attempt 5+: 30 s  (capped)
 *
 *   Formula: Math.min(30_000, 1_000 * 2 ** attempt)
 *
 *   WHY backoff (not fixed interval):
 *     If a server goes down and 10,000 clients all retry every second,
 *     the server faces a thundering herd when it comes back up.
 *     Exponential backoff with jitter (optional) spreads the reconnection
 *     load over time.
 *
 * DEPENDENCY INJECTION:
 *   The constructor accepts a WsConstructor, defaulting to the browser
 *   WebSocket. Pass MockWebSocket in development. This makes the service
 *   trivially testable and swappable without touching any callers.
 */
import type { WsLike, WsConstructor, WsMessage, WsStatus } from './types';

const MAX_RETRIES    = 10;
const BASE_DELAY_MS  = 1_000;
const MAX_DELAY_MS   = 30_000;

export interface WsCallbacks {
  onMessage: (msg: WsMessage) => void;
  onStatus:  (status: WsStatus) => void;
  onRetry:   (attempt: number) => void;
}

export class WebSocketService {
  private ws:             WsLike | null     = null;
  private retryTimeout:   ReturnType<typeof setTimeout> | null = null;
  private retryCount      = 0;
  private intentionalClose = false;
  private url             = '';
  private callbacks:      WsCallbacks | null = null;

  constructor(private readonly WsImpl: WsConstructor = WebSocket) {}

  connect(url: string, callbacks: WsCallbacks): void {
    this.url             = url;
    this.callbacks       = callbacks;
    this.intentionalClose = false;
    this.retryCount      = 0;
    this.openSocket();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.cancelRetry();
    this.ws?.close(1000, 'Client disconnect');
    this.ws = null;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private openSocket(): void {
    this.callbacks?.onStatus('connecting');

    try {
      this.ws = new this.WsImpl(this.url);
    } catch (err) {
      // Constructor itself threw — URL invalid, env issue, etc.
      console.error('[WebSocketService] Failed to create socket:', err);
      this.callbacks?.onStatus('error');
      return;
    }

    this.ws.onopen = () => {
      this.retryCount = 0;
      this.callbacks?.onStatus('connected');
    };

    this.ws.onmessage = (ev: MessageEvent) => {
      this.parseAndRoute(ev.data as string);
    };

    this.ws.onclose = (ev: CloseEvent) => {
      const dirty = !ev.wasClean || ev.code !== 1000;
      if (this.intentionalClose || !dirty) {
        this.callbacks?.onStatus('disconnected');
        return;
      }
      // Unexpected close — reconnect
      this.callbacks?.onStatus('disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // In the browser, onerror is always followed by onclose.
      // Log it here; let onclose handle the reconnect decision.
      console.warn('[WebSocketService] Socket error — waiting for close event');
    };
  }

  private parseAndRoute(raw: string): void {
    let msg: WsMessage;
    try {
      msg = JSON.parse(raw) as WsMessage;
    } catch {
      console.warn('[WebSocketService] Received non-JSON message:', raw);
      return;
    }

    if (msg.type === 'ping') return; // heartbeat — no Redux update needed

    this.callbacks?.onMessage(msg);
  }

  private scheduleReconnect(): void {
    if (this.retryCount >= MAX_RETRIES) {
      console.error('[WebSocketService] Max retries reached — giving up');
      this.callbacks?.onStatus('error');
      return;
    }

    const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** this.retryCount);
    this.retryCount++;
    this.callbacks?.onRetry(this.retryCount);

    console.info(
      `[WebSocketService] Reconnecting in ${delay}ms (attempt ${this.retryCount}/${MAX_RETRIES})`
    );

    this.retryTimeout = setTimeout(() => {
      if (!this.intentionalClose) this.openSocket();
    }, delay);
  }

  private cancelRetry(): void {
    if (this.retryTimeout !== null) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }
}
