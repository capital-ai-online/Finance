// ADR-0064 / ESS-0020 (M5A Slice A): deckt src/platform/Security/nativeMfa.ts ab - der dünne
// Wrapper um supabase.auth.mfa.*. Ein Fehler hier könnte entweder eine unvollständige
// Registrierung als Erfolg melden (Owner glaubt fälschlich, 2FA sei aktiv) oder einen gültigen
// Faktor ablehnen (Owner ausgesperrt), daher volle Positiv-/Negativ-Abdeckung inkl. des
// "unverified factor kein Erfolg"-Exits aus der M5A-Roadmap.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NativeMfaError,
  enrollTotpFactor,
  challengeTotpFactor,
  verifyTotpChallenge,
  getCurrentAssuranceLevel,
  listVerifiedTotpFactors,
  unenrollTotpFactor,
} from '../../src/platform/Security/nativeMfa';

function fakeClient() {
  return {
    auth: {
      mfa: {
        enroll: vi.fn(),
        challenge: vi.fn(),
        verify: vi.fn(),
        getAuthenticatorAssuranceLevel: vi.fn(),
        listFactors: vi.fn(),
        unenroll: vi.fn(),
      },
    },
  } as any;
}

describe('nativeMfa.enrollTotpFactor', () => {
  it('liefert factorId/qrCode/secret/uri bei erfolgreicher Registrierung', async () => {
    const client = fakeClient();
    client.auth.mfa.enroll.mockResolvedValue({
      data: { id: 'factor-1', type: 'totp', totp: { qr_code: '<svg/>', secret: 'SECRET123', uri: 'otpauth://totp/x' } },
      error: null,
    });
    const result = await enrollTotpFactor(client, 'Owner Phone');
    expect(result).toEqual({ factorId: 'factor-1', qrCode: '<svg/>', secret: 'SECRET123', uri: 'otpauth://totp/x' });
    expect(client.auth.mfa.enroll).toHaveBeenCalledWith({ factorType: 'totp', friendlyName: 'Owner Phone' });
  });

  it('wirft NativeMfaError, wenn Supabase einen Fehler zurückgibt', async () => {
    const client = fakeClient();
    client.auth.mfa.enroll.mockResolvedValue({ data: null, error: { message: 'quota exceeded' } });
    await expect(enrollTotpFactor(client)).rejects.toThrow(NativeMfaError);
    await expect(enrollTotpFactor(client)).rejects.toThrow('quota exceeded');
  });

  it('wirft NativeMfaError bei unerwartetem Faktortyp statt totp-Feld zu erraten', async () => {
    const client = fakeClient();
    client.auth.mfa.enroll.mockResolvedValue({ data: { id: 'factor-1', type: 'phone' }, error: null });
    await expect(enrollTotpFactor(client)).rejects.toThrow(NativeMfaError);
  });
});

describe('nativeMfa.challengeTotpFactor', () => {
  it('liefert die challengeId bei Erfolg', async () => {
    const client = fakeClient();
    client.auth.mfa.challenge.mockResolvedValue({ data: { id: 'challenge-1' }, error: null });
    await expect(challengeTotpFactor(client, 'factor-1')).resolves.toBe('challenge-1');
    expect(client.auth.mfa.challenge).toHaveBeenCalledWith({ factorId: 'factor-1' });
  });

  it('lehnt eine leere factorId ab, ohne die API aufzurufen', async () => {
    const client = fakeClient();
    await expect(challengeTotpFactor(client, '')).rejects.toThrow(NativeMfaError);
    expect(client.auth.mfa.challenge).not.toHaveBeenCalled();
  });

  it('wirft NativeMfaError bei Supabase-Fehler', async () => {
    const client = fakeClient();
    client.auth.mfa.challenge.mockResolvedValue({ data: null, error: { message: 'factor not found' } });
    await expect(challengeTotpFactor(client, 'factor-1')).rejects.toThrow('factor not found');
  });
});

