import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export const PR_TEMPLATE_VERSION = '1.6.0';
export const LEGACY_PR_TEMPLATE_VERSIONS = Object.freeze(['1.5.0']);
export const SUPPORTED_PR_TEMPLATE_VERSIONS = Object.freeze([
  PR_TEMPLATE_VERSION,
  ...LEGACY_PR_TEMPLATE_VERSIONS,
]);
export const PR_TEMPLATE_MARKER = `CAPITAL_AI_PR_TEMPLATE_VERSION: ${PR_TEMPLATE_VERSION}`;

export function detectPrTemplateVersion(bodyText) {
  const body = String(bodyText || '');
  return SUPPORTED_PR_TEMPLATE_VERSIONS.find((version) =>
    body.includes(`CAPITAL_AI_PR_TEMPLATE_VERSION: ${version}`)
  ) || null;
}

export function bodyHasSupportedPrTemplateMarker(bodyText) {
  return detectPrTemplateVersion(bodyText) !== null;
}
export const DEFAULT_PRODUCTION_URL = 'https://capital-ai.online/';
export const DEFAULT_PRODUCTION_HEALTH_URL = 'https://capital-ai.online/healthz';
export const MAX_PR_START_DELAY_MS = 15 * 60 * 1000;
export const PRODUCTION_BASELINE_SCHEMA_VERSION = '1.2.0';
export const PRODUCTION_BASELINE_START = 'CAPITAL_AI_PRODUCTION_BASELINE_START';
export const PRODUCTION_BASELINE_END = 'CAPITAL_AI_PRODUCTION_BASELINE_END';

const GITHUB_ACTIONS_SKIP_DIRECTIVES = Object.freeze([
  '[skip ci]',
  '[ci skip]',
  '[no ci]',
  '[skip actions]',
  '[actions skip]',
]);

export function findGithubActionsSkipDirective(commitMessage) {
  const message = String(commitMessage || '');
  const normalized = message.toLowerCase();
  const bracketDirective = GITHUB_ACTIONS_SKIP_DIRECTIVES.find((directive) =>
    normalized.includes(directive)
  );
  if (bracketDirective) return bracketDirective;

  const trailer = message.match(/(?:^|\n)skip-checks:\s*true\s*(?=\n|$)/i);
  return trailer ? trailer[0].trim() : null;
}

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

