import type { CryptoFeatureEvidence } from '../platform/FinTechCore/Modules/Crypto/CryptoCategoryFeatureContracts';
import {
  adaptDexScreenerTokenEvidence,
  adaptDuneSavedQueryEvidence,
  adaptGoPlusTokenSecurityEvidence,
  adaptKrakenFuturesAnalyticsEvidence,
  adaptSourcifyContractVerificationEvidence,
  type GovernedDuneFeatureMapping,
} from '../platform/FinTechCore/Modules/Crypto/Adapters/ExtendedCryptoEvidenceAdapters';
import { adaptGoPlusSolanaEvidence } from '../platform/FinTechCore/Modules/Crypto/Adapters/GoPlusSolanaEvidenceAdapter';
import { GoPlusTokenSecurityProvider, type GoPlusTokenIdentity } from '../platform/MarketData/providers/GoPlusTokenSecurityProvider';
import {
  GoPlusSolanaTokenSecurityProvider,
  type GoPlusSolanaTokenSecurityEvidence,
} from '../platform/MarketData/providers/GoPlusSolanaTokenSecurityProvider';
import { KrakenFuturesAnalyticsProvider } from '../platform/MarketData/providers/KrakenFuturesAnalyticsProvider';
import { DexScreenerTokenEvidenceProvider } from '../platform/MarketData/providers/DexScreenerTokenEvidenceProvider';
import { SourcifyContractVerificationProvider } from '../platform/MarketData/providers/SourcifyContractVerificationProvider';
import { DuneQueryEvidenceProvider } from '../platform/MarketData/providers/DuneQueryEvidenceProvider';
import { GdeltNewsEvidenceProvider, type GdeltArticleEvidence } from '../platform/MarketData/providers/GdeltNewsEvidenceProvider';
import { fetchDefiProtocolEvidence, type DefiProtocolEvidenceResult } from './defiProtocolEvidence';

export const CRYPTO_EXTENDED_EVIDENCE_CONTRACT_VERSION = 'crypto-extended-evidence/1.3.0' as const;

export type CryptoExtendedEvidenceStatus = 'READY' | 'PARTIAL' | 'NOT_AVAILABLE';

export interface GovernedDuneEvidenceRequest {
  readonly queryId: number;
  readonly expectedColumns: readonly string[];
  readonly mappings: readonly GovernedDuneFeatureMapping[];
}

export interface GovernedDexScreenerIdentity {
  readonly chainId: string;
  readonly tokenAddress: string;
}

export interface CryptoExtendedEvidenceRequest {
  readonly symbol: string;
  /** Trusted EVM provider identity resolved outside user/LLM input. */
  readonly goPlusIdentity?: GoPlusTokenIdentity;
  /** Trusted Solana mint resolved outside user/LLM input. Mutually exclusive with goPlusIdentity. */
  readonly goPlusSolanaMintAddress?: string;
  /** Exact DEX Screener chain slug + token address from the governed identity registry. */
  readonly dexScreenerIdentity?: GovernedDexScreenerIdentity;
  /** Exact public Kraken Futures market symbol from the governed identity registry. */
  readonly krakenFuturesSymbol?: string;
  readonly includeDefiLlama?: boolean;
  readonly includeNews?: boolean;
  readonly newsQuery?: string;
  readonly dune?: readonly GovernedDuneEvidenceRequest[];
}

export interface CryptoEvidenceProviderState {
  readonly provider:
    | 'defillama'
    | 'goplus'
    | 'goplus-solana'
    | 'kraken-futures-public'
    | 'dexscreener'
    | 'sourcify'
    | 'dune'
    | 'gdelt';
  readonly status: string;
  readonly reason?: string;
}

export interface CryptoExtendedEvidenceResult {
  readonly contractVersion: typeof CRYPTO_EXTENDED_EVIDENCE_CONTRACT_VERSION;
  readonly status: CryptoExtendedEvidenceStatus;
  readonly symbol: string;
  readonly retrievedAt: string;
  readonly evidence: readonly CryptoFeatureEvidence[];
  /** Solana-specific facts without a generic semantic mapping stay separate. */
  readonly solanaSecurity: GoPlusSolanaTokenSecurityEvidence | null;
  /** News metadata stays outside numeric/category features and has no direct score authority. */
  readonly newsArticles: readonly GdeltArticleEvidence[];
  readonly providers: readonly CryptoEvidenceProviderState[];
  readonly verifiedFeatureCount: number;
  readonly unavailableFeatureCount: number;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly authority: 'EVIDENCE_ONLY';
}

export interface CryptoExtendedEvidenceDependencies {
  readonly goPlus?: GoPlusTokenSecurityProvider;
  readonly goPlusSolana?: GoPlusSolanaTokenSecurityProvider;
  readonly krakenFutures?: KrakenFuturesAnalyticsProvider;
  readonly dexScreener?: DexScreenerTokenEvidenceProvider;
  readonly sourcify?: SourcifyContractVerificationProvider;
  readonly dune?: DuneQueryEvidenceProvider;
  readonly gdelt?: GdeltNewsEvidenceProvider;
  readonly defiFetcher?: (symbol: string) => Promise<DefiProtocolEvidenceResult>;
  readonly nowMs?: () => number;
}

function providerState(provider: CryptoEvidenceProviderState['provider'], status: string, reason?: string): CryptoEvidenceProviderState {
  return Object.freeze({ provider, status, reason });
}

/**
 * Read-only evidence composition for crypto research categories.
 *
 * Active defaults are restricted to keyless/free providers plus Dune's explicitly attested
 * free-tier read path. There is no CoinGlass, LunarCrush, NewsAPI, automatic paid overage or x402.
 */
