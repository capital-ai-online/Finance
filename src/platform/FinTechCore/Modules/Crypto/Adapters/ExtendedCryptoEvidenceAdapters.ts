import type { CryptoFeatureEvidence, CryptoFeaturePrimitive } from '../CryptoCategoryFeatureContracts';
import type { GoPlusTokenSecurityEvidence } from '../../../../MarketData/providers/GoPlusTokenSecurityProvider';
import type { CoinGlassDerivativesEvidence, CoinGlassUnlockEvidence } from '../../../../MarketData/providers/CoinGlassCryptoEvidenceProvider';
import type { LunarCrushSocialEvidence } from '../../../../MarketData/providers/LunarCrushSocialEvidenceProvider';
import type { MessariProtocolUsageEvidence } from '../../../../MarketData/providers/MessariProtocolEvidenceProvider';
import type { DuneSavedQueryEvidence } from '../../../../MarketData/providers/DuneQueryEvidenceProvider';

export const EXTENDED_CRYPTO_EVIDENCE_ADAPTER_VERSION = 'fintech-core.crypto/extended-evidence-adapters/1.0.0' as const;

function evidence(
  key: string,
  value: CryptoFeaturePrimitive | null,
  provider: string,
  evidenceRef: string | null,
  observedAt: string | null,
  retrievedAt: string,
  status: CryptoFeatureEvidence['status'],
  reason?: string,
): CryptoFeatureEvidence {
  const verified = status === 'VERIFIED' && value !== null && evidenceRef !== null;
  return Object.freeze({
    key,
    status: verified ? 'VERIFIED' : status === 'VERIFIED' ? 'NOT_AVAILABLE' : status,
    value: verified ? value : null,
    provider,
    evidenceRefs: verified ? Object.freeze([evidenceRef]) : Object.freeze([]),
    observedAt: verified ? observedAt : null,
    retrievedAt,
    degraded: status !== 'VERIFIED',
    reason: verified ? reason : reason ?? 'Provider evidence is unavailable, invalid or lacks provenance.',
  });
}

function providerStatus(status: string): CryptoFeatureEvidence['status'] {
  if (status === 'VERIFIED' || status === 'PARTIAL') return 'VERIFIED';
  if (status === 'STALE') return 'STALE';
  if (status === 'INVALID') return 'INVALID';
  return 'NOT_AVAILABLE';
}

function topShare(items: readonly { percent: number | null }[]): number | null {
  const values = items.map((item) => item.percent).filter((value): value is number => value !== null && Number.isFinite(value));
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) : null;
}

function lockedShare(items: readonly { percent: number | null; isLocked: boolean | null }[]): number | null {
  const locked = items
    .filter((item) => item.isLocked === true)
    .map((item) => item.percent)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  return locked.length > 0 ? locked.reduce((sum, value) => sum + value, 0) : null;
}

/**
 * Provider facts only. No aggregate "contractIntegrityVerified" or manipulation PASS is created
 * here; those remain policy/gate decisions outside the provider adapter.
 */
