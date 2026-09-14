#!/usr/bin/env node

import fs from 'node:fs/promises';

const API_VERSION = '2026-03-10';
const AUTOFIX_PREFIX = 'agent/security-codeql-autofix-alert-';
const DEFAULT_BRANCH_REF = 'refs/heads/main';
const MAX_GENERATION_ATTEMPTS = 3;
const POLL_ATTEMPTS = 18;
const POLL_DELAY_MS = 10_000;

const blockedExactPaths = new Set([
  'AGENTS.md',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'render.yaml',
]);

const blockedPrefixes = [
  '.ai/',
  '.github/',
  'docs/adr/',
  'docs/governance/',
  'docs/projects/',
  'supabase/migrations/',
];

const sensitivePathPattern =
  /(^|\/)(auth|iam|mfa|oauth|billing|stripe|payment|credit|entitlement|license|subscription|secret)[^/]*(?:\/|$)/i;

function sanitizeInline(value) {
  return String(value ?? '').replace(/[\r\n`]/g, ' ').slice(0, 180);
}

export function protectedAutofixReason(file) {
  const normalized = String(file || '').replaceAll('\\', '/').replace(/^\/+/, '');
  if (!normalized) return 'empty path';
  if (blockedExactPaths.has(normalized)) return 'repository control/config path';
  if (blockedPrefixes.some((prefix) => normalized.startsWith(prefix))) return 'governance/admin path';
  if (/\.sql$/i.test(normalized)) return 'database SQL path';
  if (sensitivePathPattern.test(normalized)) return 'IAM/billing/entitlement/secret-sensitive path';
  return null;
}

export function codeqlLanguagesForFiles(files) {
  const languages = new Set();
  for (const file of files) {
    const normalized = String(file || '').toLowerCase();
    if (/\.(?:[cm]?js|jsx|tsx?|mjs|cjs)$/.test(normalized)) {
      languages.add('javascript-typescript');
    } else if (/\.py$/.test(normalized)) {
      languages.add('python');
    }
  }
  return [...languages].sort();
}

function severityRank(level) {
  return { critical: 0, high: 1, medium: 2, low: 3, warning: 4, note: 5 }[
    String(level || '').toLowerCase()
  ] ?? 99;
}

function isEligibleAlert(alert) {
  const securitySeverity = String(alert?.rule?.security_severity_level || '').toLowerCase();
  return alert?.state === 'open'
    && alert?.tool?.name === 'CodeQL'
    && alert?.most_recent_instance?.ref === DEFAULT_BRANCH_REF
    && ['critical', 'high'].includes(securitySeverity);
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function appendFileIfConfigured(name, text) {
  const target = process.env[name];
  if (target) await fs.appendFile(target, text);
}

async function setOutput(name, value) {
  await appendFileIfConfigured('GITHUB_OUTPUT', `${name}=${String(value)}\n`);
}

async function addSummary(markdown) {
  await appendFileIfConfigured('GITHUB_STEP_SUMMARY', `${markdown}\n`);
}

function makeApiClient(token) {
  const apiBase = process.env.GITHUB_API_URL || 'https://api.github.com';

  return async function api(method, path, body) {
    const response = await fetch(`${apiBase}${path}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': API_VERSION,
        'User-Agent': 'capital-ai-controlled-codeql-autofix',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    const raw = await response.text();
    let data = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = raw;
      }
    }

    if (!response.ok) {
      const message = typeof data === 'object' && data?.message ? data.message : String(data || '');
      const error = new Error(
        `${method} ${path} failed with HTTP ${response.status}${message ? `: ${message}` : ''}`,
      );
      error.status = response.status;
      throw error;
    }

    return data;
  };
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function listOpenAlerts(api, repository) {
  const results = [];
  for (let page = 1; page <= 20; page += 1) {
    const query = new URLSearchParams({
      state: 'open',
      ref: DEFAULT_BRANCH_REF,
      per_page: '100',
      page: String(page),
    });
    const pageItems = await api(
      'GET',
      `/repos/${repository}/code-scanning/alerts?${query.toString()}`,
    );
    if (!Array.isArray(pageItems)) throw new Error('Code scanning alerts response was not an array.');
    results.push(...pageItems);
    if (pageItems.length < 100) break;
  }
  return results;
}

