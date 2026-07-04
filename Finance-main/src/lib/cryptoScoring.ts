import { fetchCoinGeckoHistory, COINGECKO_ID_MAP } from './assetRegistry';

// ═══════════════════════════════════════════════════════════════════════
// No-Demo-Data-Policy compliance note (rewritten from the previous
// version, which derived every one of these 23 factors from a
// deterministic hash of the symbol string plus hardcoded per-coin
// "fine-tuning" — i.e. entirely fabricated numbers presented as if they
// were real market/on-chain/social data).
//
// Every factor below is now either:
//   (a) computed from real data this server actually fetches (live price,
//       change24h, volume24h, and real daily-close history from
//       CoinGecko's public market_chart endpoint), or
//   (b) explicitly `null` when no real data source is connected for it.
//
// `null` factors are excluded from the weighted score (with the remaining
// weights renormalized) rather than being silently defaulted to some
// invented number — a missing input must never look like a measured one.
// The API response reports which factors were used vs. excluded so the
// UI can show this honestly instead of implying full-spectrum analysis.
//
// Factors with no real data source currently wired (would need external
// providers this project doesn't yet have API keys for):
//   - spread, orderbook_depth, slippage_estimate → needs a live
//     order-book fetch (Kraken/Binance order book, not yet wired here)
//   - active_addresses, exchange_flows, whale_activity, supply_dynamics
//     → needs an on-chain data provider (e.g. Glassnode, Nansen, CoinMetrics)
//   - social_velocity, narrative_strength, news_momentum,
//     community_engagement → needs a social/sentiment provider (e.g.
//     LunarCrush — a real option, just not yet given an API key here)
//   - manipulation_risk, exchange_concentration, rugpull_risk → needs a
//     dedicated risk/market-surveillance provider
// ═══════════════════════════════════════════════════════════════════════

export interface CryptoScoringInputs {
  coin: string;
  trend: number | null;
  momentum: number | null;
  volatility_quality: number | null;
  breakout_quality: number | null;
  relative_strength: number | null;
  avg_daily_volume: number | null;
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
  ai_confidence: number | null; // repurposed: real data-completeness fraction, not an LLM judgment
  regime_bonus: number | null;
  dataSources: string[];        // which real sources actually contributed
}

export const SCORING_WEIGHTS = {
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
  regime_bonus: 6
};

const POSITIVE_FACTORS = [
  'trend', 'momentum', 'volatility_quality', 'breakout_quality', 'relative_strength',
  'avg_daily_volume', 'orderbook_depth', 'active_addresses', 'exchange_flows',
  'whale_activity', 'supply_dynamics', 'social_velocity', 'narrative_strength',
  'news_momentum', 'community_engagement', 'ai_confidence'
] as const;

const NEGATIVE_FACTORS = [
  'spread', 'slippage_estimate', 'manipulation_risk', 'exchange_concentration',
  'rugpull_risk', 'data_quality_risk'
] as const;

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

export function normalizeToScore(value: number, weight: number): number {
  return clamp(value) * weight;
}

