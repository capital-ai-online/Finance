import type { MarketObservation } from './marketDataConsensus';

export type SpotPriceProvider = 'CoinAPI' | 'TwelveData' | 'EODHD';

export interface SpotPriceOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  apiKeys?: Partial<Record<SpotPriceProvider, string>>;
  nowMs?: () => number;
}

function keyFor(provider: SpotPriceProvider, options: SpotPriceOptions): string | undefined {
  if (options.apiKeys?.[provider]) return options.apiKeys[provider];
  if (provider === 'CoinAPI') return process.env.COIN_API_KEY;
  if (provider === 'TwelveData') return process.env.TWELVEDATA_API_KEY;
  return process.env.EODHD_API_KEY;
}

async function requestJson(url: string, init: RequestInit, options: SpotPriceOptions): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 4_000);
  try {
    const response = await (options.fetchImpl ?? fetch)(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCryptoSpotObservation(
  provider: SpotPriceProvider,
  symbol: string,
  options: SpotPriceOptions = {},
): Promise<MarketObservation> {
  const asset = symbol.toUpperCase().trim();
  const key = keyFor(provider, options);
  if (!key) throw new Error(`${provider} API key is not configured.`);
  const retrievedAt = new Date(options.nowMs?.() ?? Date.now()).toISOString();

  if (provider === 'CoinAPI') {
    const data = await requestJson(`https://rest.coinapi.io/v1/exchangerate/${encodeURIComponent(asset)}/USD`, {
      headers: { Accept: 'application/json', 'X-CoinAPI-Key': key },
    }, options);
    const value = Number(data?.rate);
    if (!Number.isFinite(value) || value <= 0) throw new Error('CoinAPI returned no valid USD rate.');
    const observedAt = typeof data?.time === 'string' && Number.isFinite(Date.parse(data.time))
      ? new Date(data.time).toISOString()
      : retrievedAt;
    return { provider, value, observedAt, retrievedAt, unit: 'USD', evidenceId: `spot:coinapi:${asset}:USD:${observedAt}` };
  }

  if (provider === 'TwelveData') {
    const pair = `${asset}/USD`;
    const data = await requestJson(`https://api.twelvedata.com/price?symbol=${encodeURIComponent(pair)}`, {
      headers: { Accept: 'application/json', Authorization: `apikey ${key}` },
    }, options);
    if (data?.status === 'error') throw new Error(`Twelve Data: ${data?.message || 'provider error'}`);
    const value = Number(data?.price);
    if (!Number.isFinite(value) || value <= 0) throw new Error('Twelve Data returned no valid price.');
    return { provider, value, observedAt: retrievedAt, retrievedAt, unit: 'USD', evidenceId: `spot:twelvedata:${asset}:USD:${retrievedAt}` };
  }

  const ticker = `${asset}-USD.CC`;
  const data = await requestJson(`https://eodhd.com/api/eod/${encodeURIComponent(ticker)}?api_token=${encodeURIComponent(key)}&fmt=json&period=d&order=d&from=${retrievedAt.slice(0, 10)}`, {
    headers: { Accept: 'application/json' },
  }, options);
  const row = Array.isArray(data) ? data[0] : null;
  const value = Number(row?.adjusted_close ?? row?.close);
  if (!Number.isFinite(value) || value <= 0) throw new Error('EODHD returned no valid latest EOD close.');
  const observedAt = typeof row?.date === 'string' ? `${row.date.slice(0, 10)}T23:59:59.000Z` : retrievedAt;
  return { provider, value, observedAt, retrievedAt, unit: 'USD', evidenceId: `spot:eodhd:${asset}:USD:${observedAt}` };
}
