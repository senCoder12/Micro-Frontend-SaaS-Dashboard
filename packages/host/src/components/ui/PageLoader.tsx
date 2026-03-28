/**
 * PageLoader — Suspense fallback for lazy-loaded pages.
 *
 * WHY a dedicated component (not just a spinner div inline):
 *   The fallback renders during two distinct scenarios:
 *     1. Initial chunk load — the JS bundle for Dashboard/Analytics/Workflow
 *        hasn't been fetched yet (first visit to that route)
 *     2. Re-suspension — a component threw a Promise (e.g. React 18
 *        use() API or experimental Suspense data fetching)
 *
 *   A named component shows clearly in React DevTools, making it obvious
 *   when you're in a loading state vs. a render error.
 *
 * WHY min-height instead of full-screen overlay:
 *   The AppShell (Header + Sidebar) is NOT lazy — it's in the main bundle
 *   and renders immediately. Only the <main> content area suspends.
 *   A full-screen overlay would flicker the nav away and back; min-height
 *   reserves space inside the content panel.
 */
import React from 'react';

interface PageLoaderProps {
  /** Message shown beneath the spinner */
  message?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading…' }) => (
  <div className="page-loader" role="status" aria-live="polite" aria-label={message}>
    <div className="page-loader__spinner" aria-hidden="true" />
    <p className="page-loader__message">{message}</p>
  </div>
);

export default PageLoader;
