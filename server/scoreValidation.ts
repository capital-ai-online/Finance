// ARCH-AUDIT-0002 (N1, Kapitel 14.4) - Rueckwirkende Validierung der Scoring-Engines.
// Legacy validation remains temporarily available for compatibility. New enterprise-grade
// validation must use mode=horizon-exact so realized returns are derived from verified
// historical provider evidence at snapshotDate + horizonDays rather than a current registry price.

import express from 'express';
import { getServerSupabase, isSupabaseConfigured } from './db';
import { assetRegistry } from '../src/lib/assetRegistry';
import { checkAdminAccess } from '../src/platform/Security/authMiddleware';
import { ADMIN_ZONE_ROLES } from '../src/platform/Security/types';
import { calibrateScoreConfidence } from '../src/services/scoreConfidenceCalibration';
import { recordScoreConfidenceEvidence } from '../src/services/scoreConfidenceEvidence';
import { evaluateHorizonExactScoreValidation, type HorizonExactValidationSnapshot } from '../src/services/horizonExactScoreValidation';
import { resolveHorizonValidationEvidence } from '../src/services/horizonValidationProvider';
import type { ExternalHistoryAssetClass } from '../src/services/externalMarketDataAdapters';

export interface SnapshotInput {
  symbol: string;
  assetType: string;
  score: number;
  scoreBasis?: string;
  price: number;
}

export async function recordDailySnapshots(assets: SnapshotInput[]): Promise<void> {
  if (!isSupabaseConfigured() || assets.length === 0) return;

  const today = new Date().toISOString().slice(0, 10);
  const rows = assets
    .filter(a => a.symbol && Number.isFinite(a.score) && Number.isFinite(a.price) && a.price > 0)
    .map(a => ({
      symbol: a.symbol.toUpperCase().trim(),
      asset_type: a.assetType,
      score: a.score,
      score_basis: a.scoreBasis ?? null,
      price: a.price,
      snapshot_date: today,
    }));
  if (rows.length === 0) return;

  try {
    const supabase = getServerSupabase();
    const { error } = await supabase
      .from('score_snapshots')
      .upsert(rows, { onConflict: 'symbol,snapshot_date', ignoreDuplicates: true });
    if (error) console.warn('[ScoreValidation] Snapshot-Aufzeichnung fehlgeschlagen:', error.message);
  } catch (err: any) {
    console.warn('[ScoreValidation] Snapshot-Aufzeichnung fehlgeschlagen:', err?.message || err);
  }
}

export interface ValidationBucket {
  scoreBasis: string;
  horizonDays: number;
  threshold: number;
  sampleSize: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  hitRatePct?: number;
  falsePositiveRatePct?: number;
  insufficientData: boolean;
}

const MIN_SAMPLE_SIZE = 5;
interface Agg { tp: number; fp: number; tn: number; fn: number; n: number; }
function emptyAgg(): Agg { return { tp: 0, fp: 0, tn: 0, fn: 0, n: 0 }; }

function toBucketResult(scoreBasis: string, horizonDays: number, threshold: number, agg: Agg): ValidationBucket {
  const predictedPositiveCount = agg.tp + agg.fp;
  return {
    scoreBasis,
    horizonDays,
    threshold,
    sampleSize: agg.n,
    truePositives: agg.tp,
    falsePositives: agg.fp,
    trueNegatives: agg.tn,
    falseNegatives: agg.fn,
    hitRatePct: predictedPositiveCount > 0 ? Number(((agg.tp / predictedPositiveCount) * 100).toFixed(1)) : undefined,
    falsePositiveRatePct: predictedPositiveCount > 0 ? Number(((agg.fp / predictedPositiveCount) * 100).toFixed(1)) : undefined,
    insufficientData: agg.n < MIN_SAMPLE_SIZE,
  };
}

export interface ScoreValidationResult {
  overall: ValidationBucket;
  byScoreBasis: Record<string, ValidationBucket>;
}

