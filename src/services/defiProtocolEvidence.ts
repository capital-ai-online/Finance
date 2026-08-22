/**
 * ADR-0100 — public entry point for DeFiLlama-backed DeFi protocol evidence.
 *
 * Mirrors the shape of `cryptoQuoteEvidence.ts`/`commodityMarketEvidence.ts`: resolves a
 * registry symbol to a provider-specific identifier (here: a DeFiLlama protocol slug), calls the
 * provider, and maps the result onto the shared `CryptoFeatureEvidence` contract. No scoring,
 * no ScoringDispatcher call, no gateway routing change — evidence-only rollout stage
 * (`defillama_evidence_enabled`).
 */

import { CRYPTO_DEFILLAMA_SLUGS } from '../lib/assetRegistry';
import {
  DefiLlamaProtocolProvider,
  type DefiLlamaProtocolProviderOptions,
} from '../platform/MarketData/providers/DefiLlamaProtocolProvider';
import {
  adaptDefiLlamaFeesToFeatureEvidence,
  adaptDefiLlamaProtocolTvlToFeatureEvidence,
} from '../platform/FinTechCore/Modules/Crypto/Adapters/DefiLlamaProtocolFeatureAdapter';
import type { CryptoFeatureEvidence } from '../platform/FinTechCore/Modules/Crypto/CryptoCategoryFeatureContracts';

export const DEFI_PROTOCOL_EVIDENCE_CONTRACT_VERSION = 'defi-protocol-evidence/1.1.0' as const;

export type DefiProtocolEvidenceStatus =
  | 'READY'
  | 'PARTIAL'
  | 'STALE'
  | 'UNSUPPORTED_ASSET'
  | 'SOURCE_UNAVAILABLE'
  | 'DISABLED';

export interface DefiProtocolEvidenceResult {
  contractVersion: typeof DEFI_PROTOCOL_EVIDENCE_CONTRACT_VERSION;
  status: DefiProtocolEvidenceStatus;
  symbol: string;
  slug: string | null;
  evidence: readonly CryptoFeatureEvidence[];
  retrievedAt: string;
}

export interface DefiProtocolEvidenceOptions extends DefiLlamaProtocolProviderOptions {
  env?: NodeJS.ProcessEnv;
}

/** Reads the P2/rollout `defillama_evidence_enabled` gate. Unset/empty defaults to enabled. */
export function isDefiLlamaEvidenceEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.DEFILLAMA_EVIDENCE_ENABLED !== 'false';
}

let productionProvider: DefiLlamaProtocolProvider | undefined;

function resolveProvider(options: DefiProtocolEvidenceOptions): DefiLlamaProtocolProvider {
  const usesInjectedRuntime = Boolean(
    options.fetchImpl || options.nowMs || options.sleep || options.random || options.timeoutMs !== undefined || options.baseUrl,
  );
  if (!usesInjectedRuntime && productionProvider) return productionProvider;
  const provider = new DefiLlamaProtocolProvider(options);
  if (!usesInjectedRuntime) productionProvider = provider;
  return provider;
}

/** Test helper: drop the production singleton so injected fetch/clock take effect. */
export function resetDefiProtocolEvidenceProviderForTests(): void {
  productionProvider = undefined;
}

function unavailableResult(
  symbol: string,
  slug: string | null,
  status: DefiProtocolEvidenceStatus,
  retrievedAt: string,
): DefiProtocolEvidenceResult {
  return {
    contractVersion: DEFI_PROTOCOL_EVIDENCE_CONTRACT_VERSION,
    status,
    symbol,
    slug,
    evidence: Object.freeze([]),
    retrievedAt,
  };
}

/**
 * Derives the service-level state without treating stale evidence as verified/admissible.
 * READY therefore means every emitted feature is VERIFIED. STALE is explicit and never aliases
 * READY/PARTIAL verified coverage; mixed verified+nonverified evidence is PARTIAL.
 */
export function deriveDefiProtocolEvidenceStatus(
  evidence: readonly CryptoFeatureEvidence[],
): DefiProtocolEvidenceStatus {
  if (evidence.length === 0) return 'SOURCE_UNAVAILABLE';
  const verifiedCount = evidence.filter((item) => item.status === 'VERIFIED').length;
  const staleCount = evidence.filter((item) => item.status === 'STALE').length;
  if (verifiedCount === evidence.length) return 'READY';
  if (verifiedCount > 0) return 'PARTIAL';
  if (staleCount > 0) return 'STALE';
  return 'SOURCE_UNAVAILABLE';
}

/**
 * Fetches DeFiLlama TVL/fees/revenue evidence for one registry symbol and maps it onto
 * `CryptoFeatureEvidence` for `protocol.tvlUsd`/`protocol.feesUsd`/`protocol.revenueUsd`.
 * Never invents a value: an unmapped symbol, a disabled flag, or an unavailable upstream all
 * return empty evidence with an explicit status instead of a fabricated number.
 */
export async function fetchDefiProtocolEvidence(
  symbolInput: string,
  options: DefiProtocolEvidenceOptions = {},
): Promise<DefiProtocolEvidenceResult> {
  const symbol = symbolInput.toUpperCase().trim();
  const nowMs = options.nowMs ?? Date.now;
  const retrievedAt = new Date(nowMs()).toISOString();

  if (!isDefiLlamaEvidenceEnabled(options.env)) {
    return unavailableResult(symbol, null, 'DISABLED', retrievedAt);
  }

  const slug = CRYPTO_DEFILLAMA_SLUGS[symbol];
  if (!slug) {
    return unavailableResult(symbol, null, 'UNSUPPORTED_ASSET', retrievedAt);
  }

  const provider = resolveProvider(options);
  const [tvlResult, feesResult] = await Promise.all([
    provider.getProtocolTvl(slug),
    provider.getFeesAndRevenue(slug),
  ]);

  const evidence = Object.freeze([
    adaptDefiLlamaProtocolTvlToFeatureEvidence(tvlResult),
    ...adaptDefiLlamaFeesToFeatureEvidence(feesResult),
  ]);

  return {
    contractVersion: DEFI_PROTOCOL_EVIDENCE_CONTRACT_VERSION,
    status: deriveDefiProtocolEvidenceStatus(evidence),
    symbol,
    slug,
    evidence,
    retrievedAt,
  };
}