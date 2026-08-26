import { getAssetSearchCatalog } from '../lib/assetSearchCatalog';
import { getProviderMatrixEntry } from '../platform/MarketData/ProviderMatrix';
import {
  classifyCommodityResearchInstrumentKind,
  commodityResearchDomainFromInstrumentKind,
  type CommodityResearchDomain,
  type CommodityResearchInstrumentKind,
} from '../platform/Scoring/CommodityResearchModelContracts';
import type { AssetCatalogEntry } from './assetCatalogIntegrity';
import { resolveTwelveDataCommodityReference } from './commodityMarketEvidence';

export const COMMODITY_UNIVERSE_SLA_VERSION = 'commodity-universe-sla/1.0.0' as const;
export const COMMODITY_UNIVERSE_TARGET = 24 as const;
export const COMMODITY_DOMAIN_TARGET = 6 as const;
export const TWELVEDATA_TIME_SERIES_CREDITS_PER_SYMBOL = 1 as const;

const COVERAGE_CACHE_TTL_MS = 15 * 60 * 1000;
const DOMAIN_ORDER: readonly CommodityResearchDomain[] = [
  'energy',
  'industrial-metals',
  'precious-metals',
  'agriculture',
];

export interface CommodityUniverseCandidateView {
  readonly symbol: string;
  readonly name: string;
  readonly domain: CommodityResearchDomain;
  readonly instrumentKind: CommodityResearchInstrumentKind;
  readonly providerId: 'twelvedata';
  readonly mappingStatus: 'MAPPED';
}

export interface CommodityUniverseDomainCoverage {
  readonly domain: CommodityResearchDomain;
  readonly catalogCandidates: number;
  readonly checkedCandidates: number;
  readonly mappedCandidates: number;
  readonly targetCandidates: typeof COMMODITY_DOMAIN_TARGET;
  readonly targetMet: boolean;
}

export interface CommodityUniverseProviderBudget {
  readonly providerId: 'twelvedata';
  readonly internalRateLimitCapacity: number;
  readonly internalRateLimitWindowMs: number;
  readonly plannedHistorySymbols: typeof COMMODITY_UNIVERSE_TARGET;
  readonly timeSeriesCreditsPerSymbol: typeof TWELVEDATA_TIME_SERIES_CREDITS_PER_SYMBOL;
  readonly plannedHistoryCredits: number;
  readonly withinInternalRateLimit: boolean;
  readonly externalPlanQuotaStatus: 'UNVERIFIED';
  readonly historyProbePerformed: false;
}

export interface CommodityUniverseSlaAssessment {
  readonly version: typeof COMMODITY_UNIVERSE_SLA_VERSION;
  readonly assessedAt: string;
  readonly status: 'MAPPING_READY' | 'GAP' | 'SOURCE_UNAVAILABLE';
  readonly targetCandidates: typeof COMMODITY_UNIVERSE_TARGET;
  readonly selectedCandidates: readonly CommodityUniverseCandidateView[];
  readonly selectedCandidateCount: number;
  readonly checkedCandidateCount: number;
  readonly domainCoverage: readonly CommodityUniverseDomainCoverage[];
  readonly providerBudget: CommodityUniverseProviderBudget;
  readonly exitGateEligible: false;
  readonly canonical: false;
  readonly scoreEligible: false;
  readonly rankingEligible: false;
  readonly executionEligible: false;
  readonly reason: string;
}

type CommodityReferenceResolver = (
  symbol: string,
) => Promise<Readonly<{ symbol: string; name: string }> | null>;

interface ClassifiedCommodityCandidate {
  readonly entry: AssetCatalogEntry;
  readonly domain: CommodityResearchDomain;
  readonly instrumentKind: CommodityResearchInstrumentKind;
}

function classifyCatalogCandidate(entry: AssetCatalogEntry): ClassifiedCommodityCandidate {
  const instrumentKind = classifyCommodityResearchInstrumentKind(
    entry.symbol,
    entry.name,
    entry.instrumentKind,
  );
  return {
    entry,
    instrumentKind,
    domain: commodityResearchDomainFromInstrumentKind(instrumentKind),
  };
}

function providerBudget(): CommodityUniverseProviderBudget {
  const provider = getProviderMatrixEntry('twelvedata');
  const capacity = provider?.rateLimit.capacity ?? 0;
  const windowMs = provider?.rateLimit.windowMs ?? 60_000;
  const plannedHistoryCredits = COMMODITY_UNIVERSE_TARGET * TWELVEDATA_TIME_SERIES_CREDITS_PER_SYMBOL;
  return Object.freeze({
    providerId: 'twelvedata' as const,
    internalRateLimitCapacity: capacity,
    internalRateLimitWindowMs: windowMs,
    plannedHistorySymbols: COMMODITY_UNIVERSE_TARGET,
    timeSeriesCreditsPerSymbol: TWELVEDATA_TIME_SERIES_CREDITS_PER_SYMBOL,
    plannedHistoryCredits,
    withinInternalRateLimit: capacity >= plannedHistoryCredits,
    externalPlanQuotaStatus: 'UNVERIFIED' as const,
    historyProbePerformed: false as const,
  });
}

/**
 * P3-B mapping-only SLA assessment.
 *
 * This function may resolve provider reference identities, but it never requests commodity history,
 * executes a score, mutates the registry or creates filler assets. The full 24-symbol history budget
 * is modeled explicitly and remains unexecuted until a separately governed evidence run.
 */
