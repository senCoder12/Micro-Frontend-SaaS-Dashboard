/**
 * Module Federation Async Boundary
 *
 * WHY THIS EXISTS:
 * Webpack Module Federation needs to negotiate shared dependencies (React, etc.)
 * with remote apps BEFORE executing any application code. If we put `import React`
 * directly here, Webpack executes it synchronously — before negotiation completes.
 *
 * The dynamic import below creates an async chunk boundary. Webpack will:
 *   1. Load this tiny file first
 *   2. Negotiate shared deps with remotes
 *   3. Then execute bootstrap.tsx with all deps resolved
 *
 * Without this pattern you get: "Shared module is not available for eager consumption"
 */
import('./bootstrap');
