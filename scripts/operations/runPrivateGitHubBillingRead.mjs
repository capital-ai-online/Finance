import fs from 'node:fs';
import { createGitHubBillingGatewayAdapter } from './githubBillingGatewayAdapter.mjs';
import { createGitHubAppInstallationAuthTransport } from './githubAppInstallationAuthTransport.mjs';
import {
  projectBudgetInventoryEvidence,
  projectCostCenterInventoryEvidence,
  projectUsageInventoryEvidence,
} from './githubBillingInventoryProjection.mjs';
import { projectMonthlyBillingActuals } from './githubBillingMonthlyActualsProjection.mjs';
import { projectGitHubCostCenterManagement } from './githubCostCenterManagementProjection.mjs';

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

const clientId = requiredEnv('CAPITAL_AI_GITHUB_APP_CLIENT_ID');
const enterprise = requiredEnv('CAPITAL_AI_GITHUB_ENTERPRISE_SLUG');
const privateKeyPem = readPrivateKey();
const now = new Date();
const billingPeriod = Object.freeze({
  year: now.getUTCFullYear(),
  month: now.getUTCMonth() + 1,
});

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

const [budgets, usageSummary, costCenters] = await Promise.all([
  billing.execute('github.billing.budgets.list'),
  billing.execute('github.billing.usage.summary', billingPeriod),
  billing.execute('github.billing.cost_centers.list'),
]);

const activeCanonicalCostCenters = costCenters.filter((item) => (
  String(item?.name || '').trim().toLowerCase() === 'enterprise'
  && String(item?.state || '').trim().toLowerCase() === 'active'
));

let costCenterUsageSummary = null;
if (activeCanonicalCostCenters.length === 1) {
  costCenterUsageSummary = await billing.execute('github.billing.usage.summary', {
    ...billingPeriod,
    costCenterId: activeCanonicalCostCenters[0].id,
  });
}

const costManagement = projectGitHubCostCenterManagement({
  enterpriseUsageSummary: usageSummary,
  costCenterUsageSummary,
  costCenters,
  budgets,
});

const output = Object.freeze({
  status: 'PASS',
  mode: 'PRIVATE_SINGLE_USER_READ_MONTHLY_ACTUALS',
  enterprise,
  installationId: authEvidence.installationId,
  installationTokenExpiresAt: authEvidence.installationTokenExpiresAt,
  inventoryComplete: true,
  budgets: projectBudgetInventoryEvidence(budgets),
  usage: projectUsageInventoryEvidence(usageSummary),
  costCenters: projectCostCenterInventoryEvidence(costCenters),
  monthlyActuals: projectMonthlyBillingActuals(usageSummary),
  costManagement,
  amountSemantics: 'netAmount is the billed cost returned by GitHub usage summary',
  billingAmountsLogged: true,
  secretsOrTokensLogged: false,
});

const evidencePath = String(process.env.CAPITAL_AI_GITHUB_BILLING_EVIDENCE_PATH || '').trim();
if (evidencePath) {
  fs.writeFileSync(evidencePath, `${JSON.stringify(output, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
}

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
