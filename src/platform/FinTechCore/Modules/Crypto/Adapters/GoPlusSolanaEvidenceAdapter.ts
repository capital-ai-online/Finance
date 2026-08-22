import type { CryptoFeatureEvidence, CryptoFeaturePrimitive } from '../CryptoCategoryFeatureContracts';
import type { GoPlusSolanaTokenSecurityEvidence } from '../../../../MarketData/providers/GoPlusSolanaTokenSecurityProvider';

export const GOPLUS_SOLANA_EVIDENCE_ADAPTER_VERSION = 'fintech-core.crypto/goplus-solana-evidence-adapter/1.0.0' as const;

function evidence(
  key: string,
  value: CryptoFeaturePrimitive | null,
  input: GoPlusSolanaTokenSecurityEvidence,
  reason?: string,
): CryptoFeatureEvidence {
  const verified = input.status === 'VERIFIED' && value !== null && input.evidenceId !== null;
  return Object.freeze({
    key,
    status: verified ? 'VERIFIED' as const : input.status === 'INVALID' ? 'INVALID' as const : 'NOT_AVAILABLE' as const,
    value: verified ? value : null,
    provider: 'goplus-solana',
    evidenceRefs: verified ? Object.freeze([input.evidenceId!]) : Object.freeze([]),
    observedAt: verified ? input.retrievedAt : null,
    retrievedAt: input.retrievedAt,
    degraded: !verified,
    reason: verified ? reason : input.reason ?? 'GoPlus Solana evidence is unavailable or lacks provenance.',
  });
}

function topShare(items: readonly { percent: number | null }[]): number | null {
  const values = items
    .map(item => item.percent)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) : null;
}

function lockedShare(items: readonly { percent: number | null; isLocked: boolean | null }[]): number | null {
  const values = items
    .filter(item => item.isLocked === true)
    .map(item => item.percent)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) : null;
}

/**
 * Maps only semantically compatible Solana facts into the existing profile-neutral raw evidence
 * catalog. Solana-only properties such as freezable/closable/hook-upgradeability stay available on
 * the structured provider result and are not relabelled as unrelated EVM controls.
 */
export function adaptGoPlusSolanaEvidence(
  input: GoPlusSolanaTokenSecurityEvidence,
): readonly CryptoFeatureEvidence[] {
  const transferTaxRatio = input.currentTransferFeeRateBps === null
    ? null
    : input.currentTransferFeeRateBps / 10_000;

  return Object.freeze([
    evidence('security.mintable', input.mintable, input, 'Solana Token Security mintable.status.'),
    evidence('security.ownerCanChangeBalance', input.balanceMutable, input, 'Solana balance_mutable_authority.status.'),
    evidence('risk.taxModifiable', input.transferFeeUpgradable, input, 'Solana transfer_fee_upgradable.status.'),
    evidence('risk.transferTax', transferTaxRatio, input, 'Solana current transfer fee normalized from basis points to ratio.'),
    evidence('distribution.holderCount', input.holderCount, input),
    evidence('distribution.topHolderShare', topShare(input.topHolders), input),
    evidence('liquidity.lockedLpShare', lockedShare(input.lpHolders), input),
    evidence('liquidity.dexLiquidityUsd', input.dexTvlUsd, input, 'Aggregated provider-reported Solana DEX TVL.'),
  ]);
}
