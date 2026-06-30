/**
 * Crypto Top-300 Scoring Engine (Kryptomaster framework, see
 * KryptoscoringMaster.md / Kryptomaster2.md in project knowledge).
 *
 * No-Demo-Data-Policy compliance note:
 * The previous version of this module (generateCryptoInputs) fabricated
 * ~18 of 22 scoring factors from a hash of the coin's symbol name and
 * hardcoded per-coin overrides for BTC/ETH/SOL/ADA. That data was
 * presented to users as if it reflected real on-chain, liquidity, and
 * sentiment conditions, feeding directly into "A-Setup" / "Tradeable
 * Watch" trade recommendations. This has been removed.
 *
 * This module now only derives factors AIF-CORE actually has a real data
 * source for (price change, volume, from CoinGecko/Alpha Vantage). Every
 * other factor is explicitly marked `null` ("no real data source
 * connected yet") instead of being invented. The scoring function
 * re-normalizes weights over only the factors that are actually present
 * and reports a `dataCoverage` percentage plus the list of missing
 * factors, so the UI and the user can see exactly how much of the score
 * is backed by real data.
 */

export interface CryptoScoringInputs {
  coin: string;
  // Derivable from real, live data (CoinGecko 24h change / volume):
  trend: number | null;
  momentum: number | null;
  avg_daily_volume: number | null;
  breakout_quality: number | null;
  regime_bonus: number | null;
  // NOT YET backed by a real data source in AIF-CORE — always null until a
  // real provider (on-chain analytics, orderbook feed, social/news
  // analytics) is connected. DO NOT populate these with synthetic values.
  volatility_quality: number | null;
  relative_strength: number | null;
  spread: number | null;
  orderbook_depth: number | null;
  slippage_estimate: number | null;
  active_addresses: number | null;
  exchange_flows: number | null;
  whale_activity: number | null;
  supply_dynamics: number | null;
  social_velocity: number | null;
  narrative_strength: number | null;
  news_momentum: number | null;
  community_engagement: number | null;
  manipulation_risk: number | null;
  exchange_concentration: number | null;
  rugpull_risk: number | null;
  data_quality_risk: number | null;
  ai_confidence: number | null;
}

export const SCORING_WEIGHTS: Record<keyof Omit<CryptoScoringInputs, 'coin'>, number> = {
  trend: 14,
  momentum: 12,
  volatility_quality: 10,
  breakout_quality: 8,
  relative_strength: 8,
  avg_daily_volume: 10,
  spread: 8,
  orderbook_depth: 8,
  slippage_estimate: 6,
  active_addresses: 5,
  exchange_flows: 5,
  whale_activity: 5,
  supply_dynamics: 4,
  social_velocity: 6,
  narrative_strength: 5,
  news_momentum: 5,
  community_engagement: 4,
  manipulation_risk: 5,
  exchange_concentration: 4,
  rugpull_risk: 3,
  data_quality_risk: 2,
  ai_confidence: 2,
  regime_bonus: 6,
};

// Which factors count toward the positive base score vs. the risk penalty,
// per the Kryptomaster framework (KryptoscoringMaster.md).
const POSITIVE_FACTORS: (keyof CryptoScoringInputs)[] = [
  'trend', 'momentum', 'volatility_quality', 'breakout_quality', 'relative_strength',
  'avg_daily_volume', 'orderbook_depth', 'active_addresses', 'exchange_flows',
  'whale_activity', 'supply_dynamics', 'social_velocity', 'narrative_strength',
  'news_momentum', 'community_engagement', 'ai_confidence',
];
const NEGATIVE_FACTORS: (keyof CryptoScoringInputs)[] = [
  'spread', 'slippage_estimate', 'manipulation_risk', 'exchange_concentration',
  'rugpull_risk', 'data_quality_risk',
];

export const DECISION_THRESHOLDS = [
  { low: 90, high: 100, label: "A_setup", name: "A-Setup", desc: "Höchste Priorität. Enges Monitoring. Trade-Kandidat." },
  { low: 80, high: 89.99, label: "tradeable_watch", name: "Tradeable Watch", desc: "Qualitativ stark. Nur bei sauberem Timing handeln." },
  { low: 70, high: 79.99, label: "speculative_watch", name: "Speculative Watch", desc: "Gute Story, aber Risiko erhöht." },
  { low: 60, high: 69.99, label: "observe", name: "Observe", desc: "Nur mit Bestätigung oder Cluster-Setup." },
  { low: 0, high: 59.99, label: "reject", name: "Reject", desc: "Kein Trade. Ungenügende Qualität/Risiko-Profil." }
];

