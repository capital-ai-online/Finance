import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const PR_TEMPLATE_VERSION = '1.0.0';
export const PR_TEMPLATE_MARKER = `CAPITAL_AI_PR_TEMPLATE_VERSION: ${PR_TEMPLATE_VERSION}`;
export const DEFAULT_PRODUCTION_HEALTH_URL = 'https://capital-ai.online/healthz';
export const MAX_PR_START_DELAY_MS = 15 * 60 * 1000;

export function fail(message) {
  throw new Error(message);
}

export function git(args, options = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

export function tryGit(args) {
  try {
    return git(args);
  } catch {
    return null;
  }
}

export function normalizeRepoPath(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+/g, '/')
    .trim();
}

export function globToRegExp(pattern) {
  const normalized = normalizeRepoPath(pattern);
  let out = '^';

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    if (char === '*') {
      if (normalized[i + 1] === '*') {
        out += '.*';
        i += 1;
      } else {
        out += '[^/]*';
      }
    } else if (char === '?') {
      out += '[^/]';
    } else if ('\\.^$+{}()|[]'.includes(char)) {
      out += `\\${char}`;
    } else {
      out += char;
    }
  }

  out += '$';
  return new RegExp(out);
}

export function pathMatchesClaim(filePath, claimedPaths) {
  const normalizedPath = normalizeRepoPath(filePath);
  return claimedPaths.some((claim) => globToRegExp(claim).test(normalizedPath));
}

export function staticGlobPrefix(pattern) {
  const normalized = normalizeRepoPath(pattern);
  const wildcardAt = normalized.search(/[?*]/);
  const prefix = wildcardAt === -1 ? normalized : normalized.slice(0, wildcardAt);
  return prefix.replace(/\/+$/, '');
}

export function isClaimMetadataPath(filePath) {
  const normalized = normalizeRepoPath(filePath);
  return normalized.startsWith('.ai/work-claims/');
}

export function claimScopesOverlap(a, b) {
  const left = normalizeRepoPath(a);
  const right = normalizeRepoPath(b);

  if (isClaimMetadataPath(left) || isClaimMetadataPath(right)) return false;

  const leftHasWildcard = /[?*]/.test(left);
  const rightHasWildcard = /[?*]/.test(right);

  if (!leftHasWildcard && !rightHasWildcard) return left === right;
  if (!leftHasWildcard) return globToRegExp(right).test(left);
  if (!rightHasWildcard) return globToRegExp(left).test(right);

  const leftPrefix = staticGlobPrefix(left);
  const rightPrefix = staticGlobPrefix(right);
  if (!leftPrefix || !rightPrefix) return true;

  return leftPrefix === rightPrefix ||
    leftPrefix.startsWith(`${rightPrefix}/`) ||
    rightPrefix.startsWith(`${leftPrefix}/`);
}

export function findClaimConflicts(currentClaims, otherClaims) {
  const conflicts = [];
  for (const current of currentClaims) {
    for (const other of otherClaims) {
      if (claimScopesOverlap(current, other)) {
        conflicts.push({ current, other });
      }
    }
  }
  return conflicts;
}

export function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function validateClaimShape(claim, claimPath) {
  const errors = [];
  if (!claim || typeof claim !== 'object' || Array.isArray(claim)) {
    return ['claim must be a JSON object'];
  }

  if (claim.schemaVersion !== '1.0.0') errors.push('schemaVersion must be 1.0.0');
  if (!claim.claimId || typeof claim.claimId !== 'string') errors.push('claimId is required');
  if (claim.status !== 'active') errors.push('status must be active while PR is open');
  if (claim.exclusive !== true) errors.push('exclusive must be true');
  if (!claim.workItem || typeof claim.workItem !== 'string') errors.push('workItem is required');
  if (!claim.startedAt || Number.isNaN(Date.parse(claim.startedAt))) errors.push('startedAt must be an ISO-8601 timestamp');
  if (claim.baseBranch !== 'main') errors.push('baseBranch must be main');
  if (!/^[0-9a-f]{40}$/i.test(String(claim.baseSha || ''))) errors.push('baseSha must be a full 40-character Git SHA');

  if (!claim.agent || typeof claim.agent !== 'object') {
    errors.push('agent object is required');
  } else {
    if (!claim.agent.provider) errors.push('agent.provider is required');
    if (!claim.agent.model) errors.push('agent.model is required');
    if (!claim.agent.executionSurface) errors.push('agent.executionSurface is required');
  }

  if (!Array.isArray(claim.claimedPaths) || claim.claimedPaths.length === 0) {
    errors.push('claimedPaths must be a non-empty array');
  } else {
    for (const item of claim.claimedPaths) {
      if (typeof item !== 'string' || !normalizeRepoPath(item)) {
        errors.push('every claimedPaths entry must be a non-empty string');
        break;
      }
      if (normalizeRepoPath(item) === '**' || normalizeRepoPath(item) === '*') {
        errors.push('repository-wide wildcard claims are forbidden; split the work into bounded scopes');
        break;
      }
    }
  }

  if (!normalizeRepoPath(claimPath).startsWith('.ai/work-claims/')) {
    errors.push('claim file must live below .ai/work-claims/');
  }

  return errors;
}

export function listAddedClaimFiles(baseRef = 'origin/main', headRef = 'HEAD') {
  const diff = git(['diff', '--name-only', '--diff-filter=A', `${baseRef}...${headRef}`, '--', '.ai/work-claims']);
  if (!diff) return [];
  return diff.split(/\r?\n/).map(normalizeRepoPath).filter((entry) => entry.endsWith('.json'));
}

export function listChangedFiles(baseRef = 'origin/main', headRef = 'HEAD') {
  const diff = git(['diff', '--name-only', `${baseRef}...${headRef}`]);
  if (!diff) return [];
  return diff.split(/\r?\n/).map(normalizeRepoPath).filter(Boolean);
}

export async function githubJson(url, token, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
    signal: init.signal || AbortSignal.timeout(15_000),
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
    fail(`GitHub API ${response.status} for ${url}: ${detail}`);
  }

  return data;
}

export async function githubPaginated(pathname, token) {
  const results = [];
  for (let page = 1; page <= 20; page += 1) {
    const joiner = pathname.includes('?') ? '&' : '?';
    const pageData = await githubJson(`https://api.github.com${pathname}${joiner}per_page=100&page=${page}`, token);
    if (!Array.isArray(pageData)) fail(`Expected array from GitHub pagination endpoint: ${pathname}`);
    results.push(...pageData);
    if (pageData.length < 100) break;
  }
  return results;
}

export function appendGithubOutput(values) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const lines = Object.entries(values).map(([key, value]) => `${key}=${String(value ?? '')}`);
  fs.appendFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

export function semverTuple(version) {
  const match = String(version || '').trim().match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  if (!match) return null;
  return match.slice(1).map(Number);
}

export function compareSemver(a, b) {
  const left = semverTuple(a);
  const right = semverTuple(b);
  if (!left || !right) return null;
  for (let i = 0; i < 3; i += 1) {
    if (left[i] > right[i]) return 1;
    if (left[i] < right[i]) return -1;
  }
  return 0;
}
