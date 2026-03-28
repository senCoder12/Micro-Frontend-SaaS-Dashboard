/**
 * AppShell — The persistent layout container.
 *
 * Renders: Header (top) + Sidebar (left) + <Outlet /> (page content).
 *
 * WHY <Outlet />:
 *   React Router injects the matched child route's element here.
 *   The AppShell itself never re-mounts during navigation —
 *   only the Outlet content swaps. This means the sidebar stays
 *   mounted, scroll position is preserved, and no layout flicker.
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const AppShell: React.FC = () => {
  return (
    <div className="app-shell">
      <Header />

      <div className="layout-body">
        <Sidebar />

        <main className="page-content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
