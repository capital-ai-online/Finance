import { getServerSupabase, isSupabaseConfigured } from './db';
import { getCleanEnv } from './env';
import type { AiEvaluationRecord } from '../src/services/aiGovernance';

export interface AiGovernancePersistenceResult {
  accepted: boolean;
  persisted: boolean;
  sink: string;
  reason?: string;
}

export interface SupabaseAiGovernanceSinkDeps {
  isConfigured: () => boolean;
  hasPrivilegedKey: () => boolean;
  insert: (row: Record<string, unknown>) => Promise<{ error?: { message?: string } | null }>;
}

function hasPrivilegedSupabaseKey(): boolean {
  return Boolean(getCleanEnv('SUPABASE_SECRET_KEY') || getCleanEnv('SUPABASE_SERVICE_ROLE_KEY'));
}

const defaultDeps: SupabaseAiGovernanceSinkDeps = {
  isConfigured: isSupabaseConfigured,
  hasPrivilegedKey: hasPrivilegedSupabaseKey,
  insert: async row => {
    const { error } = await getServerSupabase().from('ai_governance_evaluations').insert(row);
    return { error };
  },
};

/**
 * Durable append-only sink for runtime AI governance evaluations.
 *
 * The in-process registry in src/services/aiGovernance.ts remains a bounded operational cache.
 * This sink is the durable evidence path and never reports persistence unless the database insert
 * actually succeeds.
 */
export class SupabaseAiGovernanceSink {
  readonly id = 'supabase-ai-governance-append-only';

  constructor(private readonly deps: SupabaseAiGovernanceSinkDeps = defaultDeps) {}

  async write(record: AiEvaluationRecord): Promise<AiGovernancePersistenceResult> {
    if (!record.evaluationId || !record.timestamp || !record.promptId || !record.promptVersion) {
      return {
        accepted: false,
        persisted: false,
        sink: this.id,
        reason: 'Invalid AI governance evaluation record.',
      };
    }

    if (!this.deps.isConfigured()) {
      return {
        accepted: false,
        persisted: false,
        sink: this.id,
        reason: 'Supabase is not configured; durable AI governance evidence is unavailable.',
      };
    }

    if (!this.deps.hasPrivilegedKey()) {
      return {
        accepted: false,
        persisted: false,
        sink: this.id,
        reason: 'A privileged Supabase server key is required for durable AI governance evidence.',
      };
    }

    const row = {
      evaluation_id: record.evaluationId,
      observed_at: record.timestamp,
      prompt_id: record.promptId,
      prompt_version: record.promptVersion,
      model_provider: record.modelProvider,
      model: record.model,
      request_id: record.requestId ?? null,
      evidence_ids: record.evidenceIds ?? [],
      checks: record.checks,
      outcome: record.outcome,
      notes: record.notes ?? null,
      evidence: record,
    };

    try {
      const { error } = await this.deps.insert(row);
      if (error) {
        return {
          accepted: true,
          persisted: false,
          sink: this.id,
          reason: `Supabase insert failed: ${error.message || 'unknown error'}`,
        };
      }

      return {
        accepted: true,
        persisted: true,
        sink: this.id,
      };
    } catch (error) {
      return {
        accepted: true,
        persisted: false,
        sink: this.id,
        reason: `Supabase insert failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
