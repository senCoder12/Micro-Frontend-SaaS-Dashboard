/**
 * WebSocket message and status types.
 *
 * These are the "wire types" — what actually travels over the socket.
 * They are kept separate from Redux state so the service layer stays
 * independent of the store shape.
 *
 * WsMessage is a discriminated union: the `type` field is the
 * discriminant. TypeScript narrows the payload automatically in a switch:
 *
 *   switch (msg.type) {
 *     case 'stats_update': msg.payload.revenue // typed as number | undefined
 *     case 'activity':     msg.payload.id      // typed as string
 *   }
 */

import type { ActivityItem } from '@/store/slices/dashboardSlice';

// ── Status ─────────────────────────────────────────────────────────────────

export type WsStatus =
  | 'idle'           // not yet started
  | 'connecting'     // WebSocket constructor called, waiting for onopen
  | 'connected'      // onopen fired, messages flowing
  | 'disconnected'   // onclose fired, will reconnect
  | 'error';         // unrecoverable after MAX_RETRIES

// ── Messages ───────────────────────────────────────────────────────────────

export interface WsStatsUpdateMessage {
  type: 'stats_update';
  payload: {
    revenue?:    number;
    users?:      number;
    sessions?:   number;
    bounceRate?: number;
  };
}

export interface WsActivityMessage {
  type:    'activity';
  payload: ActivityItem;
}

/**
 * Server heartbeat — confirms the connection is alive.
 * Clients typically respond with a 'pong' (omitted here for brevity).
 */
export interface WsPingMessage {
  type:    'ping';
  payload: null;
}

export type WsMessage = WsStatsUpdateMessage | WsActivityMessage | WsPingMessage;

// ── WsLike interface ───────────────────────────────────────────────────────

/**
 * Minimal duck-typed interface satisfied by both the browser's native
 * `WebSocket` and our `MockWebSocket`.
 *
 * WHY not use the DOM `WebSocket` type directly:
 *   The DOM WebSocket type has dozens of methods/properties we don't need.
 *   Declaring only what we use lets MockWebSocket implement the same
 *   interface without having to stub every property.
 */
export interface WsLike {
  readonly readyState: number;
  onopen:              ((ev: Event) => void) | null;
  onmessage:           ((ev: MessageEvent) => void) | null;
  onclose:             ((ev: CloseEvent) => void) | null;
  onerror:             ((ev: Event) => void) | null;
  close(code?: number, reason?: string): void;
}

/** Constructor signature used for dependency injection */
export type WsConstructor = new (url: string) => WsLike;
