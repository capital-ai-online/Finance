import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const DUNE_PROVIDER_ID = 'dune' as const;
export const DUNE_BASE_URL = 'https://api.dune.com/api' as const;
export const DUNE_QUERY_EVIDENCE_CONTRACT_VERSION = 'dune-saved-query-evidence/1.2.0' as const;

export type DuneEvidenceStatus =
  | 'VERIFIED'
  | 'NOT_CONFIGURED'
  | 'SOURCE_UNAVAILABLE'
  | 'INVALID'
  | 'QUERY_NOT_GOVERNED'
  | 'POLICY_BLOCKED';

export type DuneAccessMode = 'FREE_TIER' | 'TRIAL_14D';

export interface DuneSavedQueryEvidence {
  readonly contractVersion: typeof DUNE_QUERY_EVIDENCE_CONTRACT_VERSION;
  readonly status: DuneEvidenceStatus;
  readonly queryId: number;
  readonly expectedColumns: readonly string[];
  readonly retrievedAt: string;
  readonly evidenceRef: string | null;
  readonly executionId: string | null;
  readonly rows: readonly Readonly<Record<string, unknown>>[];
  readonly accessMode: DuneAccessMode;
  readonly reason?: string;
}

export interface DuneQueryEvidenceProviderOptions {
  readonly apiKey?: string | null;
  readonly allowedQueryIds?: readonly number[];
  readonly accessMode?: DuneAccessMode;
  readonly freeTierAttested?: boolean;
  readonly trialAttested?: boolean;
  readonly trialStartedAt?: string | null;
  readonly trialEndsAt?: string | null;
  readonly maxResultRows?: number;
  readonly env?: NodeJS.ProcessEnv;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
  readonly baseUrl?: string;
}

function parseAllowedQueryIds(envValue: string | undefined): number[] {
  if (!envValue?.trim()) return [];
  return envValue.split(',').map((value) => Number(value.trim())).filter((value) => Number.isSafeInteger(value) && value > 0);
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === '') return defaultValue;
  return value.trim().toLowerCase() === 'true';
}

function parseAccessMode(value: string | undefined): DuneAccessMode {
  return value?.trim().toUpperCase() === 'TRIAL_14D' ? 'TRIAL_14D' : 'FREE_TIER';
}

function failure(
  status: DuneEvidenceStatus,
  queryId: number,
  expectedColumns: readonly string[],
  retrievedAt: string,
  accessMode: DuneAccessMode,
  reason: string,
): DuneSavedQueryEvidence {
  return Object.freeze({
    contractVersion: DUNE_QUERY_EVIDENCE_CONTRACT_VERSION,
    status,
    queryId,
    expectedColumns: Object.freeze([...expectedColumns]),
    retrievedAt,
    evidenceRef: null,
    executionId: null,
    rows: Object.freeze([]),
    accessMode,
    reason,
  });
}

/**
 * Read-only Dune evidence provider with two explicit entitlement modes:
 * FREE_TIER and a time-bounded Owner-attested TRIAL_14D.
 *
 * The trial may broaden accessible Dune datasets, but it never broadens CAPITAL-AI mutation
 * authority: only allowlisted saved-query latest-result reads are permitted. Arbitrary SQL,
 * execute-query, pipelines, exports and credit/overage bypass remain absent by construction.
 */
export class DuneQueryEvidenceProvider {
  private readonly http: ResearchEvidenceProviderHttp;
  private readonly allowedQueryIds: ReadonlySet<number>;
  private readonly accessMode: DuneAccessMode;
  private readonly freeTierAttested: boolean;
  private readonly trialAttested: boolean;
  private readonly trialStartedAt: number | null;
  private readonly trialEndsAt: number | null;
  private readonly maxResultRows: number;
  private readonly nowMs: () => number;

  constructor(options: DuneQueryEvidenceProviderOptions = {}) {
    const env = options.env ?? process.env;
    this.nowMs = options.nowMs ?? Date.now;
    this.allowedQueryIds = new Set(options.allowedQueryIds ?? parseAllowedQueryIds(env.DUNE_ALLOWED_QUERY_IDS));
    this.accessMode = options.accessMode ?? parseAccessMode(env.DUNE_ACCESS_MODE);
    this.freeTierAttested = options.freeTierAttested ?? parseBoolean(env.DUNE_FREE_TIER_ATTESTED, false);
    this.trialAttested = options.trialAttested ?? parseBoolean(env.DUNE_TRIAL_ATTESTED, false);
    const startedRaw = options.trialStartedAt ?? env.DUNE_TRIAL_STARTED_AT ?? null;
    const endsRaw = options.trialEndsAt ?? env.DUNE_TRIAL_ENDS_AT ?? null;
    const started = startedRaw ? Date.parse(startedRaw) : Number.NaN;
    const ends = endsRaw ? Date.parse(endsRaw) : Number.NaN;
    this.trialStartedAt = Number.isFinite(started) ? started : null;
    this.trialEndsAt = Number.isFinite(ends) ? ends : null;
    const configuredRows = options.maxResultRows ?? Number(env.DUNE_MAX_RESULT_ROWS ?? 25);
    this.maxResultRows = Number.isFinite(configuredRows) ? Math.max(1, Math.min(100, Math.floor(configuredRows))) : 25;

    const transport: ResearchEvidenceProviderHttpOptions = {
      baseUrl: options.baseUrl ?? DUNE_BASE_URL,
      apiKey: options.apiKey ?? env.DUNE_API_KEY ?? null,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: this.nowMs,
      authHeaders: (apiKey) => ({ 'X-Dune-API-Key': apiKey }),
    };
    this.http = new ResearchEvidenceProviderHttp(DUNE_PROVIDER_ID, 'onchain', transport);
  }

