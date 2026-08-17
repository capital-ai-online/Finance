// M10 (ADR-0066, ESS-0022) Phase 1 — Trusted PR State Resolver.
//
// Server-side, authoritative resolution of the exact current state of a CAPITAL-AI pull request:
// base branch/SHA, exact head SHA, canonical sorted changed-file set, and a canonical diff/review
// digest. Per the ADR/ESS/threat-model, this is the "trusted service [that] recomputes context
// from GitHub state" — the function signature structurally cannot accept an agent-supplied hash or
// diff as authoritative, because it takes only { repository, prNumber } and always re-derives
// everything else from a live GitHub API call.
//
// Scope of this module (explicitly, matching the M10 runbook's phased sequencing): Phase 1 only.
// It does not issue a WebAuthn challenge (Phase 2), does not verify an assertion (Phase 4), and is
// not wired into any HTTP route yet — making it reachable is a separate, separately-authorized
// live-wiring step, mirroring the Break-Glass precedent (logic layer first, then wiring).
import { createHash } from 'node:crypto';
import { SYSTEMADMIN_OWNER_ACTOR_ID, SYSTEMADMIN_REPOSITORY } from '../../src/platform/Security/roadmapExecutionMandate';

export const M10_AUTHORIZE_PR_CI_ACTION = 'AUTHORIZE_PR_CI';

/**
 * Injected GitHub API access. A real implementation (see createRealGithubApiFetch below) performs
 * an authenticated HTTPS call; tests inject a deterministic stub. The resolver itself never
 * constructs a fetch() call directly, keeping it testable without real network/credentials and
 * ensuring every GitHub call goes through one auditable choke point.
 */
export interface GithubApiFetch {
  (path: string): Promise<{ status: number; json: unknown }>;
}

export interface TrustedPrStateResolverDeps {
  githubApiFetch: GithubApiFetch;
}

export interface ResolvePrStateRequest {
  repository: string;
  prNumber: number;
}

export interface ResolvedPrState {
  ownerId: string;
  repository: string;
  prNumber: number;
  baseBranch: string;
  baseSha: string;
  headSha: string;
  /** Canonical, lexicographically sorted list of changed file paths — never agent-supplied. */
  changedFilePaths: readonly string[];
  /** SHA-256 hex of the sorted changed-file-set (ADR-0066 §3 "canonical sorted changed-file list hash"). */
  canonicalChangedFileSetHash: string;
  /** SHA-256 hex binding file identity AND content change, not just filenames (ADR-0066 §3 "canonical PR diff/review digest"). */
  canonicalDiffReviewDigest: string;
  action: typeof M10_AUTHORIZE_PR_CI_ACTION;
  resolvedAt: string;
}

export type PrStateResolutionResult =
  | { verdict: 'RESOLVED'; state: Readonly<ResolvedPrState> }
  | { verdict: 'DENY'; reason: string };

function deny(reason: string): PrStateResolutionResult {
  return { verdict: 'DENY', reason };
}

interface GithubPullResponse {
  state?: unknown;
  base?: { ref?: unknown; sha?: unknown };
  head?: { sha?: unknown };
}

