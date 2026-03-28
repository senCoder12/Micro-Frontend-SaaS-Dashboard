/**
 * Header — Contextual top bar.
 *
 * Shows:
 * - Breadcrumb: current page path derived from the URL (no prop drilling)
 * - Search: placeholder (wired to real search in Step 5)
 * - Notifications: placeholder (wired in Step 7 via WebSocket)
 * - User avatar: placeholder (auth in Step 12)
 *
 * WHY useLocation + a lookup map (not props):
 *   The Header is mounted once in AppShell, high above the pages.
 *   Passing the page title as props would require lifting state or
 *   a context. Using useLocation keeps it self-contained — it reads
 *   the URL and derives its own label. No coupling to child pages.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { BellIcon, SearchIcon, ChevronRightIcon } from './icons';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics',
  '/workflow': 'Workflow',
};

const Header: React.FC = () => {
  const { pathname } = useLocation();
  const pageLabel = ROUTE_LABELS[pathname] ?? 'Page';

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

        {/* Notifications — wired to WebSocket in Step 7 */}
        <button
          className="header__action-btn header__icon-btn"
          aria-label="Notifications"
          type="button"
        >
          <BellIcon size={16} />
          <span className="header__notification-dot" aria-hidden="true" />
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
