import {
  LEGACY_PROVIDER_COMPATIBILITY_BINDINGS,
  getProviderMatrixEntry,
  type ProviderCompatibilityActivation,
} from '../platform/MarketData/ProviderMatrix';
import type { ProviderCapability } from '../platform/MarketData/contracts';
import type {
  MarketDataAssetClass,
  MarketDataCapability,
  MarketDataProviderDescriptor,
} from './marketDataProviderRouter';

export type ProviderActivation = ProviderCompatibilityActivation;

export interface MarketDataProviderRegistryEntry extends MarketDataProviderDescriptor {
  activation: ProviderActivation;
  environmentVariable?: string;
  purpose: string;
  governanceNotes: string;
}

const CAPABILITY_COMPATIBILITY_MAP: Readonly<Partial<Record<ProviderCapability, MarketDataCapability>>> = Object.freeze({
  history: 'history',
  bars: 'history',
  snapshot: 'snapshot',
  quote: 'quotes',
  fundamentals: 'fundamentals',
  orderbook: 'orderbook',
  'macro-series': 'macro-series',
});

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function materializeCompatibilityEntry(
  binding: (typeof LEGACY_PROVIDER_COMPATIBILITY_BINDINGS)[number],
): MarketDataProviderRegistryEntry {
  const entries = binding.matrixEntryIds.map(id => {
    const entry = getProviderMatrixEntry(id);
    if (!entry) throw new Error(`ProviderMatrix entry '${id}' required by legacy provider '${binding.legacyId}' is missing.`);
    return entry;
  });

  const assetClasses = unique(
    entries.flatMap(entry => entry.assetClasses),
  ) as MarketDataAssetClass[];

  const capabilities = unique(
    entries.flatMap(entry => entry.capabilities)
      .map(capability => CAPABILITY_COMPATIBILITY_MAP[capability])
      .filter((capability): capability is MarketDataCapability => Boolean(capability)),
  );

  return {
    id: binding.legacyId,
    assetClasses,
    capabilities,
    basePriority: binding.basePriority,
    enabled: entries.some(entry => entry.enabled),
    activation: binding.activation,
    environmentVariable: binding.environmentVariable,
    requiresApiKey: binding.requiresApiKey,
    purpose: binding.purpose,
    governanceNotes: binding.governanceNotes,
  };
}

/**
 * Compatibility projection for the older adaptive provider router.
 *
 * Routing capabilities, asset classes and enabled state are derived from the canonical
 * ProviderMatrix. This file is not an independent provider authority; legacy callers
 * consume this projection only until they migrate to ProviderRegistry/MarketDataGateway
 * or MarketDataHistoryGateway.
 */
export const MARKET_DATA_PROVIDER_REGISTRY: MarketDataProviderRegistryEntry[] =
  LEGACY_PROVIDER_COMPATIBILITY_BINDINGS.map(materializeCompatibilityEntry);

export function getMarketDataProviderRegistry(): MarketDataProviderRegistryEntry[] {
  return MARKET_DATA_PROVIDER_REGISTRY.map(entry => ({
    ...entry,
    assetClasses: [...entry.assetClasses],
    capabilities: [...entry.capabilities],
  }));
}
