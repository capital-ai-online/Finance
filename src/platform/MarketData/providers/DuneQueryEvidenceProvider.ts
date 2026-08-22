import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const DUNE_PROVIDER_ID = 'dune' as const;
export const DUNE_BASE_URL = 'https://api.dune.com/api' as const;
export const DUNE_QUERY_EVIDENCE_CONTRACT_VERSION = 'dune-saved-query-evidence/1.1.0' as const;

export type DuneEvidenceStatus =
  | 'VERIFIED'
  | 'NOT_CONFIGURED'
  | 'SOURCE_UNAVAILABLE'
  | 'INVALID'
  | 'QUERY_NOT_GOVERNED'
  | 'POLICY_BLOCKED';

export interface DuneSavedQueryEvidence {
  readonly contractVersion: typeof DUNE_QUERY_EVIDENCE_CONTRACT_VERSION;
  readonly status: DuneEvidenceStatus;
  readonly queryId: number;
  readonly expectedColumns: readonly string[];
  readonly retrievedAt: string;
  readonly evidenceRef: string | null;
  readonly executionId: string | null;
  readonly rows: readonly Readonly<Record<string, unknown>>[];
  readonly reason?: string;
}

export interface DuneQueryEvidenceProviderOptions {
  readonly apiKey?: string | null;
  readonly allowedQueryIds?: readonly number[];
  readonly freeTierOnly?: boolean;
  readonly freeTierAttested?: boolean;
  readonly maxResultRows?: number;
  readonly env?: NodeJS.ProcessEnv;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
  readonly baseUrl?: string;
}

function parseAllowedQueryIds(envValue: string | undefined): number[] {
  if (!envValue?.trim()) return [];
  return envValue
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isSafeInteger(value) && value > 0);
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === '') return defaultValue;
  return value.trim().toLowerCase() === 'true';
}

function failure(
  status: DuneEvidenceStatus,
  queryId: number,
  expectedColumns: readonly string[],
  retrievedAt: string,
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
    reason,
  });
}

/**
 * Read-only Dune Free-Tier provider.
 *
 * Only the latest stored result of pre-registered saved queries is retrievable. This class exposes
 * no execute-query, SQL or pipeline method. Result reads are bounded to approved columns/rows and
 * require explicit Free-Tier attestation because Dune charges credits based on result size even
 * when the GET endpoint does not trigger a new query execution.
 */
export class DuneQueryEvidenceProvider {
  private readonly http: ResearchEvidenceProviderHttp;
  private readonly allowedQueryIds: ReadonlySet<number>;
  private readonly freeTierOnly: boolean;
  private readonly freeTierAttested: boolean;
  private readonly maxResultRows: number;

  constructor(options: DuneQueryEvidenceProviderOptions = {}) {
    const env = options.env ?? process.env;
    this.allowedQueryIds = new Set(options.allowedQueryIds ?? parseAllowedQueryIds(env.DUNE_ALLOWED_QUERY_IDS));
    this.freeTierOnly = options.freeTierOnly ?? parseBoolean(env.DUNE_FREE_TIER_ONLY, true);
    this.freeTierAttested = options.freeTierAttested ?? parseBoolean(env.DUNE_FREE_TIER_ATTESTED, false);
    const configuredRows = options.maxResultRows ?? Number(env.DUNE_MAX_RESULT_ROWS ?? 25);
    this.maxResultRows = Number.isFinite(configuredRows) ? Math.max(1, Math.min(100, Math.floor(configuredRows))) : 25;

    const transport: ResearchEvidenceProviderHttpOptions = {
      baseUrl: options.baseUrl ?? DUNE_BASE_URL,
      apiKey: options.apiKey ?? env.DUNE_API_KEY ?? null,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: options.nowMs,
      authHeaders: (apiKey) => ({ 'X-Dune-API-Key': apiKey }),
    };
    this.http = new ResearchEvidenceProviderHttp(DUNE_PROVIDER_ID, 'onchain', transport);
  }

  public async getLatestSavedQuery(
    queryId: number,
    expectedColumns: readonly string[],
  ): Promise<DuneSavedQueryEvidence> {
    const retrievedAt = new Date().toISOString();
    if (!this.freeTierOnly || !this.freeTierAttested) {
      return failure(
        'POLICY_BLOCKED',
        queryId,
        expectedColumns,
        retrievedAt,
        'Dune access is limited to an Owner-attested Free-Tier account. Set DUNE_FREE_TIER_ONLY=true and DUNE_FREE_TIER_ATTESTED=true only after manual account verification.',
      );
    }
    if (!Number.isSafeInteger(queryId) || queryId <= 0 || expectedColumns.length === 0) {
      return failure('INVALID', queryId, expectedColumns, retrievedAt, 'Positive queryId and expected output columns are required.');
    }
    if (expectedColumns.length > 20 || expectedColumns.some((column) => !/^[A-Za-z0-9_.$-]{1,80}$/.test(column))) {
      return failure('INVALID', queryId, expectedColumns, retrievedAt, 'Expected Dune columns exceed the governed schema boundary.');
    }
    if (!this.allowedQueryIds.has(queryId)) {
      return failure(
        'QUERY_NOT_GOVERNED',
        queryId,
        expectedColumns,
        retrievedAt,
        'Dune query ID is not present in the governed allowlist. Arbitrary query execution is forbidden.',
      );
    }

    const columns = encodeURIComponent(expectedColumns.join(','));
    const result = await this.http.requestJson(`/v1/query/${queryId}/results?limit=${this.maxResultRows}&columns=${columns}`);
    if (result.status !== 'READY') {
      return failure(
        result.status === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'SOURCE_UNAVAILABLE',
        queryId,
        expectedColumns,
        result.retrievedAt,
        result.reason ?? 'Dune source unavailable.',
      );
    }
    if (!result.data || typeof result.data !== 'object' || Array.isArray(result.data)) {
      return failure('INVALID', queryId, expectedColumns, result.retrievedAt, 'Dune response is not an object.');
    }

    const root = result.data as Record<string, unknown>;
    const executionId = typeof root.execution_id === 'string' ? root.execution_id : null;
    const resultObject = root.result && typeof root.result === 'object' ? root.result as Record<string, unknown> : null;
    const rowsRaw = resultObject && Array.isArray(resultObject.rows) ? resultObject.rows : [];
    const rows = rowsRaw
      .slice(0, this.maxResultRows)
      .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object' && !Array.isArray(row)));
    if (rows.length === 0) {
      return failure('SOURCE_UNAVAILABLE', queryId, expectedColumns, result.retrievedAt, 'Dune saved query has no result rows.');
    }

    const missingColumns = expectedColumns.filter((column) => rows.some((row) => !(column in row)));
    if (missingColumns.length > 0) {
      return failure(
        'INVALID',
        queryId,
        expectedColumns,
        result.retrievedAt,
        `Dune output schema drift; missing columns: ${missingColumns.join(', ')}.`,
      );
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
    });
  }
}
