const PROVIDER_QUERY_CREDENTIAL = /([?&](?:api[_-]?key|api[_-]?token|apikey|access[_-]?token|token)=)([^&#\s]*)/gi;
const PROVIDER_INLINE_CREDENTIAL = /((?:api[_-]?key|api[_-]?token|apikey|access[_-]?token)\s*[=:]\s*)([^\s&#]+)/gi;

/**
 * DATA-local safety boundary for provider diagnostics. Provider request URLs may contain
 * credentials in query parameters; those values must never survive into evidence, health,
 * telemetry or API diagnostics. This helper intentionally does not mutate request construction.
 */
export function redactProviderCredentialText(value: string): string {
  return value
    .replace(PROVIDER_QUERY_CREDENTIAL, '$1[REDACTED]')
    .replace(PROVIDER_INLINE_CREDENTIAL, '$1[REDACTED]');
}

export function providerErrorMessage(error: unknown): string {
  return redactProviderCredentialText(error instanceof Error ? error.message : String(error));
}
