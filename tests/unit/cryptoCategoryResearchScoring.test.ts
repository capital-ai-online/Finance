import { describe, expect, it } from 'vitest';
import {
  evaluateDefiResearchScore,
  evaluateMemeResearchScore,
  type DefiResearchScoringInput,
  type MemeResearchScoringInput,
} from '../../src/platform/Scoring/CryptoCategoryResearchScoring';

const defiBase = (): DefiResearchScoringInput => ({
  confidence: 0.9,
  utilization: {
    activeUsers30d: 0.8,
    transactionCount30d: 0.8,
    organicVolume30d: 0.8,
    tvlStability90d: 0.8,
    retention30d: 0.8,
    developerActivity: 0.8,
  },
  fundamentals: {
    protocolFees30d: 0.8,
    protocolRevenue30d: 0.8,
    feeGrowth30d: 0.8,
    revenueDiversification: 0.8,
  },
  liquidity: {
    poolDepth100k: 0.8,
    volumeToLiquidityRatio: 0.8,
    slippage100kQuality: 0.8,
    liquidityPersistence30d: 0.8,
    marketCount: 0.8,
    liquidityDiversification: 0.8,
  },
  contractSecurity: {
    verifiedSource: 0.8,
    multipleAudits: 0.8,
    formalVerification: 0.8,
    immutableCore: 0.8,
    timelockedAdmin: 0.8,
    multisigSecurity: 0.8,
    noUnresolvedExploit: 0.8,
    constrainedUpgradeability: 0.8,
    lowDependencyRisk: 0.8,
    emergencyPauseDesign: 0.8,
  },
  oracle: {
    sourceDiversity: 0.8,
    marketDepth: 0.8,
    updateLiveness: 0.8,
    deviationProtection: 0.8,
    manipulationResistance: 0.8,
    fallbackQuality: 0.8,
  },
  tokenomics: {
    lowUnlockPressure90d: 0.8,
    circulatingSupplyQuality: 0.8,
    valueAccrual: 0.8,
    lowHolderConcentration: 0.8,
    treasuryRunway: 0.8,
    stakingSustainability: 0.8,
  },
  governance: 0.8,
  ecosystem: 0.8,
  risks: {
    contract: 0.2,
    liquidity: 0.2,
    oracle: 0.2,
    governance: 0.2,
    fundamentals: 0.2,
    tokenomics: 0.2,
    bridge: 0.2,
  },
  hardGates: {
    smartContractEvidenceVerified: true,
    oracleRiskWithinPolicy: true,
    unknownAdminCanMint: false,
    unrestrictedPauseFunction: false,
    upgradeAuthoritySingleWallet: false,
    exploitUnresolved: false,
  },
});

const memeBase = (): MemeResearchScoringInput => ({
  confidence: 0.9,
  liquidity: {
    liquidityUsdQuality: 0.8,
    slippage25kQuality: 0.8,
    volumeConsistency7d: 0.8,
    spreadQuality: 0.8,
    liquidityLockQuality: 0.8,
  },
  marketStructure: {
    return1hQuality: 0.8,
    return24hQuality: 0.8,
    volumeAcceleration: 0.8,
    relativeStrengthVsSector: 0.8,
    breakoutQuality: 0.8,
    fundingQuality: 0.8,
  },
  social: {
    uniqueAuthors: 0.8,
    engagementQuality: 0.8,
    mentionVelocity: 0.8,
    sentimentConsensus: 0.8,
    influencerDiversity: 0.8,
    botResistance: 0.8,
    marketConfirmations: 2,
  },
  narrative: 0.8,
  exchangeAccess: 0.8,
  holderRisk: {
    top10HolderShare: 0.1,
    top50HolderShare: 0.1,
    teamWalletShare: 0.1,
    exchangeConcentration: 0.1,
    sniperWalletShare: 0.1,
    dormantWhaleSupply: 0.1,
  },
  rugRisk: {
    mintAuthority: 0.1,
    blacklistAuthority: 0.1,
    taxChangeAuthority: 0.1,
    liquidityUnlockRisk: 0.1,
    proxyUpgradeRisk: 0.1,
    deployerConcentration: 0.1,
    honeypotSimulationRisk: 0.1,
  },
  tokenomicsRisk: 0.1,
  regulatoryRisk: 0.1,
  marketRisk: 0.1,
  hardGates: {
    buySimulationSuccess: true,
    sellSimulationSuccess: true,
    liquidityLockWithinPolicy: true,
    transferTaxWithinPolicy: true,
    contractIntegrityVerified: true,
    manipulationEvidenceWithinPolicy: true,
  },
});

