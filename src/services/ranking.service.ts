import type { CryptoAnalysisPayload } from "../types/crypto.types";

export function calculateRankScore(payload: CryptoAnalysisPayload, finalScore: number) {
  const dq = payload.data_quality?.level === "high" ? 100 : payload.data_quality?.level === "medium" ? 70 : payload.data_quality?.level === "low" ? 40 : 50;
  const tier = payload.classification?.tier ?? 3;
  const tierScore = tier === 1 ? 100 : tier === 2 ? 78 : 55;
  const liquidity = payload.scores?.liquidity ?? 0;

  return (
    0.70 * finalScore +
    0.15 * dq +
    0.10 * tierScore +
    0.05 * liquidity
  );
}

export function isTop10Eligible(payload: CryptoAnalysisPayload): boolean {
  const confidence = payload.classification?.confidence ?? 0;
  const liquidity = payload.scores?.liquidity ?? 0;
  const dq = payload.data_quality?.level ?? "unknown";
  return confidence >= 0.65 && liquidity >= 50 && dq !== "low";
}
