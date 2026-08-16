import { CryptoScores, CryptoAnalysisPayload } from "../types/crypto.types";
import { calculateBaseScore, calculateDefiScore, calculateValueCorridor, selectModel } from "./scoring.service";
import { calculateRankScore, isTop10Eligible } from "./ranking.service";

export class ValuationService {
  public static analyze(payload: CryptoAnalysisPayload): CryptoAnalysisPayload {
    const model = selectModel(payload);
    const scores = model === "defi" ? calculateDefiScore(payload) : calculateBaseScore(payload);
    
    // Default reference calculation
    const marketRef = payload.scores?.marketCap;
    const value_corridor = calculateValueCorridor(scores.final_score ?? 0, marketRef);
    // SC-7 Phase C: route through the explicit SC-3 opt-in path for consistency with the
    // orchestrator (Phase B). No independent composite is computed here yet, so this passes
    // the same payload.data_quality.level resolveRankingDqPoints already falls back to —
    // numerically identical rankScore, just no longer relying on the implicit default.
    const rankScore = calculateRankScore(payload, scores.final_score ?? 0, {
      compositeLevel: payload.data_quality?.level ?? null,
    });
    const eligibleForTop10 = isTop10Eligible(payload);

    return {
      ...payload,
      scores,
      reasoning: [
        ...(payload.reasoning || []),
        `Modellwahl: ${model === "defi" ? "DeFi-Cashflow-Modell" : "Kryptowährung Basis-Modell"}`,
        `Value-Korridor berechnet: Konservativ: ${value_corridor.conservative.toFixed(1)}, Neutral: ${value_corridor.neutral.toFixed(1)}, Optimistisch: ${value_corridor.optimistic.toFixed(1)}`,
        `Fair Value Gap: ${value_corridor.fairValueGapPct.toFixed(2)}%`,
        `Top 10 Eignung: ${eligibleForTop10 ? "Berechtigt (Rank Score: " + rankScore.toFixed(1) + ")" : "Nicht berechtigt (Confidence oder Liquidität unzureichend)"}`
      ]
    };
  }
}