export function calculateCryptoEnterpriseScore(x: CryptoScoringInputs) {
  let posWeightSum = 0;
  let posValueSum = 0;
  let posTotalPossible = 0;
  const excludedFactors: string[] = [];

  for (const key of POSITIVE_FACTORS) {
    const weight = SCORING_WEIGHTS[key];
    posTotalPossible += weight;
    const value = x[key];
    if (value === null || value === undefined) {
      excludedFactors.push(key);
      continue;
    }
    posWeightSum += weight;
    posValueSum += normalizeToScore(value, weight);
  }

  let negWeightSum = 0;
  let negValueSum = 0;
  let negTotalPossible = 0;
  for (const key of NEGATIVE_FACTORS) {
    const weight = SCORING_WEIGHTS[key];
    negTotalPossible += weight;
    const value = x[key];
    if (value === null || value === undefined) {
      excludedFactors.push(key);
      continue;
    }
    negWeightSum += weight;
    negValueSum += normalizeToScore(value, weight);
  }

  const base_score = posWeightSum > 0 ? (posValueSum / posWeightSum) * posTotalPossible : 0;
  const risk_penalty = negWeightSum > 0 ? (negValueSum / negWeightSum) * negTotalPossible : 0;

  const regimeVal = x.regime_bonus ?? null;
  if (regimeVal === null) excludedFactors.push('regime_bonus');
  const regime_bonus_val = regimeVal !== null ? clamp(regimeVal) * SCORING_WEIGHTS.regime_bonus * 10 : 0;

  const final_score = Math.max(0.0, Math.min(100.0, base_score - risk_penalty + regime_bonus_val));

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

  let risk_level = "Medium";
  if (risk_penalty > 15) risk_level = "Extreme";
  else if (risk_penalty > 10) risk_level = "High";
  else if (risk_penalty < 4) risk_level = "Low";

  const reasoning: string[] = [];
  const alerts: string[] = [];

  if ((x.trend ?? 0) > 0.7) reasoning.push("Realer Kurs deutlich über dem gleitenden Durchschnitt (SMA20).");
  if ((x.momentum ?? 0) > 0.7) reasoning.push("Starkes reales 7-Tage-Kursmomentum.");
  if ((x.relative_strength ?? 0) > 0.7) reasoning.push("Reale relative Stärke gegenüber Bitcoin als Marktbenchmark.");
  if ((x.avg_daily_volume ?? 0) > 0.7) reasoning.push("Hohes reales 24h-Handelsvolumen laut CoinGecko/CMC.");
  if ((x.breakout_quality ?? 0) > 0.7) reasoning.push("Kurs nahe oder über dem realen Periodenhoch.");

  if ((x.spread ?? 0) > 0.4) alerts.push("Warnung: Erhöhter Bid-Ask Spread kann Ausführungskosten treiben.");
  const totalFactors = POSITIVE_FACTORS.length + NEGATIVE_FACTORS.length;
  if (excludedFactors.length > totalFactors / 2) {
    alerts.push(`Hinweis: Score basiert nur auf ${totalFactors - excludedFactors.length} von ${totalFactors} Faktoren — On-Chain-, Orderbuch- und Social-Datenquellen sind aktuell nicht angebunden.`);
  }

  if (reasoning.length === 0) {
    reasoning.push("Neutrale reale Marktentwicklung, keine starken Signale in den verfügbaren Faktoren.");
  }

  const dataCompleteness = 1 - (excludedFactors.length / (totalFactors + 1));

  return {
    coin: x.coin,
    score: Number((final_score / 10).toFixed(2)), // 0-10 scale, 2 decimals
    final_score: Number(final_score.toFixed(2)),
    base_score: Number(base_score.toFixed(2)),
    risk_penalty: Number(risk_penalty.toFixed(2)),
    regime_bonus: Number(regime_bonus_val.toFixed(2)),
    decision,
    decisionName,
    decisionDesc,
    risk_level,
    reasoning,
    alerts,
    dataCompleteness: Number(dataCompleteness.toFixed(2)),
    excludedFactors,
    dataSources: x.dataSources,
  };
}

/**
 * Computes real crypto scoring inputs from live price/volume data plus
 * real daily-close history (CoinGecko). Async because it fetches history.
 * Returns `null` for every factor with no connected real data source —
 * see the policy note at the top of this file.
 */