describe('nativeMfa.verifyTotpChallenge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lehnt falsch formatierte Codes ab, ohne verify() aufzurufen (kein Netzwerk-Roundtrip für Garbage-Input)', async () => {
    const client = fakeClient();
    await expect(verifyTotpChallenge(client, 'f1', 'c1', '12345')).rejects.toThrow(NativeMfaError);
    await expect(verifyTotpChallenge(client, 'f1', 'c1', 'abcdef')).rejects.toThrow(NativeMfaError);
    expect(client.auth.mfa.verify).not.toHaveBeenCalled();
  });

  it('liefert bei erfolgreicher Verifikation und tatsächlicher AAL2-Sitzung den Assurance Level', async () => {
    const client = fakeClient();
    client.auth.mfa.verify.mockResolvedValue({ data: { access_token: 'tok' }, error: null });
    client.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
      error: null,
    });
    const result = await verifyTotpChallenge(client, 'factor-1', 'challenge-1', '123456');
    expect(result.currentLevel).toBe('aal2');
    expect(client.auth.mfa.verify).toHaveBeenCalledWith({ factorId: 'factor-1', challengeId: 'challenge-1', code: '123456' });
  });

  it('lehnt einen falschen/abgelaufenen Code ab (Supabase verify() liefert Fehler)', async () => {
    const client = fakeClient();
    client.auth.mfa.verify.mockResolvedValue({ data: null, error: { message: 'invalid code' } });
    await expect(verifyTotpChallenge(client, 'factor-1', 'challenge-1', '000000')).rejects.toThrow('invalid code');
    expect(client.auth.mfa.getAuthenticatorAssuranceLevel).not.toHaveBeenCalled();
  });

  it('meldet KEINEN Erfolg, wenn verify() zwar ok ist, die Session danach aber trotzdem nicht aal2 zeigt (unverified factor kein Erfolg)', async () => {
    const client = fakeClient();
    client.auth.mfa.verify.mockResolvedValue({ data: { access_token: 'tok' }, error: null });
    client.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    });
    await expect(verifyTotpChallenge(client, 'factor-1', 'challenge-1', '123456')).rejects.toThrow(NativeMfaError);
  });
});

describe('nativeMfa.getCurrentAssuranceLevel', () => {
  it('liefert currentLevel/nextLevel', async () => {
    const client = fakeClient();
    client.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    });
    await expect(getCurrentAssuranceLevel(client)).resolves.toEqual({ currentLevel: 'aal1', nextLevel: 'aal2' });
  });

  it('wirft NativeMfaError bei Supabase-Fehler statt einen falschen Level zu erraten', async () => {
    const client = fakeClient();
    client.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: null, error: { message: 'network error' } });
    await expect(getCurrentAssuranceLevel(client)).rejects.toThrow('network error');
  });
});

describe('nativeMfa.listVerifiedTotpFactors', () => {
  it('bildet id/friendlyName aus den verifizierten totp-Faktoren ab', async () => {
    const client = fakeClient();
    client.auth.mfa.listFactors.mockResolvedValue({
      data: { all: [], totp: [{ id: 'factor-1', friendly_name: 'Owner Phone' }] },
      error: null,
    });
    await expect(listVerifiedTotpFactors(client)).resolves.toEqual([{ id: 'factor-1', friendlyName: 'Owner Phone' }]);
  });

  it('liefert eine leere Liste, wenn kein totp-Faktor existiert', async () => {
    const client = fakeClient();
    client.auth.mfa.listFactors.mockResolvedValue({ data: { all: [] }, error: null });
    await expect(listVerifiedTotpFactors(client)).resolves.toEqual([]);
  });

  it('wirft NativeMfaError bei Supabase-Fehler', async () => {
    const client = fakeClient();
    client.auth.mfa.listFactors.mockResolvedValue({ data: null, error: { message: 'unauthorized' } });
    await expect(listVerifiedTotpFactors(client)).rejects.toThrow('unauthorized');
  });
});

describe('nativeMfa.unenrollTotpFactor', () => {
  it('ruft unenroll mit der factorId auf', async () => {
    const client = fakeClient();
    client.auth.mfa.unenroll.mockResolvedValue({ data: { id: 'factor-1' }, error: null });
    await expect(unenrollTotpFactor(client, 'factor-1')).resolves.toBeUndefined();
    expect(client.auth.mfa.unenroll).toHaveBeenCalledWith({ factorId: 'factor-1' });
  });

  it('lehnt eine leere factorId ab, ohne die API aufzurufen', async () => {
    const client = fakeClient();
    await expect(unenrollTotpFactor(client, '')).rejects.toThrow(NativeMfaError);
    expect(client.auth.mfa.unenroll).not.toHaveBeenCalled();
  });

  it('wirft NativeMfaError bei Supabase-Fehler', async () => {
    const client = fakeClient();
    client.auth.mfa.unenroll.mockResolvedValue({ data: null, error: { message: 'not found' } });
    await expect(unenrollTotpFactor(client, 'factor-1')).rejects.toThrow('not found');
  });
});
