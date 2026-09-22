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
const eqCallsMock = vi.fn();

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
      if (table === 'audit_logs_iam') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      if (table !== 'step_up_tokens') throw new Error(`Unerwartete Tabelle im Test: ${table}`);
      return {
        update: () => ({
          eq: (...args: unknown[]) => {
            eqCallsMock(...args);
            return {
              eq: (...args2: unknown[]) => {
                eqCallsMock(...args2);
                return {
                  eq: (...args3: unknown[]) => {
                    eqCallsMock(...args3);
                    return {
                      is: () => ({
                        gt: () => ({
                          select: () => ({
                            maybeSingle: () => stepUpUpdateResultMock(),
                          }),
                        }),
                      }),
                    };
                  },
                };
              },
            };
          },
        }),
      };
    },
  })),
}));

import { requireVerifiedAal2, requireStepUp, verifyProviderAal2 } from '../../src/platform/Security/authMiddleware';
import { isSupabaseConfigured } from '../../server/db';

function req(headers: Record<string, string> = {}): Request {
  return { headers, requestId: 'test-request' } as unknown as Request;
}

describe('verifyProviderAal2 strict provider boundary', () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getAalMock.mockReset();
    (isSupabaseConfigured as any).mockReturnValue(true);
  });

  it('verweigert fail-closed, wenn Supabase nicht konfiguriert ist', async () => {
    (isSupabaseConfigured as any).mockReturnValue(false);
    const result = await verifyProviderAal2(req({ authorization: 'Bearer tok' }));
    expect(result).toEqual({ verified: false, currentLevel: null, reason: 'supabase-not-configured' });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('verweigert ohne Bearer-Token, ohne Supabase überhaupt aufzurufen', async () => {
    const result = await verifyProviderAal2(req());
    expect(result.verified).toBe(false);
    expect(result.reason).toBe('no-bearer-token');
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('verweigert bei ungültigem/abgelaufenem Token', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: 'jwt expired' } });
    const result = await verifyProviderAal2(req({ authorization: 'Bearer bad' }));
    expect(result.verified).toBe(false);
    expect(result.reason).toBe('invalid-token');
    expect(getAalMock).not.toHaveBeenCalled();
  });

  it('verweigert fail-closed, wenn der AAL-Lookup selbst fehlschlägt (Netzwerk-/Authfehler)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: null, error: { message: 'network error' } });
    const result = await verifyProviderAal2(req({ authorization: 'Bearer tok' }));
    expect(result).toEqual({ verified: false, userId: 'user-1', currentLevel: null, reason: 'aal-lookup-failed' });
  });

  it('verweigert bei aal1', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null });
    const result = await verifyProviderAal2(req({ authorization: 'Bearer tok' }));
    expect(result).toEqual({ verified: false, userId: 'user-1', currentLevel: 'aal1', reason: 'insufficient-aal' });
  });

  it('verweigert bei fehlendem/null Level statt einen Level anzunehmen', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: { currentLevel: null, nextLevel: 'aal1' }, error: null });
    const result = await verifyProviderAal2(req({ authorization: 'Bearer tok' }));
    expect(result.verified).toBe(false);
    expect(result.reason).toBe('insufficient-aal');
  });

  it('erlaubt bei aal2 und liefert die userId', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null });
    const result = await verifyProviderAal2(req({ authorization: 'Bearer tok' }));
    expect(result).toEqual({ verified: true, userId: 'user-1', currentLevel: 'aal2', reason: 'aal2-verified' });
    expect(getAalMock).toHaveBeenCalledWith('tok');
  });

  it('verweigert fail-closed bei einem unerwarteten Wurf statt zu crashen', async () => {
    getUserMock.mockRejectedValue(new Error('boom'));
    const result = await verifyProviderAal2(req({ authorization: 'Bearer tok' }));
    expect(result.verified).toBe(false);
    expect(result.reason).toBe('internal-error');
  });
});


describe('requireVerifiedAal2 diagnostic supersession stage 0', () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getAalMock.mockReset();
    (isSupabaseConfigured as any).mockReturnValue(true);
  });

  it('still rejects missing primary bearer identity', async () => {
    const result = await requireVerifiedAal2(req());
    expect(result).toEqual({ verified: false, currentLevel: null, reason: 'no-bearer-token' });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('bypasses only AAL2 after the bearer token resolves to a real Supabase user', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const result = await requireVerifiedAal2(req({ authorization: 'Bearer tok' }));

    expect(result).toEqual({
      verified: true,
      userId: 'user-1',
      currentLevel: 'superseded',
      reason: 'aal2-superseded',
    });
    expect(getAalMock).not.toHaveBeenCalled();
  });
});

