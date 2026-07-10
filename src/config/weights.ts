export const baseWeights = {
  marketCap: 0.10,
  liquidity: 0.14,
  volumeQuality: 0.07,
  tokenomics: 0.10,
  supplyTransparency: 0.06,
  networkActivity: 0.10,
  security: 0.10,
  developerActivity: 0.08,
  utility: 0.08,
  feeGeneration: 0.04,
  revenue: 0.04,
  governanceStrength: 0.03,
  adoption: 0.06,
  risk: 0.06,
  volatility: 0.02,
  sentiment: 0.01,
  compliance: 0.01
} as const;

export const defiWeights = {
  feeGeneration: 0.20,
  tvlQuality: 0.15,
  utility: 0.15,
  tokenomics: 0.15,
  liquidity: 0.10,
  security: 0.10,
  governanceStrength: 0.10,
  adoption: 0.05,
  risk: 0.05
} as const;
