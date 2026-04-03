/**
 * Sidebar — Persistent navigation panel.
 *
 * Step 12 additions:
 *   - Nav items filtered by role (viewer can't see Analytics link)
 *   - Role badge next to user name
 *   - Logout button dispatches logout() + clearUser()
 *
 * RBAC in the nav:
 *   Each NavItem has an optional `roles` array. If set, the item is only
 *   rendered for users whose role is in the array. This is UI feedback —
 *   the route-level RequireRole guard is the actual enforcement.
 *
 *   Defense in depth: hide UI elements AND block routes.
 *   Hiding alone is insufficient — a determined user can type any URL.
 *   Blocking alone is insufficient — showing forbidden links degrades UX.
 */
import React, { useCallback }    from 'react';
import { NavLink }               from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectUser, selectUserRole, logout, clearUser } from '@/store/slices';
import { DashboardIcon, AnalyticsIcon, WorkflowIcon }    from './icons';
import RemoteIndicator                                   from './RemoteIndicator';
import type { UserRole }                                 from '@/types';

// ── Nav item definition ────────────────────────────────────────────────────

interface NavItem {
  to:     string;
  label:  string;
  icon:   React.ReactNode;
  /**
   * Roles allowed to see this item.
   * undefined = visible to all authenticated users.
   */
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon aria-hidden="true" /> },
  {
    to:    '/analytics',
    label: 'Analytics',
    icon:  <AnalyticsIcon aria-hidden="true" />,
    roles: ['admin', 'manager'],   // viewer can't access analytics
  },
  { to: '/workflow',  label: 'Workflow',  icon: <WorkflowIcon  aria-hidden="true" /> },
];

// ── Role badge ─────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<UserRole, string> = {
  admin:   'var(--color-primary)',
  manager: 'var(--color-success)',
  viewer:  'var(--color-warning)',
};

// ── Component ──────────────────────────────────────────────────────────────

const Sidebar: React.FC = () => {
  const dispatch  = useAppDispatch();
  const user      = useAppSelector(selectUser);
  const userRole  = useAppSelector(selectUserRole);

  const handleLogout = useCallback(() => {
    // Two dispatches — each slice clears its own state.
    // logout() clears token + sessionStorage (authSlice).
    // clearUser() clears profile + isAuthenticated (userSlice).
    // ProtectedRoute re-renders, sees isAuthenticated: false, redirects to /login.
    dispatch(logout());
    dispatch(clearUser());
  }, [dispatch]);

  // Filter nav items by current role
  const visibleItems = NAV_ITEMS.filter(
    item => !item.roles || (userRole !== undefined && item.roles.includes(userRole))
  );

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar__logo">
        <span className="sidebar__logo-icon" aria-hidden="true">◈</span>
        <span className="sidebar__logo-text">SaaS Dashboard</span>
      </div>

      <div className="sidebar__section-label">Main Menu</div>

      {/* Role-filtered nav links */}
      <nav className="sidebar__nav">
        {visibleItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`
            }
          >
            <span className="sidebar__nav-icon">{icon}</span>
            <span className="sidebar__nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer: user info + logout */}
      <div className="sidebar__footer">
        {user !== null && (
          <div className="sidebar__user" title={user.email}>
            <div className="sidebar__user-avatar" aria-hidden="true">
              {user.avatarInitials}
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user.name}</span>
              {/* Role badge */}
              <span
                className="sidebar__user-role"
                style={{ color: ROLE_COLOR[user.role] }}
              >
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Logout button */}
        <button
          className="sidebar__logout"
          type="button"
          onClick={handleLogout}
          aria-label="Sign out"
          title="Sign out"
        >
          <span className="sidebar__logout-icon" aria-hidden="true">↩</span>
          <span className="sidebar__logout-label">Sign out</span>
        </button>

        {/* Dev-only: shows which pages loaded from MF remotes vs local fallback.
            RemoteIndicator exports () => null in production — zero overhead. */}
        <RemoteIndicator />
      </div>
    </aside>
  );
};

export default Sidebar;
