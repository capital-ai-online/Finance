import {
  UNIVERSE_SLA_CONTRACT_VERSION,
  createUniversalAssetIdentity,
  evaluateUniverseSla,
  type UniverseSlaResult,
  type UniversalAssetClass,
} from '../platform/Scoring';

export const UNIVERSE_AVAILABILITY_PROJECTION_VERSION = 'universe-availability-projection/1.0.0' as const;

const UNIVERSAL_ASSET_CLASSES: readonly UniversalAssetClass[] = [
  'crypto',
  'stock',
  'forex',
  'commodity',
  'index',
  'bond',
];

const PROVIDER_DEGRADED_STATUSES = new Set([
  'PROVIDER_TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'SOURCE_UNAVAILABLE',
  'DATA_UNAVAILABLE',
]);

export interface UniverseAvailabilityCatalogAsset {
  readonly symbol?: string;
  readonly name?: string;
  readonly type?: string;
  readonly subtype?: string;
  readonly instrumentKind?: string;
}

export interface UniverseAvailabilityRuntimeRow {
  readonly symbol?: string;
  readonly assetType?: string;
  readonly status?: string;
  readonly providers?: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly screeningEligible?: boolean;
  readonly providerDegraded?: boolean;
}

export interface UniverseAvailabilityClassProjection {
  readonly assetClass: UniversalAssetClass;
  readonly discoveredCount: number;
  readonly evaluatedCount: number;
  readonly topLevel: UniverseSlaResult;
  readonly subcategories: readonly UniverseSlaResult[];
}

export interface UniverseAvailabilityProjection {
  readonly contractVersion: typeof UNIVERSE_AVAILABILITY_PROJECTION_VERSION;
  readonly universeSlaContractVersion: typeof UNIVERSE_SLA_CONTRACT_VERSION;
  readonly authority: 'read-only-runtime-projection';
  readonly noDemoData: true;
  readonly classes: readonly UniverseAvailabilityClassProjection[];
}

export function isUniverseAssetClass(value: unknown): value is UniversalAssetClass {
  return typeof value === 'string' && UNIVERSAL_ASSET_CLASSES.includes(value as UniversalAssetClass);
}

function categoryFor(asset: UniverseAvailabilityCatalogAsset): string | undefined {
  const subtype = asset.subtype?.trim();
  if (subtype) return subtype;
  const instrumentKind = asset.instrumentKind?.trim();
  return instrumentKind || undefined;
}

function cleanStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).map(value => String(value).trim()).filter(Boolean))];
}

/**
 * Builds the read-only P1 availability projection from already discovered catalog identities and
 * already executed runtime evidence results. It never performs provider I/O and never creates
 * filler assets. READY alone is not enough: at least one provider and evidence id must be present.
 */
export function buildUniverseAvailabilityProjection(
  catalog: readonly UniverseAvailabilityCatalogAsset[],
  runtimeRows: readonly UniverseAvailabilityRuntimeRow[],
): UniverseAvailabilityProjection {
  const runtimeByAssetId = new Map<string, UniverseAvailabilityRuntimeRow>();

  for (const row of runtimeRows) {
    if (!row.symbol || !isUniverseAssetClass(row.assetType)) continue;
    try {
      const asset = createUniversalAssetIdentity({
        symbol: row.symbol,
        assetClass: row.assetType,
        source: 'request',
      });
      runtimeByAssetId.set(asset.assetId, row);
    } catch {
      // Invalid runtime identities are ignored rather than promoted into availability evidence.
    }
  }

  const records = [] as Array<{
    asset: ReturnType<typeof createUniversalAssetIdentity>;
    category?: string;
    admitted: boolean;
    evidenceSufficient: boolean;
    providerDegraded?: boolean;
  }>;

  for (const candidate of catalog) {
    if (!candidate.symbol || !isUniverseAssetClass(candidate.type)) continue;
    try {
      const asset = createUniversalAssetIdentity({
        symbol: candidate.symbol,
        name: candidate.name,
        assetClass: candidate.type,
        subtype: candidate.subtype,
        instrumentKind: candidate.instrumentKind,
        source: 'catalog',
      });
      const runtime = runtimeByAssetId.get(asset.assetId);
      const providers = cleanStrings(runtime?.providers);
      const evidenceIds = cleanStrings(runtime?.evidenceIds);
      const ready = runtime?.status === 'READY';
      const screeningAllows = runtime?.screeningEligible !== false;
      const evidenceSufficient = Boolean(ready && screeningAllows && providers.length > 0 && evidenceIds.length > 0);
      const providerDegraded = Boolean(
        runtime?.providerDegraded
        || (runtime?.status && PROVIDER_DEGRADED_STATUSES.has(runtime.status)),
      );

      records.push({
        asset,
        category: categoryFor(candidate),
        admitted: Boolean(ready),
        evidenceSufficient,
        providerDegraded,
      });
    } catch {
      // Invalid catalog identities remain outside the admitted universe and cannot satisfy the SLA.
    }
  }

  const classes = UNIVERSAL_ASSET_CLASSES
    .filter(assetClass => records.some(record => record.asset.assetClass === assetClass))
    .map<UniverseAvailabilityClassProjection>((assetClass) => {
      const classRecords = records.filter(record => record.asset.assetClass === assetClass);
      const discoveredCount = new Set(classRecords.map(record => record.asset.assetId)).size;
      const evaluatedCount = new Set(
        classRecords
          .filter(record => runtimeByAssetId.has(record.asset.assetId))
          .map(record => record.asset.assetId),
      ).size;
      const categories = [...new Set(
        classRecords.map(record => record.category).filter((value): value is string => Boolean(value)),
      )].sort((a, b) => a.localeCompare(b));

      return Object.freeze({
        assetClass,
        discoveredCount,
        evaluatedCount,
        topLevel: evaluateUniverseSla(classRecords, assetClass),
        subcategories: Object.freeze(categories.map(category => evaluateUniverseSla(classRecords, assetClass, category))),
      });
    });

  return Object.freeze({
    contractVersion: UNIVERSE_AVAILABILITY_PROJECTION_VERSION,
    universeSlaContractVersion: UNIVERSE_SLA_CONTRACT_VERSION,
    authority: 'read-only-runtime-projection',
    noDemoData: true,
    classes: Object.freeze(classes),
  });
}
