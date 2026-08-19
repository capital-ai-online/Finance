// M10 (ADR-0066, ESS-0022) Phase 6 — non-authoritative Shadow Mode persistence.
//
// This store intentionally implements ONLY the Phase-4 approval write contract. It exposes no
// Phase-5 consumption contract and therefore cannot authorize CI. Shadow assertions prove the real
// Owner WebAuthn path while the existing simplified CI remains authoritative.
import { getPrivilegedServerSupabase, isPrivilegedSupabaseConfigured } from '../db';
import type { M10ApprovalEvidence, M10ApprovalEvidenceStore } from './assertionVerification';

export interface M10ShadowEvaluationSummary {
  shadowId: string;
  repository: string;
  prNumber: number;
  baseBranch: string;
  baseSha: string;
  headSha: string;
  authorizationDigest: string;
  approvedAt: string;
  observedAt: string;
  verdict: 'APPROVED_SHADOW';
}

interface ShadowEvaluationRow {
  shadow_id: string;
  repository: string;
  pr_number: number;
  base_branch: string;
  base_sha: string;
  head_sha: string;
  authorization_digest: string;
  approved_at: string;
  observed_at: string;
  verdict: 'APPROVED_SHADOW';
}

export function createSupabaseM10ShadowApprovalStore(): M10ApprovalEvidenceStore {
  return {
    async save(record: Readonly<M10ApprovalEvidence>) {
      if (!isPrivilegedSupabaseConfigured()) {
        throw new Error('Supabase ist nicht konfiguriert - M10-Shadow-Evidence kann nicht persistiert werden.');
      }

      const { error } = await getPrivilegedServerSupabase().from('m10_shadow_evaluations').insert({
        shadow_id: record.approvalId,
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
        verdict: 'APPROVED_SHADOW',
        approved_at: record.approvedAt,
      });

      if (error) throw new Error(`m10_shadow_evaluations insert fehlgeschlagen: ${error.message}`);
    },
  };
}

export async function listRecentM10ShadowEvaluations(limit = 10): Promise<readonly M10ShadowEvaluationSummary[]> {
  if (!isPrivilegedSupabaseConfigured()) return [];
  const safeLimit = Number.isInteger(limit) ? Math.max(1, Math.min(limit, 25)) : 10;
  const { data, error } = await getPrivilegedServerSupabase()
    .from('m10_shadow_evaluations')
    .select('shadow_id, repository, pr_number, base_branch, base_sha, head_sha, authorization_digest, approved_at, observed_at, verdict')
    .order('observed_at', { ascending: false })
    .limit(safeLimit);

  if (error || !Array.isArray(data)) return [];
  return (data as ShadowEvaluationRow[]).map(row => ({
    shadowId: row.shadow_id,
    repository: row.repository,
    prNumber: row.pr_number,
    baseBranch: row.base_branch,
    baseSha: row.base_sha,
    headSha: row.head_sha,
    authorizationDigest: row.authorization_digest,
    approvedAt: row.approved_at,
    observedAt: row.observed_at,
    verdict: row.verdict,
  }));
}
