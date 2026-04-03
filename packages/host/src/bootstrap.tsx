import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './store';
import { fetchDashboardData } from './store/slices/dashboardSlice';
import { apiClient } from './services';
import './styles/global.css';

// ── Mock API setup ─────────────────────────────────────────────────────────
/**
 * The mock adapter intercepts Axios calls in development.
 * In production (NODE_ENV === 'production'), Webpack's dead-code
 * elimination removes this entire block — the mock adapter is
 * never bundled into the production build.
 *
 * To test against a real backend in development:
 *   Comment out the setupMockAdapter() call below.
 *   Set baseURL in services/api/client.ts to your real server.
 */
if (process.env.NODE_ENV !== 'production') {
  // Dynamic require keeps the mock adapter out of the production bundle.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { setupMockAdapter } = require('./services/mock/adapter') as typeof import('./services/mock/adapter');
  setupMockAdapter(apiClient);
}

// ── Root mount ─────────────────────────────────────────────────────────────

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found. Check public/index.html.');
}

/**
 * Pre-fetch on app boot — before React renders.
 * By dispatching here (synchronously), the thunks start their 700ms mock
 * delay before the first render. The Dashboard page mounts into a
 * 'loading' state rather than 'idle', showing the loading indicator
 * immediately without an extra render cycle.
 *
 * Step 12: fetchCurrentUser is no longer dispatched here.
 * Session restoration happens synchronously in userSlice's initialState
 * (reads sessionStorage at module load time). No async check needed.
 *
 * fetchDashboardData is prefetched here so the Dashboard page loads into
 * a 'loading' state rather than 'idle' (avoids an extra render cycle).
 * In a real app, this would be dispatched inside the Dashboard component
 * on mount, or conditionally after confirming the user is authenticated.
 */
store.dispatch(fetchDashboardData());

createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
