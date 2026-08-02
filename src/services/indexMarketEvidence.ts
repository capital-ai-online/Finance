import { ensureIndexHistoryFresh, getCachedIndexHistory } from '../../server/fmpIndices';
import { fetchExternalHistory } from './externalMarketDataAdapters';
import { getIndexProviderMapping, validateTwelveDataIndexIdentity } from './indexProviderMapping';

export const INDEX_MARKET_EVIDENCE_VERSION = 'index-market-evidence/1.0.0' as const;

export interface IndexHistoryEvidence {
  version: typeof INDEX_MARKET_EVIDENCE_VERSION;
  symbol: string;
  provider: 'FMP' | 'TwelveData';
  providerSymbol: string;
  points: Array<{ date: string; close: number }>;
  observedAt: string;
  retrievedAt: string;
  sourcePath: string;
  evidenceIds: string[];
}

function observedAtForDay(day: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? `${day}T23:59:59.000Z` : new Date().toISOString();
}

export async function getVerifiedIndexHistory(
  symbolInput: string,
  days = 45,
): Promise<IndexHistoryEvidence | null> {
  const symbol = symbolInput.toUpperCase().trim();
  const mapping = getIndexProviderMapping(symbol);
  if (!mapping) return null;
  const boundedDays = Math.min(Math.max(days, 20), 365);

  for (const candidate of [...mapping.candidates].sort((a, b) => a.priority - b.priority)) {
    try {
      if (candidate.provider === 'FMP') {
        await ensureIndexHistoryFresh(symbol);
        const points = (getCachedIndexHistory(symbol) ?? [])
          .filter(point => Number.isFinite(point.close) && point.close > 0)
          .slice(-boundedDays);
        if (points.length < 20) continue;
        const retrievedAt = new Date().toISOString();
        const last = points[points.length - 1];
        return {
          version: INDEX_MARKET_EVIDENCE_VERSION,
          symbol,
          provider: 'FMP',
          providerSymbol: candidate.providerSymbol,
          points,
          observedAt: observedAtForDay(last.date),
          retrievedAt,
          sourcePath: `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${encodeURIComponent(candidate.providerSymbol)}`,
          evidenceIds: points.map(point => `index:fmp:${candidate.providerSymbol}:${point.date}`),
        };
      }

      const result = await fetchExternalHistory('TwelveData', {
        symbol: candidate.providerSymbol,
        assetClass: 'index',
        days: boundedDays,
      });
      if (!validateTwelveDataIndexIdentity(mapping, result.metadata)) continue;
      const points = result.points
        .filter(point => Number.isFinite(point.close) && point.close > 0)
        .map(point => ({ date: point.date, close: point.close }))
        .slice(-boundedDays);
      if (points.length < 20) continue;
      const last = points[points.length - 1];
      return {
        version: INDEX_MARKET_EVIDENCE_VERSION,
        symbol,
        provider: 'TwelveData',
        providerSymbol: candidate.providerSymbol,
        points,
        observedAt: observedAtForDay(last.date),
        retrievedAt: result.retrievedAt,
        sourcePath: result.sourcePath,
        evidenceIds: points.map(point => `index:twelvedata:${candidate.providerSymbol}:${point.date}`),
      };
    } catch {
      // Provider fallback is intentionally fail-closed and silent here. Provider-specific telemetry
      // is already recorded by the underlying adapters.
    }
  }
  return null;
}
