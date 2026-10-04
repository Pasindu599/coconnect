/**
 * `npm run db:push`: applies supabase/migrations/* to the project in
 * SUPABASE_DB_URL (.env.local), via the Supabase CLI. The CLI records what it
 * has applied, so re-running only applies new migrations. Pass extra CLI
 * flags after `--`, e.g. `npm run db:push -- --dry-run`.
 */
import { spawnSync } from 'node:child_process';
import { loadLocalEnv, requireEnv } from './lib/env';

loadLocalEnv();
const dbUrl = requireEnv('SUPABASE_DB_URL');

const result = spawnSync('npx', ['supabase', 'db', 'push', '--db-url', dbUrl, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
