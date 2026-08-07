import dotenv from 'dotenv';

// Load local .env values without emitting dotenv startup banners/tips.
// Render injects production configuration through process.env, so this keeps
// production logs deterministic while preserving local development support.
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
