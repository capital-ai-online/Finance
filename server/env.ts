import dotenv from 'dotenv';
import fs from 'fs';
import { SECRET_FILE_KEYS, SECRET_FILE_MOUNT_PATH } from '../scripts/security/secretFileManifest';

process.env.DOTENV_CONFIG_QUIET = process.env.DOTENV_CONFIG_QUIET || 'true';

const secretFileKeySet = new Set<string>(SECRET_FILE_KEYS as readonly string[]);
let secretFileValues: Record<string, string> = {};

// Render mounts the canonical secret file read-only at this path. For keys declared in
// SECRET_FILE_KEYS, file content is authoritative over a same-named service-level env var.
// This prevents stale dashboard/env-group values from shadowing a rotated secret file.
if (fs.existsSync(SECRET_FILE_MOUNT_PATH)) {
  const rawSecretFile = fs.readFileSync(SECRET_FILE_MOUNT_PATH, 'utf8');
  secretFileValues = dotenv.parse(rawSecretFile);
  dotenv.config({ path: SECRET_FILE_MOUNT_PATH, quiet: true });
}
dotenv.config({ quiet: true });

function cleanValue(val: string | undefined): string {
  if (!val) return '';
  let cleaned = val.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) cleaned = cleaned.slice(1, -1);
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) cleaned = cleaned.slice(1, -1);
  return cleaned.trim();
}

export function resolveEnvironmentValue(
  key: string,
  options: {
    secretValues?: Record<string, string>;
    environment?: NodeJS.ProcessEnv;
  } = {},
): string {
  const secrets = options.secretValues ?? secretFileValues;
  const environment = options.environment ?? process.env;
  const isViteKey = key.startsWith('VITE_');
  const canonicalKey = isViteKey ? key.substring(5) : key;
  const isServerOnlySecret = secretFileKeySet.has(canonicalKey);

  // Secrets in SECRET_FILE_KEYS are server-only by contract. They may be supplied by the
  // canonical Render secret file or by the exact same-named server environment variable, but
  // never through a VITE_* alias. Likewise, asking for VITE_<server-secret> must not fall back to
  // the unprefixed server value. This keeps privileged credentials out of client-facing alias
  // resolution and makes production boot validation genuinely fail closed.
  if (isServerOnlySecret) {
    if (isViteKey) return '';

    const canonicalSecret = cleanValue(secrets[key]);
    if (canonicalSecret) return canonicalSecret;

    return cleanValue(environment[key]);
  }

  let val = environment[key];
  if (!val && isViteKey) {
    val = environment[canonicalKey];
  } else if (!val) {
    val = environment[`VITE_${key}`];
  }
  return cleanValue(val);
}

/**
 * Resolve runtime configuration with explicit secret-file precedence for canonical secrets.
 * Server-only secrets never use VITE_* compatibility aliases.
 */
export function getCleanEnv(key: string): string {
  return resolveEnvironmentValue(key);
}
