import { describe, expect, it } from 'vitest';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/evidenceQualityContracts';
import {
  EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  EQUITY_FACTOR_FAMILIES,
  EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION,
  EQUITY_RESEARCH_MODEL_CONTRACT,
  type EquityClassification,
  type EquityFactorFamily,
} from '../../src/platform/Scoring/EquityModelContracts';
import {
  EQUITY_PROFILE_WEIGHTS,
  evaluateEquityResearchScore,
  type EquityFactorFamilyInput,
} from '../../src/platform/Scoring/EquityResearchScoring';
import { orchestrateEquityResearch } from '../../src/platform/Scoring/EquityOrchestrator';
import {
  RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY,
  ScoringModelRegistry,
} from '../../src/platform/Scoring/ScoringModelRegistry';
import { createUniversalAssetIdentity } from '../../src/platform/Scoring/UniversalAssetAdapter';

const asset = createUniversalAssetIdentity({ symbol: 'MSFT', assetClass: 'stock', source: 'request' });

const classification: EquityClassification = {
  contractVersion: EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  industry: {
    scheme: 'internal',
    sector: 'Information Technology',
    industry: 'Software',
    source: 'governed-rule:test',
  },
  sizeBucket: 'mega',
  styleTags: ['quality', 'growth'],
  primaryProfile: 'quality-growth',
  classificationSource: 'governed-rule',
};

function evidence(field: string, overrides: Partial<MarketEvidenceQualityRecord> = {}): MarketEvidenceQualityRecord {
  return {
    assetId: asset.assetId,
    providerId: 'test-provider',
    capability: 'stock-research',
    field,
    observedAt: '2026-08-23T14:00:00.000Z',
    retrievedAt: '2026-08-23T14:00:01.000Z',
    freshness: {
      ageMs: 1000,
      maxAgeMs: 60_000,
      evaluatedAt: '2026-08-23T14:00:01.000Z',
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: 'VERIFIED',
    evidenceRef: `test:${field}:1`,
    ...overrides,
  };
}

function family(familyName: EquityFactorFamily, score: number, record = evidence(familyName)): EquityFactorFamilyInput {
  return {
    score,
    componentKeys: [`${familyName}.primary`],
    evidence: [record],
  };
}

describe('Equity P0 registry boundary', () => {
  it('registriert Equity nur als research-only Challenger und lässt den produktiven Stock-Champion unverändert', () => {
    const registry = new ScoringModelRegistry();
    const challenger = registry.get('equity-multifactor', '0.1.0');
    expect(challenger?.lifecycle).toBe('challenger');
    expect(challenger?.alias).toBe('challenger');
    expect(challenger?.assetClasses).toEqual(['stock']);
    expect(challenger?.featureContractVersion).toBe(EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION);
    expect(challenger?.evidencePolicy).toBe('research-only');
    expect(challenger?.scoreEligible).toBe(false);
    expect(challenger?.executorKey).toBe(RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY);

    const productive = registry.resolve(asset);
    expect(productive.status).toBe('RESOLVED');
    if (productive.status !== 'RESOLVED') return;
    expect(productive.model.modelId).toBe('traditional-scoring');
    expect(productive.model.version).toBe('2.1.0');
  });
});

describe('Equity factor-family model', () => {
  it('verwendet nur sechs top-level Faktor-Familien ohne Regime-, Sentiment- oder Pattern-Bonus', () => {
    expect(EQUITY_FACTOR_FAMILIES).toEqual([
      'quality',
      'valuation',
      'growth',
      'momentum',
      'financialStrength',
      'capitalAllocation',
    ]);
    expect(EQUITY_FACTOR_FAMILIES).not.toContain('regime');
    expect(EQUITY_FACTOR_FAMILIES).not.toContain('sentiment');
    expect(EQUITY_FACTOR_FAMILIES).not.toContain('pattern');
    expect(EQUITY_RESEARCH_MODEL_CONTRACT.antiCorrelationRules.some(rule => rule.includes('context-only'))).toBe(true);
  });

  it('hält jeden Primary-Profile-Gewichtssatz normiert auf 1.0', () => {
    for (const weights of Object.values(EQUITY_PROFILE_WEIGHTS)) {
      expect(Object.values(weights).reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1, 10);
    }
  });

  it('berechnet einen research-only Score erst ab ausreichender belegter Familienabdeckung', () => {
    const result = evaluateEquityResearchScore({
      classification,
      families: {
        quality: family('quality', 0.80),
        valuation: family('valuation', 0.60),
        growth: family('growth', 0.90),
        momentum: family('momentum', 0.70),
      },
    });

    expect(result.status).toBe('READY');
    expect(result.researchCompositeScore).toBe(78.24);
    expect(result.familyCoverageCount).toBe(4);
    expect(result.nominalWeightCoverage).toBe(0.85);
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
    expect(result.lineage?.effectiveFeatureFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(result.lineage?.effectiveWeightFingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it('behandelt stale Evidence fail-closed statt sie als neutralen Faktor zu verwenden', () => {
    const staleMomentum = evidence('momentum', {
      freshness: {
        ageMs: 120_000,
        maxAgeMs: 60_000,
        evaluatedAt: '2026-08-23T14:02:00.000Z',
      },
    });
    const result = evaluateEquityResearchScore({
      classification,
      families: {
        quality: family('quality', 0.80),
        valuation: family('valuation', 0.60),
        growth: family('growth', 0.90),
        momentum: family('momentum', 0.70, staleMomentum),
      },
    });

    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.researchCompositeScore).toBeNull();
    expect(result.missingFamilies).toContain('momentum');
    expect(result.warnings).toContain('momentum:EVIDENCE_NOT_ADMISSIBLE');
  });
});

describe('Equity orchestrator identity boundary', () => {
  it('verhindert Cross-Asset-Ausführung', () => {
    const crypto = createUniversalAssetIdentity({ symbol: 'BTC', assetClass: 'crypto', source: 'request' });
    expect(() => orchestrateEquityResearch(crypto, { classification, families: {} }))
      .toThrow(/EQUITY_ORCHESTRATOR_ASSET_CLASS_MISMATCH/);
  });

  it('verhindert Evidence eines anderen Assets', () => {
    const wrongEvidence = evidence('quality', { assetId: 'stock:AAPL' });
    expect(() => orchestrateEquityResearch(asset, {
      classification,
      families: { quality: family('quality', 0.8, wrongEvidence) },
    })).toThrow(/EQUITY_ORCHESTRATOR_EVIDENCE_IDENTITY_MISMATCH/);
  });
});
