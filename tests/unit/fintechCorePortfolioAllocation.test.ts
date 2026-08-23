import { describe, expect, it } from 'vitest';
import {
  FINTECH_CORE_CONTRACT_VERSION,
  type FinTechCoreWorkflowContext,
} from '../../src/platform/FinTechCore/CoreContracts';
import {
  evaluateDeterministicPortfolioAllocation,
} from '../../src/platform/FinTechCore/Portfolio/DeterministicPortfolioAllocator';
import {
  FINTECH_CORE_PORTFOLIO_ALLOCATION_CONTRACT_VERSION,
  type FinTechCorePortfolioAllocationInput,
  type FinTechCorePortfolioAllocationPolicySnapshot,
  type FinTechCorePortfolioEvidenceSnapshot,
  type FinTechCorePortfolioTargetAllocation,
} from '../../src/platform/FinTechCore/Portfolio/PortfolioAllocationContracts';
import {
  FINTECH_CORE_PORTFOLIO_RISK_PROJECTION_CONTRACT_VERSION,
  projectPortfolioAllocationToRiskEvidence,
} from '../../src/platform/FinTechCore/Portfolio/PortfolioRiskEvidenceProjection';
import {
  FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION,
  type FinTechCoreRiskEvidenceSnapshot,
  type FinTechCoreRiskPolicySnapshot,
} from '../../src/platform/FinTechCore/RiskCompliance/RiskComplianceContracts';
import { evaluateDeterministicRiskGates } from '../../src/platform/FinTechCore/RiskCompliance/DeterministicPreTradeGate';
import { UNIVERSAL_ASSET_CONTRACT_VERSION } from '../../src/platform/Scoring/contracts';

const context: FinTechCoreWorkflowContext = {
  contractVersion: FINTECH_CORE_CONTRACT_VERSION,
  moduleId: 'fintech-core.crypto',
  runId: 'run-portfolio-p1',
  traceId: 'trace-portfolio-p1',
  correlationId: 'corr-portfolio-p1',
  strategyId: 'strategy-portfolio-p1',
  portfolioId: 'portfolio-p1',
  decisionVersion: 'decision/portfolio-p1/v1',
  operatingMode: 'PAPER',
  asset: {
    contractVersion: UNIVERSAL_ASSET_CONTRACT_VERSION,
    assetId: 'crypto:BTC',
    symbol: 'BTC',
    assetClass: 'crypto',
    source: 'registry',
  },
  startedAt: '2026-08-24T00:00:00.000Z',
};

function policy(
  overrides: Partial<FinTechCorePortfolioAllocationPolicySnapshot> = {},
): FinTechCorePortfolioAllocationPolicySnapshot {
  return {
    contractVersion: FINTECH_CORE_PORTFOLIO_ALLOCATION_CONTRACT_VERSION,
    policyId: 'portfolio-policy-p1',
    policyVersion: '1',
    quoteAssetId: 'fiat:USD',
    quoteScale: 2,
    maxAssetWeightBps: 5_000,
    maxPortfolioDeploymentBps: 9_000,
    minCashReserveBps: 1_000,
    rebalanceThresholdBps: 50,
    longOnly: true,
    leverageAllowed: false,
    evidenceRefs: ['policy://portfolio/p1/v1'],
    ...overrides,
  };
}

function portfolio(
  overrides: Partial<FinTechCorePortfolioEvidenceSnapshot> = {},
): FinTechCorePortfolioEvidenceSnapshot {
  return {
    portfolioId: 'portfolio-p1',
    quoteAssetId: 'fiat:USD',
    totalEquity: { atoms: '10000000', scale: 2 },
    cashBalance: { atoms: '2000000', scale: 2 },
    positions: [
      {
        assetId: 'crypto:BTC',
        marketValue: { atoms: '5000000', scale: 2 },
        evidenceRefs: ['portfolio://position/BTC'],
      },
      {
        assetId: 'crypto:ETH',
        marketValue: { atoms: '3000000', scale: 2 },
        evidenceRefs: ['portfolio://position/ETH'],
      },
    ],
    evidenceAuthorityId: 'portfolio-valuation-authority',
    observedAt: '2026-08-24T00:00:05.000Z',
    evidenceRefs: ['portfolio://snapshot/p1'],
    ...overrides,
  };
}