  private policyBlockReason(): string | null {
    if (this.accessMode === 'FREE_TIER') {
      return this.freeTierAttested ? null : 'Dune FREE_TIER mode requires Owner attestation.';
    }

    if (!this.trialAttested || this.trialStartedAt === null || this.trialEndsAt === null) {
      return 'Dune TRIAL_14D mode requires Owner attestation plus explicit start/end timestamps.';
    }
    const maxTrialMs = 14 * 24 * 60 * 60_000;
    if (this.trialEndsAt <= this.trialStartedAt || this.trialEndsAt - this.trialStartedAt > maxTrialMs) {
      return 'Dune trial window is invalid or exceeds the governed 14-day boundary.';
    }
    const now = this.nowMs();
    if (now < this.trialStartedAt) return 'Dune 14-day trial window has not started.';
    if (now >= this.trialEndsAt) return 'Dune 14-day trial window has expired; provider is fail-closed until FREE_TIER is re-attested.';
    return null;
  }

  public async getLatestSavedQuery(queryId: number, expectedColumns: readonly string[]): Promise<DuneSavedQueryEvidence> {
    const retrievedAt = new Date(this.nowMs()).toISOString();
    const policyBlock = this.policyBlockReason();
    if (policyBlock) return failure('POLICY_BLOCKED', queryId, expectedColumns, retrievedAt, this.accessMode, policyBlock);

    if (!Number.isSafeInteger(queryId) || queryId <= 0 || expectedColumns.length === 0) {
      return failure('INVALID', queryId, expectedColumns, retrievedAt, this.accessMode, 'Positive queryId and expected output columns are required.');
    }
    if (expectedColumns.length > 20 || expectedColumns.some((column) => !/^[A-Za-z0-9_.$-]{1,80}$/.test(column))) {
      return failure('INVALID', queryId, expectedColumns, retrievedAt, this.accessMode, 'Expected Dune columns exceed the governed schema boundary.');
    }
    if (!this.allowedQueryIds.has(queryId)) {
      return failure('QUERY_NOT_GOVERNED', queryId, expectedColumns, retrievedAt, this.accessMode, 'Dune query ID is not present in the governed allowlist. Arbitrary query execution is forbidden.');
    }

    const columns = encodeURIComponent(expectedColumns.join(','));
    const result = await this.http.requestJson(`/v1/query/${queryId}/results?limit=${this.maxResultRows}&columns=${columns}`);
    if (result.status !== 'READY') {
      return failure(result.status === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'SOURCE_UNAVAILABLE', queryId, expectedColumns, result.retrievedAt, this.accessMode, result.reason ?? 'Dune source unavailable.');
    }
    if (!result.data || typeof result.data !== 'object' || Array.isArray(result.data)) {
      return failure('INVALID', queryId, expectedColumns, result.retrievedAt, this.accessMode, 'Dune response is not an object.');
    }

    const root = result.data as Record<string, unknown>;
    const executionId = typeof root.execution_id === 'string' ? root.execution_id : null;
    const resultObject = root.result && typeof root.result === 'object' ? root.result as Record<string, unknown> : null;
    const rowsRaw = resultObject && Array.isArray(resultObject.rows) ? resultObject.rows : [];
    const rows = rowsRaw.slice(0, this.maxResultRows).filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object' && !Array.isArray(row)));
    if (rows.length === 0) {
      return failure('SOURCE_UNAVAILABLE', queryId, expectedColumns, result.retrievedAt, this.accessMode, 'Dune saved query has no result rows.');
    }

    const missingColumns = expectedColumns.filter((column) => rows.some((row) => !(column in row)));
    if (missingColumns.length > 0) {
      return failure('INVALID', queryId, expectedColumns, result.retrievedAt, this.accessMode, `Dune output schema drift; missing columns: ${missingColumns.join(', ')}.`);
    }

    return Object.freeze({
      contractVersion: DUNE_QUERY_EVIDENCE_CONTRACT_VERSION,
      status: 'VERIFIED',
      queryId,
      expectedColumns: Object.freeze([...expectedColumns]),
      retrievedAt: result.retrievedAt,
      evidenceRef: `dune:saved-query:${queryId}:${executionId ?? result.retrievedAt}`,
      executionId,
      rows: Object.freeze(rows.map((row) => Object.freeze({ ...row }))),
      accessMode: this.accessMode,
    });
  }
}
