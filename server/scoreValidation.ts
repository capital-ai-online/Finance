// ARCH-AUDIT-0002 (N1, Kapitel 14.4) - Rueckwirkende Validierung der Scoring-Engines
// gegen realisierte Wertentwicklung. Vor N1 gab es keine Historisierung, welcher Score
// wann fuer welches Asset ausgegeben wurde - eine Trefferquote/Falsch-Positiv-Rate war
// damit grundsaetzlich nicht bezifferbar, nur behauptbar.
//
// Methodik (bewusst offengelegt, keine Blackbox-Kennzahl):
// 1. recordDailySnapshots() speichert einmal je Symbol und Kalendertag (UTC) den zu diesem
//    Zeitpunkt ausgegebenen Score, dessen scoreBasis (siehe getScoreBasis() in server.ts)
//    und den realen Marktpreis (score_snapshots-Tabelle, supabase/migrations/
//    20260801143614_score_snapshots.sql).
// 2. evaluateScoreValidation(horizonDays, threshold) vergleicht ausreichend alte Snapshots
//    (mindestens horizonDays zurueckliegend) mit dem AKTUELLEN Preis aus der AssetRegistry.
//    Das ist eine bewusste Vereinfachung: die realisierte Rendite misst die Zeitspanne vom
//    Snapshot bis JETZT, nicht exakt bis Snapshot+horizonDays - bei aelteren Snapshots kann
//    das laenger als horizonDays sein. Alternative waere ein Preis exakt horizonDays nach dem
//    Snapshot aus der historischen Kursreihe; das wuerde die Auswertung praeziser machen,
//    ist aber ein separater Ausbauschritt (mehr Historie-Abfragen pro Auswertung). Bis dahin
//    ist die aktuelle Methodik ehrlich als das ausgewiesen, was sie ist - kein erfundener
//    Praezisionsanspruch.
// 3. "Trefferquote" = Anteil der als positiv eingestuften Assets (score >= threshold), deren
//    realisierte Rendite tatsaechlich positiv war. "Falsch-Positiv-Rate" = Gegenteil davon.
//    Aufschluesselung zusaetzlich nach scoreBasis, weil 'market-data'-Scores (S1/S2/S5) und
//    'heuristic'-Scores (S6) grundsaetzlich unterschiedliche Aussagekraft haben und eine
//    gemeinsame Kennzahl das verschleiern wuerde.

import express from 'express';
import { getServerSupabase, isSupabaseConfigured } from './db';
import { assetRegistry } from '../src/lib/assetRegistry';
import { checkAdminAccess } from './iam/authMiddleware';
import { ADMIN_ZONE_ROLES } from './iam/types';

export interface SnapshotInput {
  symbol: string;
  assetType: string;
  score: number;
  scoreBasis?: string;
  price: number;
}

/**
 * Speichert einen Snapshot je Asset fuer den heutigen Kalendertag (UTC). Bereits
 * vorhandene Eintraege fuer denselben Tag werden NICHT ueberschrieben (ignoreDuplicates) -
 * der erste am Tag aufgezeichnete Score/Preis bleibt massgeblich, damit spaetere
 * Cache-Refreshes am selben Tag die Auswertung nicht verwaessern. Best-effort: ein
 * Fehler hier darf den aufrufenden Request (z.B. /api/market-data) nicht scheitern lassen.
 */
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
    if (error) {
      console.warn('[ScoreValidation] Snapshot-Aufzeichnung fehlgeschlagen:', error.message);
    }
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
  /** undefined, wenn keine als positiv eingestuften Faelle in der Stichprobe vorliegen. */
  hitRatePct?: number;
  falsePositiveRatePct?: number;
  insufficientData: boolean;
}

const MIN_SAMPLE_SIZE = 5;

interface Agg { tp: number; fp: number; tn: number; fn: number; n: number; }

function emptyAgg(): Agg {
  return { tp: 0, fp: 0, tn: 0, fn: 0, n: 0 };
}

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

/**
 * @param horizonDays Mindestalter der einbezogenen Snapshots in Tagen.
 * @param threshold Score-Schwelle (0-10-Skala, wie Asset.score) fuer "positiv eingestuft".
 */
export async function evaluateScoreValidation(horizonDays: number, threshold: number): Promise<ScoreValidationResult> {
  const emptyOverall = toBucketResult('all', horizonDays, threshold, emptyAgg());
  if (!isSupabaseConfigured()) {
    return { overall: emptyOverall, byScoreBasis: {} };
  }

  const cutoffDate = new Date(Date.now() - horizonDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('score_snapshots')
    .select('symbol, score, score_basis, price, snapshot_date')
    .lte('snapshot_date', cutoffDate);

  if (error || !data) {
    return { overall: emptyOverall, byScoreBasis: {} };
  }

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
  for (const [basis, agg] of Object.entries(basisAggs)) {
    byScoreBasis[basis] = toBucketResult(basis, horizonDays, threshold, agg);
  }

  return { overall: toBucketResult('all', horizonDays, threshold, overallAgg), byScoreBasis };
}

export const scoreValidationRouter = express.Router();

scoreValidationRouter.get('/validation', async (req, res) => {
  const authz = await checkAdminAccess(req, 'scoring:validation', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  const horizonDays = Math.max(1, Math.min(365, Number(req.query.horizonDays) || 30));
  const threshold = Math.max(0, Math.min(10, Number(req.query.threshold) || 6.5));
  const result = await evaluateScoreValidation(horizonDays, threshold);
  res.json(result);
});
