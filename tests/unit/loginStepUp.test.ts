// Deckt src/lib/loginStepUp.ts ab: Passkey/2FA muessen tatsaechlich beim Login erzwungen werden
// (nicht nur aktivierbar sein), mit Passkey-Prioritaet vor TOTP und Fail-open bei DB-Fehlern,
// damit ein profiles-Ausfall nicht jeden Nutzer aus der App aussperrt.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const passkeyListMock = vi.fn();
const profilesSelectMock = vi.fn();

vi.mock('../../src/supabaseClient', () => ({
  supabase: {
    auth: {
      passkey: {
        list: (...args: any[]) => passkeyListMock(...args),
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: (...args: any[]) => profilesSelectMock(...args),
        }),
      }),
    }),
  },
}));

import { loginStepUpRequirement, hasPassedLoginStepUpThisTab, markLoginStepUpPassed, clearLoginStepUpMarkers } from '../../src/lib/loginStepUp';

function session(userId: string, anonymous = false) {
  return { user: { id: userId, is_anonymous: anonymous } };
}

describe('loginStepUpRequirement', () => {
  beforeEach(() => {
    passkeyListMock.mockReset();
    profilesSelectMock.mockReset();
  });

  it('verlangt keinen Step-Up fuer anonyme Nutzer und fragt weder Passkeys noch profiles ab', async () => {
    const result = await loginStepUpRequirement(session('anon-1', true));
    expect(result).toBe('none');
    expect(passkeyListMock).not.toHaveBeenCalled();
    expect(profilesSelectMock).not.toHaveBeenCalled();
  });

  it('liefert none, wenn weder Passkey noch 2FA aktiv sind', async () => {
    passkeyListMock.mockResolvedValue({ data: [], error: null });
    profilesSelectMock.mockResolvedValue({ data: { totp_enabled: false }, error: null });
    expect(await loginStepUpRequirement(session('user-1'))).toBe('none');
  });

  it('Passkey hat Vorrang vor 2FA, auch wenn beide aktiv sind', async () => {
    passkeyListMock.mockResolvedValue({ data: [{ id: 'pk-1' }], error: null });
    profilesSelectMock.mockResolvedValue({ data: { totp_enabled: true }, error: null });
    expect(await loginStepUpRequirement(session('user-1'))).toBe('passkey');
    // Bei registriertem Passkey wird 2FA gar nicht erst geprueft (Prioritaet).
    expect(profilesSelectMock).not.toHaveBeenCalled();
  });

  it('verlangt 2FA, wenn kein Passkey registriert, aber 2FA aktiv ist', async () => {
    passkeyListMock.mockResolvedValue({ data: [], error: null });
    profilesSelectMock.mockResolvedValue({ data: { totp_enabled: true }, error: null });
    expect(await loginStepUpRequirement(session('user-1'))).toBe('totp');
  });

  it('ist fail-open bei einem Fehler bei der Passkey-Abfrage und prueft trotzdem noch 2FA', async () => {
    passkeyListMock.mockRejectedValue(new Error('network down'));
    profilesSelectMock.mockResolvedValue({ data: { totp_enabled: true }, error: null });
    expect(await loginStepUpRequirement(session('user-1'))).toBe('totp');
  });

  it('ist fail-open (none) bei einem Fehler bei der profiles-Abfrage, statt jeden Login zu sperren', async () => {
    passkeyListMock.mockResolvedValue({ data: [], error: null });
    profilesSelectMock.mockRejectedValue(new Error('db unreachable'));
    expect(await loginStepUpRequirement(session('user-1'))).toBe('none');
  });

  it('ist fail-open (none), wenn sowohl Passkey- als auch profiles-Abfrage fehlschlagen', async () => {
    passkeyListMock.mockResolvedValue({ data: null, error: new Error('passkey service down') });
    profilesSelectMock.mockRejectedValue(new Error('db unreachable'));
    expect(await loginStepUpRequirement(session('user-1'))).toBe('none');
  });
});

describe('Login-Step-Up sessionStorage-Marker', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    passkeyListMock.mockReset();
    profilesSelectMock.mockReset();
    store = new Map();
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
        key: (i: number) => Array.from(store.keys())[i] ?? null,
        get length() {
          return store.size;
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('markLoginStepUpPassed setzt einen Marker, den hasPassedLoginStepUpThisTab erkennt', () => {
    expect(hasPassedLoginStepUpThisTab('user-1')).toBe(false);
    markLoginStepUpPassed('user-1');
    expect(hasPassedLoginStepUpThisTab('user-1')).toBe(true);
  });

  it('ein gesetzter Marker verhindert erneute Passkey-/profiles-Abfragen fuer denselben Nutzer', async () => {
    markLoginStepUpPassed('user-1');
    expect(await loginStepUpRequirement(session('user-1'))).toBe('none');
    expect(passkeyListMock).not.toHaveBeenCalled();
    expect(profilesSelectMock).not.toHaveBeenCalled();
  });

  it('der Marker ist strikt pro Nutzer-ID - ein anderer Nutzer im selben Tab wird weiterhin geprueft', async () => {
    markLoginStepUpPassed('user-1');
    passkeyListMock.mockResolvedValue({ data: [{ id: 'pk-1' }], error: null });
    expect(await loginStepUpRequirement(session('user-2'))).toBe('passkey');
  });

  it('clearLoginStepUpMarkers entfernt alle gesetzten Marker', () => {
    markLoginStepUpPassed('user-1');
    markLoginStepUpPassed('user-2');
    clearLoginStepUpMarkers();
    expect(hasPassedLoginStepUpThisTab('user-1')).toBe(false);
    expect(hasPassedLoginStepUpThisTab('user-2')).toBe(false);
  });
});
