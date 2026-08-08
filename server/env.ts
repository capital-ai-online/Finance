import dotenv from 'dotenv';

// Silence dotenv startup banners/tips process-wide before any later dotenv.config()
// call executes (server.ts currently contains a second, redundant initialization).
// Render injects production configuration through process.env; local .env loading
// remains available for development without third-party promotional log noise.
process.env.DOTENV_CONFIG_QUIET = process.env.DOTENV_CONFIG_QUIET || 'true';
dotenv.config({ quiet: true });

/**
 * Helper to normalize, clean and safely resolve environment variables
 * (stripping quotes, whitespaces, and resolving VITE_ prefix mismatch)
 */
export function getCleanEnv(key: string): string {
  let val = process.env[key];
  if (!val && key.startsWith('VITE_')) {
    val = process.env[key.substring(5)];
  } else if (!val && !key.startsWith('VITE_')) {
    val = process.env[`VITE_${key}`];
  }
  if (!val) return '';
  let cleaned = val.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.trim();
}
