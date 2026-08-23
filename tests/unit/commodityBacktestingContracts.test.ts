import { describe, expect, it } from 'vitest';
import {
  COMMODITY_BACKTEST_CONTRACT_VERSION,
  COMMODITY_COST_ASSUMPTION_CONTRACT_VERSION,
  COMMODITY_POINT_IN_TIME_POLICY_VERSION,
  buildCommodityBacktestResult,
  validateCommodityBacktestCostAssumptions,
  validateCommodityBacktestRequest,
  validateCommodityPointInTimeSnapshot,
  type CommodityBacktestRequest,
} from '../../src/platform/Scoring';

function energyRequest(): CommodityBacktestRequest {
  return {
    contractVersion: COMMODITY_BACKTEST_CONTRACT_VERSION,
    modelId: 'commodity-energy-hybrid',
    modelVersion: '0.1.0',
    universeId: 'commodity-energy-research-universe/v1',
    assetClass: 'commodity',
    domains: ['energy'],
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2026-01-01T00:00:00.000Z',
    rebalanceFrequency: 'weekly',
    holdingPeriodDays: 5,
    topN: 5,
    minConfidence: 0.8,
    windowMode: 'walk-forward',
    minimumTrainingObservations: 52,
    costAssumptionContractVersion: COMMODITY_COST_ASSUMPTION_CONTRACT_VERSION,
    costAssumptionId: 'commodity-liquid-futures-usd',
    costAssumptionVersion: '1.0.0-research',
    pointInTimePolicyVersion: COMMODITY_POINT_IN_TIME_POLICY_VERSION,
  };
}

function validPointInTimeValidation() {
  return validateCommodityPointInTimeSnapshot({
    policyVersion: COMMODITY_POINT_IN_TIME_POLICY_VERSION,
    assetId: 'commodity:CMD_WTI_NYMEX',
    decisionAt: '2026-08-22T16:00:00.000Z',
    values: [{
      featureKey: 'market.priceHistory',
      value: 74.2,
      source: 'twelvedata:CL1',
      observedAt: '2026-08-21T20:00:00.000Z',
      availableAt: '2026-08-21T20:01:00.000Z',
      retrievedAt: '2026-08-21T20:02:00.000Z',
      evidenceId: 'commodity-history:twelvedata:CL1:2026-08-21',
      releaseId: null,
      revisionId: null,
    }],
  });
}

function validCostValidation() {
  return validateCommodityBacktestCostAssumptions({
    contractVersion: COMMODITY_COST_ASSUMPTION_CONTRACT_VERSION,
    assumptionId: 'commodity-liquid-futures-usd',
    assumptionVersion: '1.0.0-research',
    effectiveFrom: '2026-08-23T00:00:00.000Z',
    commissionBps: 1,
    slippageBps: 3,
    spreadBps: 2,
    source: 'research-calibration-required',
    executable: false,
  });
}

const EMPTY_METRICS = {
  rankInformationCoefficient: null,
  rankMonotonicity: null,
  hitRateTopN: null,
  annualizedReturn: null,
  annualizedVolatility: null,
  maxDrawdown: null,
  profitFactor: null,
  turnover: null,
  averageHoldingPeriodDays: null,
} as const;

