/**
 * Remote load status store — tracks whether each page loaded from a live
 * remote (Module Federation) or from the local fallback bundle.
 *
 * WHY not Redux:
 *   This is infrastructure-level metadata, not application state.
 *   The Redux store tracks business data (user, dashboard stats, WS status).
 *   "Which bundle did a page load from?" is a deployment concern — relevant
 *   only to DevTools and incident diagnostics, not to the UI itself.
 *
 * PATTERN — minimal pub-sub + useSyncExternalStore (React 18):
 *   useSyncExternalStore is the React-blessed way to subscribe to any
 *   external store without Redux or Context. It handles concurrent mode
 *   correctly and tears down subscriptions on unmount automatically.
 *
 *   Components call useRemoteStatus() → get a snapshot → re-render when
 *   a remote finishes loading (remote or fallback).
 */
import { useSyncExternalStore } from 'react';

export type RemoteSource = 'loading' | 'remote' | 'fallback';

export interface RemoteInfo {
  source: RemoteSource;
  /** The URL the remote was configured to load from */
  url: string;
}

// ── Internal state ─────────────────────────────────────────────────────────

// `let` so setRemoteSource can replace the whole object — useSyncExternalStore
// compares snapshots with Object.is, so the reference must change on updates.
let _status: Record<string, RemoteInfo> = {
  dashboard: { source: 'loading', url: DASHBOARD_REMOTE_URL  },
  analytics: { source: 'loading', url: ANALYTICS_REMOTE_URL  },
};

const _listeners = new Set<() => void>();

// ── Injected at build time by webpack.config.ts via DefinePlugin ───────────

declare const DASHBOARD_REMOTE_URL: string;
declare const ANALYTICS_REMOTE_URL: string;

// ── Public API ─────────────────────────────────────────────────────────────

/** Called by routes/index.tsx when each page import resolves */
export function setRemoteSource(name: string, source: 'remote' | 'fallback'): void {
  if (_status[name]) {
    // Replace the top-level object so getSnapshot returns a new reference,
    // which useSyncExternalStore needs to detect the change.
    _status = { ..._status, [name]: { ..._status[name], source } };
  }
  _listeners.forEach(fn => fn());
}

/** Snapshot function required by useSyncExternalStore */
function getSnapshot(): Record<string, RemoteInfo> {
  return _status;
}

/** Subscribe function required by useSyncExternalStore */
function subscribe(callback: () => void): () => void {
  _listeners.add(callback);
  return () => _listeners.delete(callback);
}

/**
 * React hook — returns the current remote load status.
 * Re-renders automatically when any remote transitions from 'loading'
 * to 'remote' or 'fallback' (triggered by the first navigation to that route).
 */
export function useRemoteStatus(): Record<string, RemoteInfo> {
  return useSyncExternalStore(subscribe, getSnapshot);
}
