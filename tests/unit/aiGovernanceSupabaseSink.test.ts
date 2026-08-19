import { describe, expect, it, vi } from 'vitest';
import { SupabaseAiGovernanceSink } from '../../server/aiGovernanceSupabaseSink';
import type { AiEvaluationRecord } from '../../src/services/aiGovernance';

const record: AiEvaluationRecord = {
  evaluationId: 'eval-durable-1',
  timestamp: '2026-08-19T00:55:00.000Z',
  promptId: 'chat-assistant',
  promptVersion: '1.0.0',
  modelProvider: 'openai',
  model: 'configured-runtime-model',
  requestId: 'req-durable-1',
  evidenceIds: ['rag:ret-1:chunk-1'],
  checks: { grounded: true, citationComplete: true },
  outcome: 'PASS',
  notes: 'grounded runtime evaluation',
};

describe('SupabaseAiGovernanceSink', () => {
  it('persists a valid evaluation with a privileged configured backend', async () => {
    let insertedRow: Record<string, unknown> | null = null;
    const insert = vi.fn(async (row: Record<string, unknown>) => {
      insertedRow = row;
      return { error: null };
    });
    const sink = new SupabaseAiGovernanceSink({
      isConfigured: () => true,
      hasPrivilegedKey: () => true,
      insert,
    });

    const result = await sink.write(record);

    expect(result.accepted).toBe(true);
    expect(result.persisted).toBe(true);
    expect(result.sink).toBe('supabase-ai-governance-append-only');
    expect(insert).toHaveBeenCalledOnce();
    expect(insertedRow).toMatchObject({
      evaluation_id: 'eval-durable-1',
      prompt_id: 'chat-assistant',
      model_provider: 'openai',
      outcome: 'PASS',
    });
  });

  it('fails closed without a privileged server key', async () => {
    const insert = vi.fn(async (_row: Record<string, unknown>) => ({ error: null }));
    const sink = new SupabaseAiGovernanceSink({
      isConfigured: () => true,
      hasPrivilegedKey: () => false,
      insert,
    });

    const result = await sink.write(record);

    expect(result.accepted).toBe(false);
    expect(result.persisted).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });

  it('never claims durable evidence when the database insert fails', async () => {
    const sink = new SupabaseAiGovernanceSink({
      isConfigured: () => true,
      hasPrivilegedKey: () => true,
      insert: async (_row: Record<string, unknown>) => ({ error: { message: 'relation missing' } }),
    });

    const result = await sink.write(record);

    expect(result.accepted).toBe(true);
    expect(result.persisted).toBe(false);
    expect(result.reason).toContain('relation missing');
  });
});
