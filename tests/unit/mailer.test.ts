// Audit ARCH-AUDIT-0002 (H3): Testabdeckung fuer die Supabase-basierte Idempotenzsperre in
// server/mailer.ts (vorher ausschliesslich Datei unter uploads/). server/db.ts und server/env.ts
// werden gemockt, kein echtes Supabase/SMTP im Test.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../server/env', () => ({
  getCleanEnv: vi.fn(() => ''), // SMTP nicht konfiguriert -> sendMail() versucht nie echten Versand
}));

const confirmationsStore = new Map<string, true>();

vi.mock('../../server/db', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  getServerSupabase: vi.fn(() => ({
    from: (table: string) => {
      if (table !== 'subscription_confirmations_sent') throw new Error(`Unerwartete Tabelle im Test: ${table}`);
      return {
        select: () => ({
          eq: (_col: string, sessionId: string) => ({
            maybeSingle: async () => ({
              data: confirmationsStore.has(sessionId) ? { session_id: sessionId } : null,
              error: null,
            }),
          }),
        }),
        upsert: async (row: { session_id: string }) => {
          confirmationsStore.set(row.session_id, true);
          return { error: null };
        },
      };
    },
  })),
}));

import { sendSubscriptionConfirmation } from '../../server/mailer';
import { isSupabaseConfigured } from '../../server/db';

describe('mailer idempotency (H3: Supabase statt uploads/-Datei)', () => {
  beforeEach(() => {
    confirmationsStore.clear();
    (isSupabaseConfigured as any).mockReturnValue(true);
  });

  it('versendet beim ersten Aufruf und markiert die Session in Supabase als gesendet', async () => {
    const result = await sendSubscriptionConfirmation('kunde@example.com', 'owner@example.com', {
      planId: 'pro',
      sessionId: 'cs_test_1',
    });
    expect(result.skippedAsDuplicate).toBe(false);
    expect(confirmationsStore.has('cs_test_1')).toBe(true);
  });

  it('ueberspringt einen zweiten Aufruf mit derselben Session-ID als Duplikat', async () => {
    await sendSubscriptionConfirmation('kunde@example.com', 'owner@example.com', {
      planId: 'pro',
      sessionId: 'cs_test_2',
    });
    const second = await sendSubscriptionConfirmation('kunde@example.com', 'owner@example.com', {
      planId: 'pro',
      sessionId: 'cs_test_2',
    });
    expect(second.skippedAsDuplicate).toBe(true);
  });

  it('behandelt unterschiedliche Session-IDs unabhaengig voneinander', async () => {
    await sendSubscriptionConfirmation('a@example.com', 'owner@example.com', { planId: 'starter', sessionId: 'cs_a' });
    const resultB = await sendSubscriptionConfirmation('b@example.com', 'owner@example.com', { planId: 'starter', sessionId: 'cs_b' });
    expect(resultB.skippedAsDuplicate).toBe(false);
  });

  it('bricht ohne sessionId sicher ab, ohne die Idempotenzsperre zu beruehren', async () => {
    const result = await sendSubscriptionConfirmation('a@example.com', 'owner@example.com', { planId: 'starter', sessionId: '' });
    expect(result.skippedAsDuplicate).toBe(false);
    expect(result.customer.error).toBe('missing-session-id');
  });
});
