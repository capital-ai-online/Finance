import { GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES } from './githubEnterpriseSettingsReadClient.mjs';
import { GITHUB_SETTINGS_READ_CAPABILITIES } from './githubSettingsInventoryReadClient.mjs';
import { GITHUB_USER_SETTINGS_READ_CAPABILITIES } from './githubUserSettingsReadClient.mjs';

export const GITHUB_MANAGEMENT_SETTINGS_SCOPES = Object.freeze([
  'enterprise',
  'organization',
  'repository',
  'user',
]);

function fail(message) {
  throw new Error(`[GITHUB-MANAGEMENT-SETTINGS-ADAPTER] ${message}`);
}

function capabilitiesForScope(scope) {
  if (scope === 'enterprise') return Object.keys(GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES);
  if (scope === 'user') return Object.keys(GITHUB_USER_SETTINGS_READ_CAPABILITIES);
  if (scope === 'organization' || scope === 'repository') {
    return Object.entries(GITHUB_SETTINGS_READ_CAPABILITIES)
      .filter(([, descriptor]) => descriptor.scope === scope)
      .map(([capability]) => capability);
  }
  fail(`unsupported scope: ${String(scope)}`);
}

function assertClient(client, label) {
  if (!client || typeof client.read !== 'function' || typeof client.describeBoundary !== 'function') {
    fail(`${label} client is required`);
  }
}

/**
 * @param {{
 *   enterpriseClient: any;
 *   organizationRepositoryClient: any;
 *   userClient: any;
 *   repository: string;
 * }} options
 */
export function createGitHubManagementSettingsScopeAdapter({
  enterpriseClient,
  organizationRepositoryClient,
  userClient,
  repository,
} = {}) {
  assertClient(enterpriseClient, 'enterprise');
  assertClient(organizationRepositoryClient, 'organization/repository');
  assertClient(userClient, 'user');
  if (typeof repository !== 'string' || !/^[^/]+\/[^/]+$/.test(repository)) {
    fail('repository must use owner/repository form');
  }

  return Object.freeze({
    listScopes() {
      return GITHUB_MANAGEMENT_SETTINGS_SCOPES;
    },

    listCapabilities(scope) {
      return Object.freeze(capabilitiesForScope(scope));
    },

    describeBoundary() {
      return Object.freeze({
        scopes: GITHUB_MANAGEMENT_SETTINGS_SCOPES,
        rawProxy: false,
        mutationMethods: Object.freeze([]),
        enterprise: enterpriseClient.describeBoundary(),
        organizationRepository: organizationRepositoryClient.describeBoundary(),
        user: userClient.describeBoundary(),
      });
    },

    async read(scope, capability) {
      const allowlist = new Set(capabilitiesForScope(scope));
      if (!allowlist.has(capability)) {
        fail(`capability ${String(capability)} does not belong to scope ${String(scope)}`);
      }
      if (scope === 'enterprise') return enterpriseClient.read(capability);
      if (scope === 'user') return userClient.read(capability);
      return organizationRepositoryClient.read(capability, { repository });
    },
  });
}
