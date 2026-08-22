import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';
import type { GoPlusHolderEvidence } from './GoPlusTokenSecurityProvider';

export const GOPLUS_SOLANA_TOKEN_SECURITY_CONTRACT_VERSION = 'goplus-solana-token-security-evidence/1.0.0' as const;
export const GOPLUS_SOLANA_BASE_URL = 'https://api.gopluslabs.io/api/v1' as const;

export type GoPlusSolanaEvidenceStatus = 'VERIFIED' | 'SOURCE_UNAVAILABLE' | 'INVALID';

export interface GoPlusSolanaTokenSecurityEvidence {
  readonly contractVersion: typeof GOPLUS_SOLANA_TOKEN_SECURITY_CONTRACT_VERSION;
  readonly status: GoPlusSolanaEvidenceStatus;
  readonly mintAddress: string;
  readonly retrievedAt: string;
  readonly evidenceId: string | null;
  readonly trustedToken: boolean | null;
  readonly defaultAccountState: number | null;
  readonly nonTransferable: boolean | null;
  readonly metadataMutable: boolean | null;
  readonly mintable: boolean | null;
  readonly freezable: boolean | null;
  readonly closable: boolean | null;
  readonly transferFeeUpgradable: boolean | null;
  readonly defaultAccountStateUpgradable: boolean | null;
  readonly balanceMutable: boolean | null;
  readonly transferHookUpgradable: boolean | null;
  readonly currentTransferFeeRateBps: number | null;
  readonly holderCount: number | null;
  readonly totalSupply: number | null;
  readonly topHolders: readonly GoPlusHolderEvidence[];
  readonly lpHolders: readonly GoPlusHolderEvidence[];
  readonly dexTvlUsd: number | null;
  readonly reason?: string;
}

export interface GoPlusSolanaTokenSecurityProviderOptions {
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

function nestedStatus(value: unknown): boolean | null {
  if (!value || typeof value !== 'object') return null;
  return bool01((value as Record<string, unknown>).status);
}

function holder(value: unknown): GoPlusHolderEvidence | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const address = typeof item.token_account === 'string'
    ? item.token_account
    : typeof item.address === 'string'
      ? item.address
      : null;
  return Object.freeze({
    address: address?.trim() || null,
    percent: finite(item.percent),
    isLocked: bool01(item.is_locked),
    tag: typeof item.tag === 'string' && item.tag.trim() ? item.tag : null,
  });
}

function currentTransferFeeRateBps(payload: Record<string, unknown>): number | null {
  const transferFee = payload.transfer_fee && typeof payload.transfer_fee === 'object'
    ? payload.transfer_fee as Record<string, unknown>
    : null;
  const current = transferFee?.current_fee_rate && typeof transferFee.current_fee_rate === 'object'
    ? transferFee.current_fee_rate as Record<string, unknown>
    : null;
  return finite(current?.fee_rate);
}

function dexTvl(payload: Record<string, unknown>): number | null {
  const pools = Array.isArray(payload.dex) ? payload.dex : Array.isArray(payload.dex_info) ? payload.dex_info : [];
  const values = pools
    .map((entry) => entry && typeof entry === 'object' ? finite((entry as Record<string, unknown>).tvl) : null)
    .filter((value): value is number => value !== null && value >= 0);
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) : null;
}

function failure(
  status: GoPlusSolanaEvidenceStatus,
  mintAddress: string,
  retrievedAt: string,
  reason: string,
): GoPlusSolanaTokenSecurityEvidence {
  return Object.freeze({
    contractVersion: GOPLUS_SOLANA_TOKEN_SECURITY_CONTRACT_VERSION,
    status,
    mintAddress,
    retrievedAt,
    evidenceId: null,
    trustedToken: null,
    defaultAccountState: null,
    nonTransferable: null,
    metadataMutable: null,
    mintable: null,
    freezable: null,
    closable: null,
    transferFeeUpgradable: null,
    defaultAccountStateUpgradable: null,
    balanceMutable: null,
    transferHookUpgradable: null,
    currentTransferFeeRateBps: null,
    holderCount: null,
    totalSupply: null,
    topHolders: Object.freeze([]),
    lpHolders: Object.freeze([]),
    dexTvlUsd: null,
    reason,
  });
}

