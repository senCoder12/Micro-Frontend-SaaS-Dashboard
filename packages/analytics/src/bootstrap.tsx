/**
 * Analytics Remote — Standalone bootstrap.
 *
 * Much simpler than the dashboard bootstrap: no Redux, no mock adapter.
 * The Analytics page is fully self-contained — it generates its own
 * session data and manages state locally with useState.
 *
 * When loaded as a remote inside the host, this file is never executed.
 * The host imports './Page' directly via Module Federation.
 */
import React         from 'react';
import { createRoot } from 'react-dom/client';
import App            from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('[Analytics] #root element not found');

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
