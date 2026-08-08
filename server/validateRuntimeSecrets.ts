// Deploy-Härtung: Beweist beim Serverstart, dass die sicherheitskritischsten Secrets
// tatsächlich vorhanden UND plausibel formatiert sind, statt das erst beim ersten
// Request zu bemerken, der sie braucht (z.B. ein Stripe-Webhook mit falschem Secret,
// der erst bei der ersten echten Zahlung auffällt). Folgt demselben fail-closed-Muster
// wie runIamSchemaHealthCheck() (src/platform/Security/authMiddleware.ts): in Produktion
// wird der Start abgebrochen, außerhalb nur gewarnt, damit lokale Entwicklung mit
// unvollständigem .env weiterhin möglich bleibt.

import { getCleanEnv } from './env';

interface SecretRule {
  key: string;
  /** Alternative Schlüssel - gültig, wenn key ODER einer der alternates gesetzt ist. */
  alternates?: string[];
  /** Gibt eine Fehlermeldung zurück, falls der Wert offensichtlich falsch/unfertig ist. */
  validate?: (value: string) => string | null;
}

const HEX_64 = /^[0-9a-fA-F]{64}$/;
const PLACEHOLDER_PATTERN = /\.\.\.$|your[-_ ]|change[-_]?me|placeholder|_here$/i;

function looksLikePlaceholder(value: string): string | null {
  return PLACEHOLDER_PATTERN.test(value) ? 'sieht nach unausgefülltem Platzhalterwert aus' : null;
}

// Bewusst nur die Secrets, deren Ausfall/Fehlkonfiguration einen Sicherheits- oder
// Geld-Impact hat (Auth, Verschlüsselung, Zahlungsabwicklung) - nicht jeder optionale
// Marktdaten-API-Key. Für die vollständige Abdeckung aller referenzierten ENV-Vars siehe
// scripts/automation/verifyDeploymentReadiness.ts (Build-Zeit-Gate).
const CRITICAL_SECRETS: SecretRule[] = [
  {
    key: 'SUPABASE_SECRET_KEY',
    alternates: ['SUPABASE_SERVICE_ROLE_KEY'],
    validate: looksLikePlaceholder,
  },
  {
    key: 'STRIPE_SECRET_KEY',
    validate: (v) => (v.startsWith('sk_') ? looksLikePlaceholder(v) : 'muss mit "sk_" beginnen'),
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    validate: (v) => (v.startsWith('whsec_') ? looksLikePlaceholder(v) : 'muss mit "whsec_" beginnen'),
  },
  {
    key: 'TOTP_ENCRYPTION_KEY',
    validate: (v) => (HEX_64.test(v) ? null : 'muss exakt 64 Hex-Zeichen (32 Byte) lang sein'),
  },
];

/**
 * Prüft die kritischsten Secrets auf Vorhandensein und Plausibilität. In Produktion
 * fail-closed (process.exit(1)) bei Problemen, außerhalb nur eine Warnung.
 */
export function validateRuntimeSecrets(isProduction: boolean): void {
  const problems: string[] = [];

  for (const rule of CRITICAL_SECRETS) {
    const value = getCleanEnv(rule.key) || rule.alternates?.map(getCleanEnv).find(Boolean) || '';
    if (!value) {
      const names = [rule.key, ...(rule.alternates || [])].join(' / ');
      problems.push(`${names}: fehlt`);
      continue;
    }
    const error = rule.validate?.(value);
    if (error) problems.push(`${rule.key}: ${error}`);
  }

  if (problems.length === 0) {
    console.log(`[SECRETS] ${CRITICAL_SECRETS.length} kritische Secrets vorhanden und plausibel formatiert.`);
    return;
  }

  const report = `[SECRETS] ${problems.length} Problem(e) gefunden:\n${problems.map((p) => `  - ${p}`).join('\n')}`;

  if (isProduction) {
    console.error(report);
    console.error('[SECRETS] Produktionsstart abgebrochen (fail-closed) - siehe render.yaml / Secret File.');
    process.exit(1);
  } else {
    console.warn(report);
    console.warn('[SECRETS] Nicht-Produktionsumgebung - Start wird trotzdem fortgesetzt.');
  }
}
