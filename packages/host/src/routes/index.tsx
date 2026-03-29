/**
 * Route Definitions — Single Source of Truth.
 *
 * ── Module Federation remote imports ──────────────────────────────────────
 *
 * BEFORE (Steps 1–8): static local imports
 *   const Dashboard = lazy(() => import('@/pages/Dashboard'));
 *   // Lives in THIS bundle — all page code shipped to every user
 *
 * AFTER (Step 9): remote-first with local fallback
 *   const Dashboard = lazy(() =>
 *     import('dashboardApp/Page')           // ← MF remote (preferred)
 *       .catch(() => import('@/pages/Dashboard'))  // ← local fallback
 *   );
 *
 * HOW THE REMOTE IMPORT WORKS:
 *   1. Webpack sees `import('dashboardApp/Page')`
 *   2. At runtime the MF runtime checks: is 'dashboardApp' registered?
 *   3. It fetches http://localhost:3001/remoteEntry.js (the manifest)
 *   4. It finds the chunk hash for './Page' in the manifest
 *   5. It fetches that chunk and executes the Dashboard component
 *   6. React.lazy resolves → Suspense unmounts PageLoader → Dashboard renders
 *
 * WHY .catch() fallback:
 *   If the dashboard dev server isn't running (common when only developing
 *   the host shell), the remote fetch fails. The catch silently falls back
 *   to the local copy bundled with the host. This means:
 *   - Running ONLY the host still works (uses local pages)
 *   - Running host + remotes uses the remote pages
 *   - A remote crashing in production degrades gracefully
 *
 * WORKFLOW FOR TEAMS:
 *   Host team   → npm run dev:host                (port 3000 only)
 *   Dashboard   → npm run dev:dashboard            (port 3001 only)
 *   Full stack  → npm run dev (all three in parallel)
 *
 * WHY Workflow stays local:
 *   We haven't created a packages/workflow remote yet (Step 10+).
 *   It stays as a local lazy import until extracted.
 */
import { lazy }                          from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell }                      from '@/components/layout';
import NotFound                          from '@/pages/NotFound';

// ── Remote-first page chunks ───────────────────────────────────────────────

/**
 * Try the MF remote first. If the remote dev server isn't running,
 * the dynamic import rejects and .catch() loads the local fallback.
 * Users never see an error — they just get the locally-bundled version.
 */
const Dashboard = lazy(() =>
  import(/* webpackChunkName: "remote-dashboard" */ 'dashboardApp/Page')
    .catch(() => import(/* webpackChunkName: "page-dashboard" */ '@/pages/Dashboard'))
);

const Analytics = lazy(() =>
  import(/* webpackChunkName: "remote-analytics" */ 'analyticsApp/Page')
    .catch(() => import(/* webpackChunkName: "page-analytics" */ '@/pages/Analytics'))
);

/** Workflow stays local until extracted to its own remote in a later step */
const Workflow = lazy(
  () => import(/* webpackChunkName: "page-workflow" */ '@/pages/Workflow')
);

// ── Router ─────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  {
    path:    '/',
    element: <AppShell />,
    children: [
      {
        index:   true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path:    'dashboard',
        element: <Dashboard />,
      },
      {
        path:    'analytics',
        element: <Analytics />,
      },
      {
        path:    'workflow',
        element: <Workflow />,
      },
    ],
  },
  {
    path:    '*',
    element: <NotFound />,
  },
]);
