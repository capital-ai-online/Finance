import {
  createGitHubAppJwt,
  DEFAULT_GITHUB_API_BASE_URL,
  GITHUB_API_VERSION,
} from './githubAppInstallationAuthTransport.mjs';

const REQUEST_TIMEOUT_MS = 15_000;
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;
const MAX_INSTALLATION_PAGES = 100;
const MAX_RULESET_PAGES = 100;
const MAX_ARTIFACT_PAGES = 100;
const MAX_ENVIRONMENT_PAGES = 100;

export const GITHUB_SETTINGS_READ_CAPABILITIES = Object.freeze({
  'organization.settings.get': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Organization metadata/settings: read',
    path: ({ organization }) => `/orgs/${organization}`,
  }),
  'organization.actions.permissions.get': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Administration: read',
    path: ({ organization }) => `/orgs/${organization}/actions/permissions`,
  }),
  'organization.actions.selected_actions.get': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Administration: read',
    path: ({ organization }) => `/orgs/${organization}/actions/permissions/selected-actions`,
  }),
  'organization.actions.selected_repositories.list': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Administration: read',
    path: ({ organization }) => `/orgs/${organization}/actions/permissions/repositories`,
    pagination: Object.freeze({ kind: 'object', field: 'repositories' }),
  }),
  'organization.actions.workflow_permissions.get': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Administration: read',
    path: ({ organization }) => `/orgs/${organization}/actions/permissions/workflow`,
  }),
  'organization.actions.retention.get': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Administration: read',
    path: ({ organization }) => `/orgs/${organization}/actions/permissions/artifact-and-log-retention`,
  }),
  'organization.actions.fork_pr_private_repos.get': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Administration: read',
    path: ({ organization }) => `/orgs/${organization}/actions/permissions/fork-pr-workflows-private-repos`,
  }),
  'organization.actions.self_hosted_runners.get': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Administration: read',
    path: ({ organization }) => `/orgs/${organization}/actions/permissions/self-hosted-runners`,
  }),
  'organization.actions.self_hosted_runners.list': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Self-hosted runners: read',
    path: ({ organization }) => `/orgs/${organization}/actions/runners`,
    pagination: Object.freeze({ kind: 'object', field: 'runners' }),
  }),
  'organization.actions.runner_groups.list': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Self-hosted runners: read',
    path: ({ organization }) => `/orgs/${organization}/actions/runner-groups`,
    pagination: Object.freeze({ kind: 'object', field: 'groups' }),
  }),
  'organization.actions.cache_usage.get': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Administration: read',
    path: ({ organization }) => `/orgs/${organization}/actions/cache/usage`,
  }),
  'organization.actions.cache_retention_limit.get': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Administration: read',
    path: ({ organization }) => `/orgs/${organization}/actions/cache/retention-limit`,
  }),
  'organization.actions.cache_storage_limit.get': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Administration: read',
    path: ({ organization }) => `/orgs/${organization}/actions/cache/storage-limit`,
  }),
  'organization.rulesets.list': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Administration: read',
    path: ({ organization }) => `/orgs/${organization}/rulesets`,
    pagination: Object.freeze({ kind: 'array' }),
  }),
  'organization.custom_properties.schema.list': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Custom properties: read',
    path: ({ organization }) => `/orgs/${organization}/properties/schema`,
    pagination: Object.freeze({ kind: 'array' }),
  }),
  'organization.code_security.configurations.list': Object.freeze({
    scope: 'organization',
    requiredPermission: 'Administration: read',
    path: ({ organization }) => `/orgs/${organization}/code-security/configurations`,
    pagination: Object.freeze({ kind: 'array' }),
  }),
  'repository.settings.get': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Metadata: read',
    path: ({ repository }) => `/repos/${repository}`,
  }),
  'repository.actions.permissions.get': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Administration: read',
    path: ({ repository }) => `/repos/${repository}/actions/permissions`,
  }),
  'repository.actions.selected_actions.get': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Administration: read',
    path: ({ repository }) => `/repos/${repository}/actions/permissions/selected-actions`,
  }),
  'repository.actions.workflow_permissions.get': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Administration: read',
    path: ({ repository }) => `/repos/${repository}/actions/permissions/workflow`,
  }),
  'repository.actions.retention.get': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Administration: read',
    path: ({ repository }) => `/repos/${repository}/actions/permissions/artifact-and-log-retention`,
  }),
  'repository.actions.fork_pr_private_repos.get': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Administration: read',
    path: ({ repository }) => `/repos/${repository}/actions/permissions/fork-pr-workflows-private-repos`,
  }),
  'repository.actions.cache_usage.get': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Actions: read',
    path: ({ repository }) => `/repos/${repository}/actions/cache/usage`,
  }),
  'repository.actions.cache_retention_limit.get': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Administration: read',
    path: ({ repository }) => `/repos/${repository}/actions/cache/retention-limit`,
  }),
  'repository.actions.cache_storage_limit.get': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Actions: read',
    path: ({ repository }) => `/repos/${repository}/actions/cache/storage-limit`,
  }),
  'repository.actions.self_hosted_runners.list': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Administration: read',
    path: ({ repository }) => `/repos/${repository}/actions/runners`,
    pagination: Object.freeze({ kind: 'object', field: 'runners' }),
  }),
  'repository.actions.artifacts.list': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Actions: read',
    pagination: 'artifactCollection',
    path: ({ repository }) => `/repos/${repository}/actions/artifacts`,
  }),
  'repository.environments.list': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Actions: read',
    pagination: 'environmentCollection',
    path: ({ repository }) => `/repos/${repository}/environments`,
  }),
  'repository.code_security.configuration.get': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Administration: read',
    path: ({ repository }) => `/repos/${repository}/code-security-configuration`,
  }),
  'repository.custom_properties.list': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Metadata: read',
    path: ({ repository }) => `/repos/${repository}/properties/values`,
  }),
  'repository.rulesets.list': Object.freeze({
    scope: 'repository',
    requiredPermission: 'Metadata: read',
    path: ({ repository }) => `/repos/${repository}/rulesets`,
    pagination: Object.freeze({ kind: 'array' }),
  }),
});

