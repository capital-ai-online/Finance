// ADR-0064 / ESS-0020 (M5A Slice B): Integrationstest über die Grenze Client (nativeMfa.ts,
// browserseitiger Supabase-Client) <-> Server (authMiddleware.ts, requireVerifiedAal2) hinweg.
// Ein reiner Unit-Test pro Seite könnte nicht beweisen, dass eine erfolgreiche Client-Verifikation
// tatsächlich zu einer server-seitig unabhängig nachprüfbaren AAL2-Freigabe führt - genau das ist
// die zentrale M5A-Sicherheitseigenschaft (ADR-0064 Punkt 2: "No browser-only control may
// substitute for server enforcement"). Beide Seiten arbeiten hier gegen denselben simulierten
// Supabase-Auth-Zustand, aber über getrennte Client-Instanzen, exakt wie in Produktion (Browser
// vs. Backend-Prozess).

import { describe, it, expect, vi, beforeEach } from 'vitest';

const VALID_TOKEN = 'valid-session-token';
const USER_ID = 'user-1';
const CORRECT_CODE = '123456';

interface SimulatedFactor {
  id: string;
  verified: boolean;
}

interface SimulatedAuthState {
  aal: 'aal1' | 'aal2';
  factors: SimulatedFactor[];
}

function freshState(): SimulatedAuthState {
  return { aal: 'aal1', factors: [] };
}

function hasVerifiedFactor(state: SimulatedAuthState): boolean {
  return state.factors.some((f) => f.verified);
}

/** Simuliert den browserseitigen Supabase-Client (nutzt die aktuelle lokale Session, kein Token-Parameter). */
function makeClientSupabase(state: SimulatedAuthState) {
  let nextId = 1;
  return {
    auth: {
      mfa: {
        enroll: async () => {
          const id = `factor-${nextId++}`;
          state.factors.push({ id, verified: false });
          return {
            data: { id, type: 'totp', totp: { qr_code: 'data:image/svg+xml;base64,x', secret: 'SIMSECRET', uri: 'otpauth://totp/x' } },
            error: null,
          };
        },
        challenge: async ({ factorId }: { factorId: string }) => {
          if (!state.factors.some((f) => f.id === factorId)) return { data: null, error: { message: 'factor not found' } };
          return { data: { id: `challenge-${factorId}` }, error: null };
        },
        verify: async ({ factorId, code }: { factorId: string; code: string }) => {
          if (code !== CORRECT_CODE) return { data: null, error: { message: 'Invalid TOTP code entered' } };
          const factor = state.factors.find((f) => f.id === factorId);
          if (!factor) return { data: null, error: { message: 'factor not found' } };
          factor.verified = true;
          state.aal = 'aal2';
          return { data: { access_token: VALID_TOKEN, user: { id: USER_ID } }, error: null };
        },
        getAuthenticatorAssuranceLevel: async () => ({
          data: { currentLevel: state.aal, nextLevel: hasVerifiedFactor(state) ? 'aal2' : 'aal1', currentAuthenticationMethods: [] },
          error: null,
        }),
        listFactors: async () => ({
          data: {
            all: state.factors,
            totp: state.factors.filter((f) => f.verified).map((f) => ({ id: f.id, friendly_name: undefined })),
          },
          error: null,
        }),
        unenroll: async ({ factorId }: { factorId: string }) => {
          state.factors = state.factors.filter((f) => f.id !== factorId);
          return { data: { id: factorId }, error: null };
        },
      },
    },
  } as any;
}

/** Simuliert den privilegierten Server-Client - AAL-Antwort hängt ausschließlich vom übergebenen Token ab. */
function makeServerSupabase(state: SimulatedAuthState) {
  return {
    auth: {
      getUser: async (token: string) => {
        if (token !== VALID_TOKEN) return { data: { user: null }, error: { message: 'invalid token' } };
        return { data: { user: { id: USER_ID } }, error: null };
      },
      mfa: {
        getAuthenticatorAssuranceLevel: async (token: string) => {
          if (token !== VALID_TOKEN) return { data: null, error: { message: 'invalid token' } };
          return {
            data: { currentLevel: state.aal, nextLevel: hasVerifiedFactor(state) ? 'aal2' : 'aal1', currentAuthenticationMethods: [] },
            error: null,
          };
        },
      },
    },
  } as any;
}

