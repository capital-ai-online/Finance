/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Audit ARCH-AUDIT-0002 (H1, Kapitel 14.5): reale Bewertungslogik fuer Aktien und Forex.
// Ersetzt den bisherigen Pfad in server.ts (calculateAssetScore, unterer Zweig): eine
// Momentum-Heuristik kombiniert mit getAssetPatternForSymbol() - einer hartkodierten
// Symbol->Chartmuster-Zuordnung mit einem Zeichen-Hash-Fallback fuer alle anderen Symbole
// (server.ts:359-370), die den Score um bis zu 45 von 100 Punkten verschiebt, OHNE dass ein
// echtes Muster in der Kurshistorie erkannt wurde. Dasselbe Grundproblem wie der P0-Befund
// beim Krypto-Scoring (AUD2-F-001), nur fuer eine andere Anlageklasse.
//
// Technische Faktoren (trend/momentum/breakout_quality/volatility_quality/relative_strength)
// werden wie beim Krypto-Scoring (cryptoScoringService.ts) aus assetRegistry.getHistory()
// berechnet - Wiederverwendung derselben Primitive aus realMarketSignals.ts. Fuer Aktien
// zusaetzlich reale Fundamentaldaten (KGV, Dividendenrendite, Nettomarge von Alpha Vantage
// OVERVIEW, server/stockFundamentals.ts) - fuer Forex nicht anwendbar (keine Unternehmens-
// bilanz), daher rein technisch bewertet. Indizes bleiben bewusst auf der alten Heuristik:
// es gibt fuer sie aktuell KEINE Live-Kursquelle ueberhaupt (alle ~30 Index-Symbole kommen
// permanent aus dem statischen FALLBACK_ASSETS-Snapshot, honest gekennzeichnet als
// dataSource:'fallback') - das ist eine fehlende Datenanbindung, keine Scoring-Formel-Frage,
// und damit ausserhalb des Umfangs dieser Aenderung (siehe Roadmap-Notiz in ADR/Audit-Report).
//
// Fehlt ein Faktor (keine reale Historie fuer dieses Symbol, keine Alpha-Vantage-Fundamental-
// daten verfuegbar/noch nicht gecacht), wird er ueber renormalizeAndScore() ausgeschlossen und
// sein Gewichtsanteil auf die vorhandenen Faktoren umgelegt - nie geschaetzt.

import {
  scoreTrend,
  scoreMomentum,
  scoreBreakout,
  scoreVolatility,
  computeReturnStats,
  computeRsi,
  renormalizeAndScore,
  clamp,
} from './realMarketSignals';
import { assetRegistry } from '../lib/assetRegistry';

export const STOCK_SCORING_WEIGHTS = {
  trend: 0.18,
  momentum: 0.14,
  breakout_quality: 0.10,
  volatility_quality: 0.10,
  relative_strength: 0.13,
  value: 0.15,
  dividend: 0.08,
  quality: 0.12,
} as const;

export const FX_SCORING_WEIGHTS = {
  trend: 0.30,
  momentum: 0.25,
  breakout_quality: 0.15,
  volatility_quality: 0.15,
  relative_strength: 0.15,
} as const;

export interface TraditionalAssetScoringInputs {
  symbol: string;
  assetType: 'stock' | 'forex' | 'index';
  trend?: number; // 0-1
  momentum?: number; // 0-1
  breakout_quality?: number; // 0-1
  volatility_quality?: number; // 0-1
  relative_strength?: number; // 0-1
  value?: number; // 0-1, nur Aktien
  dividend?: number; // 0-1, nur Aktien
  quality?: number; // 0-1, nur Aktien
}

export interface TraditionalAssetScoringResult {
  score: number; // 0-100
  usedFactors: string[];
  missingFactors: string[];
  reasoning: string[];
}

/**
 * KGV-basierter "Value"-Faktor (0-100): niedrigeres KGV = hoehere Punktzahl, im Sinne des
 * klassischen Value-Investing-Grundsatzes (vgl. das bereits vorhandene Feld "grahamScore" in
 * dieser Codebasis). Bewusst einfach monoton statt eines Optimal-KGV-Buckets - eine Kurve mit
 * einem "idealen" KGV-Peak waere eine zusaetzliche, schwerer zu rechtfertigende Annahme.
 * Referenzobergrenze 40 (KGV >= 40 => 0 Punkte) ist eine dokumentierte Vereinfachung, keine
 * finanzwissenschaftliche Konstante.
 */
export function scoreValue(peRatio: number): number {
  return clamp(100 - (peRatio / 40) * 100);
}

/** Dividendenrendite-Faktor (0-100). Referenzobergrenze 6% (>= 6% => 100 Punkte). */
export function scoreDividend(dividendYieldPct: number): number {
  return clamp((dividendYieldPct / 6) * 100);
}

/** Nettomarge-Faktor (0-100, Alpha-Vantage-Feld "ProfitMargin"). Referenzobergrenze 25%. */
export function scoreQuality(profitMarginPct: number): number {
  return clamp((profitMarginPct / 25) * 100);
}

export interface FundamentalsInput {
  peRatio?: number;
  dividendYieldPct?: number;
  profitMarginPct?: number;
}

/**
 * Reine Funktion: berechnet die technischen Faktoren aus einer bereits vorliegenden Reihe
 * echter Schlusskurse - unabhaengig davon, ob diese von assetRegistry.getHistory() (Stooq/
 * CoinGecko, client-sicher) oder einer serverseitigen Quelle wie FMP (server/fmpIndices.ts,
 * benoetigt einen API-Key und darf daher nicht in dieses client-gebuendelte Modul importiert
 * werden) stammen. Wiederverwendet von generateTraditionalAssetInputs() (Aktien/Forex) und
 * server.ts (Indizes, ARCH-AUDIT-0002 J1-Folge).
 */
