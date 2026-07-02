export interface CryptoScoringInputs {
  coin: string;
  trend: number;                 // 0.0 to 1.0
  momentum: number;              // 0.0 to 1.0
  volatility_quality: number;    // 0.0 to 1.0
  breakout_quality: number;      // 0.0 to 1.0
  relative_strength: number;     // 0.0 to 1.0
  avg_daily_volume: number;      // 0.0 to 1.0
  spread: number;                // 0.0 to 1.0
  orderbook_depth: number;       // 0.0 to 1.0
  slippage_estimate: number;     // 0.0 to 1.0
  active_addresses: number;      // 0.0 to 1.0
  exchange_flows: number;        // 0.0 to 1.0
  whale_activity: number;        // 0.0 to 1.0
  supply_dynamics: number;       // 0.0 to 1.0
  social_velocity: number;       // 0.0 to 1.0
  narrative_strength: number;    // 0.0 to 1.0
  news_momentum: number;         // 0.0 to 1.0
  community_engagement: number;  // 0.0 to 1.0
  manipulation_risk: number;     // 0.0 to 1.0
  exchange_concentration: number;// 0.0 to 1.0
  rugpull_risk: number;          // 0.0 to 1.0
  data_quality_risk: number;     // 0.0 to 1.0
  ai_confidence: number;         // 0.0 to 1.0
  regime_bonus: number;          // 0.0 to 1.0
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
  const base_pos = 
    normalizeToScore(x.trend, SCORING_WEIGHTS.trend) +
    normalizeToScore(x.momentum, SCORING_WEIGHTS.momentum) +
    normalizeToScore(x.volatility_quality, SCORING_WEIGHTS.volatility_quality) +
    normalizeToScore(x.breakout_quality, SCORING_WEIGHTS.breakout_quality) +
    normalizeToScore(x.relative_strength, SCORING_WEIGHTS.relative_strength) +
    normalizeToScore(x.avg_daily_volume, SCORING_WEIGHTS.avg_daily_volume) +
    normalizeToScore(x.orderbook_depth, SCORING_WEIGHTS.orderbook_depth) +
    normalizeToScore(x.active_addresses, SCORING_WEIGHTS.active_addresses) +
    normalizeToScore(x.exchange_flows, SCORING_WEIGHTS.exchange_flows) +
    normalizeToScore(x.whale_activity, SCORING_WEIGHTS.whale_activity) +
    normalizeToScore(x.supply_dynamics, SCORING_WEIGHTS.supply_dynamics) +
    normalizeToScore(x.social_velocity, SCORING_WEIGHTS.social_velocity) +
    normalizeToScore(x.narrative_strength, SCORING_WEIGHTS.narrative_strength) +
    normalizeToScore(x.news_momentum, SCORING_WEIGHTS.news_momentum) +
    normalizeToScore(x.community_engagement, SCORING_WEIGHTS.community_engagement) +
    normalizeToScore(x.ai_confidence, SCORING_WEIGHTS.ai_confidence);

  const base_neg = 
    normalizeToScore(x.spread, SCORING_WEIGHTS.spread) +
    normalizeToScore(x.slippage_estimate, SCORING_WEIGHTS.slippage_estimate) +
    normalizeToScore(x.manipulation_risk, SCORING_WEIGHTS.manipulation_risk) +
    normalizeToScore(x.exchange_concentration, SCORING_WEIGHTS.exchange_concentration) +
    normalizeToScore(x.rugpull_risk, SCORING_WEIGHTS.rugpull_risk) +
    normalizeToScore(x.data_quality_risk, SCORING_WEIGHTS.data_quality_risk);

  const base_score = base_pos;
  const risk_penalty = base_neg;
  const regime_bonus_val = clamp(x.regime_bonus) * SCORING_WEIGHTS.regime_bonus * 10;
  
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

  // Risk tier and reasonings based on metrics
  let risk_level = "Medium";
  if (risk_penalty > 15) risk_level = "Extreme";
  else if (risk_penalty > 10) risk_level = "High";
  else if (risk_penalty < 4) risk_level = "Low";

  const reasoning: string[] = [];
  const alerts: string[] = [];

  if (x.trend > 0.7) reasoning.push("Starker technischer Aufwärtstrend vorhanden.");
  if (x.momentum > 0.7) reasoning.push("Hohes bullisches Momentum wird durch Marktvolumen bestätigt.");
  if (x.relative_strength > 0.7) reasoning.push("Überragende relative Stärke gegenüber dem breiten Markt.");
  if (x.avg_daily_volume > 0.7) reasoning.push("Hervorragende tägliche Liquidität unterstützt größere Positionen.");
  if (x.orderbook_depth > 0.7) reasoning.push("Geringe Marktauswirkung durch tiefe Orderbuch-Liquidität.");
  if (x.active_addresses > 0.7) reasoning.push("Sehr hohe On-Chain-Netzwerkaktivität deutet auf organische Nutzung hin.");
  if (x.whale_activity > 0.7) reasoning.push("Smart-Money-Akkumulation durch Wal-Aktivitäten bestätigt.");
  if (x.social_velocity > 0.7) reasoning.push("Starke Dynamik in den sozialen Netzwerken verzeichnet.");
  if (x.narrative_strength > 0.7) reasoning.push("Führende Rolle in einem stark trendenden Markt-Narrativ.");
  
  if (x.spread > 0.4) alerts.push("Warnung: Erhöhter Bid-Ask Spread kann Ausführungskosten treiben.");
  if (x.slippage_estimate > 0.4) alerts.push("Achtung: Erhöhte Slippage bei Marktorders zu erwarten.");
  if (x.manipulation_risk > 0.4) alerts.push("Risiko: Erhöhtes Manipulations- oder Wash-Trading-Risiko.");
  if (x.exchange_concentration > 0.4) alerts.push("Sicherheitsrisiko: Hohe Konzentration auf wenigen Krypto-Börsen.");
  if (x.rugpull_risk > 0.2) alerts.push("Kritisches Risiko: Signifikantes Rugpull- oder Smart-Contract-Risiko!");

  if (reasoning.length === 0) {
    reasoning.push("Neutrale Markt- und On-Chain-Entwicklung.");
  }

  return {
    coin: x.coin,
    score: Number((final_score / 10).toFixed(1)), // Keep 0-10 compatible score
    final_score: Number(final_score.toFixed(2)),
    base_score: Number(base_score.toFixed(2)),
    risk_penalty: Number(risk_penalty.toFixed(2)),
    regime_bonus: Number(regime_bonus_val.toFixed(2)),
    ai_confidence_bonus: Number((clamp(x.ai_confidence) * SCORING_WEIGHTS.ai_confidence * 10).toFixed(2)),
    decision,
    decisionName,
    decisionDesc,
    risk_level,
    reasoning,
    alerts
  };
}

