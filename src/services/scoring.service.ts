import { baseWeights, defiWeights } from "../config/weights";
import type { CryptoAnalysisPayload, CryptoScores, CryptoValueCorridor } from "../types/crypto.types";

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

export function calculateBaseScore(payload: CryptoAnalysisPayload): CryptoScores {
  const s = payload.scores ?? {};
  const riskAdjusted = 100 - (s.risk ?? 0);

  const final_score = clamp(
    (s.marketCap ?? 0) * baseWeights.marketCap +
    (s.liquidity ?? 0) * baseWeights.liquidity +
    (s.volumeQuality ?? 0) * baseWeights.volumeQuality +
    (s.tokenomics ?? 0) * baseWeights.tokenomics +
    (s.supplyTransparency ?? 0) * baseWeights.supplyTransparency +
    (s.networkActivity ?? 0) * baseWeights.networkActivity +
    (s.security ?? 0) * baseWeights.security +
    (s.developerActivity ?? 0) * baseWeights.developerActivity +
    (s.utility ?? 0) * baseWeights.utility +
    (s.feeGeneration ?? 0) * baseWeights.feeGeneration +
    (s.revenue ?? 0) * baseWeights.revenue +
    (s.governanceStrength ?? 0) * baseWeights.governanceStrength +
    (s.adoption ?? 0) * baseWeights.adoption +
    riskAdjusted * baseWeights.risk +
    (s.volatility ? (100 - s.volatility) * baseWeights.volatility : 0) +
    (s.sentiment ?? 0) * baseWeights.sentiment +
    (s.compliance ?? 0) * baseWeights.compliance
  );

  return {
    marketCap: s.marketCap ?? 0,
    liquidity: s.liquidity ?? 0,
    volumeQuality: s.volumeQuality ?? 0,
    tokenomics: s.tokenomics ?? 0,
    supplyTransparency: s.supplyTransparency ?? 0,
    networkActivity: s.networkActivity ?? 0,
    security: s.security ?? 0,
    developerActivity: s.developerActivity ?? 0,
    utility: s.utility ?? 0,
    feeGeneration: s.feeGeneration ?? 0,
    revenue: s.revenue ?? 0,
    governanceStrength: s.governanceStrength ?? 0,
    adoption: s.adoption ?? 0,
    risk: s.risk ?? 0,
    volatility: s.volatility ?? 0,
    sentiment: s.sentiment ?? 0,
    compliance: s.compliance ?? 0,
    final_score
  };
}

export function calculateDefiScore(payload: CryptoAnalysisPayload): CryptoScores {
  const s = payload.scores ?? {};
  const tvlQuality = s.tvlQuality ?? 0;
  const riskAdjusted = 100 - (s.risk ?? 0);

  const final_score = clamp(
    (s.feeGeneration ?? 0) * defiWeights.feeGeneration +
    tvlQuality * defiWeights.tvlQuality +
    (s.utility ?? 0) * defiWeights.utility +
    (s.tokenomics ?? 0) * defiWeights.tokenomics +
    (s.liquidity ?? 0) * defiWeights.liquidity +
    (s.security ?? 0) * defiWeights.security +
    (s.governanceStrength ?? 0) * defiWeights.governanceStrength +
    (s.adoption ?? 0) * defiWeights.adoption +
    riskAdjusted * defiWeights.risk
  );

  return {
    marketCap: s.marketCap ?? 0,
    liquidity: s.liquidity ?? 0,
    volumeQuality: s.volumeQuality ?? 0,
    tokenomics: s.tokenomics ?? 0,
    supplyTransparency: s.supplyTransparency ?? 0,
    networkActivity: s.networkActivity ?? 0,
    security: s.security ?? 0,
    developerActivity: s.developerActivity ?? 0,
    utility: s.utility ?? 0,
    feeGeneration: s.feeGeneration ?? 0,
    revenue: s.revenue ?? 0,
    governanceStrength: s.governanceStrength ?? 0,
    adoption: s.adoption ?? 0,
    risk: s.risk ?? 0,
    volatility: s.volatility ?? 0,
    sentiment: s.sentiment ?? 0,
    compliance: s.compliance ?? 0,
    tvlQuality,
    final_score
  };
}

export function calculateValueCorridor(finalScore: number, marketReference?: number): CryptoValueCorridor {
  const conservative = clamp(finalScore * 0.85);
  const neutral = clamp(finalScore);
  const optimistic = clamp(finalScore * 1.15);
  const fairValueGapPct = marketReference && marketReference > 0 ? ((neutral - marketReference) / marketReference) * 100 : 0;
  return { conservative, neutral, optimistic, fairValueGapPct };
}

