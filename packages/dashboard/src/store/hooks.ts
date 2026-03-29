/**
 * Typed Redux hooks for the Dashboard remote.
 *
 * These are typed against the Dashboard remote's own RootState —
 * which is { dashboard, websocket }. This is a SUBSET of the host's
 * RootState ({ user, dashboard, websocket }).
 *
 * Runtime behaviour:
 *   - Standalone: these hooks read from packages/dashboard's own store.
 *   - Integrated: react-redux is a singleton. The Provider comes from the
 *     host, which registers all three slices. state.dashboard and
 *     state.websocket exist in the host store, so all selectors work.
 *
 * TypeScript is satisfied because the remote's RootState is structurally
 * compatible with the relevant parts of the host's RootState.
 */
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
