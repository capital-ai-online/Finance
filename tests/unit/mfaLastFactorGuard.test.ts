// Deckt src/lib/mfaLastFactorGuard.ts ab: ein Konto, das per verpflichtendem Onboarding zu
// mindestens einem MFA-Faktor verpflichtet wurde (profiles.mfa_required_account = true), darf
// seinen letzten verbleibenden echten MFA-Faktor nicht entfernen. Primaerlogin-Passkeys zaehlen
// dabei bewusst nicht als AAL2-Faktor. Nicht verpflichtete Konten bleiben frei.

import { beforeEach, describe, expect, it, vi } from 'vitest';

const profilesSelectMock = vi.fn();
const listVerifiedNativeMfaFactorsMock = vi.fn();

vi.mock('../../src/platform/Security/nativeMfa', () => ({
  listVerifiedNativeMfaFactors: (...args: any[]) =>
    listVerifiedNativeMfaFactorsMock(...args),
}));

import { canRemoveLastFactor } from '../../src/lib/mfaLastFactorGuard';

function fakeClient() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: (...args: any[]) => profilesSelectMock(...args),
        }),
      }),
    }),
  } as any;
}

describe('canRemoveLastFactor', () => {
  beforeEach(() => {
    profilesSelectMock.mockReset();
    listVerifiedNativeMfaFactorsMock.mockReset();
  });

  it('erlaubt das Entfernen fuer ein nicht verpflichtetes Konto, ohne Faktoren zu zaehlen', async () => {
    profilesSelectMock.mockResolvedValue({
      data: { mfa_required_account: false, totp_enabled: false },
      error: null,
    });

    const result = await canRemoveLastFactor(fakeClient(), 'user-1', 'native');

    expect(result.allowed).toBe(true);
    expect(listVerifiedNativeMfaFactorsMock).not.toHaveBeenCalled();
  });

  it('verweigert das Entfernen des letzten echten WebAuthn-MFA-Faktors', async () => {
    profilesSelectMock.mockResolvedValue({
      data: { mfa_required_account: true, totp_enabled: false },
      error: null,
    });
    listVerifiedNativeMfaFactorsMock.mockResolvedValue([
      { id: 'webauthn-1', factorType: 'webauthn', status: 'verified' },
    ]);

    const result = await canRemoveLastFactor(fakeClient(), 'user-2', 'native');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it('erlaubt das Entfernen eines WebAuthn-Faktors, wenn ein weiterer nativer TOTP-Faktor verbleibt', async () => {
    profilesSelectMock.mockResolvedValue({
      data: { mfa_required_account: true, totp_enabled: false },
      error: null,
    });
    listVerifiedNativeMfaFactorsMock.mockResolvedValue([
      { id: 'webauthn-1', factorType: 'webauthn', status: 'verified' },
      { id: 'totp-1', factorType: 'totp', status: 'verified' },
    ]);

    const result = await canRemoveLastFactor(fakeClient(), 'user-3', 'native');

    expect(result.allowed).toBe(true);
  });

  it('erlaubt das Entfernen, wenn Legacy-TOTP als verbleibender Faktor bestehen bleibt', async () => {
    profilesSelectMock.mockResolvedValue({
      data: { mfa_required_account: true, totp_enabled: true },
      error: null,
    });
    listVerifiedNativeMfaFactorsMock.mockResolvedValue([
      { id: 'webauthn-1', factorType: 'webauthn', status: 'verified' },
    ]);

    const result = await canRemoveLastFactor(fakeClient(), 'user-4', 'native');

    expect(result.allowed).toBe(true);
  });

  it('zaehlt einen Primaerlogin-Passkey nicht als Ersatz fuer einen echten MFA-Faktor', async () => {
    profilesSelectMock.mockResolvedValue({
      data: { mfa_required_account: true, totp_enabled: false },
      error: null,
    });
    listVerifiedNativeMfaFactorsMock.mockResolvedValue([]);

    const result = await canRemoveLastFactor(fakeClient(), 'user-5', 'passkey');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it('faellt bei fehlendem oder ungeladenem Profil auf erlaubt zurueck', async () => {
    profilesSelectMock.mockResolvedValue({ data: null, error: new Error('db down') });

    const result = await canRemoveLastFactor(fakeClient(), 'user-6', 'native');

    expect(result.allowed).toBe(true);
    expect(listVerifiedNativeMfaFactorsMock).not.toHaveBeenCalled();
  });
});
