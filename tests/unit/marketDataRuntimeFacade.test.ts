import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMarketDataRuntimeFacade } from '../../server/marketData/marketDataRuntimeFacade';

const asset = (symbol: string, price = 1) => ({
  symbol,
  type: 'crypto',
  price,
  change24h: 0,
  dataSource: 'live' as const,
});

afterEach(() => {
  vi.useRealTimers();
});

describe('market-data runtime facade', () => {
  it('coalesces concurrent refresh requests and synchronizes each returned asset once per refresh', async () => {
    let resolveRefresh!: (value: ReturnType<typeof asset>[]) => void;
    const refresh = vi.fn(() => new Promise<ReturnType<typeof asset>[]>((resolve) => { resolveRefresh = resolve; }));
    const syncAsset = vi.fn();
    const runtime = createMarketDataRuntimeFacade({ refresh, syncAsset });

    const first = runtime.get();
    const second = runtime.get();
    expect(refresh).toHaveBeenCalledTimes(1);

    resolveRefresh([asset('BTC'), asset('ETH')]);
    const [a, b] = await Promise.all([first, second]);

    expect(a).toEqual(b);
    expect(syncAsset).toHaveBeenCalledTimes(2);
  });

  it('serves the valid cache without triggering another provider refresh', async () => {
    let clock = 1_000;
    const refresh = vi.fn(async () => [asset('BTC', 10)]);
    const runtime = createMarketDataRuntimeFacade({
      refresh,
      syncAsset: vi.fn(),
      ttlMs: 60_000,
      now: () => clock,
    });

    expect(await runtime.get()).toEqual([asset('BTC', 10)]);
    clock += 1_000;
    expect(await runtime.get()).toEqual([asset('BTC', 10)]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('returns stale cache when a later refresh fails', async () => {
    let clock = 1_000;
    const refresh = vi.fn()
      .mockResolvedValueOnce([asset('BTC', 10)])
      .mockRejectedValueOnce(new Error('provider outage'));
    const onRefreshFailure = vi.fn();
    const runtime = createMarketDataRuntimeFacade({
      refresh,
      syncAsset: vi.fn(),
      ttlMs: 100,
      now: () => clock,
      onRefreshFailure,
    });

    await runtime.get();
    clock += 1_000;

    expect(await runtime.get()).toEqual([asset('BTC', 10)]);
    expect(onRefreshFailure).toHaveBeenCalledTimes(1);
  });

  it('keeps background refresh fail-open and preserves the previous cache', async () => {
    const refresh = vi.fn()
      .mockResolvedValueOnce([asset('BTC', 10)])
      .mockRejectedValueOnce(new Error('offline'));
    const runtime = createMarketDataRuntimeFacade({
      refresh,
      syncAsset: vi.fn(),
      onRefreshFailure: vi.fn(),
    });

    await runtime.backgroundRefresh();
    expect(await runtime.backgroundRefresh()).toBeNull();
    expect(runtime.getCached()).toEqual([asset('BTC', 10)]);
  });

  it('defers an early background call until the configured 90-second cadence', async () => {
    vi.useFakeTimers();
    let clock = 0;
    const refresh = vi.fn(async () => [asset('BTC', 10)]);
    const runtime = createMarketDataRuntimeFacade({
      refresh,
      syncAsset: vi.fn(),
      backgroundRefreshIntervalMs: 90_000,
      now: () => clock,
    });

    await runtime.backgroundRefresh();
    expect(refresh).toHaveBeenCalledTimes(1);

    clock = 60_000;
    const deferred = runtime.backgroundRefresh();
    expect(refresh).toHaveBeenCalledTimes(1);

    clock = 89_999;
    await vi.advanceTimersByTimeAsync(29_999);
    expect(refresh).toHaveBeenCalledTimes(1);

    clock = 90_000;
    await vi.advanceTimersByTimeAsync(1);
    await deferred;
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('coalesces multiple early background calls into one scheduled refresh', async () => {
    vi.useFakeTimers();
    let clock = 0;
    const refresh = vi.fn(async () => [asset('BTC', 10)]);
    const runtime = createMarketDataRuntimeFacade({
      refresh,
      syncAsset: vi.fn(),
      backgroundRefreshIntervalMs: 90_000,
      now: () => clock,
    });

    await runtime.backgroundRefresh();
    clock = 60_000;
    const first = runtime.backgroundRefresh();
    const second = runtime.backgroundRefresh();

    clock = 90_000;
    await vi.advanceTimersByTimeAsync(30_000);
    await Promise.all([first, second]);
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
