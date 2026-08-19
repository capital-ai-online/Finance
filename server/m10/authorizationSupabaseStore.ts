// M10 (ADR-0066, ESS-0022) durable stores for Phases 2/4/5.
//
// Browser roles have no table privileges or RLS policies for these records. All access is through
// the privileged server-side Supabase client. The Phase-5 claim/finalize transitions use database
// functions so the approval-consumption and one-run-per-head invariants are transactional.
import { getPrivilegedServerSupabase, isPrivilegedSupabaseConfigured } from '../db';
import type { M10ChallengeStore, StoredM10ChallengeRecord } from './challengeIssuance';
import type {
  M10ApprovalEvidence,
  M10ApprovalEvidenceStore,
  M10AssertionCredentialStore,
} from './assertionVerification';
import type { M10StoredCredential } from './credentialEnrollment';
import {
  createSupabaseM10CredentialStore,
} from './credentialEnrollmentSupabaseStore';
import type {
  M10ConsumableApprovalStore,
  M10ConsumptionClaimResult,
} from './atomicCiConsumption';

interface AuthorizationChallengeRow {
  challenge_id: string;
  challenge: string;
  owner_actor_id: string;
  repository: string;
  pr_number: number;
  base_branch: string;
  base_sha: string;
  head_sha: string;
  changed_file_set_hash: string;
  diff_review_digest: string;
  action: 'AUTHORIZE_PR_CI';
  issued_at: string;
  expires_at: string;
  consumed_at: string | null;
  revoked_at: string | null;
}

interface ApprovalEvidenceRow {
  approval_id: string;
  owner_actor_id: string;
  credential_id: string;
  challenge_id: string;
  authorization_digest: string;
  repository: string;
  pr_number: number;
  base_branch: string;
  base_sha: string;
  head_sha: string;
  changed_file_set_hash: string;
  diff_review_digest: string;
  action: 'AUTHORIZE_PR_CI';
  approved_at: string;
  consumed_at: string | null;
}

interface CredentialRow {
  credential_id: string;
  owner_actor_id: string;
  public_key: string;
  counter: number;
  transports: string[];
  device_type: M10StoredCredential['deviceType'];
  backed_up: boolean;
  aaguid: string;
  created_at: string;
  revoked_at: string | null;
}

function challengeRowToRecord(row: AuthorizationChallengeRow): StoredM10ChallengeRecord {
  return {
    challenge: {
      challengeId: row.challenge_id,
      challenge: row.challenge,
      context: {
        ownerId: row.owner_actor_id,
        repository: row.repository,
        prNumber: row.pr_number,
        baseBranch: row.base_branch,
        baseSha: row.base_sha,
        headSha: row.head_sha,
        canonicalChangedFileSetHash: row.changed_file_set_hash,
        canonicalDiffReviewDigest: row.diff_review_digest,
        action: row.action,
      },
      issuedAt: row.issued_at,
      expiresAt: row.expires_at,
    },
    state: row.revoked_at ? 'REVOKED' : row.consumed_at ? 'CONSUMED' : 'UNUSED',
  };
}

function approvalRowToRecord(row: ApprovalEvidenceRow): M10ApprovalEvidence {
  return {
    approvalId: row.approval_id,
    ownerId: row.owner_actor_id,
    credentialId: row.credential_id,
    challengeId: row.challenge_id,
    authorizationDigest: row.authorization_digest,
    context: {
      ownerId: row.owner_actor_id,
      repository: row.repository,
      prNumber: row.pr_number,
      baseBranch: row.base_branch,
      baseSha: row.base_sha,
      headSha: row.head_sha,
      canonicalChangedFileSetHash: row.changed_file_set_hash,
      canonicalDiffReviewDigest: row.diff_review_digest,
      action: row.action,
    },
    approvedAt: row.approved_at,
    consumedAt: row.consumed_at,
  };
}

function credentialRowToRecord(row: CredentialRow): M10StoredCredential {
  return {
    credentialId: row.credential_id,
    ownerId: row.owner_actor_id,
    publicKey: row.public_key,
    counter: row.counter,
    transports: row.transports,
    deviceType: row.device_type,
    backedUp: row.backed_up,
    aaguid: row.aaguid,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  };
}

