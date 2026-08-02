import { getVerifiedCryptoSnapshot, type VerifiedCryptoSnapshot } from './cryptoSnapshotProvider';
import { getCryptoSpotConsensus } from './cryptoSpotConsensus';
import type { MarketConsensusResult } from './marketDataConsensus';

export type CryptoSnapshotIntegrityStatus =
  | 'CONSISTENT'
  | 'SOURCE_CONFLICT'
  | 'INSUFFICIENT_EVIDENCE'
  | 'INVALID_SNAPSHOT';

export interface CryptoSnapshotIntegrityResult {
  symbol: string;
  status: CryptoSnapshotIntegrityStatus;
  snapshotProvider: string | null;
  spotConsensusStatus: MarketConsensusResult['status'] | null;
  reportedMarketCapUsd: number | null;
  impliedMarketCapUsd: number | null;
  marketCapDeviationBps: number | null;
  providers: string[];
  evidenceIds: string[];
  checks: {
    supplyOrderingValid: boolean | null;
    marketCapConsistent: boolean | null;
  };
  reason?: string;
}

function deviationBps(actual: number, reference: number): number {
  return Math.abs(actual - reference) / reference * 10_000;
}

function snapshotEvidenceIds(snapshot: VerifiedCryptoSnapshot): string[] {
  return Object.values(snapshot.provenance)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map(item => `snapshot:${item.provider.toLowerCase()}:${snapshot.symbol}:${item.field}:${item.observedAt}`);
}

function supplyOrdering(snapshot: VerifiedCryptoSnapshot): boolean | null {
  const circulating = snapshot.circulatingSupply;
  const total = snapshot.totalSupply;
  const max = snapshot.maxSupply;
  if (!circulating) return null;
  if (total && circulating > total) return false;
  if (typeof max === 'number' && circulating > max) return false;
  if (typeof max === 'number' && total && total > max) return false;
  return true;
}

/**
 * Non-scoring integrity boundary for critical crypto snapshot fields.
 *
 * This service intentionally does not mutate the score. It enables production observation of
 * source conflicts before the gate is promoted into a hard ranking/scoring dependency.
 */
export async function evaluateCryptoSnapshotIntegrity(
  symbol: string,
  options: {
    snapshotProvider?: (symbol: string) => Promise<VerifiedCryptoSnapshot | null>;
    spotConsensusProvider?: (symbol: string) => Promise<MarketConsensusResult>;
    marketCapToleranceBps?: number;
  } = {},
): Promise<CryptoSnapshotIntegrityResult> {
  const s = symbol.toUpperCase().trim();
  const snapshot = await (options.snapshotProvider ?? getVerifiedCryptoSnapshot)(s);
  if (!snapshot) {
    return {
      symbol: s,
      status: 'INSUFFICIENT_EVIDENCE',
      snapshotProvider: null,
      spotConsensusStatus: null,
      reportedMarketCapUsd: null,
      impliedMarketCapUsd: null,
      marketCapDeviationBps: null,
      providers: [],
      evidenceIds: [],
      checks: { supplyOrderingValid: null, marketCapConsistent: null },
      reason: 'Kein verifizierter Crypto-Snapshot verfügbar.',
    };
  }

  const supplyOrderingValid = supplyOrdering(snapshot);
  const baseEvidenceIds = snapshotEvidenceIds(snapshot);
  if (supplyOrderingValid === false) {
    return {
      symbol: s,
      status: 'INVALID_SNAPSHOT',
      snapshotProvider: snapshot.provider,
      spotConsensusStatus: null,
      reportedMarketCapUsd: snapshot.marketCapUsd ?? null,
      impliedMarketCapUsd: null,
      marketCapDeviationBps: null,
      providers: [snapshot.provider],
      evidenceIds: baseEvidenceIds,
      checks: { supplyOrderingValid: false, marketCapConsistent: null },
      reason: 'Supply-Invarianten verletzt: circulating/total/max supply sind nicht konsistent geordnet.',
    };
  }

  if (!snapshot.marketCapUsd || !snapshot.circulatingSupply) {
    return {
      symbol: s,
      status: 'INSUFFICIENT_EVIDENCE',
      snapshotProvider: snapshot.provider,
      spotConsensusStatus: null,
      reportedMarketCapUsd: snapshot.marketCapUsd ?? null,
      impliedMarketCapUsd: null,
      marketCapDeviationBps: null,
      providers: [snapshot.provider],
      evidenceIds: baseEvidenceIds,
      checks: { supplyOrderingValid, marketCapConsistent: null },
      reason: 'Market Cap oder Circulating Supply fehlen für die unabhängige Konsistenzprüfung.',
    };
  }

  const consensus = await (options.spotConsensusProvider ?? getCryptoSpotConsensus)(s);
  const providers = [...new Set([snapshot.provider, ...consensus.providers])];
  const evidenceIds = [...new Set([...baseEvidenceIds, ...consensus.evidenceIds])];
  if (consensus.status !== 'CONSENSUS' || !consensus.canonicalValue) {
    return {
      symbol: s,
      status: consensus.status === 'SOURCE_CONFLICT' ? 'SOURCE_CONFLICT' : 'INSUFFICIENT_EVIDENCE',
      snapshotProvider: snapshot.provider,
      spotConsensusStatus: consensus.status,
      reportedMarketCapUsd: snapshot.marketCapUsd,
      impliedMarketCapUsd: null,
      marketCapDeviationBps: null,
      providers,
      evidenceIds,
      checks: { supplyOrderingValid, marketCapConsistent: null },
      reason: consensus.reason ?? 'Kein belastbarer unabhängiger Spot-Preis-Quorum verfügbar.',
    };
  }

  const impliedMarketCapUsd = consensus.canonicalValue * snapshot.circulatingSupply;
  const deviation = deviationBps(snapshot.marketCapUsd, impliedMarketCapUsd);
  const tolerance = Math.max(0, options.marketCapToleranceBps ?? 500);
  const marketCapConsistent = deviation <= tolerance;

  return {
    symbol: s,
    status: marketCapConsistent ? 'CONSISTENT' : 'SOURCE_CONFLICT',
    snapshotProvider: snapshot.provider,
    spotConsensusStatus: consensus.status,
    reportedMarketCapUsd: snapshot.marketCapUsd,
    impliedMarketCapUsd,
    marketCapDeviationBps: Number(deviation.toFixed(2)),
    providers,
    evidenceIds,
    checks: { supplyOrderingValid, marketCapConsistent },
    reason: marketCapConsistent
      ? undefined
      : `Gemeldete Market Cap weicht um ${deviation.toFixed(2)} bps vom aus Preis-Quorum × Circulating Supply abgeleiteten Wert ab.`,
  };
}
