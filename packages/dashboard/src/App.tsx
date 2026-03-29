/**
 * Dashboard App — Standalone shell for local development.
 *
 * This is NOT the shell that users see. It exists purely so developers
 * on the Dashboard team can run `npm run dev` in packages/dashboard
 * and see their page rendered in a browser without needing the host shell.
 *
 * A minimal navigation strip at the top makes it clear this is standalone.
 * The padding + max-width mimics the host's page-content area so layout
 * issues show up locally before integration.
 */
import React from 'react';
import DashboardPage from './pages/Dashboard';

const App: React.FC = () => (
  <div style={{
    minHeight:  '100vh',
    background: 'var(--color-bg, #0f1117)',
    color:      'var(--color-text, #e2e8f0)',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
  }}>
    {/* Standalone dev indicator — not shown when loaded as remote */}
    <div style={{
      padding:         '8px 24px',
      background:      '#1a1d27',
      borderBottom:    '1px solid #2d3348',
      fontSize:        '12px',
      color:           '#6366f1',
      fontWeight:      600,
      letterSpacing:   '0.05em',
      display:         'flex',
      alignItems:      'center',
      gap:             '8px',
    }}>
      <span style={{
        background:    'rgba(99,102,241,0.15)',
        border:        '1px solid rgba(99,102,241,0.3)',
        borderRadius:  '4px',
        padding:       '2px 8px',
      }}>
        REMOTE: dashboardApp
      </span>
      <span style={{ color: '#475569', fontWeight: 400 }}>
        Standalone mode — port 3001
      </span>
    </div>

    {/* The actual page, padded to simulate the host's main content area */}
    <div style={{ padding: '0 24px', maxWidth: '1400px', margin: '0 auto' }}>
      <DashboardPage />
    </div>
  </div>
);

export default App;