export async function fetchCryptoExtendedEvidence(
  request: CryptoExtendedEvidenceRequest,
  dependencies: CryptoExtendedEvidenceDependencies = {},
): Promise<CryptoExtendedEvidenceResult> {
  const symbol = request.symbol.toUpperCase().trim();
  const nowMs = dependencies.nowMs ?? Date.now;
  const evidence: CryptoFeatureEvidence[] = [];
  const newsArticles: GdeltArticleEvidence[] = [];
  const providers: CryptoEvidenceProviderState[] = [];
  let solanaSecurity: GoPlusSolanaTokenSecurityEvidence | null = null;

  if (request.goPlusIdentity && request.goPlusSolanaMintAddress) {
    throw new Error('GOPLUS_IDENTITY_AMBIGUOUS: EVM and Solana identities are mutually exclusive.');
  }

  const tasks: Promise<void>[] = [];

  if (request.goPlusIdentity) {
    const goPlus = dependencies.goPlus ?? new GoPlusTokenSecurityProvider({ nowMs });
    tasks.push(goPlus.getTokenSecurity(request.goPlusIdentity).then((result) => {
      evidence.push(...adaptGoPlusTokenSecurityEvidence(result));
      providers.push(providerState('goplus', result.status, result.reason));
    }));

    const sourcify = dependencies.sourcify ?? new SourcifyContractVerificationProvider({ nowMs });
    tasks.push(sourcify.getContractVerification(request.goPlusIdentity.chainId, request.goPlusIdentity.contractAddress).then((result) => {
      evidence.push(...adaptSourcifyContractVerificationEvidence(result));
      providers.push(providerState('sourcify', result.status, result.reason));
    }));
  } else if (request.goPlusSolanaMintAddress) {
    const goPlusSolana = dependencies.goPlusSolana ?? new GoPlusSolanaTokenSecurityProvider({ nowMs });
    tasks.push(goPlusSolana.getTokenSecurity(request.goPlusSolanaMintAddress).then((result) => {
      solanaSecurity = result;
      evidence.push(...adaptGoPlusSolanaEvidence(result));
      providers.push(providerState('goplus-solana', result.status, result.reason));
    }));
  } else {
    providers.push(providerState('goplus', 'UNSUPPORTED_ASSET', 'No governed EVM contract or Solana mint identity mapping is available.'));
  }

  if (request.dexScreenerIdentity) {
    const dexScreener = dependencies.dexScreener ?? new DexScreenerTokenEvidenceProvider({ nowMs });
    tasks.push(dexScreener.getTokenPairs(request.dexScreenerIdentity.chainId, request.dexScreenerIdentity.tokenAddress).then((result) => {
      evidence.push(...adaptDexScreenerTokenEvidence(result));
      providers.push(providerState('dexscreener', result.status, result.reason));
    }));
  }

  if (request.krakenFuturesSymbol) {
    const krakenFutures = dependencies.krakenFutures ?? new KrakenFuturesAnalyticsProvider({ nowMs });
    tasks.push(krakenFutures.getAnalytics(request.krakenFuturesSymbol).then((result) => {
      evidence.push(...adaptKrakenFuturesAnalyticsEvidence(result));
      providers.push(providerState('kraken-futures-public', result.status, result.reason));
    }));
  }

  if (request.includeDefiLlama) {
    const fetcher = dependencies.defiFetcher ?? ((value: string) => fetchDefiProtocolEvidence(value));
    tasks.push(fetcher(symbol).then((result) => {
      evidence.push(...result.evidence);
      providers.push(providerState('defillama', result.status));
    }));
  }

  if (request.includeNews) {
    const gdelt = dependencies.gdelt ?? new GdeltNewsEvidenceProvider({ nowMs });
    tasks.push(gdelt.searchArticles(request.newsQuery ?? `"${symbol}" (crypto OR cryptocurrency OR market)`, 20, '1d').then((result) => {
      newsArticles.push(...result.articles);
      providers.push(providerState('gdelt', result.status, result.reason));
    }));
  }

  if (request.dune && request.dune.length > 0) {
    const dune = dependencies.dune ?? new DuneQueryEvidenceProvider({ nowMs });
    for (const governed of request.dune) {
      tasks.push(dune.getLatestSavedQuery(governed.queryId, governed.expectedColumns).then((result) => {
        evidence.push(...adaptDuneSavedQueryEvidence(result, governed.mappings));
        providers.push(providerState('dune', result.status, result.reason));
      }));
    }
  }

  await Promise.all(tasks);

  const verifiedFeatureCount = evidence.filter((item) => item.status === 'VERIFIED').length;
  const unavailableFeatureCount = evidence.length - verifiedFeatureCount;
  const hasVerifiedEvidence = verifiedFeatureCount > 0 || newsArticles.length > 0 || solanaSecurity?.status === 'VERIFIED';
  const hasUnavailable = unavailableFeatureCount > 0 || providers.some((item) => !['VERIFIED', 'READY'].includes(item.status));
  const status: CryptoExtendedEvidenceStatus = !hasVerifiedEvidence
    ? 'NOT_AVAILABLE'
    : hasUnavailable
      ? 'PARTIAL'
      : 'READY';

  return Object.freeze({
    contractVersion: CRYPTO_EXTENDED_EVIDENCE_CONTRACT_VERSION,
    status,
    symbol,
    retrievedAt: new Date(nowMs()).toISOString(),
    evidence: Object.freeze([...evidence].sort((a, b) => a.key.localeCompare(b.key))),
    solanaSecurity,
    newsArticles: Object.freeze([...newsArticles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))),
    providers: Object.freeze([...providers]),
    verifiedFeatureCount,
    unavailableFeatureCount,
    scoreEligible: false as const,
    executionEligible: false as const,
    authority: 'EVIDENCE_ONLY' as const,
  });
}