function target(
  assetId: string,
  targetWeightBps: number,
  overrides: Partial<FinTechCorePortfolioTargetAllocation> = {},
): FinTechCorePortfolioTargetAllocation {
  return {
    assetId,
    targetWeightBps,
    targetAuthorityId: 'governed-strategy-allocation',
    targetAuthorityVersion: '1',
    evidenceRefs: [`target://${assetId}`],
    ...overrides,
  };
}

function targets(
  values: readonly FinTechCorePortfolioTargetAllocation[] = [
    target('crypto:BTC', 4_000),
    target('crypto:ETH', 4_000),
    target('crypto:SOL', 1_000),
  ],
): readonly FinTechCorePortfolioTargetAllocation[] {
  return values;
}

function allocationInput(
  overrides: Partial<FinTechCorePortfolioAllocationInput> = {},
): FinTechCorePortfolioAllocationInput {
  return {
    context,
    evaluatedAt: '2026-08-24T00:00:10.000Z',
    policy: policy(),
    portfolio: portfolio(),
    targets: targets(),
    ...overrides,
  };
}

function proposedAllocation() {
  const result = evaluateDeterministicPortfolioAllocation(allocationInput());
  if (result.status !== 'PROPOSED') throw new Error(`test setup failed: ${result.code}`);
  return result;
}

function riskPolicy(
  overrides: Partial<FinTechCoreRiskPolicySnapshot> = {},
): FinTechCoreRiskPolicySnapshot {
  return {
    contractVersion: FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION,
    policyId: 'risk-policy-p1',
    policyVersion: '1',
    quoteScale: 2,
    maxOrderNotional: { atoms: '2000000', scale: 2 },
    maxGrossExposure: { atoms: '9500000', scale: 2 },
    maxDrawdownBps: 2_500,
    minLiquidityCoverageBps: 10_000,
    maxMarketDataAgeSeconds: 60,
    maxCounterpartyEvidenceAgeSeconds: 300,
    portfolioEvidenceAuthorityId: 'portfolio-risk-projection-authority',
    liquidityEvidenceAuthorityId: 'liquidity-authority',
    marketEvidenceAuthorityId: 'market-authority',
    counterpartyAuthorityId: 'counterparty-authority',
    evidenceRefs: ['policy://risk/p1/v1'],
    ...overrides,
  };
}

