import { CircuitBreaker } from '../CircuitBreaker';
import { RateLimitBudget } from '../RateLimitBudget';
import { getProviderMatrixEntry } from '../ProviderMatrix';
import { recordProviderHealth, type ProviderDiagnosticCode } from '../../Supervisor/providerHealth';

export const RESEARCH_EVIDENCE_HTTP_VERSION = 'research-evidence-http/1.1.0' as const;

export type ResearchEvidenceHttpStatus =
  | 'READY'
  | 'NOT_CONFIGURED'
  | 'RATE_LIMITED'
  | 'CIRCUIT_OPEN'
  | 'SOURCE_UNAVAILABLE'
  | 'PROVIDER_ERROR'
  | 'INVALID';

export interface ResearchEvidenceHttpResult {
  readonly transportVersion: typeof RESEARCH_EVIDENCE_HTTP_VERSION;
  readonly providerId: string;
  readonly status: ResearchEvidenceHttpStatus;
  readonly retrievedAt: string;
  readonly data: unknown | null;
  readonly reason?: string;
  readonly httpStatus?: number;
}

export interface ResearchEvidenceProviderHttpOptions {
  readonly baseUrl: string;
  readonly apiKey?: string | null;
  /** Defaults to true. Set false only for a provider whose official public API permits keyless use. */
  readonly apiKeyRequired?: boolean;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
  readonly authHeaders?: (apiKey: string) => Readonly<Record<string, string>>;
}

function diagnosticFor(status: ResearchEvidenceHttpStatus): ProviderDiagnosticCode {
  switch (status) {
    case 'NOT_CONFIGURED': return 'not_configured';
    case 'RATE_LIMITED': return 'rate_limited';
    case 'PROVIDER_ERROR': return 'provider_error';
    case 'INVALID': return 'schema_error';
    case 'SOURCE_UNAVAILABLE':
    case 'CIRCUIT_OPEN': return 'transport_error';
    case 'READY': return 'healthy';
  }
}

function hasApplicationLevelProviderError(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const status = (data as Record<string, unknown>).status;
  return typeof status === 'string' && status.trim().toLowerCase() === 'error';
}

/**
 * Shared transport for non-gateway research/evidence providers.
 *
 * This deliberately reuses ProviderMatrix, RateLimitBudget, CircuitBreaker and Supervisor health
 * instead of creating one bespoke transport stack per vendor. It is not a MarketDataGateway and
 * cannot create quote, score, ranking, order or execution authority.
 */
export class ResearchEvidenceProviderHttp {
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly nowMs: () => number;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly rateLimitBudget: RateLimitBudget;
  private readonly apiKey: string | null;
  private readonly apiKeyRequired: boolean;
  private readonly authHeaders: (apiKey: string) => Readonly<Record<string, string>>;

