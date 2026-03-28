/**
 * Typed Redux hooks — use these everywhere instead of raw useSelector/useDispatch.
 *
 * WHY typed hooks (not raw hooks):
 *
 *   // ❌ Raw — no type safety
 *   const dispatch = useDispatch();
 *   const user = useSelector((state) => state.user.profile); // state is unknown
 *
 *   // ✅ Typed — full autocomplete + error checking
 *   const dispatch = useAppDispatch();
 *   const user = useAppSelector(selectUser); // correctly typed as UserProfile | null
 *
 * The `.withTypes<T>()` pattern (React Redux 9+) binds the generic once here
 * so every call site gets types for free — no manual type annotations needed.
 *
 * These hooks are the ONLY way components should interact with Redux.
 * Direct store imports (store.getState(), store.dispatch()) are reserved
 * for the WebSocket handler in Step 7 which lives outside the React tree.
 */
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
