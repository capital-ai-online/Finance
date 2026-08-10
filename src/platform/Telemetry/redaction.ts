const SECRET_KEY_PATTERN = /(authorization|cookie|password|passwd|secret|token|api[_-]?key|service[_-]?role|private[_-]?key|client[_-]?secret|stripe[_-]?secret)/i;
const PII_KEY_PATTERN = /(^|[_-])(email|phone|mobile|iban|bic|account|card|pan|cvv|address|first[_-]?name|last[_-]?name|full[_-]?name)($|[_-])/i;

const REDACTED = '[REDACTED]';

function redactString(value: string): string {
  if (/^Bearer\s+/i.test(value)) return REDACTED;
  if (/sk_(?:live|test)_/i.test(value)) return REDACTED;
  if (/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(value)) return REDACTED;
  return value;
}

export function redactTelemetryValue(value: unknown, key = ''): unknown {
  if (SECRET_KEY_PATTERN.test(key) || PII_KEY_PATTERN.test(key)) return REDACTED;
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