function fail(message) {
  throw new Error(`[GITHUB-SETTINGS-INVENTORY-READ] ${message}`);
}

function assertSlug(value, label) {
  if (
    typeof value !== 'string'
    || value.length < 1
    || value.length > 100
    || !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(value)
  ) {
    fail(`${label} must be a valid GitHub slug`);
  }
}

function assertClientId(value) {
  if (typeof value !== 'string' || value.length < 3 || value.length > 256) {
    fail('clientId is required');
  }
}

function assertRepository(value, organization) {
  if (
    typeof value !== 'string'
    || value.length < 3
    || value.length > 202
    || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)
  ) {
    fail('repository must use owner/repository form');
  }
  const [owner] = value.split('/');
  if (owner.toLowerCase() !== organization.toLowerCase()) {
    fail('repository owner must match configured organization');
  }
}

function normalizeBaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail('apiBaseUrl must be an absolute URL');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    fail('apiBaseUrl must be a credential-free HTTPS origin');
  }
  return url.href.replace(/\/$/, '');
}

function parseExpiry(value) {
  const parsed = Date.parse(String(value || ''));
  if (!Number.isFinite(parsed)) fail('installation token response has invalid expires_at');
  return parsed;
}

function installationMatches(installation, organization) {
  if (!installation || typeof installation !== 'object') return false;
  if (!Number.isInteger(installation.id) || installation.id <= 0) return false;
  if (String(installation.target_type || '').toLowerCase() !== 'organization') return false;
  return [installation?.account?.login, installation?.account?.slug]
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim().toLowerCase())
    .includes(organization.toLowerCase());
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    fail('GitHub API returned non-JSON content');
  }
}

/**
 * @param {{
 *   clientId?: string;
 *   privateKeyPem?: string;
 *   organization?: string;
 *   fetchImpl?: typeof fetch;
 *   apiBaseUrl?: string;
 *   now?: () => number;
 * }} [options]
 */
