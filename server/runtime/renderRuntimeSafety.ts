// ADR-0037 — pure runtime safety helpers for the Render production contract.
//
// Keep these helpers side-effect free so PORT validation, score fallback semantics and
// configuration diagnostics can be unit-tested without starting Express or reading secrets.

export type RuntimeEnvReader = (key: string) => string | undefined;

export function resolveRuntimePort(rawPort: string | undefined, fallback = 3000): number {
  const normalized = String(rawPort || '').trim();
  if (!normalized) return fallback;

  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  return parsed;
}

export function hasFiniteScoreValues(scores: Record<string, unknown> | null | undefined): boolean {
  if (!scores) return false;
  return Object.values(scores).some((value) => typeof value === 'number' && Number.isFinite(value));
}

/**
 * Availability fallback for the market-data batch only.
 *
 * The deterministic scoring engine itself remains fail-closed when verified scoring features
 * are unavailable. If the live market-data aggregation already carries a finite provider/base
 * score, the caller may retain that score only as an explicitly labelled `heuristic` result.
 * No synthetic number is created here.
 */
export function resolveHeuristicCryptoScore(baseScore: number | undefined): number | null {
  if (typeof baseScore !== 'number' || !Number.isFinite(baseScore)) return null;
  return Math.min(10, Math.max(1, Number(baseScore.toFixed(1))));
}

export interface StripeConfigurationStatus {
  secretKeyConfigured: boolean;
  publishableKeyConfigured: boolean;
  webhookSecretConfigured: boolean;
  starterMonthlyConfigured: boolean;
  starterYearlyConfigured: boolean;
  proMonthlyConfigured: boolean;
  proYearlyConfigured: boolean;
  enterpriseConfigured: boolean;
  founderConfigured: boolean;
  pdfExportConfigured: boolean;
}

/**
 * Returns booleans only. Secret/key values, lengths, prefixes and partial identifiers must
 * never be emitted by production diagnostics.
 */
export function getStripeConfigurationStatus(readEnv: RuntimeEnvReader): StripeConfigurationStatus {
  const configured = (key: string) => Boolean(String(readEnv(key) || '').trim());

  return {
    secretKeyConfigured: configured('STRIPE_SECRET_KEY'),
    publishableKeyConfigured: configured('STRIPE_PUBLISHABLE_KEY') || configured('VITE_STRIPE_PUBLISHABLE_KEY'),
    webhookSecretConfigured: configured('STRIPE_WEBHOOK_SECRET'),
    starterMonthlyConfigured: configured('STRIPE_PRICE_ID_STARTER_MONTHLY') || configured('STRIPE_PRICE_ID_STARTER'),
    starterYearlyConfigured: configured('STRIPE_PRICE_ID_STARTER_YEARLY'),
    proMonthlyConfigured: configured('STRIPE_PRICE_ID_PRO_MONTHLY') || configured('STRIPE_PRICE_ID_PRO'),
    proYearlyConfigured: configured('STRIPE_PRICE_ID_PRO_YEARLY'),
    enterpriseConfigured: configured('STRIPE_PRICE_ID_ENTERPRISE'),
    founderConfigured: configured('STRIPE_ID_FOUNDER') || configured('STRIPE_PRICE_ID_FOUNDER'),
    pdfExportConfigured: configured('STRIPE_PRICE_ID_EXPORT_PDF'),
  };
}
