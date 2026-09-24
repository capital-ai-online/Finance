import fs from 'node:fs';
import {
  createGitHubSettingsInventoryReadClient,
  GITHUB_SETTINGS_READ_CAPABILITIES,
} from './githubSettingsInventoryReadClient.mjs';
import {
  createGitHubEnterpriseSettingsReadClient,
  GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES,
} from './githubEnterpriseSettingsReadClient.mjs';
import {
  createGitHubUserSettingsReadClient,
  GITHUB_USER_SETTINGS_READ_CAPABILITIES,
} from './githubUserSettingsReadClient.mjs';
import { createGitHubManagementSettingsScopeAdapter } from './githubManagementSettingsScopeAdapter.mjs';
import {
  projectActionsPermissions,
  projectArtifactStorageInventory,
  projectCacheRetentionLimit,
  projectCacheStorageLimit,
  projectCacheUsage,
  projectCapturedSetting,
  projectCodeSecurityConfiguration,
  projectCodeSecurityConfigurationCatalog,
  projectCustomPropertyInventory,
  projectCustomPropertySchema,
  projectEffectiveSettingsPolicy,
  projectEnvironmentInventory,
  projectForkPrSettings,
  projectOrganizationSettings,
  projectRepositorySettings,
  projectRetentionSettings,
  projectRulesetInventory,
  projectRunnerGroupInventory,
  projectRunnerInventory,
  projectSelectedAccountInventory,
  projectSelectedActions,
  projectSelfHostedRunnerSettings,
  projectUserEmailInventory,
  projectUserKeyInventory,
  projectUserProfile,
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

function unavailableClient({ scope, capabilities, reason }) {
  return Object.freeze({
    describeBoundary() {
      return Object.freeze({
        scope,
        publicMethods: Object.freeze(['GET']),
        rawProxy: false,
        capabilities: Object.freeze([...capabilities]),
        auth: 'not_configured',
        tokenPersistence: false,
      });
    },
    async read(capability) {
      const error = new Error(reason);
      error.status = 403;
      error.capability = capability;
      throw error;
    },
  });
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
      const captured = {
        status: 'NOT_OBSERVABLE',
        requiredPermission,
        providerStatus: error.status,
        reason: `${label} is not readable with the currently configured bounded read capability`,
      };
      if (error?.providerDiagnostics && typeof error.providerDiagnostics === 'object') {
        captured.providerDiagnostics = error.providerDiagnostics;
      }
      return Object.freeze(captured);
    }
    throw error;
  }
}

const clientId = requiredEnv('CAPITAL_AI_GITHUB_APP_CLIENT_ID');
const enterprise = requiredEnv('CAPITAL_AI_GITHUB_ENTERPRISE_SLUG');
const organization = requiredEnv('CAPITAL_AI_GITHUB_ORG_LOGIN');
const repository = requiredEnv('CAPITAL_AI_GITHUB_REPOSITORY');
const enterpriseReadPat = String(process.env.CAPITAL_AI_GITHUB_ENTERPRISE_READ_PAT || '').trim();
const dedicatedUserReadPat = String(process.env.CAPITAL_AI_GITHUB_USER_READ_PAT || '').trim();
const userReadPat = dedicatedUserReadPat || enterpriseReadPat;
const privateKeyPem = readPrivateKey();

const organizationRepositoryClient = createGitHubSettingsInventoryReadClient({
  clientId,
  privateKeyPem,
  organization,
});
const installationEvidence = await organizationRepositoryClient.preflight();

const enterpriseClient = enterpriseReadPat
  ? createGitHubEnterpriseSettingsReadClient({ enterprise, enterpriseReadPat })
  : unavailableClient({
    scope: 'enterprise',
    capabilities: Object.keys(GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES),
    reason: 'Enterprise read PAT is not configured',
  });

const userClient = userReadPat
  ? createGitHubUserSettingsReadClient({ userReadToken: userReadPat })
  : unavailableClient({
    scope: 'user',
    capabilities: Object.keys(GITHUB_USER_SETTINGS_READ_CAPABILITIES),
    reason: 'User read token is not configured',
  });

const adapter = createGitHubManagementSettingsScopeAdapter({
  enterpriseClient,
  organizationRepositoryClient,
  userClient,
  repository,
});