  constructor(
    readonly providerId: string,
    readonly capability: string,
    readonly options: ResearchEvidenceProviderHttpOptions,
  ) {
    const matrix = getProviderMatrixEntry(providerId);
    if (!matrix) throw new Error(`RESEARCH_EVIDENCE_PROVIDER_NOT_REGISTERED:${providerId}`);
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = Math.max(250, options.timeoutMs ?? 8_000);
    this.nowMs = options.nowMs ?? Date.now;
    this.apiKey = options.apiKey?.trim() || null;
    this.apiKeyRequired = options.apiKeyRequired !== false;
    this.authHeaders = options.authHeaders ?? ((apiKey) => ({ Authorization: `Bearer ${apiKey}` }));
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: matrix.circuitBreaker.failureThreshold,
      cooldownMs: matrix.circuitBreaker.cooldownMs,
      nowMs: this.nowMs,
    });
    this.rateLimitBudget = new RateLimitBudget({
      capacity: matrix.rateLimit.capacity,
      windowMs: matrix.rateLimit.windowMs,
      nowMs: this.nowMs,
    });
  }

  public async requestJson(
    path: string,
    init: Omit<RequestInit, 'signal'> = {},
  ): Promise<ResearchEvidenceHttpResult> {
    const retrievedAt = new Date(this.nowMs()).toISOString();
    if (!this.apiKey && this.apiKeyRequired) {
      return this.result('NOT_CONFIGURED', retrievedAt, null, 'Required provider API key is not configured.');
    }

    if (!this.circuitBreaker.allow(this.providerId)) {
      const reason = `Circuit open until ${this.circuitBreaker.openedUntilIso(this.providerId) ?? 'unknown'}.`;
      return this.result('CIRCUIT_OPEN', retrievedAt, null, reason);
    }

    const budget = this.rateLimitBudget.tryConsume(this.providerId, this.capability);
    if (!budget.allowed) {
      return this.result(
        'RATE_LIMITED',
        retrievedAt,
        null,
        `Provider budget exhausted until ${new Date(budget.resetAtMs).toISOString()}.`,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const authenticationHeaders = this.apiKey ? this.authHeaders(this.apiKey) : {};
      const response = await this.fetchImpl(`${this.options.baseUrl.replace(/\/$/, '')}${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...authenticationHeaders,
          ...(init.headers ?? {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        this.circuitBreaker.failure(this.providerId);
        const status: ResearchEvidenceHttpStatus = response.status === 429 ? 'RATE_LIMITED' : 'SOURCE_UNAVAILABLE';
        const diagnostic: ProviderDiagnosticCode = response.status === 401 || response.status === 403
          ? 'auth_error'
          : diagnosticFor(status);
        recordProviderHealth({
          provider: this.providerId,
          capability: this.capability,
          state: 'unavailable',
          at: retrievedAt,
          diagnosticCode: diagnostic,
          payloadUsable: false,
          message: `HTTP ${response.status}`,
        });
        return {
          transportVersion: RESEARCH_EVIDENCE_HTTP_VERSION,
          providerId: this.providerId,
          status,
          retrievedAt,
          data: null,
          reason: response.status === 401 || response.status === 403
            ? `Provider authentication/entitlement rejected (HTTP ${response.status}).`
            : `Provider returned HTTP ${response.status}.`,
          httpStatus: response.status,
        };
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        this.circuitBreaker.failure(this.providerId);
        return this.result('INVALID', retrievedAt, null, 'Provider returned non-JSON payload.');
      }

      if (hasApplicationLevelProviderError(data)) {
        this.circuitBreaker.failure(this.providerId);
        return this.result(
          'PROVIDER_ERROR',
          retrievedAt,
          null,
          'Provider returned an application-level error response.',
        );
      }

      this.circuitBreaker.success(this.providerId);
      recordProviderHealth({
        provider: this.providerId,
        capability: this.capability,
        state: 'healthy',
        at: retrievedAt,
        diagnosticCode: 'healthy',
        payloadUsable: true,
      });
      return {
        transportVersion: RESEARCH_EVIDENCE_HTTP_VERSION,
        providerId: this.providerId,
        status: 'READY',
        retrievedAt,
        data,
        httpStatus: response.status,
      };
    } catch (error) {
      this.circuitBreaker.failure(this.providerId);
      const reason = error instanceof Error ? error.message : String(error);
      return this.result('SOURCE_UNAVAILABLE', retrievedAt, null, reason);
    } finally {
      clearTimeout(timeout);
    }
  }

  private result(
    status: Exclude<ResearchEvidenceHttpStatus, 'READY'>,
    retrievedAt: string,
    data: null,
    reason: string,
  ): ResearchEvidenceHttpResult {
    recordProviderHealth({
      provider: this.providerId,
      capability: this.capability,
      state: status === 'RATE_LIMITED' ? 'degraded' : 'unavailable',
      at: retrievedAt,
      diagnosticCode: diagnosticFor(status),
      payloadUsable: false,
      circuitOpenUntil: status === 'CIRCUIT_OPEN' ? this.circuitBreaker.openedUntilIso(this.providerId) ?? undefined : undefined,
      message: reason,
    });
    return {
      transportVersion: RESEARCH_EVIDENCE_HTTP_VERSION,
      providerId: this.providerId,
      status,
      retrievedAt,
      data,
      reason,
    };
  }
}
