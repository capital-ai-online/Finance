import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const GOPLUS_TOKEN_SECURITY_PROVIDER_ID = 'goplus' as const;
export const GOPLUS_TOKEN_SECURITY_CONTRACT_VERSION = 'goplus-token-security-evidence/1.0.0' as const;
export const GOPLUS_BASE_URL = 'https://api.gopluslabs.io/api/v1' as const;

export type GoPlusEvidenceStatus = 'VERIFIED' | 'NOT_CONFIGURED' | 'SOURCE_UNAVAILABLE' | 'INVALID';

export interface GoPlusTokenIdentity {
  readonly chainId: string;
  readonly contractAddress: string;
}

export interface GoPlusHolderEvidence {
  readonly address: string | null;
  readonly percent: number | null;
  readonly isLocked: boolean | null;
  readonly tag: string | null;
}

export interface GoPlusTokenSecurityEvidence {
  readonly contractVersion: typeof GOPLUS_TOKEN_SECURITY_CONTRACT_VERSION;
  readonly status: GoPlusEvidenceStatus;
  readonly identity: GoPlusTokenIdentity;
  readonly retrievedAt: string;
  readonly evidenceId: string | null;
  readonly isOpenSource: boolean | null;
  readonly isProxy: boolean | null;
  readonly isMintable: boolean | null;
  readonly isBlacklisted: boolean | null;
  readonly transferPausable: boolean | null;
  readonly ownerCanChangeBalance: boolean | null;
  readonly isHoneypot: boolean | null;
  readonly cannotBuy: boolean | null;
  readonly cannotSellAll: boolean | null;
  readonly slippageModifiable: boolean | null;
  readonly buyTax: number | null;
  readonly sellTax: number | null;
  readonly transferTax: number | null;
  readonly ownerPercent: number | null;
  readonly creatorPercent: number | null;
  readonly holderCount: number | null;
  readonly topHolders: readonly GoPlusHolderEvidence[];
  readonly lpHolders: readonly GoPlusHolderEvidence[];
  readonly dexLiquidityUsd: number | null;
  readonly reason?: string;
}

export interface GoPlusTokenSecurityProviderOptions {
  readonly apiKey?: string | null;
  readonly env?: NodeJS.ProcessEnv;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
  readonly baseUrl?: string;
}

function bool01(value: unknown): boolean | null {
  if (value === '1' || value === 1 || value === true) return true;
  if (value === '0' || value === 0 || value === false) return false;
  return null;
}

function finite(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function holder(value: unknown): GoPlusHolderEvidence | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  return Object.freeze({
    address: typeof item.address === 'string' && item.address.trim() ? item.address : null,
    percent: finite(item.percent),
    isLocked: bool01(item.is_locked),
    tag: typeof item.tag === 'string' && item.tag.trim() ? item.tag : null,
  });
}

function dexLiquidity(payload: Record<string, unknown>): number | null {
  if (!Array.isArray(payload.dex)) return null;
  const values = payload.dex
    .map((entry) => entry && typeof entry === 'object' ? finite((entry as Record<string, unknown>).liquidity) : null)
    .filter((value): value is number => value !== null && value >= 0);
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) : null;
}

function failure(
  status: GoPlusEvidenceStatus,
  identity: GoPlusTokenIdentity,
  retrievedAt: string,
  reason: string,
): GoPlusTokenSecurityEvidence {
  return Object.freeze({
    contractVersion: GOPLUS_TOKEN_SECURITY_CONTRACT_VERSION,
    status,
    identity,
    retrievedAt,
    evidenceId: null,
    isOpenSource: null,
    isProxy: null,
    isMintable: null,
    isBlacklisted: null,
    transferPausable: null,
    ownerCanChangeBalance: null,
    isHoneypot: null,
    cannotBuy: null,
    cannotSellAll: null,
    slippageModifiable: null,
    buyTax: null,
    sellTax: null,
    transferTax: null,
    ownerPercent: null,
    creatorPercent: null,
    holderCount: null,
    topHolders: Object.freeze([]),
    lpHolders: Object.freeze([]),
    dexLiquidityUsd: null,
    reason,
  });
}