describe('Meme/DeFi deterministic research scoring 0.3.0', () => {
  it('calculates the source-defined DeFi composite while leaving ungoverned risk adjustment unset', () => {
    const result = evaluateDefiResearchScore(defiBase());
    expect(result.status).toBe('READY');
    expect(result.modelVersion).toBe('0.3.0');
    expect(result.researchCompositeScore).toBe(80);
    expect(result.confidenceAdjustedScore).toBe(72);
    expect(result.riskScore).toBe(20);
    expect(result.riskAdjustedScore).toBeNull();
    expect(result.warnings).toContain('RISK_PENALTY_WEIGHT_NOT_GOVERNED: riskAdjustedScore intentionally remains null.');
    expect(result.lineage?.effectiveFeatureFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
  });

  it('applies an explicitly supplied research risk-penalty weight deterministically', () => {
    const result = evaluateDefiResearchScore({ ...defiBase(), riskPenaltyWeight: 0.35 });
    expect(result.riskAdjustedScore).toBe(65);
  });

  it('blocks DeFi when a hard security gate fails', () => {
    const base = defiBase();
    const result = evaluateDefiResearchScore({
      ...base,
      hardGates: { ...base.hardGates, exploitUnresolved: true },
    });
    expect(result.status).toBe('BLOCKED');
    expect(result.blockers).toContain('UNRESOLVED_EXPLOIT');
  });

  it('fails DeFi closed instead of accepting out-of-range or neutralized evidence', () => {
    const base = defiBase();
    const result = evaluateDefiResearchScore({
      ...base,
      utilization: { ...base.utilization, activeUsers30d: Number.NaN },
    });
    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.researchCompositeScore).toBeNull();
    expect(result.missingFields).toContain('utilization.activeUsers30d');
  });

  it('calculates the source-defined Meme composite and distribution risk once', () => {
    const result = evaluateMemeResearchScore(memeBase());
    expect(result.status).toBe('READY');
    expect(result.modelVersion).toBe('0.3.0');
    expect(result.researchCompositeScore).toBe(81.2);
    expect(result.confidenceAdjustedScore).toBe(73.08);
    expect(result.riskScore).toBe(13.7);
    expect(result.riskAdjustedScore).toBeNull();
    expect(result.factors.distribution).toBeCloseTo(0.9, 10);
  });

  it('requires at least two market confirmations before social evidence can participate', () => {
    const base = memeBase();
    const result = evaluateMemeResearchScore({
      ...base,
      social: { ...base.social, marketConfirmations: 1 },
    });
    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.researchCompositeScore).toBeNull();
    expect(result.warnings).toContain('SOCIAL_SIGNAL_REQUIRES_TWO_MARKET_CONFIRMATIONS');
  });

  it('hard-blocks Meme honeypot and contract-integrity failures', () => {
    const base = memeBase();
    const result = evaluateMemeResearchScore({
      ...base,
      hardGates: {
        ...base.hardGates,
        sellSimulationSuccess: false,
        contractIntegrityVerified: false,
      },
    });
    expect(result.status).toBe('BLOCKED');
    expect(result.blockers).toEqual(expect.arrayContaining(['SELL_HONEYPOT', 'CONTRACT_INTEGRITY_NOT_VERIFIED']));
  });
});
