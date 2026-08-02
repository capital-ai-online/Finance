import type { CryptoScoringInputs } from '../types/crypto';
import type { CanonicalScoreResult, ScoringEvidenceRef } from '../types/scoringIntegrity';
import {
  computeReturnStats,
  computeRsi,
  scoreBreakout,
  scoreLiquidity,
  scoreMomentum,
  scoreTokenomics,
  scoreTrend,
  scoreVolatility,
} from './realMarketSignals';
import { CRYPTO_SCORING_WEIGHTS, CryptoScoringService } from './cryptoScoringService';
import {
  buildReadyScore,
  buildUnavailableScore,
  evaluateDataQualityGate,
} from './scoringIntegrity';
import {
  getVerifiedCryptoHistory,
  type VerifiedCryptoHistory,
} from './cryptoHistoryProvider';
import {
  getVerifiedCryptoSnapshot,
  type VerifiedCryptoSnapshot,
  type VerifiedFieldProvenance,
} from './cryptoSnapshotProvider';

export interface VerifiedCryptoTechnicalAssessment {
  canonical: CanonicalScoreResult;
  inputs: CryptoScoringInputs;
  analysis: ReturnType<typeof CryptoScoringService.scoreCrypto> | null;
  fieldProvenance: VerifiedFieldProvenance[];
  rankingEvidenceReady: boolean;
  providerState?: {
    history?: { cacheMode: VerifiedCryptoHistory['cacheMode']; degraded: boolean };
    snapshot?: { cacheMode: VerifiedCryptoSnapshot['cacheMode']; degraded: boolean };
  };
}

export interface VerifiedCryptoTechnicalScoringOptions {
  historyProvider?: (symbol: string, days?: number) => Promise<VerifiedCryptoHistory | null>;
  snapshotProvider?: (symbol: string) => Promise<VerifiedCryptoSnapshot | null>;
}

/** Normalize history dates at the scoring boundary. */
export function normalizeHistoryDateToIso(rawDate: string): string | undefined {
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    const value = Date.parse(`${rawDate}T00:00:00.000Z`);
    return Number.isFinite(value) ? new Date(value).toISOString() : undefined;
  }

  const shortMatch = /^(\d{2})\.(\d{2})\.(\d{2})$/.exec(rawDate);
  if (shortMatch) {
    const [, dd, mm, yy] = shortMatch;
    const year = 2000 + Number(yy);
    const value = Date.UTC(year, Number(mm) - 1, Number(dd));
    return Number.isFinite(value) ? new Date(value).toISOString() : undefined;
  }

  return undefined;
}

function oldestIso(values: Array<string | undefined>): string | undefined {
  const parsed = values
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ value, time: Date.parse(value) }))
    .filter((entry) => Number.isFinite(entry.time));
  if (parsed.length === 0) return undefined;
  parsed.sort((a, b) => a.time - b.time);
  return parsed[0].value;
}

function snapshotEvidence(snapshot: VerifiedCryptoSnapshot | null): ScoringEvidenceRef[] {
  if (!snapshot) return [];
  return Object.values(snapshot.provenance)
    .filter((item): item is VerifiedFieldProvenance => Boolean(item))
    .map((item) => ({
      id: `coingecko-snapshot:${snapshot.symbol}:${item.field}:${item.observedAt}`,
      source: item.provider,
      observedAt: item.observedAt,
      retrievedAt: item.retrievedAt,
      kind: 'market-snapshot' as const,
    }));
}

/**
 * Production-safe deterministic crypto scoring path.
 *
 * History factors come only from the verified history provider. Market-cap/volume/supply
 * factors come only from the verified snapshot provider and carry per-field provenance.
 * AssetRegistry bootstrap values and simulated observations are never accepted as evidence.
 */
