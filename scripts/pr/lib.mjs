import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export const PR_TEMPLATE_VERSION = '1.6.0';
export const PR_TEMPLATE_MARKER = `CAPITAL_AI_PR_TEMPLATE_VERSION: ${PR_TEMPLATE_VERSION}`;
export const LEGACY_PR_TEMPLATE_MARKERS = Object.freeze([
  'CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0',
]);
export const ACCEPTED_PR_TEMPLATE_MARKERS = Object.freeze([
  PR_TEMPLATE_MARKER,
  ...LEGACY_PR_TEMPLATE_MARKERS,
]);
export const DEFAULT_PRODUCTION_URL = 'https://capital-ai.online/';
export const DEFAULT_PRODUCTION_HEALTH_URL = 'https://capital-ai.online/healthz';
export const MAX_PR_START_DELAY_MS = 15 * 60 * 1000;
export const PRODUCTION_BASELINE_SCHEMA_VERSION = '1.2.0';
export const PRODUCTION_BASELINE_START = 'CAPITAL_AI_PRODUCTION_BASELINE_START';
export const PRODUCTION_BASELINE_END = 'CAPITAL_AI_PRODUCTION_BASELINE_END';

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
    execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });
    return true;
  } catch {
    return false;
  }
}

export function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function parseJsonSafe(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function appendGithubOutput(values) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const lines = Object.entries(values).map(([key, value]) => `${key}=${String(value)}`);
  fs.appendFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

export function listAddedClaimFiles(baseRef, headRef) {
  const output = git([
    'diff',
    '--name-status',
    '--diff-filter=A',
    baseRef,
    headRef,
    '--',
    '.ai/work-claims/*.json',
  ]);
  if (!output) return [];
  return output
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/).at(-1))
    .filter(Boolean);
}

export function normalizeProductionUrl(value) {
  const url = new URL(value);
  url.hash = '';
  url.search = '';
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.toString();
}

export function normalizeHealthUrl(value) {
  const url = new URL(value);
  url.hash = '';
  url.search = '';
  return url.toString();
}

export function canonicalProductionBaselinePayload(baseline) {
  return {
    schemaVersion: String(baseline.schemaVersion || PRODUCTION_BASELINE_SCHEMA_VERSION),
    productionUrl: normalizeProductionUrl(baseline.productionUrl),
    productionHealthUrl: normalizeHealthUrl(baseline.productionHealthUrl),
    productionVersion: String(baseline.productionVersion),
    productionCommit: String(baseline.productionCommit).toLowerCase(),
    productionBranch: String(baseline.productionBranch),
    currentMainCommit: String(baseline.currentMainCommit).toLowerCase(),
    prHeadCommit: String(baseline.prHeadCommit).toLowerCase(),
    productionToMainDrift: Number(baseline.productionToMainDrift),
    mainToPrHeadDrift: Number(baseline.mainToPrHeadDrift),
  };
}

export function productionBaselineIdentity(baseline) {
  const payload = canonicalProductionBaselinePayload(baseline);
  return JSON.stringify(payload);
}

export function computeProductionBaselineId(baseline) {
  return `sha256:${createHash('sha256').update(productionBaselineIdentity(baseline)).digest('hex')}`;
}

export function validateProductionBaselineForPr(baseline) {
  const errors = [];
  if (!baseline || typeof baseline !== 'object') return ['Baseline ist kein Objekt.'];
  const required = [
    'schemaVersion',
    'baselineId',
    'productionUrl',
    'productionHealthUrl',
    'productionVersion',
    'productionCommit',
    'productionBranch',
    'currentMainCommit',
    'prHeadCommit',
    'productionToMainDrift',
    'mainToPrHeadDrift',
    'generatedAt',
  ];
  for (const key of required) {
    if (baseline[key] === undefined || baseline[key] === null || String(baseline[key]).trim() === '') {
      errors.push(`Pflichtfeld fehlt: ${key}`);
    }
  }
  if (errors.length > 0) return errors;
  if (String(baseline.schemaVersion) !== PRODUCTION_BASELINE_SCHEMA_VERSION) {
    errors.push(`Unerwartete Baseline-Schema-Version: ${baseline.schemaVersion}`);
  }
  const shaPattern = /^[0-9a-f]{40}$/i;
  for (const key of ['productionCommit', 'currentMainCommit', 'prHeadCommit']) {
    if (!shaPattern.test(String(baseline[key]))) errors.push(`Ungültige Commit-SHA: ${key}`);
  }
  if (!Number.isInteger(Number(baseline.productionToMainDrift)) || Number(baseline.productionToMainDrift) < 0) {
    errors.push('productionToMainDrift muss eine nichtnegative Ganzzahl sein.');
  }
  if (!Number.isInteger(Number(baseline.mainToPrHeadDrift)) || Number(baseline.mainToPrHeadDrift) < 0) {
    errors.push('mainToPrHeadDrift muss eine nichtnegative Ganzzahl sein.');
  }
  try {
    if (normalizeProductionUrl(baseline.productionUrl) !== normalizeProductionUrl(DEFAULT_PRODUCTION_URL)) {
      errors.push(`Produktions-URL weicht vom kanonischen Wert ab: ${baseline.productionUrl}`);
    }
  } catch {
    errors.push(`Ungültige Produktions-URL: ${baseline.productionUrl}`);
  }
  try {
    if (normalizeHealthUrl(baseline.productionHealthUrl) !== normalizeHealthUrl(DEFAULT_PRODUCTION_HEALTH_URL)) {
      errors.push(`Produktions-Health-URL weicht vom kanonischen Wert ab: ${baseline.productionHealthUrl}`);
    }
  } catch {
    errors.push(`Ungültige Produktions-Health-URL: ${baseline.productionHealthUrl}`);
  }
  const expectedId = computeProductionBaselineId(baseline);
  if (String(baseline.baselineId) !== expectedId) {
    errors.push(`Baseline-ID stimmt nicht mit dem atomaren Inhalt überein: erwartet ${expectedId}`);
  }
  if (Number.isNaN(Date.parse(String(baseline.generatedAt)))) {
    errors.push(`Ungültiger generatedAt-Zeitstempel: ${baseline.generatedAt}`);
  }
  return errors;
}

