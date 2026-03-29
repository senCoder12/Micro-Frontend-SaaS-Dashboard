/**
 * MockWebSocket — a browser-compatible stand-in for a real WS server.
 *
 * WHY a mock instead of a real server:
 *   This project has no backend. But the Dashboard needs realistic live
 *   data to demonstrate the real-time architecture. MockWebSocket emits
 *   the exact same message shapes a real server would send — stats
 *   drifting up/down, new activity items appearing — so the rest of the
 *   stack (service → Redux → React) is exercised exactly as in production.
 *
 * HOW it mimics the real WebSocket API:
 *   It implements the WsLike interface: onopen, onmessage, onclose,
 *   onerror, readyState, and close(). The WebSocketService doesn't know
 *   or care whether it's talking to this mock or a real server.
 *
 * SWAPPING to a real server (production):
 *   In useWebSocket.ts, the constructor is injected:
 *     process.env.NODE_ENV !== 'production' ? MockWebSocket : WebSocket
 *   One line change, zero other code touched.
 *
 * TIMING (1-second tick):
 *   Tick  3 → first stats update
 *   Tick  6 → first activity event
 *   Tick  9 → second stats update  (every 6 ticks thereafter)
 *   Tick 12 → second activity      (every 9 ticks thereafter)
 *   Tick 30 → heartbeat ping       (every 30 ticks)
 */
import type { WsLike, WsMessage }    from './types';
import type { ActivityType }          from '@/store/slices/dashboardSlice';

// ── Lookup tables for generated events ────────────────────────────────────

const FIRST_NAMES = ['Alex', 'Maya', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn'];
const LAST_NAMES  = ['Smith', 'Johnson', 'Williams', 'Brown', 'Garcia', 'Miller', 'Davis', 'Wilson'];
const PLANS       = ['Pro', 'Business', 'Enterprise', 'Starter'];
const AMOUNTS     = [49, 99, 149, 299, 499, 99, 149];

const ALERT_MSGS = [
  'API rate limit at 78% — consider upgrading',
  'Unusual login pattern detected for account #4821',
  'Worker node memory at 91% — investigating',
  'Scheduled maintenance window in 30 minutes',
];

const INFO_MSGS = [
  'Daily report generated and delivered',
  'New feature flag enabled for beta cohort',
  'CDN cache invalidated for static assets',
  'Database backup completed successfully',
];

// Revenue drifts up/down within a realistic range
let revenueBase = 45_800;
let userBase    = 12_400;
let sessionBase = 8_200;
let eventSeq    = 0;    // monotonically increasing for stable IDs

function pick<T>(arr: T[], n: number): T {
  return arr[n % arr.length];
}

function timeAgo(seconds: number): string {
  if (seconds < 60)   return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function generateStatsUpdate(): WsMessage {
  // Revenue drifts ±300 with slight upward bias
  revenueBase += (Math.random() - 0.42) * 300;
  revenueBase  = Math.max(42_000, Math.min(58_000, revenueBase));

  // Users and sessions increment slowly
  userBase    += Math.floor(Math.random() * 3);
  sessionBase += Math.floor(Math.random() * 4);

  return {
    type: 'stats_update',
    payload: {
      revenue:  Math.round(revenueBase),
      users:    userBase,
      sessions: sessionBase,
    },
  };
}

function generateActivity(): WsMessage {
  const n         = ++eventSeq;
  const firstName = pick(FIRST_NAMES, n * 7);
  const lastName  = pick(LAST_NAMES,  n * 13);
  const type      = pick<ActivityType>(['signup', 'payment', 'payment', 'alert', 'info', 'signup', 'payment'], n);

  let message: string;
  switch (type) {
    case 'signup':
      message = `New signup: ${firstName} ${lastName}`;
      break;
    case 'payment':
      message = `Payment received — $${pick(AMOUNTS, n * 3)} / ${pick(PLANS, n)} plan`;
      break;
    case 'alert':
      message = pick(ALERT_MSGS, n);
      break;
    case 'info':
    default:
      message = pick(INFO_MSGS, n);
  }

  return {
    type: 'activity',
    payload: {
      id:        `ws_${Date.now()}_${n}`,
      message,
      time:      timeAgo(0),
      type,
      timestamp: Date.now(),
    },
  };
}

// ── MockWebSocket class ────────────────────────────────────────────────────

export class MockWebSocket implements WsLike {
  // ReadyState constants — mirror the browser WebSocket constants
  static readonly CONNECTING = 0;
  static readonly OPEN       = 1;
  static readonly CLOSING    = 2;
  static readonly CLOSED     = 3;

  readyState: number = MockWebSocket.CONNECTING;

  onopen:    ((ev: Event) => void) | null        = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onclose:   ((ev: CloseEvent) => void) | null   = null;
  onerror:   ((ev: Event) => void) | null        = null;

  private tick    = 0;
  private timers: ReturnType<typeof setTimeout | typeof setInterval>[] = [];

  constructor(public readonly url: string) {
    // Simulate the async handshake — real WebSocket connections aren't instant
    const connectTimer = setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
      this.startTicking();
    }, 400);

    this.timers.push(connectTimer);
  }

  private startTicking(): void {
    const interval = setInterval(() => {
      if (this.readyState !== MockWebSocket.OPEN) return;
      this.tick++;

      // Stats update: ticks 3, 9, 15, 21 …  (first quick, then every 6s)
      if (this.tick === 3 || (this.tick > 3 && (this.tick - 3) % 6 === 0)) {
        this.dispatch(generateStatsUpdate());
      }

      // Activity:    ticks 6, 15, 24, 33 …  (first at 6s, then every 9s)
      if (this.tick === 6 || (this.tick > 6 && (this.tick - 6) % 9 === 0)) {
        this.dispatch(generateActivity());
      }

      // Heartbeat: every 30 ticks
      if (this.tick % 30 === 0) {
        this.dispatch({ type: 'ping', payload: null });
      }
    }, 1_000);

    this.timers.push(interval);
  }

  private dispatch(data: WsMessage): void {
    if (this.readyState !== MockWebSocket.OPEN) return;
    const event = new MessageEvent('message', { data: JSON.stringify(data) });
    this.onmessage?.(event);
  }

  close(code = 1000, reason = 'Normal closure'): void {
    if (this.readyState === MockWebSocket.CLOSED) return;

    this.readyState = MockWebSocket.CLOSING;
    this.timers.forEach((t) => {
      clearTimeout(t as ReturnType<typeof setTimeout>);
      clearInterval(t as ReturnType<typeof setInterval>);
    });
    this.timers = [];

    // Simulate the async close handshake
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.onclose?.(new CloseEvent('close', { code, reason, wasClean: code === 1000 }));
    }, 50);
  }
}
