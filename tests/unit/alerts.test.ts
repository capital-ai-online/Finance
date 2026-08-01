// Audit ARCH-AUDIT-0002 (H2): Testabdeckung fuer die Alert-Auswertung. server/db.ts und
// server/mailer.ts werden gemockt (kein echtes Supabase/SMTP im Test), analog zum Muster in
// tests/unit/scoreValidation.test.ts. Der HTTP-Router selbst (Validierung, Double-Opt-In-Flow)
// wird hier bewusst nicht end-to-end getestet - es gibt in diesem Projekt keine supertest-
// Abhaengigkeit; die fachliche Auswertungslogik (Cooldown, Bedingungen) ist der Teil mit
// echtem Regressionsrisiko und wird direkt getestet.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const mockSelectResult = { data: [] as any[], error: null as any };
const mockSendMail = vi.fn().mockResolvedValue({ success: true });

vi.mock('../../server/db', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  getServerSupabase: vi.fn(() => ({
    from: (table: string) => {
      if (table !== 'alert_subscriptions') throw new Error(`Unerwartete Tabelle im Test: ${table}`);
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              in: () => Promise.resolve(mockSelectResult),
            }),
          }),
        }),
        update: mockUpdate,
      };
    },
  })),
}));

vi.mock('../../server/mailer', () => ({
  sendMail: (...args: any[]) => mockSendMail(...args),
}));

import { evaluateAlerts } from '../../server/alerts';
import { isSupabaseConfigured } from '../../server/db';

describe('alerts', () => {
  beforeEach(() => {
    mockUpdate.mockClear();
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSendMail.mockClear();
    mockSendMail.mockResolvedValue({ success: true });
    mockSelectResult.data = [];
    mockSelectResult.error = null;
    (isSupabaseConfigured as any).mockReturnValue(true);
  });

  describe('evaluateAlerts', () => {
    it('versendet eine Mail, wenn score_above ueberschritten ist', async () => {
      mockSelectResult.data = [
        { id: '1', email: 'a@example.com', symbol: 'BTC', condition: 'score_above', threshold: 7, last_notified_at: null, unsubscribe_token: 'tok1' },
      ];
      await evaluateAlerts([{ symbol: 'BTC', score: 8.2 }]);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail.mock.calls[0][0].to).toBe('a@example.com');
    });

    it('versendet keine Mail, wenn die Bedingung nicht erfuellt ist', async () => {
      mockSelectResult.data = [
        { id: '1', email: 'a@example.com', symbol: 'BTC', condition: 'score_above', threshold: 7, last_notified_at: null, unsubscribe_token: 'tok1' },
      ];
      await evaluateAlerts([{ symbol: 'BTC', score: 5.0 }]);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('score_below feuert, wenn der Score unter der Schwelle liegt', async () => {
      mockSelectResult.data = [
        { id: '1', email: 'a@example.com', symbol: 'ETH', condition: 'score_below', threshold: 3, last_notified_at: null, unsubscribe_token: 'tok2' },
      ];
      await evaluateAlerts([{ symbol: 'ETH', score: 2.1 }]);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('unterdrueckt eine erneute Mail innerhalb des Cooldowns', async () => {
      const recentNotification = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // vor 1h
      mockSelectResult.data = [
        { id: '1', email: 'a@example.com', symbol: 'BTC', condition: 'score_above', threshold: 7, last_notified_at: recentNotification, unsubscribe_token: 'tok1' },
      ];
      await evaluateAlerts([{ symbol: 'BTC', score: 9.0 }]);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('feuert erneut, sobald der Cooldown abgelaufen ist', async () => {
      const oldNotification = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(); // vor 7h
      mockSelectResult.data = [
        { id: '1', email: 'a@example.com', symbol: 'BTC', condition: 'score_above', threshold: 7, last_notified_at: oldNotification, unsubscribe_token: 'tok1' },
      ];
      await evaluateAlerts([{ symbol: 'BTC', score: 9.0 }]);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('aktualisiert last_notified_at nur bei erfolgreichem Versand', async () => {
      mockSendMail.mockResolvedValue({ success: false, error: 'smtp-not-configured' });
      mockSelectResult.data = [
        { id: '1', email: 'a@example.com', symbol: 'BTC', condition: 'score_above', threshold: 7, last_notified_at: null, unsubscribe_token: 'tok1' },
      ];
      await evaluateAlerts([{ symbol: 'BTC', score: 9.0 }]);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('macht nichts, wenn Supabase nicht konfiguriert ist', async () => {
      (isSupabaseConfigured as any).mockReturnValue(false);
      await evaluateAlerts([{ symbol: 'BTC', score: 9.0 }]);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('macht nichts ohne Assets', async () => {
      await evaluateAlerts([]);
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
});
