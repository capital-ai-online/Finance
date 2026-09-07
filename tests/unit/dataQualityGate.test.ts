import { describe, expect, it } from 'vitest';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/evidenceQualityContracts';
import {
  DATA_QUALITY_GATE_CONTRACT_VERSION,
  aggregateDataStatuses,
  evaluateDataQualityGate,
  isAdmissibleFintechInput,
  mapEvidenceQualityToDataStatus,
  mapSnapshotQualityToDataStatus,
  wouldSilentlyUpgrade,
} from '../../src/platform/MarketData/dataQualityGate';

function evidence(
  overrides: Partial<MarketEvidenceQualityRecord> = {},
): MarketEvidenceQualityRecord {
  return {
    assetId: 'stock:AAPL',
    providerId: 'provider.alpaca',
    capability: 'snapshot',
    field: 'price',
    observedAt: '2026-09-07T08:00:00.000Z',
    retrievedAt: '2026-09-07T08:00:01.000Z',
    freshness: {
      ageMs: 1_000,
      maxAgeMs: 90_000,
      evaluatedAt: '2026-09-07T08:00:02.000Z',
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: 'VERIFIED',
    evidenceRef: 'evd:alpaca:AAPL:price:20260907T080000Z',
    ...overrides,
  };
}

describe('DATA-11 data quality gate', () => {
  it('maps snapshot quality states onto the DATA exit vocabulary without collapsing source contracts', () => {
    expect(mapSnapshotQualityToDataStatus('LIVE')).toBe('PASS');
    expect(mapSnapshotQualityToDataStatus('DELAYED')).toBe('PARTIAL');
    expect(mapSnapshotQualityToDataStatus('HISTORICAL')).toBe('PARTIAL');
    expect(mapSnapshotQualityToDataStatus('DEGRADED')).toBe('UNKNOWN');
    expect(mapSnapshotQualityToDataStatus('STALE')).toBe('STALE');
    expect(mapSnapshotQualityToDataStatus('UNAVAILABLE')).toBe('MISSING');
    expect(mapSnapshotQualityToDataStatus('INVALID')).toBe('FAIL');
  });

  it('maps evidence quality onto the same DATA exit vocabulary', () => {
    expect(mapEvidenceQualityToDataStatus(evidence(), true)).toBe('PASS');
    expect(mapEvidenceQualityToDataStatus(evidence({ qualityStatus: 'STALE' }))).toBe('STALE');
    expect(mapEvidenceQualityToDataStatus(evidence({ qualityStatus: 'UNAVAILABLE' }))).toBe('MISSING');
    expect(mapEvidenceQualityToDataStatus(evidence({ qualityStatus: 'NOT_APPLICABLE' }))).toBe('NOT_COMPUTABLE');
    expect(mapEvidenceQualityToDataStatus(evidence({ qualityStatus: 'CONFLICTING' }))).toBe('UNKNOWN');
    expect(mapEvidenceQualityToDataStatus(evidence({ qualityStatus: 'INVALID' }))).toBe('FAIL');
    expect(mapEvidenceQualityToDataStatus(evidence(), false)).toBe('MISSING');
  });

  it('never lets FAIL reach valid downstream input', () => {
    const gate = evaluateDataQualityGate(['PASS', 'FAIL']);
    expect(gate.contractVersion).toBe(DATA_QUALITY_GATE_CONTRACT_VERSION);
    expect(gate.status).toBe('FAIL');
    expect(gate.admissibleForFintech).toBe(false);
    expect(isAdmissibleFintechInput('FAIL')).toBe(false);
  });

  it('does not silently upgrade STALE, MISSING or UNKNOWN to PASS or PARTIAL', () => {
    expect(aggregateDataStatuses(['PASS', 'STALE'])).toBe('STALE');
    expect(aggregateDataStatuses(['PARTIAL', 'MISSING'])).toBe('MISSING');
    expect(aggregateDataStatuses(['PASS', 'UNKNOWN'])).toBe('UNKNOWN');
    expect(wouldSilentlyUpgrade('STALE', 'PASS')).toBe(true);
    expect(wouldSilentlyUpgrade('MISSING', 'PARTIAL')).toBe(true);
    expect(wouldSilentlyUpgrade('UNKNOWN', 'PASS')).toBe(true);
    expect(wouldSilentlyUpgrade('FAIL', 'STALE')).toBe(true);
    expect(wouldSilentlyUpgrade('STALE', 'FAIL')).toBe(false);
    expect(isAdmissibleFintechInput('STALE')).toBe(false);
    expect(isAdmissibleFintechInput('MISSING')).toBe(false);
    expect(isAdmissibleFintechInput('UNKNOWN')).toBe(false);
    expect(isAdmissibleFintechInput('NOT_COMPUTABLE')).toBe(false);
  });

  it('allows only PASS and PARTIAL as FINTECH export input', () => {
    expect(evaluateDataQualityGate(['PASS']).admissibleForFintech).toBe(true);
    expect(evaluateDataQualityGate(['PARTIAL']).admissibleForFintech).toBe(true);
    expect(evaluateDataQualityGate(['NOT_COMPUTABLE']).admissibleForFintech).toBe(false);
  });

  it('treats an empty observation set as MISSING rather than inventing PASS', () => {
    const gate = evaluateDataQualityGate([]);
    expect(gate.status).toBe('MISSING');
    expect(gate.admissibleForFintech).toBe(false);
  });
});
