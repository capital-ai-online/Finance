/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CryptoScoringInputs, CryptoAnalysisPayload } from '../types/crypto';
import { assetRegistry } from '../lib/assetRegistry';
import {
  scoreTrend,
  scoreMomentum,
  scoreBreakout,
  scoreVolatility,
  computeReturnStats,
  computeRsi,
  renormalizeAndScore,
} from './realMarketSignals';

/**
 * crypto-technical-provenance/0.7.0 canonical nominal weights.
 * exchange_liquidity and regime_bonus are deliberately excluded from the productive alpha/quality
 * score because the verified scoring path does not provide them as symmetric canonical evidence.
 * Missing admitted factors continue to be dynamically renormalized from these nominal weights.
 */
export const CRYPTO_SCORING_WEIGHTS = {
  trend: 0.2222222222,
  momentum: 0.1777777778,
  volatility_quality: 0.1333333333,
  breakout_quality: 0.1111111111,
  relative_strength: 0.1333333333,
  avg_daily_volume: 0.0888888889,
  supply_dynamics: 0.0888888889,
  data_quality_risk: 0.0444444445,
} as const;

export const CRYPTO_SCORING_NOMINAL_WEIGHTS_VERSION = 'crypto-technical-weights/0.7.0' as const;
export const CRYPTO_TECHNICAL_FEATURE_CONTRACT_VERSION = 'crypto-technical-features/0.7.0' as const;
export const CRYPTO_TECHNICAL_MODEL_VERSION = 'crypto-technical-provenance/0.7.0' as const;

export const CRYPTO_INVERTED_SCORING_FIELDS: ReadonlySet<string> = new Set(['data_quality_risk']);

export const CRYPTO_DECISION_THRESHOLDS = [
  { low: 90, high: 100, label: "A_setup", name: "A-Setup", desc: "Höchste Priorität. Enges Monitoring. Trade-Kandidat." },
  { low: 80, high: 89.99, label: "tradeable_watch", name: "Tradeable Watch", desc: "Qualitativ stark. Nur bei sauberem Timing handeln." },
  { low: 70, high: 79.99, label: "speculative_watch", name: "Speculative Watch", desc: "Gute Story, aber Risiko erhöht." },
  { low: 60, high: 69.99, label: "observe", name: "Observe", desc: "Nur mit Bestätigung oder Cluster-Setup." },
  { low: 0, high: 59.99, label: "reject", name: "Reject", desc: "Kein Trade. Ungenügende Qualität/Risiko-Profil." }
];

