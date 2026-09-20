import dotenv from 'dotenv';
import { SERVER_SECRET_ENV_KEYS } from '../scripts/security/secretFileManifest';

process.env.DOTENV_CONFIG_QUIET = process.env.DOTENV_CONFIG_QUIET || 'true';
dotenv.config({ quiet: true });

const serverSecretKeySet = new Set<string>(SERVER_SECRET_ENV_KEYS as readonly string[]);

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
    environment?: NodeJS.ProcessEnv;
  } = {},
): string {
  const environment = options.environment ?? process.env;
  const isViteKey = key.startsWith('VITE_');
  const canonicalKey = isViteKey ? key.substring(5) : key;
  const isServerOnlySecret = serverSecretKeySet.has(canonicalKey);

  // Server-only secrets are sourced exclusively from the exact same-named server environment
  // variable. They never resolve through VITE_* aliases in either direction, which keeps
  // privileged credentials out of client-facing configuration while using Render env vars as
  // the single production runtime source.
  if (isServerOnlySecret) {
    if (isViteKey) return '';
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
 * Resolve runtime configuration from environment variables.
 * Server-only secrets never use VITE_* compatibility aliases.
 */
export function getCleanEnv(key: string): string {
  return resolveEnvironmentValue(key);
}
