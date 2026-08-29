// Deckt src/lib/onboarding.ts ab: neue Registrierungen (profiles.onboarding_required = true)
// muessen vor dem Dashboard-Zugriff durch RegistrationCompletionGate laufen; bestehende Konten
// (onboarding_required = false, per Migration rueckwirkend gesetzt) bleiben unberuehrt.
// Nicht verifizierbare Profile-/DB-Zustaende muessen fail-closed abbrechen.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const profilesSelectMock = vi.fn();

vi.mock('../../src/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: (...args: any[]) => profilesSelectMock(...args),
        }),
      }),
    }),
  },
}));

import { needsOnboarding } from '../../src/lib/onboarding';

function session(userId: string, anonymous = false) {
  return { user: { id: userId, is_anonymous: anonymous } };
}

describe('needsOnboarding', () => {
  beforeEach(() => {
    profilesSelectMock.mockReset();
  });

  it('verlangt kein Onboarding fuer anonyme Nutzer und fragt profiles nicht ab', async () => {
    const result = await needsOnboarding(session('anon-1', true));
    expect(result).toBe(false);
    expect(profilesSelectMock).not.toHaveBeenCalled();
  });

  it('liefert true fuer ein neues Konto mit onboarding_required = true', async () => {
    profilesSelectMock.mockResolvedValue({ data: { onboarding_required: true }, error: null });
    const result = await needsOnboarding(session('user-1'));
    expect(result).toBe(true);
  });

  it('liefert false fuer ein bestehendes/rueckwirkend befreites Konto', async () => {
    profilesSelectMock.mockResolvedValue({ data: { onboarding_required: false }, error: null });
    const result = await needsOnboarding(session('user-2'));
    expect(result).toBe(false);
  });

  it('blockiert bei fehlendem profiles-Datensatz statt Onboarding zu umgehen', async () => {
    profilesSelectMock.mockResolvedValue({ data: null, error: null });
    await expect(needsOnboarding(session('user-3'))).rejects.toThrow(
      'Profil fehlt; Onboarding-Status nicht verifizierbar.',
    );
  });

  it('blockiert bei DB-Fehler fail-closed', async () => {
    profilesSelectMock.mockResolvedValue({ data: null, error: new Error('db down') });
    await expect(needsOnboarding(session('user-4'))).rejects.toThrow(
      'Status konnte nicht geladen werden.',
    );
  });
});