export function generateCryptoInputs(symbol: string, change24h: number): CryptoScoringInputs {
  const s = symbol.toUpperCase().trim();
  // Generate beautiful, deterministic inputs based on the hash of symbol and actual change24h
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  const seed = (Math.abs(hash) % 100) / 100;

  // Let's seed indicators based on actual price movement (change24h)
  const momentumBase = clamp(0.5 + change24h / 15, 0.1, 0.95);
  const trendBase = clamp(0.5 + change24h / 25 + seed * 0.1, 0.15, 0.95);

  // Set individual properties based on symbol to make them super realistic and stable
  let trend = trendBase;
  let momentum = momentumBase;
  let volatility_quality = clamp(0.5 + (seed - 0.5) * 0.4);
  let breakout_quality = clamp(change24h > 4 ? 0.8 : 0.4 + seed * 0.3);
  let relative_strength = clamp(trendBase + (seed - 0.5) * 0.2);
  let avg_daily_volume = 0.5;
  let spread = 0.05;
  let orderbook_depth = 0.6;
  let slippage_estimate = 0.04;
  let active_addresses = clamp(0.5 + (seed - 0.3) * 0.4);
  let exchange_flows = clamp(0.5 + (0.5 - seed) * 0.3);
  let whale_activity = clamp(0.4 + seed * 0.4);
  let supply_dynamics = clamp(0.6 + (seed - 0.5) * 0.2);
  let social_velocity = clamp(momentumBase + (seed - 0.5) * 0.3);
  let narrative_strength = clamp(0.4 + seed * 0.5);
  let news_momentum = clamp(0.5 + change24h / 30);
  let community_engagement = clamp(0.5 + seed * 0.4);
  let manipulation_risk = clamp(0.1 + (1.0 - seed) * 0.2);
  let exchange_concentration = clamp(0.15 + seed * 0.2);
  let rugpull_risk = 0.02;
  let data_quality_risk = 0.01;
  let ai_confidence = clamp(0.6 + seed * 0.3);
  let regime_bonus = clamp(change24h > 1.5 ? 0.4 + seed * 0.3 : 0.2);

  // Fine-tune specific famous coins
  if (s === 'BTC') {
    avg_daily_volume = 0.98;
    spread = 0.01;
    orderbook_depth = 0.95;
    slippage_estimate = 0.01;
    active_addresses = 0.92;
    whale_activity = 0.85;
    manipulation_risk = 0.03;
    exchange_concentration = 0.08;
    rugpull_risk = 0.01;
    data_quality_risk = 0.01;
    narrative_strength = 0.95;
    community_engagement = 0.98;
  } else if (s === 'ETH') {
    avg_daily_volume = 0.88;
    spread = 0.02;
    orderbook_depth = 0.89;
    slippage_estimate = 0.02;
    active_addresses = 0.85;
    whale_activity = 0.78;
    manipulation_risk = 0.05;
    exchange_concentration = 0.12;
    rugpull_risk = 0.02;
    data_quality_risk = 0.01;
    narrative_strength = 0.90;
    community_engagement = 0.92;
  } else if (s === 'SOL') {
    avg_daily_volume = 0.82;
    spread = 0.04;
    orderbook_depth = 0.78;
    slippage_estimate = 0.05;
    active_addresses = 0.88;
    whale_activity = 0.72;
    manipulation_risk = 0.12;
    exchange_concentration = 0.22;
    rugpull_risk = 0.03;
    data_quality_risk = 0.02;
    narrative_strength = 0.92;
    community_engagement = 0.89;
  } else if (s === 'ADA') {
    avg_daily_volume = 0.55;
    spread = 0.08;
    orderbook_depth = 0.62;
    slippage_estimate = 0.09;
    active_addresses = 0.58;
    whale_activity = 0.54;
    manipulation_risk = 0.10;
    exchange_concentration = 0.18;
    rugpull_risk = 0.02;
    data_quality_risk = 0.01;
    narrative_strength = 0.55;
    community_engagement = 0.72;
  }

  return {
    coin: s,
    trend,
    momentum,
    volatility_quality,
    breakout_quality,
    relative_strength,
    avg_daily_volume,
    spread,
    orderbook_depth,
    slippage_estimate,
    active_addresses,
    exchange_flows,
    whale_activity,
    supply_dynamics,
    social_velocity,
    narrative_strength,
    news_momentum,
    community_engagement,
    manipulation_risk,
    exchange_concentration,
    rugpull_risk,
    data_quality_risk,
    ai_confidence,
    regime_bonus
  };
}

