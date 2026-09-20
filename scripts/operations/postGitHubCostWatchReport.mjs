import fs from 'node:fs';

const OIDC_AUDIENCE = 'capital-ai-github-billing-alert';
const DEFAULT_ENDPOINT = 'https://capital-ai.online/api/internal/github-billing-alert/email';
const REQUEST_TIMEOUT_MS = 15_000;

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`[GITHUB-COST-WATCH-POST] missing required environment variable: ${name}`);
  return value;
}

async function getOidcToken() {
  const requestUrl = requiredEnv('ACTIONS_ID_TOKEN_REQUEST_URL');
  const requestToken = requiredEnv('ACTIONS_ID_TOKEN_REQUEST_TOKEN');
  const url = new URL(requestUrl);
  url.searchParams.set('audience', OIDC_AUDIENCE);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${requestToken}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || typeof payload?.value !== 'string' || payload.value.length < 20) {
    throw new Error(`[GITHUB-COST-WATCH-POST] GitHub OIDC mint failed with HTTP ${response.status}`);
  }
  return payload.value;
}

const reportPath = requiredEnv('CAPITAL_AI_GITHUB_COST_WATCH_REPORT_PATH');
const endpoint = String(process.env.CAPITAL_AI_GITHUB_BILLING_ALERT_ENDPOINT || DEFAULT_ENDPOINT).trim();
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

if (report?.emailRequired !== true) {
  process.stdout.write(JSON.stringify({ status: 'SKIPPED', reason: 'email_not_required' }) + '\n');
  process.exit(0);
}

const oidcToken = await getOidcToken();
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${oidcToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({ report }),
  signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
});

const payload = await response.json().catch(() => null);
if (!response.ok) {
  throw new Error(`[GITHUB-COST-WATCH-POST] billing alert endpoint failed with HTTP ${response.status}`);
}

process.stdout.write(`${JSON.stringify({
  status: 'PASS',
  endpointAccepted: true,
  enqueued: payload?.enqueued === true,
  duplicate: payload?.duplicate === true,
  secretsOrTokensLogged: false,
}, null, 2)}\n`);
