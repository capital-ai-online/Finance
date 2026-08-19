export type CryptoCategory =
  | "Layer 1"
  | "Layer 2"
  | "DeFi"
  | "Smart Contract Platform"
  | "Infrastructure"
  | "Oracle"
  | "Gaming"
  | "AI / Data"
  | "Payments"
  | "Privacy"
  | "Meme"
  | "Stablecoin"
  | "Exchange Token"
  | "Governance"
  | "Real World Assets"
  | "Storage / Compute"
  | "Interoperability"
  | "Liquid Staking"
  | "Restaking"
  | "Bridging"
  | "NFT / Creator"
  | "Derivatives"
  | "DAO / Community"
  | "Index / Basket"
  | "Utility Token"
  | "Unknown";

export type CryptoSubCategory =
  | "Chain-native Asset"
  | "Ecosystem Token"
  | "Protocol Token"
  | "Exchange-Backed Asset"
  | "Governance Asset"
  | "Synthetic Asset"
  | "Wrapped Asset"
  | "Yield Asset"
  | "Unknown";

export type CryptoTier = 1 | 2 | 3;

export interface CryptoClassification {
  category_main: CryptoCategory;
  category_sub: CryptoSubCategory;
  asset_type: "coin" | "token" | "stablecoin" | "wrapped" | "derivative" | "governance" | "yield" | "index" | "unknown";
  tier: CryptoTier;
  confidence: number;
  reasoning: string[];
}

// Legacy scoring-input contract retained while direct Base/DeFi consumers are migrated or retired.
// SC-2 Phase C prohibits CryptoOrchestrator from turning these values into a canonical score.
export interface CryptoScores {
  marketCap?: number;
  liquidity?: number;
  tokenomics?: number;
  supplyTransparency?: number;
  volatility?: number;
  networkActivity?: number;
  security?: number;
  utility?: number;
  adoption?: number;
  risk?: number;
  sentiment?: number;
  final_score?: number;
}

export interface CryptoValueCorridor {
  conservative: number;
  neutral: number;
  optimistic: number;
  fairValueGapPct: number;
}

export interface CryptoResearchSignals {
  activeAddressesGrowth: number;
  manipulationIndex: number;
  narrativeStrength: number;
  socialVelocity: number;
  newsMomentum: number;
}

export interface CryptoAnalysisPayload {
  asset_name: string;
  symbol: string;
  classification?: CryptoClassification;
  /** Legacy optional field. Canonical production scoring is returned by ScoringDispatcher, not this payload. */
  scores?: Partial<CryptoScores>;
  data_quality?: {
    level: "low" | "medium" | "high" | "unknown";
    missing_fields?: string[];
  };
  reasoning?: string[];
  /** SC-2 Phase C research boundary. */
  mode?: 'research-enrichment';
  scoreEligible?: false;
  researchSignals?: CryptoResearchSignals;
  researchFieldBasis?: Record<keyof CryptoResearchSignals, 'agent-derived'>;
  /** Legacy provenance shape retained for compatibility with historical evidence only. */
  scoreFieldBasis?: Record<string, "agent-derived" | "real" | "user-adjusted">;
}
