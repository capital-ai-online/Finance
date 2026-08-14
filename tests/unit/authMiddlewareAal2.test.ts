// ADR-0064 / ESS-0020 (M5A Slice A/C): deckt die zentrale serverseitige AAL2-Prüfung
// (requireVerifiedAal2) und ihre Kopplung an requireStepUp ab. Ein Fehler hier könnte eine
// AAL1-Sitzung fälschlich als AAL2 durchlassen (kritischer Privilegien-Bypass) oder umgekehrt
// jede Owner-Aktion sperren - beide Richtungen sind sicherheitsrelevant, daher volle
// Positiv-/Negativ-Abdeckung der M5A-Pflichtprüfungen.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';

const getUserMock = vi.fn();
const getAalMock = vi.fn();
const stepUpUpdateResultMock = vi.fn();

vi.mock('../../server/db', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  getServerSupabase: vi.fn(() => ({
    auth: {
      getUser: (...args: any[]) => getUserMock(...args),
      mfa: {
        getAuthenticatorAssuranceLevel: (...args: any[]) => getAalMock(...args),
      },
    },
    from: (table: string) => {
      if (table !== 'step_up_tokens') throw new Error(`Unerwartete Tabelle im Test: ${table}`);
      return {
        update: () => ({
          eq: () => ({
            eq: () => ({
              is: () => ({
                gt: () => ({
                  select: () => ({
                    maybeSingle: () => stepUpUpdateResultMock(),
                  }),
                }),
              }),
            }),
          }),
        }),
      };
    },
  })),
}));

import { requireVerifiedAal2, requireStepUp } from '../../src/platform/Security/authMiddleware';
import { isSupabaseConfigured } from '../../server/db';

function req(headers: Record<string, string> = {}): Request {
  return { headers, requestId: 'test-request' } as unknown as Request;
}

describe('requireVerifiedAal2', () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getAalMock.mockReset();
    (isSupabaseConfigured as any).mockReturnValue(true);
  });

  it('verweigert fail-closed, wenn Supabase nicht konfiguriert ist', async () => {
    (isSupabaseConfigured as any).mockReturnValue(false);
    const result = await requireVerifiedAal2(req({ authorization: 'Bearer tok' }));
    expect(result).toEqual({ verified: false, currentLevel: null, reason: 'supabase-not-configured' });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('verweigert ohne Bearer-Token, ohne Supabase überhaupt aufzurufen', async () => {
    const result = await requireVerifiedAal2(req());
    expect(result.verified).toBe(false);
    expect(result.reason).toBe('no-bearer-token');
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('verweigert bei ungültigem/abgelaufenem Token', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: 'jwt expired' } });
    const result = await requireVerifiedAal2(req({ authorization: 'Bearer bad' }));
    expect(result.verified).toBe(false);
    expect(result.reason).toBe('invalid-token');
    expect(getAalMock).not.toHaveBeenCalled();
  });

  it('verweigert fail-closed, wenn der AAL-Lookup selbst fehlschlägt (Netzwerk-/Authfehler)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: null, error: { message: 'network error' } });
    const result = await requireVerifiedAal2(req({ authorization: 'Bearer tok' }));
    expect(result).toEqual({ verified: false, userId: 'user-1', currentLevel: null, reason: 'aal-lookup-failed' });
  });

  it('verweigert bei aal1', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null });
    const result = await requireVerifiedAal2(req({ authorization: 'Bearer tok' }));
    expect(result).toEqual({ verified: false, userId: 'user-1', currentLevel: 'aal1', reason: 'insufficient-aal' });
  });

  it('verweigert bei fehlendem/null Level statt einen Level anzunehmen', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: { currentLevel: null, nextLevel: 'aal1' }, error: null });
    const result = await requireVerifiedAal2(req({ authorization: 'Bearer tok' }));
    expect(result.verified).toBe(false);
    expect(result.reason).toBe('insufficient-aal');
  });

  it('erlaubt bei aal2 und liefert die userId', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null });
    const result = await requireVerifiedAal2(req({ authorization: 'Bearer tok' }));
    expect(result).toEqual({ verified: true, userId: 'user-1', currentLevel: 'aal2', reason: 'aal2-verified' });
    expect(getAalMock).toHaveBeenCalledWith('tok');
  });

  it('verweigert fail-closed bei einem unerwarteten Wurf statt zu crashen', async () => {
    getUserMock.mockRejectedValue(new Error('boom'));
    const result = await requireVerifiedAal2(req({ authorization: 'Bearer tok' }));
    expect(result.verified).toBe(false);
    expect(result.reason).toBe('internal-error');
  });
});

describe('requireStepUp (gekoppelt an AAL2)', () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getAalMock.mockReset();
    stepUpUpdateResultMock.mockReset();
    (isSupabaseConfigured as any).mockReturnValue(true);
  });

  it('verweigert ohne x-step-up-token-Header, ohne jede Supabase-Abfrage', async () => {
    expect(await requireStepUp(req({ authorization: 'Bearer tok' }))).toBe(false);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('verweigert bei AAL1, auch wenn ein syntaktisch gültiger Step-Up-Header vorliegt - der DB-Tokencheck wird gar nicht erst versucht', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null });
    const result = await requireStepUp(req({ authorization: 'Bearer tok', 'x-step-up-token': 'step-up-abc' }));
    expect(result).toBe(false);
    expect(stepUpUpdateResultMock).not.toHaveBeenCalled();
  });

  it('erlaubt bei AAL2 und einem gültigen, ungenutzten, nicht abgelaufenen Token', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null });
    stepUpUpdateResultMock.mockResolvedValue({ data: { id: 'token-row-1' }, error: null });
    const result = await requireStepUp(req({ authorization: 'Bearer tok', 'x-step-up-token': 'step-up-abc' }));
    expect(result).toBe(true);
  });

  it('verweigert bei AAL2, aber abgelaufenem/bereits verbrauchtem/fremdem Token', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null });
    stepUpUpdateResultMock.mockResolvedValue({ data: null, error: null });
    const result = await requireStepUp(req({ authorization: 'Bearer tok', 'x-step-up-token': 'step-up-abc' }));
    expect(result).toBe(false);
  });

  it('verweigert fail-closed bei einem DB-Fehler waehrend der Token-Konsumierung', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null });
    stepUpUpdateResultMock.mockResolvedValue({ data: null, error: { message: 'db unreachable' } });
    const result = await requireStepUp(req({ authorization: 'Bearer tok', 'x-step-up-token': 'step-up-abc' }));
    expect(result).toBe(false);
  });

  it('verweigert, wenn Supabase nicht konfiguriert ist', async () => {
    (isSupabaseConfigured as any).mockReturnValue(false);
    const result = await requireStepUp(req({ authorization: 'Bearer tok', 'x-step-up-token': 'step-up-abc' }));
    expect(result).toBe(false);
  });
});