export function selectModel(payload: CryptoAnalysisPayload) {
  return payload.classification?.category_main === "DeFi" ? "defi" : "base";
}

export function generateCryptoScores(symbol: string, change24h: number): CryptoScores {
  const s = symbol.toUpperCase().trim();
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  const seed = (Math.abs(hash) % 100) / 100;

  let marketCap = 50 + seed * 30;
  let liquidity = 60 + seed * 20;
  let volumeQuality = 70 + (seed - 0.5) * 20;
  let tokenomics = 65 + (seed - 0.5) * 15;
  let supplyTransparency = 80 + (seed - 0.5) * 20;
  let networkActivity = 55 + seed * 35;
  let security = 85 + (seed - 0.5) * 10;
  let developerActivity = 60 + seed * 30;
  let utility = 50 + seed * 40;
  let feeGeneration = 30 + seed * 50;
  let revenue = 25 + seed * 40;
  let governanceStrength = 70 + (seed - 0.5) * 15;
  let adoption = 40 + seed * 50;
  let risk = 30 + (0.5 - seed) * 20;
  let volatility = 50 + (seed - 0.5) * 30;
  let sentiment = 50 + change24h * 3;
  let compliance = 75 + (seed - 0.5) * 15;
  let tvlQuality = 40 + seed * 45;

  if (s === "BTC") {
    marketCap = 98;
    liquidity = 96;
    volumeQuality = 91;
    tokenomics = 84;
    supplyTransparency = 88;
    networkActivity = 95;
    security = 97;
    developerActivity = 94;
    utility = 90;
    feeGeneration = 82;
    revenue = 76;
    governanceStrength = 86;
    adoption = 93;
    risk = 22;
    volatility = 34;
    sentiment = 68 + change24h;
    compliance = 77;
  } else if (s === "ETH") {
    marketCap = 88;
    liquidity = 86;
    volumeQuality = 81;
    tokenomics = 78;
    supplyTransparency = 84;
    networkActivity = 85;
    security = 89;
    developerActivity = 88;
    utility = 82;
    feeGeneration = 75;
    revenue = 68;
    governanceStrength = 80;
    adoption = 85;
    risk = 28;
    volatility = 42;
    sentiment = 60 + change24h;
    compliance = 74;
    tvlQuality = 85;
  } else if (s === "SOL") {
    marketCap = 82;
    liquidity = 85;
    volumeQuality = 79;
    tokenomics = 72;
    supplyTransparency = 75;
    networkActivity = 90;
    security = 82;
    developerActivity = 92;
    utility = 86;
    feeGeneration = 68;
    revenue = 62;
    governanceStrength = 75;
    adoption = 88;
    risk = 32;
    volatility = 55;
    sentiment = 65 + change24h;
    compliance = 70;
    tvlQuality = 78;
  } else if (["AAVE", "UNI", "COMP", "MKR", "LDO", "CRV"].includes(s)) {
    marketCap = 68;
    liquidity = 75;
    volumeQuality = 78;
    tokenomics = 82;
    supplyTransparency = 90;
    networkActivity = 72;
    security = 88;
    developerActivity = 82;
    utility = 85;
    feeGeneration = 90;
    revenue = 84;
    governanceStrength = 85;
    adoption = 78;
    risk = 35;
    volatility = 48;
    sentiment = 55 + change24h;
    compliance = 72;
    tvlQuality = 92;
  }

  return {
    marketCap: clamp(marketCap, 0, 100),
    liquidity: clamp(liquidity, 0, 100),
    volumeQuality: clamp(volumeQuality, 0, 100),
    tokenomics: clamp(tokenomics, 0, 100),
    supplyTransparency: clamp(supplyTransparency, 0, 100),
    networkActivity: clamp(networkActivity, 0, 100),
    security: clamp(security, 0, 100),
    developerActivity: clamp(developerActivity, 0, 100),
    utility: clamp(utility, 0, 100),
    feeGeneration: clamp(feeGeneration, 0, 100),
    revenue: clamp(revenue, 0, 100),
    governanceStrength: clamp(governanceStrength, 0, 100),
    adoption: clamp(adoption, 0, 100),
    risk: clamp(risk, 0, 100),
    volatility: clamp(volatility, 0, 100),
    sentiment: clamp(sentiment, 0, 100),
    compliance: clamp(compliance, 0, 100),
    tvlQuality: clamp(tvlQuality, 0, 100),
    final_score: 0
  };
}
