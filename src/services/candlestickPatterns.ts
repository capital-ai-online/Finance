/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Deterministische, klassische Candlestick-Formationserkennung auf Basis ECHTER OHLC-Kerzen
// (Open/High/Low/Close aus einer verifizierten Exchange-Kline-Quelle, z.B. Binance
// /api/v3/klines - dieselbe Art Rohdaten, die auch fuer die Ordertiefe in
// EnterpriseAnalysisPanels.tsx direkt browserseitig abgerufen wird). Keine Funktion hier
// erzeugt einen Wert aus dem Symbolnamen, einem Hash oder Math.random() - jede Formation wird
// ausschliesslich aus den tatsaechlich uebergebenen Kerzen berechnet. Die verwendeten
// Schwellenwerte (z.B. "unterer Docht >= 2x Kerzenkoerper" fuer Hammer) sind Standard-
// Definitionen aus der technischen Analyse (Nison, "Japanese Candlestick Charting Techniques"),
// keine proprietaere/erfundene Formel.
//
// Bewusste Einschraenkung: Hammer/Shooting Star werden hier rein anhand der Kerzenform (Shape-
// only) erkannt, ohne vorausgehenden Trendkontext zu pruefen (klassisch waere z.B. ein Hammer
// nur nach einem Abwaertstrend gueltig). Das ist eine dokumentierte Vereinfachung, keine
// Fabrikation - die Formation selbst ist real vorhanden, ihre Trendbestaetigung obliegt der
// Nutzerin/dem Nutzer.

export interface OhlcCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type PatternBias = 'bullish' | 'bearish' | 'neutral';

export interface DetectedPattern {
  name: string;
  bias: PatternBias;
  /** Wie viele der letzten Kerzen die Formation bildet (1-3). */
  candleCount: number;
}

function bodySize(c: OhlcCandle): number {
  return Math.abs(c.close - c.open);
}

function range(c: OhlcCandle): number {
  return Math.max(c.high - c.low, 0);
}

function isBullish(c: OhlcCandle): boolean {
  return c.close > c.open;
}

function isBearish(c: OhlcCandle): boolean {
  return c.close < c.open;
}

function upperWick(c: OhlcCandle): number {
  return c.high - Math.max(c.open, c.close);
}

function lowerWick(c: OhlcCandle): number {
  return Math.min(c.open, c.close) - c.low;
}

function isDoji(c: OhlcCandle): boolean {
  const r = range(c);
  return r > 0 && bodySize(c) / r <= 0.1;
}

function isBullishEngulfing(prev: OhlcCandle, curr: OhlcCandle): boolean {
  return isBearish(prev) && isBullish(curr)
    && curr.open <= prev.close && curr.close >= prev.open
    && bodySize(curr) > bodySize(prev);
}

function isBearishEngulfing(prev: OhlcCandle, curr: OhlcCandle): boolean {
  return isBullish(prev) && isBearish(curr)
    && curr.open >= prev.close && curr.close <= prev.open
    && bodySize(curr) > bodySize(prev);
}

function isHammer(c: OhlcCandle): boolean {
  const r = range(c);
  const body = bodySize(c);
  if (r <= 0 || body <= 0) return false;
  return lowerWick(c) >= 2 * body && upperWick(c) <= 0.5 * body && body / r <= 0.35;
}

function isShootingStar(c: OhlcCandle): boolean {
  const r = range(c);
  const body = bodySize(c);
  if (r <= 0 || body <= 0) return false;
  return upperWick(c) >= 2 * body && lowerWick(c) <= 0.5 * body && body / r <= 0.35;
}

function isMorningStar(c1: OhlcCandle, c2: OhlcCandle, c3: OhlcCandle): boolean {
  const midC1 = (c1.open + c1.close) / 2;
  return isBearish(c1) && bodySize(c1) > 0
    && bodySize(c2) < bodySize(c1) * 0.5
    && isBullish(c3) && c3.close >= midC1;
}

function isEveningStar(c1: OhlcCandle, c2: OhlcCandle, c3: OhlcCandle): boolean {
  const midC1 = (c1.open + c1.close) / 2;
  return isBullish(c1) && bodySize(c1) > 0
    && bodySize(c2) < bodySize(c1) * 0.5
    && isBearish(c3) && c3.close <= midC1;
}

/** "Entschieden": Kerzenkoerper macht den Grossteil der Handelsspanne aus (kleine Dochte). */
function isDecisive(c: OhlcCandle): boolean {
  const r = range(c);
  return r > 0 && bodySize(c) / r >= 0.6;
}

function isThreeWhiteSoldiers(c1: OhlcCandle, c2: OhlcCandle, c3: OhlcCandle): boolean {
  return [c1, c2, c3].every((c) => isBullish(c) && isDecisive(c))
    && c2.open >= c1.open && c2.open <= c1.close && c2.close > c1.close
    && c3.open >= c2.open && c3.open <= c2.close && c3.close > c2.close;
}

function isThreeBlackCrows(c1: OhlcCandle, c2: OhlcCandle, c3: OhlcCandle): boolean {
  return [c1, c2, c3].every((c) => isBearish(c) && isDecisive(c))
    && c2.open <= c1.open && c2.open >= c1.close && c2.close < c1.close
    && c3.open <= c2.open && c3.open >= c2.close && c3.close < c2.close;
}

/**
 * Prueft, welche klassischen Formationen exakt auf der letzten Kerze der uebergebenen Serie
 * enden (= "aktuell aktives Muster"). Erfordert je nach Formation 1-3 Kerzen Lookback.
 */
export function detectActivePatterns(candles: OhlcCandle[]): DetectedPattern[] {
  const n = candles.length;
  if (n === 0) return [];
  const last = candles[n - 1];
  const found: DetectedPattern[] = [];

  if (isDoji(last)) found.push({ name: 'Doji', bias: 'neutral', candleCount: 1 });
  if (isHammer(last)) found.push({ name: 'Hammer', bias: 'bullish', candleCount: 1 });
  if (isShootingStar(last)) found.push({ name: 'Shooting Star', bias: 'bearish', candleCount: 1 });

  if (n >= 2) {
    const prev = candles[n - 2];
    if (isBullishEngulfing(prev, last)) found.push({ name: 'Bullish Engulfing', bias: 'bullish', candleCount: 2 });
    if (isBearishEngulfing(prev, last)) found.push({ name: 'Bearish Engulfing', bias: 'bearish', candleCount: 2 });
  }

  if (n >= 3) {
    const c1 = candles[n - 3];
    const c2 = candles[n - 2];
    if (isMorningStar(c1, c2, last)) found.push({ name: 'Morning Star', bias: 'bullish', candleCount: 3 });
    if (isEveningStar(c1, c2, last)) found.push({ name: 'Evening Star', bias: 'bearish', candleCount: 3 });
    if (isThreeWhiteSoldiers(c1, c2, last)) found.push({ name: 'Three White Soldiers', bias: 'bullish', candleCount: 3 });
    if (isThreeBlackCrows(c1, c2, last)) found.push({ name: 'Three Black Crows', bias: 'bearish', candleCount: 3 });
  }

  return found;
}
