/**
 * RemoteIndicator — Development-only panel showing Module Federation status.
 *
 * Renders at the bottom of the Sidebar only when NODE_ENV === 'development'.
 * In production builds this entire component tree-shakes away because the
 * condition `process.env.NODE_ENV !== 'production'` is a compile-time constant
 * that Webpack evaluates during the production minification pass.
 *
 * WHAT IT SHOWS:
 *   ● dashboardApp  ✓ remote   :3001   ← green: loaded from MF remote
 *   ● analyticsApp  ↩ fallback         ← yellow: remote offline, using bundled copy
 *   ● workflowApp   ○ n/a              ← gray: not yet navigated to
 *
 * WHY THIS IS USEFUL:
 *   Without this panel, you can't tell whether you're looking at the remote
 *   version of a page or the locally bundled fallback. Both look identical.
 *   During development, you might think you're testing the remote but the
 *   remote dev server crashed 10 minutes ago — you'd never know.
 *
 *   In production, this would go in an internal "debug mode" toggle,
 *   gated behind an auth check (admin users only).
 */
import React from 'react';
import { useRemoteStatus } from '@/config/remoteStatus';
import type { RemoteSource } from '@/config/remoteStatus';

// Only render in development
if (process.env.NODE_ENV === 'production') {
  // This module exports a no-op in production — tree-shaken by Webpack
}

const STATUS_ICON: Record<RemoteSource, string> = {
  loading:  '○',
  remote:   '●',
  fallback: '↩',
};

const STATUS_LABEL: Record<RemoteSource, string> = {
  loading:  'loading…',
  remote:   'remote',
  fallback: 'fallback',
};

const STATUS_COLOR: Record<RemoteSource, string> = {
  loading:  'var(--color-text-faint)',
  remote:   'var(--color-success)',
  fallback: 'var(--color-warning)',
};

const RemoteIndicator: React.FC = () => {
  const remotes = useRemoteStatus();

  // Strip the protocol + host from the URL to show just the port
  const portLabel = (url: string): string => {
    try { return `:${new URL(url).port}`; }
    catch { return ''; }
  };

  return (
    <div className="remote-indicator" aria-label="Module Federation status">
      <div className="remote-indicator__title">MF Remotes</div>
      {Object.entries(remotes).map(([name, info]) => (
        <div key={name} className="remote-indicator__row">
          <span
            className="remote-indicator__dot"
            style={{ color: STATUS_COLOR[info.source] }}
            aria-hidden="true"
          >
            {STATUS_ICON[info.source]}
          </span>
          <span className="remote-indicator__name">{name}</span>
          <span
            className="remote-indicator__status"
            style={{ color: STATUS_COLOR[info.source] }}
          >
            {STATUS_LABEL[info.source]}
            {info.source === 'remote' && (
              <span className="remote-indicator__port">{portLabel(info.url)}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * Exported as a no-op in production — the conditional is evaluated at build
 * time by Webpack and the dead branch is eliminated.
 */
export default process.env.NODE_ENV !== 'production' ? RemoteIndicator : () => null;
