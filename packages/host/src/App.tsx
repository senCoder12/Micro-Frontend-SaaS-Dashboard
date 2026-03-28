import React from 'react';

/**
 * App is currently a skeleton — routing (Step 2) and state (Step 3) come next.
 * Keeping it thin here so each step's responsibility is clear.
 */
const App: React.FC = () => {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__logo">
          <span className="app-header__logo-icon">◈</span>
          <span className="app-header__logo-text">SaaS Dashboard</span>
        </div>
        <nav className="app-header__nav">
          <span className="app-header__nav-item">Dashboard</span>
          <span className="app-header__nav-item">Analytics</span>
          <span className="app-header__nav-item">Workflow</span>
        </nav>
      </header>

      <main className="app-main">
        <div className="placeholder-card">
          <h1>Phase 1 — Step 1 Complete</h1>
          <p>React + TypeScript + Webpack is running.</p>
          <p>Next: Add routing in Step 2.</p>
          <div className="placeholder-card__badges">
            <span className="badge badge--green">React 18</span>
            <span className="badge badge--blue">TypeScript 5</span>
            <span className="badge badge--purple">Webpack 5</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
