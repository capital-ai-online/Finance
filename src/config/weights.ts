// Audit ARCH-AUDIT-0002 (AUD2-F-001, S1/S2/S5): Gewichte fuer die Basis- und DeFi-
// Scoring-Modelle in scoring.service.ts. Umgestellt auf die 11 real anbindbaren
// CryptoScores-Felder (5 marktdatenbasiert ueber realMarketSignals.ts, 6 agenten-
// basiert ueber cryptoOrchestrator.ts) - die vorherigen 7 Felder ohne belastbare
// Quelle (volumeQuality, developerActivity, feeGeneration, revenue,
// governanceStrength, compliance, tvlQuality) wurden aus dem Modell entfernt statt
// mit erfundenen Werten weiterbetrieben zu werden. Fehlt fuer ein einzelnes Asset
// ein Faktor (z.B. keine reale Historie fuer volatility), wird sein Gewichtsanteil
// zur Laufzeit dynamisch auf die vorhandenen Faktoren umgelegt (renormalizeAndScore(),
// siehe src/services/realMarketSignals.ts) statt hier statisch vorgehalten zu werden.

export const baseWeights = {
  marketCap: 0.15,
  liquidity: 0.13,
  volatility: 0.10,
  tokenomics: 0.07,
  supplyTransparency: 0.05,
  networkActivity: 0.12,
  security: 0.12,
  utility: 0.09,
  adoption: 0.07,
  risk: 0.06,
  sentiment: 0.04
} as const;

export const defiWeights = {
  liquidity: 0.22,
  tokenomics: 0.16,
  marketCap: 0.08,
  volatility: 0.08,
  utility: 0.16,
  adoption: 0.10,
  security: 0.12,
  networkActivity: 0.05,
  risk: 0.03
} as const;