export async function evaluateVerifiedCryptoTechnicalScore(
  symbol: string,
  options: VerifiedCryptoTechnicalScoringOptions = {},
): Promise<VerifiedCryptoTechnicalAssessment> {
  const s = symbol.toUpperCase().trim();
  const historyProvider = options.historyProvider ?? getVerifiedCryptoHistory;
  const snapshotProvider = options.snapshotProvider ?? getVerifiedCryptoSnapshot;
  const [history, snapshot] = await Promise.all([
    historyProvider(s, 30),
    snapshotProvider(s),
  ]);

  const retrievedAt = oldestIso([history?.retrievedAt, snapshot?.retrievedAt]) ?? new Date().toISOString();
  let inputs: CryptoScoringInputs = { coin: s };
  let historyObservedAt: string | undefined;
  const evidence: ScoringEvidenceRef[] = [];

  if (history && history.points.length > 0) {
    const closes = history.points.map((point) => point.close);
    const stats = computeReturnStats(closes);
    const rsi = computeRsi(closes);
    const lastPoint = history.points[history.points.length - 1];

    historyObservedAt = normalizeHistoryDateToIso(lastPoint.date);
    if (historyObservedAt) {
      evidence.push({
        id: `coingecko-history:${s}:${lastPoint.date}`,
        source: history.provider,
        observedAt: historyObservedAt,
        retrievedAt: history.retrievedAt,
        kind: 'market-history',
      });
    }

    if (stats) {
      inputs = {
        ...inputs,
        trend: scoreTrend(stats.last, stats.sma) / 100,
        momentum: scoreMomentum(stats.rocPct) / 100,
        volatility_quality: (100 - scoreVolatility(stats.dailyStdevPct)) / 100,
        breakout_quality: scoreBreakout(stats.last, stats.high, stats.low) / 100,
        data_quality_risk: history.degraded ? 0.15 : 0.05,
      };
    }
    if (rsi !== undefined) inputs.relative_strength = rsi / 100;
  }

  const fieldProvenance = snapshot
    ? Object.values(snapshot.provenance).filter((item): item is VerifiedFieldProvenance => Boolean(item))
    : [];
  evidence.push(...snapshotEvidence(snapshot));

  if (snapshot?.marketCapUsd && snapshot?.volume24hUsd) {
    const liquidity = scoreLiquidity(snapshot.volume24hUsd, snapshot.marketCapUsd);
    if (liquidity !== undefined) inputs.avg_daily_volume = liquidity / 100;
  }
  if (snapshot?.circulatingSupply && snapshot.maxSupply) {
    const tokenomics = scoreTokenomics(snapshot.circulatingSupply, snapshot.maxSupply);
    if (tokenomics !== undefined) inputs.supply_dynamics = tokenomics / 100;
  }

  const rankingEvidenceReady = Boolean(
    snapshot?.provenance.marketCapUsd
      && snapshot?.provenance.volume24hUsd
      && snapshot?.provenance.circulatingSupply
      && (snapshot?.provenance.maxSupply || snapshot?.provenance.totalSupply)
      && inputs.avg_daily_volume !== undefined,
  );

  const values: Record<string, number | undefined> = {
    trend: inputs.trend !== undefined ? inputs.trend * 100 : undefined,
    momentum: inputs.momentum !== undefined ? inputs.momentum * 100 : undefined,
    volatility_quality: inputs.volatility_quality !== undefined ? inputs.volatility_quality * 100 : undefined,
    breakout_quality: inputs.breakout_quality !== undefined ? inputs.breakout_quality * 100 : undefined,
    relative_strength: inputs.relative_strength !== undefined ? inputs.relative_strength * 100 : undefined,
    avg_daily_volume: inputs.avg_daily_volume !== undefined ? inputs.avg_daily_volume * 100 : undefined,
    supply_dynamics: inputs.supply_dynamics !== undefined ? inputs.supply_dynamics * 100 : undefined,
    regime_bonus: undefined,
    data_quality_risk: inputs.data_quality_risk !== undefined ? inputs.data_quality_risk * 100 : undefined,
  };

  const providers = Array.from(new Set([
    ...(history ? [history.provider] : []),
    ...(snapshot ? [snapshot.provider] : []),
  ]));
  const observedAt = oldestIso([
    historyObservedAt,
    snapshot && fieldProvenance.length > 0 ? snapshot.observedAt : undefined,
  ]);

  const gate = evaluateDataQualityGate({
    assetId: s,
    providers,
    featureNames: Object.keys(CRYPTO_SCORING_WEIGHTS),
    values,
    evidence,
    observedAt,
    retrievedAt,
    minimumCoverage: 0.5,
    minimumHistoryPoints: 20,
    historyPoints: history?.points.length ?? 0,
    maxAgeMs: 4 * 24 * 60 * 60 * 1000,
    scoringVersion: 'crypto-technical-provenance/0.6.2',
  });

  const providerState = {
    history: history ? { cacheMode: history.cacheMode, degraded: history.degraded } : undefined,
    snapshot: snapshot ? { cacheMode: snapshot.cacheMode, degraded: snapshot.degraded } : undefined,
  };

  if (!gate.ready) {
    return {
      canonical: buildUnavailableScore(gate),
      inputs,
      analysis: null,
      fieldProvenance,
      rankingEvidenceReady,
      providerState,
    };
  }

  const analysis = CryptoScoringService.scoreCrypto(inputs, '0.6.2-verified-provenance');
  return {
    canonical: buildReadyScore(analysis.final_score, gate),
    inputs,
    analysis,
    fieldProvenance,
    rankingEvidenceReady,
    providerState,
  };
}
