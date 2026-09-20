import fs from 'node:fs';
import {
  ALLOWED_REPOSITORY_VARIABLE,
  createGitHubActionsVariablesWriteClient,
} from './githubActionsVariablesWriteClient.mjs';

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`[SET-GITHUB-VARIABLE] missing required environment variable: ${name}`);
  }
  return value;
}

function readPrivateKey() {
  const path = requiredEnv('CAPITAL_AI_GITHUB_APP_PRIVATE_KEY_PATH');
  const stat = fs.statSync(path);
  if (!stat.isFile()) {
    throw new Error('[SET-GITHUB-VARIABLE] private key path is not a file');
  }
  return fs.readFileSync(path, 'utf8');
}

const clientId = requiredEnv('CAPITAL_AI_GITHUB_APP_CLIENT_ID');
const privateKeyPem = readPrivateKey();
const organization = requiredEnv('CAPITAL_AI_GITHUB_ORG_LOGIN');
const repository = requiredEnv('CAPITAL_AI_GITHUB_REPOSITORY');
const value = requiredEnv('CAPITAL_AI_GITHUB_VARIABLE_VALUE');

const client = createGitHubActionsVariablesWriteClient({
  clientId,
  privateKeyPem,
  organization,
});

const result = await client.setRepositoryVariable({
  repository,
  name: ALLOWED_REPOSITORY_VARIABLE,
  value,
});

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