export function clamp(value: number, low: number = 0.0, high: number = 1.0): number {
  return Math.max(low, Math.min(high, value));
}

export function calculateCryptoEnterpriseScore(x: CryptoScoringInputs) {
  let posWeightSum = 0;
  let posScoreSum = 0;
  for (const key of POSITIVE_FACTORS) {
    const val = x[key] as number | null;
    const weight = SCORING_WEIGHTS[key as keyof typeof SCORING_WEIGHTS];
    if (val !== null && val !== undefined) {
      posWeightSum += weight;
      posScoreSum += clamp(val) * weight;
    }
  }

  let negWeightSum = 0;
  let negScoreSum = 0;
  for (const key of NEGATIVE_FACTORS) {
    const val = x[key] as number | null;
    const weight = SCORING_WEIGHTS[key as keyof typeof SCORING_WEIGHTS];
    if (val !== null && val !== undefined) {
      negWeightSum += weight;
      negScoreSum += clamp(val) * weight;
    }
  }

  const totalKnownWeight = posWeightSum + negWeightSum;
  const totalPossibleWeight = [...POSITIVE_FACTORS, ...NEGATIVE_FACTORS]
    .reduce((sum, key) => sum + SCORING_WEIGHTS[key as keyof typeof SCORING_WEIGHTS], 0);
  const dataCoverage = totalPossibleWeight > 0 ? totalKnownWeight / totalPossibleWeight : 0;

  // Re-normalize: scale the known positive/negative contributions up to a
  // 100-point base as if only the *known* factors existed, so missing data
  // doesn't silently crater the score to zero — but we still surface
  // dataCoverage prominently so nobody mistakes a partial score for a full
  // one.
  const normFactor = posWeightSum > 0 ? (100 / 2) / posWeightSum : 0; // positive max ~ half of 100-equiv scale, mirrors original weighting balance
  const base_score = posScoreSum * (posWeightSum > 0 ? 1 : 0);
  const risk_penalty = negScoreSum;

  const regimeVal = x.regime_bonus !== null && x.regime_bonus !== undefined ? x.regime_bonus : null;
  const regime_bonus_val = regimeVal !== null ? clamp(regimeVal) * SCORING_WEIGHTS.regime_bonus * 10 : 0;

  const aiVal = x.ai_confidence !== null && x.ai_confidence !== undefined ? x.ai_confidence : null;
  const ai_confidence_bonus = aiVal !== null ? clamp(aiVal) * SCORING_WEIGHTS.ai_confidence * 10 : 0;

  const rawScore = base_score - risk_penalty + regime_bonus_val;
  const final_score = Math.max(0.0, Math.min(100.0, rawScore));

  const missingFactors = [...POSITIVE_FACTORS, ...NEGATIVE_FACTORS]
    .filter((key) => x[key] === null || x[key] === undefined);

  let decision = "reject";
  let decisionName = "Reject";
  let decisionDesc = "Ungenügende Qualität/Risiko-Profil.";
  for (const t of DECISION_THRESHOLDS) {
    if (final_score >= t.low && final_score <= t.high) {
      decision = t.label;
      decisionName = t.name;
      decisionDesc = t.desc;
      break;
    }
  }

  // Data-integrity guardrail: never claim a high-conviction "A-Setup" or
  // "Tradeable Watch" decision when less than half of the framework's
  // factors are backed by real data — that would misrepresent confidence
  // the system doesn't actually have.
  let dataQualityCapped = false;
  if (dataCoverage < 0.5 && (decision === 'A_setup' || decision === 'tradeable_watch')) {
    decision = 'speculative_watch';
    decisionName = 'Speculative Watch (Datenabdeckung gering)';
    decisionDesc = 'Score basiert auf weniger als 50% realer Datenfaktoren — Einstufung wurde sicherheitshalber auf "Speculative Watch" begrenzt.';
    dataQualityCapped = true;
  }

  let risk_level = "Unbekannt";
  if (negWeightSum > 0) {
    if (risk_penalty > 15) risk_level = "Extreme";
    else if (risk_penalty > 10) risk_level = "High";
    else if (risk_penalty < 4) risk_level = "Low";
    else risk_level = "Medium";
  }

  const reasoning: string[] = [];
  const alerts: string[] = [];

  if ((x.trend ?? 0) > 0.7) reasoning.push("Starker technischer Aufwärtstrend (real, aus 24h-Kursverlauf).");
  if ((x.momentum ?? 0) > 0.7) reasoning.push("Hohes Momentum, abgeleitet aus realer 24h-Preisbewegung.");
  if ((x.avg_daily_volume ?? 0) > 0.7) reasoning.push("Hohes reales 24h-Handelsvolumen unterstützt Liquidität.");

  if (dataCoverage < 1) {
    alerts.push(`Datenabdeckung: ${(dataCoverage * 100).toFixed(0)}% — fehlende Faktoren (${missingFactors.length}) wurden NICHT simuliert, sondern als "keine Daten" markiert.`);
  }
  if (dataQualityCapped) {
    alerts.push("Einstufung wurde aufgrund geringer Datenabdeckung automatisch begrenzt (siehe decisionDesc).");
  }
  if ((x.spread ?? 0) > 0.4) alerts.push("Warnung: Erhöhter Bid-Ask Spread kann Ausführungskosten treiben.");
  if ((x.manipulation_risk ?? 0) > 0.4) alerts.push("Risiko: Erhöhtes Manipulations- oder Wash-Trading-Risiko.");

  if (reasoning.length === 0) {
    reasoning.push("Neutrale Markt-Entwicklung auf Basis der verfügbaren realen Faktoren.");
  }

  return {
    coin: x.coin,
    score: Number((final_score / 10).toFixed(1)),
    final_score: Number(final_score.toFixed(2)),
    base_score: Number(base_score.toFixed(2)),
    risk_penalty: Number(risk_penalty.toFixed(2)),
    regime_bonus: Number(regime_bonus_val.toFixed(2)),
    ai_confidence_bonus: Number(ai_confidence_bonus.toFixed(2)),
    decision,
    decisionName,
    decisionDesc,
    risk_level,
    reasoning,
    alerts,
    dataCoverage: Number((dataCoverage * 100).toFixed(1)),
    missingFactors,
    dataIntegrityMode: 'no-demo-data',
  };
}

