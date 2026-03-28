import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './store';
import './styles/global.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found. Check public/index.html.');
}

/**
 * Provider wraps the entire app so every component in the tree can
 * call useAppSelector / useAppDispatch without any additional setup.
 *
 * Order matters here:
 *   <Provider>       ← Redux store available to all children
 *     <App />        ← RouterProvider lives inside App
 *       <AppShell /> ← layout
 *         <Pages />  ← leaves that consume the store
 *
 * Step 12 will add an <AuthProvider> between Provider and App
 * to handle JWT refresh without affecting the Redux store structure.
 */
createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
