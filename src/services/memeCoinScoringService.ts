/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MemeCoinInputs, MemeCoinAnalysisPayload } from '../types/memeCoin';
import { assetRegistry } from '../lib/assetRegistry';
import {
  scoreTrend,
  scoreMomentum,
  scoreVolatility,
  computeReturnStats,
  renormalizeAndScore,
} from './realMarketSignals';

// Audit ARCH-AUDIT-0002 (AUD2-F-001, S1/S2/S5): von den vormals 14 Faktoren haben nur 4 eine
// reale Quelle (siehe MemeCoinInputs in types/memeCoin.ts). Kein Faktor hier ist invertiert -
// volatility_quality ist bereits im Generator invertiert (hohe Volatilitaet -> niedrige
// "Qualitaet"). Gewichte summieren auf 1.00.
export const MEME_COIN_WEIGHTS = {
  liquidity: 0.35,
  trend_structure: 0.25,
  momentum: 0.20,
  volatility_quality: 0.20,
} as const;

export class MemeCoinScoringService {
  /**
   * Berechnet den Meme-Coin-Score aus real anbindbaren Faktoren. Fehlende Faktoren werden
   * dynamisch ausgeklammert statt aus Registry-/Bootstrapwerten oder neutralen Defaults
   * abgeleitet zu werden.
   */
  public static scoreMemeCoin(inputs: MemeCoinInputs, version: string = "0.6.0"): MemeCoinAnalysisPayload {
    const x = inputs;
    const values: Record<string, number | undefined> = {
      liquidity: x.liquidity !== undefined ? x.liquidity * 100 : undefined,
      trend_structure: x.trend_structure !== undefined ? x.trend_structure * 100 : undefined,
      momentum: x.momentum !== undefined ? x.momentum * 100 : undefined,
      volatility_quality: x.volatility_quality !== undefined ? x.volatility_quality * 100 : undefined,
    };

    const { score: final_score, usedFactors, missingFactors } = renormalizeAndScore(values, MEME_COIN_WEIGHTS, new Set());

    let decision = "reject";
    let decisionName = "Reject";
    let decisionDesc = "Ungenügendes Risiko-Profil. Hohe Wahrscheinlichkeit von Kapitalverlust.";

    if (final_score >= 90) {
      decision = "A_setup";
      decisionName = "A-Setup";
      decisionDesc = "Sehr starke verifizierte Markt- und Trendlage.";
    } else if (final_score >= 80) {
      decision = "tradeable_watch";
      decisionName = "Tradeable Watch";
      decisionDesc = "Trendstarker Memecoin mit verifizierter Marktaktivität.";
    } else if (final_score >= 70) {
      decision = "speculative_watch";
      decisionName = "Speculative Watch";
      decisionDesc = "Solide verifizierte Marktdaten, aber weiterhin hohes Meme-Coin-Risiko.";
    } else if (final_score >= 60) {
      decision = "high_risk_speculation";
      decisionName = "High Risk Speculation";
      decisionDesc = "Hohes Risiko von Kursrückgängen und Liquidationen.";
    }

    const risk_level = "Unbekannt (kein realer Risikofaktor verfügbar)";

    const reasoning: string[] = [];
    const alerts: string[] = [
      "Kein realer Manipulations-, Rugpull- oder Liquiditäts-Risikofaktor verfügbar (kein On-Chain-/Order-Book-Anbieter angebunden) - Risiko separat prüfen.",
    ];

    if ((x.liquidity ?? 0) > 0.7) reasoning.push("Solide reale Liquidität aus verifizierter Provider-Evidence.");
    if ((x.trend_structure ?? 0) > 0.7) reasoning.push("Saubere technische Aufwärtsstruktur (echte Kurshistorie).");
    if ((x.momentum ?? 0) > 0.7) reasoning.push("Hohe reale Kursdynamik (Rate-of-Change, echte Kurshistorie).");
    if (missingFactors.length > 0) {
      reasoning.push(`Ohne reale Datenquelle fuer dieses Symbol: ${missingFactors.join(', ')} (Gewichtsanteil dynamisch auf die vorhandenen Faktoren umgelegt).`);
    }
    if (reasoning.length === 0) {
      reasoning.push("Keine zusätzliche unbelegte Marktannahme; nur vorhandene verifizierte Faktoren werden bewertet.");
    }
    if (usedFactors.length === 0) {
      alerts.push("Kritisch: keine reale Datenquelle fuer dieses Symbol verfuegbar - final_score ist 0.");
    }

    let catSub = "Speculative Community Token";
    if (x.coin === "DOGE") catSub = "Established Doge Ecosystem Benchmark";
    else if (x.coin === "SHIB") catSub = "Shiba Inu Ecosystem / Layer-2 Utility";
    else if (x.coin === "PEPE") catSub = "Pure Viral Meme-Asset Benchmark";

    const dataCompletenessRatio = usedFactors.length / (usedFactors.length + missingFactors.length || 1);
    const liquidityPct = Math.round((x.liquidity ?? 0) * 100);
    const technicalStrength = Math.round((((x.trend_structure ?? 0) + (x.momentum ?? 0)) / 2) * 100);

    return {
      coin: x.coin,
      score: Number((final_score / 10).toFixed(1)),
      final_score: Number(final_score.toFixed(2)),
      decision,
      decisionName,
      decisionDesc,
      risk_level,
      reasoning,
      alerts,
      classification: {
        category_main: "MemeCoin",
        category_sub: catSub,
        market_type: "Speculative High-Velocity Exchange",
        valuation_mode: "Verifizierte Kursdaten; Liquidität nur mit Provider-Evidence",
        confidence: Number(dataCompletenessRatio.toFixed(2)),
        reasoning: reasoning.slice(0, 3)
      },
      scores: {
        fundamentals: Math.round(final_score),
        liquidity: liquidityPct,
        technicalStrength,
        final_score: Number(final_score.toFixed(1)),
      },
      weights: MEME_COIN_WEIGHTS,
      data_quality: {
        level: dataCompletenessRatio >= 0.7 ? "high" : dataCompletenessRatio >= 0.4 ? "medium" : dataCompletenessRatio > 0 ? "low" : "unknown",
        missing_fields: missingFactors,
      },
      inputs: x,
      metadata: {
        scoring_version: version,
        data_quality: Number(dataCompletenessRatio.toFixed(2))
      }
    };
  }

