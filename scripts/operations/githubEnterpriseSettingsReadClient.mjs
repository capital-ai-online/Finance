import {
  DEFAULT_GITHUB_API_BASE_URL,
  GITHUB_API_VERSION,
} from './githubAppInstallationAuthTransport.mjs';

const REQUEST_TIMEOUT_MS = 15_000;

export const GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES = Object.freeze({
  'enterprise.actions.permissions.get': Object.freeze({
    requiredPermission: 'Enterprise administration: read (classic PAT admin:enterprise)',
    path: ({ enterprise }) => `/enterprises/${enterprise}/actions/permissions`,
  }),
  'enterprise.actions.selected_actions.get': Object.freeze({
    requiredPermission: 'Enterprise administration: read (classic PAT admin:enterprise)',
    path: ({ enterprise }) => `/enterprises/${enterprise}/actions/permissions/selected-actions`,
  }),
  'enterprise.actions.workflow_permissions.get': Object.freeze({
    requiredPermission: 'Enterprise administration: read (classic PAT admin:enterprise)',
    path: ({ enterprise }) => `/enterprises/${enterprise}/actions/permissions/workflow`,
  }),
});

function fail(message) {
  throw new Error(`[GITHUB-ENTERPRISE-SETTINGS-READ] ${message}`);
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

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    fail('GitHub API returned non-JSON content');
  }
}

export function createGitHubEnterpriseSettingsReadClient({
  enterprise,
  enterpriseReadPat,
  fetchImpl = globalThis.fetch,
  apiBaseUrl = DEFAULT_GITHUB_API_BASE_URL,
} = {}) {
  assertSlug(enterprise, 'enterprise');
  if (typeof enterpriseReadPat !== 'string' || enterpriseReadPat.trim().length < 20) {
    fail('enterpriseReadPat is required');
  }
  if (typeof fetchImpl !== 'function') fail('fetchImpl is required');

  const token = enterpriseReadPat.trim();
  const baseUrl = normalizeBaseUrl(apiBaseUrl);

  async function authenticatedGet(path) {
    let response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
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
        `[GITHUB-ENTERPRISE-SETTINGS-READ] GitHub API request failed with HTTP ${response.status}`,
      );
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  return Object.freeze({
    describeBoundary() {
      return Object.freeze({
        enterprise,
        publicMethods: Object.freeze(['GET']),
        rawProxy: false,
        capabilities: Object.freeze(Object.keys(GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES)),
        auth: 'classic_pat_read_only',
        tokenPersistence: false,
      });
    },

    async read(capability) {
      const descriptor = GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES[capability];
      if (!descriptor) fail(`unsupported capability: ${capability}`);
      return authenticatedGet(descriptor.path({ enterprise }));
    },
  });
}
