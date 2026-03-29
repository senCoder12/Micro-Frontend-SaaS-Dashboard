/**
 * Module Federation remote declarations.
 *
 * WHY this file is needed:
 *   When the host does `import('dashboardApp/Page')`, TypeScript looks
 *   for a type declaration for the module 'dashboardApp/Page'. Without
 *   this file, it gives TS2307: "Cannot find module 'dashboardApp/Page'".
 *
 *   These declarations tell TypeScript the shape of what each remote
 *   exports. At runtime, Webpack's MF runtime resolves the actual module.
 *   The declaration is a compile-time type contract only.
 *
 * WHY `React.ComponentType` (not `React.FC`):
 *   ComponentType accepts both class and function components.
 *   The remote could theoretically export either — this is more permissive.
 *   The host doesn't care about the internal implementation.
 *
 * In larger teams these declarations live in @mf-dashboard/types and
 * are published by each remote team, versioned with their component.
 */

declare module 'dashboardApp/Page' {
  import type React from 'react';
  const Page: React.ComponentType;
  export default Page;
}

declare module 'analyticsApp/Page' {
  import type React from 'react';
  const Page: React.ComponentType;
  export default Page;
}