/**
 * GoPlus Solana Token Security API (Beta) evidence adapter.
 * Raw documented facts only; no security PASS, score or execution eligibility is derived here.
 */
export class GoPlusSolanaTokenSecurityProvider {
  private readonly http: ResearchEvidenceProviderHttp;
  private readonly nowMs: () => number;

  constructor(options: GoPlusSolanaTokenSecurityProviderOptions = {}) {
    const env = options.env ?? process.env;
    this.nowMs = options.nowMs ?? Date.now;
    const transport: ResearchEvidenceProviderHttpOptions = {
      baseUrl: options.baseUrl ?? GOPLUS_SOLANA_BASE_URL,
      apiKey: options.apiKey ?? env.GOPLUS_API_KEY ?? null,
      apiKeyRequired: false,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: this.nowMs,
      authHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    };
    this.http = new ResearchEvidenceProviderHttp('goplus', 'security', transport);
  }

  async getTokenSecurity(mintAddressInput: string): Promise<GoPlusSolanaTokenSecurityEvidence> {
    const mintAddress = mintAddressInput.trim();
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mintAddress)) {
      return failure('INVALID', mintAddress, new Date(this.nowMs()).toISOString(), 'Valid Solana base58 token mint address is required.');
    }

    const result = await this.http.requestJson(
      `/solana/token_security?contract_addresses=${encodeURIComponent(mintAddress)}`,
    );
    if (result.status !== 'READY' || !result.data || typeof result.data !== 'object') {
      return failure('SOURCE_UNAVAILABLE', mintAddress, result.retrievedAt, result.reason ?? 'GoPlus Solana source unavailable.');
    }

    const root = result.data as Record<string, unknown>;
    if (finite(root.code) !== 1 || !root.result || typeof root.result !== 'object') {
      return failure('INVALID', mintAddress, result.retrievedAt, 'GoPlus Solana response has no result object.');
    }
    const resultObject = root.result as Record<string, unknown>;
    const exact = Object.entries(resultObject).find(([key]) => key === mintAddress)?.[1];
    const payload = exact ?? (Object.keys(resultObject).length === 1 ? Object.values(resultObject)[0] : null);
    if (!payload || typeof payload !== 'object') {
      return failure('INVALID', mintAddress, result.retrievedAt, 'GoPlus Solana response did not contain the requested mint record.');
    }

    const item = payload as Record<string, unknown>;
    const holders = Array.isArray(item.holders)
      ? item.holders.map(holder).filter((value): value is GoPlusHolderEvidence => value !== null)
      : [];
    const lpHolders = Array.isArray(item.lp_holders)
      ? item.lp_holders.map(holder).filter((value): value is GoPlusHolderEvidence => value !== null)
      : [];

    return Object.freeze({
      contractVersion: GOPLUS_SOLANA_TOKEN_SECURITY_CONTRACT_VERSION,
      status: 'VERIFIED' as const,
      mintAddress,
      retrievedAt: result.retrievedAt,
      evidenceId: `goplus:solana-token-security:${mintAddress}:${result.retrievedAt}`,
      trustedToken: bool01(item.trusted_token),
      defaultAccountState: finite(item.default_account_state),
      nonTransferable: bool01(item.non_transferable),
      metadataMutable: nestedStatus(item.metadata_mutable),
      mintable: nestedStatus(item.mintable),
      freezable: nestedStatus(item.freezable),
      closable: nestedStatus(item.closable),
      transferFeeUpgradable: nestedStatus(item.transfer_fee_upgradable),
      defaultAccountStateUpgradable: nestedStatus(item.default_account_state_upgradable),
      balanceMutable: nestedStatus(item.balance_mutable_authority),
      transferHookUpgradable: nestedStatus(item.transfer_hook_upgradable),
      currentTransferFeeRateBps: currentTransferFeeRateBps(item),
      holderCount: finite(item.holder_count),
      totalSupply: finite(item.total_supply),
      topHolders: Object.freeze(holders),
      lpHolders: Object.freeze(lpHolders),
      dexTvlUsd: dexTvl(item),
    });
  }
}
