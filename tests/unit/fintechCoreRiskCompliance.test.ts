import { describe, expect, it } from 'vitest';
import {
  FINTECH_CORE_CONTRACT_VERSION,
  type FinTechCoreWorkflowContext,
} from '../../src/platform/FinTechCore/CoreContracts';
import {
  evaluateDeterministicComplianceGates,
  evaluateDeterministicRiskGates,
  evaluatePreTradeAuthorization,
} from '../../src/platform/FinTechCore/RiskCompliance/DeterministicPreTradeGate';
import {
  FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION,
  type ComplianceControlId,
  type ExternalControlEvidence,
  type FinTechCorePreTradeEvaluationInput,
} from '../../src/platform/FinTechCore/RiskCompliance/RiskComplianceContracts';
import { buildRiskComplianceDecisionRecords } from '../../src/platform/FinTechCore/RiskCompliance/RiskComplianceDecisionRecords';
import { UNIVERSAL_ASSET_CONTRACT_VERSION } from '../../src/platform/Scoring/contracts';

const evaluatedAt = '2026-08-21T08:00:00.000Z';
const fp = (atoms: string, scale = 2) => Object.freeze({ atoms, scale });
const authorityFor = (controlId: string) => `AUTH-FT5-${controlId}`;

const baseContext: FinTechCoreWorkflowContext = {
  contractVersion: FINTECH_CORE_CONTRACT_VERSION,
  moduleId: 'fintech-core.crypto',
  runId: 'run-ft5-1',
  traceId: 'trace-ft5-1',
  correlationId: 'corr-ft5-1',
  strategyId: 'strategy-ft5-1',
  portfolioId: 'portfolio-ft5-1',
  decisionVersion: 'decision/ft5/v1',
  operatingMode: 'PAPER',
  asset: {
    contractVersion: UNIVERSAL_ASSET_CONTRACT_VERSION,
    assetId: 'crypto:BTC',
    symbol: 'BTC',
    assetClass: 'crypto',
    source: 'registry',
  },
  startedAt: '2026-08-21T07:59:00.000Z',
};

function control(
  controlId: ComplianceControlId,
  state: ExternalControlEvidence<ComplianceControlId>['state'] = 'PASS',
): ExternalControlEvidence<ComplianceControlId> {
  return Object.freeze({
    controlId,
    state,
    authorityId: authorityFor(controlId),
    provider: `verified-${controlId.toLowerCase()}-provider`,
    observedAt: '2026-08-21T07:59:30.000Z',
    evidenceRefs: [`evidence://ft5/${controlId.toLowerCase()}`],
    reason: state === 'PASS' ? undefined : `${controlId} test state ${state}`,
  });
}

function makeInput(context: FinTechCoreWorkflowContext = baseContext): FinTechCorePreTradeEvaluationInput {
  const requiredControls: readonly ComplianceControlId[] = [
    'KYC', 'AML', 'SANCTIONS', 'WALLET_SCREENING', 'JURISDICTION', 'TRAVEL_RULE',
  ];
  const controlAuthorityIds = Object.fromEntries(
    requiredControls.map((controlId) => [controlId, authorityFor(controlId)]),
  ) as Partial<Record<ComplianceControlId, string>>;

  return {
    context,
    evaluatedAt,
    riskPolicy: {
      contractVersion: FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION,
      policyId: 'risk-policy-owner-snapshot',
      policyVersion: '1',
      quoteScale: 2,
      maxOrderNotional: fp('5000000'),
      maxGrossExposure: fp('20000000'),
      maxDrawdownBps: 1000,
      minLiquidityCoverageBps: 20000,
      maxMarketDataAgeSeconds: 60,
      maxCounterpartyEvidenceAgeSeconds: 300,
      portfolioEvidenceAuthorityId: 'AUTH-FT5-PORTFOLIO',
      liquidityEvidenceAuthorityId: 'AUTH-FT5-LIQUIDITY',
      marketEvidenceAuthorityId: 'AUTH-FT5-MARKET',
      counterpartyAuthorityId: 'AUTH-FT5-COUNTERPARTY',
      evidenceRefs: ['evidence://ft5/risk-policy'],
    },
    riskEvidence: {
      orderNotional: fp('1000000'),
      orderEvidenceRefs: ['evidence://ft5/order'],
      projectedGrossExposure: fp('3000000'),
      peakEquity: fp('10000000'),
      currentEquity: fp('9500000'),
      portfolioEvidenceAuthorityId: 'AUTH-FT5-PORTFOLIO',
      portfolioEvidenceRefs: ['evidence://ft5/portfolio'],
      availableLiquidity: fp('3000000'),
      liquidityEvidenceAuthorityId: 'AUTH-FT5-LIQUIDITY',
      liquidityEvidenceRefs: ['evidence://ft5/liquidity'],
      marketDataObservedAt: '2026-08-21T07:59:50.000Z',
      marketEvidenceAuthorityId: 'AUTH-FT5-MARKET',
      marketEvidenceRefs: ['evidence://ft5/market'],
      counterparty: {
        controlId: 'COUNTERPARTY',
        state: 'PASS',
        authorityId: 'AUTH-FT5-COUNTERPARTY',
        provider: 'verified-counterparty-provider',
        observedAt: '2026-08-21T07:59:00.000Z',
        evidenceRefs: ['evidence://ft5/counterparty'],
      },
    },
    compliancePolicy: {
      contractVersion: FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION,
      policyId: 'compliance-policy-owner-snapshot',
      policyVersion: '1',
      requiredControls,
      controlAuthorityIds,
      maxEvidenceAgeSeconds: 300,
      evidenceRefs: ['evidence://ft5/compliance-policy'],
    },
    complianceEvidence: {
      controls: Object.fromEntries(requiredControls.map((controlId) => [controlId, control(controlId)])),
    },
  };
}

