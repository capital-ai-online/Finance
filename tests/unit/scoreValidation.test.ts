// Audit ARCH-AUDIT-0002 (N1): Testabdeckung fuer die rueckwirkende Score-Validierung.
// server/db.ts (Supabase-Client) und assetRegistry werden gemockt, damit die Tests
// deterministisch bleiben und keine echte Datenbank-/Netzwerkverbindung benoetigen.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockSelectResult = { data: [] as any[], error: null as any };

vi.mock('../../server/db', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  getServerSupabase: vi.fn(() => ({
    from: (table: string) => {
      if (table !== 'score_snapshots') throw new Error(`Unerwartete Tabelle im Test: ${table}`);
      return {
        upsert: mockUpsert,
        select: () => ({
          lte: () => Promise.resolve(mockSelectResult),
        }),
      };
    },
  })),
}));

vi.mock('../../src/lib/assetRegistry', () => ({
  assetRegistry: {
    getAsset: vi.fn(),
  },
}));

import { recordDailySnapshots, evaluateScoreValidation } from '../../server/scoreValidation';
import { isSupabaseConfigured } from '../../server/db';
import { assetRegistry } from '../../src/lib/assetRegistry';

describe('scoreValidation', () => {
  beforeEach(() => {
    mockUpsert.mockClear();
    mockSelectResult.data = [];
    mockSelectResult.error = null;
    (isSupabaseConfigured as any).mockReturnValue(true);
    (assetRegistry.getAsset as any).mockReset();
  });

  describe('recordDailySnapshots', () => {
    it('ruft upsert mit dem heutigen Kalendertag und onConflict/ignoreDuplicates auf', async () => {
      await recordDailySnapshots([
        { symbol: 'btc', assetType: 'crypto', score: 7.2, scoreBasis: 'market-data', price: 68000 },
      ]);
      expect(mockUpsert).toHaveBeenCalledTimes(1);
      const [rows, options] = mockUpsert.mock.calls[0];
      expect(rows[0].symbol).toBe('BTC');
      expect(rows[0].price).toBe(68000);
      expect(rows[0].snapshot_date).toBe(new Date().toISOString().slice(0, 10));
      expect(options).toEqual({ onConflict: 'symbol,snapshot_date', ignoreDuplicates: true });
    });

    it('ueberspringt Assets mit ungueltigem Preis oder Score', async () => {
      await recordDailySnapshots([
        { symbol: 'ETH', assetType: 'crypto', score: NaN, price: 3000 },
        { symbol: 'SOL', assetType: 'crypto', score: 8.0, price: 0 },
      ]);
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('macht nichts, wenn Supabase nicht konfiguriert ist', async () => {
      (isSupabaseConfigured as any).mockReturnValue(false);
      await recordDailySnapshots([{ symbol: 'BTC', assetType: 'crypto', score: 7, price: 68000 }]);
      expect(mockUpsert).not.toHaveBeenCalled();
    });
  });

  describe('evaluateScoreValidation', () => {
    it('liefert ein leeres Ergebnis ohne Supabase-Konfiguration', async () => {
      (isSupabaseConfigured as any).mockReturnValue(false);
      const result = await evaluateScoreValidation(30, 6.5);
      expect(result.overall.sampleSize).toBe(0);
      expect(result.overall.insufficientData).toBe(true);
      expect(Object.keys(result.byScoreBasis)).toHaveLength(0);
    });

    it('klassifiziert einen als positiv eingestuften Snapshot mit gestiegenem Preis als True Positive', async () => {
      mockSelectResult.data = [
        { symbol: 'BTC', score: 8.0, score_basis: 'market-data', price: 50000 },
      ];
      (assetRegistry.getAsset as any).mockImplementation((s: string) =>
        s === 'BTC' ? { price: 60000 } : undefined
      );

      const result = await evaluateScoreValidation(30, 6.5);
      expect(result.overall.sampleSize).toBe(1);
      expect(result.overall.truePositives).toBe(1);
      expect(result.overall.falsePositives).toBe(0);
      expect(result.overall.hitRatePct).toBe(100);
      expect(result.overall.falsePositiveRatePct).toBe(0);
    });

    it('klassifiziert einen als positiv eingestuften Snapshot mit gefallenem Preis als False Positive', async () => {
      mockSelectResult.data = [
        { symbol: 'ETH', score: 7.5, score_basis: 'market-data', price: 4000 },
      ];
      (assetRegistry.getAsset as any).mockImplementation((s: string) =>
        s === 'ETH' ? { price: 3000 } : undefined
      );

      const result = await evaluateScoreValidation(30, 6.5);
      expect(result.overall.falsePositives).toBe(1);
      expect(result.overall.truePositives).toBe(0);
      expect(result.overall.hitRatePct).toBe(0);
      expect(result.overall.falsePositiveRatePct).toBe(100);
    });

    it('ignoriert Snapshots, fuer die kein aktuelles Asset in der Registry vorliegt', async () => {
      mockSelectResult.data = [
        { symbol: 'UNKNOWN', score: 8.0, score_basis: 'market-data', price: 100 },
      ];
      (assetRegistry.getAsset as any).mockReturnValue(undefined);

      const result = await evaluateScoreValidation(30, 6.5);
      expect(result.overall.sampleSize).toBe(0);
    });

    it('schluesselt Ergebnisse zusaetzlich nach scoreBasis auf', async () => {
      mockSelectResult.data = [
        { symbol: 'BTC', score: 8.0, score_basis: 'market-data', price: 50000 },
        { symbol: 'AAPL', score: 8.0, score_basis: 'heuristic', price: 100 },
      ];
      (assetRegistry.getAsset as any).mockImplementation((s: string) => {
        if (s === 'BTC') return { price: 60000 };
        if (s === 'AAPL') return { price: 90 };
        return undefined;
      });

      const result = await evaluateScoreValidation(30, 6.5);
      expect(result.byScoreBasis['market-data'].truePositives).toBe(1);
      expect(result.byScoreBasis['heuristic'].falsePositives).toBe(1);
    });

    it('markiert insufficientData, solange die Stichprobe unter der Mindestgroesse liegt', async () => {
      mockSelectResult.data = [
        { symbol: 'BTC', score: 8.0, score_basis: 'market-data', price: 50000 },
      ];
      (assetRegistry.getAsset as any).mockReturnValue({ price: 60000 });

      const result = await evaluateScoreValidation(30, 6.5);
      expect(result.overall.sampleSize).toBe(1);
      expect(result.overall.insufficientData).toBe(true);
    });
  });
});
