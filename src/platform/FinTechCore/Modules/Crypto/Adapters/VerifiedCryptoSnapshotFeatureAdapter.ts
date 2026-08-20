import type {
  CryptoSnapshotField,
  VerifiedCryptoSnapshot,
  VerifiedFieldProvenance,
} from '../../../../../services/cryptoSnapshotProvider';
import type { CryptoFeatureEvidence } from '../CryptoCategoryFeatureContracts';

export const VERIFIED_CRYPTO_SNAPSHOT_FEATURE_ADAPTER_VERSION =
  'fintech-core.crypto/verified-snapshot-feature-adapter/0.1.0' as const;

const SNAPSHOT_FEATURE_KEY: Readonly<Record<CryptoSnapshotField, string>> = Object.freeze({
  priceUsd: 'market.priceUsd',
  change24hPct: 'market.change24hPct',
  marketCapUsd: 'market.marketCapUsd',
  volume24hUsd: 'market.volume24hUsd',
  circulatingSupply: 'tokenomics.circulatingSupply',
  maxSupply: 'tokenomics.maxSupply',
  totalSupply: 'tokenomics.totalSupply',
});

function evidenceRef(symbol: string, provenance: VerifiedFieldProvenance): string {
  return [
    'crypto-snapshot',
    provenance.provider.toLowerCase(),
    symbol,
    provenance.field,
    provenance.observedAt,
  ].join(':');
}

function fromProvenance(
  symbol: string,
  provenance: VerifiedFieldProvenance,
  degraded: boolean,
): CryptoFeatureEvidence {
  const value = provenance.value;
  const unavailable = value === null || (typeof value === 'number' && !Number.isFinite(value));

  return Object.freeze({
    key: SNAPSHOT_FEATURE_KEY[provenance.field],
    status: unavailable ? 'NOT_AVAILABLE' : degraded ? 'STALE' : 'VERIFIED',
    value: unavailable ? null : value,
    provider: provenance.provider,
    evidenceRefs: Object.freeze([evidenceRef(symbol, provenance)]),
    observedAt: provenance.observedAt,
    retrievedAt: provenance.retrievedAt,
    degraded,
    reason: unavailable
      ? `Provider ${provenance.provider} did not supply a finite value for ${provenance.field}.`
      : degraded
        ? 'Snapshot is last-known-good/degraded and cannot satisfy strict verified feature requirements.'
        : undefined,
  });
}

/**
 * Pure adapter from the SC-5 verified CoinGecko snapshot contract into universal FinTech-Core
 * market/supply evidence. It performs no network call and creates no score.
 *
 * Degraded last-known-good snapshots become STALE evidence so downstream feature contracts fail
 * closed unless a future policy explicitly accepts bounded staleness. Missing provider values stay
 * NOT_AVAILABLE and are never converted to zero.
 */
export function adaptVerifiedCryptoSnapshotToUniversalEvidence(
  snapshot: VerifiedCryptoSnapshot,
): readonly CryptoFeatureEvidence[] {
  const result: CryptoFeatureEvidence[] = [];
  const seen = new Set<string>();

  for (const provenance of Object.values(snapshot.provenance)) {
    if (!provenance) continue;
    const adapted = fromProvenance(snapshot.symbol, provenance, snapshot.degraded);
    if (seen.has(adapted.key)) {
      throw new Error(`[VerifiedCryptoSnapshotFeatureAdapter] duplicate mapped feature: ${adapted.key}`);
    }
    seen.add(adapted.key);
    result.push(adapted);
  }

  return Object.freeze(result);
}
