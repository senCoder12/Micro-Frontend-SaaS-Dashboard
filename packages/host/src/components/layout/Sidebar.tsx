/**
 * Sidebar — Persistent navigation panel.
 * User identity section is now driven by Redux (selectUser).
 * Step 12 will add logout dispatch here.
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices';
import { DashboardIcon, AnalyticsIcon, WorkflowIcon } from './icons';
import RemoteIndicator from './RemoteIndicator';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon aria-hidden="true" /> },
  { to: '/analytics', label: 'Analytics', icon: <AnalyticsIcon aria-hidden="true" /> },
  { to: '/workflow',  label: 'Workflow',  icon: <WorkflowIcon  aria-hidden="true" /> },
];

const Sidebar: React.FC = () => {
  const user = useAppSelector(selectUser);

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar__logo">
        <span className="sidebar__logo-icon" aria-hidden="true">◈</span>
        <span className="sidebar__logo-text">SaaS Dashboard</span>
      </div>

      <div className="sidebar__section-label">Main Menu</div>

      {/* Nav links */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ to, label, icon }) => (
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

      {/* User section — driven by Redux store */}
      <div className="sidebar__footer">
        {user !== null && (
          <div className="sidebar__user" title={user.email}>
            <div className="sidebar__user-avatar" aria-hidden="true">
              {user.avatarInitials}
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user.name}</span>
              <span className="sidebar__user-role">{user.role}</span>
            </div>
          </div>
        )}
        {/* Dev-only: shows which pages loaded from MF remotes vs local fallback.
            RemoteIndicator exports () => null in production — zero overhead. */}
        <RemoteIndicator />
      </div>
    </aside>
  );
};

export default Sidebar;
