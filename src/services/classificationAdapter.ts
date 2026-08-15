/**
 * SC-1 Classification consolidation adapter (SC-MD-SPT-0001).
 *
 * Three historically incompatible CryptoClassification shapes exist:
 * 1. Canonical: src/types/crypto.types.ts (25 CryptoCategory values)
 * 2. Legacy enterprise: src/types/crypto.ts ("Crypto" | "Unknown")
 * 3. Agent raw: src/agents/cryptoClassificationAgent.ts (free-text category/sub_tier)
 *
 * This module maps (1)+(2)+(3) onto the canonical shape without mutating scores,
 * ranking eligibility, or provider evidence. Fail-closed defaults use Unknown/tier 3.
 */

import type {
  CryptoCategory,
  CryptoSubCategory,
  CryptoTier,
  CryptoClassification,
} from '../types/crypto.types';

export const CLASSIFICATION_ADAPTER_VERSION = 'classification-adapter/1.0.0' as const;

/** Agent free-text output (do not confuse with canonical CryptoClassification). */
export interface AgentCryptoClassificationRaw {
  category?: string;
  sub_tier?: string;
  market_structure?: string;
  narrative_alignment?: string;
  confidence?: number;
  reasoning?: string[];
}

/** Legacy enterprise shape from src/types/crypto.ts. */
export interface LegacyEnterpriseCryptoClassification {
  category_main?: 'Crypto' | 'Unknown' | string;
  category_sub?: string;
  market_type?: string;
  valuation_mode?: string;
  confidence?: number;
  reasoning?: string[];
}

const CATEGORY_ALIASES: Record<string, CryptoCategory> = {
  l1: 'Layer 1',
  'layer 1': 'Layer 1',
  'layer1': 'Layer 1',
  'layer-1': 'Layer 1',
  l2: 'Layer 2',
  'layer 2': 'Layer 2',
  'layer2': 'Layer 2',
  'layer-2': 'Layer 2',
  defi: 'DeFi',
  'de-fi': 'DeFi',
  oracle: 'Oracle',
  oracles: 'Oracle',
  meme: 'Meme',
  memecoin: 'Meme',
  'meme coin': 'Meme',
  stablecoin: 'Stablecoin',
  stable: 'Stablecoin',
  payment: 'Payments',
  payments: 'Payments',
  web3: 'Infrastructure',
  infrastructure: 'Infrastructure',
  gaming: 'Gaming',
  gamefi: 'Gaming',
  ai: 'AI / Data',
  'ai / data': 'AI / Data',
  'ai/data': 'AI / Data',
  privacy: 'Privacy',
  governance: 'Governance',
  rwa: 'Real World Assets',
  'real world assets': 'Real World Assets',
  'exchange token': 'Exchange Token',
  exchange: 'Exchange Token',
  staking: 'Liquid Staking',
  'liquid staking': 'Liquid Staking',
  restaking: 'Restaking',
  bridge: 'Bridging',
  bridging: 'Bridging',
  nft: 'NFT / Creator',
  'nft / creator': 'NFT / Creator',
  derivatives: 'Derivatives',
  derivative: 'Derivatives',
  dao: 'DAO / Community',
  index: 'Index / Basket',
  utility: 'Utility Token',
  'utility token': 'Utility Token',
  'smart contract platform': 'Smart Contract Platform',
  'storage / compute': 'Storage / Compute',
  storage: 'Storage / Compute',
  interoperability: 'Interoperability',
  crypto: 'Unknown',
  'crypto token': 'Unknown',
  unknown: 'Unknown',
};

const CANONICAL_CATEGORIES = new Set<string>([
  'Layer 1',
  'Layer 2',
  'DeFi',
  'Smart Contract Platform',
  'Infrastructure',
  'Oracle',
  'Gaming',
  'AI / Data',
  'Payments',
  'Privacy',
  'Meme',
  'Stablecoin',
  'Exchange Token',
  'Governance',
  'Real World Assets',
  'Storage / Compute',
  'Interoperability',
  'Liquid Staking',
  'Restaking',
  'Bridging',
  'NFT / Creator',
  'Derivatives',
  'DAO / Community',
  'Index / Basket',
  'Utility Token',
  'Unknown',
]);

const SUB_ALIASES: Record<string, CryptoSubCategory> = {
  'chain-native asset': 'Chain-native Asset',
  'chain native asset': 'Chain-native Asset',
  'core layer': 'Chain-native Asset',
  'digital gold / value store': 'Chain-native Asset',
  'ecosystem token': 'Ecosystem Token',
  'ecosystem component': 'Ecosystem Token',
  'protocol token': 'Protocol Token',
  'exchange-backed asset': 'Exchange-Backed Asset',
  'governance asset': 'Governance Asset',
  'synthetic asset': 'Synthetic Asset',
  'wrapped asset': 'Wrapped Asset',
  'yield asset': 'Yield Asset',
  scaling: 'Ecosystem Token',
  unknown: 'Unknown',
};

