import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const SOURCIFY_PROVIDER_ID = 'sourcify' as const;
export const SOURCIFY_BASE_URL = 'https://sourcify.dev/server' as const;
export const SOURCIFY_CONTRACT_EVIDENCE_VERSION = 'sourcify-contract-verification/1.0.0' as const;

export type SourcifyContractStatus = 'VERIFIED' | 'NOT_VERIFIED' | 'SOURCE_UNAVAILABLE' | 'INVALID';

export interface SourcifyContractVerificationEvidence {
  readonly contractVersion: typeof SOURCIFY_CONTRACT_EVIDENCE_VERSION;
  readonly status: SourcifyContractStatus;
  readonly chainId: string;
  readonly address: string;
  readonly retrievedAt: string;
  readonly evidenceRef: string | null;
  readonly match: string | null;
  readonly creationMatch: string | null;
  readonly runtimeMatch: string | null;
  readonly verifiedAt: string | null;
  readonly reason?: string;
}

export interface SourcifyContractVerificationProviderOptions {
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
  readonly baseUrl?: string;
}

export class SourcifyContractVerificationProvider {
  private readonly http: ResearchEvidenceProviderHttp;
  private readonly nowMs: () => number;

  constructor(options: SourcifyContractVerificationProviderOptions = {}) {
    this.nowMs = options.nowMs ?? Date.now;
    const transport: ResearchEvidenceProviderHttpOptions = {
      baseUrl: options.baseUrl ?? SOURCIFY_BASE_URL,
      apiKey: null,
      apiKeyRequired: false,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: this.nowMs,
    };
    this.http = new ResearchEvidenceProviderHttp(SOURCIFY_PROVIDER_ID, 'security', transport);
  }

  public async getContractVerification(chainIdInput: string, addressInput: string): Promise<SourcifyContractVerificationEvidence> {
    const chainId = chainIdInput.trim();
    const address = addressInput.toLowerCase().trim();
    if (!/^\d{1,20}$/.test(chainId) || !/^0x[a-f0-9]{40}$/.test(address)) {
      return Object.freeze({
        contractVersion: SOURCIFY_CONTRACT_EVIDENCE_VERSION,
        status: 'INVALID',
        chainId,
        address,
        retrievedAt: new Date(this.nowMs()).toISOString(),
        evidenceRef: null,
        match: null,
        creationMatch: null,
        runtimeMatch: null,
        verifiedAt: null,
        reason: 'Valid numeric EVM chainId and contract address are required.',
      });
    }

    const result = await this.http.requestJson(`/v2/contract/${encodeURIComponent(chainId)}/${encodeURIComponent(address)}`);
    if (result.httpStatus === 404) {
      return Object.freeze({
        contractVersion: SOURCIFY_CONTRACT_EVIDENCE_VERSION,
        status: 'NOT_VERIFIED',
        chainId,
        address,
        retrievedAt: result.retrievedAt,
        evidenceRef: `sourcify:lookup:${chainId}:${address}:${result.retrievedAt}`,
        match: null,
        creationMatch: null,
        runtimeMatch: null,
        verifiedAt: null,
        reason: 'No Sourcify v2 verification record exists for this governed chain/address identity.',
      });
    }
    if (result.status !== 'READY' || !result.data || typeof result.data !== 'object' || Array.isArray(result.data)) {
      return Object.freeze({
        contractVersion: SOURCIFY_CONTRACT_EVIDENCE_VERSION,
        status: 'SOURCE_UNAVAILABLE',
        chainId,
        address,
        retrievedAt: result.retrievedAt,
        evidenceRef: null,
        match: null,
        creationMatch: null,
        runtimeMatch: null,
        verifiedAt: null,
        reason: result.reason ?? 'Sourcify v2 lookup unavailable.',
      });
    }

    const item = result.data as Record<string, unknown>;
    const match = typeof item.match === 'string' ? item.match : null;
    const creationMatch = typeof item.creationMatch === 'string' ? item.creationMatch : null;
    const runtimeMatch = typeof item.runtimeMatch === 'string' ? item.runtimeMatch : null;
    const verifiedAtRaw = typeof item.verifiedAt === 'string' ? item.verifiedAt : null;
    const verifiedAt = verifiedAtRaw && !Number.isNaN(Date.parse(verifiedAtRaw)) ? new Date(verifiedAtRaw).toISOString() : null;
    if (!match && !creationMatch && !runtimeMatch) {
      return Object.freeze({
        contractVersion: SOURCIFY_CONTRACT_EVIDENCE_VERSION,
        status: 'INVALID',
        chainId,
        address,
        retrievedAt: result.retrievedAt,
        evidenceRef: null,
        match: null,
        creationMatch: null,
        runtimeMatch: null,
        verifiedAt,
        reason: 'Sourcify response did not include verification match fields.',
      });
    }

    return Object.freeze({
      contractVersion: SOURCIFY_CONTRACT_EVIDENCE_VERSION,
      status: 'VERIFIED',
      chainId,
      address,
      retrievedAt: result.retrievedAt,
      evidenceRef: `sourcify:contract:${chainId}:${address}:${verifiedAt ?? result.retrievedAt}`,
      match,
      creationMatch,
      runtimeMatch,
      verifiedAt,
    });
  }
}
