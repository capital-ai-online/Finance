import { getAssetCatalogEntry } from '../lib/assetSearchCatalog';
import { getVerifiedCryptoSnapshot } from './cryptoSnapshotProvider';
import { getCryptoSpotConsensus } from './cryptoSpotConsensus';
import { fetchVerifiedTraditionalQuote } from './traditionalQuoteEvidence';
import { getTwelveDataCommodityEvidence } from './commodityMarketEvidence';
import { resolveSovereignBondProviderMapping } from './sovereignBondProviderMapping';
import { getEodhdBondEvidence } from './eodhdBondEvidence';
import { buildFinancialEvidenceId } from '../types/financialProvenance';
import { ensureFundamentalsFresh, getCachedFundamentals } from '../../server/stockFundamentals';

export const VERIFIED_ASSET_DISPLAY_CONTRACT_VERSION = 'verified-asset-display/1.0.0' as const;

export type VerifiedAssetDisplayStatus = 'READY' | 'PARTIAL' | 'SOURCE_UNAVAILABLE' | 'NOT_APPLICABLE';
export type VerifiedAssetValueKind = 'price' | 'yield';

export interface VerifiedAssetFundamentals {
  peRatio: number | null;
  debtToEquity: number | null;
  dividendYieldPct: number | null;
  profitMarginPct: number | null;
  epsTtm: number | null;
  freeCashFlowPerShare: number | null;
}

export interface VerifiedAssetDisplay {
  contractVersion: typeof VERIFIED_ASSET_DISPLAY_CONTRACT_VERSION;
  symbol: string;
  name: string;
  assetClass: 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';
  status: VerifiedAssetDisplayStatus;
  valueKind: VerifiedAssetValueKind;
  value: number | null;
  unit: string | null;
  price: number | null;
  change24hPct: number | null;
  marketCap: number | null;
  volume24h: number | null;
  fundamentals: VerifiedAssetFundamentals | null;
  buffettValuationStatus: 'READY' | 'PARTIAL' | 'NOT_APPLICABLE';
  providers: string[];
  evidenceIds: string[];
  observedAt: string | null;
  retrievedAt: string | null;
  degraded: boolean;
  executionPriceEligible: false;
  reason: string | null;
}

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function latestIso(values: Array<string | undefined | null>): string | null {
  return values
    .filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value as string)))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

function pctChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(4));
}

function unavailableBase(symbol: string, name: string, assetClass: VerifiedAssetDisplay['assetClass'], reason: string): VerifiedAssetDisplay {
  return {
    contractVersion: VERIFIED_ASSET_DISPLAY_CONTRACT_VERSION,
    symbol,
    name,
    assetClass,
    status: 'SOURCE_UNAVAILABLE',
    valueKind: assetClass === 'bond' ? 'yield' : 'price',
    value: null,
    unit: assetClass === 'bond' ? '%' : null,
    price: null,
    change24hPct: null,
    marketCap: null,
    volume24h: null,
    fundamentals: assetClass === 'stock' ? {
      peRatio: null,
      debtToEquity: null,
      dividendYieldPct: null,
      profitMarginPct: null,
      epsTtm: null,
      freeCashFlowPerShare: null,
    } : null,
    buffettValuationStatus: assetClass === 'stock' ? 'PARTIAL' : 'NOT_APPLICABLE',
    providers: [],
    evidenceIds: [],
    observedAt: null,
    retrievedAt: null,
    degraded: false,
    executionPriceEligible: false,
    reason,
  };
}