async function hasExistingAutofixBranch(api, repository, alertNumber) {
  const prefix = `heads/${AUTOFIX_PREFIX}${alertNumber}-`;
  try {
    const refs = await api('GET', `/repos/${repository}/git/matching-refs/${prefix}`);
    return Array.isArray(refs) && refs.length > 0;
  } catch (error) {
    if (error?.status === 409) return false;
    throw error;
  }
}

async function waitForAutofix(api, repository, alertNumber) {
  for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt += 1) {
    const status = await api(
      'GET',
      `/repos/${repository}/code-scanning/alerts/${alertNumber}/autofix`,
    );
    if (status?.status === 'success') return status;
    if (['failure', 'failed', 'error'].includes(String(status?.status || '').toLowerCase())) {
      return status;
    }
    if (attempt < POLL_ATTEMPTS) await sleep(POLL_DELAY_MS);
  }
  return { status: 'timeout' };
}

async function currentMainSha(api, repository) {
  const ref = await api('GET', `/repos/${repository}/git/ref/heads/main`);
  const sha = ref?.object?.sha;
  if (!/^[0-9a-f]{40}$/i.test(String(sha || ''))) {
    throw new Error('Could not resolve a valid current main SHA.');
  }
  return sha;
}

async function createBranch(api, repository, branch, sha) {
  if (!branch.startsWith(AUTOFIX_PREFIX) || branch === 'main') {
    throw new Error(`Refusing unsafe autofix branch name: ${branch}`);
  }
  await api('POST', `/repos/${repository}/git/refs`, {
    ref: `refs/heads/${branch}`,
    sha,
  });
}

async function compareCandidate(api, repository, baseSha, headSha) {
  return api('GET', `/repos/${repository}/compare/${baseSha}...${headSha}`);
}

