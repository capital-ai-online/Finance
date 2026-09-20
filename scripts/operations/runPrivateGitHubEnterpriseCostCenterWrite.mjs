import fs from 'node:fs';
import { createGitHubBillingGatewayAdapter } from './githubBillingGatewayAdapter.mjs';
import { createGitHubAppInstallationAuthTransport } from './githubAppInstallationAuthTransport.mjs';
import { createGitHubEnterpriseCostCenterWriter } from './githubEnterpriseCostCenterWriter.mjs';

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`[PRIVATE-GITHUB-COST-CENTER-WRITE] missing required environment variable: ${name}`);
  return value;
}

function readPrivateKey() {
  const keyPath = requiredEnv('CAPITAL_AI_GITHUB_APP_PRIVATE_KEY_PATH');
  const stat = fs.statSync(keyPath);
  if (!stat.isFile()) throw new Error('[PRIVATE-GITHUB-COST-CENTER-WRITE] private key path is not a file');
  return fs.readFileSync(keyPath, 'utf8');
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

const billingReader = createGitHubBillingGatewayAdapter({
  enterprise,
  githubRest: auth.githubRest,
});

const writer = createGitHubEnterpriseCostCenterWriter({
  billingReader,
  createCostCenter: auth.createCostCenter,
});

const result = await writer.ensure();

process.stdout.write(`${JSON.stringify({
  status: 'PASS',
  mode: 'PRIVATE_SINGLE_USER_ENTERPRISE_COST_CENTER_WRITE',
  enterprise,
  installationId: authEvidence.installationId,
  installationTokenExpiresAt: authEvidence.installationTokenExpiresAt,
  operation: result.status,
  created: result.created,
  costCenter: result.costCenter,
  secretsOrTokensLogged: false,
}, null, 2)}\n`);
