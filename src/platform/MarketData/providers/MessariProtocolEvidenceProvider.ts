import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const MESSARI_PROVIDER_ID = 'messari' as const;
export const MESSARI_BASE_URL = 'https://api.messari.io' as const;
export const MESSARI_PROTOCOL_EVIDENCE_CONTRACT_VERSION = 'messari-protocol-usage-evidence/1.0.0' as const;

export type MessariEvidenceStatus = 'VERIFIED' | 'NOT_CONFIGURED' | 'SOURCE_UNAVAILABLE' | 'INVALID';

export interface MessariProtocolUsageEvidence {
  readonly contractVersion: typeof MESSARI_PROTOCOL_EVIDENCE_CONTRACT_VERSION;
  readonly status: MessariEvidenceStatus;
  readonly protocolIdentifier: string;
  readonly observedAt: string | null;
  readonly retrievedAt: string;
  readonly evidenceRef: string | null;
  readonly activeAddresses24h: number | null;
  /** Diagnostic cross-check only. ADR-0100 DeFiLlama remains authoritative for current TVL evidence. */
  readonly tvl24hUsdDiagnostic: number | null;
  /** Diagnostic cross-check only. ADR-0100 DeFiLlama remains authoritative for current fee evidence. */
  readonly fees24hUsdDiagnostic: number | null;
  readonly reason?: string;
}

export interface MessariProtocolEvidenceProviderOptions {
  readonly apiKey?: string | null;
  readonly env?: NodeJS.ProcessEnv;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
  readonly baseUrl?: string;
}

function finite(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function invalid(
  status: MessariEvidenceStatus,
  protocolIdentifier: string,
  retrievedAt: string,
  reason: string,
): MessariProtocolUsageEvidence {
  return Object.freeze({
    contractVersion: MESSARI_PROTOCOL_EVIDENCE_CONTRACT_VERSION,
    status,
    protocolIdentifier,
    observedAt: null,
    retrievedAt,
    evidenceRef: null,
    activeAddresses24h: null,
    tvl24hUsdDiagnostic: null,
    fees24hUsdDiagnostic: null,
    reason,
  });
}

export class MessariProtocolEvidenceProvider {
  private readonly http: ResearchEvidenceProviderHttp;
  private readonly nowMs: () => number;

  constructor(options: MessariProtocolEvidenceProviderOptions = {}) {
    const env = options.env ?? process.env;
    this.nowMs = options.nowMs ?? Date.now;
    const transport: ResearchEvidenceProviderHttpOptions = {
      baseUrl: options.baseUrl ?? MESSARI_BASE_URL,
      apiKey: options.apiKey ?? env.MESSARI_API_KEY ?? null,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: this.nowMs,
      authHeaders: (apiKey) => ({ 'X-Messari-API-Key': apiKey }),
    };
    this.http = new ResearchEvidenceProviderHttp(MESSARI_PROVIDER_ID, 'onchain', transport);
  }

  /**
   * Reads the standardized Messari protocol core timeseries and promotes only active-address usage
   * into candidate evidence. TVL/fees are retained as diagnostics because ADR-0100 already assigns
   * those evidence fields to DeFiLlama; no silent provider replacement is allowed.
   */
  public async getProtocolUsage(protocolIdentifierInput: string): Promise<MessariProtocolUsageEvidence> {
    const protocolIdentifier = protocolIdentifierInput.toLowerCase().trim();
    if (!/^[a-z0-9-]{1,100}$/.test(protocolIdentifier)) {
      return invalid('INVALID', protocolIdentifier, new Date(this.nowMs()).toISOString(), 'Messari protocol identifier is invalid.');
    }

    const end = new Date(this.nowMs());
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60_000);
    const result = await this.http.requestJson(
      `/metrics/v2/protocols/${encodeURIComponent(protocolIdentifier)}/metrics/core/time-series/1d?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`,
    );
    if (result.status !== 'READY') {
      return invalid(
        result.status === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'SOURCE_UNAVAILABLE',
        protocolIdentifier,
        result.retrievedAt,
        result.reason ?? 'Messari source unavailable.',
      );
    }

    if (!result.data || typeof result.data !== 'object') {
      return invalid('INVALID', protocolIdentifier, result.retrievedAt, 'Messari response is not an object.');
    }
    const root = result.data as Record<string, unknown>;
    const data = root.data && typeof root.data === 'object' ? root.data as Record<string, unknown> : null;
    const metadata = root.metadata && typeof root.metadata === 'object' ? root.metadata as Record<string, unknown> : null;
    const points = data && Array.isArray(data.points) ? data.points : [];
    const schemas = metadata && Array.isArray(metadata.pointSchemas) ? metadata.pointSchemas : [];
    const latest = [...points].reverse().find((point): point is unknown[] => Array.isArray(point));
    if (!latest || schemas.length === 0) {
      return invalid('INVALID', protocolIdentifier, result.retrievedAt, 'Messari response has no point schema or timeseries point.');
    }

    const values = new Map<string, unknown>();
    schemas.forEach((schema, index) => {
      if (schema && typeof schema === 'object') {
        const slug = (schema as Record<string, unknown>).slug;
        if (typeof slug === 'string') values.set(slug, latest[index]);
      }
    });

    const observedSeconds = finite(values.get('time'));
    const observedAt = observedSeconds === null ? null : new Date(observedSeconds * 1000).toISOString();
    return Object.freeze({
      contractVersion: MESSARI_PROTOCOL_EVIDENCE_CONTRACT_VERSION,
      status: 'VERIFIED',
      protocolIdentifier,
      observedAt,
      retrievedAt: result.retrievedAt,
      evidenceRef: `messari:protocol-core:${protocolIdentifier}:${observedAt ?? result.retrievedAt}`,
      activeAddresses24h: finite(values.get('activeAddresses24Hour')),
      tvl24hUsdDiagnostic: finite(values.get('tvl24HourUsd')),
      fees24hUsdDiagnostic: finite(values.get('fees24HourUsd')),
    });
  }
}