export class CryptoScoringService {
  /** Berechnet den kanonischen Crypto-Score nur aus im 0.7.0-Vertrag registrierten Faktoren. */
  public static scoreCrypto(inputs: CryptoScoringInputs, version: string = "0.7.0"): CryptoAnalysisPayload {
    const x = inputs;
    const values: Record<string, number | undefined> = {
      trend: x.trend !== undefined ? x.trend * 100 : undefined,
      momentum: x.momentum !== undefined ? x.momentum * 100 : undefined,
      volatility_quality: x.volatility_quality !== undefined ? x.volatility_quality * 100 : undefined,
      breakout_quality: x.breakout_quality !== undefined ? x.breakout_quality * 100 : undefined,
      relative_strength: x.relative_strength !== undefined ? x.relative_strength * 100 : undefined,
      avg_daily_volume: x.avg_daily_volume !== undefined ? x.avg_daily_volume * 100 : undefined,
      supply_dynamics: x.supply_dynamics !== undefined ? x.supply_dynamics * 100 : undefined,
      data_quality_risk: x.data_quality_risk !== undefined ? x.data_quality_risk * 100 : undefined,
    };

    const { score: final_score, usedFactors, missingFactors } = renormalizeAndScore(values, CRYPTO_SCORING_WEIGHTS, CRYPTO_INVERTED_SCORING_FIELDS);

    const positiveKeys = Object.keys(CRYPTO_SCORING_WEIGHTS).filter(k => !CRYPTO_INVERTED_SCORING_FIELDS.has(k));
    const riskKeys = Object.keys(CRYPTO_SCORING_WEIGHTS).filter(k => CRYPTO_INVERTED_SCORING_FIELDS.has(k));
    const positiveOnly = renormalizeAndScore(values, Object.fromEntries(positiveKeys.map(k => [k, CRYPTO_SCORING_WEIGHTS[k as keyof typeof CRYPTO_SCORING_WEIGHTS]])), new Set());
    const riskOnly = riskKeys.length > 0
      ? renormalizeAndScore(values, Object.fromEntries(riskKeys.map(k => [k, CRYPTO_SCORING_WEIGHTS[k as keyof typeof CRYPTO_SCORING_WEIGHTS]])), CRYPTO_INVERTED_SCORING_FIELDS)
      : { score: 0, usedFactors: [] as string[] };
    const base_score = Number(positiveOnly.score.toFixed(2));
    const risk_penalty = Number((100 - riskOnly.score).toFixed(2));

    let decision = "reject";
    let decisionName = "Reject";
    let decisionDesc = "Kein Trade. Ungenügende Qualität/Risiko-Profil.";
    for (const t of CRYPTO_DECISION_THRESHOLDS) {
      if (final_score >= t.low && final_score <= t.high) {
        decision = t.label;
        decisionName = t.name;
        decisionDesc = t.desc;
        break;
      }
    }

    let risk_level = "Medium";
    if (riskOnly.usedFactors.length === 0) risk_level = "Unbekannt";
    else if (risk_penalty > 60) risk_level = "Extreme";
    else if (risk_penalty > 30) risk_level = "High";
    else if (risk_penalty < 10) risk_level = "Low";

    const reasoning: string[] = [];
    const alerts: string[] = [];

    if ((x.trend ?? 0) > 0.7) reasoning.push("Starker technischer Aufwärtstrend vorhanden (echte Kurshistorie).");
    if ((x.momentum ?? 0) > 0.7) reasoning.push("Hohes bullisches Momentum (Rate-of-Change, echte Kurshistorie).");
    if ((x.relative_strength ?? 0) > 0.7) reasoning.push("Überragende relative Stärke (RSI, echte Kurshistorie).");
    if ((x.avg_daily_volume ?? 0) > 0.7) reasoning.push("Hervorragende reale globale Liquidität (nur mit verifizierter Provider-Evidence).");
    if (missingFactors.length > 0) {
      reasoning.push(`Ohne reale Datenquelle fuer dieses Symbol: ${missingFactors.join(', ')} (Gewichtsanteil dynamisch auf die vorhandenen Faktoren umgelegt).`);
    }
    if (reasoning.length === 0) {
      reasoning.push("Keine zusätzliche unbelegte Marktannahme; nur vorhandene verifizierte Faktoren werden bewertet.");
    }

    if (usedFactors.length === 0) {
      alerts.push("Kritisch: keine reale Datenquelle fuer dieses Symbol verfuegbar - final_score ist 0.");
    } else if (missingFactors.length > usedFactors.length) {
      alerts.push("Achtung: fuer die Mehrheit der Faktoren liegt keine reale Datenquelle vor.");
    }

    let catSub = "Alternative Cryptographic Protocol";
    if (x.coin === "BTC") catSub = "Decentralized Store of Value / Ledger Base";
    else if (x.coin === "ETH") catSub = "Smart Contract Platform / Layer-1";
    else if (x.coin === "SOL") catSub = "High-Throughput Smart Contract Network";

    const dataCompletenessRatio = usedFactors.length / (usedFactors.length + missingFactors.length || 1);
    const technicalStrength = Math.round((((x.trend ?? 0) + (x.momentum ?? 0)) / 2) * 100);
    const liquidityPct = typeof x.avg_daily_volume === 'number' && Number.isFinite(x.avg_daily_volume)
      ? Math.round(x.avg_daily_volume * 100)
      : 0;
    const riskScoreValue = Math.round(risk_penalty);

    return {
      coin: x.coin,
      score: Number((final_score / 10).toFixed(1)),
      final_score: Number(final_score.toFixed(2)),
      base_score,
      risk_penalty,
      // Backward-compatible output property only; regime_bonus has zero authority in 0.7.0.
      regime_bonus: 0,
      decision,
      decisionName,
      decisionDesc,
      risk_level,
      reasoning,
      alerts,
      classification: {
        category_main: "Crypto",
        category_sub: catSub,
        market_type: "Spot & Futures Asset Exchange",
        valuation_mode: "Verifizierte Marktdaten & Technische Analyse",
        confidence: Number(dataCompletenessRatio.toFixed(2)),
        reasoning: reasoning.slice(0, 3)
      },
      scores: {
        fundamentals: Math.round(base_score),
        risk: riskScoreValue,
        liquidity: liquidityPct,
        technicalStrength,
        final_score: Number(final_score.toFixed(1)),
      },
      weights: CRYPTO_SCORING_WEIGHTS,
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

  public static generateCryptoInputsSync(symbol: string, _change24h: number): CryptoScoringInputs {
    const s = symbol.toUpperCase().trim();
    return { coin: s };
  }

  /**
   * Historienbasierte Faktoren bleiben verifizierte Score-Evidence. Venue-spezifische Kraken-
   * Liquidität wird nicht mehr in diesem Canonical-Score-Input erzeugt; sie bleibt separaten
   * Market-Quality/Execution-Risk-Pfaden vorbehalten.
   */
  public static async generateCryptoInputs(symbol: string, change24h: number): Promise<CryptoScoringInputs> {
    const s = symbol.toUpperCase().trim();
    const base = this.generateCryptoInputsSync(symbol, change24h);

    let trend: number | undefined;
    let momentum: number | undefined;
    let breakout_quality: number | undefined;
    let volatility_quality: number | undefined;
    let relative_strength: number | undefined;
    let data_quality_risk: number | undefined;

    try {
      const history = await assetRegistry.getHistory(s, 30);
      if (history.source === 'live') {
        const closes = history.points.map(p => p.close);
        const stats = computeReturnStats(closes);
        if (stats) {
          trend = scoreTrend(stats.last, stats.sma) / 100;
          momentum = scoreMomentum(stats.rocPct) / 100;
          breakout_quality = scoreBreakout(stats.last, stats.high, stats.low) / 100;
          volatility_quality = (100 - scoreVolatility(stats.dailyStdevPct)) / 100;
        }
        const rsi = computeRsi(closes);
        if (rsi !== undefined) relative_strength = rsi / 100;
        data_quality_risk = 0.05;
      }
    } catch {
      // Fail closed: keine echte Historie -> keine historienbasierten Faktoren.
    }

    return {
      ...base,
      trend,
      momentum,
      volatility_quality,
      breakout_quality,
      relative_strength,
      data_quality_risk,
    };
  }
}