export interface MemeCoinInputs {
  coin: string;
  liquidity: number;            // 0.0 to 1.0
  volume_trend: number;         // 0.0 to 1.0
  trend_structure: number;      // 0.0 to 1.0
  momentum: number;             // 0.0 to 1.0
  volatility_quality: number;   // 0.0 to 1.0
  social_sentiment: number;     // 0.0 to 1.0
  narrative_strength: number;    // 0.0 to 1.0
  catalyst_strength: number;     // 0.0 to 1.0
  spread_penalty: number;        // 0.0 to 1.0
  liquidity_penalty: number;     // 0.0 to 1.0
  manipulation_penalty: number;  // 0.0 to 1.0
  rugpull_penalty: number;       // 0.0 to 1.0
  decay_penalty: number;         // 0.0 to 1.0
  ai_confidence_bonus: number;   // 0.0 to 0.05
}

export function calculateMemeCoinScore(x: MemeCoinInputs) {
  const base_score = (
    x.liquidity * 0.15 +
    x.volume_trend * 0.10 +
    x.trend_structure * 0.15 +
    x.momentum * 0.10 +
    x.volatility_quality * 0.10 +
    x.social_sentiment * 0.15 +
    x.narrative_strength * 0.10 +
    x.catalyst_strength * 0.10
  ) * 100;

  const risk_penalty = (
    x.spread_penalty +
    x.liquidity_penalty +
    x.manipulation_penalty +
    x.rugpull_penalty +
    x.decay_penalty
  ) * 100;

  const ai_confidence_val = x.ai_confidence_bonus * 100;
  
  const final_score = Math.max(0.0, Math.min(100.0, base_score - risk_penalty + ai_confidence_val));

  let decision = "reject";
  let decisionName = "Reject";
  let decisionDesc = "Ungenügendes Risiko-Profil. Hohe Wahrscheinlichkeit von Kapitalverlust.";

  if (final_score >= 90) {
    decision = "A_setup";
    decisionName = "A-Setup";
    decisionDesc = "Sehr starker Hype & gesicherte Liquidität. Exzellenter Einstieg.";
  } else if (final_score >= 80) {
    decision = "tradeable_watch";
    decisionName = "Tradeable Watch";
    decisionDesc = "Trendstarker Memecoin mit stabiler Handelsaktivität.";
  } else if (final_score >= 70) {
    decision = "speculative_watch";
    decisionName = "Speculative Watch";
    decisionDesc = "Narrativ stark, aber erhöhtes Risiko & Volatilität.";
  } else if (final_score >= 60) {
    decision = "high_risk_speculation";
    decisionName = "High Risk Speculation";
    decisionDesc = "Hohes Risiko von Kursrückgängen und Liquidationen.";
  } else {
    decision = "reject";
    decisionName = "Reject";
    decisionDesc = "Ungenügendes Risiko-Profil. Hohe Wahrscheinlichkeit von Kapitalverlust.";
  }

  let risk_level = "Medium";
  if (risk_penalty > 15) risk_level = "Extreme";
  else if (risk_penalty > 10) risk_level = "High";
  else if (risk_penalty < 4) risk_level = "Low";

  const reasoning: string[] = [];
  const alerts: string[] = [];

  if (x.liquidity > 0.7) reasoning.push("Solide Liquiditätstiefe verhindert extreme Slippage.");
  if (x.volume_trend > 0.7) reasoning.push("Bullisches Handelsvolumen-Wachstum über die letzten 24h.");
  if (x.trend_structure > 0.7) reasoning.push("Saubere technische Aufwärtsstruktur auf Mikro- und Makro-Ebene.");
  if (x.momentum > 0.7) reasoning.push("Extrem hohe Impulsgeschwindigkeit (RSI-Bestätigung).");
  if (x.social_sentiment > 0.7) reasoning.push("Massiver Social-Media-Hype & hohes Mention-Wachstum.");
  if (x.narrative_strength > 0.7) reasoning.push("Starkes, viral trendendes Meme-Narrativ.");
  if (x.catalyst_strength > 0.7) reasoning.push("Starker Katalysator (z.B. Exchange-Listing oder Influencer-Post) steht bevor.");

  if (x.spread_penalty > 0.04) alerts.push("Warnung: Erhöhter Bid-Ask Spread.");
  if (x.liquidity_penalty > 0.04) alerts.push("Achtung: Dünne Liquiditätsfenster detektiert.");
  if (x.manipulation_penalty > 0.04) alerts.push("Warnung: Signifikante Wash-Trading-Muster erkannt.");
  if (x.rugpull_penalty > 0.02) alerts.push("Kritisches Risiko: Anzeichen für Zentralisierung oder Rugpull-Gefahr!");
  if (x.decay_penalty > 0.04) alerts.push("Achtung: Hohes Decay-Risiko durch nachlassende Social-Media-Aktivität.");

  if (reasoning.length === 0) {
    reasoning.push("Neutrale Meme-Handelsindikatoren.");
  }

  return {
    coin: x.coin,
    score: Number((final_score / 10).toFixed(1)),
    final_score: Number(final_score.toFixed(2)),
    base_score: Number(base_score.toFixed(2)),
    risk_penalty: Number(risk_penalty.toFixed(2)),
    ai_confidence_bonus: Number(ai_confidence_val.toFixed(2)),
    decision,
    decisionName,
    decisionDesc,
    risk_level,
    reasoning,
    alerts
  };
}

