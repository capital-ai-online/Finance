import fs from 'node:fs';
import {
  createGitHubSettingsInventoryReadClient,
  GITHUB_SETTINGS_READ_CAPABILITIES,
} from './githubSettingsInventoryReadClient.mjs';
import { createGitHubEnterpriseSettingsReadClient, GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES } from './githubEnterpriseSettingsReadClient.mjs';
import {
  projectActionsPermissions,
  projectArtifactStorageInventory,
  projectCacheRetentionLimit,
  projectCacheStorageLimit,
  projectCacheUsage,
  projectCapturedSetting,
  projectCustomPropertyInventory,
  projectForkPrSettings,
  projectRepositorySettings,
  projectRetentionSettings,
  projectRulesetInventory,
  projectSelfHostedRunnerSettings,
  projectWorkflowPermissions,
  projectSelectedActions,
  projectEnvironmentInventory,
  projectCodeSecurityConfiguration,
  projectEffectiveSettingsPolicy,
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
        reason: `${label} is not readable with the currently configured bounded read capability`,
      });
    }
    throw error;
  }
}

const clientId = requiredEnv('CAPITAL_AI_GITHUB_APP_CLIENT_ID');
const enterprise = requiredEnv('CAPITAL_AI_GITHUB_ENTERPRISE_SLUG');
const organization = requiredEnv('CAPITAL_AI_GITHUB_ORG_LOGIN');
const repository = requiredEnv('CAPITAL_AI_GITHUB_REPOSITORY');
const enterpriseReadPat = String(process.env.CAPITAL_AI_GITHUB_ENTERPRISE_READ_PAT || '').trim();
const privateKeyPem = readPrivateKey();

const client = createGitHubSettingsInventoryReadClient({
  clientId,
  privateKeyPem,
  organization,
});

const installationEvidence = await client.preflight();
const enterpriseClient = enterpriseReadPat
  ? createGitHubEnterpriseSettingsReadClient({ enterprise, enterpriseReadPat })
  : null;

const enterpriseProjectors = Object.freeze({
  'enterprise.actions.permissions.get': projectActionsPermissions,
  'enterprise.actions.selected_actions.get': projectSelectedActions,
  'enterprise.actions.workflow_permissions.get': projectWorkflowPermissions,
});
const enterpriseEntries = {};
for (const capability of Object.keys(GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES)) {
  const descriptor = GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES[capability];
  const captured = enterpriseClient
    ? await capture(
      capability,
      descriptor.requiredPermission,
      () => enterpriseClient.read(capability),
    )
    : Object.freeze({
      status: 'NOT_OBSERVABLE',
      requiredPermission: descriptor.requiredPermission,
      providerStatus: null,
      reason: 'Enterprise read PAT is not configured for this bounded read-only inventory',
    });
  enterpriseEntries[capability] = projectCapturedSetting(
    captured,
    enterpriseProjectors[capability],
  );
}

