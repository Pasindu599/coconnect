import { defineConfig } from 'vitest/config';

// Separate from vitest.config.ts: these tests need the Firestore/Storage
// emulators running (see package.json's "test:rules" script), unlike the
// plain unit tests, which must never need a live service.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
