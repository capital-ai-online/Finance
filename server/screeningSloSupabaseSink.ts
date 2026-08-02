import { getServerSupabase, isSupabaseConfigured } from './db';
import { getCleanEnv } from './env';
import type { ScreeningSloEvidenceRecord } from '../src/services/screeningSloEvidence';
import {
  SCREENING_SLO_SINK_VERSION,
  type ScreeningSloSink,
  type ScreeningSloSinkWriteResult,
} from '../src/services/screeningSloSink';

export interface SupabaseScreeningSloSinkDeps {
  isConfigured: () => boolean;
  hasPrivilegedKey: () => boolean;
  insert: (row: Record<string, unknown>) => Promise<{ error?: { message?: string } | null }>;
}

function hasPrivilegedSupabaseKey(): boolean {
  return Boolean(getCleanEnv('SUPABASE_SECRET_KEY') || getCleanEnv('SUPABASE_SERVICE_ROLE_KEY'));
}

const defaultDeps: SupabaseScreeningSloSinkDeps = {
  isConfigured: isSupabaseConfigured,
  hasPrivilegedKey: hasPrivilegedSupabaseKey,
  insert: async row => {
    const { error } = await getServerSupabase().from('screening_slo_evidence').insert(row);
    return { error };
  },
};

/**
 * Production append-only sink for screening SLO evidence.
 *
 * Security properties:
 * - server-side only; no browser/anon write path
 * - requires SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY
 * - no local-file fallback and no synthetic persistence claim
 * - database migration enforces append-only semantics for UPDATE/DELETE
 */
export class SupabaseScreeningSloSink implements ScreeningSloSink {
  readonly id = 'supabase-screening-slo-append-only';

  constructor(private readonly deps: SupabaseScreeningSloSinkDeps = defaultDeps) {}

  async write(record: ScreeningSloEvidenceRecord): Promise<ScreeningSloSinkWriteResult> {
    if (!record.correlationId || !record.observedAt) {
      return {
        contractVersion: SCREENING_SLO_SINK_VERSION,
        accepted: false,
        persisted: false,
        sink: this.id,
        reason: 'Invalid SLO evidence record.',
      };
    }

    if (!this.deps.isConfigured()) {
      return {
        contractVersion: SCREENING_SLO_SINK_VERSION,
        accepted: false,
        persisted: false,
        sink: this.id,
        reason: 'Supabase is not configured; persistent SLO evidence is unavailable.',
      };
    }

    if (!this.deps.hasPrivilegedKey()) {
      return {
        contractVersion: SCREENING_SLO_SINK_VERSION,
        accepted: false,
        persisted: false,
        sink: this.id,
        reason: 'A privileged Supabase server key is required for append-only SLO persistence.',
      };
    }

    const row = {
      contract_version: record.contractVersion,
      correlation_id: record.correlationId,
      observed_at: record.observedAt,
      symbol: record.symbol ?? null,
      asset_class: record.assetClass ?? null,
      state: record.state,
      eligible: record.eligible,
      eligibility_status: record.eligibilityStatus,
      quote_status: record.quoteStatus,
      quote_age_ms: record.quoteAgeMs,
      quote_fresh: record.quoteFresh,
      sla_state: record.slaState,
      reasons: record.reasons,
      score_impact_enabled: record.scoreImpactEnabled,
      hard_screening_block_enabled: record.hardScreeningBlockEnabled,
      evidence: record,
    };

    try {
      const { error } = await this.deps.insert(row);
      if (error) {
        return {
          contractVersion: SCREENING_SLO_SINK_VERSION,
          accepted: true,
          persisted: false,
          sink: this.id,
          reason: `Supabase insert failed: ${error.message || 'unknown error'}`,
        };
      }
      return {
        contractVersion: SCREENING_SLO_SINK_VERSION,
        accepted: true,
        persisted: true,
        sink: this.id,
      };
    } catch (error) {
      return {
        contractVersion: SCREENING_SLO_SINK_VERSION,
        accepted: true,
        persisted: false,
        sink: this.id,
        reason: `Supabase insert failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
