import { describe, expect, it } from 'vitest';
import {
  DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION,
  evaluateProvenanceLineage,
  lineageSurvivesHandoff,
  type DataProvenanceLineage,
} from '../../src/platform/MarketData/dataProvenanceLineage';

function lineage(overrides: Partial<DataProvenanceLineage> = {}): DataProvenanceLineage {
  return {
    contractVersion: DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION,
    assetId: 'stock:AAPL',
    providerId: 'provider.alpaca',
    providerFeed: 'iex',
    capability: 'snapshot',
    field: 'price',
    evidenceRef: 'evd:alpaca:AAPL:price:20260907T080000Z',
    observedAt: '2026-09-07T08:00:00.000Z',
    retrievedAt: '2026-09-07T08:00:01.000Z',
    correlationId: 'corr-data-12-001',
    ...overrides,
  };
}

describe('DATA-12 provenance lineage', () => {
  it('requires provider path, evidence reference, timestamps, asset identity and correlation', () => {
    const result = evaluateProvenanceLineage(lineage());
    expect(result.contractVersion).toBe(DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION);
    expect(result.complete).toBe(true);
    expect(result.survivesHandoff).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  it('marks incomplete lineage when evidence or correlation is missing', () => {
    expect(evaluateProvenanceLineage(lineage({ evidenceRef: null })).complete).toBe(false);
    expect(evaluateProvenanceLineage(lineage({ evidenceRef: '   ' })).missingFields).toContain('evidenceRef');
    expect(evaluateProvenanceLineage(lineage({ correlationId: '' })).missingFields).toContain('correlationId');
    expect(evaluateProvenanceLineage(lineage({ providerId: '' })).missingFields).toContain('providerId');
    expect(evaluateProvenanceLineage(lineage({ assetId: '' })).missingFields).toContain('assetId');
    expect(evaluateProvenanceLineage(lineage({ observedAt: 'not-a-timestamp' })).missingFields).toContain('observedAt');
  });

  it('fails closed when a downstream handoff drops or mutates lineage fields', () => {
    const produced = lineage();
    const dropped = lineageSurvivesHandoff(produced, lineage({ evidenceRef: null }));
    expect(dropped.survivesHandoff).toBe(false);
    expect(dropped.reason).toContain('handoff-dropped-fields');

    const mutated = lineageSurvivesHandoff(produced, lineage({ assetId: 'stock:MSFT' }));
    expect(mutated.survivesHandoff).toBe(false);
    expect(mutated.reason).toContain('handoff-mutated-fields:assetId');
  });

  it('allows a faithful handoff copy to survive', () => {
    const produced = lineage();
    const consumed = lineage();
    const result = lineageSurvivesHandoff(produced, consumed);
    expect(result.survivesHandoff).toBe(true);
    expect(result.reason).toBe('lineage-survived-handoff');
  });
});
