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
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import Dashboard from '@/pages/Dashboard';
import Analytics from '@/pages/Analytics';
import Workflow from '@/pages/Workflow';
import NotFound from '@/pages/NotFound';

export const router = createBrowserRouter([
  {
    /**
     * Root route owns the persistent layout shell.
     * AppShell renders Header + Sidebar + <Outlet />.
     * Child routes fill the <Outlet /> slot — only the page
     * content re-renders on navigation, not the whole layout.
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
