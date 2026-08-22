import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const DEXSCREENER_PROVIDER_ID = 'dexscreener' as const;
export const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com' as const;
export const DEXSCREENER_TOKEN_EVIDENCE_VERSION = 'dexscreener-token-evidence/1.0.0' as const;

export type DexScreenerEvidenceStatus = 'VERIFIED' | 'SOURCE_UNAVAILABLE' | 'INVALID';

export interface DexScreenerTokenEvidence {
  readonly contractVersion: typeof DEXSCREENER_TOKEN_EVIDENCE_VERSION;
  readonly status: DexScreenerEvidenceStatus;
  readonly chainId: string;
  readonly tokenAddress: string;
  readonly retrievedAt: string;
  readonly evidenceRef: string | null;
  readonly pairCount: number | null;
  readonly bestPairAddress: string | null;
  readonly bestPairLiquidityUsd: number | null;
  readonly aggregateVolume24hUsd: number | null;
  readonly aggregateBuys24h: number | null;
  readonly aggregateSells24h: number | null;
  readonly oldestPairCreatedAt: string | null;
  readonly reason?: string;
}

export interface DexScreenerTokenEvidenceProviderOptions {
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
  readonly baseUrl?: string;
}

function finite(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function nestedNumber(record: Record<string, unknown>, parent: string, child: string): number | null {
  const value = record[parent];
  return value && typeof value === 'object' && !Array.isArray(value)
    ? finite((value as Record<string, unknown>)[child])
    : null;
}

function sum(values: readonly (number | null)[]): number | null {
  const usable = values.filter((value): value is number => value !== null);
  return usable.length > 0 ? usable.reduce((total, value) => total + value, 0) : null;
}

export class DexScreenerTokenEvidenceProvider {
  private readonly http: ResearchEvidenceProviderHttp;
  private readonly nowMs: () => number;

  constructor(options: DexScreenerTokenEvidenceProviderOptions = {}) {
    this.nowMs = options.nowMs ?? Date.now;
    const transport: ResearchEvidenceProviderHttpOptions = {
      baseUrl: options.baseUrl ?? DEXSCREENER_BASE_URL,
      apiKey: null,
      apiKeyRequired: false,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: this.nowMs,
    };
    this.http = new ResearchEvidenceProviderHttp(DEXSCREENER_PROVIDER_ID, 'onchain', transport);
  }

  public async getTokenPairs(chainIdInput: string, tokenAddressInput: string): Promise<DexScreenerTokenEvidence> {
    const chainId = chainIdInput.toLowerCase().trim();
    const tokenAddress = tokenAddressInput.trim();
    if (!/^[a-z0-9_-]{1,30}$/.test(chainId) || tokenAddress.length < 20 || tokenAddress.length > 80) {
      return Object.freeze({
        contractVersion: DEXSCREENER_TOKEN_EVIDENCE_VERSION,
        status: 'INVALID',
        chainId,
        tokenAddress,
        retrievedAt: new Date(this.nowMs()).toISOString(),
        evidenceRef: null,
        pairCount: null,
        bestPairAddress: null,
        bestPairLiquidityUsd: null,
        aggregateVolume24hUsd: null,
        aggregateBuys24h: null,
        aggregateSells24h: null,
        oldestPairCreatedAt: null,
        reason: 'Governed DEX Screener chain/token identity is invalid.',
      });
    }

    const result = await this.http.requestJson(`/token-pairs/v1/${encodeURIComponent(chainId)}/${encodeURIComponent(tokenAddress)}`);
    if (result.status !== 'READY' || !Array.isArray(result.data)) {
      return Object.freeze({
        contractVersion: DEXSCREENER_TOKEN_EVIDENCE_VERSION,
        status: 'SOURCE_UNAVAILABLE',
        chainId,
        tokenAddress,
        retrievedAt: result.retrievedAt,
        evidenceRef: null,
        pairCount: null,
        bestPairAddress: null,
        bestPairLiquidityUsd: null,
        aggregateVolume24hUsd: null,
        aggregateBuys24h: null,
        aggregateSells24h: null,
        oldestPairCreatedAt: null,
        reason: result.reason ?? 'DEX Screener token-pairs source unavailable.',
      });
    }

    const pairs = result.data.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)));
    if (pairs.length === 0) {
      return Object.freeze({
        contractVersion: DEXSCREENER_TOKEN_EVIDENCE_VERSION,
        status: 'SOURCE_UNAVAILABLE',
        chainId,
        tokenAddress,
        retrievedAt: result.retrievedAt,
        evidenceRef: null,
        pairCount: 0,
        bestPairAddress: null,
        bestPairLiquidityUsd: null,
        aggregateVolume24hUsd: null,
        aggregateBuys24h: null,
        aggregateSells24h: null,
        oldestPairCreatedAt: null,
        reason: 'DEX Screener returned no pools for the governed token identity.',
      });
    }

    const byLiquidity = [...pairs].sort((a, b) => (nestedNumber(b, 'liquidity', 'usd') ?? -1) - (nestedNumber(a, 'liquidity', 'usd') ?? -1));
    const best = byLiquidity[0];
    const createdTimes = pairs.map(pair => finite(pair.pairCreatedAt)).filter((value): value is number => value !== null && value > 0);
    const oldestMs = createdTimes.length > 0 ? Math.min(...createdTimes) : null;
    const oldestDate = oldestMs === null ? null : new Date(oldestMs);

    return Object.freeze({
      contractVersion: DEXSCREENER_TOKEN_EVIDENCE_VERSION,
      status: 'VERIFIED',
      chainId,
      tokenAddress,
      retrievedAt: result.retrievedAt,
      evidenceRef: `dexscreener:token-pairs:${chainId}:${tokenAddress}:${result.retrievedAt}`,
      pairCount: pairs.length,
      bestPairAddress: typeof best.pairAddress === 'string' ? best.pairAddress : null,
      bestPairLiquidityUsd: nestedNumber(best, 'liquidity', 'usd'),
      aggregateVolume24hUsd: sum(pairs.map(pair => nestedNumber(pair, 'volume', 'h24'))),
      aggregateBuys24h: sum(pairs.map(pair => {
        const txns = pair.txns && typeof pair.txns === 'object' ? pair.txns as Record<string, unknown> : null;
        const h24 = txns?.h24 && typeof txns.h24 === 'object' ? txns.h24 as Record<string, unknown> : null;
        return finite(h24?.buys);
      })),
      aggregateSells24h: sum(pairs.map(pair => {
        const txns = pair.txns && typeof pair.txns === 'object' ? pair.txns as Record<string, unknown> : null;
        const h24 = txns?.h24 && typeof txns.h24 === 'object' ? txns.h24 as Record<string, unknown> : null;
        return finite(h24?.sells);
      })),
      oldestPairCreatedAt: oldestDate && !Number.isNaN(oldestDate.getTime()) ? oldestDate.toISOString() : null,
    });
  }
}