export function createSupabaseM10AuthorizationChallengeStore(): M10ChallengeStore {
  return {
    async save(record) {
      if (!isPrivilegedSupabaseConfigured()) {
        throw new Error('Supabase ist nicht konfiguriert - M10-Autorisierungs-Challenge kann nicht persistiert werden.');
      }
      const { error } = await getPrivilegedServerSupabase().from('m10_authorization_challenges').insert({
        challenge_id: record.challenge.challengeId,
        challenge: record.challenge.challenge,
        owner_actor_id: record.challenge.context.ownerId,
        repository: record.challenge.context.repository,
        pr_number: record.challenge.context.prNumber,
        base_branch: record.challenge.context.baseBranch,
        base_sha: record.challenge.context.baseSha,
        head_sha: record.challenge.context.headSha,
        changed_file_set_hash: record.challenge.context.canonicalChangedFileSetHash,
        diff_review_digest: record.challenge.context.canonicalDiffReviewDigest,
        action: record.challenge.context.action,
        issued_at: record.challenge.issuedAt,
        expires_at: record.challenge.expiresAt,
        consumed_at: record.state === 'CONSUMED' ? new Date().toISOString() : null,
        revoked_at: record.state === 'REVOKED' ? new Date().toISOString() : null,
      });
      if (error) throw new Error(`m10_authorization_challenges insert fehlgeschlagen: ${error.message}`);
    },

    async get(challengeId) {
      if (!isPrivilegedSupabaseConfigured()) return null;
      const { data, error } = await getPrivilegedServerSupabase()
        .from('m10_authorization_challenges')
        .select('challenge_id, challenge, owner_actor_id, repository, pr_number, base_branch, base_sha, head_sha, changed_file_set_hash, diff_review_digest, action, issued_at, expires_at, consumed_at, revoked_at')
        .eq('challenge_id', challengeId)
        .maybeSingle();
      if (error || !data) return null;
      return challengeRowToRecord(data as AuthorizationChallengeRow);
    },

    async markConsumed(challengeId) {
      if (!isPrivilegedSupabaseConfigured()) return false;
      const { data, error } = await getPrivilegedServerSupabase()
        .from('m10_authorization_challenges')
        .update({ consumed_at: new Date().toISOString() })
        .eq('challenge_id', challengeId)
        .is('consumed_at', null)
        .is('revoked_at', null)
        .select('challenge_id')
        .maybeSingle();
      return !error && !!data;
    },

    async revoke(challengeId) {
      if (!isPrivilegedSupabaseConfigured()) return false;
      const { data, error } = await getPrivilegedServerSupabase()
        .from('m10_authorization_challenges')
        .update({ revoked_at: new Date().toISOString() })
        .eq('challenge_id', challengeId)
        .is('consumed_at', null)
        .is('revoked_at', null)
        .select('challenge_id')
        .maybeSingle();
      return !error && !!data;
    },
  };
}

export function createSupabaseM10AssertionCredentialStore(): M10AssertionCredentialStore {
  const enrollmentStore = createSupabaseM10CredentialStore();
  return {
    listActiveForOwner: ownerId => enrollmentStore.listActiveForOwner(ownerId),

    async updateCounter(credentialId, expectedCounter, newCounter) {
      if (!isPrivilegedSupabaseConfigured()) return false;
      if (!Number.isSafeInteger(expectedCounter) || expectedCounter < 0) return false;
      if (!Number.isSafeInteger(newCounter) || newCounter < expectedCounter) return false;

      const { data, error } = await getPrivilegedServerSupabase()
        .from('m10_owner_credentials')
        .update({ counter: newCounter })
        .eq('credential_id', credentialId)
        .eq('counter', expectedCounter)
        .is('revoked_at', null)
        .select('credential_id')
        .maybeSingle();
      return !error && !!data;
    },
  };
}

export type SupabaseM10ApprovalStore = M10ApprovalEvidenceStore & M10ConsumableApprovalStore;

