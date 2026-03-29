import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router }         from '@/routes';
import { useWebSocket }   from '@/hooks/useWebSocket';

/**
 * App.tsx — Intentionally thin.
 *
 * The only addition beyond a bare RouterProvider is useWebSocket().
 * It lives here because:
 *   - It must be inside <Provider> (needs dispatch) — Provider is in bootstrap.tsx
 *   - It must be above AppShell and all pages — so it connects before any page renders
 *   - App is the highest React component that satisfies both constraints
 *
 * The hook establishes the WebSocket connection on mount and tears it
 * down on unmount. All pages benefit from the live stream without any
 * of them knowing a WebSocket exists.
 */
const App: React.FC = () => {
  useWebSocket();
  return <RouterProvider router={router} />;
};

export default App;