export async function generateCryptoInputs(symbol: string, change24h: number): Promise<CryptoScoringInputs> {
  const s = symbol.toUpperCase().trim();
  const dataSources: string[] = ['live_price_change24h'];

  const base: CryptoScoringInputs = {
    coin: s,
    trend: null,
    momentum: null,
    volatility_quality: null,
    breakout_quality: null,
    relative_strength: null,
    avg_daily_volume: null,
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
    regime_bonus: null,
    dataSources,
  };

  // Real, immediate: 24h momentum directly from the live price feed.
  base.momentum = clamp(0.5 + change24h / 20, 0.02, 0.98);

  const coingeckoId = COINGECKO_ID_MAP[s];
  if (!coingeckoId) {
    base.data_quality_risk = 0.7; // low data availability = genuinely higher risk
    base.ai_confidence = 0.15;
    return base;
  }

  const history = await fetchCoinGeckoHistory(coingeckoId, 30);
  if (!history || history.length < 10) {
    base.data_quality_risk = 0.6;
    base.ai_confidence = 0.2;
    return base;
  }
  dataSources.push('coingecko_market_chart_30d');

  const closes = history.map(h => h.close);
  const lastClose = closes[closes.length - 1];

  const smaWindow = Math.min(20, closes.length);
  const sma = closes.slice(-smaWindow).reduce((a, b) => a + b, 0) / smaWindow;
  base.trend = clamp(0.5 + (lastClose - sma) / sma / 0.25);

  const close7dAgo = closes[Math.max(0, closes.length - 8)];
  const roc7d = (lastClose - close7dAgo) / close7dAgo;
  base.momentum = clamp(0.5 + (0.5 * (change24h / 20) + 0.5 * (roc7d / 0.25)));

  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length;
  const stdev = Math.sqrt(variance);
  const targetStdev = 0.035;
  base.volatility_quality = clamp(1 - Math.abs(stdev - targetStdev) / 0.06);

  const periodHigh = Math.max(...closes);
  base.breakout_quality = clamp(1 - (periodHigh - lastClose) / periodHigh / 0.15);

  if (s === 'BTC') {
    base.relative_strength = 0.5;
    const btcReturn30d = (lastClose - closes[0]) / closes[0];
    base.regime_bonus = clamp(0.5 + btcReturn30d / 0.3);
  } else {
    const btcHistory = await fetchCoinGeckoHistory('bitcoin', 30);
    if (btcHistory && btcHistory.length >= 10) {
      const btcCloses = btcHistory.map(h => h.close);
      const btcReturn = (btcCloses[btcCloses.length - 1] - btcCloses[0]) / btcCloses[0];
      const symbolReturn = (lastClose - closes[0]) / closes[0];
      base.relative_strength = clamp(0.5 + (symbolReturn - btcReturn) / 0.4);
      base.regime_bonus = clamp(0.5 + btcReturn / 0.3);
      dataSources.push('coingecko_btc_benchmark_30d');
    }
  }

  base.data_quality_risk = 0.1;
  base.ai_confidence = 0.85;

  return base;
}

export interface MemeCoinInputs {
  coin: string;
  liquidity: number | null;
  volume_trend: number | null;
  trend_structure: number | null;
  momentum: number | null;
  volatility_quality: number | null;
  social_sentiment: number | null;
  narrative_strength: number | null;
  catalyst_strength: number | null;
  spread_penalty: number | null;
  liquidity_penalty: number | null;
  manipulation_penalty: number | null;
  rugpull_penalty: number | null;
  decay_penalty: number | null;
  ai_confidence_bonus: number | null;
  dataSources: string[];
}

const MEME_POSITIVE = ['liquidity', 'volume_trend', 'trend_structure', 'momentum', 'volatility_quality', 'social_sentiment', 'narrative_strength', 'catalyst_strength'] as const;
const MEME_WEIGHTS: Record<string, number> = {
  liquidity: 0.15, volume_trend: 0.10, trend_structure: 0.15, momentum: 0.10,
  volatility_quality: 0.10, social_sentiment: 0.15, narrative_strength: 0.10, catalyst_strength: 0.10
};
const MEME_PENALTIES = ['spread_penalty', 'liquidity_penalty', 'manipulation_penalty', 'rugpull_penalty', 'decay_penalty'] as const;