interface GithubPullFile {
  filename?: unknown;
  status?: unknown;
  patch?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Fetches every page of /pulls/{n}/files (GitHub caps each page at 100 entries) rather than
 * trusting the first page alone — a PR touching more than 100 files must still be fully resolved,
 * not silently truncated into an incomplete (and therefore wrong) file-set hash.
 */
async function fetchAllChangedFiles(
  githubApiFetch: GithubApiFetch,
  repository: string,
  prNumber: number,
): Promise<GithubPullFile[] | { error: string }> {
  const files: GithubPullFile[] = [];
  const maxPages = 50; // 50 * 100 = 5000 changed files hard ceiling; a PR beyond this is not a normal CI-authorization target.
  for (let page = 1; page <= maxPages; page += 1) {
    const response = await githubApiFetch(`/repos/${repository}/pulls/${prNumber}/files?per_page=100&page=${page}`);
    if (response.status !== 200) {
      return { error: `GitHub files endpoint returned HTTP ${response.status}` };
    }
    if (!Array.isArray(response.json)) {
      return { error: 'GitHub files endpoint returned a non-array payload' };
    }
    const pageFiles = response.json as GithubPullFile[];
    files.push(...pageFiles);
    if (pageFiles.length < 100) break;
    if (page === maxPages) return { error: 'GitHub files endpoint exceeded the resolver page ceiling' };
  }
  return files;
}

/**
 * Phase 1 — Trusted PR State Resolver. Always re-derives base/head/file-set/diff from a live
 * GitHub call; never accepts these as caller input. Fails closed (DENY) on any GitHub error,
 * malformed response, non-open PR, or off-canonical-repository request.
 */
export async function resolveTrustedPrState(
  request: Readonly<ResolvePrStateRequest>,
  deps: Readonly<TrustedPrStateResolverDeps>,
): Promise<PrStateResolutionResult> {
  if (request.repository !== SYSTEMADMIN_REPOSITORY) {
    return deny(`Repository ${request.repository} liegt außerhalb des M10-Autorisierungs-Scopes.`);
  }
  if (!Number.isInteger(request.prNumber) || request.prNumber <= 0) {
    return deny('Ungültige PR-Nummer.');
  }

  let pull: GithubPullResponse;
  try {
    const response = await deps.githubApiFetch(`/repos/${request.repository}/pulls/${request.prNumber}`);
    if (response.status !== 200) {
      return deny(`GitHub PR-Endpunkt lieferte HTTP ${response.status}.`);
    }
    pull = (response.json ?? {}) as GithubPullResponse;
  } catch (err: any) {
    return deny(`GitHub PR-Auflösung fehlgeschlagen: ${err?.message || String(err)}`);
  }

  if (pull.state !== 'open') {
    return deny(`PR ist nicht offen (Status: ${String(pull.state)}) — M10-Autorisierung nur für offene PRs.`);
  }
  const baseBranch = pull.base?.ref;
  const baseSha = pull.base?.sha;
  const headSha = pull.head?.sha;
  if (!isNonEmptyString(baseBranch) || !isNonEmptyString(baseSha) || !isNonEmptyString(headSha)) {
    return deny('GitHub PR-Antwort enthält keine vollständigen Base-/Head-Referenzen.');
  }

  let filesResult: GithubPullFile[] | { error: string };
  try {
    filesResult = await fetchAllChangedFiles(deps.githubApiFetch, request.repository, request.prNumber);
  } catch (err: any) {
    return deny(`GitHub Datei-Auflösung fehlgeschlagen: ${err?.message || String(err)}`);
  }
  if ('error' in filesResult) return deny(filesResult.error);

  const normalizedFiles = filesResult
    .map(file => ({
      filename: isNonEmptyString(file.filename) ? file.filename : null,
      status: isNonEmptyString(file.status) ? file.status : 'unknown',
      // Binary/too-large diffs omit `patch` entirely - a stable placeholder still changes the
      // digest if a file transitions to/from having no patch, without fabricating content.
      patch: isNonEmptyString(file.patch) ? file.patch : '<no-patch>',
    }))
    .filter((file): file is { filename: string; status: string; patch: string } => file.filename !== null);

  if (normalizedFiles.length !== filesResult.length) {
    return deny('GitHub Datei-Antwort enthält Einträge ohne gültigen Dateinamen.');
  }

  const sortedFiles = [...normalizedFiles].sort((a, b) => a.filename.localeCompare(b.filename));
  const changedFilePaths = sortedFiles.map(file => file.filename);

  const canonicalChangedFileSetHash = createHash('sha256')
    .update(changedFilePaths.join('\n'))
    .digest('hex');

  const canonicalDiffReviewDigest = createHash('sha256')
    .update(JSON.stringify(sortedFiles))
    .digest('hex');

  return {
    verdict: 'RESOLVED',
    state: {
      ownerId: SYSTEMADMIN_OWNER_ACTOR_ID,
      repository: request.repository,
      prNumber: request.prNumber,
      baseBranch,
      baseSha,
      headSha,
      changedFilePaths,
      canonicalChangedFileSetHash,
      canonicalDiffReviewDigest,
      action: M10_AUTHORIZE_PR_CI_ACTION,
      resolvedAt: new Date().toISOString(),
    },
  };
}

/**
 * Real GitHub REST API implementation of GithubApiFetch, built with the platform's own fetch
 * rather than a new dependency (no octokit/SDK added — this repo's M6 supply-chain provenance
 * controls make new dependencies a deliberate, separately-justified decision, and a thin wrapper
 * over three GitHub REST calls does not need one). NOT wired into any route yet — no caller in
 * this codebase constructs this today; it exists so a future live-wiring step has a ready,
 * independently testable implementation to reach for.
 */
export function createRealGithubApiFetch(githubToken: string): GithubApiFetch {
  return async (path: string) => {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    const json = await response.json().catch(() => null);
    return { status: response.status, json };
  };
}
