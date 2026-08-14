// Deckt src/lib/mfaLastFactorGuard.ts ab: ein Konto, das per verpflichtendem Onboarding zu
// mindestens einem MFA-Faktor verpflichtet wurde (profiles.mfa_required_account = true), darf
// seinen letzten verbleibenden Faktor nicht entfernen. Nicht verpflichtete Konten bleiben frei.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const profilesSelectMock = vi.fn();
const passkeyListMock = vi.fn();
const listVerifiedTotpFactorsMock = vi.fn();

vi.mock('../../src/platform/Security/nativeMfa', () => ({
  listVerifiedTotpFactors: (...args: any[]) => listVerifiedTotpFactorsMock(...args),
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
    auth: {
      passkey: {
        list: (...args: any[]) => passkeyListMock(...args),
      },
    },
  } as any;
}

describe('canRemoveLastFactor', () => {
  beforeEach(() => {
    profilesSelectMock.mockReset();
    passkeyListMock.mockReset();
    listVerifiedTotpFactorsMock.mockReset();
  });

  it('erlaubt das Entfernen fuer ein nicht verpflichtetes Konto, ohne Faktoren zu zaehlen', async () => {
    profilesSelectMock.mockResolvedValue({ data: { mfa_required_account: false, totp_enabled: false }, error: null });
    const result = await canRemoveLastFactor(fakeClient(), 'user-1', 'passkey');
    expect(result.allowed).toBe(true);
    expect(passkeyListMock).not.toHaveBeenCalled();
    expect(listVerifiedTotpFactorsMock).not.toHaveBeenCalled();
  });

  it('verweigert das Entfernen des letzten Passkeys bei einem verpflichteten Konto ohne weitere Faktoren', async () => {
    profilesSelectMock.mockResolvedValue({ data: { mfa_required_account: true, totp_enabled: false }, error: null });
    passkeyListMock.mockResolvedValue({ data: [{ id: 'pk-1' }] });
    listVerifiedTotpFactorsMock.mockResolvedValue([]);
    const result = await canRemoveLastFactor(fakeClient(), 'user-2', 'passkey');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it('erlaubt das Entfernen eines Passkeys, wenn zusaetzlich noch ein natives TOTP existiert', async () => {
    profilesSelectMock.mockResolvedValue({ data: { mfa_required_account: true, totp_enabled: false }, error: null });
    passkeyListMock.mockResolvedValue({ data: [{ id: 'pk-1' }] });
    listVerifiedTotpFactorsMock.mockResolvedValue([{ id: 'totp-1' }]);
    const result = await canRemoveLastFactor(fakeClient(), 'user-3', 'passkey');
    expect(result.allowed).toBe(true);
  });

  it('erlaubt das Entfernen, wenn Legacy-TOTP als verbleibender Faktor bestehen bleibt', async () => {
    profilesSelectMock.mockResolvedValue({ data: { mfa_required_account: true, totp_enabled: true }, error: null });
    passkeyListMock.mockResolvedValue({ data: [{ id: 'pk-1' }] });
    listVerifiedTotpFactorsMock.mockResolvedValue([]);
    const result = await canRemoveLastFactor(fakeClient(), 'user-4', 'passkey');
    expect(result.allowed).toBe(true);
  });

  it('faellt bei fehlendem/ungeladenem Profil auf "erlaubt" zurueck (fail-open)', async () => {
    profilesSelectMock.mockResolvedValue({ data: null, error: new Error('db down') });
    const result = await canRemoveLastFactor(fakeClient(), 'user-5', 'passkey');
    expect(result.allowed).toBe(true);
  });
});
