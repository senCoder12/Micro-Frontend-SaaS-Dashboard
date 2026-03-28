import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes';

/**
 * App.tsx is intentionally thin — it just mounts the router.
 * All route structure lives in src/routes/index.tsx.
 * All layout lives in src/components/layout/AppShell.tsx.
 *
 * Step 3 will wrap RouterProvider with the Redux <Provider> here.
 */
const App: React.FC = () => <RouterProvider router={router} />;

export default App;
