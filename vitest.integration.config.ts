import { defineConfig } from 'vitest/config';

// Exercises src/lib/data/* and store.ts's startSync() against the real
// Auth + Firestore emulators (not the rules-unit-testing harness used by
// tests/rules/), so src/lib/firebase.ts must actually connect to them —
// hence VITE_USE_EMULATORS here rather than in .env.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    env: {
      VITE_USE_EMULATORS: 'true',
    },
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
