import { assetRegistry } from '../lib/assetRegistry';
import type { CryptoScoringInputs } from '../types/crypto';
import type { CanonicalScoreResult } from '../types/scoringIntegrity';
import {
  computeReturnStats,
  computeRsi,
  scoreBreakout,
  scoreMomentum,
  scoreTrend,
  scoreVolatility,
} from './realMarketSignals';
import { CRYPTO_SCORING_WEIGHTS, CryptoScoringService } from './cryptoScoringService';
import {
  buildReadyScore,
  buildUnavailableScore,
  evaluateDataQualityGate,
} from './scoringIntegrity';

export interface VerifiedCryptoTechnicalAssessment {
  canonical: CanonicalScoreResult;
  inputs: CryptoScoringInputs;
  analysis: ReturnType<typeof CryptoScoringService.scoreCrypto> | null;
}

/** Normalize the two history formats currently emitted inside the repository. */
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

/**
 * Production-safe deterministic crypto scoring path.
 *
 * P0 intentionally stopped treating AssetRegistry bootstrap snapshots as evidence. The first
 * remediation implementation then left /api/crypto/score with only one evidenced factor
 * (`volatility`) while the data-quality gate still measured coverage against the full model.
 * That made normal assets such as ETH fail with SCORE_NOT_COMPUTABLE despite a real CoinGecko
 * history being available.
 *
 * This function fixes the contract mismatch without weakening the gate: all factors below are
 * derived exclusively from a live historical series. Registry snapshot fields such as market
 * cap, volume, supply, expected return and risk are deliberately not imported here because they
 * do not yet carry per-field provider provenance.
 */
export async function evaluateVerifiedCryptoTechnicalScore(
  symbol: string,
): Promise<VerifiedCryptoTechnicalAssessment> {
  const s = symbol.toUpperCase().trim();
  const history = await assetRegistry.getHistory(s, 30);
  const retrievedAt = new Date().toISOString();

  let inputs: CryptoScoringInputs = { coin: s };
  let observedAt: string | undefined;
  let evidence: Array<{
    id: string;
    source: string;
    observedAt: string;
    retrievedAt: string;
    kind: 'market-history';
  }> = [];

  if (history.source === 'live' && history.points.length > 0) {
    const closes = history.points.map((point) => point.close);
    const stats = computeReturnStats(closes);
    const rsi = computeRsi(closes);
    const lastPoint = history.points[history.points.length - 1];

    observedAt = normalizeHistoryDateToIso(lastPoint.date);
    if (observedAt) {
      evidence = [{
        id: `coingecko-history:${s}:${lastPoint.date}`,
        source: 'CoinGecko',
        observedAt,
        retrievedAt,
        kind: 'market-history',
      }];
    }

    if (stats) {
      inputs = {
        ...inputs,
        trend: scoreTrend(stats.last, stats.sma) / 100,
        momentum: scoreMomentum(stats.rocPct) / 100,
        volatility_quality: (100 - scoreVolatility(stats.dailyStdevPct)) / 100,
        breakout_quality: scoreBreakout(stats.last, stats.high, stats.low) / 100,
        // A live history is evidence that the history-backed part of the pipeline itself is
        // available. This is a data-availability signal, not a market-risk estimate.
        data_quality_risk: 0.05,
      };
    }

    if (rsi !== undefined) {
      inputs.relative_strength = rsi / 100;
    }
  }

  const values: Record<string, number | undefined> = {
    trend: inputs.trend !== undefined ? inputs.trend * 100 : undefined,
    momentum: inputs.momentum !== undefined ? inputs.momentum * 100 : undefined,
    volatility_quality: inputs.volatility_quality !== undefined ? inputs.volatility_quality * 100 : undefined,
    breakout_quality: inputs.breakout_quality !== undefined ? inputs.breakout_quality * 100 : undefined,
    relative_strength: inputs.relative_strength !== undefined ? inputs.relative_strength * 100 : undefined,
    avg_daily_volume: undefined,
    supply_dynamics: undefined,
    regime_bonus: undefined,
    data_quality_risk: inputs.data_quality_risk !== undefined ? inputs.data_quality_risk * 100 : undefined,
  };

  const gate = evaluateDataQualityGate({
    assetId: s,
    providers: history.source === 'live' ? ['CoinGecko'] : [],
    featureNames: Object.keys(CRYPTO_SCORING_WEIGHTS),
    values,
    evidence,
    observedAt,
    retrievedAt,
    // Six of nine canonical factors are history-backed. Requiring >= 50% keeps the endpoint
    // fail-closed while allowing a real technical score without inventing snapshot provenance.
    minimumCoverage: 0.5,
    minimumHistoryPoints: 20,
    historyPoints: history.source === 'live' ? history.points.length : 0,
    maxAgeMs: 4 * 24 * 60 * 60 * 1000,
    scoringVersion: 'crypto-technical-history/0.6.1',
  });

  if (!gate.ready) {
    return {
      canonical: buildUnavailableScore(gate),
      inputs,
      analysis: null,
    };
  }

  const analysis = CryptoScoringService.scoreCrypto(inputs, '0.6.1-verified-history');
  return {
    canonical: buildReadyScore(analysis.final_score, gate),
    inputs,
    analysis,
  };
}
