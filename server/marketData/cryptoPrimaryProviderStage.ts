import type { MarketDataProviderStage, MarketDataAsset } from './marketDataCoordinator';
import type { CryptoFallbackAsset } from './cryptoProviderChain';
import { recordProviderHealth } from '../../src/platform/Supervisor/providerHealth';

let cmcCoolDownUntil = 0;
let coingeckoCoolDownUntil = 0;

const DEFAULT_PROVIDER_ERROR_COOLDOWN_MS = 5 * 60_000;
const MIN_RATE_LIMIT_COOLDOWN_MS = 60 * 60_000;
const MARKET_CAPABILITY = 'crypto-global-market-snapshot';

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function retryAfterMs(response: Response, nowMs: number): number {
  const raw = response.headers.get('retry-after');
  if (!raw) return MIN_RATE_LIMIT_COOLDOWN_MS;

  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.max(MIN_RATE_LIMIT_COOLDOWN_MS, seconds * 1000);
  }

  const retryAt = Date.parse(raw);
  if (Number.isFinite(retryAt)) {
    return Math.max(MIN_RATE_LIMIT_COOLDOWN_MS, retryAt - nowMs);
  }

  return MIN_RATE_LIMIT_COOLDOWN_MS;
}

function normalizeCryptoAsset(asset: {
  symbol: string;
  name: string;
  price: unknown;
  change24h: unknown;
  marketCap: unknown;
  volume24h: unknown;
  circulatingSupply?: unknown;
  maxSupply?: unknown;
  totalSupply?: unknown;
}): MarketDataAsset {
  const change24h = toFiniteNumber(asset.change24h);
  const baseMomentum = 5 + (change24h > 0 ? Math.min(4, change24h / 2) : Math.max(-4, change24h / 2));
  const score = Math.min(10, Math.max(1, Number((baseMomentum * 0.75 + 0.4).toFixed(1))));

  return {
    symbol: asset.symbol.toUpperCase(),
    name: asset.name,
    type: 'crypto',
    price: toFiniteNumber(asset.price),
    change24h: Number(change24h.toFixed(2)),
    grahamScore: 0,
    momentum: Number(baseMomentum.toFixed(1)),
    risk: 'High',
    status: 'Verifiziert',
    marketCap: Number((toFiniteNumber(asset.marketCap) / 1e9).toFixed(1)),
    dividendYield: 0,
    volume24h: Number((toFiniteNumber(asset.volume24h) / 1e6).toFixed(2)),
    score,
    dataSource: 'live',
    circulatingSupply: typeof asset.circulatingSupply === 'number' ? asset.circulatingSupply : undefined,
    maxSupply: typeof asset.maxSupply === 'number' ? asset.maxSupply : asset.maxSupply === null ? null : undefined,
    totalSupply: typeof asset.totalSupply === 'number' ? asset.totalSupply : undefined,
  };
}

