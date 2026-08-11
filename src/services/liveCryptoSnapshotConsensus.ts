import { getVerifiedCryptoSnapshot } from './cryptoSnapshotProvider';
import { evaluateCryptoSnapshotConsensus, type CryptoSnapshotConsensusResult, type SnapshotFieldProvenance } from './cryptoSnapshotConsensus';

export interface LiveCryptoSnapshotConsensusOptions {
  fetchImpl?: typeof fetch;
  nowMs?: () => number;
  timeoutMs?: number;
}

function semanticScopeFor(field: SnapshotFieldProvenance['field']): string {
  if (field === 'marketCapUsd') return 'global-circulating-supply-market-cap-usd';
  if (field === 'volume24hUsd') return 'global-aggregate-24h-volume-usd';
  if (field === 'circulatingSupply') return 'circulating-token-supply';
  if (field === 'maxSupply') return 'maximum-token-supply';
  return 'total-token-supply';
}

/**
 * Observation-only runtime quorum. It deliberately does not hard-gate the production scorer.
 *
 * CoinMarketCap was removed as a provenance source (no replacement second provider wired in).
 * Every quorum-gated field requires >=2 independent observations (see FIELD_POLICY in
 * marketSnapshotConsensus.ts), so with only CoinGecko remaining this now consistently evaluates
 * to INSUFFICIENT_SOURCES rather than CONSENSUS. That is the correct fail-closed outcome for this
 * codebase's No-Demo-Data policy, not a bug: a canonical value must never be synthesized from a
 * single, uncorroborated source. Wire in a second independent crypto snapshot provider here if
 * real quorum evaluation is needed again.
 */
export async function getLiveCryptoSnapshotConsensus(
  symbol: string,
  options: LiveCryptoSnapshotConsensusOptions = {},
): Promise<CryptoSnapshotConsensusResult> {
  const s = symbol.toUpperCase().trim();
  const nowMs = options.nowMs ?? Date.now;
  const coinGecko = await getVerifiedCryptoSnapshot(s, { fetchImpl: options.fetchImpl, nowMs, timeoutMs: options.timeoutMs });
  const provenance: SnapshotFieldProvenance[] = [];
  if (coinGecko) {
    for (const item of Object.values(coinGecko.provenance)) {
      if (!item) continue;
      provenance.push({
        ...item,
        provider: 'CoinGecko',
        semanticScope: semanticScopeFor(item.field),
      });
    }
  }
  return evaluateCryptoSnapshotConsensus(s, provenance);
}