export function createGitHubSettingsInventoryReadClient({
  clientId,
  privateKeyPem,
  organization,
  fetchImpl = globalThis.fetch,
  apiBaseUrl = DEFAULT_GITHUB_API_BASE_URL,
  now = () => Date.now(),
} = {}) {
  assertClientId(clientId);
  assertSlug(organization, 'organization');
  if (typeof privateKeyPem !== 'string' || privateKeyPem.length < 64) fail('privateKeyPem is required');
  if (typeof fetchImpl !== 'function') fail('fetchImpl is required');
  if (typeof now !== 'function') fail('now must be a function');

  const baseUrl = normalizeBaseUrl(apiBaseUrl);
  let installation = null;
  let installationToken = null;
  let installationTokenExpiresAt = 0;

  function mintJwt() {
    return createGitHubAppJwt({ clientId, privateKeyPem, nowMs: now() });
  }

  async function request({ method, path, authorization }) {
    let response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${authorization}`,
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      fail(`GitHub API network request failed: ${error?.name || 'unknown error'}`);
    }

    const payload = await parseJson(response);
    if (!response.ok) {
      const error = new Error(
        `[GITHUB-SETTINGS-INVENTORY-READ] GitHub API request failed with HTTP ${response.status}`,
      );
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  async function resolveOrganizationInstallation() {
    if (installation) return installation;
    const rows = [];
    const jwt = mintJwt();

    for (let page = 1; page <= MAX_INSTALLATION_PAGES; page += 1) {
      const pageRows = await request({
        method: 'GET',
        path: `/app/installations?per_page=100&page=${page}`,
        authorization: jwt,
      });
      if (!Array.isArray(pageRows)) fail('GET /app/installations must return an array');
      rows.push(...pageRows);
      if (pageRows.length < 100) break;
      if (page === MAX_INSTALLATION_PAGES) fail('installation pagination exceeded safety limit');
    }

    const matches = rows.filter((row) => installationMatches(row, organization));
    if (matches.length !== 1) {
      fail(`expected exactly one Organization installation for ${organization}; found ${matches.length}`);
    }
    installation = matches[0];
    return installation;
  }

  function tokenIsFresh() {
    return (
      typeof installationToken === 'string'
      && installationToken.length > 0
      && now() + TOKEN_REFRESH_SKEW_MS < installationTokenExpiresAt
    );
  }

  async function getInstallationToken() {
    if (tokenIsFresh()) return installationToken;

    const resolved = await resolveOrganizationInstallation();
    const payload = await request({
      method: 'POST',
      path: `/app/installations/${resolved.id}/access_tokens`,
      authorization: mintJwt(),
    });
    if (!payload || typeof payload.token !== 'string' || payload.token.length < 10) {
      fail('installation token response does not contain a token');
    }

    installationTokenExpiresAt = parseExpiry(payload.expires_at);
    if (installationTokenExpiresAt <= now() + TOKEN_REFRESH_SKEW_MS) {
      installationTokenExpiresAt = 0;
      fail('installation token lifetime is shorter than refresh safety window');
    }
    installationToken = payload.token;
    return installationToken;
  }

  async function authenticatedGet(path, retry401 = true) {
    const token = await getInstallationToken();
    try {
      return await request({ method: 'GET', path, authorization: token });
    } catch (error) {
      if (retry401 && error?.status === 401) {
        installationToken = null;
        installationTokenExpiresAt = 0;
        return authenticatedGet(path, false);
      }
      throw error;
    }
  }

  function context(repository) {
    if (repository !== undefined) assertRepository(repository, organization);
    return { organization, repository };
  }

  async function readPaginatedCollection(path, pagination) {
    const rows = [];
    let totalCount = 0;
    for (let page = 1; page <= MAX_RULESET_PAGES; page += 1) {
      const joiner = path.includes('?') ? '&' : '?';
      const payload = await authenticatedGet(`${path}${joiner}per_page=100&page=${page}`);
      const pageRows = pagination.kind === 'array'
        ? payload
        : payload?.[pagination.field];
      if (!Array.isArray(pageRows)) {
        fail(`paginated settings response must contain an array for ${pagination.field || 'root'}`);
      }
      if (page === 1 && Number.isInteger(payload?.total_count)) totalCount = payload.total_count;
      rows.push(...pageRows);
      if (pageRows.length < 100) {
        return Object.freeze({
          total_count: totalCount || rows.length,
          items: Object.freeze(rows),
        });
      }
      if (page === MAX_RULESET_PAGES) fail('settings pagination exceeded safety limit');
    }
    return Object.freeze({ total_count: rows.length, items: Object.freeze(rows) });
  }

  async function readArtifactCollection(path) {
    const artifacts = [];
    let totalCount = 0;

    for (let page = 1; page <= MAX_ARTIFACT_PAGES; page += 1) {
      const joiner = path.includes('?') ? '&' : '?';
      const payload = await authenticatedGet(`${path}${joiner}per_page=100&page=${page}`);
      if (!payload || !Array.isArray(payload.artifacts)) {
        fail('repository artifacts response must contain an artifacts array');
      }
      if (page === 1 && Number.isInteger(payload.total_count)) totalCount = payload.total_count;
      artifacts.push(...payload.artifacts);
      if (payload.artifacts.length < 100) {
        return Object.freeze({
          total_count: totalCount || artifacts.length,
          artifacts: Object.freeze(artifacts),
        });
      }
      if (page === MAX_ARTIFACT_PAGES) fail('artifact pagination exceeded safety limit');
    }

    return Object.freeze({ total_count: artifacts.length, artifacts: Object.freeze(artifacts) });
  }

  async function readEnvironmentCollection(path) {
    const environments = [];
    let totalCount = 0;

    for (let page = 1; page <= MAX_ENVIRONMENT_PAGES; page += 1) {
      const joiner = path.includes('?') ? '&' : '?';
      const payload = await authenticatedGet(`${path}${joiner}per_page=100&page=${page}`);
      if (!payload || !Array.isArray(payload.environments)) {
        fail('repository environments response must contain an environments array');
      }
      if (page === 1 && Number.isInteger(payload.total_count)) totalCount = payload.total_count;
      environments.push(...payload.environments);
      if (payload.environments.length < 100) {
        return Object.freeze({
          total_count: totalCount || environments.length,
          environments: Object.freeze(environments),
        });
      }
      if (page === MAX_ENVIRONMENT_PAGES) fail('environment pagination exceeded safety limit');
    }

    return Object.freeze({ total_count: environments.length, environments: Object.freeze(environments) });
  }

  return Object.freeze({
    describeBoundary() {
      return Object.freeze({
        organization,
        publicMethods: Object.freeze(['GET']),
        rawProxy: false,
        capabilities: Object.freeze(Object.keys(GITHUB_SETTINGS_READ_CAPABILITIES)),
        repositoryRulesetsPermission: 'Metadata: read',
        repositoryEnvironmentsPermission: 'Actions: read',
        repositoryCodeSecurityConfigurationPermission: 'Administration: read',
        tokenPersistence: false,
        clientSecretUsed: false,
      });
    },

    async read(capability, { repository } = {}) {
      const descriptor = GITHUB_SETTINGS_READ_CAPABILITIES[capability];
      if (!descriptor) fail(`unsupported capability: ${capability}`);
      if (descriptor.scope === 'repository' && !repository) fail('repository is required');
      const path = descriptor.path(context(repository));
      if ('pagination' in descriptor && descriptor.pagination === 'artifactCollection') return readArtifactCollection(path);
      if ('pagination' in descriptor && descriptor.pagination === 'environmentCollection') return readEnvironmentCollection(path);
      if ('pagination' in descriptor && typeof descriptor.pagination === 'object') {
        return readPaginatedCollection(path, descriptor.pagination);
      }
      return authenticatedGet(path);
    },

    async listRepositoryRulesets({ repository } = {}) {
      assertRepository(repository, organization);
      const descriptor = GITHUB_SETTINGS_READ_CAPABILITIES['repository.rulesets.list'];
      const payload = await readPaginatedCollection(
        descriptor.path(context(repository)),
        descriptor.pagination,
      );
      return Object.freeze(payload.items);
    },

    async preflight() {
      const resolved = await resolveOrganizationInstallation();
      await getInstallationToken();
      return Object.freeze({
        organizationInstallationId: resolved.id,
        installationTokenExpiresAt: new Date(installationTokenExpiresAt).toISOString(),
      });
    },
  });
}
