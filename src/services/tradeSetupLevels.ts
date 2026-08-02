/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReturnStats } from './realMarketSignals';

// Deterministische Ableitung einer Setup-Preisleiter (Entry-Zone, SL1/SL2, TP1/TP2) aus
// TATSAECHLICH verifizierten Kurshistorien-Kennzahlen (ReturnStats aus
// realMarketSignals.computeReturnStats() - dieselbe Datenquelle, die auch trend/momentum/
// breakout_quality/volatility_quality im 9-Faktor-Modell speist). Es wird kein zusaetzlicher
// Marktdaten-Call ausgefuehrt und kein Wert geschaetzt/erfunden - nur eine transparente,
// nachvollziehbare technische Strukturformel auf Basis von last/sma/high/low/dailyStdevPct.
//
// Methodik (Standard-Technikfeld, kein proprietaeres Geheimnis):
// - Richtung: 'long' wenn der letzte Kurs auf/ueber dem gleitenden Durchschnitt liegt
//   (identisch zur Trend-Faktor-Definition in scoreTrend()), sonst 'short'.
// - Entry-Zone: Band zwischen SMA und letztem Kurs (Rueckzug/Ruecksprung Richtung Mittelwert).
// - SL1/TP1: 1x taegliche Standardabweichung (in Preiseinheiten) ausserhalb der Entry-Zone
//   (volatilitaetsbasierter Nahbereich, analog einem 1-Sigma-/ATR-Band).
// - SL2/TP2: struktureller 30-Tage-Tiefst-/Hoechstwert aus derselben verifizierten Historie,
//   zusaetzlich durch ein 2x-Stdev-Band nach aussen begrenzt, damit SL2 nie enger als SL1 und
//   TP2 nie enger als TP1 liegt.
//
// Explizit KEINE Anlageberatung/Ausfuehrungsgarantie: Gebuehren, Slippage, Spread und Liquiditaet
// sind nicht eingerechnet (siehe auch EnterpriseAnalysisPanels Arbitrage-Radar-Disclaimer).

export type TradeSetupDirection = 'long' | 'short';

export interface TradeSetupLevels {
  direction: TradeSetupDirection;
  referencePrice: number;
  entryLow: number;
  entryHigh: number;
  stopLoss1: number;
  stopLoss2: number;
  takeProfit1: number;
  takeProfit2: number;
  volatilityAbs: number;
  volatilityPct: number;
  methodology: string;
}

export const TRADE_SETUP_METHODOLOGY_VERSION = 'trade-setup-levels/0.1.0' as const;

export function computeTradeSetupLevels(stats: ReturnStats): TradeSetupLevels {
  const { last, sma, high, low, dailyStdevPct } = stats;
  const volatilityAbs = Math.max(last * (dailyStdevPct / 100), last * 0.001);
  const direction: TradeSetupDirection = last >= sma ? 'long' : 'short';

  const entryLow = Math.min(last, sma);
  const entryHigh = Math.max(last, sma);

  const levels = direction === 'long'
    ? {
      stopLoss1: entryLow - volatilityAbs,
      stopLoss2: Math.min(low, entryLow - 2 * volatilityAbs),
      takeProfit1: entryHigh + volatilityAbs,
      takeProfit2: Math.max(high, entryHigh + 2 * volatilityAbs),
    }
    : {
      stopLoss1: entryHigh + volatilityAbs,
      stopLoss2: Math.max(high, entryHigh + 2 * volatilityAbs),
      takeProfit1: entryLow - volatilityAbs,
      takeProfit2: Math.min(low, entryLow - 2 * volatilityAbs),
    };

  return {
    direction,
    referencePrice: last,
    entryLow,
    entryHigh,
    ...levels,
    volatilityAbs,
    volatilityPct: dailyStdevPct,
    methodology: TRADE_SETUP_METHODOLOGY_VERSION,
  };
}