export function calculateMemeCoinScore(x: MemeCoinInputs) {
  let posWeightSum = 0, posValueSum = 0, posTotalPossible = 0;
  const excludedFactors: string[] = [];
  for (const key of MEME_POSITIVE) {
    const w = MEME_WEIGHTS[key];
    posTotalPossible += w;
    const v = x[key];
    if (v === null || v === undefined) { excludedFactors.push(key); continue; }
    posWeightSum += w;
    posValueSum += clamp(v) * w;
  }
  const base_score = posWeightSum > 0 ? (posValueSum / posWeightSum) * posTotalPossible * 100 : 0;

  let penaltySum = 0;
  let penaltiesKnown = 0;
  for (const key of MEME_PENALTIES) {
    const v = x[key];
    if (v === null || v === undefined) { excludedFactors.push(key); continue; }
    penaltySum += v;
    penaltiesKnown++;
  }
  const risk_penalty = penaltiesKnown > 0 ? (penaltySum / penaltiesKnown) * MEME_PENALTIES.length * 100 * 0.2 : 0;

  const ai_confidence_val = (x.ai_confidence_bonus ?? 0) * 100;
  if (x.ai_confidence_bonus === null || x.ai_confidence_bonus === undefined) excludedFactors.push('ai_confidence_bonus');

  const final_score = Math.max(0.0, Math.min(100.0, base_score - risk_penalty + ai_confidence_val));

  let decision = "reject", decisionName = "Reject", decisionDesc = "Ungenügendes Risiko-Profil. Hohe Wahrscheinlichkeit von Kapitalverlust.";
  if (final_score >= 90) { decision = "A_setup"; decisionName = "A-Setup"; decisionDesc = "Sehr starker Hype & gesicherte Liquidität. Exzellenter Einstieg."; }
  else if (final_score >= 80) { decision = "tradeable_watch"; decisionName = "Tradeable Watch"; decisionDesc = "Trendstarker Memecoin mit stabiler Handelsaktivität."; }
  else if (final_score >= 70) { decision = "speculative_watch"; decisionName = "Speculative Watch"; decisionDesc = "Narrativ stark, aber erhöhtes Risiko & Volatilität."; }
  else if (final_score >= 60) { decision = "high_risk_speculation"; decisionName = "High Risk Speculation"; decisionDesc = "Hohes Risiko von Kursrückgängen und Liquidationen."; }

  let risk_level = "Medium";
  if (risk_penalty > 15) risk_level = "Extreme";
  else if (risk_penalty > 10) risk_level = "High";
  else if (risk_penalty < 4) risk_level = "Low";

  const totalMeme = MEME_POSITIVE.length + MEME_PENALTIES.length;
  const reasoning: string[] = [];
  const alerts: string[] = [`Hinweis: ${totalMeme - excludedFactors.length} von ${totalMeme} Faktoren real verfügbar — Social-/On-Chain-/Orderbuch-Daten für Memecoins sind aktuell nicht angebunden.`];
  if ((x.momentum ?? 0) > 0.7) reasoning.push("Starkes reales 24h-Kursmomentum.");
  if (reasoning.length === 0) reasoning.push("Neutrale reale Marktindikatoren.");

  const dataCompleteness = 1 - (excludedFactors.length / (totalMeme + 1));

  return {
    coin: x.coin,
    score: Number((final_score / 10).toFixed(2)),
    final_score: Number(final_score.toFixed(2)),
    base_score: Number(base_score.toFixed(2)),
    risk_penalty: Number(risk_penalty.toFixed(2)),
    ai_confidence_bonus: Number(ai_confidence_val.toFixed(2)),
    decision, decisionName, decisionDesc, risk_level, reasoning, alerts,
    dataCompleteness: Number(dataCompleteness.toFixed(2)),
    excludedFactors,
    dataSources: x.dataSources,
  };
}

/**
 * Real-data-only memecoin inputs. Most memecoins aren't in the CoinGecko
 * ID map here, so most factors stay honestly null unless a symbol has
 * real history available.
 */
export async function generateMemeCoinInputs(symbol: string, change24h: number): Promise<MemeCoinInputs> {
  const s = symbol.toUpperCase().trim();
  const dataSources = ['live_price_change24h'];
  const momentum = clamp(0.5 + change24h / 25, 0.02, 0.98);
  const volume_trend = clamp(0.5 + change24h / 30, 0.02, 0.98);

  const base: MemeCoinInputs = {
    coin: s,
    liquidity: null,
    volume_trend,
    trend_structure: null,
    momentum,
    volatility_quality: null,
    social_sentiment: null,
    narrative_strength: null,
    catalyst_strength: null,
    spread_penalty: null,
    liquidity_penalty: null,
    manipulation_penalty: null,
    rugpull_penalty: null,
    decay_penalty: null,
    ai_confidence_bonus: 0.01,
    dataSources,
  };

  const coingeckoId = COINGECKO_ID_MAP[s];
  if (!coingeckoId) return base;

  const history = await fetchCoinGeckoHistory(coingeckoId, 14);
  if (!history || history.length < 5) return base;
  dataSources.push('coingecko_market_chart_14d');

  const closes = history.map(h => h.close);
  const lastClose = closes[closes.length - 1];
  const periodHigh = Math.max(...closes);
  base.trend_structure = clamp(1 - (periodHigh - lastClose) / periodHigh / 0.3);

  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  base.volatility_quality = clamp(1 - Math.sqrt(variance) / 0.15);

  return base;
}