async function cryptoDisplay(symbol: string, name: string): Promise<VerifiedAssetDisplay> {
  const snapshot = await getVerifiedCryptoSnapshot(symbol, { maxAttempts: 1 });
  let price = finite(snapshot?.priceUsd);
  let providers = snapshot ? [snapshot.provider] : [];
  let evidenceIds = snapshot
    ? Object.values(snapshot.provenance)
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .map(item => `display:${item.provider.toLowerCase()}:${symbol}:${item.field}:${item.observedAt}`)
    : [];
  let observedAt = snapshot?.observedAt ?? null;
  let retrievedAt = snapshot?.retrievedAt ?? null;
  let degraded = snapshot?.degraded ?? false;
  let reason: string | null = null;

  // Only pay for the multi-provider quorum when the bounded CoinGecko display snapshot does not
  // cover the selected symbol or is temporarily unavailable. This keeps the UI progressive and
  // avoids the provider storm caused by eager full-catalog hydration.
  if (price === null) {
    const consensus = await getCryptoSpotConsensus(symbol);
    if (consensus.status === 'CONSENSUS') {
      price = finite(consensus.canonicalValue);
      providers = [...new Set([...providers, ...(consensus.providers ?? [])])];
      evidenceIds = [...new Set([...evidenceIds, ...(consensus.evidenceIds ?? [])])];
    } else {
      reason = consensus.reason ?? 'Kein verifizierter Crypto-Preis verfügbar.';
    }
  }

  const marketCap = finite(snapshot?.marketCapUsd);
  const volume24h = finite(snapshot?.volume24hUsd);
  const change24hPct = finite(snapshot?.change24hPct);
  const hasAny = price !== null || marketCap !== null || volume24h !== null || change24hPct !== null;
  if (!hasAny) return unavailableBase(symbol, name, 'crypto', reason ?? 'Kein verifizierter Crypto-Snapshot verfügbar.');

  return {
    contractVersion: VERIFIED_ASSET_DISPLAY_CONTRACT_VERSION,
    symbol,
    name,
    assetClass: 'crypto',
    status: price !== null ? 'READY' : 'PARTIAL',
    valueKind: 'price',
    value: price,
    unit: price !== null ? 'USD' : null,
    price,
    change24hPct,
    marketCap,
    volume24h,
    fundamentals: null,
    buffettValuationStatus: 'NOT_APPLICABLE',
    providers,
    evidenceIds,
    observedAt,
    retrievedAt,
    degraded,
    executionPriceEligible: false,
    reason: price === null ? (reason ?? 'Marktmetrik vorhanden, aber kein verifizierter Preis.') : null,
  };
}

async function stockDisplay(symbol: string, name: string): Promise<VerifiedAssetDisplay> {
  const [quote] = await Promise.all([
    fetchVerifiedTraditionalQuote(symbol, 'stock'),
    ensureFundamentalsFresh(symbol),
  ]);
  const fundamentals = getCachedFundamentals(symbol);
  const price = quote.status === 'READY' ? finite(quote.price) : null;
  const normalizedFundamentals: VerifiedAssetFundamentals = {
    peRatio: finite(fundamentals?.peRatio),
    debtToEquity: finite(fundamentals?.debtToEquity),
    dividendYieldPct: finite(fundamentals?.dividendYieldPct),
    profitMarginPct: finite(fundamentals?.profitMarginPct),
    epsTtm: finite(fundamentals?.epsTtm),
    freeCashFlowPerShare: finite(fundamentals?.freeCashFlowPerShare),
  };
  const fundamentalEvidence = fundamentals?.provenance ?? [];
  const providers = [...new Set([
    ...(quote.providers ?? []),
    ...fundamentalEvidence.map(item => item.provider),
  ])];
  const evidenceIds = [...new Set([
    ...(quote.evidenceIds ?? []),
    ...fundamentalEvidence.map(item => buildFinancialEvidenceId(symbol, item)),
  ])];
  const hasFundamentalEvidence = Object.values(normalizedFundamentals).some(value => value !== null);
  const valuationReady = price !== null && normalizedFundamentals.epsTtm !== null && normalizedFundamentals.epsTtm > 0;
  const status: VerifiedAssetDisplayStatus = price !== null && hasFundamentalEvidence ? 'READY' : (price !== null || hasFundamentalEvidence) ? 'PARTIAL' : 'SOURCE_UNAVAILABLE';

  return {
    contractVersion: VERIFIED_ASSET_DISPLAY_CONTRACT_VERSION,
    symbol,
    name,
    assetClass: 'stock',
    status,
    valueKind: 'price',
    value: price,
    unit: quote.currency,
    price,
    change24hPct: null,
    marketCap: null,
    volume24h: null,
    fundamentals: normalizedFundamentals,
    buffettValuationStatus: valuationReady ? 'READY' : 'PARTIAL',
    providers,
    evidenceIds,
    observedAt: latestIso([quote.observedAt, ...fundamentalEvidence.map(item => item.observedAt)]),
    retrievedAt: latestIso([quote.retrievedAt, ...fundamentalEvidence.map(item => item.retrievedAt)]),
    degraded: quote.status === 'STALE_EVIDENCE',
    executionPriceEligible: false,
    reason: status === 'SOURCE_UNAVAILABLE'
      ? (quote.reason ?? 'Weder verifizierte Aktienquote noch Fundamentaldaten verfügbar.')
      : valuationReady
        ? null
        : 'Teilweise Evidenz verfügbar. Buffett/Graham-Bewertung benötigt mindestens verifizierten Marktpreis und positives EPS.',
  };
}