// Some successful Git commands (for example `git cat-file -e`) intentionally write no
// stdout. `tryGit()` therefore returns an empty string on success, which MUST NOT be tested by
// truthiness. Use this helper whenever the contract is command success/failure rather than
// command output.
export function gitSucceeds(args, options = {}) {
  try {
    git(args, options);
    return true;
  } catch {
    return false;
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

export function productionBaselineIdentity(baseline) {
  return {
    schemaVersion: String(baseline?.schemaVersion || ''),
    productionUrl: String(baseline?.productionUrl || ''),
    productionHealthUrl: String(baseline?.productionHealthUrl || ''),
    productionStatus: String(baseline?.production?.status || ''),
    productionVersion: String(baseline?.production?.version || ''),
    productionSha: String(baseline?.production?.commitSha || '').toLowerCase(),
    productionBranch: String(baseline?.production?.branch || ''),
    productionRepo: String(baseline?.production?.repoSlug || ''),
    productionProvider: String(baseline?.production?.provider || ''),
    mainSha: String(baseline?.main?.sha || '').toLowerCase(),
    headSha: String(baseline?.head?.sha || '').toLowerCase(),
    headVersion: String(baseline?.head?.version || ''),
    productionToMainCommits: Number(baseline?.drift?.productionToMainCommits),
    mainToHeadCommits: Number(baseline?.drift?.mainToHeadCommits),
  };
}

export function computeProductionBaselineId(baseline) {
  const canonical = JSON.stringify(productionBaselineIdentity(baseline));
  return `sha256:${createHash('sha256').update(canonical, 'utf8').digest('hex')}`;
}

export function validateProductionBaselineForPr(baseline) {
  const errors = [];
  const identity = productionBaselineIdentity(baseline);

  if (identity.schemaVersion !== PRODUCTION_BASELINE_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${PRODUCTION_BASELINE_SCHEMA_VERSION}`);
  }
  if (identity.productionUrl !== DEFAULT_PRODUCTION_URL) {
    errors.push(`productionUrl must be ${DEFAULT_PRODUCTION_URL}`);
  }
  if (identity.productionHealthUrl !== DEFAULT_PRODUCTION_HEALTH_URL) {
    errors.push(`productionHealthUrl must be ${DEFAULT_PRODUCTION_HEALTH_URL}`);
  }
  if (identity.productionStatus !== 'ok') errors.push('production.status must be ok');
  if (!semverTuple(identity.productionVersion)) errors.push('production.version must be semantic x.y.z');
  if (!/^[0-9a-f]{40}$/i.test(identity.productionSha)) errors.push('production.commitSha must be a full 40-character SHA');
  if (identity.productionBranch !== 'main') errors.push('production.branch must be main');
  if (!identity.productionRepo) errors.push('production.repoSlug is required');
  if (!/^[0-9a-f]{40}$/i.test(identity.mainSha)) errors.push('main.sha must be a full 40-character SHA');
  if (!/^[0-9a-f]{40}$/i.test(identity.headSha)) errors.push('head.sha must be a full 40-character SHA');
  if (!semverTuple(identity.headVersion)) errors.push('head.version must be semantic x.y.z');
  if (!Number.isInteger(identity.productionToMainCommits) || identity.productionToMainCommits < 0) {
    errors.push('drift.productionToMainCommits must be a non-negative integer');
  }
  if (!Number.isInteger(identity.mainToHeadCommits) || identity.mainToHeadCommits < 0) {
    errors.push('drift.mainToHeadCommits must be a non-negative integer');
  }
  if (!baseline?.generatedAt || Number.isNaN(Date.parse(baseline.generatedAt))) {
    errors.push('generatedAt must be an ISO-8601 timestamp');
  } else if (Date.parse(baseline.generatedAt) > Date.now() + 5 * 60 * 1000) {
    errors.push('generatedAt must not be materially in the future');
  }
  if (baseline?.bootstrap === true) errors.push('bootstrap baselines are not valid for normal PRs');
  if (baseline?.checks?.productionHealthy !== true) errors.push('checks.productionHealthy must be true');
  if (baseline?.checks?.immutableProductionIdentity !== true) errors.push('checks.immutableProductionIdentity must be true');
  if (baseline?.checks?.productionBranchIsMain !== true) errors.push('checks.productionBranchIsMain must be true');
  if (baseline?.checks?.productionIsAncestorOfMain !== true) errors.push('checks.productionIsAncestorOfMain must be true');
  if (baseline?.checks?.branchContainsCurrentMain !== true) errors.push('checks.branchContainsCurrentMain must be true');

  const expectedId = computeProductionBaselineId(baseline);
  if (String(baseline?.baselineId || '') !== expectedId) {
    errors.push(`baselineId mismatch; expected ${expectedId}`);
  }

  return errors;
}

export function renderProductionBaselineBlock(baseline) {
  const errors = validateProductionBaselineForPr(baseline);
  if (errors.length > 0) {
    fail(`Produktions-Baseline ist nicht PR-renderfähig: ${errors.join('; ')}`);
  }

  return [
    `<!-- ${PRODUCTION_BASELINE_START} -->`,
    `\`${PRODUCTION_BASELINE_START}\``,
    `- **Baseline-ID:** \`${baseline.baselineId}\``,
    `- **Produktions-URL:** \`${baseline.productionUrl}\``,
    `- **Produktions-Health-URL:** \`${baseline.productionHealthUrl}\``,
    `- **Produktionsversion:** \`${baseline.production.version}\``,
    `- **Produktions-Commit:** \`${baseline.production.commitSha}\``,
    `- **Produktions-Branch:** \`${baseline.production.branch}\``,
    `- **Aktueller main-Commit:** \`${baseline.main.sha}\``,
    `- **PR-Head-Commit:** \`${baseline.head.sha}\``,
    `- **Abweichung Produktion → main:** \`${baseline.drift.productionToMainCommits}\` Commit(s)`,
    `- **Abweichung main → PR-Head:** \`${baseline.drift.mainToHeadCommits}\` Commit(s)`,
    `- **Baseline erzeugt am:** \`${baseline.generatedAt}\``,
    `\`${PRODUCTION_BASELINE_END}\``,
    `<!-- ${PRODUCTION_BASELINE_END} -->`,
  ].join('\n');
}

export function extractProductionBaselineBlock(body) {
  const text = String(body || '');
  const start = `<!-- ${PRODUCTION_BASELINE_START} -->`;
  const end = `<!-- ${PRODUCTION_BASELINE_END} -->`;
  const startAt = text.indexOf(start);
  const endAt = text.indexOf(end, startAt + start.length);
  if (startAt < 0 || endAt < 0) return null;
  return text.slice(startAt, endAt + end.length);
}

export function extractBaselineGeneratedAt(block) {
  const match = String(block || '').match(/- \*\*Baseline erzeugt am:\*\* `([^`]+)`/);
  return match ? match[1] : null;
}

/** True if body contains HTML-comment form and/or visible backtick form of a governance ID. */
export function bodyHasGovernanceId(body, id) {
  const text = String(body || '');
  return text.includes(`<!-- ${id} -->`) || text.includes(`\`${id}\``) || new RegExp(`(^|\\n)\\s*${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*($|\\n)`).test(text);
}
