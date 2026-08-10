import dotenv from 'dotenv';
import fs from 'fs';
import { SECRET_FILE_KEYS, SECRET_FILE_MOUNT_PATH } from '../scripts/security/secretFileManifest';

// Silence dotenv startup banners/tips process-wide before any later dotenv.config()
// call executes (server.application.ts currently contains a second, redundant
// initialization). Render injects production configuration through process.env;
// local .env loading remains available for development without third-party
// promotional log noise.
process.env.DOTENV_CONFIG_QUIET = process.env.DOTENV_CONFIG_QUIET || 'true';

const secretFileKeySet = new Set<string>(SECRET_FILE_KEYS as readonly string[]);
let secretFileValues: Record<string, string> = {};

// Deploy-Härtung: Render mountet eine konfigurierte Secret File read-only unter einem
// festen Pfad. Für Keys aus SECRET_FILE_KEYS ist diese Datei in Production die kanonische
// Secret-Authority. Das verhindert, dass ein alter gleichnamiger Render-envVar-Wert einen
// frisch rotierten Secret-File-Wert still überschreibt. process.env bleibt nur Fallback,
// wenn die Secret-Datei nicht existiert oder den konkreten Key nicht enthält (lokal/CI).
if (fs.existsSync(SECRET_FILE_MOUNT_PATH)) {
  const rawSecretFile = fs.readFileSync(SECRET_FILE_MOUNT_PATH, 'utf8');
  secretFileValues = dotenv.parse(rawSecretFile);
  dotenv.config({ path: SECRET_FILE_MOUNT_PATH, quiet: true });
}
dotenv.config({ quiet: true });

function cleanValue(val: string | undefined): string {
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

/**
 * Helper to normalize, clean and safely resolve environment variables.
 *
 * Secret precedence:
 *   1. /etc/secrets/finance-secrets.env for canonical SECRET_FILE_KEYS
 *   2. process.env fallback (local/CI or migration fallback)
 *
 * Non-secret/public configuration keeps the normal process.env/VITE_ resolution.
 */
export function getCleanEnv(key: string): string {
  if (secretFileKeySet.has(key)) {
    const secretFileValue = cleanValue(secretFileValues[key]);
    if (secretFileValue) return secretFileValue;
  }

  let val = process.env[key];
  if (!val && key.startsWith('VITE_')) {
    val = process.env[key.substring(5)];
  } else if (!val && !key.startsWith('VITE_')) {
    val = process.env[`VITE_${key}`];
  }
  return cleanValue(val);
}
