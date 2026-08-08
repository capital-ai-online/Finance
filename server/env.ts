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
//
// TEMP-DIAGNOSE (Incident 2026-08-08, TOTP_ENCRYPTION_KEY hängt bei falscher Länge fest
// über mehrere Secret-File-Bearbeitungen hinweg): loggt an drei Stellen die Länge/Herkunft
// von TOTP_ENCRYPTION_KEY, nie den Wert selbst, um zu klären ob (a) die Secret File am
// erwarteten Pfad überhaupt gefunden wird, (b) was ROH in der Datei steht, (c) ob eine
// bereits vom Container gesetzte process.env-Variable das Secret-File-Ergebnis überschattet.
// Wieder entfernen, sobald der Incident geklärt ist.
const preLoadValue = process.env.TOTP_ENCRYPTION_KEY;
console.log(
  `[SECRETS-DIAG] Vor Secret-File-Load: process.env.TOTP_ENCRYPTION_KEY ${preLoadValue ? `gesetzt (${preLoadValue.length} Zeichen, Quelle: Container/Render-ENV)` : 'nicht gesetzt'}.`
);

const secretFileExists = fs.existsSync(SECRET_FILE_MOUNT_PATH);
console.log(`[SECRETS-DIAG] Secret File Pfad ${SECRET_FILE_MOUNT_PATH}: ${secretFileExists ? 'gefunden' : 'NICHT gefunden'}.`);

if (secretFileExists) {
  try {
    const raw = fs.readFileSync(SECRET_FILE_MOUNT_PATH, 'utf8');
    const match = raw.match(/^TOTP_ENCRYPTION_KEY=(.*)$/m);
    console.log(
      `[SECRETS-DIAG] Rohinhalt der Secret File: TOTP_ENCRYPTION_KEY-Zeile ${match ? `gefunden, Rohwert-Länge ${match[1].length} Zeichen` : 'NICHT gefunden'}.`
    );
  } catch (err: any) {
    console.log(`[SECRETS-DIAG] Secret File konnte nicht gelesen werden: ${err?.message || err}`);
  }
  dotenv.config({ path: SECRET_FILE_MOUNT_PATH, quiet: true });
}
dotenv.config({ quiet: true });

const postLoadValue = process.env.TOTP_ENCRYPTION_KEY;
console.log(
  `[SECRETS-DIAG] Nach allen dotenv.config()-Aufrufen: process.env.TOTP_ENCRYPTION_KEY ${postLoadValue ? `${postLoadValue.length} Zeichen` : 'nicht gesetzt'} (${postLoadValue === preLoadValue ? 'unverändert seit vor dem Secret-File-Load' : 'durch Secret File verändert'}).`
);

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
