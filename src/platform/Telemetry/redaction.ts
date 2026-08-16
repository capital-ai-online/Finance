const SECRET_KEY_PATTERN = /(authorization|cookie|password|passwd|secret|token|api[_-]?key|service[_-]?role|private[_-]?key|client[_-]?secret|stripe[_-]?secret|totp|recovery[_-]?code|backup[_-]?code)/i;
const PII_KEY_PATTERN = /(^|[_-])(email|phone|mobile|iban|bic|account|card|pan|cvv|address|first[_-]?name|last[_-]?name|full[_-]?name)($|[_-])/i;

const REDACTED = '[REDACTED]';

function redactString(value: string): string {
  if (/^Bearer\s+/i.test(value)) return REDACTED;
  if (/sk_(?:live|test)_/i.test(value)) return REDACTED;
  if (/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(value)) return REDACTED;
  return value;
}

/**
 * PII_KEY_PATTERN anchors on `[_-]`/string-boundary, so a prefixed camelCase key like
 * `customerEmail` or `creditCard` would otherwise slip past unredacted while `customer_email`/
 * `credit_card` would not (M9 Secret/Exfiltration drill finding, 2026-08-16). Inserting an
 * underscore at every lower-to-upper camelCase transition before matching makes both patterns
 * boundary-detection-consistent regardless of naming convention, without weakening any existing
 * match (snake_case/plain-lowercase keys are unaffected by the transform).
 */
function normalizeKeyForMatching(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
}

export function redactTelemetryValue(value: unknown, key = ''): unknown {
  const normalizedKey = normalizeKeyForMatching(key);
  if (SECRET_KEY_PATTERN.test(normalizedKey) || PII_KEY_PATTERN.test(normalizedKey)) return REDACTED;
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map((item) => redactTelemetryValue(item));
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      output[childKey] = redactTelemetryValue(childValue, childKey);
    }
    return output;
  }
  return value;
}

export function redactTelemetryAttributes(attributes?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!attributes) return undefined;
  return redactTelemetryValue(attributes) as Record<string, unknown>;
}
