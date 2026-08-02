import { getVerifiedCryptoSnapshot, type VerifiedCryptoSnapshot } from './cryptoSnapshotProvider';
import { getCryptoSpotConsensus } from './cryptoSpotConsensus';

export type CryptoSnapshotIntegrityStatus =
  | 'CONSISTENT'
  | 'INVALID_SNAPSHOT'
  | 'SOURCE_CONFLICT'
  | 'INSUFFICIENT_EVIDENCE'
  | 'SOURCE_UNAVAILABLE';

export interface CryptoSnapshotIntegrityResult {
  symbol: string;
  status: CryptoSnapshotIntegrityStatus;
  snapshotProvider: string | null;
  spotProviders: string[];
  providers: string[];
  evidenceIds: string[];
  impliedMarketCapUsd: number | null;
  marketCapDeviationBps: number | null;
  checks: {
    supplyOrderingValid: boolean | null;
    marketCapConsistent: boolean | null;
  };
  reason: string;
}

export interface CryptoSnapshotIntegrityOptions {
  snapshotProvider?: (symbol: string) => Promise<VerifiedCryptoSnapshot | null>;
  spotConsensusProvider?: (symbol: string) => Promise<{
    status: string;
    canonicalValue: number | null;
    providers: string[];
    evidenceIds: string[];
  }>;
  marketCapToleranceBps?: number;
}

function supplyOrderingValid(snapshot: VerifiedCryptoSnapshot): boolean | null {
  const { circulatingSupply, totalSupply, maxSupply } = snapshot;
  if (circulatingSupply === undefined && totalSupply === undefined && maxSupply === undefined) return null;
  if (circulatingSupply !== undefined && totalSupply !== undefined && circulatingSupply > totalSupply) return false;
  if (circulatingSupply !== undefined && maxSupply !== undefined && maxSupply !== null && circulatingSupply > maxSupply) return false;
  if (totalSupply !== undefined && maxSupply !== undefined && maxSupply !== null && totalSupply > maxSupply) return false;
  return true;
}

function providerSet(snapshotProvider: string | null, spotProviders: string[]): string[] {
  return [...new Set([...(snapshotProvider ? [snapshotProvider] : []), ...spotProviders])].sort();
}

export async function evaluateCryptoSnapshotIntegrity(
  symbol: string,
  options: CryptoSnapshotIntegrityOptions = {},
): Promise<CryptoSnapshotIntegrityResult> {
  const s = symbol.toUpperCase().trim();
  const snapshotProvider = options.snapshotProvider ?? ((asset: string) => getVerifiedCryptoSnapshot(asset));
  const spotConsensusProvider = options.spotConsensusProvider ?? ((asset: string) => getCryptoSpotConsensus(asset));
  const toleranceBps = Math.max(0, options.marketCapToleranceBps ?? 500);

  const snapshot = await snapshotProvider(s);
  if (!snapshot) {
    return {
      symbol: s,
      status: 'SOURCE_UNAVAILABLE',
      snapshotProvider: null,
      spotProviders: [],
      providers: [],
      evidenceIds: [],
      impliedMarketCapUsd: null,
      marketCapDeviationBps: null,
      checks: { supplyOrderingValid: null, marketCapConsistent: null },
      reason: 'Kein verifizierter Crypto-Snapshot verfügbar.',
    };
  }

  const ordering = supplyOrderingValid(snapshot);
  const snapshotEvidenceIds = Object.values(snapshot.provenance)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map(item => `snapshot:${item.provider.toLowerCase()}:${s}:${item.field}:${item.observedAt.slice(0, 10)}`);

  if (ordering === false) {
    return {
      symbol: s,
      status: 'INVALID_SNAPSHOT',
      snapshotProvider: snapshot.provider,
      spotProviders: [],
      providers: providerSet(snapshot.provider, []),
      evidenceIds: snapshotEvidenceIds,
      impliedMarketCapUsd: null,
      marketCapDeviationBps: null,
      checks: { supplyOrderingValid: false, marketCapConsistent: null },
      reason: 'Supply-Invarianten verletzt: circulatingSupply ≤ totalSupply ≤ maxSupply ist nicht erfüllt.',
    };
  }

  if (!snapshot.marketCapUsd || !snapshot.circulatingSupply) {
    return {
      symbol: s,
      status: 'INSUFFICIENT_EVIDENCE',
      snapshotProvider: snapshot.provider,
      spotProviders: [],
      providers: providerSet(snapshot.provider, []),
      evidenceIds: snapshotEvidenceIds,
      impliedMarketCapUsd: null,
      marketCapDeviationBps: null,
      checks: { supplyOrderingValid: ordering, marketCapConsistent: null },
      reason: 'Market Cap oder Circulating Supply fehlt für die unabhängige Plausibilisierung.',
    };
  }

  const spot = await spotConsensusProvider(s);
  if (spot.status !== 'CONSENSUS' || typeof spot.canonicalValue !== 'number' || !Number.isFinite(spot.canonicalValue) || spot.canonicalValue <= 0) {
    const spotProviders = spot.providers ?? [];
    return {
      symbol: s,
      status: 'INSUFFICIENT_EVIDENCE',
      snapshotProvider: snapshot.provider,
      spotProviders,
      providers: providerSet(snapshot.provider, spotProviders),
      evidenceIds: [...snapshotEvidenceIds, ...(spot.evidenceIds ?? [])],
      impliedMarketCapUsd: null,
      marketCapDeviationBps: null,
      checks: { supplyOrderingValid: ordering, marketCapConsistent: null },
      reason: 'Kein unabhängiger Spot-Price-Consensus für die Market-Cap-Plausibilisierung verfügbar.',
    };
  }

  const impliedMarketCapUsd = spot.canonicalValue * snapshot.circulatingSupply;
  const deviationBps = Math.abs(snapshot.marketCapUsd - impliedMarketCapUsd) / impliedMarketCapUsd * 10_000;
  const consistent = deviationBps <= toleranceBps;

  return {
    symbol: s,
    status: consistent ? 'CONSISTENT' : 'SOURCE_CONFLICT',
    snapshotProvider: snapshot.provider,
    spotProviders: spot.providers,
    providers: providerSet(snapshot.provider, spot.providers),
    evidenceIds: [...new Set([...snapshotEvidenceIds, ...spot.evidenceIds])],
    impliedMarketCapUsd: Number(impliedMarketCapUsd.toPrecision(15)),
    marketCapDeviationBps: Number(deviationBps.toFixed(2)),
    checks: { supplyOrderingValid: ordering, marketCapConsistent: consistent },
    reason: consistent
      ? 'Snapshot-Supply und Market Cap sind mit unabhängiger Spot-Consensus-Evidence konsistent.'
      : `Reported Market Cap weicht um ${deviationBps.toFixed(2)} bps vom impliziten Wert ab und überschreitet ${toleranceBps} bps.`,
  };
}
