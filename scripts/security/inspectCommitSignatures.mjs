#!/usr/bin/env node

/**
 * Read-only inspector for GitHub commit verification on an open same-repository PR.
 * Does not mutate branches, rulesets or pull-request state.
 */

const repository = String(process.env.GITHUB_REPOSITORY || '').trim();
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const prNumber = Number(process.env.PR_NUMBER || 0);

function fail(message) {
  throw new Error(message);
}

if (!repository || !repository.includes('/')) fail('GITHUB_REPOSITORY fehlt oder ist ungültig.');
if (!token) fail('GITHUB_TOKEN/GH_TOKEN fehlt.');
if (!Number.isInteger(prNumber) || prNumber <= 0) fail('PR_NUMBER muss eine positive Ganzzahl sein.');

async function githubJson(pathname) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(15_000),
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!response.ok) {
    const detail = typeof data === 'object' && data?.message ? data.message : String(data || response.statusText);
    fail(`GitHub API ${response.status} for ${pathname}: ${detail}`);
  }
  return data;
}

const pr = await githubJson(`/repos/${repository}/pulls/${prNumber}`);
if (pr?.state !== 'open') fail(`PR #${prNumber} ist ${String(pr?.state || 'unbekannt')} statt open.`);
if (pr?.base?.ref !== 'main') fail(`PR #${prNumber} hat Base ${String(pr?.base?.ref || 'unbekannt')} statt main.`);
if (pr?.base?.repo?.full_name !== repository || pr?.head?.repo?.full_name !== repository) {
  fail(`PR #${prNumber} ist kein Same-Repository-PR gegen ${repository}.`);
}

const commits = [];
for (let page = 1; page <= 20; page += 1) {
  const pageData = await githubJson(`/repos/${repository}/pulls/${prNumber}/commits?per_page=100&page=${page}`);
  if (!Array.isArray(pageData)) fail('Unerwartete Commits-Antwort.');
  commits.push(...pageData);
  if (pageData.length < 100) break;
}

if (commits.length === 0) fail(`PR #${prNumber} hat keine Commits.`);

const rows = commits.map((entry) => {
  const sha = String(entry?.sha || '');
  const verification = entry?.commit?.verification || {};
  return {
    sha,
    shortSha: sha.slice(0, 12),
    message: String(entry?.commit?.message || '').split('\n')[0].slice(0, 120),
    verified: verification.verified === true,
    reason: String(verification.reason || 'unsigned'),
  };
});

const unsigned = rows.filter((row) => !row.verified);
const report = {
  repository,
  pullNumber: prNumber,
  headSha: String(pr.head.sha || ''),
  headRef: String(pr.head.ref || ''),
  baseSha: String(pr.base.sha || ''),
  commitCount: rows.length,
  verifiedCount: rows.length - unsigned.length,
  unsignedCount: unsigned.length,
  mergeReadyForRequiredSignatures: unsigned.length === 0,
  commits: rows,
};

console.log(JSON.stringify(report, null, 2));
console.log(
  `[COMMIT-SIGNING] PR #${prNumber}: ${report.verifiedCount}/${report.commitCount} verified; unsigned=${report.unsignedCount}.`,
);

if (unsigned.length > 0) {
  process.exitCode = 2;
}