export async function assessCommodityUniverseSla(input: Readonly<{
  catalog?: readonly AssetCatalogEntry[];
  resolveReference?: CommodityReferenceResolver;
  nowMs?: number;
}> = {}): Promise<CommodityUniverseSlaAssessment> {
  const catalog = (input.catalog ?? getAssetSearchCatalog())
    .filter((entry): entry is AssetCatalogEntry => entry.type === 'commodity')
    .map(classifyCatalogCandidate)
    .sort((a, b) => a.entry.symbol.localeCompare(b.entry.symbol));
  const resolveReference = input.resolveReference ?? (symbol => resolveTwelveDataCommodityReference(symbol));
  const selected: CommodityUniverseCandidateView[] = [];
  const checkedByDomain = new Map<CommodityResearchDomain, number>(DOMAIN_ORDER.map(domain => [domain, 0]));
  const mappedByDomain = new Map<CommodityResearchDomain, number>(DOMAIN_ORDER.map(domain => [domain, 0]));
  let checkedCandidateCount = 0;

  for (const domain of DOMAIN_ORDER) {
    const domainCandidates = catalog.filter(candidate => candidate.domain === domain);
    for (const candidate of domainCandidates) {
      if ((mappedByDomain.get(domain) ?? 0) >= COMMODITY_DOMAIN_TARGET) break;
      checkedCandidateCount += 1;
      checkedByDomain.set(domain, (checkedByDomain.get(domain) ?? 0) + 1);

      let reference: Awaited<ReturnType<CommodityReferenceResolver>>;
      try {
        reference = await resolveReference(candidate.entry.symbol);
      } catch {
        const coverage = DOMAIN_ORDER.map(currentDomain => {
          const catalogCandidates = catalog.filter(item => item.domain === currentDomain).length;
          const mappedCandidates = mappedByDomain.get(currentDomain) ?? 0;
          return Object.freeze({
            domain: currentDomain,
            catalogCandidates,
            checkedCandidates: checkedByDomain.get(currentDomain) ?? 0,
            mappedCandidates,
            targetCandidates: COMMODITY_DOMAIN_TARGET,
            targetMet: mappedCandidates >= COMMODITY_DOMAIN_TARGET,
          });
        });
        return Object.freeze({
          version: COMMODITY_UNIVERSE_SLA_VERSION,
          assessedAt: new Date(input.nowMs ?? Date.now()).toISOString(),
          status: 'SOURCE_UNAVAILABLE' as const,
          targetCandidates: COMMODITY_UNIVERSE_TARGET,
          selectedCandidates: Object.freeze([...selected]),
          selectedCandidateCount: selected.length,
          checkedCandidateCount,
          domainCoverage: Object.freeze(coverage),
          providerBudget: providerBudget(),
          exitGateEligible: false as const,
          canonical: false as const,
          scoreEligible: false as const,
          rankingEligible: false as const,
          executionEligible: false as const,
          reason: 'Provider reference catalog is temporarily unavailable; universe coverage remains unverified.',
        });
      }

      if (!reference) continue;
      mappedByDomain.set(domain, (mappedByDomain.get(domain) ?? 0) + 1);
      selected.push(Object.freeze({
        symbol: candidate.entry.symbol,
        name: candidate.entry.name,
        domain,
        instrumentKind: candidate.instrumentKind,
        providerId: 'twelvedata' as const,
        mappingStatus: 'MAPPED' as const,
      }));
    }
  }

  const coverage = DOMAIN_ORDER.map(domain => {
    const catalogCandidates = catalog.filter(item => item.domain === domain).length;
    const mappedCandidates = mappedByDomain.get(domain) ?? 0;
    return Object.freeze({
      domain,
      catalogCandidates,
      checkedCandidates: checkedByDomain.get(domain) ?? 0,
      mappedCandidates,
      targetCandidates: COMMODITY_DOMAIN_TARGET,
      targetMet: mappedCandidates >= COMMODITY_DOMAIN_TARGET,
    });
  });
  const mappingReady = selected.length === COMMODITY_UNIVERSE_TARGET
    && coverage.every(item => item.targetMet);
  const budget = providerBudget();

  return Object.freeze({
    version: COMMODITY_UNIVERSE_SLA_VERSION,
    assessedAt: new Date(input.nowMs ?? Date.now()).toISOString(),
    status: mappingReady ? 'MAPPING_READY' as const : 'GAP' as const,
    targetCandidates: COMMODITY_UNIVERSE_TARGET,
    selectedCandidates: Object.freeze([...selected]),
    selectedCandidateCount: selected.length,
    checkedCandidateCount,
    domainCoverage: Object.freeze(coverage),
    providerBudget: budget,
    exitGateEligible: false as const,
    canonical: false as const,
    scoreEligible: false as const,
    rankingEligible: false as const,
    executionEligible: false as const,
    reason: mappingReady
      ? 'Mapping target is met. P3-B exit remains blocked until external TwelveData plan quota and real history availability are verified.'
      : 'One or more commodity domains do not have six unambiguous provider mappings; no synthetic filler is permitted.',
  });
}

let cachedAssessment: { expiresAt: number; value: CommodityUniverseSlaAssessment } | null = null;
let inFlightAssessment: Promise<CommodityUniverseSlaAssessment> | null = null;

export async function getCommodityUniverseSlaAssessment(): Promise<CommodityUniverseSlaAssessment> {
  const now = Date.now();
  if (cachedAssessment && cachedAssessment.expiresAt > now) return cachedAssessment.value;
  if (inFlightAssessment) return inFlightAssessment;

  inFlightAssessment = assessCommodityUniverseSla({ nowMs: now })
    .then(value => {
      cachedAssessment = { expiresAt: now + COVERAGE_CACHE_TTL_MS, value };
      return value;
    })
    .finally(() => {
      inFlightAssessment = null;
    });
  return inFlightAssessment;
}

export function resetCommodityUniverseSlaCacheForTests(): void {
  cachedAssessment = null;
  inFlightAssessment = null;
}
