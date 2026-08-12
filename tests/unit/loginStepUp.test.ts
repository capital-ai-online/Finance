// M5A coverage for src/lib/loginStepUp.ts: Supabase Native MFA/AAL is authoritative
// for TOTP assurance. Lookup failures must not silently degrade a potentially
// privileged MFA requirement to "none".

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const passkeyListMock = vi.fn();
const aalMock = vi.fn();
const factorListMock = vi.fn();

vi.mock('../../src/supabaseClient', () => ({
  supabase: {
    auth: {
      passkey: {
        list: (...args: any[]) => passkeyListMock(...args),
      },
      mfa: {
        getAuthenticatorAssuranceLevel: (...args: any[]) => aalMock(...args),
        listFactors: (...args: any[]) => factorListMock(...args),
      },
    },
  },
}));

import {
  loginStepUpRequirement,
  hasPassedLoginStepUpThisTab,
  markLoginStepUpPassed,
  clearLoginStepUpMarkers,
} from '../../src/lib/loginStepUp';

function session(userId: string, anonymous = false) {
  return { user: { id: userId, is_anonymous: anonymous } };
}

describe('loginStepUpRequirement', () => {
  beforeEach(() => {
    passkeyListMock.mockReset();
    aalMock.mockReset();
    factorListMock.mockReset();
  });

  it('verlangt keinen Step-Up fuer anonyme Nutzer und fragt keine Faktoren ab', async () => {
    expect(await loginStepUpRequirement(session('anon-1', true))).toBe('none');
    expect(aalMock).not.toHaveBeenCalled();
    expect(factorListMock).not.toHaveBeenCalled();
    expect(passkeyListMock).not.toHaveBeenCalled();
  });

  it('liefert none fuer eine bereits vollstaendig verifizierte aal2/aal2 Session', async () => {
    aalMock.mockResolvedValue({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null });
    expect(await loginStepUpRequirement(session('user-1'))).toBe('none');
    expect(factorListMock).not.toHaveBeenCalled();
    expect(passkeyListMock).not.toHaveBeenCalled();
  });

  it('verlangt Native TOTP fuer aal1/aal2 auch wenn ein Passkey existiert', async () => {
    aalMock.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null });
    passkeyListMock.mockResolvedValue({ data: [{ id: 'pk-1' }], error: null });
    expect(await loginStepUpRequirement(session('user-1'))).toBe('totp');
    expect(passkeyListMock).not.toHaveBeenCalled();
  });

  it('verlangt TOTP wenn ein verifizierter Native-TOTP-Faktor vorhanden ist', async () => {
    aalMock.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null });
    factorListMock.mockResolvedValue({
      data: { totp: [{ id: 'totp-1', status: 'verified' }] },
      error: null,
    });
    expect(await loginStepUpRequirement(session('user-1'))).toBe('totp');
  });

  it('laesst Passkey nur zu wenn Native MFA fuer die Session nicht erforderlich ist', async () => {
    aalMock.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null });
    factorListMock.mockResolvedValue({ data: { totp: [] }, error: null });
    passkeyListMock.mockResolvedValue({ data: [{ id: 'pk-1' }], error: null });
    expect(await loginStepUpRequirement(session('user-1'))).toBe('passkey');
  });

  it('liefert none wenn weder Native MFA noch Passkey erforderlich ist', async () => {
    aalMock.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null });
    factorListMock.mockResolvedValue({ data: { totp: [] }, error: null });
    passkeyListMock.mockResolvedValue({ data: [], error: null });
    expect(await loginStepUpRequirement(session('user-1'))).toBe('none');
  });

  it('bleibt fail-closed wenn der AAL-Lookup fehlschlaegt', async () => {
    aalMock.mockResolvedValue({ data: null, error: new Error('auth unavailable') });
    expect(await loginStepUpRequirement(session('user-1'))).toBe('totp');
    expect(passkeyListMock).not.toHaveBeenCalled();
  });

  it('bleibt fail-closed wenn die Faktor-Liste nicht verifiziert werden kann', async () => {
    aalMock.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null });
    factorListMock.mockRejectedValue(new Error('factor service unavailable'));
    expect(await loginStepUpRequirement(session('user-1'))).toBe('totp');
  });
});

describe('Login-Step-Up sessionStorage-Marker', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    passkeyListMock.mockReset();
    aalMock.mockReset();
    factorListMock.mockReset();
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

  it('ein gesetzter Marker verhindert erneute AAL-/Faktor-Abfragen fuer denselben Nutzer', async () => {
    markLoginStepUpPassed('user-1');
    expect(await loginStepUpRequirement(session('user-1'))).toBe('none');
    expect(aalMock).not.toHaveBeenCalled();
    expect(factorListMock).not.toHaveBeenCalled();
  });

  it('der Marker ist strikt pro Nutzer-ID', async () => {
    markLoginStepUpPassed('user-1');
    aalMock.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null });
    expect(await loginStepUpRequirement(session('user-2'))).toBe('totp');
  });

  it('clearLoginStepUpMarkers entfernt Marker alter und neuer Versionen', () => {
    markLoginStepUpPassed('user-1');
    store.set('capitalai:loginStepUp:v1:user-legacy', '1');
    clearLoginStepUpMarkers();
    expect(hasPassedLoginStepUpThisTab('user-1')).toBe(false);
    expect(store.size).toBe(0);
  });
});