describe('requireStepUp (gekoppelt an AAL2)', () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getAalMock.mockReset();
    stepUpUpdateResultMock.mockReset();
    eqCallsMock.mockReset();
    (isSupabaseConfigured as any).mockReturnValue(true);
  });

  it('verweigert ohne x-step-up-token-Header, ohne jede Supabase-Abfrage', async () => {
    expect(await requireStepUp(req({ authorization: 'Bearer tok' }), 'test-purpose')).toBe(false);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('Stage 0 entkoppelt den Step-Up-Tokencheck von Provider-AAL2, aber nicht von verifizierter Identität', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    stepUpUpdateResultMock.mockResolvedValue({ data: { id: 'token-row-1' }, error: null });

    const result = await requireStepUp(
      req({ authorization: 'Bearer tok', 'x-step-up-token': 'step-up-abc' }),
      'test-purpose',
    );

    expect(result).toBe(true);
    expect(getAalMock).not.toHaveBeenCalled();
    expect(stepUpUpdateResultMock).toHaveBeenCalled();
  });

  // M9 Independent Evidence Review Finding F2 (2026-08-16): requireStepUp() previously never read
  // back the 'purpose' field stored at issuance, so a token issued for one critical action could be
  // replayed for any other step-up-gated endpoint within its 5-minute window. These tests prove the
  // consumption-side filter is actually wired into the DB query, not just documented.
  it('F2-Fix: verweigert ohne purpose-Argument, ohne jede Supabase-Abfrage (leerer String)', async () => {
    const result = await requireStepUp(req({ authorization: 'Bearer tok', 'x-step-up-token': 'step-up-abc' }), '');
    expect(result).toBe(false);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('F2-Fix: filtert die Token-Abfrage nach dem übergebenen purpose-Wert (nicht nur user_id/token_hash)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null });
    stepUpUpdateResultMock.mockResolvedValue({ data: { id: 'token-row-1' }, error: null });
    await requireStepUp(req({ authorization: 'Bearer tok', 'x-step-up-token': 'step-up-abc' }), 'admin-diagnostics:capability-grant');
    expect(eqCallsMock).toHaveBeenCalledWith('user_id', 'user-1');
    expect(eqCallsMock).toHaveBeenCalledWith('purpose', 'admin-diagnostics:capability-grant');
  });

  it('F2-Fix: ein für einen anderen Zweck ausgestelltes Token wird für den angeforderten Zweck verweigert (kein Treffer in der purpose-gefilterten Abfrage)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null });
    // Simuliert exakt das reale DB-Verhalten: die WHERE-Klausel enthält jetzt purpose = 'break-glass',
    // ein für 'version-bump' ausgestelltes Token erfüllt sie nicht -> kein Zeilentreffer.
    stepUpUpdateResultMock.mockResolvedValue({ data: null, error: null });
    const result = await requireStepUp(req({ authorization: 'Bearer tok', 'x-step-up-token': 'version-bump-token' }), 'systemadmin:break-glass-activate');
    expect(result).toBe(false);
  });

  it('verweigert bei AAL2, aber abgelaufenem/bereits verbrauchtem/fremdem Token', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null });
    stepUpUpdateResultMock.mockResolvedValue({ data: null, error: null });
    const result = await requireStepUp(req({ authorization: 'Bearer tok', 'x-step-up-token': 'step-up-abc' }), 'test-purpose');
    expect(result).toBe(false);
  });

  it('verweigert fail-closed bei einem DB-Fehler waehrend der Token-Konsumierung', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    getAalMock.mockResolvedValue({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null });
    stepUpUpdateResultMock.mockResolvedValue({ data: null, error: { message: 'db unreachable' } });
    const result = await requireStepUp(req({ authorization: 'Bearer tok', 'x-step-up-token': 'step-up-abc' }), 'test-purpose');
    expect(result).toBe(false);
  });

  it('verweigert, wenn Supabase nicht konfiguriert ist', async () => {
    (isSupabaseConfigured as any).mockReturnValue(false);
    const result = await requireStepUp(req({ authorization: 'Bearer tok', 'x-step-up-token': 'step-up-abc' }), 'test-purpose');
    expect(result).toBe(false);
  });
});
