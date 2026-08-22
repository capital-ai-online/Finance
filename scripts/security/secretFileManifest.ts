// ADR-0037-Folge / Deploy-Härtung (siehe render.yaml `secretFiles`): einzige Quelle der
// Wahrheit dafür, welche ENV-Vars künftig über die Render Secret File statt über einzelne
// `envVars`-Einträge kommen. Referenziert von:
//   - server/env.ts (lädt die Secret File zur Laufzeit)
//   - server/validateRuntimeSecrets.ts (Boot-Validierung der kritischsten Werte)
//   - scripts/automation/verifyDeploymentReadiness.ts (Env-Var-Abdeckungs-Gate)
// Ein einzelner Ort verhindert, dass diese drei Stellen auseinanderlaufen, wenn ein Secret
// hinzukommt oder migriert wird.

export const SECRET_FILE_NAME = 'finance-secrets.env';
export const SECRET_FILE_MOUNT_PATH = `/etc/secrets/${SECRET_FILE_NAME}`;

// Nur echte Secrets (Server-Credentials, API-Keys, Signierschlüssel). OAuth-Client-IDs,
// Stripe-Price-IDs, Publishable/Anon-Keys und sonstige Konfigurationswerte sind absichtlich
// NICHT enthalten - sie sind ohnehin clientseitig sichtbar bzw. nicht vertraulich und bleiben
// als normale Render-`envVars` bestehen.
export const SECRET_FILE_KEYS = [
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'TOTP_ENCRYPTION_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'M10_GITHUB_TOKEN',
  'M10_GITHUB_DISPATCH_TOKEN',
  'ALPACA_API_KEY_ID',
  'ALPACA_API_SECRET_KEY',
  'ALPHA_VANTAGE_KEY',
  'COIN_API_KEY',
  'EODHD_API_KEY',
  'TWELVEDATA_API_KEY',
  'FRED_API_KEY',
  'FMP_API_KEY',
  // SC-4: Dune is the only new crypto-evidence provider secret. Runtime policy additionally
  // requires Free-Tier attestation + allowlisted saved query IDs; the key alone grants nothing.
  'DUNE_API_KEY',
  'SMTP_PASSWORD',
  'METRICS_TOKEN',
  'YOUTUBE_CLIENT_SECRET',
  'TIKTOK_CLIENT_SECRET',
  'INSTAGRAM_CLIENT_SECRET',
  'X_CLIENT_SECRET',
  'FACEBOOK_CLIENT_SECRET',
] as const;
