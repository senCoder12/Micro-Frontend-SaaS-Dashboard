/**
 * Public API for the layout module.
 * Consumers import from '@/components/layout', not from individual files.
 * This lets us reorganize internals without changing import paths.
 */
export { default as AppShell } from './AppShell';
export { default as Sidebar } from './Sidebar';
export { default as Header } from './Header';
