/**
 * Loads .env.local (then .env) into process.env for the Node-side scripts
 * and the database tests. Vite does this for the app; plain Node does not.
 * Values already in the environment (e.g. CI secrets) win.
 */
export function loadLocalEnv(): void {
  for (const file of ['.env.local', '.env']) {
    try {
      process.loadEnvFile(file);
    } catch {
      // file absent: fine
    }
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.startsWith('YOUR_') || value.includes('YOUR_PROJECT_REF')) {
    throw new Error(`${name} is not set. Add it to .env.local (see .env.example).`);
  }
  return value;
}
