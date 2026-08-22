import type { CryptoFeatureEvidence } from '../platform/FinTechCore/Modules/Crypto/CryptoCategoryFeatureContracts';
import {
  adaptCoinGlassDerivativesEvidence,
  adaptCoinGlassUnlockEvidence,
  adaptDuneSavedQueryEvidence,
  adaptGoPlusTokenSecurityEvidence,
  adaptLunarCrushSocialEvidence,
  adaptMessariProtocolUsageEvidence,
  type GovernedDuneFeatureMapping,
} from '../platform/FinTechCore/Modules/Crypto/Adapters/ExtendedCryptoEvidenceAdapters';
import { adaptGoPlusSolanaEvidence } from '../platform/FinTechCore/Modules/Crypto/Adapters/GoPlusSolanaEvidenceAdapter';
import { GoPlusTokenSecurityProvider, type GoPlusTokenIdentity } from '../platform/MarketData/providers/GoPlusTokenSecurityProvider';
import {
  GoPlusSolanaTokenSecurityProvider,
  type GoPlusSolanaTokenSecurityEvidence,
} from '../platform/MarketData/providers/GoPlusSolanaTokenSecurityProvider';
import { CoinGlassCryptoEvidenceProvider } from '../platform/MarketData/providers/CoinGlassCryptoEvidenceProvider';
import { LunarCrushSocialEvidenceProvider } from '../platform/MarketData/providers/LunarCrushSocialEvidenceProvider';
import { MessariProtocolEvidenceProvider } from '../platform/MarketData/providers/MessariProtocolEvidenceProvider';
import { DuneQueryEvidenceProvider } from '../platform/MarketData/providers/DuneQueryEvidenceProvider';
import { NewsApiEvidenceProvider, type NewsApiArticleEvidence } from '../platform/MarketData/providers/NewsApiEvidenceProvider';
import { fetchDefiProtocolEvidence, type DefiProtocolEvidenceResult } from './defiProtocolEvidence';

export const CRYPTO_EXTENDED_EVIDENCE_CONTRACT_VERSION = 'crypto-extended-evidence/1.2.0' as const;

export type CryptoExtendedEvidenceStatus = 'READY' | 'PARTIAL' | 'NOT_AVAILABLE';

export interface GovernedDuneEvidenceRequest {
  readonly queryId: number;
  readonly expectedColumns: readonly string[];
  readonly mappings: readonly GovernedDuneFeatureMapping[];
}

export interface CryptoExtendedEvidenceRequest {
  readonly symbol: string;
  /** Trusted EVM provider identity resolved outside user/LLM input. */
  readonly goPlusIdentity?: GoPlusTokenIdentity;
  /** Trusted Solana mint resolved outside user/LLM input. Mutually exclusive with goPlusIdentity. */
  readonly goPlusSolanaMintAddress?: string;
  /** Exact provider slug/ID; never derive via fuzzy name matching. */
  readonly messariProtocolIdentifier?: string;
  /** LunarCrush topic; defaults to normalized symbol if no curated topic is supplied. */
  readonly lunarCrushTopic?: string;
  readonly includeDefiLlama?: boolean;
  readonly includeUnlocks?: boolean;
  readonly includeNews?: boolean;
  /** Raw NewsAPI query. Defaults to the exact symbol plus crypto context. */
  readonly newsQuery?: string;
  readonly dune?: readonly GovernedDuneEvidenceRequest[];
}

export interface CryptoEvidenceProviderState {
  readonly provider: 'defillama' | 'goplus' | 'goplus-solana' | 'coinglass' | 'lunarcrush' | 'messari' | 'dune' | 'newsapi';
  readonly status: string;
  readonly reason?: string;
}

export interface CryptoExtendedEvidenceResult {
  readonly contractVersion: typeof CRYPTO_EXTENDED_EVIDENCE_CONTRACT_VERSION;
  readonly status: CryptoExtendedEvidenceStatus;
  readonly symbol: string;
  readonly retrievedAt: string;
  readonly evidence: readonly CryptoFeatureEvidence[];
  /** Solana-specific facts not semantically equivalent to the generic EVM feature catalog. */
  readonly solanaSecurity: GoPlusSolanaTokenSecurityEvidence | null;
  /** Text evidence remains separate from numeric/category features until a governed NLP model promotes it. */
  readonly newsArticles: readonly NewsApiArticleEvidence[];
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
  readonly coinGlass?: CoinGlassCryptoEvidenceProvider;
  readonly lunarCrush?: LunarCrushSocialEvidenceProvider;
  readonly messari?: MessariProtocolEvidenceProvider;
  readonly dune?: DuneQueryEvidenceProvider;
  readonly newsApi?: NewsApiEvidenceProvider;
  readonly defiFetcher?: (symbol: string) => Promise<DefiProtocolEvidenceResult>;
  readonly nowMs?: () => number;
}

function providerState(provider: CryptoEvidenceProviderState['provider'], status: string, reason?: string): CryptoEvidenceProviderState {
  return Object.freeze({ provider, status, reason });
}

/**
 * Read-only evidence composition for crypto research categories.
 *
 * The service never calls ScoringDispatcher, never derives policy PASS from provider facts and
 * never fabricates values. Text/news evidence and Solana-only security facts remain separate from
 * generic numeric feature evidence unless an explicit semantic adapter exists. Provider identity
 * mappings must be trusted, exact and server-side.
 */
