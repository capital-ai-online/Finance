// M10 (ADR-0066, ESS-0022) Phase 3 — Owner Credential Enrollment.
//
// Per the runbook: "Owner passkey enrollment is a Human/Owner identity operation ... Agents may
// assist with UI/code but cannot autonomously enroll, replace or revoke Owner credentials." This
// module IS the "assist with code" part - the functions below are only ever meaningful when
// invoked by a real, already-authenticated Owner HTTP request (mirroring activateBreakGlass():
// an agent-built function that structurally refuses anything but the canonical Owner actor id, and
// that no agent in this codebase calls autonomously against production). The actual WebAuthn
// ceremony - the Owner physically touching their authenticator - can only happen in a real browser
// session; nothing here can perform, simulate, or bypass that.
//
// Real cryptographic attestation verification (COSE key parsing, CBOR decoding, signature
// verification) is delegated to @simplewebauthn/server rather than hand-rolled - see the Owner
// decision recorded in docs/evidence/m10/M10_PHASE3_OWNER_CREDENTIAL_ENROLLMENT_2026-08-17.md.
// This module's own responsibility is orchestration: RP/origin binding, challenge single-use
// enforcement, and persisting only the minimal public credential material ADR-0066 §7 allows -
// never a private key, biometric data, or the raw attestation object.
import {
  generateRegistrationOptions as realGenerateRegistrationOptions,
  verifyRegistrationResponse as realVerifyRegistrationResponse,
  type GenerateRegistrationOptionsOpts,
  type PublicKeyCredentialCreationOptionsJSON,
  type RegistrationResponseJSON,
  type VerifyRegistrationResponseOpts,
} from '@simplewebauthn/server';
import { SYSTEMADMIN_OWNER_ACTOR_ID } from '../../src/platform/Security/roadmapExecutionMandate';

/**
 * Mirrors server/middleware/cors.ts's PRODUCTION_ORIGINS - kept as a separate literal rather than
 * importing it (that constant isn't exported, and a mismatch here fails closed via WebAuthn origin
 * verification rather than silently weakening anything, so duplication carries no security risk).
 */
export const M10_RP_ID = 'capital-ai.online';
export const M10_RP_NAME = 'CAPITAL-AI';
export const M10_EXPECTED_ORIGINS = ['https://capital-ai.online', 'https://www.capital-ai.online'] as const;

/** Mirrors the Phase 2 challenge TTL rationale (server/m10/challengeIssuance.ts). */
export const M10_REGISTRATION_CHALLENGE_TTL_MS = 2 * 60 * 1000;

function nowMs(value: string | number | Date | undefined): number {
  if (value === undefined) return Date.now();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return Date.parse(value);
}

function ownerUserHandle(ownerId: string): Uint8Array {
  return new TextEncoder().encode(ownerId);
}

// ---- Registration challenge lifecycle (separate from the Phase 2 PR-authorization challenge -----
// ---- store: different binding context, no PR/repo fields, kept as its own small type rather ----
// ---- than a shared generic, matching this codebase's stated preference for a few similar lines --
// ---- over a premature abstraction). -------------------------------------------------------------

export interface M10RegistrationChallenge {
  challengeId: string;
  /** The base64url challenge @simplewebauthn generated - given to the browser, not a bearer secret. */
  challenge: string;
  ownerId: string;
  issuedAt: string;
  expiresAt: string;
}

export type M10RegistrationChallengeState = 'UNUSED' | 'CONSUMED';

export interface StoredM10RegistrationChallenge {
  challenge: Readonly<M10RegistrationChallenge>;
  state: M10RegistrationChallengeState;
}

export interface M10RegistrationChallengeStore {
  save(record: Readonly<StoredM10RegistrationChallenge>): Promise<void>;
  get(challengeId: string): Promise<Readonly<StoredM10RegistrationChallenge> | null>;
  /** Atomically transitions UNUSED -> CONSUMED. Returns false if not found or already consumed. */
  markConsumed(challengeId: string): Promise<boolean>;
}

export function isM10RegistrationChallengeValidForUse(
  record: Readonly<Pick<StoredM10RegistrationChallenge, 'state'> & { challenge: Readonly<Pick<M10RegistrationChallenge, 'issuedAt' | 'expiresAt'>> }>,
  now?: string | number | Date,
): boolean {
  if (record.state !== 'UNUSED') return false;
  const currentMs = nowMs(now);
  if (!Number.isFinite(currentMs)) return false;
  return currentMs >= Date.parse(record.challenge.issuedAt) && currentMs < Date.parse(record.challenge.expiresAt);
}

/** Reference in-memory store - see server/m10/challengeIssuance.ts for the identical rationale. */
export function createInMemoryM10RegistrationChallengeStore(): M10RegistrationChallengeStore {
  const records = new Map<string, StoredM10RegistrationChallenge>();
  return {
    async save(record) {
      records.set(record.challenge.challengeId, record);
    },
    async get(challengeId) {
      return records.get(challengeId) ?? null;
    },
    async markConsumed(challengeId) {
      const existing = records.get(challengeId);
      if (!existing || existing.state !== 'UNUSED') return false;
      records.set(challengeId, { ...existing, state: 'CONSUMED' });
      return true;
    },
  };
}