export function generateMemeCoinInputs(symbol: string, change24h: number): MemeCoinInputs {
  const s = symbol.toUpperCase().trim();
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  const seed = (Math.abs(hash) % 100) / 100;

  const momentumBase = clamp(0.5 + change24h / 25, 0.1, 0.95);
  const socialBase = clamp(0.5 + change24h / 15 + seed * 0.1, 0.2, 0.95);

  let liquidity = clamp(0.4 + seed * 0.4);
  let volume_trend = clamp(momentumBase + (seed - 0.5) * 0.2);
  let trend_structure = clamp(0.3 + change24h / 30 + seed * 0.3);
  let momentum = momentumBase;
  let volatility_quality = clamp(0.3 + seed * 0.5);
  let social_sentiment = socialBase;
  let narrative_strength = clamp(0.5 + seed * 0.45);
  let catalyst_strength = clamp(0.2 + seed * 0.7);

  let spread_penalty = clamp(0.01 + (1.0 - seed) * 0.05);
  let liquidity_penalty = clamp(0.01 + (1.0 - seed) * 0.04);
  let manipulation_penalty = clamp(0.02 + seed * 0.06);
  let rugpull_penalty = clamp(0.01 + (1.0 - seed) * 0.03);
  let decay_penalty = clamp(0.02 + seed * 0.05);

  let ai_confidence_bonus = clamp(0.01 + seed * 0.04, 0.0, 0.05);

  // Custom configurations for well-known memes
  if (s === 'DOGE') {
    liquidity = 0.92;
    spread_penalty = 0.01;
    liquidity_penalty = 0.01;
    manipulation_penalty = 0.02;
    rugpull_penalty = 0.00;
    decay_penalty = 0.01;
    ai_confidence_bonus = 0.04;
    narrative_strength = 0.95;
  } else if (s === 'SHIB') {
    liquidity = 0.85;
    spread_penalty = 0.02;
    liquidity_penalty = 0.01;
    manipulation_penalty = 0.03;
    rugpull_penalty = 0.01;
    decay_penalty = 0.02;
    ai_confidence_bonus = 0.04;
    narrative_strength = 0.90;
  } else if (s === 'PEPE') {
    liquidity = 0.82;
    spread_penalty = 0.02;
    liquidity_penalty = 0.02;
    manipulation_penalty = 0.04;
    rugpull_penalty = 0.00;
    decay_penalty = 0.02;
    ai_confidence_bonus = 0.04;
    narrative_strength = 0.85;
  }

  return {
    coin: s,
    liquidity,
    volume_trend,
    trend_structure,
    momentum,
    volatility_quality,
    social_sentiment,
    narrative_strength,
    catalyst_strength,
    spread_penalty,
    liquidity_penalty,
    manipulation_penalty,
    rugpull_penalty,
    decay_penalty,
    ai_confidence_bonus
  };
}