describe('Commodity P2 point-in-time backtesting contracts', () => {
  it('accepts a well-formed Drive-aligned backtest request but grants no scoring authority', () => {
    const validation = validateCommodityBacktestRequest(energyRequest());
    expect(validation.valid).toBe(true);
    expect(validation.blockers).toEqual([]);
  });

  it('rejects a model/domain mismatch before any historical evaluation starts', () => {
    const request: CommodityBacktestRequest = {
      ...energyRequest(),
      domains: ['agriculture'],
    };
    const validation = validateCommodityBacktestRequest(request);
    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain('BACKTEST_MODEL_DOMAIN_NOT_INCLUDED');
  });

  it('blocks CFTC Tuesday observations before their Friday publication becomes available', () => {
    const validation = validateCommodityPointInTimeSnapshot({
      policyVersion: COMMODITY_POINT_IN_TIME_POLICY_VERSION,
      assetId: 'commodity:CMD_WTI_NYMEX',
      decisionAt: '2026-08-19T16:00:00.000Z',
      values: [{
        featureKey: 'positioning.managedMoneyNetPctOi',
        value: 8.5,
        source: 'cftc-cot:disaggregated-futures-only',
        observedAt: '2026-08-18T20:00:00.000Z',
        availableAt: '2026-08-21T19:30:00.000Z',
        retrievedAt: '2026-08-21T19:31:00.000Z',
        evidenceId: 'cftc:2026-08-18:WTI',
        releaseId: 'cftc-cot-2026-08-21',
        revisionId: null,
      }],
    });

    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain(
      'positioning.managedMoneyNetPctOi:LOOKAHEAD_VALUE_NOT_YET_AVAILABLE',
    );
  });

  it('requires explicit CFTC release lineage even after the report becomes available', () => {
    const validation = validateCommodityPointInTimeSnapshot({
      policyVersion: COMMODITY_POINT_IN_TIME_POLICY_VERSION,
      assetId: 'commodity:CMD_WTI_NYMEX',
      decisionAt: '2026-08-22T16:00:00.000Z',
      values: [{
        featureKey: 'positioning.managedMoneyNetPctOi',
        value: 8.5,
        source: 'cftc-cot:disaggregated-futures-only',
        observedAt: '2026-08-18T20:00:00.000Z',
        availableAt: '2026-08-21T19:30:00.000Z',
        retrievedAt: '2026-08-21T19:31:00.000Z',
        evidenceId: 'cftc:2026-08-18:WTI',
        releaseId: null,
        revisionId: null,
      }],
    });

    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain('positioning.managedMoneyNetPctOi:RELEASE_ID_REQUIRED');
  });

  it('requires release and revision lineage for revision-aware USDA/EIA vintages', () => {
    const validation = validateCommodityPointInTimeSnapshot({
      policyVersion: COMMODITY_POINT_IN_TIME_POLICY_VERSION,
      assetId: 'commodity:CMD_CORN_CBOT',
      decisionAt: '2026-08-20T16:00:00.000Z',
      values: [{
        featureKey: 'fundamentals.production',
        value: 100,
        source: 'usda-fas-psd:corn',
        observedAt: '2026-08-01T00:00:00.000Z',
        availableAt: '2026-08-12T16:00:00.000Z',
        retrievedAt: '2026-08-20T15:00:00.000Z',
        evidenceId: 'usda-psd:corn:2026-08',
        releaseId: null,
        revisionId: null,
      }],
    });

    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain('fundamentals.production:RELEASE_ID_REQUIRED');
    expect(validation.blockers).toContain('fundamentals.production:REVISION_AWARE_REVISION_ID_REQUIRED');
  });

  it('allows later retrieval only when the exact historical revision lineage is bound', () => {
    const validation = validateCommodityPointInTimeSnapshot({
      policyVersion: COMMODITY_POINT_IN_TIME_POLICY_VERSION,
      assetId: 'commodity:CMD_CORN_CBOT',
      decisionAt: '2026-08-20T16:00:00.000Z',
      values: [{
        featureKey: 'fundamentals.production',
        value: 100,
        source: 'usda-fas-psd:corn',
        observedAt: '2026-08-01T00:00:00.000Z',
        availableAt: '2026-08-12T16:00:00.000Z',
        retrievedAt: '2026-08-23T10:00:00.000Z',
        evidenceId: 'usda-psd:corn:2026-08:vintage-1',
        releaseId: 'usda-psd-release-2026-08-12',
        revisionId: 'vintage-1',
      }],
    });

    expect(validation.valid).toBe(true);
    expect(validation.eligibleFeatureKeys).toEqual(['fundamentals.production']);
  });

  it('keeps transaction-cost assumptions versioned and validation-only', () => {
    const validation = validCostValidation();
    expect(validation.valid).toBe(true);
  });

  it('does not accept caller booleans in place of actual PIT and cost validation evidence', () => {
    const invalidPit = validateCommodityPointInTimeSnapshot({
      policyVersion: COMMODITY_POINT_IN_TIME_POLICY_VERSION,
      assetId: 'commodity:CMD_WTI_NYMEX',
      decisionAt: '2026-08-19T16:00:00.000Z',
      values: [{
        featureKey: 'positioning.managedMoneyNetPctOi',
        value: 8.5,
        source: 'cftc-cot:disaggregated-futures-only',
        observedAt: '2026-08-18T20:00:00.000Z',
        availableAt: '2026-08-21T19:30:00.000Z',
        retrievedAt: '2026-08-21T19:31:00.000Z',
        evidenceId: 'cftc:2026-08-18:WTI',
        releaseId: 'cftc-cot-2026-08-21',
        revisionId: null,
      }],
    });
    const result = buildCommodityBacktestResult({
      runId: 'bt-energy-invalid-pit',
      request: energyRequest(),
      metrics: EMPTY_METRICS,
      equityCurve: [],
      leakageBlockers: [],
      benchmarkIds: ['commodity-evidence-scoring@1.0.0'],
      pointInTimeValidation: invalidPit,
      costAssumptionValidation: validCostValidation(),
      outOfSampleEvidenceId: 'oos:energy:001',
      correlationEvidenceId: 'correlation:energy:001',
      sensitivityEvidenceId: 'sensitivity:energy:001',
    });

    expect(result.pointInTimeValidated).toBe(false);
    expect(result.promotionEvidenceEligible).toBe(false);
  });

  it('does not mark a run promotion-evidence eligible unless every P2 gate is bound', () => {
    const blocked = buildCommodityBacktestResult({
      runId: 'bt-energy-001',
      request: energyRequest(),
      metrics: EMPTY_METRICS,
      equityCurve: [],
      leakageBlockers: [],
      benchmarkIds: ['commodity-evidence-scoring@1.0.0'],
      pointInTimeValidation: validPointInTimeValidation(),
      costAssumptionValidation: validCostValidation(),
      outOfSampleEvidenceId: 'oos:energy:001',
      correlationEvidenceId: null,
      sensitivityEvidenceId: 'sensitivity:energy:001',
    });
    expect(blocked.promotionEvidenceEligible).toBe(false);
    expect(blocked.authority).toBe('VALIDATION_ONLY');
    expect(blocked.canonical).toBe(false);
    expect(blocked.scoreEligible).toBe(false);

    const complete = buildCommodityBacktestResult({
      runId: 'bt-energy-002',
      request: energyRequest(),
      metrics: EMPTY_METRICS,
      equityCurve: [],
      leakageBlockers: [],
      benchmarkIds: ['commodity-evidence-scoring@1.0.0'],
      pointInTimeValidation: validPointInTimeValidation(),
      costAssumptionValidation: validCostValidation(),
      outOfSampleEvidenceId: 'oos:energy:002',
      correlationEvidenceId: 'correlation:energy:001',
      sensitivityEvidenceId: 'sensitivity:energy:001',
    });
    expect(complete.promotionEvidenceEligible).toBe(true);
    expect(complete.outOfSampleValidated).toBe(true);
    expect(complete.authority).toBe('VALIDATION_ONLY');
    expect(complete.scoreEligible).toBe(false);
  });
});
