/**
 * Analytics App — Standalone shell for local development.
 * See packages/dashboard/src/App.tsx for the rationale.
 */
import React from 'react';
import AnalyticsPage from './pages/Analytics';

const App: React.FC = () => (
  <div style={{
    minHeight:  '100vh',
    background: 'var(--color-bg, #0f1117)',
    color:      'var(--color-text, #e2e8f0)',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
  }}>
    <div style={{
      padding:       '8px 24px',
      background:    '#1a1d27',
      borderBottom:  '1px solid #2d3348',
      fontSize:      '12px',
      color:         '#6366f1',
      fontWeight:    600,
      letterSpacing: '0.05em',
      display:       'flex',
      alignItems:    'center',
      gap:           '8px',
    }}>
      <span style={{
        background:   'rgba(99,102,241,0.15)',
        border:       '1px solid rgba(99,102,241,0.3)',
        borderRadius: '4px',
        padding:      '2px 8px',
      }}>
        REMOTE: analyticsApp
      </span>
      <span style={{ color: '#475569', fontWeight: 400 }}>
        Standalone mode — port 3002
      </span>
    </div>

    <div style={{ padding: '0 24px', maxWidth: '1400px', margin: '0 auto' }}>
      <AnalyticsPage />
    </div>
  </div>
);

export default App;
