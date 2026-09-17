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

// Audit ARCH-AUDIT-0002 (AUD2-F-001, S1/S2/S5): auf 11 real anbindbare Faktoren reduziert.
// 5 marktdatenbasiert (realMarketSignals.ts, aus AssetRegistry/CoinGecko): marketCap,
// liquidity, tokenomics, supplyTransparency, volatility. 6 agentenbasiert
// (cryptoOrchestrator.ts, LLM-Multi-Agenten-Pipeline): networkActivity, security, utility,
// adoption, risk, sentiment. Die vorherigen 7 Felder (volumeQuality, developerActivity,
// feeGeneration, revenue, governanceStrength, compliance, tvlQuality) hatten keine reale
// oder agentenbasierte Quelle und wurden ersatzlos entfernt statt mit einem Zeichen-Hash
// weiterbetrieben zu werden. Alle Felder optional: fehlt ein Wert fuer ein Asset, wird er
// bei der Score-Berechnung ausgeschlossen und sein Gewicht auf die vorhandenen Faktoren
// umgelegt (renormalizeAndScore()), statt mit 0 oder einem Schaetzwert aufgefuellt zu werden.
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
  // Audit ARCH-AUDIT-0002 (AUD2-F-001, S1/S2/S5): legt pro Score-Feld offen, ob der Wert aus
  // einer echten LLM-Agenten-Analyse, aus realen Marktdaten (AssetRegistry/CoinGecko)
  // oder aus einer Nutzereingabe stammt.
  scoreFieldBasis?: Record<string, "agent-derived" | "real" | "user-adjusted">;
}
