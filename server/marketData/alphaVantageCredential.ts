export const ALPHA_VANTAGE_CREDENTIAL = 'ALPHA_VANTAGE_API_KEY' as const;

/**
 * Canonical DATA-owned Alpha Vantage credential boundary.
 *
 * The historical ALPHA_VANTAGE_KEY name is deliberately non-authorizing and is never
 * read here. Missing/blank canonical configuration must remain unavailable rather than
 * falling back to a legacy alias, frontend-exposed configuration, demo data or synthetic evidence.
 */
export function resolveAlphaVantageCredential(
  environment: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const value = environment[ALPHA_VANTAGE_CREDENTIAL]?.trim();
  return value || undefined;
}
