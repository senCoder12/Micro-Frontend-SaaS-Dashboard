/**
 * Module Federation async boundary — identical to the host's index.ts.
 *
 * WHY this one-liner exists:
 *   Module Federation's shared dependency resolution is asynchronous.
 *   When Webpack sees `import('dashboardApp/Page')` in the host, MF needs
 *   to negotiate which version of React to use before any module executes.
 *   This negotiation happens during the async import of bootstrap.tsx.
 *
 *   If we bootstrapped synchronously (top-level import statements in this
 *   file), React would load before MF had a chance to resolve the singleton.
 *   Result: two React instances. The dynamic import defers all real code
 *   until after MF's version negotiation completes.
 *
 * This file is ONLY used for standalone development mode.
 * When the host loads this app as a remote, it doesn't execute this file —
 * it fetches remoteEntry.js and directly imports the exposed './Page' module.
 */
import('./bootstrap');