function clampConfidence(value: unknown, fallback = 0.6): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function normalizeCryptoCategory(raw: string | undefined | null): CryptoCategory {
  if (!raw || !raw.trim()) return 'Unknown';
  const trimmed = raw.trim();
  if (CANONICAL_CATEGORIES.has(trimmed)) return trimmed as CryptoCategory;
  const key = trimmed.toLowerCase();
  return CATEGORY_ALIASES[key] ?? 'Unknown';
}

export function normalizeCryptoSubCategory(raw: string | undefined | null): CryptoSubCategory {
  if (!raw || !raw.trim()) return 'Unknown';
  const trimmed = raw.trim();
  const canonical: CryptoSubCategory[] = [
    'Chain-native Asset',
    'Ecosystem Token',
    'Protocol Token',
    'Exchange-Backed Asset',
    'Governance Asset',
    'Synthetic Asset',
    'Wrapped Asset',
    'Yield Asset',
    'Unknown',
  ];
  if ((canonical as string[]).includes(trimmed)) return trimmed as CryptoSubCategory;
  return SUB_ALIASES[trimmed.toLowerCase()] ?? 'Unknown';
}

export function inferTierFromCategory(category: CryptoCategory, explicit?: CryptoTier): CryptoTier {
  if (explicit === 1 || explicit === 2 || explicit === 3) return explicit;
  if (category === 'Layer 1' || category === 'Oracle' || category === 'DeFi') return 2;
  if (category === 'Unknown') return 3;
  return 3;
}

export function inferAssetType(
  category: CryptoCategory,
  sub: CryptoSubCategory,
): CryptoClassification['asset_type'] {
  if (category === 'Stablecoin') return 'stablecoin';
  if (category === 'Derivatives') return 'derivative';
  if (category === 'Index / Basket') return 'index';
  if (sub === 'Governance Asset' || category === 'Governance') return 'governance';
  if (sub === 'Yield Asset' || category === 'Liquid Staking' || category === 'Restaking') return 'yield';
  if (sub === 'Wrapped Asset') return 'wrapped';
  if (sub === 'Chain-native Asset' || category === 'Layer 1') return 'coin';
  if (category === 'Unknown') return 'unknown';
  return 'token';
}

/** Map agent free-text classification → canonical crypto.types CryptoClassification. */
export function adaptAgentClassification(raw: AgentCryptoClassificationRaw): CryptoClassification {
  const category_main = normalizeCryptoCategory(raw.category);
  const category_sub = normalizeCryptoSubCategory(raw.sub_tier);
  const confidence = clampConfidence(raw.confidence, 0.6);
  const tier = inferTierFromCategory(category_main);
  return {
    category_main,
    category_sub,
    asset_type: inferAssetType(category_main, category_sub),
    tier,
    confidence,
    reasoning: Array.isArray(raw.reasoning) ? raw.reasoning.slice(0, 5) : [
      `Adapted via ${CLASSIFICATION_ADAPTER_VERSION}`,
      `source_category=${raw.category ?? 'n/a'}`,
    ],
  };
}

/** Map legacy enterprise classification → canonical. */
export function adaptLegacyEnterpriseClassification(
  raw: LegacyEnterpriseCryptoClassification,
): CryptoClassification {
  const main = raw.category_main === 'Crypto'
    ? normalizeCryptoCategory(raw.category_sub)
    : normalizeCryptoCategory(raw.category_main);
  const category_main = main === 'Unknown' && raw.category_sub
    ? normalizeCryptoCategory(raw.category_sub)
    : main;
  const category_sub = normalizeCryptoSubCategory(raw.category_sub);
  return {
    category_main,
    category_sub,
    asset_type: inferAssetType(category_main, category_sub),
    tier: inferTierFromCategory(category_main),
    confidence: clampConfidence(raw.confidence, 0.6),
    reasoning: Array.isArray(raw.reasoning) ? raw.reasoning.slice(0, 5) : [
      `Adapted via ${CLASSIFICATION_ADAPTER_VERSION} from legacy enterprise shape`,
    ],
  };
}

/** Identity pass-through when already canonical (validates + clamps). */
export function ensureCanonicalClassification(
  value: Partial<CryptoClassification> | null | undefined,
): CryptoClassification {
  if (!value) {
    return {
      category_main: 'Unknown',
      category_sub: 'Unknown',
      asset_type: 'unknown',
      tier: 3,
      confidence: 0.6,
      reasoning: [`${CLASSIFICATION_ADAPTER_VERSION}: empty input → Unknown`],
    };
  }
  const category_main = normalizeCryptoCategory(value.category_main as string);
  const category_sub = normalizeCryptoSubCategory(value.category_sub as string);
  return {
    category_main,
    category_sub,
    asset_type: value.asset_type ?? inferAssetType(category_main, category_sub),
    tier: inferTierFromCategory(category_main, value.tier),
    confidence: clampConfidence(value.confidence, 0.6),
    reasoning: Array.isArray(value.reasoning) ? value.reasoning.slice(0, 5) : [],
  };
}