export function computeTechnicalFactorsFromCloses(closes: number[]): Partial<TraditionalAssetScoringInputs> {
  const factors: Partial<TraditionalAssetScoringInputs> = {};
  const stats = computeReturnStats(closes);
  if (stats) {
    factors.trend = scoreTrend(stats.last, stats.sma) / 100;
    factors.momentum = scoreMomentum(stats.rocPct) / 100;
    factors.breakout_quality = scoreBreakout(stats.last, stats.high, stats.low) / 100;
    factors.volatility_quality = (100 - scoreVolatility(stats.dailyStdevPct)) / 100;
  }
  const rsi = computeRsi(closes);
  if (rsi !== undefined) factors.relative_strength = rsi / 100;
  return factors;
}

/**
 * Bezieht die technischen Faktoren aus assetRegistry.getHistory() (echte Kurshistorie via
 * CoinGecko/Stooq, je nach Anlageklasse) - identisches Muster wie
 * CryptoScoringService.generateCryptoInputs(). Fundamentaldaten (nur Aktien) werden vom
 * Aufrufer uebergeben, da deren Beschaffung (Alpha Vantage OVERVIEW, server/
 * stockFundamentals.ts) serverseitige Umgebungsvariablen benoetigt und dieses Modul auch
 * client-seitig gebuendelt wird (siehe CryptoScoringEnterprise.tsx-Praezedenzfall).
 */
export async function generateTraditionalAssetInputs(
  symbol: string,
  assetType: 'stock' | 'forex',
  fundamentals?: FundamentalsInput
): Promise<TraditionalAssetScoringInputs> {
  const s = symbol.toUpperCase().trim();
  const inputs: TraditionalAssetScoringInputs = { symbol: s, assetType };

  try {
    const history = await assetRegistry.getHistory(s, 30);
    if (history.source === 'live') {
      Object.assign(inputs, computeTechnicalFactorsFromCloses(history.points.map(p => p.close)));
    }
  } catch {
    // Keine echte Historie verfuegbar - alle historienbasierten Faktoren bleiben undefined.
  }

  if (assetType === 'stock' && fundamentals) {
    if (fundamentals.peRatio !== undefined) inputs.value = scoreValue(fundamentals.peRatio) / 100;
    if (fundamentals.dividendYieldPct !== undefined) inputs.dividend = scoreDividend(fundamentals.dividendYieldPct) / 100;
    if (fundamentals.profitMarginPct !== undefined) inputs.quality = scoreQuality(fundamentals.profitMarginPct) / 100;
  }

  return inputs;
}

/**
 * Analog zu generateTraditionalAssetInputs(), aber fuer Anlageklassen, deren Kurshistorie
 * NICHT ueber assetRegistry.getHistory() bezogen wird (aktuell: Indizes ueber FMP,
 * server/fmpIndices.ts, ARCH-AUDIT-0002 J1-Folge). Der Aufrufer liefert die bereits echte,
 * geordnete Schlusskursreihe direkt - kein Fundamentaldaten-Parameter, da Indizes keine
 * Unternehmensbilanz haben (rein technische Bewertung, wie Forex).
 */
export function generateTraditionalAssetInputsFromCloses(
  symbol: string,
  assetType: 'index',
  closes: number[]
): TraditionalAssetScoringInputs {
  const s = symbol.toUpperCase().trim();
  const inputs: TraditionalAssetScoringInputs = { symbol: s, assetType };
  if (closes.length >= 2) {
    Object.assign(inputs, computeTechnicalFactorsFromCloses(closes));
  }
  return inputs;
}

export class TraditionalAssetScoringService {
  public static scoreTraditionalAsset(inputs: TraditionalAssetScoringInputs): TraditionalAssetScoringResult {
    const weights = inputs.assetType === 'stock' ? STOCK_SCORING_WEIGHTS : FX_SCORING_WEIGHTS;
    const values: Record<string, number | undefined> = {
      trend: inputs.trend !== undefined ? inputs.trend * 100 : undefined,
      momentum: inputs.momentum !== undefined ? inputs.momentum * 100 : undefined,
      breakout_quality: inputs.breakout_quality !== undefined ? inputs.breakout_quality * 100 : undefined,
      volatility_quality: inputs.volatility_quality !== undefined ? inputs.volatility_quality * 100 : undefined,
      relative_strength: inputs.relative_strength !== undefined ? inputs.relative_strength * 100 : undefined,
    };
    if (inputs.assetType === 'stock') {
      values.value = inputs.value !== undefined ? inputs.value * 100 : undefined;
      values.dividend = inputs.dividend !== undefined ? inputs.dividend * 100 : undefined;
      values.quality = inputs.quality !== undefined ? inputs.quality * 100 : undefined;
    }

    const { score, usedFactors, missingFactors } = renormalizeAndScore(values, weights, new Set());

    const reasoning: string[] = [];
    if (usedFactors.length === 0) {
      reasoning.push('Keine reale Kurshistorie/Fundamentaldaten fuer dieses Symbol verfuegbar - Score ist 0.');
    } else {
      if ((inputs.trend ?? 0) > 0.7) reasoning.push('Starker technischer Aufwaertstrend (echte Kurshistorie).');
      if (inputs.assetType === 'stock' && (inputs.value ?? 0) > 0.7) reasoning.push('Guenstige Bewertung nach KGV (Alpha Vantage OVERVIEW).');
      if (missingFactors.length > 0) {
        reasoning.push(`Ohne reale Datenquelle fuer dieses Symbol: ${missingFactors.join(', ')} (Gewichtsanteil umgelegt).`);
      }
    }

    return { score: Number(score.toFixed(1)), usedFactors, missingFactors, reasoning };
  }
}