let sharedState: SimulatedAuthState;

vi.mock('../../server/db', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  getServerSupabase: vi.fn(() => makeServerSupabase(sharedState)),
}));

import { verifyProviderAal2 } from '../../src/platform/Security/authMiddleware';
import {
  enrollTotpFactor,
  challengeTotpFactor,
  verifyTotpChallenge,
  NativeMfaError,
} from '../../src/platform/Security/nativeMfa';

function req(token?: string) {
  return { headers: token ? { authorization: `Bearer ${token}` } : {}, requestId: 'itest' } as any;
}

describe('native MFA enroll/challenge/verify -> server AAL2 gate (end-to-end)', () => {
  beforeEach(() => {
    sharedState = freshState();
  });

  it('verweigert AAL2 serverseitig, solange kein Faktor verifiziert wurde', async () => {
    const result = await verifyProviderAal2(req(VALID_TOKEN));
    expect(result.verified).toBe(false);
    expect(result.reason).toBe('insufficient-aal');
  });

  it('ein falscher Verifikationscode erzeugt weder clientseitig Erfolg noch serverseitig AAL2', async () => {
    const client = makeClientSupabase(sharedState);
    const enrollment = await enrollTotpFactor(client, 'Integration Test Device');
    const challengeId = await challengeTotpFactor(client, enrollment.factorId);

    await expect(verifyTotpChallenge(client, enrollment.factorId, challengeId, '000000')).rejects.toThrow(NativeMfaError);

    const serverResult = await verifyProviderAal2(req(VALID_TOKEN));
    expect(serverResult.verified).toBe(false);
    expect(serverResult.reason).toBe('insufficient-aal');
  });

  it('erfolgreiche Client-Verifikation führt zu einer unabhängig serverseitig nachprüfbaren AAL2-Freigabe', async () => {
    const client = makeClientSupabase(sharedState);

    const enrollment = await enrollTotpFactor(client, 'Integration Test Device');
    expect(enrollment.factorId).toBeTruthy();

    const challengeId = await challengeTotpFactor(client, enrollment.factorId);
    const clientLevel = await verifyTotpChallenge(client, enrollment.factorId, challengeId, CORRECT_CODE);
    expect(clientLevel.currentLevel).toBe('aal2');

    // Die serverseitige Prüfung liest NICHT das Client-Ergebnis, sondern fragt unabhängig über
    // den (in diesem Test denselben, in Produktion per Bearer-Header übertragenen) Token nach.
    const serverResult = await verifyProviderAal2(req(VALID_TOKEN));
    expect(serverResult).toEqual({ verified: true, userId: USER_ID, currentLevel: 'aal2', reason: 'aal2-verified' });
  });

  it('ein gültiger Faktor auf dem Server-Client hilft nichts, wenn der vorgelegte Token ungültig ist - kein Vertrauen in Client-Zustand', async () => {
    const client = makeClientSupabase(sharedState);
    const enrollment = await enrollTotpFactor(client);
    const challengeId = await challengeTotpFactor(client, enrollment.factorId);
    await verifyTotpChallenge(client, enrollment.factorId, challengeId, CORRECT_CODE);

    const serverResult = await verifyProviderAal2(req('some-other-forged-token'));
    expect(serverResult.verified).toBe(false);
    expect(serverResult.reason).toBe('invalid-token');
  });

  it('fehlender Bearer-Token wird serverseitig unabhängig vom Client-Zustand verweigert', async () => {
    const client = makeClientSupabase(sharedState);
    const enrollment = await enrollTotpFactor(client);
    const challengeId = await challengeTotpFactor(client, enrollment.factorId);
    await verifyTotpChallenge(client, enrollment.factorId, challengeId, CORRECT_CODE);

    const serverResult = await verifyProviderAal2(req());
    expect(serverResult.verified).toBe(false);
    expect(serverResult.reason).toBe('no-bearer-token');
  });
});