async function traditionalDisplay(
  symbol: string,
  name: string,
  assetClass: 'forex' | 'index',
): Promise<VerifiedAssetDisplay> {
  const quote = await fetchVerifiedTraditionalQuote(symbol, assetClass);
  const price = quote.status === 'READY' ? finite(quote.price) : null;
  const base = price === null
    ? unavailableBase(symbol, name, assetClass, quote.reason ?? 'Keine verifizierte Quote verfügbar.')
    : null;
  if (base) {
    return {
      ...base,
      providers: quote.providers ?? [],
      evidenceIds: quote.evidenceIds ?? [],
      observedAt: quote.observedAt,
      retrievedAt: quote.retrievedAt,
      degraded: quote.status === 'STALE_EVIDENCE',
    };
  }
  return {
    contractVersion: VERIFIED_ASSET_DISPLAY_CONTRACT_VERSION,
    symbol,
    name,
    assetClass,
    status: 'READY',
    valueKind: 'price',
    value: price,
    unit: quote.currency,
    price,
    change24hPct: null,
    marketCap: null,
    volume24h: null,
    fundamentals: null,
    buffettValuationStatus: 'NOT_APPLICABLE',
    providers: quote.providers ?? [],
    evidenceIds: quote.evidenceIds ?? [],
    observedAt: quote.observedAt,
    retrievedAt: quote.retrievedAt,
    degraded: false,
    executionPriceEligible: false,
    reason: null,
  };
}

async function commodityDisplay(symbol: string, name: string): Promise<VerifiedAssetDisplay> {
  try {
    const evidence = await getTwelveDataCommodityEvidence(symbol, 30);
    const last = evidence.points[evidence.points.length - 1];
    const previous = evidence.points[evidence.points.length - 2];
    const price = finite(last?.close);
    if (price === null) return unavailableBase(symbol, name, 'commodity', 'Commodity-Evidence enthält keinen gültigen Schlusswert.');
    return {
      contractVersion: VERIFIED_ASSET_DISPLAY_CONTRACT_VERSION,
      symbol,
      name,
      assetClass: 'commodity',
      status: 'READY',
      valueKind: 'price',
      value: price,
      unit: evidence.providerSymbol.toUpperCase().endsWith('/USD') ? 'USD' : null,
      price,
      change24hPct: previous ? pctChange(last.close, previous.close) : null,
      marketCap: null,
      volume24h: null,
      fundamentals: null,
      buffettValuationStatus: 'NOT_APPLICABLE',
      providers: [evidence.provider],
      evidenceIds: evidence.evidenceIds.slice(-2),
      observedAt: evidence.observedAt,
      retrievedAt: evidence.retrievedAt,
      degraded: false,
      executionPriceEligible: false,
      reason: null,
    };
  } catch (error) {
    return unavailableBase(symbol, name, 'commodity', error instanceof Error ? error.message : String(error));
  }
}

async function bondDisplay(symbol: string, name: string): Promise<VerifiedAssetDisplay> {
  const mapping = await resolveSovereignBondProviderMapping(symbol);
  if (!mapping) {
    return unavailableBase(symbol, name, 'bond', 'Kein freigegebenes Sovereign-Benchmark-Provider-Mapping vorhanden; Einzelanleihen bleiben ohne erfundene Werte gesperrt.');
  }
  try {
    const evidence = await getEodhdBondEvidence(mapping.providerSymbol, 30);
    const last = evidence.points[evidence.points.length - 1];
    const value = finite(last?.value);
    if (value === null) return unavailableBase(symbol, name, 'bond', 'Bond-Evidence enthält keinen gültigen Renditewert.');
    return {
      contractVersion: VERIFIED_ASSET_DISPLAY_CONTRACT_VERSION,
      symbol,
      name,
      assetClass: 'bond',
      status: 'READY',
      valueKind: 'yield',
      value,
      unit: '%',
      price: null,
      change24hPct: null,
      marketCap: null,
      volume24h: null,
      fundamentals: null,
      buffettValuationStatus: 'NOT_APPLICABLE',
      providers: [evidence.provider],
      evidenceIds: evidence.evidenceIds.slice(-2),
      observedAt: last?.date ? `${last.date}T23:59:59.000Z` : null,
      retrievedAt: evidence.retrievedAt,
      degraded: false,
      executionPriceEligible: false,
      reason: null,
    };
  } catch (error) {
    return unavailableBase(symbol, name, 'bond', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Progressive, per-symbol display hydration. This service deliberately has no full-catalog batch
 * path: catalog presence and market-data readiness remain separate concerns, and providers are
 * contacted only for the asset the user is currently viewing/selecting.
 */
export async function getVerifiedAssetDisplay(symbolInput: string): Promise<VerifiedAssetDisplay | null> {
  const asset = getAssetCatalogEntry(symbolInput);
  if (!asset) return null;
  const symbol = asset.symbol;
  if (asset.type === 'crypto') return cryptoDisplay(symbol, asset.name);
  if (asset.type === 'stock') return stockDisplay(symbol, asset.name);
  if (asset.type === 'forex' || asset.type === 'index') return traditionalDisplay(symbol, asset.name, asset.type);
  if (asset.type === 'commodity') return commodityDisplay(symbol, asset.name);
  return bondDisplay(symbol, asset.name);
}