export function adaptGoPlusTokenSecurityEvidence(input: GoPlusTokenSecurityEvidence): readonly CryptoFeatureEvidence[] {
  const status = providerStatus(input.status);
  const ref = input.evidenceId;
  const observedAt = input.retrievedAt;
  return Object.freeze([
    evidence('security.contractOpenSource', input.isOpenSource, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('security.contractIsProxy', input.isProxy, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('security.mintable', input.isMintable, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('security.blacklistFunction', input.isBlacklisted, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('security.transferPausable', input.transferPausable, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('security.ownerCanChangeBalance', input.ownerCanChangeBalance, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('risk.honeypotDetected', input.isHoneypot, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('risk.cannotBuy', input.cannotBuy, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('risk.cannotSellAll', input.cannotSellAll, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('risk.taxModifiable', input.slippageModifiable, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('risk.buyTax', input.buyTax, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('risk.sellTax', input.sellTax, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('risk.transferTax', input.transferTax, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('distribution.ownerShare', input.ownerPercent, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('distribution.creatorShare', input.creatorPercent, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('distribution.holderCount', input.holderCount, 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('distribution.topHolderShare', topShare(input.topHolders), 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('liquidity.lockedLpShare', lockedShare(input.lpHolders), 'goplus', ref, observedAt, input.retrievedAt, status),
    evidence('liquidity.dexLiquidityUsd', input.dexLiquidityUsd, 'goplus', ref, observedAt, input.retrievedAt, status),
  ]);
}

export function adaptCoinGlassDerivativesEvidence(input: CoinGlassDerivativesEvidence): readonly CryptoFeatureEvidence[] {
  const status = providerStatus(input.status);
  const ref = input.evidenceRefs.length > 0 ? input.evidenceRefs.join('|') : null;
  return Object.freeze([
    evidence('derivatives.openInterestUsd', input.openInterestUsd, 'coinglass', ref, input.retrievedAt, input.retrievedAt, status),
    evidence('derivatives.openInterestChange5mPct', input.openInterestChange5mPct, 'coinglass', ref, input.retrievedAt, input.retrievedAt, status),
    evidence('derivatives.openInterestChange1hPct', input.openInterestChange1hPct, 'coinglass', ref, input.retrievedAt, input.retrievedAt, status),
    evidence('derivatives.openInterestChange4hPct', input.openInterestChange4hPct, 'coinglass', ref, input.retrievedAt, input.retrievedAt, status),
    evidence('derivatives.openInterestChange24hPct', input.openInterestChange24hPct, 'coinglass', ref, input.retrievedAt, input.retrievedAt, status),
    evidence('derivatives.meanFundingRate', input.meanFundingRate, 'coinglass', ref, input.retrievedAt, input.retrievedAt, status),
    evidence('risk.liquidationUsd24h', input.liquidationUsd24h, 'coinglass', ref, input.retrievedAt, input.retrievedAt, status),
    evidence('risk.longLiquidationUsd24h', input.longLiquidationUsd24h, 'coinglass', ref, input.retrievedAt, input.retrievedAt, status),
    evidence('risk.shortLiquidationUsd24h', input.shortLiquidationUsd24h, 'coinglass', ref, input.retrievedAt, input.retrievedAt, status),
    evidence('liquidity.orderbookBidsUsd1Pct', input.aggregatedBidsUsd1Pct, 'coinglass', ref, input.orderbookObservedAt, input.retrievedAt, status),
    evidence('liquidity.orderbookAsksUsd1Pct', input.aggregatedAsksUsd1Pct, 'coinglass', ref, input.orderbookObservedAt, input.retrievedAt, status),
  ]);
}

export function adaptCoinGlassUnlockEvidence(input: CoinGlassUnlockEvidence): readonly CryptoFeatureEvidence[] {
  const status = providerStatus(input.status);
  return Object.freeze([
    evidence('tokenomics.nextUnlockAt', input.nextUnlockAt, 'coinglass', input.evidenceRef, input.retrievedAt, input.retrievedAt, status),
    evidence('tokenomics.nextUnlockTokens', input.nextUnlockTokens, 'coinglass', input.evidenceRef, input.retrievedAt, input.retrievedAt, status),
    evidence('tokenomics.nextUnlockOfCirculatingPct', input.nextUnlockOfCirculatingPct, 'coinglass', input.evidenceRef, input.retrievedAt, input.retrievedAt, status),
    evidence('tokenomics.nextUnlockOfSupplyPct', input.nextUnlockOfSupplyPct, 'coinglass', input.evidenceRef, input.retrievedAt, input.retrievedAt, status),
    evidence('tokenomics.totalLockedTokens', input.totalLockedTokens, 'coinglass', input.evidenceRef, input.retrievedAt, input.retrievedAt, status),
  ]);
}

export function adaptLunarCrushSocialEvidence(input: LunarCrushSocialEvidence): readonly CryptoFeatureEvidence[] {
  const status = providerStatus(input.status);
  return Object.freeze([
    evidence('community.interactions24h', input.interactions24h, 'lunarcrush', input.evidenceRef, input.observedAt, input.retrievedAt, status),
    evidence('community.mentions24h', input.mentions24h, 'lunarcrush', input.evidenceRef, input.observedAt, input.retrievedAt, status),
    evidence('community.activeCreators24h', input.activeCreators24h, 'lunarcrush', input.evidenceRef, input.observedAt, input.retrievedAt, status),
    evidence('community.createdPosts24h', input.createdPosts24h, 'lunarcrush', input.evidenceRef, input.observedAt, input.retrievedAt, status),
    evidence('community.sentimentPct', input.sentimentPct, 'lunarcrush', input.evidenceRef, input.observedAt, input.retrievedAt, status),
    evidence('community.spamPosts', input.spamPosts, 'lunarcrush', input.evidenceRef, input.observedAt, input.retrievedAt, status),
    evidence('community.socialDominancePct', input.socialDominancePct, 'lunarcrush', input.evidenceRef, input.observedAt, input.retrievedAt, status),
    evidence('community.spamRatio', input.spamRatio, 'lunarcrush', input.evidenceRef, input.observedAt, input.retrievedAt, status),
  ]);
}

export function adaptMessariProtocolUsageEvidence(input: MessariProtocolUsageEvidence): readonly CryptoFeatureEvidence[] {
  const status = providerStatus(input.status);
  return Object.freeze([
    evidence('protocol.activeAddresses24h', input.activeAddresses24h, 'messari', input.evidenceRef, input.observedAt, input.retrievedAt, status),
  ]);
}

export interface GovernedDuneFeatureMapping {
  readonly featureKey: string;
  readonly column: string;
  readonly rowIndex?: number;
}

export function adaptDuneSavedQueryEvidence(
  input: DuneSavedQueryEvidence,
  mappings: readonly GovernedDuneFeatureMapping[],
): readonly CryptoFeatureEvidence[] {
  const status = providerStatus(input.status);
  return Object.freeze(mappings.map((mapping) => {
    const row = input.rows[mapping.rowIndex ?? 0];
    const raw = row?.[mapping.column];
    const value: CryptoFeaturePrimitive | null = typeof raw === 'number' || typeof raw === 'boolean' || typeof raw === 'string'
      ? raw
      : null;
    return evidence(
      mapping.featureKey,
      value,
      'dune',
      input.evidenceRef,
      input.retrievedAt,
      input.retrievedAt,
      status,
      input.status === 'VERIFIED' ? undefined : input.reason,
    );
  }));
}
