import fs from 'node:fs';

export const GITHUB_ACTIONS_MINUTE_BLOCKER_MARKER = 'CAPITAL_AI_ACTIONS_MINUTE_BLOCKER_V1';
export const GITHUB_ACTIONS_MINUTE_BLOCKER_TITLE = '[CAPITAL-AI][ACTIONS-COST-BLOCKER] 45.000 Monatsminuten erreicht';

const API_VERSION = '2026-03-10';
const MAX_ISSUE_PAGES = 10;

function fail(message) {
  throw new Error(`[GITHUB-ACTIONS-MINUTE-BLOCKER] ${message}`);
}

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) fail(`missing required environment variable: ${name}`);
  return value;
}

function reportPath() {
  return requiredEnv('CAPITAL_AI_GITHUB_COST_WATCH_REPORT_PATH');
}

function assertReport(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) fail('report must be an object');
  if (report.schemaVersion !== '1.0.0') fail('unsupported report schemaVersion');
  if (!['monitor', 'test'].includes(report.mode)) fail('report mode must be monitor or test');
  if (!report.actionsMinutes || typeof report.actionsMinutes !== 'object' || Array.isArray(report.actionsMinutes)) {
    fail('report.actionsMinutes missing');
  }
  const policy = report.actionsMinutes;
  if (!['BELOW_WARNING', 'WARNING', 'BLOCKED'].includes(policy.state)) fail('invalid actions minute state');
  if (typeof policy.blockerRequired !== 'boolean') fail('actions minute blockerRequired must be boolean');
  if (typeof policy.consumedGrossMinutes !== 'number' || !Number.isFinite(policy.consumedGrossMinutes)) {
    fail('actions minute consumedGrossMinutes must be finite');
  }
  return report;
}

async function githubRequest({ token, method, path, body }) {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': API_VERSION,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    fail(`GitHub API ${method} ${path} failed with HTTP ${response.status}`);
  }
  return payload;
}

async function listOpenBlockerIssues({ token, owner, repo }) {
  const matches = [];
  for (let page = 1; page <= MAX_ISSUE_PAGES; page += 1) {
    const items = await githubRequest({
      token,
      method: 'GET',
      path: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=open&per_page=100&page=${page}`,
    });
    if (!Array.isArray(items)) fail('GitHub issues response must be an array');
    for (const issue of items) {
      if (issue?.pull_request) continue;
      const body = String(issue?.body || '');
      if (body.includes(`<!-- ${GITHUB_ACTIONS_MINUTE_BLOCKER_MARKER} -->`)) matches.push(issue);
    }
    if (items.length < 100) break;
  }
  return matches;
}

function renderBlockerBody(report) {
  const policy = report.actionsMinutes;
  const cycle = report.cycle && typeof report.cycle === 'object' ? report.cycle : {};
  return [
    `<!-- ${GITHUB_ACTIONS_MINUTE_BLOCKER_MARKER} -->`,
    '# GitHub Actions Cost Blocker',
    '',
    'Dieser Issue wird ausschließlich durch den kanonischen GitHub Cost Watch verwaltet.',
    '',
    `- **Status:** BLOCKED`,
    `- **Monatszyklus:** ${String(cycle.year || 'unknown')}-${String(cycle.month || 'unknown').padStart(2, '0')}`,
    `- **Verbrauchte Enterprise-Actions-Minuten:** ${policy.consumedGrossMinutes}`,
    `- **Warnschwelle:** ${policy.warningThresholdMinutes}`,
    `- **Hard-Blocker-Schwelle:** ${policy.blockerThresholdMinutes}`,
    `- **Erkannt am:** ${String(report.generatedAt || 'unknown')}`,
    `- **Quelle:** ${String(policy.source || 'enterprise.billing.usage.summary')}`,
    '',
    'Solange dieser Issue offen ist, müssen die kanonischen kostenrelevanten Required-Workflows fail-closed vor Checkout/npm/build/test/container work abbrechen.',
    'Der GitHub Cost Watch selbst bleibt aktiv, damit der Blocker am Monatswechsel automatisch geschlossen werden kann.',
    '',
    'Manuelles Schließen hebt den Grenzwert nicht dauerhaft auf: Solange der Monatsverbrauch >= 45.000 Minuten bleibt, wird der Blocker beim nächsten Monitor-Lauf erneut materialisiert.',
    '',
  ].join('\n');
}

export async function syncGitHubActionsMinuteBlocker({
  report,
  token,
  repository,
} = {}) {
  const checked = assertReport(report);
  if (checked.mode !== 'monitor') {
    return Object.freeze({ status: 'SKIPPED', reason: 'test_mode_has_no_blocker_mutation' });
  }

  const [owner, repo] = String(repository || '').split('/');
  if (!owner || !repo) fail('repository must be owner/name');
  if (!token) fail('GitHub token is required');

  const existing = await listOpenBlockerIssues({ token, owner, repo });
  if (existing.length > 1) {
    fail(`multiple open Actions minute blocker issues detected: ${existing.map((issue) => issue.number).join(',')}`);
  }

  if (checked.actionsMinutes.blockerRequired) {
    if (existing.length === 1) {
      return Object.freeze({
        status: 'BLOCKER_ACTIVE',
        created: false,
        issueNumber: Number(existing[0].number),
      });
    }

    const issue = await githubRequest({
      token,
      method: 'POST',
      path: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`,
      body: {
        title: GITHUB_ACTIONS_MINUTE_BLOCKER_TITLE,
        body: renderBlockerBody(checked),
      },
    });
    return Object.freeze({
      status: 'BLOCKER_CREATED',
      created: true,
      issueNumber: Number(issue?.number),
    });
  }

  if (existing.length === 1) {
    const issueNumber = Number(existing[0].number);
    if (!Number.isInteger(issueNumber) || issueNumber <= 0) fail('existing blocker issue number is invalid');
    await githubRequest({
      token,
      method: 'POST',
      path: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}/comments`,
      body: {
        body: `Cost Watch resolved the monthly Actions blocker automatically at ${String(checked.generatedAt || 'unknown')}; current minute state: ${checked.actionsMinutes.state} (${checked.actionsMinutes.consumedGrossMinutes} minutes).`,
      },
    });
    await githubRequest({
      token,
      method: 'PATCH',
      path: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}`,
      body: { state: 'closed', state_reason: 'completed' },
    });
    return Object.freeze({
      status: 'BLOCKER_CLOSED',
      created: false,
      issueNumber,
    });
  }

  return Object.freeze({ status: 'CLEAR', created: false, issueNumber: null });
}

if (process.argv[1]?.endsWith('syncGitHubActionsMinuteBlocker.mjs')) {
  const report = JSON.parse(fs.readFileSync(reportPath(), 'utf8'));
  const result = await syncGitHubActionsMinuteBlocker({
    report,
    token: requiredEnv('GITHUB_TOKEN'),
    repository: requiredEnv('GITHUB_REPOSITORY'),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
