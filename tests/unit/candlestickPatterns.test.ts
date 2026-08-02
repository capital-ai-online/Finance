import { describe, it, expect } from 'vitest';
import { detectActivePatterns, type OhlcCandle } from '../../src/services/candlestickPatterns';

function candle(time: number, open: number, high: number, low: number, close: number): OhlcCandle {
  return { time, open, high, low, close };
}

function names(candles: OhlcCandle[]): string[] {
  return detectActivePatterns(candles).map((p) => p.name);
}

describe('candlestickPatterns.detectActivePatterns', () => {
  it('erkennt keine Formation auf einer neutralen, unauffaelligen Serie', () => {
    const candles = [
      candle(1, 100, 101, 99, 100.5),
      candle(2, 100.5, 101.5, 99.5, 101),
      candle(3, 101, 102, 100, 101.4),
    ];
    expect(names(candles)).toEqual([]);
  });

  it('erkennt Doji, wenn der Kerzenkoerper klein gegenueber der Handelsspanne ist', () => {
    const candles = [candle(1, 100, 105, 95, 100.2)];
    expect(names(candles)).toContain('Doji');
  });

  it('erkennt Bullish Engulfing (baerische Kerze gefolgt von groesserer bullischer Kerze)', () => {
    const candles = [
      candle(1, 100, 101, 96, 97),
      candle(2, 96.5, 102, 96, 101.5),
    ];
    expect(names(candles)).toContain('Bullish Engulfing');
    expect(names(candles)).not.toContain('Bearish Engulfing');
  });

  it('erkennt Bearish Engulfing (bullische Kerze gefolgt von groesserer baerischer Kerze)', () => {
    const candles = [
      candle(1, 97, 101, 96, 100),
      candle(2, 100.5, 101, 95, 96.5),
    ];
    expect(names(candles)).toContain('Bearish Engulfing');
    expect(names(candles)).not.toContain('Bullish Engulfing');
  });

  it('erkennt Hammer (langer unterer Docht, kleiner Koerper im oberen Drittel)', () => {
    const candles = [candle(1, 100, 100.5, 90, 100.4)];
    expect(names(candles)).toContain('Hammer');
    expect(names(candles)).not.toContain('Shooting Star');
  });

  it('erkennt Shooting Star (langer oberer Docht, kleiner Koerper im unteren Drittel)', () => {
    const candles = [candle(1, 100, 110, 99.5, 99.6)];
    expect(names(candles)).toContain('Shooting Star');
    expect(names(candles)).not.toContain('Hammer');
  });

  it('erkennt Morning Star (lange baerische, kleine Stern-Kerze, lange bullische ueber Mitte C1)', () => {
    const candles = [
      candle(1, 100, 101, 90, 91),
      candle(2, 90.5, 91.5, 89.5, 90.8),
      candle(3, 91, 100, 90.5, 99),
    ];
    expect(names(candles)).toContain('Morning Star');
  });

  it('erkennt Evening Star (lange bullische, kleine Stern-Kerze, lange baerische unter Mitte C1)', () => {
    const candles = [
      candle(1, 90, 101, 89, 100),
      candle(2, 100.2, 101, 99.5, 100.5),
      candle(3, 100, 100.5, 91, 92),
    ];
    expect(names(candles)).toContain('Evening Star');
  });

  it('erkennt Three White Soldiers (drei aufeinanderfolgende bullische Kerzen mit steigenden Schlusskursen)', () => {
    const candles = [
      candle(1, 100, 103, 99.5, 102.5),
      candle(2, 101.5, 106, 101, 105.5),
      candle(3, 104.5, 109, 104, 108.5),
    ];
    expect(names(candles)).toContain('Three White Soldiers');
  });

  it('erkennt Three Black Crows (drei aufeinanderfolgende baerische Kerzen mit fallenden Schlusskursen)', () => {
    const candles = [
      candle(1, 108, 108.5, 104, 104.5),
      candle(2, 105.5, 106, 101, 101.5),
      candle(3, 102.5, 103, 98, 98.5),
    ];
    expect(names(candles)).toContain('Three Black Crows');
  });

  it('gibt eine leere Liste zurueck, ohne zu werfen, wenn keine Kerzen vorliegen', () => {
    expect(detectActivePatterns([])).toEqual([]);
  });
});
