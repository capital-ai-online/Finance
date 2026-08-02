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

export interface ScreeningSloSinkStatus {
  contractVersion: typeof SCREENING_SLO_SINK_VERSION;
  sink: string;
  writesAttempted: number;
  writesAccepted: number;
  writesPersisted: number;
  lastWrite: ScreeningSloSinkWriteResult | null;
  persistenceConfigured: boolean;
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
let writesAttempted = 0;
let writesAccepted = 0;
let writesPersisted = 0;
let lastWrite: ScreeningSloSinkWriteResult | null = null;

export function configureScreeningSloSink(sink: ScreeningSloSink): void {
  activeSink = sink;
  writesAttempted = 0;
  writesAccepted = 0;
  writesPersisted = 0;
  lastWrite = null;
}

export function getScreeningSloSink(): ScreeningSloSink {
  return activeSink;
}

export function getScreeningSloSinkStatus(): ScreeningSloSinkStatus {
  return {
    contractVersion: SCREENING_SLO_SINK_VERSION,
    sink: activeSink.id,
    writesAttempted,
    writesAccepted,
    writesPersisted,
    lastWrite: lastWrite ? { ...lastWrite } : null,
    persistenceConfigured: activeSink.id !== 'noop-unpersisted',
  };
}

export async function persistScreeningSloEvidence(record: ScreeningSloEvidenceRecord): Promise<ScreeningSloSinkWriteResult> {
  writesAttempted += 1;
  const result = await activeSink.write(record);
  if (result.accepted) writesAccepted += 1;
  if (result.persisted) writesPersisted += 1;
  lastWrite = { ...result };
  return result;
}
