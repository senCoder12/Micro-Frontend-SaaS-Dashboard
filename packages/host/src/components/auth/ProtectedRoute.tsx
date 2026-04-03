/**
 * ProtectedRoute — authentication gate for the entire app shell.
 *
 * Used as a layout route in the router:
 *   { element: <ProtectedRoute />, children: [...] }
 *
 * HOW IT WORKS:
 *   isAuthenticated is synchronously derived from the Redux store, which
 *   is populated at module load time by userSlice reading sessionStorage.
 *   So by the first render, the store already knows if the user is logged in.
 *   No async check, no loading spinner needed.
 *
 * REDIRECT BEHAVIOUR:
 *   Passes `state={{ from: location }}` so the Login page can redirect back
 *   to the originally requested URL after successful authentication.
 *
 *   e.g., user bookmarks /analytics, opens tab → /analytics is blocked →
 *         redirected to /login → logs in → sent back to /analytics.
 *
 * WHY NOT useEffect + navigate:
 *   Imperative navigation in useEffect would allow the protected component
 *   to render once before the redirect fires (one render cycle gap).
 *   Declarative <Navigate> renders nothing for the protected page — cleaner.
 */
import React                                from 'react';
import { Navigate, Outlet, useLocation }    from 'react-router-dom';
import { useAppSelector }                   from '@/store/hooks';
import { selectIsAuthenticated }            from '@/store/slices';

const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location        = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