export async function fetchCryptoExtendedEvidence(
  request: CryptoExtendedEvidenceRequest,
  dependencies: CryptoExtendedEvidenceDependencies = {},
): Promise<CryptoExtendedEvidenceResult> {
  const symbol = request.symbol.toUpperCase().trim();
  const nowMs = dependencies.nowMs ?? Date.now;
  const evidence: CryptoFeatureEvidence[] = [];
  const newsArticles: NewsApiArticleEvidence[] = [];
  const providers: CryptoEvidenceProviderState[] = [];
  let solanaSecurity: GoPlusSolanaTokenSecurityEvidence | null = null;

  if (request.goPlusIdentity && request.goPlusSolanaMintAddress) {
    throw new Error('GOPLUS_IDENTITY_AMBIGUOUS: EVM and Solana identities are mutually exclusive.');
  }

  const coinGlass = dependencies.coinGlass ?? new CoinGlassCryptoEvidenceProvider({ nowMs });
  const lunarCrush = dependencies.lunarCrush ?? new LunarCrushSocialEvidenceProvider({ nowMs });
  const coreTasks: Promise<void>[] = [
    coinGlass.getDerivativesEvidence(symbol).then((result) => {
      evidence.push(...adaptCoinGlassDerivativesEvidence(result));
      providers.push(providerState('coinglass', result.status, result.reason));
    }),
    lunarCrush.getSocialEvidence(request.lunarCrushTopic ?? symbol.toLowerCase()).then((result) => {
      evidence.push(...adaptLunarCrushSocialEvidence(result));
      providers.push(providerState('lunarcrush', result.status, result.reason));
    }),
  ];

  if (request.includeUnlocks !== false) {
    coreTasks.push(coinGlass.getUnlockEvidence(symbol).then((result) => {
      evidence.push(...adaptCoinGlassUnlockEvidence(result));
      providers.push(providerState('coinglass', `unlock:${result.status}`, result.reason));
    }));
  }

  if (request.goPlusIdentity) {
    const goPlus = dependencies.goPlus ?? new GoPlusTokenSecurityProvider({ nowMs });
    coreTasks.push(goPlus.getTokenSecurity(request.goPlusIdentity).then((result) => {
      evidence.push(...adaptGoPlusTokenSecurityEvidence(result));
      providers.push(providerState('goplus', result.status, result.reason));
    }));
  } else if (request.goPlusSolanaMintAddress) {
    const goPlusSolana = dependencies.goPlusSolana ?? new GoPlusSolanaTokenSecurityProvider({ nowMs });
    coreTasks.push(goPlusSolana.getTokenSecurity(request.goPlusSolanaMintAddress).then((result) => {
      solanaSecurity = result;
      evidence.push(...adaptGoPlusSolanaEvidence(result));
      providers.push(providerState('goplus-solana', result.status, result.reason));
    }));
  } else {
    providers.push(providerState('goplus', 'UNSUPPORTED_ASSET', 'No governed EVM contract or Solana mint identity mapping is available.'));
  }

  if (request.messariProtocolIdentifier) {
    const messari = dependencies.messari ?? new MessariProtocolEvidenceProvider({ nowMs });
    coreTasks.push(messari.getProtocolUsage(request.messariProtocolIdentifier).then((result) => {
      evidence.push(...adaptMessariProtocolUsageEvidence(result));
      providers.push(providerState('messari', result.status, result.reason));
    }));
  } else {
    providers.push(providerState('messari', 'UNSUPPORTED_ASSET', 'No governed Messari protocol identifier is available.'));
  }

  if (request.includeDefiLlama) {
    const fetcher = dependencies.defiFetcher ?? ((value: string) => fetchDefiProtocolEvidence(value));
    coreTasks.push(fetcher(symbol).then((result) => {
      evidence.push(...result.evidence);
      providers.push(providerState('defillama', result.status));
    }));
  }

  if (request.includeNews) {
    const newsApi = dependencies.newsApi ?? new NewsApiEvidenceProvider({ nowMs });
    coreTasks.push(newsApi.searchEverything(request.newsQuery ?? `${symbol} AND (crypto OR cryptocurrency)`, 20).then((result) => {
      newsArticles.push(...result.articles);
      providers.push(providerState('newsapi', result.status, result.reason));
    }));
  }

  if (request.dune && request.dune.length > 0) {
    const dune = dependencies.dune ?? new DuneQueryEvidenceProvider({ nowMs });
    for (const governed of request.dune) {
      coreTasks.push(dune.getLatestSavedQuery(governed.queryId, governed.expectedColumns).then((result) => {
        evidence.push(...adaptDuneSavedQueryEvidence(result, governed.mappings));
        providers.push(providerState('dune', result.status, result.reason));
      }));
    }
  }

  await Promise.all(coreTasks);

  const verifiedFeatureCount = evidence.filter((item) => item.status === 'VERIFIED').length;
  const unavailableFeatureCount = evidence.length - verifiedFeatureCount;
  const hasVerifiedEvidence = verifiedFeatureCount > 0 || newsArticles.length > 0 || solanaSecurity?.status === 'VERIFIED';
  const hasUnavailable = unavailableFeatureCount > 0 || providers.some((item) => !item.status.includes('VERIFIED') && item.status !== 'READY');
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
