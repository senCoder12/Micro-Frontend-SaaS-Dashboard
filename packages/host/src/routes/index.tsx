/**
 * Route Definitions — Single Source of Truth.
 *
 * ── Route tree shape ──────────────────────────────────────────────────────
 *
 *  /login                  ← public, unauthenticated only
 *  /                       ← ProtectedRoute (redirects to /login if unauth)
 *    AppShell              ← layout (Header + Sidebar)
 *      /dashboard          ← all authenticated roles
 *      /analytics          ← RequireRole(['admin','manager']) → /forbidden for viewer
 *      /workflow           ← all authenticated roles
 *      /forbidden          ← 403 page (inside AppShell so nav is still visible)
 *  /*                      ← 404 NotFound
 *
 * ── Module Federation remote imports ──────────────────────────────────────
 *
 * Remote-first with local fallback:
 *   import('dashboardApp/Page')           ← MF remote (preferred)
 *     .catch(() => import('@/pages/Dashboard'))  ← local fallback
 *
 * setRemoteSource records the resolution path so RemoteIndicator shows
 * the correct badge (● remote  vs  ↩ fallback) in the Sidebar dev panel.
 *
 * ── RBAC at the route level ───────────────────────────────────────────────
 *
 * RequireRole is a layout route that renders <Outlet /> if the user's role
 * is allowed, or <Navigate to="/forbidden" /> if not.
 *
 * Defense in depth: the Sidebar also hides nav items the user can't access,
 * but RequireRole catches direct URL access and programmatic navigation.
 */
import { lazy }                          from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell }                      from '@/components/layout';
import { ProtectedRoute, RequireRole }   from '@/components/auth';
import NotFound                          from '@/pages/NotFound';
import Login                             from '@/pages/Login';
import Forbidden                         from '@/pages/Forbidden';
import { setRemoteSource }               from '@/config/remoteStatus';

// ── Remote-first page chunks ───────────────────────────────────────────────

const Dashboard = lazy(() =>
  import(/* webpackChunkName: "remote-dashboard" */ 'dashboardApp/Page')
    .then(m  => { setRemoteSource('dashboard', 'remote');   return m; })
    .catch(() => { setRemoteSource('dashboard', 'fallback'); return import(/* webpackChunkName: "page-dashboard" */ '@/pages/Dashboard'); })
);

const Analytics = lazy(() =>
  import(/* webpackChunkName: "remote-analytics" */ 'analyticsApp/Page')
    .then(m  => { setRemoteSource('analytics', 'remote');   return m; })
    .catch(() => { setRemoteSource('analytics', 'fallback'); return import(/* webpackChunkName: "page-analytics" */ '@/pages/Analytics'); })
);

const Workflow = lazy(
  () => import(/* webpackChunkName: "page-workflow" */ '@/pages/Workflow')
);

// ── Router ─────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // ── Public route: login ────────────────────────────────────────────────
  {
    path:    '/login',
    element: <Login />,
  },

  // ── Protected routes: require authentication ───────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        path:    '/',
        element: <AppShell />,
        children: [
          // Default redirect
          {
            index:   true,
            element: <Navigate to="/dashboard" replace />,
          },

          // All authenticated roles
          {
            path:    'dashboard',
            element: <Dashboard />,
          },

          // Admin + manager only — viewer redirected to /forbidden
          {
            element: <RequireRole allowedRoles={['admin', 'manager']} />,
            children: [
              {
                path:    'analytics',
                element: <Analytics />,
              },
            ],
          },

          // All authenticated roles
          {
            path:    'workflow',
            element: <Workflow />,
          },

          // 403 page — inside AppShell so sidebar/header remain visible
          {
            path:    'forbidden',
            element: <Forbidden />,
          },
        ],
      },
    ],
  },

  // ── Catch-all 404 ─────────────────────────────────────────────────────
  {
    path:    '*',
    element: <NotFound />,
  },
]);
