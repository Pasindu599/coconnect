import { store } from '../lib/store';

/**
 * The store is a singleton, so one test's changes leak into the next. Call this in a
 * `beforeEach` and run the returned function in `afterEach` to put the state back as it was.
 */
export const snapshotStore = (): (() => void) => {
  const state = store.getState() as unknown as Record<string, unknown>;
  const saved = structuredClone(state);
  return () => {
    for (const key of Object.keys(state)) state[key] = structuredClone(saved[key]);
  };
};
