// ESS-0018 Phase 2 / ADR-0051: server/db.ts gemockt. Fokus: nur allowlisted Query-Builder-Calls
// (kein Raw-SQL), Fingerprint-Mismatch blockiert Apply fail-closed, kein Downgrade auf "leise
// nichts tun" statt Fehler.

import { describe, it, expect, vi, beforeEach } from 'vitest';

interface Call { method: string; args: any[]; }

function createChainableQuery(result: { data: any; error: any }) {
  const calls: Call[] = [];
  const chain: any = {
    calls,
    eq: (...args: any[]) => { calls.push({ method: 'eq', args }); return chain; },
    maybeSingle: () => Promise.resolve(result),
    then: (resolve: any) => resolve(result),
  };
  return chain;
}

let alertRow: {
  id: string;
  symbol: string;
  active: boolean;
  email?: string;
  confirmed?: boolean;
  confirm_token?: string | null;
  condition?: string;
  threshold?: number;
} | null = null;
let updateResult: { data: any; error: any } = { data: null, error: null };
let subscriptionResult: { data: any; error: any } = { data: null, error: null };
let quotaResult: { data: any; error: any } = { data: [], error: null };

const mockFrom = vi.fn((table: string) => {
  if (table === 'alert_subscriptions') {
    return {
      select: (...selectArgs: any[]) => {
        const query = createChainableQuery({ data: alertRow, error: null });
        query.calls.push({ method: 'select', args: selectArgs });
        return query;
      },
      update: (...updateArgs: any[]) => {
        const calls: Call[] = [{ method: 'update', args: updateArgs }];
        const chain: any = {
          eq: (...args: any[]) => { calls.push({ method: 'eq', args }); return chain; },
          select: (...args: any[]) => { calls.push({ method: 'select', args }); return chain; },
          maybeSingle: () => Promise.resolve(updateResult),
        };
        return chain;
      },
    };
  }
  if (table === 'subscriptions') {
    return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve(subscriptionResult) }) }) };
  }
  if (table === 'user_quota') {
    return { select: () => ({ eq: () => Promise.resolve(quotaResult) }) };
  }
  throw new Error(`Unerwartete Tabelle im Test: ${table}`);
});

vi.mock('../../server/db', () => ({
  isPrivilegedSupabaseConfigured: vi.fn(() => true),
  getPrivilegedServerSupabase: vi.fn(() => ({ from: mockFrom })),
}));

const mockSendAlertConfirmationEmail = vi.fn().mockResolvedValue({ success: true });
vi.mock('../../server/alerts', () => ({
  sendAlertConfirmationEmail: (...args: any[]) => mockSendAlertConfirmationEmail(...args),
}));

import {
  getAdminDiagnostics,
  getAlertSubscriptionPreview,
  disableAlertSubscription,
  getAlertSubscriptionConfirmationPreview,
  resendAlertSubscriptionConfirmation,
} from '../../src/services/agentTools/supabaseAdminDiagnosticsTool';
import { isPrivilegedSupabaseConfigured } from '../../server/db';

const VALID_UUID = '11111111-1111-1111-1111-111111111111';

