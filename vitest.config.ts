import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts', 'supabase/functions/**/*.test.ts'],
    // tests/db runs against a real Supabase project: `npm run test:db` (vitest.db.config.ts)
    exclude: ['tests/db/**', 'node_modules/**', 'dist/**'],
    // Always the in-browser demo, even when .env.local turns real auth on: unit tests
    // exercise the demo store and must never talk to a real project. Tests that need
    // real-auth mode opt in with vi.stubEnv (see store.backend-mode.test.ts).
    env: { VITE_AUTH_MODE: 'demo', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
  },
});
