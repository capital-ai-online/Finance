import { describe, expect, it } from 'vitest';
import {
  ANALYSIS_PROVIDER_CAPABILITY_REQUIREMENTS,
  evaluateAllAnalysisProviderContracts,
  evaluateAnalysisProviderContract,
  evaluateAnalysisProviderRequirement,
  validateAnalysisProviderRequirementCoverage,
} from '../../src/platform/MarketData/AnalysisProviderCapabilityCoverage';
import { ANALYSIS_CONNECTION_CONTRACTS } from '../../src/platform/Scoring/AnalysisConnectionRegistry';

describe('FIN-19 analysis provider capability coverage', () => {
  it('maps every analysis connection contract exactly once', () => {
    expect(validateAnalysisProviderRequirementCoverage()).toEqual([]);
    expect(Object.keys(ANALYSIS_PROVIDER_CAPABILITY_REQUIREMENTS)).toHaveLength(
      ANALYSIS_CONNECTION_CONTRACTS.length,
    );
    expect(ANALYSIS_CONNECTION_CONTRACTS).toHaveLength(38);
  });

  it('recognizes canonical gateway coverage for crypto technical and commodity market evidence', () => {
    expect(evaluateAnalysisProviderContract('crypto-technical-provenance').state).toBe('FULL_CANONICAL');
    expect(evaluateAnalysisProviderContract('commodity-market-evidence').state).toBe('FULL_CANONICAL');
  });

  it('keeps compatibility evidence accepted without upgrading it to canonical gateway coverage', () => {
    expect(evaluateAnalysisProviderContract('sovereign-benchmark-yield').state).toBe('EVIDENCE_ACCEPTED');
    expect(evaluateAnalysisProviderContract('buffett-value-check').state).toBe('EVIDENCE_ACCEPTED');
  });

  it('keeps productive contracts partial when a required history/quote path is still compatibility-only or unmapped', () => {
    expect(evaluateAnalysisProviderContract('traditional-scoring-stock').state).toBe('PARTIAL');
    expect(evaluateAnalysisProviderContract('traditional-scoring-fx-index').state).toBe('PARTIAL');
    expect(evaluateAnalysisProviderContract('market-screener-projection').state).toBe('PARTIAL');
    expect(evaluateAnalysisProviderContract('quant-backtest-engine').state).toBe('PARTIAL');
  });

  it('does not allow disabled candidate providers to satisfy canonical requirements', () => {
    const coverage = evaluateAnalysisProviderRequirement({
      capability: 'fundamentals',
      assetClass: 'forex',
      mode: 'CANONICAL_INPUT',
      purpose: 'Regression-only candidate coverage check.',
    });

    expect(coverage.state).toBe('CANDIDATE_ONLY');
    expect(coverage.providerIds).toEqual(expect.arrayContaining(['finnhub']));
    expect(coverage.accepted).toBe(false);
  });

  it('keeps providerless downstream contracts explicitly not applicable', () => {
    for (const id of [
      'cross-asset-ranking',
      'deterministic-portfolio-allocation',
      'crypto-kill-switch-research',
      'realtime-risk-assessment-disabled',
      'asset-universe-sandbox-legacy',
      'enterprise-scorer-workbench',
    ]) {
      expect(evaluateAnalysisProviderContract(id).state, id).toBe('NOT_APPLICABLE');
    }
  });

  it('returns one deterministic coverage projection for every analysis contract', () => {
    const coverage = evaluateAllAnalysisProviderContracts();
    expect(coverage).toHaveLength(38);
    expect(new Set(coverage.map(item => item.contractId)).size).toBe(38);
  });
});
