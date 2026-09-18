import fs from 'node:fs';
import { createGitHubBillingGatewayAdapter } from './githubBillingGatewayAdapter.mjs';
import { createGitHubAppInstallationAuthTransport } from './githubAppInstallationAuthTransport.mjs';

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`[PRIVATE-GITHUB-BILLING-READ] missing required environment variable: ${name}`);
  }
  return value;
}

function readPrivateKey() {
  const keyPath = requiredEnv('CAPITAL_AI_GITHUB_APP_PRIVATE_KEY_PATH');
  const stat = fs.statSync(keyPath);
  if (!stat.isFile()) throw new Error('[PRIVATE-GITHUB-BILLING-READ] private key path is not a file');
  return fs.readFileSync(keyPath, 'utf8');
}

function projectBudgetEvidence(budget) {
  return Object.freeze({
    budgetType: budget.budgetType,
    productSkus: budget.productSkus,
    scope: budget.scope,
    preventFurtherUsage: budget.preventFurtherUsage,
    alertingEnabled: budget.alerting?.willAlert === true,
  });
}

const clientId = requiredEnv('CAPITAL_AI_GITHUB_APP_CLIENT_ID');
const enterprise = requiredEnv('CAPITAL_AI_GITHUB_ENTERPRISE_SLUG');
const privateKeyPem = readPrivateKey();

const auth = createGitHubAppInstallationAuthTransport({
  clientId,
  privateKeyPem,
  enterprise,
});

const authEvidence = await auth.preflight();
const billing = createGitHubBillingGatewayAdapter({
  enterprise,
  githubRest: auth.githubRest,
});
const result = await billing.execute('github.billing.budgets.list');

const output = Object.freeze({
  status: 'PASS',
  mode: 'PRIVATE_SINGLE_USER_READ',
  enterprise,
  installationId: authEvidence.installationId,
  installationTokenExpiresAt: authEvidence.installationTokenExpiresAt,
  budgetCount: result.budgets.length,
  budgets: result.budgets.map(projectBudgetEvidence),
});

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
