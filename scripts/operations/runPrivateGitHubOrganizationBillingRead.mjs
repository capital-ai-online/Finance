import fs from 'node:fs';
import { createGitHubLicenseUsageReadClient } from './githubLicenseUsageReadClient.mjs';
import { projectMonthlyBillingActuals } from './githubBillingMonthlyActualsProjection.mjs';

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`[PRIVATE-GITHUB-ORGANIZATION-BILLING-READ] missing required environment variable: ${name}`);
  }
  return value;
}

function readPrivateKey() {
  const keyPath = requiredEnv('CAPITAL_AI_GITHUB_APP_PRIVATE_KEY_PATH');
  const stat = fs.statSync(keyPath);
  if (!stat.isFile()) {
    throw new Error('[PRIVATE-GITHUB-ORGANIZATION-BILLING-READ] private key path is not a file');
  }
  return fs.readFileSync(keyPath, 'utf8');
}

const clientId = requiredEnv('CAPITAL_AI_GITHUB_APP_CLIENT_ID');
const enterprise = requiredEnv('CAPITAL_AI_GITHUB_ENTERPRISE_SLUG');
const organization = requiredEnv('CAPITAL_AI_GITHUB_ORG_LOGIN');
const repository = requiredEnv('CAPITAL_AI_GITHUB_REPOSITORY');
const privateKeyPem = readPrivateKey();

if (!repository.startsWith(`${organization}/`)) {
  throw new Error('[PRIVATE-GITHUB-ORGANIZATION-BILLING-READ] repository must belong to configured organization');
}

const now = new Date();
const billingPeriod = Object.freeze({
  year: now.getUTCFullYear(),
  month: now.getUTCMonth() + 1,
});

const client = createGitHubLicenseUsageReadClient({
  clientId,
  privateKeyPem,
  enterprise,
  organization,
});

const installationEvidence = await client.preflight();
const [organizationSummary, repositorySummary] = await Promise.all([
  client.getOrganizationUsageSummary(billingPeriod),
  client.getOrganizationUsageSummary({ ...billingPeriod, repository }),
]);

const output = Object.freeze({
  status: 'PASS',
  mode: 'PRIVATE_SINGLE_USER_ORGANIZATION_BILLING_READ',
  enterprise,
  organization,
  repository,
  organizationInstallationId: installationEvidence.organizationInstallationId,
  timePeriod: billingPeriod,
  organizationActuals: projectMonthlyBillingActuals(organizationSummary),
  repositoryActuals: projectMonthlyBillingActuals(repositorySummary),
  hierarchySemantics: 'repositoryActuals is a filtered subset of organizationActuals and must not be added again',
  requiredPermission: 'Organization administration: read',
  billingAmountsLogged: true,
  emailAddressesLogged: false,
  secretsOrTokensLogged: false,
});

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
