#!/usr/bin/env node

import fs from 'node:fs/promises';

const API_VERSION = '2026-03-10';
const PREFIX = 'agent/security-codeql-autofix-alert-';
const MAIN_REF = 'refs/heads/main';
const MAX_ATTEMPTS = 3;
const POLL_ATTEMPTS = 18;
const POLL_DELAY_MS = 10_000;

const blockedExact = new Set([
  'AGENTS.md', 'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
  'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock',
  'render.yaml', 'server/env.ts', 'prisma/schema.prisma',
]);
const blockedPrefixes = [
  '.ai/', '.github/', 'docs/adr/', 'docs/governance/', 'docs/projects/',
  'supabase/migrations/', 'prisma/migrations/', 'db/migrations/',
  'database/migrations/', 'drizzle/', 'infra/', 'infrastructure/', 'terraform/',
];
const sensitivePath =
  /(^|\/)(auth|iam|mfa|oauth|billing|stripe|payment|credit|entitlement|license|subscription|secret|provider)[^/]*(?:\/|$)/i;

const clean = (v) => String(v ?? '').replace(/[\r\n`]/g, ' ').slice(0, 180);

export function protectedAutofixReason(file) {
  const p = String(file || '').replaceAll('\\', '/').replace(/^\/+/, '');
  if (!p) return 'empty path';
  if (blockedExact.has(p)) return 'repository control/config path';
  if (blockedPrefixes.some((prefix) => p.startsWith(prefix))) return 'governance/admin/infra path';
  if (/\.sql$/i.test(p)) return 'database SQL path';
  if (sensitivePath.test(p)) return 'IAM/billing/entitlement/secret/provider-sensitive path';
  return null;
}

export function codeqlLanguagesForFiles(files) {
  const result = new Set();
  for (const file of files) {
    const p = String(file || '').toLowerCase();
    if (/\.(?:[cm]?js|jsx|[cm]?ts|tsx)$/.test(p)) result.add('javascript-typescript');
    else if (/\.py$/.test(p)) result.add('python');
  }
  return [...result].sort();
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function appendEnvFile(name, text) {
  if (process.env[name]) await fs.appendFile(process.env[name], text);
}
const output = (name, value) => appendEnvFile('GITHUB_OUTPUT', `${name}=${String(value)}\n`);
const summary = (text) => appendEnvFile('GITHUB_STEP_SUMMARY', `${text}\n`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function client(token) {
  const base = process.env.GITHUB_API_URL || 'https://api.github.com';
  return async (method, path, body) => {
    const res = await fetch(`${base}${path}`, {
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
    const raw = await res.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
    if (!res.ok) {
      const message = typeof data === 'object' && data?.message ? data.message : String(data || '');
      const error = new Error(`${method} ${path}: HTTP ${res.status}${message ? ` — ${message}` : ''}`);
      error.status = res.status;
      throw error;
    }
    return data;
  };
}

async function currentMainSha(api, repo) {
  const ref = await api('GET', `/repos/${repo}/git/ref/heads/main`);
  const sha = ref?.object?.sha;
  if (!/^[0-9a-f]{40}$/i.test(String(sha || ''))) throw new Error('Invalid current main SHA.');
  return sha;
}

async function openAlerts(api, repo) {
  const all = [];
  for (let page = 1; page <= 20; page += 1) {
    const q = new URLSearchParams({
      state: 'open', ref: MAIN_REF, per_page: '100', page: String(page),
    });
    const items = await api('GET', `/repos/${repo}/code-scanning/alerts?${q}`);
    if (!Array.isArray(items)) throw new Error('Code scanning alert response is not an array.');
    all.push(...items);
    if (items.length < 100) break;
  }
  return all;
}

function eligible(alert) {
  const severity = String(alert?.rule?.security_severity_level || '').toLowerCase();
  return alert?.state === 'open'
    && alert?.tool?.name === 'CodeQL'
    && alert?.most_recent_instance?.ref === MAIN_REF
    && ['critical', 'high'].includes(severity);
}
const rank = (s) => ({ critical: 0, high: 1 }[String(s || '').toLowerCase()] ?? 99);

async function branchExists(api, repo, number) {
  try {
    const refs = await api('GET', `/repos/${repo}/git/matching-refs/heads/${PREFIX}${number}-`);
    return Array.isArray(refs) && refs.length > 0;
  } catch (error) {
    if (error?.status === 409) return false;
    throw error;
  }
}

async function waitForAutofix(api, repo, number) {
  for (let i = 0; i < POLL_ATTEMPTS; i += 1) {
    const status = await api('GET', `/repos/${repo}/code-scanning/alerts/${number}/autofix`);
    if (status?.status === 'success') return status;
    if (['failure', 'failed', 'error'].includes(String(status?.status || '').toLowerCase())) return status;
    if (i + 1 < POLL_ATTEMPTS) await sleep(POLL_DELAY_MS);
  }
  return { status: 'timeout' };
}

async function setDefaultOutputs() {
  await Promise.all([
    output('candidate_created', 'false'), output('candidate_safe', 'false'),
    output('branch', ''), output('commit_sha', ''), output('base_sha', ''),
    output('alert_number', ''), output('languages', ''),
  ]);
}

async function main() {
  const repo = required('GITHUB_REPOSITORY');
  const api = client(required('GITHUB_TOKEN'));
  await setDefaultOutputs();

  const alerts = (await openAlerts(api, repo))
    .filter(eligible)
    .sort((a, b) => rank(a?.rule?.security_severity_level) - rank(b?.rule?.security_severity_level)
      || Number(a?.number || 0) - Number(b?.number || 0));

  if (!alerts.length) {
    await summary('## Controlled CodeQL Autofix\n\nKeine offenen `CRITICAL`/`HIGH` CodeQL-Alerts auf `main` gefunden.');
    return;
  }

  let attempts = 0;
  for (const alert of alerts) {
    if (attempts >= MAX_ATTEMPTS) break;
    const number = Number(alert.number);
    if (!Number.isInteger(number) || number <= 0 || await branchExists(api, repo, number)) continue;
    attempts += 1;

    const generationBase = await currentMainSha(api, repo);
    let generated;
    try {
      await api('POST', `/repos/${repo}/code-scanning/alerts/${number}/autofix`);
      generated = await waitForAutofix(api, repo, number);
    } catch (error) {
      await summary(`- Alert #${number}: Autofix nicht erzeugbar (${clean(error.message)}).`);
      continue;
    }
    if (generated?.status !== 'success') {
      await summary(`- Alert #${number}: Autofix-Status \`${clean(generated?.status || 'unknown')}\`.`);
      continue;
    }

    const baseSha = await currentMainSha(api, repo);
    if (baseSha !== generationBase) {
      await summary(`- Alert #${number}: main driftete während der Generierung; kein Branch/Commit.`);
      return;
    }

    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const branch = `${PREFIX}${number}-${date}`;
    await api('POST', `/repos/${repo}/git/refs`, {
      ref: `refs/heads/${branch}`, sha: baseSha,
    });

    if (await currentMainSha(api, repo) !== baseSha) {
      await summary(`## Controlled CodeQL Autofix\n\nAlert #${number}: main driftete nach Branch-Erzeugung. \`${branch}\` bleibt unverändert und ohne PR.`);
      return;
    }

    let committed;
    try {
      committed = await api('POST', `/repos/${repo}/code-scanning/alerts/${number}/autofix/commits`, {
        target_ref: `refs/heads/${branch}`,
        message: `security: CodeQL Autofix für Alert #${number}`,
      });
    } catch (error) {
      await summary(`## Controlled CodeQL Autofix\n\nAlert #${number}: Commit fehlgeschlagen. \`${branch}\` bleibt ohne PR. ${clean(error.message)}`);
      return;
    }

    const commitSha = committed?.sha;
    if (!/^[0-9a-f]{40}$/i.test(String(commitSha || ''))) throw new Error('Invalid autofix commit SHA.');
    if (committed?.target_ref && committed.target_ref !== `refs/heads/${branch}`) {
      throw new Error('Autofix commit returned an unexpected target ref.');
    }

    const compare = await api('GET', `/repos/${repo}/compare/${baseSha}...${commitSha}`);
    const files = Array.isArray(compare?.files) ? compare.files.map((f) => f?.filename).filter(Boolean) : [];
    const blocked = files
      .map((file) => ({ file, reason: protectedAutofixReason(file) }))
      .filter((entry) => entry.reason);
    const languages = codeqlLanguagesForFiles(files);
    const relationSafe = compare?.status === 'ahead'
      && Number(compare?.behind_by || 0) === 0
      && Number(compare?.ahead_by || 0) >= 1
      && files.length > 0;
    const safe = relationSafe && blocked.length === 0 && languages.length > 0;

    await Promise.all([
      output('candidate_created', 'true'), output('candidate_safe', safe ? 'true' : 'false'),
      output('branch', branch), output('commit_sha', commitSha), output('base_sha', baseSha),
      output('alert_number', number), output('languages', languages.join(',')),
    ]);

    const changed = files.map((file) => `- \`${clean(file)}\``).join('\n') || '- none';
    const quarantined = blocked.map((e) => `- \`${clean(e.file)}\` — ${e.reason}`).join('\n') || '- none';
    await summary([
      '## Controlled CodeQL Autofix', '',
      `- Alert: #${number}`,
      `- Regel: \`${clean(alert?.rule?.id || alert?.rule?.name || 'unknown')}\``,
      `- Severity: \`${clean(alert?.rule?.security_severity_level || 'unknown')}\``,
      `- Baseline: \`${baseSha}\``, `- Branch: \`${branch}\``, `- Head: \`${commitSha}\``,
      `- Status: **${safe ? 'SAFE_FOR_VALIDATION' : 'BLOCKED_FAIL_CLOSED'}**`, '',
      '### Geänderte Dateien', changed, '', '### Quarantänegründe', quarantined, '',
      safe
        ? 'Technische Validierung darf folgen. **Kein PR** wird automatisch erzeugt.'
        : 'Branch bleibt quarantänisiert. **Kein PR, Merge oder Alert-Dismissal**.',
    ].join('\n'));
    return;
  }

  await summary('## Controlled CodeQL Autofix\n\nKein neuer validierbarer Autofix-Kandidat in diesem Lauf.');
}

const direct = process.argv[1]
  && new URL(import.meta.url).pathname === new URL(`file://${process.argv[1]}`).pathname;
if (direct) {
  main().catch(async (error) => {
    try { await summary(`## Controlled CodeQL Autofix\n\n**FAIL-CLOSED:** ${clean(error?.message || error)}`); } catch {}
    console.error(error);
    process.exitCode = 1;
  });
}
