// M10 (ADR-0066, ESS-0022) Phase 4 — WebAuthn assertion verification.
//
// This module is intentionally logic-only. It verifies a real Owner assertion against a freshly
// re-resolved GitHub PR state and emits immutable approval evidence through injected stores. It does
// NOT dispatch CI and does NOT implement Phase 5 atomic CI consumption. Production wiring is blocked
// until the Phase-2 authorization-challenge store and the Phase-4 approval-evidence store are durable.
import {
  verifyAuthenticationResponse as realVerifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import { generateOpaqueToken } from '../../src/platform/Security/secretCrypto';
import { SYSTEMADMIN_OWNER_ACTOR_ID } from '../../src/platform/Security/roadmapExecutionMandate';
import {
  computeCanonicalAuthorizationDigest,
  isM10ChallengeValidForUse,
  type M10ChallengeContext,
  type M10ChallengeStore,
} from './challengeIssuance';
import { resolveTrustedPrState, type GithubApiFetch } from './githubPrStateResolver';
import {
  M10_EXPECTED_ORIGINS,
  M10_RP_ID,
  type M10StoredCredential,
} from './credentialEnrollment';

export interface M10AssertionCredentialStore {
  listActiveForOwner(ownerId: string): Promise<readonly Readonly<M10StoredCredential>[]>;
  /** Atomically updates the signature counter only if the stored counter still equals expectedCounter. */
  updateCounter(credentialId: string, expectedCounter: number, newCounter: number): Promise<boolean>;
}

export interface M10ApprovalEvidence {
  approvalId: string;
  ownerId: string;
  credentialId: string;
  challengeId: string;
  authorizationDigest: string;
  context: Readonly<M10ChallengeContext>;
  approvedAt: string;
  consumedAt: string | null;
}

export interface M10ApprovalEvidenceStore {
  save(record: Readonly<M10ApprovalEvidence>): Promise<void>;
}

export interface VerifyM10AssertionDeps {
  githubApiFetch: GithubApiFetch;
  challengeStore: M10ChallengeStore;
  credentialStore: M10AssertionCredentialStore;
  approvalStore: M10ApprovalEvidenceStore;
  verifyResponse?: (opts: VerifyAuthenticationResponseOpts) => ReturnType<typeof realVerifyAuthenticationResponse>;
  now?: string | number | Date;
}

export type VerifyM10AssertionResult =
  | { verdict: 'APPROVED'; approval: Readonly<M10ApprovalEvidence> }
  | { verdict: 'DENY'; reason: string };

function nowMs(value: string | number | Date | undefined): number {
  if (value === undefined) return Date.now();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return Date.parse(value);
}

function sameContext(
  expected: Readonly<M10ChallengeContext>,
  actual: Readonly<M10ChallengeContext>,
): boolean {
  return expected.ownerId === actual.ownerId
    && expected.repository === actual.repository
    && expected.prNumber === actual.prNumber
    && expected.baseBranch === actual.baseBranch
    && expected.baseSha === actual.baseSha
    && expected.headSha === actual.headSha
    && expected.canonicalChangedFileSetHash === actual.canonicalChangedFileSetHash
    && expected.canonicalDiffReviewDigest === actual.canonicalDiffReviewDigest
    && expected.action === actual.action;
}

/**
 * Phase-4 verifier. Security order is deliberate:
 * 1. load an UNUSED, unexpired challenge;
 * 2. re-resolve GitHub state and reject any base/head/file-set/diff drift;
 * 3. consume the challenge before cryptographic verification so forged assertions cannot be retried;
 * 4. verify RP ID, Origin, signature and UV against the enrolled public credential;
 * 5. persist the new authenticator counter with compare-and-set semantics;
 * 6. persist immutable approval evidence bound to the exact authorization digest.
 *
 * Any persistence or resolver failure returns DENY. No Phase-5 CI authority is emitted here.
 */
export async function verifyM10OwnerAssertion(
  input: Readonly<{
    ownerId: string;
    challengeId: string;
    response: AuthenticationResponseJSON;
  }>,
  deps: Readonly<VerifyM10AssertionDeps>,
): Promise<VerifyM10AssertionResult> {
  if (input.ownerId !== SYSTEMADMIN_OWNER_ACTOR_ID) {
    return { verdict: 'DENY', reason: 'Nur der kanonische CAPITAL-AI Owner kann PR-CI autorisieren.' };
  }

  let storedChallenge;
  try {
    storedChallenge = await deps.challengeStore.get(input.challengeId);
  } catch (err: any) {
    return { verdict: 'DENY', reason: `M10-Challenge konnte nicht geladen werden: ${err?.message || String(err)}` };
  }
  if (!storedChallenge) return { verdict: 'DENY', reason: 'Unbekannte M10-Challenge.' };
  if (storedChallenge.challenge.context.ownerId !== input.ownerId) {
    return { verdict: 'DENY', reason: 'M10-Challenge wurde nicht für diesen Owner ausgestellt.' };
  }
  if (!isM10ChallengeValidForUse(storedChallenge, deps.now)) {
    return { verdict: 'DENY', reason: 'M10-Challenge ist abgelaufen, verbraucht oder widerrufen.' };
  }

  const resolved = await resolveTrustedPrState(
    {
      repository: storedChallenge.challenge.context.repository,
      prNumber: storedChallenge.challenge.context.prNumber,
    },
    { githubApiFetch: deps.githubApiFetch },
  );
  if (resolved.verdict === 'DENY') return { verdict: 'DENY', reason: resolved.reason };

  const currentContext: M10ChallengeContext = {
    ownerId: resolved.state.ownerId,
    repository: resolved.state.repository,
    prNumber: resolved.state.prNumber,
    baseBranch: resolved.state.baseBranch,
    baseSha: resolved.state.baseSha,
    headSha: resolved.state.headSha,
    canonicalChangedFileSetHash: resolved.state.canonicalChangedFileSetHash,
    canonicalDiffReviewDigest: resolved.state.canonicalDiffReviewDigest,
    action: resolved.state.action,
  };
  if (!sameContext(storedChallenge.challenge.context, currentContext)) {
    try {
      await deps.challengeStore.revoke(input.challengeId);
    } catch {
      // Drift already denies authorization; inability to persist revocation must never convert to allow.
    }
    return { verdict: 'DENY', reason: 'PR-Zustand hat sich seit Challenge-Ausstellung geändert.' };
  }

  let activeCredentials: readonly Readonly<M10StoredCredential>[];
  try {
    activeCredentials = await deps.credentialStore.listActiveForOwner(input.ownerId);
  } catch (err: any) {
    return { verdict: 'DENY', reason: `Owner-Credentials konnten nicht geladen werden: ${err?.message || String(err)}` };
  }
  const credential = activeCredentials.find(candidate => candidate.credentialId === input.response.id);
  if (!credential) return { verdict: 'DENY', reason: 'Unbekanntes oder widerrufenes Owner-Credential.' };

  let consumed: boolean;
  try {
    consumed = await deps.challengeStore.markConsumed(input.challengeId);
  } catch (err: any) {
    return { verdict: 'DENY', reason: `M10-Challenge konnte nicht atomar verbraucht werden: ${err?.message || String(err)}` };
  }
  if (!consumed) return { verdict: 'DENY', reason: 'M10-Challenge wurde bereits verbraucht (Replay).' };

  const verify = deps.verifyResponse ?? realVerifyAuthenticationResponse;
  let verification: Awaited<ReturnType<typeof realVerifyAuthenticationResponse>>;
  try {
    verification = await verify({
      response: input.response,
      expectedChallenge: storedChallenge.challenge.challenge,
      expectedOrigin: [...M10_EXPECTED_ORIGINS],
      expectedRPID: M10_RP_ID,
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64url')),
        counter: credential.counter,
        transports: credential.transports as any,
      },
      requireUserVerification: true,
    });
  } catch (err: any) {
    return { verdict: 'DENY', reason: `WebAuthn-Assertion-Verifikation fehlgeschlagen: ${err?.message || String(err)}` };
  }
  if (!verification.verified || !verification.authenticationInfo.userVerified) {
    return { verdict: 'DENY', reason: 'WebAuthn-Assertion oder User Verification konnte nicht verifiziert werden.' };
  }

  try {
    const counterUpdated = await deps.credentialStore.updateCounter(
      credential.credentialId,
      credential.counter,
      verification.authenticationInfo.newCounter,
    );
    if (!counterUpdated) {
      return { verdict: 'DENY', reason: 'Authenticator-Counter konnte nicht atomar fortgeschrieben werden.' };
    }
  } catch (err: any) {
    return { verdict: 'DENY', reason: `Authenticator-Counter konnte nicht persistiert werden: ${err?.message || String(err)}` };
  }

  const approvedAtMs = nowMs(deps.now);
  if (!Number.isFinite(approvedAtMs)) return { verdict: 'DENY', reason: 'Ungültiger Approval-Zeitpunkt.' };

  const approval: M10ApprovalEvidence = {
    approvalId: generateOpaqueToken(16),
    ownerId: input.ownerId,
    credentialId: credential.credentialId,
    challengeId: storedChallenge.challenge.challengeId,
    authorizationDigest: computeCanonicalAuthorizationDigest(storedChallenge.challenge),
    context: storedChallenge.challenge.context,
    approvedAt: new Date(approvedAtMs).toISOString(),
    consumedAt: null,
  };

  try {
    await deps.approvalStore.save(approval);
  } catch (err: any) {
    return { verdict: 'DENY', reason: `Approval-Evidence konnte nicht persistiert werden: ${err?.message || String(err)}` };
  }

  return { verdict: 'APPROVED', approval };
}
