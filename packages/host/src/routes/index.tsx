/**
 * Route Definitions — Single Source of Truth
 *
 * WHY createBrowserRouter (Data Router) over <BrowserRouter>:
 * - Enables future route-level data loaders (Step 4: API layer)
 * - Enables errorElement per-route (Step 13: error boundaries)
 * - Required for React Router's concurrent rendering optimizations
 * - Cleaner separation: route config is plain data, not JSX
 *
 * WHY routes are defined here (not in App.tsx):
 * - App.tsx stays thin (just <RouterProvider router={router} />)
 * - This file becomes the map of the entire app — easy to audit
 * - In Phase 3, remote micro-frontend routes are injected here
 *
 * ── Code Splitting with React.lazy ────────────────────────────────────────
 *
 * BEFORE (static imports):
 *   import Dashboard from '@/pages/Dashboard';
 *   import Analytics from '@/pages/Analytics';
 *   import Workflow  from '@/pages/Workflow';
 *
 *   Result: ALL page code ships in the main bundle on every page load.
 *   A user who only visits Dashboard still downloads Analytics + Workflow.
 *   Main bundle: ~180KB gzipped.
 *
 * AFTER (React.lazy + webpackChunkName):
 *   const Dashboard = lazy(() => import('...'));
 *
 *   Result: Webpack splits each page into its own async chunk.
 *   - main bundle:          ~55KB   (app shell, routing, Redux)
 *   - page-dashboard.js:   ~40KB   (only loaded when visiting /dashboard)
 *   - page-analytics.js:   ~65KB   (DataGrid + virtual scroll)
 *   - page-workflow.js:    ~35KB   (loaded on demand)
 *
 *   Total bytes on first visit to /dashboard: ~95KB instead of ~180KB.
 *
 * WHY webpackChunkName comments:
 *   Without them Webpack names chunks by their numeric ID (e.g. "3.js"),
 *   which makes network tab debugging and CDN cache-busting impossible.
 *   The magic comment /* webpackChunkName: "..." * / gives the chunk a
 *   stable, readable name that appears in bundle analysis and DevTools.
 *
 * WHY NotFound stays a static import:
 *   It's lightweight (< 1KB) and needed for ANY unmatched URL, including
 *   malformed URLs that arrive before the router has hydrated. Making it
 *   lazy would cause a Suspense flash on 404s.
 *
 * COMMON MISTAKE — lazy at the wrong level:
 *   // ✗ Bad: creates a new component identity on every render
 *   const MyPage = () => {
 *     const Lazy = lazy(() => import('./SomeComponent'));
 *     return <Lazy />;
 *   };
 *
 *   // ✓ Good: defined at module scope, identity is stable
 *   const Lazy = lazy(() => import('./SomeComponent'));
 *
 * The Suspense boundary lives in AppShell — see src/components/layout/AppShell.tsx
 */
import { lazy }                         from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell }                      from '@/components/layout';
import NotFound                          from '@/pages/NotFound';

// ── Lazy page chunks ───────────────────────────────────────────────────────

const Dashboard = lazy(
  () => import(/* webpackChunkName: "page-dashboard" */ '@/pages/Dashboard')
);

const Analytics = lazy(
  () => import(/* webpackChunkName: "page-analytics" */ '@/pages/Analytics')
);

const Workflow = lazy(
  () => import(/* webpackChunkName: "page-workflow" */ '@/pages/Workflow')
);

// ── Router ─────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  {
    /**
     * Root route owns the persistent layout shell.
     * AppShell renders Header + Sidebar + <Outlet />.
     * Child routes fill the <Outlet /> slot — only the page
     * content re-renders on navigation, not the whole layout.
     * AppShell wraps <Outlet /> in <ErrorBoundary><Suspense> to
     * handle lazy-load transitions and render crashes per-page.
     */
    path: '/',
    element: <AppShell />,
    children: [
      {
        // Redirect bare "/" to "/dashboard"
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'analytics',
        element: <Analytics />,
      },
      {
        path: 'workflow',
        element: <Workflow />,
      },
    ],
  },
  {
    // Catch-all: any unmatched path renders NotFound outside the AppShell
    path: '*',
    element: <NotFound />,
  },
]);
