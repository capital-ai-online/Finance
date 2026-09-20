import fs from 'node:fs';
import { createGitHubAppInstallationAuthTransport } from './githubAppInstallationAuthTransport.mjs';
import { createGitHubBillingGatewayAdapter } from './githubBillingGatewayAdapter.mjs';
import { createGitHubUserBillingReadClient } from './githubUserBillingReadClient.mjs';
import {
  buildGitHubCostWatchReport,
  GITHUB_COST_WATCH_DEFAULT_START,
} from './githubCostWatchPolicy.mjs';

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`[GITHUB-COST-WATCH] missing required environment variable: ${name}`);
  return value;
}

function readPrivateKey() {
  const path = requiredEnv('CAPITAL_AI_GITHUB_APP_PRIVATE_KEY_PATH');
  const stat = fs.statSync(path);
  if (!stat.isFile()) throw new Error('[GITHUB-COST-WATCH] private key path is not a file');
  return fs.readFileSync(path, 'utf8');
}

const mode = String(process.env.CAPITAL_AI_GITHUB_COST_WATCH_MODE || 'monitor').trim().toLowerCase();
if (!['monitor', 'test'].includes(mode)) throw new Error('[GITHUB-COST-WATCH] mode must be monitor or test');

const reportPath = String(process.env.CAPITAL_AI_GITHUB_COST_WATCH_REPORT_PATH || 'github-cost-watch-report.json').trim();
const startAt = String(process.env.CAPITAL_AI_GITHUB_COST_WATCH_START_AT || GITHUB_COST_WATCH_DEFAULT_START).trim();
const startMs = Date.parse(startAt);
if (!Number.isFinite(startMs)) throw new Error('[GITHUB-COST-WATCH] monitoring start time is invalid');

const now = new Date();
if (mode === 'monitor' && now.getTime() < startMs) {
  const waiting = {
    schemaVersion: '1.0.0',
    status: 'WAITING_FOR_NEXT_CYCLE',
    mode,
    generatedAt: now.toISOString(),
    monitoringStartAt: new Date(startMs).toISOString(),
    emailRequired: false,
    secretsOrTokensLogged: false,
  };
  fs.writeFileSync(reportPath, JSON.stringify(waiting, null, 2), { mode: 0o600 });
  process.stdout.write(`${JSON.stringify(waiting, null, 2)}\n`);
  process.exit(0);
}

const clientId = requiredEnv('CAPITAL_AI_GITHUB_APP_CLIENT_ID');
const enterprise = requiredEnv('CAPITAL_AI_GITHUB_ENTERPRISE_SLUG');
const username = String(process.env.CAPITAL_AI_GITHUB_USERNAME || 'SvenKulessa').trim();
const privateKeyPem = readPrivateKey();
const userAccessToken = String(process.env.CAPITAL_AI_GITHUB_USER_ACCESS_TOKEN || '').trim();
const billingPeriod = Object.freeze({
  year: now.getUTCFullYear(),
  month: now.getUTCMonth() + 1,
});

const auth = createGitHubAppInstallationAuthTransport({
  clientId,
  privateKeyPem,
  enterprise,
});
await auth.preflight();

const billing = createGitHubBillingGatewayAdapter({
  enterprise,
  githubRest: auth.githubRest,
});

const enterpriseUsage = await billing.execute('github.billing.usage.summary', billingPeriod);

let personalUsage = null;
let personalCoverage = { status: 'PASS', reason: null };
if (userAccessToken) {
  try {
    const personal = createGitHubUserBillingReadClient({
      username,
      userAccessToken,
    });
    personalUsage = await personal.getUsageSummary(billingPeriod);
  } catch (error) {
    personalCoverage = {
      status: 'BLOCKED',
      reason: `personal billing read failed with provider status ${Number.isInteger(error?.status) ? error.status : 'unknown'}`,
    };
  }
} else {
  personalCoverage = {
    status: 'BLOCKED',
    reason: 'CAPITAL_AI_GITHUB_USER_ACCESS_TOKEN is not configured; personal repositories outside the Enterprise are not observable',
  };
}

const report = buildGitHubCostWatchReport({
  mode,
  generatedAt: now,
  startAt: new Date(startMs).toISOString(),
  enterprise,
  username,
  enterpriseUsage,
  personalUsage,
  personalCoverage,
});

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 });

process.stdout.write(`${JSON.stringify({
  status: report.status,
  mode: report.mode,
  cycle: report.cycle,
  coverage: report.coverage,
  totals: report.totals,
  alertRowCount: report.alertRows.length,
  alertFingerprint: report.alertFingerprint,
  emailRequired: report.emailRequired,
  reportPath,
  secretsOrTokensLogged: false,
}, null, 2)}\n`);
