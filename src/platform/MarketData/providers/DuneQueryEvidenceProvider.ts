import { deriveDuneAllowedQueryIds } from '../DuneSavedQueryRegistry';
import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const DUNE_PROVIDER_ID = 'dune' as const;
export const DUNE_BASE_URL = 'https://api.dune.com/api' as const;
export const DUNE_QUERY_EVIDENCE_CONTRACT_VERSION = 'dune-saved-query-evidence/1.4.0' as const;

export type DuneEvidenceStatus =
  | 'VERIFIED'
  | 'NOT_CONFIGURED'
  | 'SOURCE_UNAVAILABLE'
  | 'INVALID'
  | 'QUERY_NOT_GOVERNED'
  | 'POLICY_BLOCKED';

export type DuneAccessMode = 'FREE_TIER' | 'TRIAL_14D';
export type DuneExecutionDiagnosticStatus =
  | 'READY'
  | 'NOT_CONFIGURED'
  | 'SOURCE_UNAVAILABLE'
  | 'INVALID'
  | 'QUERY_NOT_GOVERNED';

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

export interface DuneExecutionDiagnostic {
  readonly contractVersion: typeof DUNE_QUERY_EVIDENCE_CONTRACT_VERSION;
  readonly authority: 'DIAGNOSTIC_ONLY';
  readonly status: DuneExecutionDiagnosticStatus;
  readonly executionId: string;
  readonly expectedQueryId: number;
  readonly returnedQueryId: number | null;
  readonly state: string | null;
  readonly isExecutionFinished: boolean | null;
  readonly submittedAt: string | null;
  readonly executionStartedAt: string | null;
  readonly executionEndedAt: string | null;
  readonly expiresAt: string | null;
  readonly executionCostCredits: number | null;
  readonly errorType: string | null;
  readonly errorMessage: string | null;
  readonly retrievedAt: string;
  readonly reason?: string;
}

export interface DuneQueryEvidenceProviderOptions {
  readonly apiKey?: string | null;
  /** Test/explicit override only. Production derives this set from DuneSavedQueryRegistry env keys. */
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

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === '') return defaultValue;
  return value.trim().toLowerCase() === 'true';
}

function parseAccessMode(value: string | undefined): DuneAccessMode {
  return value?.trim().toUpperCase() === 'TRIAL_14D' ? 'TRIAL_14D' : 'FREE_TIER';
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
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

function diagnosticFailure(
  status: DuneExecutionDiagnosticStatus,
  executionId: string,
  expectedQueryId: number,
  retrievedAt: string,
  reason: string,
): DuneExecutionDiagnostic {
  return Object.freeze({
    contractVersion: DUNE_QUERY_EVIDENCE_CONTRACT_VERSION,
    authority: 'DIAGNOSTIC_ONLY' as const,
    status,
    executionId,
    expectedQueryId,
    returnedQueryId: null,
    state: null,
    isExecutionFinished: null,
    submittedAt: null,
    executionStartedAt: null,
    executionEndedAt: null,
    expiresAt: null,
    executionCostCredits: null,
    errorType: null,
    errorMessage: null,
    retrievedAt,
    reason,
  });
}

/**
 * Read-only Dune evidence provider with two explicit entitlement modes:
 * FREE_TIER and a time-bounded Owner-attested TRIAL_14D.
 *
 * The trial may broaden accessible Dune datasets, but it never broadens CAPITAL-AI mutation
 * authority: only semantically configured saved-query latest-result reads are permitted. Arbitrary
 * SQL, execute-query, pipelines, exports and credit/overage bypass remain absent by construction.
 *
 * A separate diagnostic method may inspect Dune execution status for an already-existing execution.
 * It never starts/cancels an execution, never returns evidence rows and can never authorize scoring.
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
    this.allowedQueryIds = new Set(options.allowedQueryIds ?? deriveDuneAllowedQueryIds(env));
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

  public async inspectExecutionStatus(executionIdInput: string, expectedQueryId: number): Promise<DuneExecutionDiagnostic> {
    const executionId = executionIdInput.trim();
    const retrievedAt = new Date(this.nowMs()).toISOString();
    if (!/^[A-Z0-9_-]{10,80}$/i.test(executionId)) {
      return diagnosticFailure('INVALID', executionId, expectedQueryId, retrievedAt, 'Dune execution ID has an invalid format.');
    }
    if (!Number.isSafeInteger(expectedQueryId) || expectedQueryId <= 0) {
      return diagnosticFailure('INVALID', executionId, expectedQueryId, retrievedAt, 'Positive expected query ID is required.');
    }
    if (!this.allowedQueryIds.has(expectedQueryId)) {
      return diagnosticFailure(
        'QUERY_NOT_GOVERNED',
        executionId,
        expectedQueryId,
        retrievedAt,
        'Expected Dune query ID is not present in the governed semantic registry. Diagnostic reads cannot bypass query governance.',
      );
    }

    const result = await this.http.requestJson(`/v1/execution/${encodeURIComponent(executionId)}/status`);
    if (result.status !== 'READY') {
      return diagnosticFailure(
        result.status === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'SOURCE_UNAVAILABLE',
        executionId,
        expectedQueryId,
        result.retrievedAt,
        result.reason ?? 'Dune execution status unavailable.',
      );
    }
    if (!result.data || typeof result.data !== 'object' || Array.isArray(result.data)) {
      return diagnosticFailure('INVALID', executionId, expectedQueryId, result.retrievedAt, 'Dune execution status response is not an object.');
    }

    const root = result.data as Record<string, unknown>;
    const returnedQueryId = finiteNumber(root.query_id);
    if (returnedQueryId === null || returnedQueryId !== expectedQueryId) {
      return Object.freeze({
        ...diagnosticFailure(
          'INVALID',
          executionId,
          expectedQueryId,
          result.retrievedAt,
          `Dune execution/query mismatch: expected ${expectedQueryId}, received ${returnedQueryId ?? 'unknown'}.`,
        ),
        returnedQueryId,
      });
    }

    const errorObject = root.error && typeof root.error === 'object' && !Array.isArray(root.error)
      ? root.error as Record<string, unknown>
      : null;
    return Object.freeze({
      contractVersion: DUNE_QUERY_EVIDENCE_CONTRACT_VERSION,
      authority: 'DIAGNOSTIC_ONLY' as const,
      status: 'READY' as const,
      executionId,
      expectedQueryId,
      returnedQueryId,
      state: stringOrNull(root.state),
      isExecutionFinished: typeof root.is_execution_finished === 'boolean' ? root.is_execution_finished : null,
      submittedAt: stringOrNull(root.submitted_at),
      executionStartedAt: stringOrNull(root.execution_started_at),
      executionEndedAt: stringOrNull(root.execution_ended_at),
      expiresAt: stringOrNull(root.expires_at),
      executionCostCredits: finiteNumber(root.execution_cost_credits),
      errorType: stringOrNull(errorObject?.type),
      errorMessage: stringOrNull(errorObject?.message),
      retrievedAt: result.retrievedAt,
    });
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
      return failure('QUERY_NOT_GOVERNED', queryId, expectedColumns, retrievedAt, this.accessMode, 'Dune query ID is not present in the governed semantic registry. Arbitrary query execution is forbidden.');
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
