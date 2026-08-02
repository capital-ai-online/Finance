import { beforeEach, describe, expect, it } from 'vitest';
import {
  NoopScreeningSloSink,
  configureScreeningSloSink,
  getScreeningSloSinkStatus,
  persistScreeningSloEvidence,
} from '../../src/services/screeningSloSink';

const record = {
  contractVersion: 'screening-slo-evidence/1.0.0' as const,
  correlationId: 'corr-1',
  observedAt: '2026-08-02T00:00:00.000Z',
  state: 'HEALTHY' as const,
  eligible: true,
  eligibilityStatus: 'ELIGIBLE',
  quoteStatus: 'READY',
  quoteAgeMs: 1000,
  quoteFresh: true,
  slaState: 'HEALTHY',
  reasons: [],
  scoreImpactEnabled: false as const,
  hardScreeningBlockEnabled: false as const,
  persistencePolicy: {
    appendOnlyRecommended: true as const,
    syntheticEvidenceAllowed: false as const,
    secretsAllowed: false as const,
  },
};

beforeEach(() => {
  configureScreeningSloSink(new NoopScreeningSloSink());
});

describe('screeningSloSink', () => {
  it('never claims persistence when no production sink is configured', async () => {
    const result = await persistScreeningSloEvidence(record);
    expect(result.accepted).toBe(true);
    expect(result.persisted).toBe(false);
    expect(result.sink).toBe('noop-unpersisted');

    const status = getScreeningSloSinkStatus();
    expect(status.persistenceConfigured).toBe(false);
    expect(status.writesAttempted).toBe(1);
    expect(status.writesAccepted).toBe(1);
    expect(status.writesPersisted).toBe(0);
    expect(status.lastWrite?.persisted).toBe(false);
  });
});
