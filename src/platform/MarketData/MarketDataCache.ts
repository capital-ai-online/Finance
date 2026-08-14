import type { CanonicalMarketDataSnapshot, SnapshotRequest } from './contracts';

interface CacheEntry {
  snapshot: CanonicalMarketDataSnapshot;
  expiresAtMs: number;
}

export interface MarketDataCacheOptions {
  maxEntries?: number;
  nowMs?: () => number;
}

export function marketDataRequestKey(request: SnapshotRequest): string {
  return JSON.stringify({
    symbol: request.symbol.toUpperCase().trim(),
    assetClass: request.assetClass,
    maxAgeMs: request.maxAgeMs ?? null,
    allowStale: request.allowStale === true,
    includeShadow: request.includeShadow === true,
    allowedProviderIds: [...(request.allowedProviderIds ?? [])].sort(),
  });
}

export class MarketDataCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly maxEntries: number;
  private readonly nowMs: () => number;

  constructor(options: MarketDataCacheOptions = {}) {
    this.maxEntries = Math.max(1, options.maxEntries ?? 500);
    this.nowMs = options.nowMs ?? Date.now;
  }

  get(key: string): CanonicalMarketDataSnapshot | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAtMs <= this.nowMs()) {
      this.entries.delete(key);
      return null;
    }
    return { ...entry.snapshot };
  }

  set(key: string, snapshot: CanonicalMarketDataSnapshot, ttlMs: number): void {
    if (ttlMs <= 0 || snapshot.price === null) return;
    if (!['LIVE', 'DELAYED', 'HISTORICAL', 'STALE'].includes(snapshot.qualityState)) return;
    if (!this.entries.has(key) && this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value as string | undefined;
      if (oldestKey) this.entries.delete(oldestKey);
    }
    this.entries.set(key, { snapshot: { ...snapshot }, expiresAtMs: this.nowMs() + ttlMs });
  }

  delete(key: string): void {
    this.entries.delete(key);
  }
}