describe('supabaseAdminDiagnosticsTool (ESS-0018 Phase 2)', () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockSendAlertConfirmationEmail.mockClear();
    mockSendAlertConfirmationEmail.mockResolvedValue({ success: true });
    alertRow = { id: VALID_UUID, symbol: 'AAPL', active: true };
    updateResult = { data: { id: VALID_UUID, active: false }, error: null };
    subscriptionResult = { data: null, error: null };
    quotaResult = { data: [], error: null };
    (isPrivilegedSupabaseConfigured as any).mockReturnValue(true);
  });

  describe('getAdminDiagnostics', () => {
    it('requires at least a userId or an email', async () => {
      await expect(getAdminDiagnostics({})).rejects.toThrow(/userId oder email/);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns null subscription / empty quota rather than fabricating data when nothing is stored', async () => {
      const result = await getAdminDiagnostics({ userId: VALID_UUID, email: 'a@example.com' });
      expect(result.subscription).toBeNull();
      expect(result.quota).toEqual([]);
    });

    it('rejects a malformed userId before touching the database', async () => {
      await expect(getAdminDiagnostics({ userId: 'not-a-uuid' })).rejects.toThrow(/Ungueltige UUID/);
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('getAlertSubscriptionPreview / disableAlertSubscription', () => {
    it('rejects a malformed id before touching the database', async () => {
      await expect(getAlertSubscriptionPreview('drop table;')).rejects.toThrow(/Ungueltige UUID/);
    });

    it('returns a stable fingerprint that changes when active changes', async () => {
      alertRow = { id: VALID_UUID, symbol: 'AAPL', active: true };
      const activePreview = await getAlertSubscriptionPreview(VALID_UUID);
      alertRow = { id: VALID_UUID, symbol: 'AAPL', active: false };
      const inactivePreview = await getAlertSubscriptionPreview(VALID_UUID);
      expect(activePreview!.fingerprint).not.toBe(inactivePreview!.fingerprint);
    });

    it('rejects disable with a fingerprint mismatch instead of silently applying it', async () => {
      alertRow = { id: VALID_UUID, symbol: 'AAPL', active: true };
      await expect(
        disableAlertSubscription({ id: VALID_UUID, expectedFingerprint: 'stale-fingerprint-from-before-a-concurrent-change' })
      ).rejects.toThrow(/Fingerprint-Mismatch/);
    });

    it('disables the row when the fingerprint matches the current state', async () => {
      alertRow = { id: VALID_UUID, symbol: 'AAPL', active: true };
      const preview = await getAlertSubscriptionPreview(VALID_UUID);
      const result = await disableAlertSubscription({ id: VALID_UUID, expectedFingerprint: preview!.fingerprint });
      expect(result).toEqual({ id: VALID_UUID, active: false });
    });

    it('is idempotent: disabling an already-inactive row does not error or issue a redundant write', async () => {
      alertRow = { id: VALID_UUID, symbol: 'AAPL', active: false };
      const preview = await getAlertSubscriptionPreview(VALID_UUID);
      mockFrom.mockClear();
      const result = await disableAlertSubscription({ id: VALID_UUID, expectedFingerprint: preview!.fingerprint });
      expect(result).toEqual({ id: VALID_UUID, active: false });
      expect(mockFrom).toHaveBeenCalledTimes(1); // only the re-read for the fingerprint check, no update call
    });

    it('throws when the row does not exist rather than treating it as a no-op success', async () => {
      alertRow = null;
      await expect(disableAlertSubscription({ id: VALID_UUID, expectedFingerprint: 'anything' })).rejects.toThrow(/nicht gefunden/);
    });
  });

  describe('getAlertSubscriptionConfirmationPreview / resendAlertSubscriptionConfirmation', () => {
    it('rejects a malformed id before touching the database', async () => {
      await expect(getAlertSubscriptionConfirmationPreview('drop table;')).rejects.toThrow(/Ungueltige UUID/);
    });

    it('returns a stable fingerprint that changes when confirmed changes', async () => {
      alertRow = { id: VALID_UUID, symbol: 'AAPL', active: true, email: 'a@example.com', confirmed: false };
      const pendingPreview = await getAlertSubscriptionConfirmationPreview(VALID_UUID);
      alertRow = { id: VALID_UUID, symbol: 'AAPL', active: true, email: 'a@example.com', confirmed: true };
      const confirmedPreview = await getAlertSubscriptionConfirmationPreview(VALID_UUID);
      expect(pendingPreview!.fingerprint).not.toBe(confirmedPreview!.fingerprint);
    });

    it('rejects resend with a fingerprint mismatch instead of silently sending a mail', async () => {
      alertRow = { id: VALID_UUID, symbol: 'AAPL', active: true, email: 'a@example.com', confirmed: false };
      await expect(
        resendAlertSubscriptionConfirmation({ id: VALID_UUID, expectedFingerprint: 'stale-fingerprint-from-before-a-concurrent-change' })
      ).rejects.toThrow(/Fingerprint-Mismatch/);
      expect(mockSendAlertConfirmationEmail).not.toHaveBeenCalled();
    });

    it('is idempotent: resending for an already-confirmed subscription sends no mail', async () => {
      alertRow = { id: VALID_UUID, symbol: 'AAPL', active: true, email: 'a@example.com', confirmed: true };
      const preview = await getAlertSubscriptionConfirmationPreview(VALID_UUID);
      const result = await resendAlertSubscriptionConfirmation({ id: VALID_UUID, expectedFingerprint: preview!.fingerprint });
      expect(result).toEqual({ id: VALID_UUID, resent: false, alreadyConfirmed: true });
      expect(mockSendAlertConfirmationEmail).not.toHaveBeenCalled();
    });

    it('re-sends the confirmation mail using the existing token when the fingerprint matches', async () => {
      alertRow = {
        id: VALID_UUID, symbol: 'AAPL', active: true, email: 'a@example.com', confirmed: false,
        confirm_token: 'existing-token', condition: 'score_above', threshold: 7,
      };
      const preview = await getAlertSubscriptionConfirmationPreview(VALID_UUID);
      const result = await resendAlertSubscriptionConfirmation({ id: VALID_UUID, expectedFingerprint: preview!.fingerprint });
      expect(result).toEqual({ id: VALID_UUID, resent: true, alreadyConfirmed: false });
      expect(mockSendAlertConfirmationEmail).toHaveBeenCalledWith({
        email: 'a@example.com',
        symbol: 'AAPL',
        condition: 'score_above',
        threshold: 7,
        confirmToken: 'existing-token',
      });
    });

    it('throws instead of silently succeeding when the mail send fails', async () => {
      alertRow = {
        id: VALID_UUID, symbol: 'AAPL', active: true, email: 'a@example.com', confirmed: false,
        confirm_token: 'existing-token', condition: 'score_above', threshold: 7,
      };
      mockSendAlertConfirmationEmail.mockResolvedValue({ success: false, error: 'smtp-not-configured' });
      const preview = await getAlertSubscriptionConfirmationPreview(VALID_UUID);
      await expect(
        resendAlertSubscriptionConfirmation({ id: VALID_UUID, expectedFingerprint: preview!.fingerprint })
      ).rejects.toThrow(/konnte nicht versendet werden/);
    });

    it('throws when the row does not exist rather than treating it as a no-op success', async () => {
      alertRow = null;
      await expect(resendAlertSubscriptionConfirmation({ id: VALID_UUID, expectedFingerprint: 'anything' })).rejects.toThrow(/nicht gefunden/);
    });
  });
});