  /**
   * R-001 / ADR-0032: Der synchrone Pfad darf keine Legacy-AssetRegistry-Finanzwerte
   * (marketCap/volume24h) als reale Liquiditaets-Evidence verwenden.
   */
  public static generateMemeCoinInputsSync(symbol: string): MemeCoinInputs {
    const s = symbol.toUpperCase().trim();
    return { coin: s };
  }

  /**
   * Historienbasierte Faktoren werden nur aus einer als `live` markierten Kurshistorie
   * erzeugt. Liquiditaet bleibt undefined, bis ein eigener verifizierter Provider-
   * Observation-Contract fuer Market Cap/Volume angebunden ist.
   */
  public static async generateMemeCoinInputs(symbol: string, _change24h: number): Promise<MemeCoinInputs> {
    const s = symbol.toUpperCase().trim();
    const base = this.generateMemeCoinInputsSync(symbol);

    let trend_structure: number | undefined;
    let momentum: number | undefined;
    let volatility_quality: number | undefined;

    try {
      const history = await assetRegistry.getHistory(s, 30);
      if (history.source === 'live') {
        const stats = computeReturnStats(history.points.map(p => p.close));
        if (stats) {
          trend_structure = scoreTrend(stats.last, stats.sma) / 100;
          momentum = scoreMomentum(stats.rocPct) / 100;
          volatility_quality = (100 - scoreVolatility(stats.dailyStdevPct)) / 100;
        }
      }
    } catch {
      // Fail closed: keine echte Historie -> keine historienbasierten Faktoren.
    }

    return { ...base, trend_structure, momentum, volatility_quality };
  }
}
