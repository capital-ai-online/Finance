import fs from 'node:fs';
import {
  createGitHubSettingsInventoryReadClient,
  GITHUB_SETTINGS_READ_CAPABILITIES,
} from './githubSettingsInventoryReadClient.mjs';
import {
  projectActionsPermissions,
  projectCapturedSetting,
  projectCustomPropertyInventory,
  projectForkPrSettings,
  projectRepositorySettings,
  projectRetentionSettings,
  projectRulesetInventory,
  projectSelfHostedRunnerSettings,
  projectWorkflowPermissions,
} from './githubSettingsInventoryProjection.mjs';

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`[PRIVATE-GITHUB-SETTINGS-INVENTORY] missing required environment variable: ${name}`);
  }
  return value;
}

function readPrivateKey() {
  const path = requiredEnv('CAPITAL_AI_GITHUB_APP_PRIVATE_KEY_PATH');
  const stat = fs.statSync(path);
  if (!stat.isFile()) {
    throw new Error('[PRIVATE-GITHUB-SETTINGS-INVENTORY] private key path is not a file');
  }
  return fs.readFileSync(path, 'utf8');
}

async function capture(label, requiredPermission, operation) {
  try {
    return Object.freeze({
      status: 'PASS',
      requiredPermission,
      data: await operation(),
    });
  } catch (error) {
    if (error?.status === 403 || error?.status === 404) {
      return Object.freeze({
        status: 'NOT_OBSERVABLE',
        requiredPermission,
        providerStatus: error.status,
        reason: `${label} is not readable with the current GitHub App installation permissions`,
      });
    }
    throw error;
  }
}

const clientId = requiredEnv('CAPITAL_AI_GITHUB_APP_CLIENT_ID');
const organization = requiredEnv('CAPITAL_AI_GITHUB_ORG_LOGIN');
const repository = requiredEnv('CAPITAL_AI_GITHUB_REPOSITORY');
const privateKeyPem = readPrivateKey();

const client = createGitHubSettingsInventoryReadClient({
  clientId,
  privateKeyPem,
  organization,
});

const installationEvidence = await client.preflight();

const capabilityCalls = [
  ['organization.actions.permissions.get', projectActionsPermissions],
  ['organization.actions.workflow_permissions.get', projectWorkflowPermissions],
  ['organization.actions.retention.get', projectRetentionSettings],
  ['organization.actions.fork_pr_private_repos.get', projectForkPrSettings],
  ['organization.actions.self_hosted_runners.get', projectSelfHostedRunnerSettings],
  ['repository.settings.get', projectRepositorySettings],
  ['repository.actions.permissions.get', projectActionsPermissions],
  ['repository.actions.workflow_permissions.get', projectWorkflowPermissions],
  ['repository.actions.retention.get', projectRetentionSettings],
  ['repository.actions.fork_pr_private_repos.get', projectForkPrSettings],
  ['repository.custom_properties.list', projectCustomPropertyInventory],
];

const projectedEntries = {};
for (const [capability, projector] of capabilityCalls) {
  const descriptor = GITHUB_SETTINGS_READ_CAPABILITIES[capability];
  const captured = await capture(
    capability,
    descriptor.requiredPermission,
    () => client.read(capability, { repository }),
  );
  projectedEntries[capability] = projectCapturedSetting(captured, projector);
}

const rulesets = await capture(
  'repository.rulesets.list',
  'Metadata: read',
  () => client.listRepositoryRulesets({ repository }),
);
projectedEntries['repository.rulesets.list'] = projectCapturedSetting(
  rulesets,
  projectRulesetInventory,
);

const entries = Object.freeze(projectedEntries);
const notObservable = Object.entries(entries)
  .filter(([, entry]) => entry.status !== 'PASS')
  .map(([capability]) => capability);

const output = Object.freeze({
  status: notObservable.length === 0 ? 'PASS' : 'PARTIAL_COVERAGE',
  mode: 'PRIVATE_GITHUB_SETTINGS_INVENTORY_READ_ONLY',
  organization,
  repository,
  organizationInstallationId: installationEvidence.organizationInstallationId,
  installationTokenExpiresAt: installationEvidence.installationTokenExpiresAt,
  boundary: client.describeBoundary(),
  entries,
  notObservable: Object.freeze(notObservable),
  mutationPerformed: false,
  paidUsageMutationPerformed: false,
  secretsOrTokensLogged: false,
});

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