// ---- Durable credential registry ------------------------------------------------------------

export interface M10StoredCredential {
  credentialId: string;
  ownerId: string;
  /** base64url-encoded PUBLIC key bytes only. Never a private key - none is ever available to this module. */
  publicKey: string;
  counter: number;
  transports: readonly string[];
  deviceType: 'singleDevice' | 'multiDevice';
  backedUp: boolean;
  aaguid: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface M10CredentialStore {
  save(credential: Readonly<M10StoredCredential>): Promise<void>;
  listActiveForOwner(ownerId: string): Promise<readonly Readonly<M10StoredCredential>[]>;
  /** Atomically transitions active -> revoked. Returns false if not found or already revoked. */
  revoke(credentialId: string): Promise<boolean>;
}

/**
 * Reference in-memory store. Unlike the Phase 2 PR-authorization challenge (a few minutes'
 * lifespan), an enrolled credential MUST survive process restarts to ever be useful - this
 * in-memory implementation is explicitly NOT a production choice, only a testable placeholder; the
 * real backend (almost certainly a durable Supabase table, mirroring step_up_tokens) is a
 * deliberate live-wiring decision, not made in this logic-only step.
 */
export function createInMemoryM10CredentialStore(): M10CredentialStore {
  const records = new Map<string, M10StoredCredential>();
  return {
    async save(credential) {
      records.set(credential.credentialId, credential);
    },
    async listActiveForOwner(ownerId) {
      return [...records.values()].filter(c => c.ownerId === ownerId && c.revokedAt === null);
    },
    async revoke(credentialId) {
      const existing = records.get(credentialId);
      if (!existing || existing.revokedAt !== null) return false;
      records.set(credentialId, { ...existing, revokedAt: new Date().toISOString() });
      return true;
    },
  };
}

// ---- Enrollment ceremony ----------------------------------------------------------------------

export interface BeginM10CredentialEnrollmentDeps {
  challengeStore: M10RegistrationChallengeStore;
  credentialStore: M10CredentialStore;
  /** Injected so tests never have to drive a real random-challenge WebAuthn options ceremony. */
  generateOptions?: (opts: GenerateRegistrationOptionsOpts) => Promise<PublicKeyCredentialCreationOptionsJSON>;
  now?: string | number | Date;
}

export type BeginEnrollmentResult =
  | { verdict: 'CHALLENGE_ISSUED'; challengeId: string; options: PublicKeyCredentialCreationOptionsJSON }
  | { verdict: 'DENY'; reason: string };

/**
 * Prepares a registration ceremony for the Owner to complete in their own browser. Structurally
 * refuses any ownerId other than the canonical Owner actor id - this module never widens who can
 * enroll a credential, it only prepares the ceremony a real, separately-authenticated Owner session
 * would invoke. Excludes the Owner's already-registered active credentials so the same authenticator
 * cannot be registered twice, and requires User Verification (ADR-0066 §4 requirement 9) rather than
 * the library's more permissive 'preferred' default.
 */
export async function beginM10CredentialEnrollment(
  ownerId: string,
  deps: Readonly<BeginM10CredentialEnrollmentDeps>,
): Promise<BeginEnrollmentResult> {
  if (ownerId !== SYSTEMADMIN_OWNER_ACTOR_ID) {
    return { verdict: 'DENY', reason: 'Nur der kanonische CAPITAL-AI Owner kann einen Passkey registrieren.' };
  }

  const activeCredentials = await deps.credentialStore.listActiveForOwner(ownerId);
  const generate = deps.generateOptions ?? realGenerateRegistrationOptions;

  let options: PublicKeyCredentialCreationOptionsJSON;
  try {
    options = await generate({
      rpName: M10_RP_NAME,
      rpID: M10_RP_ID,
      userName: ownerId,
      userID: ownerUserHandle(ownerId),
      attestationType: 'none',
      excludeCredentials: activeCredentials.map(c => ({ id: c.credentialId, transports: c.transports as any })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
    });
  } catch (err: any) {
    return { verdict: 'DENY', reason: `Registrierungs-Optionen konnten nicht erzeugt werden: ${err?.message || String(err)}` };
  }

  const issuedAtMs = nowMs(deps.now);
  if (!Number.isFinite(issuedAtMs)) return { verdict: 'DENY', reason: 'Ungültiger Ausstellungszeitpunkt.' };
  const expiresAtMs = issuedAtMs + M10_REGISTRATION_CHALLENGE_TTL_MS;

  const challengeId = options.challenge;
  await deps.challengeStore.save({
    challenge: {
      challengeId,
      challenge: options.challenge,
      ownerId,
      issuedAt: new Date(issuedAtMs).toISOString(),
      expiresAt: new Date(expiresAtMs).toISOString(),
    },
    state: 'UNUSED',
  });

  return { verdict: 'CHALLENGE_ISSUED', challengeId, options };
}

export interface CompleteM10CredentialEnrollmentDeps {
  challengeStore: M10RegistrationChallengeStore;
  credentialStore: M10CredentialStore;
  /** Injected so tests can simulate both a verified and a rejected attestation without a real authenticator. */
  verifyResponse?: (opts: VerifyRegistrationResponseOpts) => ReturnType<typeof realVerifyRegistrationResponse>;
  now?: string | number | Date;
}

export type CompleteEnrollmentResult =
  | { verdict: 'ENROLLED'; credential: Readonly<M10StoredCredential> }
  | { verdict: 'DENY'; reason: string };

/**
 * Verifies the browser's attestation response against the exact challenge that was issued for this
 * Owner, then persists only the minimal public credential material. The challenge is consumed
 * (UNUSED -> CONSUMED) on every attempt, verified or not, so a rejected forged response cannot be
 * retried against the same live challenge.
 */
export async function completeM10CredentialEnrollment(
  ownerId: string,
  challengeId: string,
  response: RegistrationResponseJSON,
  deps: Readonly<CompleteM10CredentialEnrollmentDeps>,
): Promise<CompleteEnrollmentResult> {
  if (ownerId !== SYSTEMADMIN_OWNER_ACTOR_ID) {
    return { verdict: 'DENY', reason: 'Nur der kanonische CAPITAL-AI Owner kann einen Passkey registrieren.' };
  }

  const stored = await deps.challengeStore.get(challengeId);
  if (!stored) return { verdict: 'DENY', reason: 'Unbekannte oder abgelaufene Registrierungs-Challenge.' };
  if (stored.challenge.ownerId !== ownerId) {
    return { verdict: 'DENY', reason: 'Challenge wurde nicht für diesen Owner ausgestellt.' };
  }
  if (!isM10RegistrationChallengeValidForUse(stored, deps.now)) {
    return { verdict: 'DENY', reason: 'Registrierungs-Challenge ist abgelaufen, verbraucht oder ungültig.' };
  }

  const consumed = await deps.challengeStore.markConsumed(challengeId);
  if (!consumed) return { verdict: 'DENY', reason: 'Registrierungs-Challenge wurde bereits verbraucht (Replay).' };

  const verify = deps.verifyResponse ?? realVerifyRegistrationResponse;
  let result: Awaited<ReturnType<typeof realVerifyRegistrationResponse>>;
  try {
    result = await verify({
      response,
      expectedChallenge: stored.challenge.challenge,
      expectedOrigin: [...M10_EXPECTED_ORIGINS],
      expectedRPID: M10_RP_ID,
      requireUserVerification: true,
    });
  } catch (err: any) {
    return { verdict: 'DENY', reason: `Attestation-Verifikation fehlgeschlagen: ${err?.message || String(err)}` };
  }

  if (!result.verified) {
    return { verdict: 'DENY', reason: 'WebAuthn-Attestation konnte nicht verifiziert werden.' };
  }

  const { credential: webAuthnCredential, aaguid, credentialDeviceType, credentialBackedUp } = result.registrationInfo;

  const stored_credential: M10StoredCredential = {
    credentialId: webAuthnCredential.id,
    ownerId,
    publicKey: Buffer.from(webAuthnCredential.publicKey).toString('base64url'),
    counter: webAuthnCredential.counter,
    transports: webAuthnCredential.transports ?? [],
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    aaguid,
    createdAt: new Date(nowMs(deps.now)).toISOString(),
    revokedAt: null,
  };

  await deps.credentialStore.save(stored_credential);

  return { verdict: 'ENROLLED', credential: stored_credential };
}

export type RevokeCredentialResult =
  | { verdict: 'REVOKED' }
  | { verdict: 'DENY'; reason: string };

/**
 * Owner-only credential revocation (ESS-0022 §9 "support credential revocation/re-enrollment").
 * Like the enroll functions above, this is code an agent may build but never a call an agent may
 * make on its own initiative - only a real, separately-authenticated Owner action invokes it.
 */
export async function revokeM10Credential(
  ownerId: string,
  credentialId: string,
  deps: Readonly<{ credentialStore: M10CredentialStore }>,
): Promise<RevokeCredentialResult> {
  if (ownerId !== SYSTEMADMIN_OWNER_ACTOR_ID) {
    return { verdict: 'DENY', reason: 'Nur der kanonische CAPITAL-AI Owner kann einen Passkey widerrufen.' };
  }
  const revoked = await deps.credentialStore.revoke(credentialId);
  if (!revoked) return { verdict: 'DENY', reason: 'Unbekanntes oder bereits widerrufenes Credential.' };
  return { verdict: 'REVOKED' };
}
