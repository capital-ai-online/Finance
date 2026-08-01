// Audit ARCH-AUDIT-0002 (D5): Testabdeckung fuer den kritischen Quota-Pfad (ADR-0017).
// enforceScreeningQuota() faellt in der Testumgebung (kein SUPABASE_* gesetzt) auf den
// IP-basierten In-Memory-Rate-Limiter zurueck - genau der Pfad, der ohne Mocking realistisch
// pruefbar ist. Der Supabase-gestuetzte Pfad fuer eingeloggte Nutzer benoetigt gemockte
// Supabase-Antworten und ist hier bewusst nicht abgedeckt (Folgearbeit).

import { describe, it, expect } from 'vitest';
import { isUnlimitedTier, isNewUtcDay, enforceScreeningQuota, STARTER_DAILY_LIMIT } from '../../server/quota';

describe('quota', () => {
  describe('isUnlimitedTier', () => {
    it('erkennt PRO/ENTERPRISE als unbegrenzt, unabhaengig von Gross-/Kleinschreibung und Whitespace', () => {
      expect(isUnlimitedTier('PRO')).toBe(true);
      expect(isUnlimitedTier('pro')).toBe(true);
      expect(isUnlimitedTier('  Enterprise  ')).toBe(true);
      expect(isUnlimitedTier('Enterprise OS')).toBe(true);
    });

    it('behandelt STARTER und FREE als begrenzt', () => {
      expect(isUnlimitedTier('STARTER')).toBe(false);
      expect(isUnlimitedTier('FREE')).toBe(false);
      expect(isUnlimitedTier('')).toBe(false);
    });
  });

  describe('isNewUtcDay', () => {
    it('erkennt denselben UTC-Tag korrekt als NICHT neu', () => {
      const now = new Date();
      expect(isNewUtcDay(now.toISOString())).toBe(false);
    });

    it('erkennt einen vergangenen Tag als neu', () => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
      expect(isNewUtcDay(yesterday.toISOString())).toBe(true);
    });
  });

  describe('enforceScreeningQuota (Gast-/IP-Fallback ohne Supabase-Konfiguration)', () => {
    function fakeRequest(ip: string) {
      return {
        headers: { 'x-forwarded-for': ip },
        socket: { remoteAddress: ip },
      } as any;
    }

    it('erlaubt bis zum STARTER_DAILY_LIMIT Anfragen von derselben IP und blockiert danach', async () => {
      const ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}`; // eindeutige Test-IP je Lauf
      for (let i = 0; i < STARTER_DAILY_LIMIT; i++) {
        const result = await enforceScreeningQuota(fakeRequest(ip));
        expect(result.allowed, `Anfrage ${i + 1} von ${STARTER_DAILY_LIMIT}`).toBe(true);
      }
      const blocked = await enforceScreeningQuota(fakeRequest(ip));
      expect(blocked.allowed).toBe(false);
      expect(blocked.reason).toBe('daily-limit-reached');
    });

    it('zaehlt verschiedene IPs unabhaengig voneinander', async () => {
      const ipA = `198.51.100.${Math.floor(Math.random() * 250) + 1}`;
      const ipB = `198.51.100.${Math.floor(Math.random() * 250) + 1}`;
      for (let i = 0; i < STARTER_DAILY_LIMIT; i++) {
        await enforceScreeningQuota(fakeRequest(ipA));
      }
      const blockedA = await enforceScreeningQuota(fakeRequest(ipA));
      const allowedB = await enforceScreeningQuota(fakeRequest(ipB));
      expect(blockedA.allowed).toBe(false);
      expect(allowedB.allowed).toBe(true);
    });
  });
});
