/**
 * Module Federation async boundary — defers bootstrap to allow
 * MF singleton negotiation before any real code runs.
 * See packages/dashboard/src/index.ts for the full explanation.
 */
import('./bootstrap');
