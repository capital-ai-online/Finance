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

export interface CryptoScores {
  marketCap: number;
  liquidity: number;
  volumeQuality: number;
  tokenomics: number;
  supplyTransparency: number;
  networkActivity: number;
  security: number;
  developerActivity: number;
  utility: number;
  feeGeneration: number;
  revenue: number;
  governanceStrength: number;
  adoption: number;
  risk: number;
  volatility: number;
  sentiment: number;
  compliance: number;
  tvlQuality?: number;
  final_score?: number;
}

export interface CryptoValueCorridor {
  conservative: number;
  neutral: number;
  optimistic: number;
  fairValueGapPct: number;
}

export interface CryptoAnalysisPayload {
  asset_name: string;
  symbol: string;
  classification?: CryptoClassification;
  scores?: Partial<CryptoScores>;
  data_quality?: {
    level: "low" | "medium" | "high" | "unknown";
    missing_fields?: string[];
  };
  reasoning?: string[];
}
