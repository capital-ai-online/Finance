import dotenv from 'dotenv';
import fs from 'fs';
import { SECRET_FILE_MOUNT_PATH } from '../scripts/security/secretFileManifest';

// Silence dotenv startup banners/tips process-wide before any later dotenv.config()
// call executes (server.application.ts currently contains a second, redundant
// initialization). Render injects production configuration through process.env;
// local .env loading remains available for development without third-party
// promotional log noise.
process.env.DOTENV_CONFIG_QUIET = process.env.DOTENV_CONFIG_QUIET || 'true';

// Deploy-Härtung: Render mountet eine konfigurierte Secret File read-only unter einem
// festen Pfad (siehe render.yaml `secretFiles` + scripts/security/secretFileManifest.ts).
// Lokal/CI existiert diese Datei nicht - dort liefert die normale .env unten dieselben
// Keys. dotenv.config() überschreibt NIE einen bereits gesetzten process.env-Wert, daher
// gewinnt eine während der Migration übergangsweise noch einzeln in Render gesetzte
// ENV-Var weiterhin gegenüber dem Wert aus der Secret File.
if (fs.existsSync(SECRET_FILE_MOUNT_PATH)) {
  dotenv.config({ path: SECRET_FILE_MOUNT_PATH, quiet: true });
}
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
