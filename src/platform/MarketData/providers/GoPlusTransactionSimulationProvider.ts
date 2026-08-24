import { createHash } from 'node:crypto';
import {
  ResearchEvidenceProviderHttp,
  type ResearchEvidenceProviderHttpOptions,
} from './ResearchEvidenceProviderHttp';

export const GOPLUS_TRANSACTION_SIMULATION_PROVIDER_ID = 'goplus' as const;
export const GOPLUS_TRANSACTION_SIMULATION_CONTRACT_VERSION =
  'goplus-transaction-simulation-evidence/1.0.0' as const;
export const GOPLUS_TRANSACTION_SIMULATION_PATH = '/transaction_simulation' as const;

export type GoPlusTradeSimulationKind = 'BUY' | 'SELL';
export type GoPlusTransactionSimulationStatus =
  | 'VERIFIED'
  | 'NOT_CONFIGURED'
  | 'SOURCE_UNAVAILABLE'
  | 'INVALID';

export interface GoPlusGovernedTradeSimulationRequest {
  readonly kind: GoPlusTradeSimulationKind;
  readonly chainId: string;
  readonly tokenAddress: string;
  readonly from: string;
  readonly to: string;
  readonly data: string;
  readonly value?: string;
  readonly gasLimit?: string;
  readonly gasPrice?: string;
  readonly maxFeePerGas?: string;
  readonly maxPriorityFeePerGas?: string;
  readonly nonce?: string;
  /** Authority for transaction/route construction. This provider never constructs a route. */
  readonly routeAuthorityId: string;
  readonly routeAuthorityVersion: string;
  readonly routeEvidenceRefs: readonly string[];
}

export interface GoPlusTradeSimulationEvidence {
  readonly contractVersion: typeof GOPLUS_TRANSACTION_SIMULATION_CONTRACT_VERSION;
  readonly status: GoPlusTransactionSimulationStatus;
  readonly kind: GoPlusTradeSimulationKind;
  readonly chainId: string;
  readonly tokenAddress: string;
  readonly routeAuthorityId: string;
  readonly routeAuthorityVersion: string;
  readonly routeEvidenceRefs: readonly string[];
  readonly transactionFingerprint: string;
  readonly retrievedAt: string;
  readonly evidenceId: string | null;
  readonly simulated: boolean | null;
  readonly reverted: boolean | null;
  readonly revertReason: string | null;
  /** Signed target-token balance delta observed by the simulator, represented as integer atoms. */
  readonly tokenBalanceChangeAtoms: string | null;
  /**
   * True only for a completed non-reverting simulation whose target-token delta matches BUY/SELL.
   * Null means the provider did not expose enough target-token evidence to decide the direction.
   */
  readonly directionSucceeded: boolean | null;
  readonly riskFlags: readonly string[];
  readonly suspiciousAddresses: readonly string[];
  readonly reason?: string;
  readonly executionHandoffEligible: false;
}

export interface GoPlusTransactionSimulationProviderOptions {
  /**
   * GoPlus Bearer access token for authenticated Transaction Simulation. The historical option
   * name is retained to match GOPLUS_API_KEY, but a raw GoPlus app_key/app_secret is not accepted.
   */
  readonly apiKey?: string | null;
  readonly env?: NodeJS.ProcessEnv;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
  readonly baseUrl?: string;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  const source = value as Readonly<Record<string, unknown>>;
  return Object.keys(source).sort().reduce<Record<string, unknown>>((result, key) => {
    const entry = source[key];
    if (entry !== undefined) result[key] = canonicalize(entry);
    return result;
  }, {});
}

function sha256(value: unknown): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex')}`;
}

function boolish(value: unknown): boolean | null {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return null;
}

function integerString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (!/^-?(?:0x[0-9a-f]+|[0-9]+)$/.test(trimmed)) return null;
  const negative = trimmed.startsWith('-');
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  try {
    const parsed = BigInt(unsigned);
    return `${negative ? '-' : ''}${parsed.toString()}`;
  } catch {
    return null;
  }
}

function normalizedRefs(refs: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(refs.map((ref) => ref.trim()).filter(Boolean))].sort());
}

function hasEvidence(refs: readonly string[]): boolean {
  return refs.length > 0 && refs.every((ref) => Boolean(ref.trim()));
}

function validAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

function validQuantity(value: string | undefined): boolean {
  return value === undefined || /^(?:0x[0-9a-fA-F]+|[0-9]+)$/.test(value.trim());
}

