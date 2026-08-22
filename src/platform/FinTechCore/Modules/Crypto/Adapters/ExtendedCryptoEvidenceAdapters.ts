import type { CryptoFeatureEvidence, CryptoFeaturePrimitive } from '../CryptoCategoryFeatureContracts';
import type { GoPlusTokenSecurityEvidence } from '../../../../MarketData/providers/GoPlusTokenSecurityProvider';
import type { BinancePublicAnalyticsEvidence } from '../../../../MarketData/providers/BinancePublicAnalyticsProvider';
import type { KrakenFuturesAnalyticsEvidence } from '../../../../MarketData/providers/KrakenFuturesAnalyticsProvider';
import type { DexScreenerTokenEvidence } from '../../../../MarketData/providers/DexScreenerTokenEvidenceProvider';
import type { SourcifyContractVerificationEvidence } from '../../../../MarketData/providers/SourcifyContractVerificationProvider';
import type { DuneSavedQueryEvidence } from '../../../../MarketData/providers/DuneQueryEvidenceProvider';

export const EXTENDED_CRYPTO_EVIDENCE_ADAPTER_VERSION = 'fintech-core.crypto/extended-evidence-adapters/1.2.0' as const;

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

/** Binance is the canonical generic derivatives/raw-market projection in SC-4. */
export function adaptBinancePublicAnalyticsEvidence(input: BinancePublicAnalyticsEvidence): readonly CryptoFeatureEvidence[] {
  const status = providerStatus(input.status);
  const ref = input.evidenceRefs.length > 0 ? input.evidenceRefs.join('|') : null;
  const openInterestUsd = input.openInterest !== null && input.markPrice !== null
    ? input.openInterest * input.markPrice
    : null;
  return Object.freeze([
    evidence('derivatives.openInterestUsd', openInterestUsd, 'binance-public', ref, input.observedAt, input.retrievedAt, status),
    evidence('derivatives.meanFundingRate', input.fundingRate, 'binance-public', ref, input.observedAt, input.retrievedAt, status),
    evidence('liquidity.orderbookBidsUsd1Pct', input.bidDepthUsd1Pct, 'binance-public', ref, input.observedAt, input.retrievedAt, status),
    evidence('liquidity.orderbookAsksUsd1Pct', input.askDepthUsd1Pct, 'binance-public', ref, input.observedAt, input.retrievedAt, status),
  ]);
}

/** Kraken stays an independent primary observation set to prevent duplicate feature-key authority. */
export function adaptKrakenFuturesAnalyticsEvidence(input: KrakenFuturesAnalyticsEvidence): readonly CryptoFeatureEvidence[] {
  const status = providerStatus(input.status);
  const ref = input.evidenceRefs.length > 0 ? input.evidenceRefs.join('|') : null;
  return Object.freeze([
    evidence('derivatives.krakenOpenInterest', input.openInterest, 'kraken-futures-public', ref, input.observedAt, input.retrievedAt, status),
    evidence('derivatives.krakenOpenInterestChangePct', input.openInterestChangePct, 'kraken-futures-public', ref, input.observedAt, input.retrievedAt, status),
    evidence('derivatives.krakenFundingRate', input.fundingRate, 'kraken-futures-public', ref, input.observedAt, input.retrievedAt, status),
    evidence('risk.krakenLiquidationVolume', input.liquidationVolume, 'kraken-futures-public', ref, input.observedAt, input.retrievedAt, status),
    evidence('liquidity.krakenBidLiquidity01', input.bidLiquidity01, 'kraken-futures-public', ref, input.observedAt, input.retrievedAt, status),
    evidence('liquidity.krakenAskLiquidity01', input.askLiquidity01, 'kraken-futures-public', ref, input.observedAt, input.retrievedAt, status),
    evidence('liquidity.krakenBidSlippage100k', input.bidSlippage100k, 'kraken-futures-public', ref, input.observedAt, input.retrievedAt, status),
    evidence('liquidity.krakenAskSlippage100k', input.askSlippage100k, 'kraken-futures-public', ref, input.observedAt, input.retrievedAt, status),
  ]);
}

export function adaptDexScreenerTokenEvidence(input: DexScreenerTokenEvidence): readonly CryptoFeatureEvidence[] {
  const status = providerStatus(input.status);
  return Object.freeze([
    evidence('market.dexPairCount', input.pairCount, 'dexscreener', input.evidenceRef, input.retrievedAt, input.retrievedAt, status),
    evidence('liquidity.dexBestPairLiquidityUsd', input.bestPairLiquidityUsd, 'dexscreener', input.evidenceRef, input.retrievedAt, input.retrievedAt, status),
    evidence('market.dexVolume24hUsd', input.aggregateVolume24hUsd, 'dexscreener', input.evidenceRef, input.retrievedAt, input.retrievedAt, status),
    evidence('market.dexBuys24h', input.aggregateBuys24h, 'dexscreener', input.evidenceRef, input.retrievedAt, input.retrievedAt, status),
    evidence('market.dexSells24h', input.aggregateSells24h, 'dexscreener', input.evidenceRef, input.retrievedAt, input.retrievedAt, status),
    evidence('market.dexOldestPairCreatedAt', input.oldestPairCreatedAt, 'dexscreener', input.evidenceRef, input.retrievedAt, input.retrievedAt, status),
  ]);
}

export function adaptSourcifyContractVerificationEvidence(input: SourcifyContractVerificationEvidence): readonly CryptoFeatureEvidence[] {
  const status = providerStatus(input.status);
  return Object.freeze([
    evidence('security.sourceVerified', input.status === 'VERIFIED' ? true : null, 'sourcify', input.evidenceRef, input.verifiedAt, input.retrievedAt, status),
    evidence('security.sourceVerificationMatch', input.match, 'sourcify', input.evidenceRef, input.verifiedAt, input.retrievedAt, status),
    evidence('security.sourceVerifiedAt', input.verifiedAt, 'sourcify', input.evidenceRef, input.verifiedAt, input.retrievedAt, status),
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
    const value: CryptoFeaturePrimitive | null = typeof raw === 'number' || typeof raw === 'boolean' || typeof raw === 'string' ? raw : null;
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
