import {
  CRYPTO_CATEGORY_ANALYSIS_PROFILES,
  type CryptoAnalysisProfileId,
  type CryptoCategoryAnalysisProfile,
} from '../../CryptoModuleContracts';

/**
 * Supersession bridge for the stale FT-0 Meme profile.
 *
 * SC-3 established crypto-meme-integrity/0.3.0 as a deterministic, source-backed
 * research challenger. This contract lifts the category analysis profile from
 * PENDING_EVIDENCE to SOURCE_DEFINED without promoting it into productive scoring.
 * Productive authority remains ScoringModelRegistry -> ScoringDispatcher only.
 */
export const CRYPTO_MEME_PROFILE_SUPERSESSION_VERSION =
  'fintech-core.crypto/meme-profile-supersession/0.1.0' as const;
export const CRYPTO_MEME_PROFILE_SUPERSEDES =
  'fintech-core.crypto/contracts/0.1.0#meme:PENDING_EVIDENCE' as const;
export const CRYPTO_MEME_PROFILE_SC3_MODEL = 'crypto-meme-integrity/0.3.0' as const;

export const CRYPTO_MEME_SC3_ANALYSIS_PROFILE: CryptoCategoryAnalysisProfile = Object.freeze({
  id: 'meme',
  sourceStatus: 'SOURCE_DEFINED',
  metrics: Object.freeze([
    Object.freeze({ metric: 'liquidity', weight: 0.25, direction: 'POSITIVE' as const }),
    Object.freeze({ metric: 'marketStructure', weight: 0.20, direction: 'POSITIVE' as const }),
    Object.freeze({ metric: 'sentiment', weight: 0.18, direction: 'POSITIVE' as const }),
    Object.freeze({ metric: 'narrative', weight: 0.15, direction: 'POSITIVE' as const }),
    Object.freeze({ metric: 'distribution', weight: 0.12, direction: 'POSITIVE' as const }),
    Object.freeze({ metric: 'exchangeAccess', weight: 0.10, direction: 'POSITIVE' as const }),
  ]),
  hardGates: Object.freeze([
    'buySimulationSuccess',
    'sellSimulationSuccess',
    'liquidityLockWithinPolicy',
    'transferTaxWithinPolicy',
    'contractIntegrityVerified',
    'manipulationEvidenceWithinPolicy',
    'independentMarketConfirmations',
  ]),
  normalization: 'WITHIN_PROFILE',
  scoreAuthority: 'SCORING_DISPATCHER_ONLY',
});

export function resolveEffectiveCryptoCategoryAnalysisProfile(
  profileId: CryptoAnalysisProfileId,
): CryptoCategoryAnalysisProfile {
  if (profileId === 'meme') return CRYPTO_MEME_SC3_ANALYSIS_PROFILE;
  return CRYPTO_CATEGORY_ANALYSIS_PROFILES[profileId];
}
