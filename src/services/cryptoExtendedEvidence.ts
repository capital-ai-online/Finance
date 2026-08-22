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
import { GoPlusTokenSecurityProvider, type GoPlusTokenIdentity } from '../platform/MarketData/providers/GoPlusTokenSecurityProvider';
import { CoinGlassCryptoEvidenceProvider } from '../platform/MarketData/providers/CoinGlassCryptoEvidenceProvider';
import { LunarCrushSocialEvidenceProvider } from '../platform/MarketData/providers/LunarCrushSocialEvidenceProvider';
import { MessariProtocolEvidenceProvider } from '../platform/MarketData/providers/MessariProtocolEvidenceProvider';
import { DuneQueryEvidenceProvider } from '../platform/MarketData/providers/DuneQueryEvidenceProvider';
import { fetchDefiProtocolEvidence, type DefiProtocolEvidenceResult } from './defiProtocolEvidence';

export const CRYPTO_EXTENDED_EVIDENCE_CONTRACT_VERSION = 'crypto-extended-evidence/1.0.0' as const;

export type CryptoExtendedEvidenceStatus = 'READY' | 'PARTIAL' | 'NOT_AVAILABLE';

export interface GovernedDuneEvidenceRequest {
  readonly queryId: number;
  readonly expectedColumns: readonly string[];
  readonly mappings: readonly GovernedDuneFeatureMapping[];
}

export interface CryptoExtendedEvidenceRequest {
  readonly symbol: string;
  /** Trusted provider identity resolved outside user/LLM input. Omit when no governed mapping exists. */
  readonly goPlusIdentity?: GoPlusTokenIdentity;
  /** Exact provider slug/ID; never derive via fuzzy name matching. */
  readonly messariProtocolIdentifier?: string;
  /** LunarCrush topic; defaults to normalized symbol if no curated topic is supplied. */
  readonly lunarCrushTopic?: string;
  readonly includeDefiLlama?: boolean;
  readonly includeUnlocks?: boolean;
  readonly dune?: readonly GovernedDuneEvidenceRequest[];
}

export interface CryptoEvidenceProviderState {
  readonly provider: 'defillama' | 'goplus' | 'coinglass' | 'lunarcrush' | 'messari' | 'dune';
  readonly status: string;
  readonly reason?: string;
}

export interface CryptoExtendedEvidenceResult {
  readonly contractVersion: typeof CRYPTO_EXTENDED_EVIDENCE_CONTRACT_VERSION;
  readonly status: CryptoExtendedEvidenceStatus;
  readonly symbol: string;
  readonly retrievedAt: string;
  readonly evidence: readonly CryptoFeatureEvidence[];
  readonly providers: readonly CryptoEvidenceProviderState[];
  readonly verifiedFeatureCount: number;
  readonly unavailableFeatureCount: number;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly authority: 'EVIDENCE_ONLY';
}

export interface CryptoExtendedEvidenceDependencies {
  readonly goPlus?: GoPlusTokenSecurityProvider;
  readonly coinGlass?: CoinGlassCryptoEvidenceProvider;
  readonly lunarCrush?: LunarCrushSocialEvidenceProvider;
  readonly messari?: MessariProtocolEvidenceProvider;
  readonly dune?: DuneQueryEvidenceProvider;
  readonly defiFetcher?: (symbol: string) => Promise<DefiProtocolEvidenceResult>;
  readonly nowMs?: () => number;
}

function providerState(provider: CryptoEvidenceProviderState['provider'], status: string, reason?: string): CryptoEvidenceProviderState {
  return Object.freeze({ provider, status, reason });
}

/**
 * Read-only evidence composition for the Meme/DeFi 0.3.0 research package.
 *
 * The service never calls ScoringDispatcher, never derives policy PASS from provider facts and
 * never fabricates values. Provider identity mappings (contract addresses, protocol IDs, Dune
 * queries) must already be governed by a trusted server-side registry/configuration.
 */
export async function fetchCryptoExtendedEvidence(
  request: CryptoExtendedEvidenceRequest,
  dependencies: CryptoExtendedEvidenceDependencies = {},
): Promise<CryptoExtendedEvidenceResult> {
  const symbol = request.symbol.toUpperCase().trim();
  const nowMs = dependencies.nowMs ?? Date.now;
  const evidence: CryptoFeatureEvidence[] = [];
  const providers: CryptoEvidenceProviderState[] = [];

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
  } else {
    providers.push(providerState('goplus', 'UNSUPPORTED_ASSET', 'No governed chain/contract identity mapping is available.'));
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
  const status: CryptoExtendedEvidenceStatus = verifiedFeatureCount === 0
    ? 'NOT_AVAILABLE'
    : unavailableFeatureCount === 0
      ? 'READY'
      : 'PARTIAL';

  return Object.freeze({
    contractVersion: CRYPTO_EXTENDED_EVIDENCE_CONTRACT_VERSION,
    status,
    symbol,
    retrievedAt: new Date(nowMs()).toISOString(),
    evidence: Object.freeze([...evidence].sort((a, b) => a.key.localeCompare(b.key))),
    providers: Object.freeze([...providers]),
    verifiedFeatureCount,
    unavailableFeatureCount,
    scoreEligible: false as const,
    executionEligible: false as const,
    authority: 'EVIDENCE_ONLY' as const,
  });
}