describe('FinTech Core FT-5 deterministic risk + compliance', () => {
  it('approves all deterministic risk gates when evidence is complete, authority-bound and inside policy limits', () => {
    const decision = evaluateDeterministicRiskGates(makeInput());
    expect(decision.outcome).toBe('APPROVED');
    expect(decision.gates.map((item) => item.gateId)).toEqual([
      'ORDER_NOTIONAL', 'GROSS_EXPOSURE', 'DRAWDOWN', 'LIQUIDITY', 'STALENESS', 'COUNTERPARTY',
    ]);
    expect(decision.gates.every((item) => item.outcome === 'APPROVED')).toBe(true);
  });

  it('rejects an order whose notional exceeds the externally versioned policy limit', () => {
    const input = makeInput();
    const decision = evaluateDeterministicRiskGates({
      ...input,
      riskEvidence: { ...input.riskEvidence, orderNotional: fp('6000000') },
    });
    expect(decision.outcome).toBe('REJECTED');
    expect(decision.gates.find((item) => item.gateId === 'ORDER_NOTIONAL')?.outcome).toBe('REJECTED');
  });

  it('fails closed when market evidence is stale or comes from the wrong authority', () => {
    const input = makeInput();
    const stale = evaluateDeterministicRiskGates({
      ...input,
      riskEvidence: { ...input.riskEvidence, marketDataObservedAt: '2026-08-21T07:50:00.000Z' },
    });
    expect(stale.outcome).toBe('NOT_COMPUTABLE');

    const wrongAuthority = evaluateDeterministicRiskGates({
      ...input,
      riskEvidence: { ...input.riskEvidence, marketEvidenceAuthorityId: 'AUTH-UNTRUSTED' },
    });
    expect(wrongAuthority.outcome).toBe('NOT_COMPUTABLE');
  });

  it('does not invent a missing required compliance control', () => {
    const input = makeInput();
    const controls = { ...input.complianceEvidence.controls };
    delete controls.SANCTIONS;
    const decision = evaluateDeterministicComplianceGates({
      ...input,
      complianceEvidence: { controls },
    });
    expect(decision.outcome).toBe('NOT_COMPUTABLE');
    expect(decision.controls.find((item) => item.gateId === 'SANCTIONS')?.outcome).toBe('NOT_COMPUTABLE');
  });

  it('rejects authoritative sanctions failure and blocks PASS from an unbound authority', () => {
    const input = makeInput();
    const rejected = evaluateDeterministicComplianceGates({
      ...input,
      complianceEvidence: {
        controls: { ...input.complianceEvidence.controls, SANCTIONS: control('SANCTIONS', 'FAIL') },
      },
    });
    expect(rejected.outcome).toBe('REJECTED');

    const wrongAuthority = evaluateDeterministicComplianceGates({
      ...input,
      complianceEvidence: {
        controls: {
          ...input.complianceEvidence.controls,
          SANCTIONS: { ...control('SANCTIONS'), authorityId: 'AUTH-UNTRUSTED' },
        },
      },
    });
    expect(wrongAuthority.outcome).toBe('NOT_COMPUTABLE');
  });

  it('propagates manual-review evidence without turning it into approval', () => {
    const input = makeInput();
    const review = evaluateDeterministicComplianceGates({
      ...input,
      complianceEvidence: {
        controls: { ...input.complianceEvidence.controls, WALLET_SCREENING: control('WALLET_SCREENING', 'REVIEW_REQUIRED') },
      },
    });
    expect(review.outcome).toBe('REVIEW_REQUIRED');
  });

  it('never makes an OrderIntent handoff eligible in FT-5, including a manually constructed live-mode context', () => {
    const paper = evaluatePreTradeAuthorization(makeInput());
    expect(paper.risk.outcome).toBe('APPROVED');
    expect(paper.compliance.outcome).toBe('APPROVED');
    expect(paper.executionHandoffEligible).toBe(false);

    const futureLiveContext: FinTechCoreWorkflowContext = { ...baseContext, operatingMode: 'GUARDED_LIVE' };
    const futureLive = evaluatePreTradeAuthorization(makeInput(futureLiveContext));
    expect(futureLive.risk.outcome).toBe('APPROVED');
    expect(futureLive.compliance.outcome).toBe('APPROVED');
    expect(futureLive.executionHandoffEligible).toBe(false);
  });

  it('maps risk and compliance outcomes into existing append-only FT-3 decision records', () => {
    const input = makeInput();
    const authorization = evaluatePreTradeAuthorization(input);
    const records = buildRiskComplianceDecisionRecords({
      context: input.context,
      authorization,
      riskDecisionId: 'risk-decision-ft5-1',
      complianceDecisionId: 'compliance-decision-ft5-1',
      riskInputHash: 'risk-input-hash',
      riskOutputHash: 'risk-output-hash',
      complianceInputHash: 'compliance-input-hash',
      complianceOutputHash: 'compliance-output-hash',
    });
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ decisionType: 'PRE_TRADE_RISK_GATE', outcome: 'APPROVED' });
    expect(records[1]).toMatchObject({ decisionType: 'PRE_TRADE_COMPLIANCE_GATE', outcome: 'APPROVED' });
    expect(records[0].runId).toBe(input.context.runId);
    expect(records[1].correlationId).toBe(input.context.correlationId);
  });
});