function validateRequest(input: GoPlusGovernedTradeSimulationRequest): string | null {
  if (input.kind !== 'BUY' && input.kind !== 'SELL') return 'Simulation kind must be BUY or SELL.';
  if (!/^[0-9]+$/.test(input.chainId.trim())) return 'A numeric EVM chainId is required.';
  if (!validAddress(input.tokenAddress) || !validAddress(input.from) || !validAddress(input.to)) {
    return 'tokenAddress, from and to must be valid EVM addresses.';
  }
  if (!/^0x(?:[0-9a-fA-F]{2})*$/.test(input.data.trim())) {
    return 'Transaction data must be canonical hex bytes.';
  }
  if (!input.routeAuthorityId.trim() || !input.routeAuthorityVersion.trim() || !hasEvidence(input.routeEvidenceRefs)) {
    return 'A versioned route-construction authority and evidenceRefs are required.';
  }
  for (const value of [
    input.value,
    input.gasLimit,
    input.gasPrice,
    input.maxFeePerGas,
    input.maxPriorityFeePerGas,
    input.nonce,
  ]) {
    if (!validQuantity(value)) return 'Optional transaction numeric fields must be unsigned decimal or hex strings.';
  }
  return null;
}

function normalizedRequest(request: GoPlusGovernedTradeSimulationRequest): GoPlusGovernedTradeSimulationRequest {
  return Object.freeze({
    ...request,
    chainId: request.chainId.trim(),
    tokenAddress: request.tokenAddress.trim().toLowerCase(),
    from: request.from.trim().toLowerCase(),
    to: request.to.trim().toLowerCase(),
    data: request.data.trim().toLowerCase(),
    routeAuthorityId: request.routeAuthorityId.trim(),
    routeAuthorityVersion: request.routeAuthorityVersion.trim(),
    routeEvidenceRefs: normalizedRefs(request.routeEvidenceRefs),
  });
}

function transactionFingerprint(request: GoPlusGovernedTradeSimulationRequest): string {
  return sha256({
    kind: request.kind,
    chainId: request.chainId,
    tokenAddress: request.tokenAddress,
    from: request.from,
    to: request.to,
    data: request.data,
    value: request.value,
    gasLimit: request.gasLimit,
    gasPrice: request.gasPrice,
    maxFeePerGas: request.maxFeePerGas,
    maxPriorityFeePerGas: request.maxPriorityFeePerGas,
    nonce: request.nonce,
    routeAuthorityId: request.routeAuthorityId,
    routeAuthorityVersion: request.routeAuthorityVersion,
  });
}

function stringValues(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  const result: string[] = [];
  for (const entry of value) {
    if (typeof entry === 'string' && entry.trim()) {
      result.push(entry.trim());
      continue;
    }
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    const candidate = [item.type, item.name, item.flag, item.reason, item.address]
      .find((field) => typeof field === 'string' && field.trim());
    if (typeof candidate === 'string') result.push(candidate.trim());
  }
  return Object.freeze([...new Set(result)].sort());
}

function tokenDeltaCandidate(value: unknown, tokenAddress: string): string | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (typeof item.token_address !== 'string' || item.token_address.toLowerCase() !== tokenAddress) return null;
  const tokenChange = item.token_balance_change && typeof item.token_balance_change === 'object'
    ? item.token_balance_change as Record<string, unknown>
    : null;
  const balanceChange = item.balance_change && typeof item.balance_change === 'object'
    ? item.balance_change as Record<string, unknown>
    : null;
  return integerString(item.change ?? tokenChange?.change ?? balanceChange?.change);
}

/**
 * GoPlus documents ERC-20 changes as erc20_balance_changes[].erc20_change[]. Older/alternate
 * payloads can expose token_address/change directly. Support both structures, but only accept the
 * exact governed target token; an unrelated token movement never satisfies the BUY/SELL gate.
 */
function tokenBalanceDelta(payload: Record<string, unknown>, tokenAddress: string): string | null {
  const changes = Array.isArray(payload.erc20_balance_changes) ? payload.erc20_balance_changes : [];
  for (const entry of changes) {
    const direct = tokenDeltaCandidate(entry, tokenAddress);
    if (direct !== null) return direct;
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    const nested = Array.isArray(item.erc20_change) ? item.erc20_change : [];
    for (const candidate of nested) {
      const delta = tokenDeltaCandidate(candidate, tokenAddress);
      if (delta !== null) return delta;
    }
  }
  return null;
}

function failure(
  request: GoPlusGovernedTradeSimulationRequest,
  status: Exclude<GoPlusTransactionSimulationStatus, 'VERIFIED'>,
  retrievedAt: string,
  reason: string,
): GoPlusTradeSimulationEvidence {
  const normalized = normalizedRequest(request);
  return Object.freeze({
    contractVersion: GOPLUS_TRANSACTION_SIMULATION_CONTRACT_VERSION,
    status,
    kind: normalized.kind,
    chainId: normalized.chainId,
    tokenAddress: normalized.tokenAddress,
    routeAuthorityId: normalized.routeAuthorityId,
    routeAuthorityVersion: normalized.routeAuthorityVersion,
    routeEvidenceRefs: normalized.routeEvidenceRefs,
    transactionFingerprint: transactionFingerprint(normalized),
    retrievedAt,
    evidenceId: null,
    simulated: null,
    reverted: null,
    revertReason: null,
    tokenBalanceChangeAtoms: null,
    directionSucceeded: null,
    riskFlags: Object.freeze([]),
    suspiciousAddresses: Object.freeze([]),
    reason,
    executionHandoffEligible: false,
  });
}

