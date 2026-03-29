/**
 * Dashboard Remote — Standalone bootstrap.
 *
 * This file runs ONLY in standalone development mode (localhost:3001).
 * When the host loads this app as a remote, it imports './Page' directly
 * from the exposed module — this bootstrap.tsx is never executed.
 *
 * STANDALONE vs INTEGRATED:
 *
 *   Standalone (localhost:3001):
 *     - This bootstrap creates its OWN Redux store
 *     - Sets up the mock API adapter on its own axios instance
 *     - Dispatches fetchDashboardData() to populate the store
 *     - Renders <App /> wrapped in <Provider store={ownStore}>
 *
 *   Integrated (inside host at localhost:3000):
 *     - The HOST's bootstrap.tsx has already created the Redux store
 *     - The HOST's <Provider store={hostStore}> wraps everything including
 *       the remote's <Dashboard /> component
 *     - react-redux is shared as a singleton → same Context instance
 *     - useSelector/useDispatch in the remote reads from HOST's store
 *     - This file is NOT executed at all
 *
 * HOW THEY STAY IN SYNC:
 *   The Dashboard page component reads from state.dashboard and state.websocket.
 *   Both standalone mode (own store) and integrated mode (host's store)
 *   register these slices with the same key names. The component doesn't know
 *   or care which store it's reading from — it just calls useAppSelector.
 */
import React      from 'react';
import { createRoot } from 'react-dom/client';
import { Provider }   from 'react-redux';
import { store }      from './store';
import { fetchDashboardData } from './store/slices/dashboardSlice';
import App            from './App';

// Set up mock API in standalone dev mode
if (process.env.NODE_ENV !== 'production') {
  const { setupMockAdapter } = require('./services/mock/adapter') as
    { setupMockAdapter: (i: import('axios').AxiosInstance) => void };
  const { apiClient } = require('./services/api/client') as
    { apiClient: import('axios').AxiosInstance };
  setupMockAdapter(apiClient);
}

// Pre-fetch data before React paints (mirrors the host's bootstrap pattern)
store.dispatch(fetchDashboardData());

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('[Dashboard] #root element not found');

createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