const projectors = Object.freeze({
  'enterprise.actions.permissions.get': projectActionsPermissions,
  'enterprise.actions.selected_actions.get': projectSelectedActions,
  'enterprise.actions.workflow_permissions.get': projectWorkflowPermissions,
  'enterprise.actions.selected_organizations.list': projectSelectedAccountInventory,
  'enterprise.code_security.configurations.list': projectCodeSecurityConfigurationCatalog,
  'enterprise.actions.runner_groups.list': projectRunnerGroupInventory,
  'enterprise.actions.self_hosted_runners.list': projectRunnerInventory,

  'organization.settings.get': projectOrganizationSettings,
  'organization.actions.permissions.get': projectActionsPermissions,
  'organization.actions.selected_actions.get': projectSelectedActions,
  'organization.actions.selected_repositories.list': projectSelectedAccountInventory,
  'organization.actions.workflow_permissions.get': projectWorkflowPermissions,
  'organization.actions.retention.get': projectRetentionSettings,
  'organization.actions.fork_pr_private_repos.get': projectForkPrSettings,
  'organization.actions.self_hosted_runners.get': projectSelfHostedRunnerSettings,
  'organization.actions.self_hosted_runners.list': projectRunnerInventory,
  'organization.actions.runner_groups.list': projectRunnerGroupInventory,
  'organization.actions.cache_usage.get': projectCacheUsage,
  'organization.actions.cache_retention_limit.get': projectCacheRetentionLimit,
  'organization.actions.cache_storage_limit.get': projectCacheStorageLimit,
  'organization.rulesets.list': projectRulesetInventory,
  'organization.custom_properties.schema.list': projectCustomPropertySchema,
  'organization.code_security.configurations.list': projectCodeSecurityConfigurationCatalog,

  'repository.settings.get': projectRepositorySettings,
  'repository.actions.permissions.get': projectActionsPermissions,
  'repository.actions.selected_actions.get': projectSelectedActions,
  'repository.actions.workflow_permissions.get': projectWorkflowPermissions,
  'repository.actions.retention.get': projectRetentionSettings,
  'repository.actions.fork_pr_private_repos.get': projectForkPrSettings,
  'repository.actions.cache_usage.get': projectCacheUsage,
  'repository.actions.cache_retention_limit.get': projectCacheRetentionLimit,
  'repository.actions.cache_storage_limit.get': projectCacheStorageLimit,
  'repository.actions.self_hosted_runners.list': projectRunnerInventory,
  'repository.actions.artifacts.list': projectArtifactStorageInventory,
  'repository.environments.list': projectEnvironmentInventory,
  'repository.code_security.configuration.get': projectCodeSecurityConfiguration,
  'repository.custom_properties.list': projectCustomPropertyInventory,
  'repository.rulesets.list': projectRulesetInventory,

  'user.profile.get': projectUserProfile,
  'user.emails.list': projectUserEmailInventory,
  'user.ssh_keys.list': projectUserKeyInventory,
  'user.gpg_keys.list': projectUserKeyInventory,
  'user.ssh_signing_keys.list': projectUserKeyInventory,
});

function descriptorFor(scope, capability) {
  if (scope === 'enterprise') return GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES[capability];
  if (scope === 'user') return GITHUB_USER_SETTINGS_READ_CAPABILITIES[capability];
  return GITHUB_SETTINGS_READ_CAPABILITIES[capability];
}

const entries = {};
const scopeEntries = {};

for (const scope of adapter.listScopes()) {
  const projected = {};
  for (const capability of adapter.listCapabilities(scope)) {
    const descriptor = descriptorFor(scope, capability);
    const projector = projectors[capability];
    if (!descriptor || typeof projector !== 'function') {
      throw new Error(`[PRIVATE-GITHUB-SETTINGS-INVENTORY] projector missing for ${capability}`);
    }
    const captured = await capture(
      capability,
      descriptor.requiredPermission,
      () => adapter.read(scope, capability),
    );
    const entry = projectCapturedSetting(captured, projector);
    entries[capability] = entry;
    projected[capability] = entry;
  }
  scopeEntries[scope] = Object.freeze(projected);
}

const frozenEntries = Object.freeze(entries);

