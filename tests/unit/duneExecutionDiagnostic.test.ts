import { describe, expect, it, vi } from 'vitest';
import { DuneQueryEvidenceProvider } from '../../src/platform/MarketData/providers/DuneQueryEvidenceProvider';

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('Dune read-only execution diagnostics', () => {
  it('classifies a governed failed execution without creating evidence', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({
      execution_id: '01KT1X6YT5T3877JHGZDM717BR',
      query_id: 5823857,
      is_execution_finished: true,
      state: 'QUERY_STATE_FAILED',
      submitted_at: '2026-06-01T15:35:35.493735Z',
      expires_at: '2026-08-30T15:37:56.424833Z',
      execution_started_at: '2026-06-01T15:37:20.836001654Z',
      execution_ended_at: '2026-06-01T15:37:56.424820772Z',
      error: {
        type: 'FAILED_TYPE_EXECUTION_TIMEOUT',
        message: 'Query execution timed out after 2 minutes',
      },
    }));
    const provider = new DuneQueryEvidenceProvider({
      apiKey: 'test-key',
      allowedQueryIds: [5823857],
      freeTierAttested: false,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseUrl: 'https://provider.example',
      nowMs: () => Date.parse('2026-08-22T14:11:00.000Z'),
    });

    const result = await provider.inspectExecutionStatus('01KT1X6YT5T3877JHGZDM717BR', 5823857);

    expect(result.authority).toBe('DIAGNOSTIC_ONLY');
    expect(result.status).toBe('READY');
    expect(result.state).toBe('QUERY_STATE_FAILED');
    expect(result.isExecutionFinished).toBe(true);
    expect(result.errorType).toBe('FAILED_TYPE_EXECUTION_TIMEOUT');
    expect(result.errorMessage).toMatch(/timed out/i);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain('/v1/execution/01KT1X6YT5T3877JHGZDM717BR/status');
  });

  it('does not call Dune for an execution tied to an ungoverned query', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ query_id: 5823857 }));
    const provider = new DuneQueryEvidenceProvider({
      apiKey: 'test-key',
      allowedQueryIds: [27230, 5833540],
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseUrl: 'https://provider.example',
    });

    const result = await provider.inspectExecutionStatus('01KT1X6YT5T3877JHGZDM717BR', 5823857);
    expect(result.status).toBe('QUERY_NOT_GOVERNED');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects an execution/query mismatch fail-closed', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({
      execution_id: '01KT1X6YT5T3877JHGZDM717BR',
      query_id: 999,
      is_execution_finished: true,
      state: 'QUERY_STATE_COMPLETED',
    }));
    const provider = new DuneQueryEvidenceProvider({
      apiKey: 'test-key',
      allowedQueryIds: [27230],
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseUrl: 'https://provider.example',
    });

    const result = await provider.inspectExecutionStatus('01KT1X6YT5T3877JHGZDM717BR', 27230);
    expect(result.status).toBe('INVALID');
    expect(result.reason).toMatch(/mismatch/i);
  });
});
