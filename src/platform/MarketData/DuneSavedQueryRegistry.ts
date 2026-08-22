import type { GovernedDuneFeatureMapping } from '../FinTechCore/Modules/Crypto/Adapters/ExtendedCryptoEvidenceAdapters';

export const DUNE_SAVED_QUERY_REGISTRY_VERSION = 'dune-saved-query-registry/1.0.0' as const;

export type DuneSavedQueryKey =
  | 'AAVE_ACTIVE_ADDRESSES'
  | 'AAVE_TREASURY'
  | 'AAVE_ORACLE_RAW'
  | 'AAVE_ADDRESS_RETENTION'
  | 'AAVE_TOKEN_EMISSIONS'
  | 'AAVE_LP_CONCENTRATION';

export type DuneSavedQueryRegistryStatus = 'OWNER_ATTESTED' | 'CUSTOM_QUERY_REQUIRED';

export interface DuneSavedQueryContract {
  readonly key: DuneSavedQueryKey;
  readonly envKey: `DUNE_QUERY_${string}`;
  readonly symbol: string;
  readonly protocol: string;
  readonly chain: string;
  readonly purpose: string;
  readonly expectedColumns: readonly string[];
  readonly mappings: readonly GovernedDuneFeatureMapping[];
  readonly freshness: 'hourly' | 'daily';
  readonly unit: string;
  readonly status: DuneSavedQueryRegistryStatus;
}

export interface ResolvedDuneSavedQueryContract extends DuneSavedQueryContract {
  readonly queryId: number;
}

/**
 * Canonical semantic contracts for Dune evidence.
 *
 * Query IDs deliberately do not live in this registry. They are non-secret deployment
 * configuration resolved through the contract's envKey. This prevents a second hard-coded
 * query-ID authority and lets a reviewed Dune query be replaced without changing feature/schema
 * semantics.
 */
export const DUNE_SAVED_QUERY_CONTRACTS: readonly DuneSavedQueryContract[] = Object.freeze([
  Object.freeze({
    key: 'AAVE_ACTIVE_ADDRESSES',
    envKey: 'DUNE_QUERY_AAVE_ACTIVE_ADDRESSES',
    symbol: 'AAVE',
    protocol: 'Aave V3',
    chain: 'Ethereum',
    purpose: 'Active Addresses',
    expectedColumns: Object.freeze(['observed_at', 'active_addresses']),
    mappings: Object.freeze([
      Object.freeze({ featureKey: 'protocol.activeAddresses24h', column: 'active_addresses' }),
    ]),
    freshness: 'daily',
    unit: 'addresses',
    status: 'OWNER_ATTESTED',
  }),
  Object.freeze({
    key: 'AAVE_TREASURY',
    envKey: 'DUNE_QUERY_AAVE_TREASURY',
    symbol: 'AAVE',
    protocol: 'Aave V3',
    chain: 'Ethereum',
    purpose: 'Treasury Value Over Time',
    expectedColumns: Object.freeze(['observed_at', 'treasury_usd']),
    mappings: Object.freeze([
      // Raw treasury value only. treasuryToMarketCap requires a separately governed market-cap
      // observation and transform contract.
      Object.freeze({ featureKey: 'protocol.treasuryUsd', column: 'treasury_usd' }),
    ]),
    freshness: 'daily',
    unit: 'USD',
    status: 'OWNER_ATTESTED',
  }),
  Object.freeze({
    key: 'AAVE_ORACLE_RAW',
    envKey: 'DUNE_QUERY_AAVE_ORACLE_RAW',
    symbol: 'AAVE',
    protocol: 'Aave V3',
    chain: 'Ethereum',
    purpose: 'Oracle Raw Data',
    expectedColumns: Object.freeze([
      'observed_at',
      'asset',
      'oracle_price',
      'oracle_address',
      'oracle_updated_at',
      'oracle_decimals',
    ]),
    mappings: Object.freeze([]),
    freshness: 'hourly',
    unit: 'asset-dependent',
    status: 'CUSTOM_QUERY_REQUIRED',
  }),
  Object.freeze({
    key: 'AAVE_ADDRESS_RETENTION',
    envKey: 'DUNE_QUERY_AAVE_ADDRESS_RETENTION',
    symbol: 'AAVE',
    protocol: 'Aave V3',
    chain: 'Ethereum',
    purpose: 'Address Retention',
    expectedColumns: Object.freeze([
      'observed_at',
      'cohort_start',
      'cohort_end',
      'return_window_start',
      'return_window_end',
      'cohort_addresses',
      'retained_addresses',
      'retention_rate',
    ]),
    mappings: Object.freeze([]),
    freshness: 'daily',
    unit: 'ratio',
    status: 'CUSTOM_QUERY_REQUIRED',
  }),
  Object.freeze({
    key: 'AAVE_TOKEN_EMISSIONS',
    envKey: 'DUNE_QUERY_AAVE_TOKEN_EMISSIONS',
    symbol: 'AAVE',
    protocol: 'Aave V3',
    chain: 'Ethereum',
    purpose: 'Token Emissions',
    expectedColumns: Object.freeze(['observed_at', 'emissions']),
    mappings: Object.freeze([]),
    freshness: 'daily',
    unit: 'token',
    status: 'CUSTOM_QUERY_REQUIRED',
  }),
  Object.freeze({
    key: 'AAVE_LP_CONCENTRATION',
    envKey: 'DUNE_QUERY_AAVE_LP_CONCENTRATION',
    symbol: 'AAVE',
    protocol: 'Aave V3',
    chain: 'Ethereum',
    purpose: 'LP Concentration',
    expectedColumns: Object.freeze(['observed_at', 'lp_concentration']),
    mappings: Object.freeze([]),
    freshness: 'daily',
    unit: 'ratio',
    status: 'CUSTOM_QUERY_REQUIRED',
  }),
]);

function parsePositiveQueryId(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  if (!/^\d{1,12}$/.test(value.trim())) return null;
  const queryId = Number(value.trim());
  return Number.isSafeInteger(queryId) && queryId > 0 ? queryId : null;
}

export function resolveDuneSavedQueryContracts(
  env: NodeJS.ProcessEnv = process.env,
): readonly ResolvedDuneSavedQueryContract[] {
  const resolved = DUNE_SAVED_QUERY_CONTRACTS.flatMap((contract) => {
    const queryId = parsePositiveQueryId(env[contract.envKey]);
    if (queryId === null) return [];
    return [Object.freeze({ ...contract, queryId })];
  });

  const ids = resolved.map((item) => item.queryId);
  if (new Set(ids).size !== ids.length) {
    throw new Error('DUNE_QUERY_REGISTRY_DUPLICATE_QUERY_ID');
  }
  return Object.freeze(resolved);
}

export function resolveDuneSavedQueriesForSymbol(
  symbolInput: string,
  env: NodeJS.ProcessEnv = process.env,
): readonly ResolvedDuneSavedQueryContract[] {
  const symbol = symbolInput.toUpperCase().trim();
  return Object.freeze(resolveDuneSavedQueryContracts(env).filter((item) => item.symbol === symbol));
}

export function deriveDuneAllowedQueryIds(env: NodeJS.ProcessEnv = process.env): readonly number[] {
  return Object.freeze(resolveDuneSavedQueryContracts(env).map((item) => item.queryId));
}