/** Legacy compatibility path. It is explicitly not horizon-exact. */
export async function evaluateScoreValidation(horizonDays: number, threshold: number): Promise<ScoreValidationResult> {
  const emptyOverall = toBucketResult('all', horizonDays, threshold, emptyAgg());
  if (!isSupabaseConfigured()) return { overall: emptyOverall, byScoreBasis: {} };

  const cutoffDate = new Date(Date.now() - horizonDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('score_snapshots')
    .select('symbol, score, score_basis, price, snapshot_date')
    .lte('snapshot_date', cutoffDate);
  if (error || !data) return { overall: emptyOverall, byScoreBasis: {} };

  const overallAgg = emptyAgg();
  const basisAggs: Record<string, Agg> = {};
  for (const row of data as Array<{ symbol: string; score: number; score_basis: string | null; price: number }>) {
    const currentAsset = assetRegistry.getAsset(row.symbol);
    if (!currentAsset || !Number.isFinite(currentAsset.price) || currentAsset.price <= 0) continue;
    const realizedReturnPct = ((currentAsset.price - row.price) / row.price) * 100;
    const predictedPositive = row.score >= threshold;
    const actualPositive = realizedReturnPct > 0;
    const bump = (agg: Agg) => {
      agg.n += 1;
      if (predictedPositive && actualPositive) agg.tp += 1;
      else if (predictedPositive && !actualPositive) agg.fp += 1;
      else if (!predictedPositive && actualPositive) agg.fn += 1;
      else agg.tn += 1;
    };
    bump(overallAgg);
    const basisKey = row.score_basis || 'unbekannt';
    if (!basisAggs[basisKey]) basisAggs[basisKey] = emptyAgg();
    bump(basisAggs[basisKey]);
  }

  const byScoreBasis: Record<string, ValidationBucket> = {};
  for (const [basis, agg] of Object.entries(basisAggs)) byScoreBasis[basis] = toBucketResult(basis, horizonDays, threshold, agg);
  return { overall: toBucketResult('all', horizonDays, threshold, overallAgg), byScoreBasis };
}

function isSupportedHistoryAssetClass(value: string): value is ExternalHistoryAssetClass {
  return value === 'crypto' || value === 'stock' || value === 'forex' || value === 'index';
}

async function loadHorizonExactSnapshots(horizonDays: number, maxSnapshots: number): Promise<HorizonExactValidationSnapshot[]> {
  if (!isSupabaseConfigured()) return [];
  const cutoffDate = new Date(Date.now() - horizonDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('score_snapshots')
    .select('symbol, asset_type, score, score_basis, price, snapshot_date')
    .lte('snapshot_date', cutoffDate)
    .order('snapshot_date', { ascending: false })
    .limit(maxSnapshots);
  if (error || !data) return [];

  return (data as Array<{ symbol: string; asset_type: string; score: number; score_basis: string | null; price: number; snapshot_date: string }>)
    .filter(row => isSupportedHistoryAssetClass(row.asset_type) && Number.isFinite(row.price) && row.price > 0 && Number.isFinite(row.score))
    .map(row => ({
      symbol: row.symbol,
      assetClass: row.asset_type as ExternalHistoryAssetClass,
      snapshotDate: `${row.snapshot_date}T00:00:00.000Z`,
      snapshotPrice: row.price,
      score: row.score,
      scoreBasis: row.score_basis || 'unbekannt',
    }));
}

export const scoreValidationRouter = express.Router();

scoreValidationRouter.get('/validation', async (req, res) => {
  const authz = await checkAdminAccess(req, 'scoring:validation', ADMIN_ZONE_ROLES);
  if (!authz.authorized) return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });

  const horizonDays = Math.max(1, Math.min(365, Number(req.query.horizonDays) || 30));
  const threshold = Math.max(0, Math.min(10, Number(req.query.threshold) || 6.5));
  const minimumConfidenceSample = Math.max(5, Math.min(1000, Number(req.query.minimumConfidenceSample) || 30));
  const mode = req.query.mode === 'horizon-exact' ? 'horizon-exact' : 'legacy-current-price';

  if (mode === 'horizon-exact') {
    const maxSnapshots = Math.max(1, Math.min(50, Number(req.query.maxSnapshots) || 10));
    const maxProvidersPerSnapshot = Math.max(1, Math.min(3, Number(req.query.maxProvidersPerSnapshot) || 1));
    const snapshots = await loadHorizonExactSnapshots(horizonDays, maxSnapshots);
    const exact = await evaluateHorizonExactScoreValidation({
      snapshots,
      horizonDays,
      threshold,
      minimumEvaluated: MIN_SAMPLE_SIZE,
      resolveEvidence: (snapshot, horizon) => resolveHorizonValidationEvidence({
        symbol: snapshot.symbol,
        assetClass: snapshot.assetClass,
        snapshotDate: snapshot.snapshotDate,
        horizonDays: horizon,
      }, {
        maxProvidersPerSnapshot,
        stopAfterFirstReady: true,
      }),
    });
    const confidence = calibrateScoreConfidence({
      sampleSize: exact.overall.evaluated,
      hitRatePct: exact.overall.hitRatePct ?? undefined,
      falsePositiveRatePct: exact.overall.falsePositiveRatePct ?? undefined,
      insufficientData: exact.status !== 'READY',
    }, minimumConfidenceSample);
    const confidenceEvidence = recordScoreConfidenceEvidence({ calibration: confidence, horizonDays, threshold, scoreBasis: 'all' });

    return res.json({
      mode,
      ...exact,
      confidence,
      confidenceEvidence,
      requestBudget: {
        maxSnapshots,
        maxProvidersPerSnapshot,
        maximumExternalProviderRequests: maxSnapshots * maxProvidersPerSnapshot,
        stopAfterFirstReady: true,
      },
      confidencePolicy: {
        empiricalOnly: true,
        minimumSample: minimumConfidenceSample,
        scoreImpactEnabled: false,
        recommendationImpactEnabled: false,
        methodologyLimitation: 'Only snapshots with verified provider-backed historical evidence inside the configured horizon window are evaluated. Missing evidence is skipped, never interpolated or replaced.',
      },
    });
  }

  const result = await evaluateScoreValidation(horizonDays, threshold);
  const confidence = calibrateScoreConfidence(result.overall, minimumConfidenceSample);
  const confidenceEvidence = recordScoreConfidenceEvidence({ calibration: confidence, horizonDays, threshold, scoreBasis: 'all' });
  return res.json({
    mode,
    ...result,
    confidence,
    confidenceEvidence,
    confidencePolicy: {
      empiricalOnly: true,
      minimumSample: minimumConfidenceSample,
      scoreImpactEnabled: false,
      recommendationImpactEnabled: false,
      methodologyLimitation: 'Legacy compatibility mode compares historical snapshots with the current AssetRegistry price and must not be interpreted as horizon-exact or execution-grade probability. Use mode=horizon-exact for provider-backed validation.',
    },
  });
});
