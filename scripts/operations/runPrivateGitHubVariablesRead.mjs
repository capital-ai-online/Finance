import fs from 'node:fs';
import { createGitHubLicenseUsageReadClient } from './githubLicenseUsageReadClient.mjs';
import { classifyGitHubVariablesReadStatus } from './githubVariablesReadPolicy.mjs';

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`[PRIVATE-GITHUB-VARIABLES-READ] missing required environment variable: ${name}`);
  }
  return value;
}

function readPrivateKey() {
  const path = requiredEnv('CAPITAL_AI_GITHUB_APP_PRIVATE_KEY_PATH');
  const stat = fs.statSync(path);
  if (!stat.isFile()) {
    throw new Error('[PRIVATE-GITHUB-VARIABLES-READ] private key path is not a file');
  }
  return fs.readFileSync(path, 'utf8');
}

async function capture(scope, operation) {
  try {
    const variable = await operation();
    if (
      !variable
      || typeof variable !== 'object'
      || typeof variable.name !== 'string'
      || typeof variable.value !== 'string'
    ) {
      throw new Error(`[PRIVATE-GITHUB-VARIABLES-READ] ${scope} response is malformed`);
    }
    return Object.freeze({
      status: 'PASS',
      scope,
      variable: Object.freeze({
        name: variable.name,
        value: variable.value,
        createdAt: typeof variable.created_at === 'string' ? variable.created_at : null,
        updatedAt: typeof variable.updated_at === 'string' ? variable.updated_at : null,
      }),
    });
  } catch (error) {
    if (error?.status === 403) {
      return Object.freeze({
        status: 'BLOCKED',
        scope,
        requiredPermission: 'Variables: read',
        providerStatus: 403,
      });
    }
    if (error?.status === 404) {
      return Object.freeze({
        status: 'NOT_CONFIGURED',
        scope,
        providerStatus: 404,
        reason: 'GitHub returned 404 for this variable at the requested scope',
      });
    }
    throw error;
  }
}

const clientId = requiredEnv('CAPITAL_AI_GITHUB_APP_CLIENT_ID');
const privateKeyPem = readPrivateKey();
const enterprise = requiredEnv('CAPITAL_AI_GITHUB_ENTERPRISE_SLUG');
const organization = requiredEnv('CAPITAL_AI_GITHUB_ORG_LOGIN');
const repository = requiredEnv('CAPITAL_AI_GITHUB_REPOSITORY');
const variableName = requiredEnv('CAPITAL_AI_GITHUB_VARIABLE_NAME');

const client = createGitHubLicenseUsageReadClient({
  clientId,
  privateKeyPem,
  enterprise,
  organization,
});

const installationEvidence = await client.preflight();
const [repositoryVariable, organizationVariable] = await Promise.all([
  capture(
    'repository',
    () => client.getRepositoryVariable({ repository, name: variableName }),
  ),
  capture(
    'organization',
    () => client.getOrganizationVariable({ name: variableName }),
  ),
]);

const decision = classifyGitHubVariablesReadStatus(repositoryVariable, organizationVariable);

const output = Object.freeze({
  status: decision.status,
  mode: 'PRIVATE_GITHUB_ACTIONS_VARIABLE_READ',
  organization,
  repository,
  variableName,
  auth: 'github_app_installation_token',
  installationEvidence,
  repositoryVariable,
  organizationVariable,
  patUsed: false,
  secretsOrTokensLogged: false,
});

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
if (decision.exitCode !== 0) process.exitCode = decision.exitCode;