export function createCryptoPrimaryProviderStage(options: {
  fallbackAssets: CryptoFallbackAsset[];
  getCoinMarketCapApiKey?: () => string | undefined;
  fetchImpl?: typeof fetch;
  now?: () => number;
  logger?: Pick<Console, 'info' | 'warn'>;
}): MarketDataProviderStage {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const logger = options.logger ?? console;

  return {
    name: 'crypto-primary-sources',
    async load() {
      const cmcKey = options.getCoinMarketCapApiKey?.();
      if (!cmcKey) {
        recordProviderHealth({
          provider: 'CoinMarketCap',
          capability: MARKET_CAPABILITY,
          state: 'degraded',
          diagnosticCode: 'not_configured',
          payloadUsable: false,
          message: 'CoinMarketCap API key is not configured.',
        });
      } else if (now() < cmcCoolDownUntil) {
        recordProviderHealth({
          provider: 'CoinMarketCap',
          capability: MARKET_CAPABILITY,
          state: 'degraded',
          diagnosticCode: 'rate_limited',
          payloadUsable: false,
          circuitOpenUntil: new Date(cmcCoolDownUntil).toISOString(),
          message: 'CoinMarketCap request is suppressed by the active provider cooldown.',
        });
      } else {
        try {
          const response = await fetchImpl('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=100&convert=USD', {
            headers: { 'X-CMC_PRO_API_KEY': cmcKey, Accept: 'application/json' },
          });
          if (!response.ok) {
            const nowMs = now();
            const authError = response.status === 401 || response.status === 403;
            if (response.status === 429) {
              const cooldownMs = retryAfterMs(response, nowMs);
              cmcCoolDownUntil = nowMs + cooldownMs;
              recordProviderHealth({
                provider: 'CoinMarketCap',
                capability: MARKET_CAPABILITY,
                state: 'degraded',
                diagnosticCode: 'rate_limited',
                payloadUsable: false,
                circuitOpenUntil: new Date(cmcCoolDownUntil).toISOString(),
                message: `CoinMarketCap returned HTTP 429; provider paused for ${Math.ceil(cooldownMs / 60_000)} minutes.`,
              });
              logger.info(`[Crypto Live API] CoinMarketCap rate-limited; provider paused for ${Math.ceil(cooldownMs / 60_000)} minutes.`);
            } else {
              cmcCoolDownUntil = nowMs + DEFAULT_PROVIDER_ERROR_COOLDOWN_MS;
              recordProviderHealth({
                provider: 'CoinMarketCap',
                capability: MARKET_CAPABILITY,
                state: 'unavailable',
                diagnosticCode: authError ? 'auth_error' : 'provider_error',
                payloadUsable: false,
                circuitOpenUntil: new Date(cmcCoolDownUntil).toISOString(),
                message: `CoinMarketCap returned HTTP ${response.status}.`,
              });
              logger.warn(`[Crypto Live API Warning] CoinMarketCap returned status ${response.status}; fallback provider will be used.`);
            }
          } else {
            const payload = await response.json() as any;
            if (!Array.isArray(payload?.data) || payload.data.length === 0) {
              recordProviderHealth({
                provider: 'CoinMarketCap',
                capability: MARKET_CAPABILITY,
                state: 'unavailable',
                diagnosticCode: 'schema_error',
                payloadUsable: false,
                message: 'CoinMarketCap returned an empty or invalid data payload.',
              });
              throw new Error('CoinMarketCap API returned invalid format');
            }
            recordProviderHealth({
              provider: 'CoinMarketCap',
              capability: MARKET_CAPABILITY,
              state: 'healthy',
              diagnosticCode: 'healthy',
              payloadUsable: true,
              cacheMode: 'live',
              message: `CoinMarketCap returned ${payload.data.length} usable assets.`,
            });
            logger.info(`[Crypto Live API] CoinMarketCap loaded ${payload.data.length} assets`);
            return payload.data.map((coin: any) => normalizeCryptoAsset({
              symbol: coin.symbol,
              name: coin.name,
              price: coin.quote?.USD?.price,
              change24h: coin.quote?.USD?.percent_change_24h,
              marketCap: coin.quote?.USD?.market_cap,
              volume24h: coin.quote?.USD?.volume_24h,
              circulatingSupply: coin.circulating_supply,
              maxSupply: coin.max_supply,
              totalSupply: coin.total_supply,
            }));
          }
        } catch (error: any) {
          cmcCoolDownUntil = Math.max(cmcCoolDownUntil, now() + DEFAULT_PROVIDER_ERROR_COOLDOWN_MS);
          recordProviderHealth({
            provider: 'CoinMarketCap',
            capability: MARKET_CAPABILITY,
            state: 'unavailable',
            diagnosticCode: 'transport_error',
            payloadUsable: false,
            circuitOpenUntil: new Date(cmcCoolDownUntil).toISOString(),
            message: error?.message || String(error),
          });
          logger.warn('[Crypto Live API Warning] CoinMarketCap request failed:', error?.message || error);
        }
      }

      if (now() < coingeckoCoolDownUntil) {
        recordProviderHealth({
          provider: 'CoinGecko',
          capability: MARKET_CAPABILITY,
          state: 'degraded',
          diagnosticCode: 'rate_limited',
          payloadUsable: false,
          circuitOpenUntil: new Date(coingeckoCoolDownUntil).toISOString(),
          message: 'CoinGecko request is suppressed by the active provider cooldown.',
        });
      } else {
        try {
          const response = await fetchImpl('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false');
          if (!response.ok) {
            const nowMs = now();
            if (response.status === 429) {
              const cooldownMs = retryAfterMs(response, nowMs);
              coingeckoCoolDownUntil = nowMs + cooldownMs;
              recordProviderHealth({
                provider: 'CoinGecko',
                capability: MARKET_CAPABILITY,
                state: 'degraded',
                diagnosticCode: 'rate_limited',
                payloadUsable: false,
                circuitOpenUntil: new Date(coingeckoCoolDownUntil).toISOString(),
                message: `CoinGecko returned HTTP 429; provider paused for ${Math.ceil(cooldownMs / 60_000)} minutes.`,
              });
              logger.info(`[Crypto Live API] CoinGecko rate-limited; provider paused for ${Math.ceil(cooldownMs / 60_000)} minutes.`);
            } else {
              coingeckoCoolDownUntil = nowMs + DEFAULT_PROVIDER_ERROR_COOLDOWN_MS;
              recordProviderHealth({
                provider: 'CoinGecko',
                capability: MARKET_CAPABILITY,
                state: 'unavailable',
                diagnosticCode: 'provider_error',
                payloadUsable: false,
                circuitOpenUntil: new Date(coingeckoCoolDownUntil).toISOString(),
                message: `CoinGecko returned HTTP ${response.status}.`,
              });
              logger.warn(`[Crypto Live API Warning] CoinGecko returned status ${response.status}; fallback provider will be used.`);
            }
          } else {
            const payload = await response.json() as any;
            if (!Array.isArray(payload) || payload.length === 0) {
              recordProviderHealth({
                provider: 'CoinGecko',
                capability: MARKET_CAPABILITY,
                state: 'unavailable',
                diagnosticCode: 'schema_error',
                payloadUsable: false,
                message: 'CoinGecko returned an empty or invalid data payload.',
              });
              throw new Error('CoinGecko API returned invalid format');
            }
            recordProviderHealth({
              provider: 'CoinGecko',
              capability: MARKET_CAPABILITY,
              state: 'healthy',
              diagnosticCode: 'healthy',
              payloadUsable: true,
              cacheMode: 'live',
              message: `CoinGecko returned ${payload.length} usable assets.`,
            });
            logger.info(`[Crypto Live API] CoinGecko loaded ${payload.length} assets`);
            return payload.map((coin: any) => normalizeCryptoAsset({
              symbol: coin.symbol,
              name: coin.name,
              price: coin.current_price,
              change24h: coin.price_change_percentage_24h,
              marketCap: coin.market_cap,
              volume24h: coin.total_volume,
              circulatingSupply: coin.circulating_supply,
              maxSupply: coin.max_supply,
              totalSupply: coin.total_supply,
            }));
          }
        } catch (error: any) {
          coingeckoCoolDownUntil = Math.max(coingeckoCoolDownUntil, now() + DEFAULT_PROVIDER_ERROR_COOLDOWN_MS);
          recordProviderHealth({
            provider: 'CoinGecko',
            capability: MARKET_CAPABILITY,
            state: 'unavailable',
            diagnosticCode: 'transport_error',
            payloadUsable: false,
            circuitOpenUntil: new Date(coingeckoCoolDownUntil).toISOString(),
            message: error?.message || String(error),
          });
          logger.warn('[Crypto Live API Warning] CoinGecko request failed:', error?.message || error);
        }
      }

      return [];
    },
  };
}