export function renderProductionBaselineBlock(baseline) {
  const errors = validateProductionBaselineForPr(baseline);
  if (errors.length > 0) fail(`Produktions-Baseline kann nicht gerendert werden: ${errors.join('; ')}`);
  return [
    `<!-- ${PRODUCTION_BASELINE_START} -->`,
    `\`${PRODUCTION_BASELINE_START}\``,
    `- **Baseline-ID:** \`${baseline.baselineId}\``,
    `- **Produktions-URL:** \`${baseline.productionUrl}\``,
    `- **Produktions-Health-URL:** \`${baseline.productionHealthUrl}\``,
    `- **Produktionsversion:** \`${baseline.productionVersion}\``,
    `- **Produktions-Commit:** \`${baseline.productionCommit}\``,
    `- **Produktions-Branch:** \`${baseline.productionBranch}\``,
    `- **Aktueller main-Commit:** \`${baseline.currentMainCommit}\``,
    `- **PR-Head-Commit:** \`${baseline.prHeadCommit}\``,
    `- **Abweichung Produktion → main:** \`${baseline.productionToMainDrift}\` Commit(s)`,
    `- **Abweichung main → PR-Head:** \`${baseline.mainToPrHeadDrift}\` Commit(s)`,
    `- **Baseline erzeugt am:** \`${baseline.generatedAt}\``,
    `\`${PRODUCTION_BASELINE_END}\``,
    `<!-- ${PRODUCTION_BASELINE_END} -->`,
  ].join('\n');
}

export function bodyHasGovernanceId(bodyText, id) {
  const escaped = String(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:<!--\\s*${escaped}\\s*-->|\\b${escaped}\\b)`).test(String(bodyText || ''));
}

export function extractProductionBaselineBlock(bodyText) {
  const text = String(bodyText || '');
  const startComment = `<!-- ${PRODUCTION_BASELINE_START} -->`;
  const endComment = `<!-- ${PRODUCTION_BASELINE_END} -->`;
  const start = text.indexOf(startComment);
  const end = text.indexOf(endComment);
  if (start < 0 || end < 0 || end < start) return null;
  if (text.indexOf(startComment, start + startComment.length) >= 0) return null;
  if (text.indexOf(endComment, end + endComment.length) >= 0) return null;
  return text.slice(start, end + endComment.length);
}

export function extractBaselineGeneratedAt(blockText) {
  const match = String(blockText || '').match(/- \*\*Baseline erzeugt am:\*\* `([^`]+)`/);
  return match?.[1] || null;
}

export async function githubJson(url, token, options = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'capital-ai-governance',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(url, { ...options, headers });
  const text = await response.text();
  const parsed = text ? parseJsonSafe(text) : null;
  if (!response.ok) {
    const detail = parsed?.message || text || `HTTP ${response.status}`;
    fail(`GitHub API ${response.status}: ${detail}`);
  }
  return parsed;
}

export function compareSha(a, b) {
  return String(a || '').toLowerCase() === String(b || '').toLowerCase();
}

export function assertExactSha(value, label) {
  if (!/^[0-9a-f]{40}$/i.test(String(value || ''))) fail(`${label} ist keine vollständige Commit-SHA.`);
  return String(value).toLowerCase();
}

export function parseIsoTimestamp(value, label = 'Zeitstempel') {
  const raw = String(value || '').trim();
  const parsed = Date.parse(raw);
  if (!raw || Number.isNaN(parsed)) fail(`${label} ist kein gültiger ISO-Zeitstempel.`);
  return parsed;
}

export function assertFreshTimestamp(value, maxAgeMs, label = 'Zeitstempel') {
  const parsed = parseIsoTimestamp(value, label);
  const age = Date.now() - parsed;
  if (age < -60_000) fail(`${label} liegt unzulässig in der Zukunft.`);
  if (age > maxAgeMs) fail(`${label} ist zu alt (${Math.round(age / 1000)}s).`);
  return parsed;
}

export function sanitizeBranchName(value) {
  return String(value || '')
    .trim()
    .replace(/^refs\/heads\//, '')
    .replace(/[^A-Za-z0-9._\/-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-/]+|[-/]+$/g, '');
}

export function stableSortObject(value) {
  if (Array.isArray(value)) return value.map(stableSortObject);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableSortObject(value[key])]),
  );
}

export function stableJson(value) {
  return JSON.stringify(stableSortObject(value));
}
