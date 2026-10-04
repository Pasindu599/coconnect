import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts', 'supabase/functions/**/*.test.ts'],
    // tests/db runs against a real Supabase project: `npm run test:db` (vitest.db.config.ts)
    exclude: ['tests/db/**', 'node_modules/**', 'dist/**'],
  },
});
