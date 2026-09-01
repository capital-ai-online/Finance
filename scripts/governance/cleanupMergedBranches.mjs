#!/usr/bin/env node

const DEFAULT_GRACE_MINUTES = 60;
const BASE_BRANCH = 'main';
const NEVER_DELETE_NAMES = new Set(['main', 'master', 'develop', 'development', 'staging', 'production']);
const NEVER_DELETE_PREFIXES = ['release/', 'hotfix/', 'protected/'];

export function isProtectedName(name) {
  return NEVER_DELETE_NAMES.has(name) || NEVER_DELETE_PREFIXES.some(prefix => name.startsWith(prefix));
}

export function isInactiveLongEnough(commitDate, now, graceMinutes) {
  const timestamp = Date.parse(commitDate || '');
  if (!Number.isFinite(timestamp)) return false;
  return now.getTime() - timestamp >= graceMinutes * 60 * 1000;
}

export function isMergedComparisonStatus(status) {
  return status === 'ahead' || status === 'identical';
}

function arg(name, fallback = '') {
  const prefix = `--${name}=`;
  const found = process.argv.find(value => value.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function asBoolean(value) {
  return String(value).toLowerCase() === 'true';
}

async function github(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN fehlt.');
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${options.method || 'GET'} ${path} -> ${response.status}: ${body.slice(0, 500)}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function listBranches(owner, repo) {
  const result = [];
  for (let page = 1; ; page += 1) {
    const batch = await github(`/repos/${owner}/${repo}/branches?per_page=100&page=${page}`);
    result.push(...batch);
    if (batch.length < 100) return result;
  }
}

async function branchState(owner, repo, name) {
  return github(`/repos/${owner}/${repo}/branches/${encodeURIComponent(name)}`);
}

async function openPullRequests(owner, repo, name) {
  const head = encodeURIComponent(`${owner}:${name}`);
  return github(`/repos/${owner}/${repo}/pulls?state=open&base=${BASE_BRANCH}&head=${head}&per_page=100`);
}

async function closedPullRequests(owner, repo, name) {
  const head = encodeURIComponent(`${owner}:${name}`);
  return github(`/repos/${owner}/${repo}/pulls?state=closed&base=${BASE_BRANCH}&head=${head}&per_page=100&sort=updated&direction=desc`);
}

async function mergedIntoMain(owner, repo, name, tipSha) {
  const comparison = await github(`/repos/${owner}/${repo}/compare/${encodeURIComponent(name)}...${BASE_BRANCH}`);
  if (isMergedComparisonStatus(comparison.status)) return { eligible: true, reason: `compare:${comparison.status}` };

  const pulls = await closedPullRequests(owner, repo, name);
  const exactMerged = pulls.find(pr => pr.merged_at && pr.head?.sha === tipSha && pr.base?.ref === BASE_BRANCH);
  if (exactMerged) return { eligible: true, reason: `merged-pr:#${exactMerged.number}` };
  return { eligible: false, reason: `compare:${comparison.status}` };
}

async function validateCandidate(owner, repo, branch, now, graceMinutes) {
  const name = branch.name;
  const initialSha = branch.commit?.sha;
  if (!name || !initialSha) return { eligible: false, reason: 'missing-name-or-sha' };
  if (isProtectedName(name)) return { eligible: false, reason: 'protected-name' };

  const current = await branchState(owner, repo, name);
  if (current.protected) return { eligible: false, reason: 'github-protected' };
  if (current.commit?.sha !== initialSha) return { eligible: false, reason: 'tip-moved-before-evaluation' };
  if (!isInactiveLongEnough(current.commit?.commit?.committer?.date || current.commit?.commit?.author?.date, now, graceMinutes)) {
    return { eligible: false, reason: 'inactivity-window' };
  }

  const openPrs = await openPullRequests(owner, repo, name);
  if (openPrs.length > 0) return { eligible: false, reason: `open-pr:#${openPrs[0].number}` };

  const merged = await mergedIntoMain(owner, repo, name, initialSha);
  if (!merged.eligible) return merged;
  return { eligible: true, reason: merged.reason, sha: initialSha };
}

async function revalidateBeforeDelete(owner, repo, name, expectedSha) {
  const current = await branchState(owner, repo, name);
  if (current.protected || isProtectedName(name)) return { ok: false, reason: 'protected-on-recheck' };
  if (current.commit?.sha !== expectedSha) return { ok: false, reason: 'tip-moved-on-recheck' };
  const openPrs = await openPullRequests(owner, repo, name);
  if (openPrs.length > 0) return { ok: false, reason: `open-pr-on-recheck:#${openPrs[0].number}` };
  const merged = await mergedIntoMain(owner, repo, name, expectedSha);
  if (!merged.eligible) return { ok: false, reason: `merge-proof-lost:${merged.reason}` };
  return { ok: true, reason: merged.reason };
}

async function main() {
  const repository = process.env.GITHUB_REPOSITORY || '';
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) throw new Error('GITHUB_REPOSITORY fehlt oder ist ungültig.');
  const dryRun = asBoolean(arg('dry-run', 'true'));
  const graceMinutes = Number(arg('grace-minutes', String(DEFAULT_GRACE_MINUTES)));
  if (!Number.isInteger(graceMinutes) || graceMinutes < 60 || graceMinutes > 525600) {
    throw new Error('grace-minutes muss zwischen 60 und 525600 liegen.');
  }

  const now = new Date();
  const branches = await listBranches(owner, repo);
  const results = [];

  for (const branch of branches) {
    const evaluation = await validateCandidate(owner, repo, branch, now, graceMinutes);
    const record = { branch: branch.name, sha: branch.commit?.sha, ...evaluation, dryRun };
    if (!evaluation.eligible) {
      console.log(JSON.stringify({ action: 'skip', ...record }));
      results.push({ action: 'skip', ...record });
      continue;
    }

    console.log(JSON.stringify({ action: dryRun ? 'would-delete' : 'candidate', ...record }));
    if (dryRun) {
      results.push({ action: 'would-delete', ...record });
      continue;
    }

    const recheck = await revalidateBeforeDelete(owner, repo, branch.name, evaluation.sha);
    if (!recheck.ok) {
      console.log(JSON.stringify({ action: 'skip-after-recheck', branch: branch.name, sha: evaluation.sha, reason: recheck.reason }));
      results.push({ action: 'skip-after-recheck', branch: branch.name, sha: evaluation.sha, reason: recheck.reason });
      continue;
    }

    console.log(JSON.stringify({ action: 'delete', branch: branch.name, sha: evaluation.sha, proof: recheck.reason }));
    await github(`/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch.name)}`, { method: 'DELETE' });
    results.push({ action: 'deleted', branch: branch.name, sha: evaluation.sha, proof: recheck.reason });
  }

  const deleted = results.filter(item => item.action === 'deleted').length;
  const candidates = results.filter(item => item.action === 'would-delete').length;
  console.log(`[branch-cleanup] mode=${dryRun ? 'dry-run' : 'apply'} branches=${branches.length} deleted=${deleted} wouldDelete=${candidates} graceMinutes=${graceMinutes}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`[branch-cleanup] FAIL-CLOSED: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