export class GoPlusTokenSecurityProvider {
  private readonly http: ResearchEvidenceProviderHttp;

  constructor(options: GoPlusTokenSecurityProviderOptions = {}) {
    const env = options.env ?? process.env;
    const transport: ResearchEvidenceProviderHttpOptions = {
      baseUrl: options.baseUrl ?? GOPLUS_BASE_URL,
      apiKey: options.apiKey ?? env.GOPLUS_API_KEY ?? null,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: options.nowMs,
      authHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    };
    this.http = new ResearchEvidenceProviderHttp(GOPLUS_TOKEN_SECURITY_PROVIDER_ID, 'security', transport);
  }

  public async getTokenSecurity(identity: GoPlusTokenIdentity): Promise<GoPlusTokenSecurityEvidence> {
    const chainId = identity.chainId.trim();
    const contractAddress = identity.contractAddress.trim().toLowerCase();
    const normalized = Object.freeze({ chainId, contractAddress });
    if (!chainId || !/^0x[a-f0-9]{40}$/.test(contractAddress)) {
      return failure('INVALID', normalized, new Date().toISOString(), 'Valid EVM chainId and contract address are required.');
    }

    const result = await this.http.requestJson(
      `/token_security/${encodeURIComponent(chainId)}?contract_addresses=${encodeURIComponent(contractAddress)}`,
    );
    if (result.status !== 'READY' || !result.data || typeof result.data !== 'object') {
      return failure(
        result.status === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'SOURCE_UNAVAILABLE',
        normalized,
        result.retrievedAt,
        result.reason ?? 'GoPlus source unavailable.',
      );
    }

    const root = result.data as Record<string, unknown>;
    const responseCode = finite(root.code);
    const byAddress = root.result && typeof root.result === 'object'
      ? root.result as Record<string, unknown>
      : null;
    const payload = byAddress
      ? Object.entries(byAddress).find(([key]) => key.toLowerCase() === contractAddress)?.[1]
      : null;
    if (responseCode !== 1 || !payload || typeof payload !== 'object') {
      return failure('INVALID', normalized, result.retrievedAt, 'GoPlus response did not contain the requested token-security record.');
    }

    const item = payload as Record<string, unknown>;
    const topHolders = Array.isArray(item.holders)
      ? item.holders.map(holder).filter((value): value is GoPlusHolderEvidence => value !== null)
      : [];
    const lpHolders = Array.isArray(item.lp_holders)
      ? item.lp_holders.map(holder).filter((value): value is GoPlusHolderEvidence => value !== null)
      : [];

    return Object.freeze({
      contractVersion: GOPLUS_TOKEN_SECURITY_CONTRACT_VERSION,
      status: 'VERIFIED' as const,
      identity: normalized,
      retrievedAt: result.retrievedAt,
      evidenceId: `goplus:token-security:${chainId}:${contractAddress}:${result.retrievedAt}`,
      isOpenSource: bool01(item.is_open_source),
      isProxy: bool01(item.is_proxy),
      isMintable: bool01(item.is_mintable),
      isBlacklisted: bool01(item.is_blacklisted),
      transferPausable: bool01(item.transfer_pausable),
      ownerCanChangeBalance: bool01(item.owner_change_balance),
      isHoneypot: bool01(item.is_honeypot),
      cannotBuy: bool01(item.cannot_buy),
      cannotSellAll: bool01(item.cannot_sell_all),
      slippageModifiable: bool01(item.slippage_modifiable),
      buyTax: finite(item.buy_tax),
      sellTax: finite(item.sell_tax),
      transferTax: finite(item.transfer_tax),
      ownerPercent: finite(item.owner_percent),
      creatorPercent: finite(item.creator_percent),
      holderCount: finite(item.holder_count),
      topHolders: Object.freeze(topHolders),
      lpHolders: Object.freeze(lpHolders),
      dexLiquidityUsd: dexLiquidity(item),
    });
  }
}
