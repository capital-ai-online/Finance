// Canonical inventory of server-only secret environment variables.
// Values are provisioned in Render's Environment settings and are never committed to the repo.
// Referenced by:
//   - server/env.ts (blocks VITE_* alias resolution for privileged values)
//   - server/validateRuntimeSecrets.ts (boot validation for critical secrets)
//   - deployment/security tests and readiness gates.
//
// The historical filename is retained temporarily to avoid breaking historical evidence links;
// there is no runtime Secret File contract anymore.

export const SERVER_SECRET_ENV_KEYS = [
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'TOTP_ENCRYPTION_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'ALPACA_API_KEY_ID',
  'ALPACA_API_SECRET_KEY',
  'ALPHA_VANTAGE_API_KEY',
  'COIN_API_KEY',
  'EODHD_API_KEY',
  'TWELVEDATA_API_KEY',
  'FRED_API_KEY',
  'FMP_API_KEY',
  // OPS-POST851-EDGE-01: shared proof for the Cloudflare -> Render provenance boundary.
  // It is server-only and belongs to the canonical server-only Render environment; never expose it via VITE_*.
  'CAPITAL_AI_EDGE_TRUST_SECRET',
  // SC-4: Dune is the only previously landed crypto-evidence provider secret. Runtime policy
  // additionally requires Free-Tier attestation + allowlisted saved query IDs; the key alone grants nothing.
  'DUNE_API_KEY',
  // P1-A: authenticated GoPlus transaction simulation requires a Bearer access token. The
  // historical variable name is retained for compatibility, but the stored value MUST be the
  // GoPlus access token used in Authorization: Bearer ..., never a raw app_secret and never VITE_*.
  // Token Security remains keyless-capable; absence keeps P1-A simulation NOT_CONFIGURED.
  'GOPLUS_API_KEY',
  'SMTP_PASSWORD',
  'METRICS_TOKEN',
  'YOUTUBE_CLIENT_SECRET',
  'TIKTOK_CLIENT_SECRET',
  'INSTAGRAM_CLIENT_SECRET',
  'X_CLIENT_SECRET',
  'FACEBOOK_CLIENT_SECRET',
] as const;
