import { describe, expect, it } from 'vitest';
import {
  buildCrossAssetRiskContextFromMacro,
  CROSS_ASSET_RISK_CONTEXT_VERSION,
} from '../crossAssetRiskContext';
import type { MacroRiskRegimeEvidence } from '../macroRiskRegime';

function macro(status: MacroRiskRegimeEvidence['status']): MacroRiskRegimeEvidence {
  return {
    contractVersion: '1.1.0',
    status,
    regime: status === 'READY' ? 'INVERTED_CURVE' : 'UNKNOWN',
    asOf: '2026-08-01',
    treasury2y: 4.2,
    treasury10y: 3.8,
    spread10y2yBps: status === 'READY' ? -40 : null,
    providers: ['FRED'],
    evidenceIds: ['macro:fred:DGS2:2026-08-01', 'macro:fred:DGS10:2026-08-01'],
    sourceSeries: ['DGS2', 'DGS10'],
    executionPriceEligible: false,
    reason: 'test',
  };
}

describe('cross asset risk context', () => {
  it('exposes fresh macro evidence without changing scores or recommendations', () => {
    const result = buildCrossAssetRiskContextFromMacro('bond', macro('READY'));
    expect(result.contractVersion).toBe(CROSS_ASSET_RISK_CONTEXT_VERSION);
    expect(result.status).toBe('READY');
    expect(result.supplementalStatus).toBe('PARTIAL');
    expect(result.macroSensitivity).toBe('HIGH');
    expect(result.scoreImpactEnabled).toBe(false);
    expect(result.recommendationEligible).toBe(false);
    expect(result.executionPriceEligible).toBe(false);
    expect(result.evidenceIds).toHaveLength(2);
  });

  it('adds policy-rate and CPI evidence without enabling score impact', () => {
    const result = buildCrossAssetRiskContextFromMacro('forex', macro('READY'), {
      fedFundsRate: 4.25,
      fedFundsAsOf: '2026-08-01',
      fedFundsEvidenceId: 'macro:fred:FEDFUNDS:2026-08-01',
      cpiIndex: 325.4,
      cpiAsOf: '2026-07-01',
      cpiEvidenceId: 'macro:fred:CPIAUCSL:2026-07-01',
    });
    expect(result.supplementalStatus).toBe('COMPLETE');
    expect(result.fedFundsRate).toBe(4.25);
    expect(result.cpiIndex).toBe(325.4);
    expect(result.evidenceIds).toHaveLength(4);
    expect(result.scoreImpactEnabled).toBe(false);
    expect(result.recommendationEligible).toBe(false);
  });

  it('propagates stale evidence fail-closed', () => {
    const result = buildCrossAssetRiskContextFromMacro('stock', macro('STALE_EVIDENCE'));
    expect(result.status).toBe('STALE_EVIDENCE');
    expect(result.macroRegime).toBe('UNKNOWN');
    expect(result.scoreImpactEnabled).toBe(false);
  });
});
