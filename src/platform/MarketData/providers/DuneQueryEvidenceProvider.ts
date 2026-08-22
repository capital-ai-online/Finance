import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const DUNE_PROVIDER_ID = 'dune' as const;
export const DUNE_BASE_URL = 'https://api.dune.com/api' as const;
export const DUNE_QUERY_EVIDENCE_CONTRACT_VERSION = 'dune-saved-query-evidence/1.0.0' as const;

export type DuneEvidenceStatus = 'VERIFIED' | 'NOT_CONFIGURED' | 'SOURCE_UNAVAILABLE' | 'INVALID' | 'QUERY_NOT_GOVERNED';

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
 * Read-only Dune provider. Only latest results of pre-registered saved queries are retrievable.
 * There is deliberately no arbitrary SQL method and no execute-query method in this class.
 */
export class DuneQueryEvidenceProvider {
  private readonly http: ResearchEvidenceProviderHttp;
  private readonly allowedQueryIds: ReadonlySet<number>;

  constructor(options: DuneQueryEvidenceProviderOptions = {}) {
    const env = options.env ?? process.env;
    this.allowedQueryIds = new Set(options.allowedQueryIds ?? parseAllowedQueryIds(env.DUNE_ALLOWED_QUERY_IDS));
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
    if (!Number.isSafeInteger(queryId) || queryId <= 0 || expectedColumns.length === 0) {
      return failure('INVALID', queryId, expectedColumns, new Date().toISOString(), 'Positive queryId and expected output columns are required.');
    }
    if (!this.allowedQueryIds.has(queryId)) {
      return failure(
        'QUERY_NOT_GOVERNED',
        queryId,
        expectedColumns,
        new Date().toISOString(),
        'Dune query ID is not present in the governed allowlist. Arbitrary query execution is forbidden.',
      );
    }

    const result = await this.http.requestJson(`/v1/query/${queryId}/results`);
    if (result.status !== 'READY') {
      return failure(
        result.status === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'SOURCE_UNAVAILABLE',
        queryId,
        expectedColumns,
        result.retrievedAt,
        result.reason ?? 'Dune source unavailable.',
      );
    }
    if (!result.data || typeof result.data !== 'object') {
      return failure('INVALID', queryId, expectedColumns, result.retrievedAt, 'Dune response is not an object.');
    }

    const root = result.data as Record<string, unknown>;
    const executionId = typeof root.execution_id === 'string' ? root.execution_id : null;
    const resultObject = root.result && typeof root.result === 'object' ? root.result as Record<string, unknown> : null;
    const rowsRaw = resultObject && Array.isArray(resultObject.rows) ? resultObject.rows : [];
    const rows = rowsRaw.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object' && !Array.isArray(row)));
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
