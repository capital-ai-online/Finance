// ADR-0052 / R-004: the PDF-credit ledger must never silently fall back to the local file in
// production, must grant unlimited credits to the owner identity, and must expose the atomic
// consume/grant contracts (success/granted flags, current balance) without any extra mutation
// or logging implying a change that did not happen.

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isOwnerIdentifier: vi.fn(),
  isSupabaseConfigured: vi.fn(),
  assertPrivilegedSupabaseConfigured: vi.fn(),
  getCleanEnv: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock('../../server/env', () => ({
  getCleanEnv: mocks.getCleanEnv,
}));

vi.mock('../../server/db', () => ({
  isOwnerIdentifier: mocks.isOwnerIdentifier,
  isSupabaseConfigured: mocks.isSupabaseConfigured,
  assertPrivilegedSupabaseConfigured: mocks.assertPrivilegedSupabaseConfigured,
  getPrivilegedServerSupabase: vi.fn(() => ({
    rpc: mocks.rpc,
    from: mocks.from,
  })),
}));

import { getPdfCredits, consumePdfCredit, grantPdfCredits } from '../../server/pdfCreditLedger';

const USER = '11111111-1111-1111-1111-111111111111';

function chainableSelect(result: { data: any; error: any }) {
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve(result),
      }),
    }),
  };
}

describe('server/pdfCreditLedger (ADR-0052 / R-004)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isOwnerIdentifier.mockResolvedValue(false);
    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.getCleanEnv.mockImplementation((key: string) => (key === 'NODE_ENV' ? 'production' : ''));
    mocks.assertPrivilegedSupabaseConfigured.mockImplementation((context = 'privileged Supabase operation') => {
      throw new Error(`[Supabase][SECURITY] ${context} blocked: SUPABASE_URL is missing.`);
    });
  });

  describe('owner bypass', () => {
    it('returns unlimited credits for the owner identity without touching Supabase', async () => {
      mocks.isOwnerIdentifier.mockResolvedValue(true);
      const credits = await getPdfCredits(USER);
      expect(credits).toBe(999999);
      expect(mocks.rpc).not.toHaveBeenCalled();
      expect(mocks.from).not.toHaveBeenCalled();
    });

    it('always reports a successful consume for the owner identity', async () => {
      mocks.isOwnerIdentifier.mockResolvedValue(true);
      const result = await consumePdfCredit(USER);
      expect(result).toEqual({ success: true, credits: 999999 });
      expect(mocks.rpc).not.toHaveBeenCalled();
    });
  });

  describe('production without Supabase fails closed', () => {
    it('getPdfCredits throws instead of silently reading a local file', async () => {
      mocks.isSupabaseConfigured.mockReturnValue(false);
      await expect(getPdfCredits(USER)).rejects.toThrow(/SUPABASE_URL is missing/);
    });

    it('consumePdfCredit throws instead of silently writing a local file', async () => {
      mocks.isSupabaseConfigured.mockReturnValue(false);
      await expect(consumePdfCredit(USER)).rejects.toThrow(/SUPABASE_URL is missing/);
    });

    it('grantPdfCredits throws instead of silently writing a local file', async () => {
      mocks.isSupabaseConfigured.mockReturnValue(false);
      await expect(
        grantPdfCredits({ grantKey: 'evt_1', userIdentifier: USER, credits: 3, source: 'stripe_checkout.session.completed', reference: 'cs_1' }),
      ).rejects.toThrow(/SUPABASE_URL is missing/);
    });
  });

  describe('consumePdfCredit', () => {
    it('reports success with the decremented balance when the RPC allows it', async () => {
      mocks.rpc.mockResolvedValue({ data: [{ success: true, credits: 2 }], error: null });
      const result = await consumePdfCredit(USER);
      expect(result).toEqual({ success: true, credits: 2 });
      expect(mocks.rpc).toHaveBeenCalledWith('consume_pdf_credit', { p_user_identifier: USER });
    });

    it('reports failure without mutating when the balance is already exhausted', async () => {
      mocks.rpc.mockResolvedValue({ data: [{ success: false, credits: 0 }], error: null });
      const result = await consumePdfCredit(USER);
      expect(result).toEqual({ success: false, credits: 0 });
    });
  });

  describe('grantPdfCredits', () => {
    it('reports granted with the new balance for a first-seen grant key', async () => {
      mocks.rpc.mockResolvedValue({ data: [{ granted: true, credits: 6 }], error: null });
      const result = await grantPdfCredits({
        grantKey: 'evt_1',
        userIdentifier: USER,
        credits: 3,
        source: 'stripe_checkout.session.completed',
        reference: 'cs_1',
      });
      expect(result).toEqual({ granted: true, credits: 6 });
      expect(mocks.rpc).toHaveBeenCalledWith('grant_pdf_credits', {
        p_grant_key: 'evt_1',
        p_user_identifier: USER,
        p_credits: 3,
        p_source: 'stripe_checkout.session.completed',
        p_reference: 'cs_1',
      });
    });

    it('reports granted:false and the unchanged balance on a duplicate grant key', async () => {
      mocks.rpc.mockResolvedValue({ data: [{ granted: false, credits: 6 }], error: null });
      const result = await grantPdfCredits({
        grantKey: 'evt_1',
        userIdentifier: USER,
        credits: 3,
        source: 'stripe_checkout.session.completed',
        reference: 'cs_1',
      });
      expect(result).toEqual({ granted: false, credits: 6 });
    });
  });

  describe('getPdfCredits', () => {
    it('defaults to 3 without inserting a row when none exists yet', async () => {
      mocks.from.mockImplementation(() => chainableSelect({ data: null, error: null }));
      const credits = await getPdfCredits(USER);
      expect(credits).toBe(3);
    });

    it('returns the stored balance when a row exists', async () => {
      mocks.from.mockImplementation(() => chainableSelect({ data: { credits: 7 }, error: null }));
      const credits = await getPdfCredits(USER);
      expect(credits).toBe(7);
    });
  });
});