function passData(capability) {
  const entry = frozenEntries[capability];
  return entry?.status === 'PASS' ? entry.data : null;
}

function scopeCoverage(scope, scopedEntries) {
  const rows = Object.entries(scopedEntries);
  const passCount = rows.filter(([, entry]) => entry.status === 'PASS').length;
  const notObservable = rows.filter(([, entry]) => entry.status !== 'PASS').map(([capability]) => capability);
  return Object.freeze({
    status: notObservable.length === 0 ? 'PASS' : 'PARTIAL_COVERAGE',
    capabilityCount: rows.length,
    passCount,
    notObservableCount: notObservable.length,
    notObservable: Object.freeze(notObservable),
    entries: scopedEntries,
  });
}

const scopes = Object.freeze(Object.fromEntries(
  Object.entries(scopeEntries).map(([scope, scoped]) => [scope, scopeCoverage(scope, scoped)]),
));

const notObservable = Object.entries(frozenEntries)
  .filter(([, entry]) => entry.status !== 'PASS')
  .map(([capability]) => capability);

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
  schemaVersion: '3.0.0',
  exportKind: 'CAPITAL_AI_GITHUB_SETTINGS_INVENTORY',
  coverageContract: 'API_OBSERVABLE_SETTINGS_MATRIX',
  status: notObservable.length === 0 ? 'PASS' : 'PARTIAL_COVERAGE',
  mode: 'PRIVATE_GITHUB_SETTINGS_INVENTORY_READ_ONLY',
  enterprise,
  organization,
  repository,
  userAuthSource: dedicatedUserReadPat ? 'DEDICATED_USER_READ_PAT' : enterpriseReadPat ? 'ENTERPRISE_PAT_FALLBACK' : 'NOT_CONFIGURED',
  organizationInstallationId: installationEvidence.organizationInstallationId,
  installationTokenExpiresAt: installationEvidence.installationTokenExpiresAt,
  boundary: adapter.describeBoundary(),
  scopes,
  entries: frozenEntries,
  effectivePolicy,
  notObservable: Object.freeze(notObservable),
  mutationPerformed: false,
  paidUsageMutationPerformed: false,
  secretsOrTokensLogged: false,
  sensitiveValuesRedacted: true,
  coverageNote: 'Inventory covers registered GitHub API-observable settings only; unavailable API/auth surfaces remain explicit NOT_OBSERVABLE evidence.',
});

function renderMarkdownExport(inventory) {
  const lines = [
    '# CAPITAL-AI GitHub Settings Inventory',
    '',
    `- Schema: \`${inventory.schemaVersion}\``,
    `- Coverage: \`${inventory.coverageContract}\``,
    `- Enterprise: \`${inventory.enterprise}\``,
    `- Organization: \`${inventory.organization}\``,
    `- Repository: \`${inventory.repository}\``,
    `- Status: **${inventory.status}**`,
    `- Effective Actions: **${inventory.effectivePolicy.actions.execution}**`,
    `- Effective default GITHUB_TOKEN permission: \`${inventory.effectivePolicy.actions.defaultWorkflowPermissions ?? 'NOT_OBSERVABLE'}\``,
    `- Full-length SHA pinning required: \`${String(inventory.effectivePolicy.actions.shaPinningRequired)}\``,
    `- Actions may approve PR reviews: \`${String(inventory.effectivePolicy.actions.canApprovePullRequestReviews)}\``,
    '',
    '## Scope coverage',
    '',
    '| Scope | Status | PASS | NOT_OBSERVABLE | Total |',
    '|---|---|---:|---:|---:|',
  ];
  for (const [scope, coverage] of Object.entries(inventory.scopes)) {
    lines.push(`| ${scope} | ${coverage.status} | ${coverage.passCount} | ${coverage.notObservableCount} | ${coverage.capabilityCount} |`);
  }
  lines.push('', '## Capability coverage', '', '| Capability | Status |', '|---|---|');
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
    '- Secret/token/private-key values are never exported.',
    '- User email addresses and cryptographic key material are redacted.',
    '- Environment reviewer identities are redacted.',
    '- Parent Enterprise/Organization policies are treated as ceilings; lower scopes never broaden them.',
    '- NOT_OBSERVABLE is preserved rather than converted into a guessed/default value.',
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
