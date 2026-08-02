import type { ScreeningSloEvidenceRecord } from './screeningSloEvidence';

export const SCREENING_SLO_SINK_VERSION = 'screening-slo-sink/1.0.0' as const;

export interface ScreeningSloSinkWriteResult {
  contractVersion: typeof SCREENING_SLO_SINK_VERSION;
  accepted: boolean;
  persisted: boolean;
  sink: string;
  reason?: string;
}

export interface ScreeningSloSink {
  readonly id: string;
  write(record: ScreeningSloEvidenceRecord): Promise<ScreeningSloSinkWriteResult>;
}

/**
 * Default development/runtime sink. It deliberately does not pretend to persist evidence.
 * Production must inject an append-only sink backed by Supabase or an observability store.
 */
export class NoopScreeningSloSink implements ScreeningSloSink {
  readonly id = 'noop-unpersisted';

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

    return {
      contractVersion: SCREENING_SLO_SINK_VERSION,
      accepted: true,
      persisted: false,
      sink: this.id,
      reason: 'No persistent screening SLO sink is configured. Evidence remains response/runtime only.',
    };
  }
}

let activeSink: ScreeningSloSink = new NoopScreeningSloSink();

export function configureScreeningSloSink(sink: ScreeningSloSink): void {
  activeSink = sink;
}

export function getScreeningSloSink(): ScreeningSloSink {
  return activeSink;
}

export async function persistScreeningSloEvidence(record: ScreeningSloEvidenceRecord): Promise<ScreeningSloSinkWriteResult> {
  return activeSink.write(record);
}
