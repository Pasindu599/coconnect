import { defineConfig } from 'vitest/config';

/**
 * `npm run test:db`: RLS, SQL-function and storage tests against a real
 * Supabase project (the URL/keys in .env.local). They create throwaway users
 * and rows and delete them afterwards. Never point this at production.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/db/**/*.test.ts'],
    setupFiles: ['tests/db/loadEnv.ts'],
    // One file at a time: the files share the project and some tests depend on platform_config.
    fileParallelism: false,
    testTimeout: 30_000,
    // cleanup deletes every test user one by one over the network
    hookTimeout: 300_000,
  },
});
