export type ProviderHealthState = 'healthy' | 'degraded' | 'unavailable';
export type ProviderDiagnosticCode =
  | 'healthy'
  | 'rate_limited'
  | 'auth_error'
  | 'schema_error'
  | 'transport_error'
  | 'not_configured'
  | 'provider_error'
  | 'stale';

export interface ProviderHealthRecord {
  provider: string;
  capability: string;
  state: ProviderHealthState;
  diagnosticCode?: ProviderDiagnosticCode;
  payloadUsable?: boolean;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastObservedAt: string;
  consecutiveFailures: number;
  cacheMode?: string;
  circuitOpenUntil?: string;
  message?: string;
}

const records = new Map<string, ProviderHealthRecord>();

function key(provider: string, capability: string): string {
  return `${provider}:${capability}`;
}

export function recordProviderHealth(input: {
  provider: string;
  capability: string;
  state: ProviderHealthState;
  at?: string;
  diagnosticCode?: ProviderDiagnosticCode;
  payloadUsable?: boolean;
  cacheMode?: string;
  circuitOpenUntil?: string;
  message?: string;
}): ProviderHealthRecord {
  const at = input.at ?? new Date().toISOString();
  const id = key(input.provider, input.capability);
  const previous = records.get(id);
  const success = input.state === 'healthy';
  const next: ProviderHealthRecord = {
    provider: input.provider,
    capability: input.capability,
    state: input.state,
    diagnosticCode: input.diagnosticCode,
    payloadUsable: input.payloadUsable,
    lastSuccessAt: success ? at : previous?.lastSuccessAt,
    lastFailureAt: success ? previous?.lastFailureAt : at,
    lastObservedAt: at,
    consecutiveFailures: success ? 0 : (previous?.consecutiveFailures ?? 0) + 1,
    cacheMode: input.cacheMode,
    circuitOpenUntil: input.circuitOpenUntil,
    message: input.message,
  };
  records.set(id, next);
  return { ...next };
}

export function getProviderHealth(): ProviderHealthRecord[] {
  return Array.from(records.values()).map((item) => ({ ...item }));
}

export function resetProviderHealth(): void {
  records.clear();
}