describe('FinTech Core P1 deterministic portfolio allocation', () => {
  it('produces policy-constrained fixed-point notional deltas without execution authority', () => {
    const result = evaluateDeterministicPortfolioAllocation(allocationInput());
    expect(result.status).toBe('PROPOSED');
    if (result.status !== 'PROPOSED') throw new Error('test setup failed');

    expect(result).toMatchObject({
      portfolioId: 'portfolio-p1',
      policyId: 'portfolio-policy-p1',
      policyVersion: '1',
      quoteAssetId: 'fiat:USD',
      quoteScale: 2,
      totalTargetWeightBps: 9_000,
      reservedCashWeightBps: 1_000,
      reservedCashNotional: { atoms: '1000000', scale: 2 },
      executionHandoffEligible: false,
    });
    expect(result.inputHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(result.outputHash).toMatch(/^sha256:[0-9a-f]{64}$/);

    expect(result.deltas).toEqual([
      expect.objectContaining({
        assetId: 'crypto:BTC',
        currentWeightBps: 5_000,
        targetWeightBps: 4_000,
        currentNotional: { atoms: '5000000', scale: 2 },
        targetNotional: { atoms: '4000000', scale: 2 },
        deltaNotional: { atoms: '-1000000', scale: 2 },
        rebalanceRequired: true,
        side: 'SELL',
      }),
      expect.objectContaining({
        assetId: 'crypto:ETH',
        currentWeightBps: 3_000,
        targetWeightBps: 4_000,
        deltaNotional: { atoms: '1000000', scale: 2 },
        rebalanceRequired: true,
        side: 'BUY',
      }),
      expect.objectContaining({
        assetId: 'crypto:SOL',
        currentWeightBps: 0,
        targetWeightBps: 1_000,
        currentNotional: { atoms: '0', scale: 2 },
        targetNotional: { atoms: '1000000', scale: 2 },
        deltaNotional: { atoms: '1000000', scale: 2 },
        rebalanceRequired: true,
        side: 'BUY',
      }),
    ]);
  });

  it('is replay-stable even when target input order changes', () => {
    const first = evaluateDeterministicPortfolioAllocation(allocationInput());
    const second = evaluateDeterministicPortfolioAllocation(allocationInput({
      targets: [...targets()].reverse(),
    }));
    if (first.status !== 'PROPOSED' || second.status !== 'PROPOSED') throw new Error('test setup failed');

    expect(first.inputHash).toBe(second.inputHash);
    expect(first.outputHash).toBe(second.outputHash);
    expect(first.deltas).toEqual(second.deltas);
  });

  it('binds target authority and evidence lineage into replay identity', () => {
    const first = evaluateDeterministicPortfolioAllocation(allocationInput());
    const authorityChanged = evaluateDeterministicPortfolioAllocation(allocationInput({
      targets: targets([
        target('crypto:BTC', 4_000, { targetAuthorityVersion: '2' }),
        target('crypto:ETH', 4_000),
        target('crypto:SOL', 1_000),
      ]),
    }));
    const evidenceChanged = evaluateDeterministicPortfolioAllocation(allocationInput({
      portfolio: portfolio({ evidenceRefs: ['portfolio://snapshot/p1/revised'] }),
    }));

    if (first.status !== 'PROPOSED' || authorityChanged.status !== 'PROPOSED' || evidenceChanged.status !== 'PROPOSED') {
      throw new Error('test setup failed');
    }
    expect(authorityChanged.inputHash).not.toBe(first.inputHash);
    expect(authorityChanged.outputHash).not.toBe(first.outputHash);
    expect(evidenceChanged.inputHash).not.toBe(first.inputHash);
    expect(evidenceChanged.outputHash).not.toBe(first.outputHash);
  });

  it('respects the rebalance threshold without hiding the underlying notional drift', () => {
    const result = evaluateDeterministicPortfolioAllocation(allocationInput({
      policy: policy({ maxPortfolioDeploymentBps: 8_000, minCashReserveBps: 2_000 }),
      targets: targets([
        target('crypto:BTC', 4_980),
        target('crypto:ETH', 3_020),
      ]),
    }));
    expect(result.status).toBe('PROPOSED');
    if (result.status !== 'PROPOSED') throw new Error('test setup failed');

    expect(result.deltas).toEqual([
      expect.objectContaining({
        assetId: 'crypto:BTC',
        deltaNotional: { atoms: '-20000', scale: 2 },
        rebalanceRequired: false,
        side: null,
      }),
      expect.objectContaining({
        assetId: 'crypto:ETH',
        deltaNotional: { atoms: '20000', scale: 2 },
        rebalanceRequired: false,
        side: null,
      }),
    ]);
  });

  it('fails closed on workflow time drift, portfolio accounting drift, target authority or target evidence gaps', () => {
    expect(evaluateDeterministicPortfolioAllocation(allocationInput({
      evaluatedAt: '2026-08-23T23:59:59.000Z',
    }))).toMatchObject({
      status: 'NOT_COMPUTABLE',
      code: 'WORKFLOW_CONTEXT_INVALID',
    });

    expect(evaluateDeterministicPortfolioAllocation(allocationInput({
      portfolio: portfolio({ cashBalance: { atoms: '1999999', scale: 2 } }),
    }))).toMatchObject({
      status: 'NOT_COMPUTABLE',
      code: 'PORTFOLIO_BALANCE_MISMATCH',
      executionHandoffEligible: false,
    });

    expect(evaluateDeterministicPortfolioAllocation(allocationInput({
      targets: targets([
        target('crypto:BTC', 4_000, { targetAuthorityId: '' }),
      ]),
    }))).toMatchObject({
      status: 'NOT_COMPUTABLE',
      code: 'TARGET_AUTHORITY_MISSING',
      executionHandoffEligible: false,
    });

    expect(evaluateDeterministicPortfolioAllocation(allocationInput({
      targets: targets([
        target('crypto:BTC', 4_000, { evidenceRefs: [] }),
      ]),
    }))).toMatchObject({
      status: 'NOT_COMPUTABLE',
      code: 'TARGET_EVIDENCE_MISSING',
      executionHandoffEligible: false,
    });
  });

  it('blocks concentration, deployment and unsupported live/leverage semantics', () => {
    expect(evaluateDeterministicPortfolioAllocation(allocationInput({
      targets: targets([
        target('crypto:BTC', 5_001),
      ]),
    }))).toMatchObject({
      status: 'BLOCKED',
      code: 'TARGET_WEIGHT_EXCEEDS_ASSET_LIMIT',
    });

    expect(evaluateDeterministicPortfolioAllocation(allocationInput({
      policy: policy({ maxAssetWeightBps: 10_000 }),
      targets: targets([
        target('crypto:BTC', 9_001),
      ]),
    }))).toMatchObject({
      status: 'BLOCKED',
      code: 'PORTFOLIO_DEPLOYMENT_EXCEEDED',
    });

    for (const operatingMode of ['GUARDED_LIVE', 'PRODUCTION', 'EMERGENCY'] as const) {
      expect(evaluateDeterministicPortfolioAllocation(allocationInput({
        context: { ...context, operatingMode },
      }))).toMatchObject({
        status: 'BLOCKED',
        code: 'MODE_NOT_ALLOWED',
        executionHandoffEligible: false,
      });
    }

    expect(evaluateDeterministicPortfolioAllocation(allocationInput({
      policy: {
        ...policy(),
        leverageAllowed: true,
      } as unknown as FinTechCorePortfolioAllocationPolicySnapshot,
    }))).toMatchObject({
      status: 'BLOCKED',
      code: 'UNSUPPORTED_SHORT_OR_LEVERAGE',
    });
  });

  it('projects only portfolio-derived FT-5 risk evidence and keeps execution authority false', () => {
    const proposal = proposedAllocation();
    const projection = projectPortfolioAllocationToRiskEvidence({
      proposal,
      portfolio: portfolio(),
      projectionAuthority: {
        authorityId: 'portfolio-risk-projection-authority',
        authorityVersion: '1',
        evidenceRefs: ['authority://portfolio-risk-projection/v1'],
      },
      projectedAt: '2026-08-24T00:00:11.000Z',
    });

    expect(projection.status).toBe('PROJECTED');
    if (projection.status !== 'PROJECTED') throw new Error('test setup failed');
    expect(projection.contractVersion).toBe(FINTECH_CORE_PORTFOLIO_RISK_PROJECTION_CONTRACT_VERSION);
    expect(projection.riskEvidence).toMatchObject({
      projectedGrossExposure: { atoms: '9000000', scale: 2 },
      currentEquity: { atoms: '10000000', scale: 2 },
      portfolioEvidenceAuthorityId: 'portfolio-risk-projection-authority',
    });
    expect(projection.projectionHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(projection.executionHandoffEligible).toBe(false);
  });

  it('feeds the existing FT-5 risk gate without creating a P1 approval authority', () => {
    const proposal = proposedAllocation();
    const projection = projectPortfolioAllocationToRiskEvidence({
      proposal,
      portfolio: portfolio(),
      projectionAuthority: {
        authorityId: 'portfolio-risk-projection-authority',
        authorityVersion: '1',
        evidenceRefs: ['authority://portfolio-risk-projection/v1'],
      },
      projectedAt: '2026-08-24T00:00:11.000Z',
    });
    if (projection.status !== 'PROJECTED') throw new Error('test setup failed');

    const riskEvidence: FinTechCoreRiskEvidenceSnapshot = {
      orderNotional: { atoms: '1000000', scale: 2 },
      orderEvidenceRefs: ['order://candidate/SOL'],
      ...projection.riskEvidence,
      peakEquity: { atoms: '10500000', scale: 2 },
      availableLiquidity: { atoms: '2500000', scale: 2 },
      liquidityEvidenceAuthorityId: 'liquidity-authority',
      liquidityEvidenceRefs: ['liquidity://SOL'],
      marketDataObservedAt: '2026-08-24T00:00:09.000Z',
      marketEvidenceAuthorityId: 'market-authority',
      marketEvidenceRefs: ['market://SOL'],
      counterparty: {
        controlId: 'COUNTERPARTY',
        state: 'PASS',
        authorityId: 'counterparty-authority',
        provider: 'paper-counterparty-evidence',
        observedAt: '2026-08-24T00:00:09.000Z',
        evidenceRefs: ['counterparty://paper'],
      },
    };

    const riskDecision = evaluateDeterministicRiskGates({
      evaluatedAt: '2026-08-24T00:00:12.000Z',
      riskPolicy: riskPolicy(),
      riskEvidence,
    });

    expect(riskDecision.outcome).toBe('APPROVED');
    expect(riskDecision.gates.find((gate) => gate.gateId === 'GROSS_EXPOSURE')).toMatchObject({
      outcome: 'APPROVED',
    });
    expect(projection.executionHandoffEligible).toBe(false);
  });

  it('fails FT-5 authority binding when a caller substitutes the raw valuation authority for the governed projection authority', () => {
    const proposal = proposedAllocation();
    const projection = projectPortfolioAllocationToRiskEvidence({
      proposal,
      portfolio: portfolio(),
      projectionAuthority: {
        authorityId: 'portfolio-risk-projection-authority',
        authorityVersion: '1',
        evidenceRefs: ['authority://portfolio-risk-projection/v1'],
      },
      projectedAt: '2026-08-24T00:00:11.000Z',
    });
    if (projection.status !== 'PROJECTED') throw new Error('test setup failed');

    const riskDecision = evaluateDeterministicRiskGates({
      evaluatedAt: '2026-08-24T00:00:12.000Z',
      riskPolicy: riskPolicy({ portfolioEvidenceAuthorityId: 'portfolio-valuation-authority' }),
      riskEvidence: {
        orderNotional: { atoms: '1000000', scale: 2 },
        orderEvidenceRefs: ['order://candidate/SOL'],
        ...projection.riskEvidence,
        peakEquity: { atoms: '10500000', scale: 2 },
        availableLiquidity: { atoms: '2500000', scale: 2 },
        liquidityEvidenceAuthorityId: 'liquidity-authority',
        liquidityEvidenceRefs: ['liquidity://SOL'],
        marketDataObservedAt: '2026-08-24T00:00:09.000Z',
        marketEvidenceAuthorityId: 'market-authority',
        marketEvidenceRefs: ['market://SOL'],
        counterparty: {
          controlId: 'COUNTERPARTY',
          state: 'PASS',
          authorityId: 'counterparty-authority',
          provider: 'paper-counterparty-evidence',
          observedAt: '2026-08-24T00:00:09.000Z',
          evidenceRefs: ['counterparty://paper'],
        },
      },
    });

    expect(riskDecision.outcome).toBe('NOT_COMPUTABLE');
    expect(riskDecision.gates.find((gate) => gate.gateId === 'GROSS_EXPOSURE')).toMatchObject({
      outcome: 'NOT_COMPUTABLE',
    });
  });

  it('fails closed when projection lineage or accounting is tampered', () => {
    const proposal = proposedAllocation();

    expect(projectPortfolioAllocationToRiskEvidence({
      proposal: { ...proposal, outputHash: 'tampered' },
      portfolio: portfolio(),
      projectionAuthority: {
        authorityId: 'portfolio-risk-projection-authority',
        authorityVersion: '1',
        evidenceRefs: ['authority://portfolio-risk-projection/v1'],
      },
      projectedAt: '2026-08-24T00:00:11.000Z',
    })).toMatchObject({
      status: 'NOT_COMPUTABLE',
      code: 'SOURCE_HASH_INVALID',
    });

    expect(projectPortfolioAllocationToRiskEvidence({
      proposal: {
        ...proposal,
        reservedCashNotional: { atoms: '999999', scale: 2 },
      },
      portfolio: portfolio(),
      projectionAuthority: {
        authorityId: 'portfolio-risk-projection-authority',
        authorityVersion: '1',
        evidenceRefs: ['authority://portfolio-risk-projection/v1'],
      },
      projectedAt: '2026-08-24T00:00:11.000Z',
    })).toMatchObject({
      status: 'NOT_COMPUTABLE',
      code: 'SOURCE_ACCOUNTING_MISMATCH',
    });
  });
});