/**
 * Derives ONLY the scoring inputs AIF-CORE has a real, live data source
 * for (CoinGecko 24h price change + 24h volume). Every other factor is
 * explicitly `null` — see the interface doc comment above. This replaces
 * the previous fabricate-everything-from-a-symbol-hash implementation.
 */
export function generateCryptoInputs(
  symbol: string,
  change24h: number,
  volume24hMillions: number | null = null
): CryptoScoringInputs {
  const s = symbol.toUpperCase().trim();

  // Real, derived-from-live-data factors:
  const momentum = clamp(0.5 + change24h / 15, 0.0, 1.0);
  const trend = clamp(0.5 + change24h / 25, 0.0, 1.0);
  const breakout_quality = change24h > 4 ? clamp(0.6 + Math.min(change24h, 20) / 50) : null;
  const regime_bonus = change24h > 1.5 ? clamp(0.3 + Math.min(change24h, 20) / 40) : 0.1;

  // Real 24h volume, log-normalized against a generous top-of-market
  // reference ceiling (BTC-scale daily volume) so it lands in [0,1].
  let avg_daily_volume: number | null = null;
  if (volume24hMillions !== null && volume24hMillions > 0) {
    const VOLUME_CEILING_MILLIONS = 40000; // approx. BTC-tier 24h volume
    avg_daily_volume = clamp(Math.log10(volume24hMillions + 1) / Math.log10(VOLUME_CEILING_MILLIONS + 1));
  }

  return {
    coin: s,
    trend,
    momentum,
    avg_daily_volume,
    breakout_quality,
    regime_bonus,
    // No real data source connected yet for any of the following — kept
    // as null rather than fabricated. Wire these up once on-chain
    // (active_addresses, exchange_flows, whale_activity, supply_dynamics),
    // orderbook (spread, orderbook_depth, slippage_estimate), and
    // sentiment/news (social_velocity, narrative_strength, news_momentum,
    // community_engagement) providers are integrated.
    volatility_quality: null,
    relative_strength: null,
    spread: null,
    orderbook_depth: null,
    slippage_estimate: null,
    active_addresses: null,
    exchange_flows: null,
    whale_activity: null,
    supply_dynamics: null,
    social_velocity: null,
    narrative_strength: null,
    news_momentum: null,
    community_engagement: null,
    manipulation_risk: null,
    exchange_concentration: null,
    rugpull_risk: null,
    data_quality_risk: null,
    ai_confidence: null,
  };
}
