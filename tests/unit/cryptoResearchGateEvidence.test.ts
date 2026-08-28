import { describe, expect, it } from 'vitest';
import {
  projectDefiResearchHardGates,
  projectMemeResearchHardGates,
} from '../../src/platform/Scoring/CryptoResearchGateEvidence';
import type {
  DefiResearchScoringInput,
  MemeResearchScoringInput,
} from '../../src/platform/Scoring/CryptoCategoryResearchScoring';

function memeInput(): MemeResearchScoringInput {
  return {
    confidence: 0.8,
    liquidity: { liquidityUsdQuality: 1, slippage25kQuality: 1, volumeConsistency7d: 1, spreadQuality: 1, liquidityLockQuality: 1 },
    marketStructure: { return1hQuality: 1, return24hQuality: 1, volumeAcceleration: 1, relativeStrengthVsSector: 1, breakoutQuality: 1, fundingQuality: 1 },
    social: { uniqueAuthors: 1, engagementQuality: 1, mentionVelocity: 1, sentimentConsensus: 1, influencerDiversity: 1, botResistance: 1, marketConfirmations: 2 },
    narrative: 1,
    exchangeAccess: 1,
    holderRisk: { top10HolderShare: 0, top50HolderShare: 0, teamWalletShare: 0, exchangeConcentration: 0, sniperWalletShare: 0, dormantWhaleSupply: 0 },
    rugRisk: { mintAuthority: 0, blacklistAuthority: 0, taxChangeAuthority: 0, liquidityUnlockRisk: 0, proxyUpgradeRisk: 0, deployerConcentration: 0, honeypotSimulationRisk: 0 },
    tokenomicsRisk: 0,
    regulatoryRisk: 0,
    marketRisk: 0,
    hardGates: {
      buySimulationSuccess: true,
      sellSimulationSuccess: true,
      liquidityLockWithinPolicy: true,
      transferTaxWithinPolicy: true,
      contractIntegrityVerified: true,
      manipulationEvidenceWithinPolicy: true,
    },
  };
}

function defiInput(): DefiResearchScoringInput {
  return {
    confidence: 0.8,
    utilization: { activeUsers30d: 1, transactionCount30d: 1, organicVolume30d: 1, tvlStability90d: 1, retention30d: 1, developerActivity: 1 },
    fundamentals: { protocolFees30d: 1, protocolRevenue30d: 1, feeGrowth30d: 1, revenueDiversification: 1 },
    liquidity: { poolDepth100k: 1, volumeToLiquidityRatio: 1, slippage100kQuality: 1, liquidityPersistence30d: 1, marketCount: 1, liquidityDiversification: 1 },
    contractSecurity: { verifiedSource: 1, multipleAudits: 1, formalVerification: 1, immutableCore: 1, timelockedAdmin: 1, multisigSecurity: 1, noUnresolvedExploit: 1, constrainedUpgradeability: 1, lowDependencyRisk: 1, emergencyPauseDesign: 1 },
    oracle: { sourceDiversity: 1, marketDepth: 1, updateLiveness: 1, deviationProtection: 1, manipulationResistance: 1, fallbackQuality: 1 },
    tokenomics: { lowUnlockPressure90d: 1, circulatingSupplyQuality: 1, valueAccrual: 1, lowHolderConcentration: 1, treasuryRunway: 1, stakingSustainability: 1 },
    governance: 1,
    ecosystem: 1,
    risks: { contract: 0, liquidity: 0, oracle: 0, governance: 0, fundamentals: 0, tokenomics: 0, bridge: 0 },
    hardGates: {
      smartContractEvidenceVerified: true,
      oracleRiskWithinPolicy: true,
      unknownAdminCanMint: false,
      unrestrictedPauseFunction: false,
      upgradeAuthoritySingleWallet: false,
      exploitUnresolved: false,
    },
  };
}

describe('crypto research hard-gate evidence', () => {
  it('fails closed without backend research input', () => {
    expect(projectMemeResearchHardGates(undefined).every((entry) => entry.state === 'NOT_COMPUTABLE')).toBe(true);
    expect(projectDefiResearchHardGates(null).every((entry) => entry.state === 'NOT_COMPUTABLE')).toBe(true);
  });

  it('projects meme evidence and keeps market-confirmation threshold explicit', () => {
    const input = memeInput();
    const pass = projectMemeResearchHardGates(input);
    expect(pass.every((entry) => entry.state === 'PASS')).toBe(true);

    const insufficient = projectMemeResearchHardGates({ ...input, social: { ...input.social, marketConfirmations: 1 } });
    expect(insufficient.find((entry) => entry.key === 'independentMarketConfirmations')?.state).toBe('NOT_COMPUTABLE');
  });

  it('maps defi risk flags to explicit blockers', () => {
    const input = defiInput();
    expect(projectDefiResearchHardGates(input).every((entry) => entry.state === 'PASS')).toBe(true);
    const blocked = projectDefiResearchHardGates({ ...input, hardGates: { ...input.hardGates, exploitUnresolved: true } });
    expect(blocked.find((entry) => entry.key === 'exploitUnresolved')?.state).toBe('BLOCKED');
  });
});