async function main() {
  const token = getRequiredEnv('GITHUB_TOKEN');
  const repository = getRequiredEnv('GITHUB_REPOSITORY');
  const api = makeApiClient(token);

  await Promise.all([
    setOutput('candidate_created', 'false'),
    setOutput('candidate_safe', 'false'),
    setOutput('branch', ''),
    setOutput('commit_sha', ''),
    setOutput('base_sha', ''),
    setOutput('alert_number', ''),
    setOutput('languages', ''),
  ]);

  const alerts = (await listOpenAlerts(api, repository))
    .filter(isEligibleAlert)
    .sort((a, b) => {
      const severityDelta =
        severityRank(a?.rule?.security_severity_level) - severityRank(b?.rule?.security_severity_level);
      return severityDelta || Number(a?.number || 0) - Number(b?.number || 0);
    });

  if (alerts.length === 0) {
    await addSummary('## Controlled CodeQL Autofix\n\nKeine offenen `CRITICAL`/`HIGH` CodeQL-Alerts auf `main` gefunden.');
    return;
  }

  let attempts = 0;
  for (const alert of alerts) {
    if (attempts >= MAX_GENERATION_ATTEMPTS) break;

    const alertNumber = Number(alert.number);
    if (!Number.isInteger(alertNumber) || alertNumber <= 0) continue;
    if (await hasExistingAutofixBranch(api, repository, alertNumber)) continue;

    attempts += 1;

    let generated;
    try {
      await api(
        'POST',
        `/repos/${repository}/code-scanning/alerts/${alertNumber}/autofix`,
      );
      generated = await waitForAutofix(api, repository, alertNumber);
    } catch (error) {
      await addSummary(
        `- Alert #${alertNumber}: Autofix konnte nicht erzeugt werden (${sanitizeInline(error.message)}).`,
      );
      continue;
    }

    if (generated?.status !== 'success') {
      await addSummary(
        `- Alert #${alertNumber}: kein erfolgreicher Autofix (${sanitizeInline(generated?.status || 'unknown')}).`,
      );
      continue;
    }

    const baseSha = await currentMainSha(api, repository);
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const branch = `${AUTOFIX_PREFIX}${alertNumber}-${date}`;

    try {
      await createBranch(api, repository, branch, baseSha);
    } catch (error) {
      if (error?.status === 422) {
        await addSummary(`- Alert #${alertNumber}: Branch existiert bereits oder wurde parallel erzeugt; Lauf stoppt fail-closed.`);
        return;
      }
      throw error;
    }

    let committed;
    try {
      committed = await api(
        'POST',
        `/repos/${repository}/code-scanning/alerts/${alertNumber}/autofix/commits`,
        {
          target_ref: `refs/heads/${branch}`,
          message: `security: CodeQL Autofix für Alert #${alertNumber}`,
        },
      );
    } catch (error) {
      await addSummary(
        `## Controlled CodeQL Autofix\n\nAlert #${alertNumber}: Autofix-Commit auf \`${branch}\` fehlgeschlagen. Der isolierte Branch bleibt ohne PR bestehen. Fehler: ${sanitizeInline(error.message)}`,
      );
      return;
    }

    const commitSha = committed?.sha;
    if (!/^[0-9a-f]{40}$/i.test(String(commitSha || ''))) {
      throw new Error(`Autofix commit for alert #${alertNumber} returned no valid commit SHA.`);
    }

    const comparison = await compareCandidate(api, repository, baseSha, commitSha);
    const files = Array.isArray(comparison?.files)
      ? comparison.files.map((file) => file?.filename).filter(Boolean)
      : [];

    const blocked = files
      .map((file) => ({ file, reason: protectedAutofixReason(file) }))
      .filter((entry) => entry.reason);

    const languages = codeqlLanguagesForFiles(files);
    const relationSafe =
      comparison?.status === 'ahead'
      && Number(comparison?.behind_by || 0) === 0
      && Number(comparison?.ahead_by || 0) >= 1
      && files.length > 0;

    const scopeSafe = relationSafe && blocked.length === 0 && languages.length > 0;

    await Promise.all([
      setOutput('candidate_created', 'true'),
      setOutput('candidate_safe', scopeSafe ? 'true' : 'false'),
      setOutput('branch', branch),
      setOutput('commit_sha', commitSha),
      setOutput('base_sha', baseSha),
      setOutput('alert_number', alertNumber),
      setOutput('languages', languages.join(',')),
    ]);

    const fileList = files.length > 0 ? files.map((file) => `- \`${sanitizeInline(file)}\``).join('\n') : '- none';
    const blockedList =
      blocked.length > 0
        ? blocked.map((entry) => `- \`${sanitizeInline(entry.file)}\` — ${entry.reason}`).join('\n')
        : '- none';

    await addSummary(
      [
        '## Controlled CodeQL Autofix',
        '',
        `- Alert: #${alertNumber}`,
        `- Regel: \`${sanitizeInline(alert?.rule?.id || alert?.rule?.name || 'unknown')}\``,
        `- Severity: \`${sanitizeInline(alert?.rule?.security_severity_level || 'unknown')}\``,
        `- Baseline: \`${baseSha}\``,
        `- Branch: \`${branch}\``,
        `- Autofix commit: \`${commitSha}\``,
        `- Kontrollstatus: **${scopeSafe ? 'SAFE_FOR_VALIDATION' : 'BLOCKED_FAIL_CLOSED'}**`,
        '',
        '### Geänderte Dateien',
        fileList,
        '',
        '### Geschützte/gesperrte Pfade',
        blockedList,
        '',
        scopeSafe
          ? 'Der Kandidat darf in die technische Validierung gehen. Es wird **kein Pull Request** erzeugt.'
          : 'Der Branch bleibt quarantänisiert. Es wird **kein Pull Request**, **kein Merge** und **kein Alert-Dismissal** ausgeführt.',
      ].join('\n'),
    );
    return;
  }

  await addSummary(
    '## Controlled CodeQL Autofix\n\nGeeignete Alerts wurden gefunden, aber in diesem Lauf konnte kein neuer validierbarer Autofix-Kandidat erzeugt werden.',
  );
}

const isDirectRun = process.argv[1] && new URL(import.meta.url).pathname === new URL(`file://${process.argv[1]}`).pathname;

if (isDirectRun) {
  main().catch(async (error) => {
    try {
      await addSummary(`## Controlled CodeQL Autofix\n\n**FAIL-CLOSED:** ${sanitizeInline(error?.message || error)}`);
    } catch {
      // Best effort only; never mask the original failure.
    }
    console.error(error);
    process.exitCode = 1;
  });
}