/**
 * Read-only EVM pre-run evidence. The caller supplies an already-governed transaction route.
 * This provider neither constructs nor signs nor broadcasts transactions and never grants approval.
 */
export class GoPlusTransactionSimulationProvider {
  private readonly http: ResearchEvidenceProviderHttp;
  private readonly nowMs: () => number;

  constructor(options: GoPlusTransactionSimulationProviderOptions = {}) {
    const env = options.env ?? process.env;
    this.nowMs = options.nowMs ?? Date.now;
    const transport: ResearchEvidenceProviderHttpOptions = {
      baseUrl: options.baseUrl ?? 'https://api.gopluslabs.io/api/v1',
      apiKey: options.apiKey ?? env.GOPLUS_API_KEY ?? null,
      apiKeyRequired: true,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: this.nowMs,
      authHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    };
    this.http = new ResearchEvidenceProviderHttp(
      GOPLUS_TRANSACTION_SIMULATION_PROVIDER_ID,
      'security',
      transport,
    );
  }

  public async simulateTrade(request: GoPlusGovernedTradeSimulationRequest): Promise<GoPlusTradeSimulationEvidence> {
    const requestError = validateRequest(request);
    const requestedAt = new Date(this.nowMs()).toISOString();
    if (requestError) return failure(request, 'INVALID', requestedAt, requestError);

    const normalized = normalizedRequest(request);
    const fingerprint = transactionFingerprint(normalized);
    const body = {
      chain_id: normalized.chainId,
      from: normalized.from,
      to: normalized.to,
      data: normalized.data,
      ...(normalized.value !== undefined ? { value: normalized.value } : {}),
      ...(normalized.gasLimit !== undefined ? { gas_limit: normalized.gasLimit } : {}),
      ...(normalized.gasPrice !== undefined ? { gas_price: normalized.gasPrice } : {}),
      ...(normalized.maxFeePerGas !== undefined ? { max_fee_per_gas: normalized.maxFeePerGas } : {}),
      ...(normalized.maxPriorityFeePerGas !== undefined
        ? { max_priority_fee_per_gas: normalized.maxPriorityFeePerGas }
        : {}),
      ...(normalized.nonce !== undefined ? { nonce: normalized.nonce } : {}),
    };

    const result = await this.http.requestJson(GOPLUS_TRANSACTION_SIMULATION_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (result.status !== 'READY' || !result.data || typeof result.data !== 'object') {
      return failure(
        normalized,
        result.status === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'SOURCE_UNAVAILABLE',
        result.retrievedAt,
        result.reason ?? 'GoPlus transaction simulation source unavailable.',
      );
    }

    const root = result.data as Record<string, unknown>;
    if (root.code !== undefined && Number(root.code) !== 1) {
      return failure(
        normalized,
        'INVALID',
        result.retrievedAt,
        'GoPlus transaction simulation returned a non-success application code.',
      );
    }
    const payload = root.result && typeof root.result === 'object' && !Array.isArray(root.result)
      ? root.result as Record<string, unknown>
      : root;
    const simulated = boolish(payload.is_simulated);
    const reverted = boolish(payload.is_revert);
    if (simulated === null || reverted === null) {
      return failure(
        normalized,
        'INVALID',
        result.retrievedAt,
        'GoPlus transaction simulation response is missing deterministic simulation status fields.',
      );
    }

    const delta = tokenBalanceDelta(payload, normalized.tokenAddress);
    const deltaAtoms = delta === null ? null : BigInt(delta);
    const directionSucceeded = !simulated || reverted
      ? false
      : deltaAtoms === null
        ? null
        : normalized.kind === 'BUY'
          ? deltaAtoms > 0n
          : deltaAtoms < 0n;
    const revertReason = typeof payload.revert_reason === 'string' && payload.revert_reason.trim()
      ? payload.revert_reason.trim()
      : null;
    const riskFlags = stringValues(payload.flagged);
    const suspiciousAddresses = stringValues(payload.suspicious_addresses);
    const evidenceId = [
      'goplus:transaction-simulation',
      normalized.chainId,
      normalized.tokenAddress,
      normalized.kind.toLowerCase(),
      fingerprint,
      result.retrievedAt,
    ].join(':');

    return Object.freeze({
      contractVersion: GOPLUS_TRANSACTION_SIMULATION_CONTRACT_VERSION,
      status: 'VERIFIED' as const,
      kind: normalized.kind,
      chainId: normalized.chainId,
      tokenAddress: normalized.tokenAddress,
      routeAuthorityId: normalized.routeAuthorityId,
      routeAuthorityVersion: normalized.routeAuthorityVersion,
      routeEvidenceRefs: normalized.routeEvidenceRefs,
      transactionFingerprint: fingerprint,
      retrievedAt: result.retrievedAt,
      evidenceId,
      simulated,
      reverted,
      revertReason,
      tokenBalanceChangeAtoms: delta,
      directionSucceeded,
      riskFlags,
      suspiciousAddresses,
      executionHandoffEligible: false,
    });
  }
}