export function createSupabaseM10ApprovalStore(): SupabaseM10ApprovalStore {
  return {
    async save(record) {
      if (!isPrivilegedSupabaseConfigured()) {
        throw new Error('Supabase ist nicht konfiguriert - M10-Approval-Evidence kann nicht persistiert werden.');
      }
      const { error } = await getPrivilegedServerSupabase().from('m10_approval_evidence').insert({
        approval_id: record.approvalId,
        owner_actor_id: record.ownerId,
        credential_id: record.credentialId,
        challenge_id: record.challengeId,
        authorization_digest: record.authorizationDigest,
        repository: record.context.repository,
        pr_number: record.context.prNumber,
        base_branch: record.context.baseBranch,
        base_sha: record.context.baseSha,
        head_sha: record.context.headSha,
        changed_file_set_hash: record.context.canonicalChangedFileSetHash,
        diff_review_digest: record.context.canonicalDiffReviewDigest,
        action: record.context.action,
        approved_at: record.approvedAt,
        consumed_at: record.consumedAt,
      });
      if (error) throw new Error(`m10_approval_evidence insert fehlgeschlagen: ${error.message}`);
    },

    async get(approvalId) {
      if (!isPrivilegedSupabaseConfigured()) return null;
      const { data, error } = await getPrivilegedServerSupabase()
        .from('m10_approval_evidence')
        .select('approval_id, owner_actor_id, credential_id, challenge_id, authorization_digest, repository, pr_number, base_branch, base_sha, head_sha, changed_file_set_hash, diff_review_digest, action, approved_at, consumed_at')
        .eq('approval_id', approvalId)
        .maybeSingle();
      if (error || !data) return null;
      return approvalRowToRecord(data as ApprovalEvidenceRow);
    },

    async claim(input) {
      if (!isPrivilegedSupabaseConfigured()) {
        return { status: 'DENY_STORE_UNAVAILABLE', reason: 'Privileged Supabase store is unavailable.' };
      }
      const { data, error } = await getPrivilegedServerSupabase().rpc('claim_m10_ci_consumption', {
        p_approval_id: input.approvalId,
        p_consumption_id: input.consumptionId,
        p_expected_repository: input.expectedRepository,
        p_expected_pr_number: input.expectedPrNumber,
        p_expected_head_sha: input.expectedHeadSha,
        p_expected_authorization_digest: input.expectedAuthorizationDigest,
      });
      if (error) throw new Error(`claim_m10_ci_consumption fehlgeschlagen: ${error.message}`);

      const row = Array.isArray(data) ? data[0] : data;
      if (!row || typeof row.status !== 'string') {
        return { status: 'DENY_STORE_UNAVAILABLE', reason: 'M10 claim RPC returned no status.' };
      }

      if (row.status === 'CLAIMED') {
        if (typeof row.returned_consumption_id !== 'string' || typeof row.returned_consumed_at !== 'string') {
          return { status: 'DENY_STORE_UNAVAILABLE', reason: 'M10 claim RPC returned incomplete evidence.' };
        }
        return {
          status: 'CLAIMED',
          consumptionId: row.returned_consumption_id,
          consumedAt: row.returned_consumed_at,
        };
      }

      const allowedStatuses: M10ConsumptionClaimResult['status'][] = [
        'DEDUPE_HEAD',
        'DEDUPE_APPROVAL',
        'DENY_UNKNOWN_APPROVAL',
        'DENY_CONTEXT_MISMATCH',
        'DENY_STORE_UNAVAILABLE',
      ];
      if (!allowedStatuses.includes(row.status as M10ConsumptionClaimResult['status'])) {
        return { status: 'DENY_STORE_UNAVAILABLE', reason: `Unknown M10 claim status: ${row.status}` };
      }
      return { status: row.status } as M10ConsumptionClaimResult;
    },

    async finalizeDispatch(consumptionId, terminalState, failureReason) {
      if (!isPrivilegedSupabaseConfigured()) return false;
      const { data, error } = await getPrivilegedServerSupabase().rpc('finalize_m10_ci_dispatch', {
        p_consumption_id: consumptionId,
        p_terminal_state: terminalState,
        p_failure_reason: failureReason ?? null,
      });
      if (error) throw new Error(`finalize_m10_ci_dispatch fehlgeschlagen: ${error.message}`);
      return data === true;
    },
  };
}

/**
 * Narrow read helper for operational evidence views. It intentionally excludes private credential
 * material and returns only data already safe for server-side M10 verification/audit logic.
 */
export async function loadActiveM10AssertionCredentials(ownerId: string): Promise<readonly M10StoredCredential[]> {
  if (!isPrivilegedSupabaseConfigured()) return [];
  const { data, error } = await getPrivilegedServerSupabase()
    .from('m10_owner_credentials')
    .select('credential_id, owner_actor_id, public_key, counter, transports, device_type, backed_up, aaguid, created_at, revoked_at')
    .eq('owner_actor_id', ownerId)
    .is('revoked_at', null);
  if (error || !data) return [];
  return (data as CredentialRow[]).map(credentialRowToRecord);
}
