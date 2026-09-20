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
    // Lokale/dev Kompatibilität darf vorübergehend noch service_role verwenden. Produktion
    // verlangt weiter unten jedoch explizit den unabhängig rotierbaren SUPABASE_SECRET_KEY.
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
    // Zeichenzahl und Anzahl ungültiger Zeichen mit ausgeben (nie den Wert selbst) -
    // deutlich schneller zu debuggen als "falsche Länge" ohne jeden Anhaltspunkt,
    // ohne das Secret dabei preiszugeben.
    validate: (v) => {
      if (HEX_64.test(v)) return null;
      const invalidCount = (v.match(/[^0-9a-fA-F]/g) || []).length;
      const detail = invalidCount > 0
        ? `${invalidCount} ungültige(s) Zeichen enthalten (nur 0-9/a-f/A-F erlaubt)`
        : 'nur gültige Hex-Zeichen, aber falsche Länge';
      return `muss exakt 64 Hex-Zeichen (32 Byte) lang sein - aktuell ${v.length} Zeichen, ${detail}`;
    },
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

  // Security hardening 2026-08-29: production may no longer rely on the legacy JWT-shaped
  // service_role key. Keeping the fallback outside production avoids an abrupt local-dev break,
  // while every production boot proves the modern independently rotatable secret-key contract.
  if (isProduction && !getCleanEnv('SUPABASE_SECRET_KEY')) {
    problems.push(
      'SUPABASE_SECRET_KEY: in Produktion zwingend erforderlich; '
      + 'SUPABASE_SERVICE_ROLE_KEY ist nur noch ein Nicht-Produktions-Kompatibilitätspfad.'
    );
  }

  if (problems.length === 0) {
    console.log(`[SECRETS] ${CRITICAL_SECRETS.length} kritische Secrets vorhanden und plausibel formatiert.`);
    return;
  }

  const report = `[SECRETS] ${problems.length} Problem(e) gefunden:\n${problems.map((p) => `  - ${p}`).join('\n')}`;

  if (isProduction) {
    console.error(report);
    console.error('[SECRETS] Produktionsstart abgebrochen (fail-closed) - siehe Render Environment / render.yaml.');
    process.exit(1);
  } else {
    console.warn(report);
    console.warn('[SECRETS] Nicht-Produktionsumgebung - Start wird trotzdem fortgesetzt.');
  }
}
