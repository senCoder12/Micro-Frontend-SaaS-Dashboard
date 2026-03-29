/**
 * Header — Contextual top bar.
 *
 * Shows:
 * - Breadcrumb: current page path derived from the URL (no prop drilling)
 * - Search: placeholder (wired to real search in Step 5)
 * - Connection status: live indicator (Step 7 — WebSocket)
 * - Notifications: badge count from unread WS events (Step 7)
 * - User avatar: placeholder (auth in Step 12)
 *
 * WHY useLocation + a lookup map (not props):
 *   The Header is mounted once in AppShell, high above the pages.
 *   Passing the page title as props would require lifting state or
 *   a context. Using useLocation keeps it self-contained — it reads
 *   the URL and derives its own label. No coupling to child pages.
 */
import React, { useCallback }    from 'react';
import { useLocation }           from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectWsStatus,
  selectWsUnreadCount,
  selectWsRetryCount,
  clearUnreadCount,
}                                from '@/store/slices';
import { BellIcon, SearchIcon, ChevronRightIcon } from './icons';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics',
  '/workflow':  'Workflow',
};

// ── Connection status indicator ────────────────────────────────────────────

/**
 * Small colored dot + label that shows WebSocket connection health.
 *
 * States:
 *   connected    → pulsing green dot  "Live"
 *   connecting   → yellow dot         "Connecting…"  (+ retry count)
 *   disconnected → gray dot           "Offline"
 *   error        → red dot            "Reconnect failed"
 *   idle         → nothing shown      (before first connect attempt)
 */
interface ConnectionStatusProps {
  status:     ReturnType<typeof selectWsStatus>;
  retryCount: number;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = React.memo(
  function ConnectionStatus({ status, retryCount }) {
    if (status === 'idle') return null;

    const dotClass = {
      connected:    'ws-dot ws-dot--connected',
      connecting:   'ws-dot ws-dot--connecting',
      disconnected: 'ws-dot ws-dot--disconnected',
      error:        'ws-dot ws-dot--error',
      idle:         '',
    }[status];

    const label = {
      connected:    'Live',
      connecting:   retryCount > 0 ? `Retry ${retryCount}` : 'Connecting…',
      disconnected: 'Offline',
      error:        'Disconnected',
      idle:         '',
    }[status];

    return (
      <div className="ws-status" aria-live="polite" aria-label={`Connection: ${label}`}>
        <span className={dotClass} aria-hidden="true" />
        <span className="ws-status__label">{label}</span>
      </div>
    );
  }
);

// ── Header ─────────────────────────────────────────────────────────────────

const Header: React.FC = () => {
  const { pathname } = useLocation();
  const dispatch     = useAppDispatch();
  const pageLabel    = ROUTE_LABELS[pathname] ?? 'Page';
  const wsStatus     = useAppSelector(selectWsStatus);
  const unreadCount  = useAppSelector(selectWsUnreadCount);
  const retryCount   = useAppSelector(selectWsRetryCount);

  const handleBellClick = useCallback(() => {
    dispatch(clearUnreadCount());
  }, [dispatch]);

  return (
    <header className="header" role="banner">
      {/* Left: breadcrumb */}
      <div className="header__breadcrumb" aria-label="Breadcrumb">
        <span className="header__breadcrumb-root">Home</span>
        <ChevronRightIcon className="header__breadcrumb-sep" aria-hidden="true" />
        <span className="header__breadcrumb-current" aria-current="page">
          {pageLabel}
        </span>
      </div>

      {/* Right: actions */}
      <div className="header__actions">
        {/* WebSocket status indicator */}
        <ConnectionStatus status={wsStatus} retryCount={retryCount} />

        {/* Search — wired to data grid search in Step 5 */}
        <button
          className="header__action-btn header__search-btn"
          aria-label="Search"
          type="button"
        >
          <SearchIcon size={16} />
          <span className="header__search-placeholder">Search…</span>
          <kbd className="header__search-kbd">⌘K</kbd>
        </button>

        {/* Notifications — badge shows unread WS event count */}
        <button
          className="header__action-btn header__icon-btn"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          type="button"
          onClick={handleBellClick}
        >
          <BellIcon size={16} />
          {unreadCount > 0 && (
            <span className="header__notification-badge" aria-hidden="true">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Avatar — replaced by real user data in Step 12 */}
        <button
          className="header__avatar"
          aria-label="User menu"
          type="button"
        >
          JD
        </button>
      </div>
    </header>
  );
};

export default Header;