const capabilityCalls = [
  ['organization.actions.permissions.get', projectActionsPermissions],
  ['organization.actions.selected_actions.get', projectSelectedActions],
  ['organization.actions.workflow_permissions.get', projectWorkflowPermissions],
  ['organization.actions.retention.get', projectRetentionSettings],
  ['organization.actions.fork_pr_private_repos.get', projectForkPrSettings],
  ['organization.actions.self_hosted_runners.get', projectSelfHostedRunnerSettings],
  ['organization.actions.cache_usage.get', projectCacheUsage],
  ['organization.actions.cache_retention_limit.get', projectCacheRetentionLimit],
  ['organization.actions.cache_storage_limit.get', projectCacheStorageLimit],
  ['repository.settings.get', projectRepositorySettings],
  ['repository.actions.permissions.get', projectActionsPermissions],
  ['repository.actions.selected_actions.get', projectSelectedActions],
  ['repository.actions.workflow_permissions.get', projectWorkflowPermissions],
  ['repository.actions.retention.get', projectRetentionSettings],
  ['repository.actions.fork_pr_private_repos.get', projectForkPrSettings],
  ['repository.actions.cache_usage.get', projectCacheUsage],
  ['repository.actions.cache_retention_limit.get', projectCacheRetentionLimit],
  ['repository.actions.cache_storage_limit.get', projectCacheStorageLimit],
  ['repository.actions.artifacts.list', projectArtifactStorageInventory],
  ['repository.environments.list', projectEnvironmentInventory],
  ['repository.code_security.configuration.get', projectCodeSecurityConfiguration],
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

const entries = Object.freeze({ ...enterpriseEntries, ...projectedEntries });
const notObservable = Object.entries(entries)
  .filter(([, entry]) => entry.status !== 'PASS')
  .map(([capability]) => capability);

function passData(capability) {
  const entry = entries[capability];
  return entry?.status === 'PASS' ? entry.data : null;
}

const effectivePolicy = projectEffectiveSettingsPolicy({
  enterpriseActions: passData('enterprise.actions.permissions.get'),
  enterpriseWorkflow: passData('enterprise.actions.workflow_permissions.get'),
  enterpriseSelectedActions: passData('enterprise.actions.selected_actions.get'),
  organizationActions: passData('organization.actions.permissions.get'),
  organizationWorkflow: passData('organization.actions.workflow_permissions.get'),
  organizationSelectedActions: passData('organization.actions.selected_actions.get'),
  repositoryActions: passData('repository.actions.permissions.get'),
  repositoryWorkflow: passData('repository.actions.workflow_permissions.get'),
  repositorySelectedActions: passData('repository.actions.selected_actions.get'),
  environmentInventory: passData('repository.environments.list'),
  codeSecurityConfiguration: passData('repository.code_security.configuration.get'),
});

const output = Object.freeze({
  schemaVersion: '2.0.0',
  exportKind: 'CAPITAL_AI_GITHUB_SETTINGS_INVENTORY',
  status: notObservable.length === 0 ? 'PASS' : 'PARTIAL_COVERAGE',
  mode: 'PRIVATE_GITHUB_SETTINGS_INVENTORY_READ_ONLY',
  enterprise,
  organization,
  repository,
  organizationInstallationId: installationEvidence.organizationInstallationId,
  installationTokenExpiresAt: installationEvidence.installationTokenExpiresAt,
  boundary: Object.freeze({
    organizationRepository: client.describeBoundary(),
    enterprise: enterpriseClient ? enterpriseClient.describeBoundary() : null,
  }),
  entries,
  effectivePolicy,
  notObservable: Object.freeze(notObservable),
  mutationPerformed: false,
  paidUsageMutationPerformed: false,
  secretsOrTokensLogged: false,
  sensitiveValuesRedacted: true,
});

function renderMarkdownExport(inventory) {
  const lines = [
    '# CAPITAL-AI GitHub Settings Inventory',
    '',
    `- Schema: \`${inventory.schemaVersion}\``,
    `- Enterprise: \`${inventory.enterprise}\``,
    `- Organization: \`${inventory.organization}\``,
    `- Repository: \`${inventory.repository}\``,
    `- Status: **${inventory.status}**`,
    `- Effective Actions: **${inventory.effectivePolicy.actions.execution}**`,
    `- Effective default GITHUB_TOKEN permission: \`${inventory.effectivePolicy.actions.defaultWorkflowPermissions ?? 'NOT_OBSERVABLE'}\``,
    `- Full-length SHA pinning required: \`${String(inventory.effectivePolicy.actions.shaPinningRequired)}\``,
    `- Actions may approve PR reviews: \`${String(inventory.effectivePolicy.actions.canApprovePullRequestReviews)}\``,
    '',
    '## Inventory coverage',
    '',
    '| Capability | Status |',
    '|---|---|',
  ];
  for (const [capability, entry] of Object.entries(inventory.entries).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`| \`${capability}\` | ${entry.status} |`);
  }
  lines.push('', '## Improvement findings', '');
  if (inventory.effectivePolicy.improvementFindings.length === 0) {
    lines.push('- No evidence-backed hardening finding in the currently observable policy set.');
  } else {
    for (const finding of inventory.effectivePolicy.improvementFindings) {
      lines.push(`- **${finding.id}** [${finding.severity}/${finding.state}]: ${finding.recommendation}`);
    }
  }
  lines.push(
    '',
    '## Security and privacy boundary',
    '',
    '- Read-only provider methods only.',
    '- Secret/token values are never exported.',
    '- Environment reviewer identities are redacted.',
    '- Code-security configuration identity/reviewer details are redacted.',
    '- Parent Enterprise/Organization policies are treated as ceilings; lower scopes never broaden them.',
    '',
  );
  return `${lines.join('\n')}\n`;
}

const evidencePath = String(process.env.CAPITAL_AI_GITHUB_SETTINGS_EVIDENCE_PATH || '').trim();
if (evidencePath) {
  fs.writeFileSync(evidencePath, `${JSON.stringify(output, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
}
const markdownPath = String(process.env.CAPITAL_AI_GITHUB_SETTINGS_MARKDOWN_PATH || '').trim();
if (markdownPath) {
  fs.writeFileSync(markdownPath, renderMarkdownExport(output), {
    encoding: 'utf8',
    mode: 0o600,
  });
}

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
