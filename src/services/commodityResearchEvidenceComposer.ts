import type { CommodityMarketEvidence } from './commodityMarketEvidence';
import {
  mergeCommodityOfficialEvidence,
  type CommodityOfficialEvidenceBundle,
} from './commodityOfficialEvidence';
import {
  buildCommodityResearchFeatureSnapshot,
  type CommodityResearchFeatureObservation,
  type CommodityResearchFeatureSnapshot,
  type CommodityResearchInstrumentKind,
} from '../platform/Scoring/CommodityResearchModelContracts';

export const COMMODITY_RESEARCH_EVIDENCE_COMPOSER_VERSION = 'commodity-research-evidence-composer/1.0.0' as const;

function marketHistoryObservation(evidence: CommodityMarketEvidence): CommodityResearchFeatureObservation | null {
  const last = evidence.points.at(-1);
  if (!last || !Number.isFinite(last.close) || last.close <= 0 || evidence.evidenceIds.length === 0) return null;
  return {
    featureKey: 'market.priceHistory',
    rawValue: last.close,
    unit: 'price-series',
    source: `${evidence.providerId}:${evidence.providerSymbol}`,
    observedAt: evidence.observedAt,
    retrievedAt: evidence.retrievedAt,
    evidenceId: `commodity-history:${evidence.providerId}:${evidence.providerSymbol}:${evidence.observedAt.slice(0, 10)}`,
    confidence: 1,
  };
}

function deriveStocksToUse(
  observations: readonly CommodityResearchFeatureObservation[],
): CommodityResearchFeatureObservation | null {
  const stocks = observations.find(item => item.featureKey === 'fundamentals.endingStocks' && item.rawValue !== null);
  const consumption = observations.find(item => item.featureKey === 'fundamentals.consumption' && item.rawValue !== null);
  if (!stocks || !consumption || stocks.rawValue === null || consumption.rawValue === null || consumption.rawValue <= 0) return null;
  if (!stocks.evidenceId || !consumption.evidenceId || !stocks.observedAt || !consumption.observedAt) return null;
  const observedAt = Date.parse(stocks.observedAt) <= Date.parse(consumption.observedAt) ? stocks.observedAt : consumption.observedAt;
  const retrievedAt = Date.parse(stocks.retrievedAt) >= Date.parse(consumption.retrievedAt) ? stocks.retrievedAt : consumption.retrievedAt;
  return {
    featureKey: 'fundamentals.stocksToUse',
    rawValue: (stocks.rawValue / consumption.rawValue) * 100,
    unit: 'percent',
    source: 'derived-from-usda-psd',
    observedAt,
    retrievedAt,
    evidenceId: `derived:stocks-to-use:${stocks.evidenceId}:${consumption.evidenceId}`,
    revisionId: stocks.revisionId === consumption.revisionId ? stocks.revisionId : `${stocks.revisionId ?? 'na'}|${consumption.revisionId ?? 'na'}`,
    confidence: Math.min(stocks.confidence ?? 1, consumption.confidence ?? 1),
  };
}

/**
 * Composes source-backed observations into the P1 Commodity research feature contract.
 * It never evaluates executable weights or produces CanonicalScoreResult.
 */
export function composeCommodityResearchFeatureSnapshot(input: Readonly<{
  assetId: string;
  symbol: string;
  instrumentKind: CommodityResearchInstrumentKind;
  marketEvidence?: CommodityMarketEvidence | null;
  officialEvidence?: readonly CommodityOfficialEvidenceBundle[];
  additionalVerifiedObservations?: readonly CommodityResearchFeatureObservation[];
  nowMs?: number;
}>): CommodityResearchFeatureSnapshot {
  const observations: CommodityResearchFeatureObservation[] = [
    ...mergeCommodityOfficialEvidence(input.officialEvidence ?? []),
    ...(input.additionalVerifiedObservations ?? []),
  ];
  if (input.marketEvidence) {
    const market = marketHistoryObservation(input.marketEvidence);
    if (market) observations.push(market);
  }
  if (input.instrumentKind === 'commodity-agriculture-benchmark') {
    const stocksToUse = deriveStocksToUse(observations);
    if (stocksToUse) observations.push(stocksToUse);
  }
  return buildCommodityResearchFeatureSnapshot({
    assetId: input.assetId,
    symbol: input.symbol,
    instrumentKind: input.instrumentKind,
    observations,
    nowMs: input.nowMs,
  });
}
