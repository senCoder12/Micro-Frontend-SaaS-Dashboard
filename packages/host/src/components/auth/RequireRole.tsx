/**
 * RequireRole — authorization gate for role-restricted routes.
 *
 * Used INSIDE ProtectedRoute (user is already authenticated at this point).
 * ProtectedRoute handles "are you logged in?" → RequireRole handles "are you allowed?".
 *
 * Usage in router:
 *   {
 *     element: <RequireRole allowedRoles={['admin', 'manager']} />,
 *     children: [
 *       { path: 'analytics', element: <Analytics /> },
 *     ],
 *   }
 *
 * HOW IT WORKS:
 *   Reads the user's role from Redux (populated by userSlice on login/restore).
 *   If the role is in allowedRoles → render the child routes via <Outlet />.
 *   If not → navigate to /forbidden (403 page inside AppShell).
 *
 * WHY redirect to /forbidden instead of rendering inline:
 *   - The URL changes, so the back button works as expected.
 *   - The /forbidden page is a proper route — it can be deep-linked for
 *     testing or debugged in DevTools as a real navigation.
 *   - Rendering forbidden content inline would require every restricted page
 *     to handle this case — the route guard is the right layer.
 *
 * SIDEBAR FILTERING:
 *   RequireRole catches direct URL access, but the Sidebar also hides nav
 *   items the user doesn't have access to. Defense in depth: the UI doesn't
 *   invite them and the route blocks them if they navigate manually.
 */
import React                             from 'react';
import { Navigate, Outlet }              from 'react-router-dom';
import { useAppSelector }                from '@/store/hooks';
import { selectUserRole }                from '@/store/slices';
import type { UserRole }                 from '@/types';

interface RequireRoleProps {
  /** Roles that are allowed to access the child routes. */
  allowedRoles: UserRole[];
}

const RequireRole: React.FC<RequireRoleProps> = ({ allowedRoles }) => {
  const role = useAppSelector(selectUserRole);

  // ProtectedRoute guarantees user is authenticated; role should always be set.
  // Guard against null just in case (e.g. race condition on session restore).
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};

export default RequireRole;
