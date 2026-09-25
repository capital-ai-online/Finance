import {
  DEFAULT_GITHUB_API_BASE_URL,
  GITHUB_API_VERSION,
} from './githubAppInstallationAuthTransport.mjs';

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_PAGES = 100;

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
  'enterprise.actions.selected_organizations.list': Object.freeze({
    requiredPermission: 'Enterprise administration: read (classic PAT admin:enterprise)',
    path: ({ enterprise }) => `/enterprises/${enterprise}/actions/permissions/organizations`,
    pagination: Object.freeze({ kind: 'object', field: 'organizations' }),
  }),
  'enterprise.code_security.configurations.list': Object.freeze({
    requiredPermission: 'Enterprise administration: read (classic PAT read:enterprise)',
    path: ({ enterprise }) => `/enterprises/${enterprise}/code-security/configurations`,
    pagination: Object.freeze({ kind: 'array' }),
  }),
  'enterprise.actions.runner_groups.list': Object.freeze({
    requiredPermission: 'Enterprise runners: read (classic PAT manage_runners:enterprise)',
    path: ({ enterprise }) => `/enterprises/${enterprise}/actions/runner-groups`,
    pagination: Object.freeze({ kind: 'object', field: 'groups' }),
  }),
  'enterprise.actions.self_hosted_runners.list': Object.freeze({
    requiredPermission: 'Enterprise runners: read (classic PAT manage_runners:enterprise)',
    path: ({ enterprise }) => `/enterprises/${enterprise}/actions/runners`,
    pagination: Object.freeze({ kind: 'object', field: 'runners' }),
  }),
  'enterprise.audit_log.recent': Object.freeze({
    requiredPermission: 'Enterprise audit log: read (classic PAT read:audit_log or Enterprise administration read)',
    path: ({ enterprise }) => `/enterprises/${enterprise}/audit-log?include=web&order=desc&per_page=100`,
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


function sortedUnique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function parseScopeHeader(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return Object.freeze([]);
  }
  return Object.freeze(sortedUnique(
    value
      .split(',')
      .map((scope) => scope.trim())
      .filter((scope) => /^[A-Za-z0-9:_-]{1,80}$/.test(scope)),
  ));
}

function parseHeaderInteger(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return null;
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function sanitizeRateLimitResource(value) {
  const resource = typeof value === 'string' ? value.trim() : '';
  return /^[A-Za-z0-9_-]{1,40}$/.test(resource) ? resource : null;
}

function sanitizeProviderReason(payload) {
  const raw = typeof payload?.message === 'string'
    ? payload.message
    : 'GitHub API request rejected';
  const sanitized = raw
    .replace(/https?:\/\/[^\s)"']+/gi, '[REDACTED_URL]')
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)\b/g, '[REDACTED_TOKEN]')
    .replace(/\bBearer\s+[^\s]+/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
  return sanitized || 'GitHub API request rejected';
}

function buildProviderDiagnostics(response, payload) {
  const ssoRequired = response.headers.has('x-github-sso');
  const remaining = parseHeaderInteger(response.headers.get('x-ratelimit-remaining'));
  let classification = 'HTTP_ERROR';
  if (ssoRequired) classification = 'SSO_AUTHORIZATION_REQUIRED';
  else if (response.status === 403 && remaining === 0) classification = 'RATE_LIMITED';
  else if (response.status === 403) classification = 'FORBIDDEN';
  else if (response.status === 404) classification = 'NOT_FOUND_OR_HIDDEN';

  return Object.freeze({
    classification,
    oauthScopes: parseScopeHeader(response.headers.get('x-oauth-scopes')),
    acceptedOauthScopes: parseScopeHeader(response.headers.get('x-accepted-oauth-scopes')),
    ssoRequired,
    rateLimit: Object.freeze({
      limit: parseHeaderInteger(response.headers.get('x-ratelimit-limit')),
      remaining,
      resetEpochSeconds: parseHeaderInteger(response.headers.get('x-ratelimit-reset')),
      resource: sanitizeRateLimitResource(response.headers.get('x-ratelimit-resource')),
    }),
    providerReason: sanitizeProviderReason(payload),
  });
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
 *   enterprise?: string;
 *   enterpriseReadPat?: string;
 *   fetchImpl?: typeof fetch;
 *   apiBaseUrl?: string;
 * }} [options]
 */
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
      error.providerDiagnostics = buildProviderDiagnostics(response, payload);
      throw error;
    }
    return payload;
  }

  async function readPaginated(path, pagination) {
    const rows = [];
    let totalCount = 0;
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const joiner = path.includes('?') ? '&' : '?';
      const payload = await authenticatedGet(`${path}${joiner}per_page=100&page=${page}`);
      const pageRows = pagination.kind === 'array'
        ? payload
        : payload?.[pagination.field];
      if (!Array.isArray(pageRows)) {
        fail(`paginated Enterprise response must contain an array for ${pagination.field || 'root'}`);
      }
      if (page === 1 && Number.isInteger(payload?.total_count)) totalCount = payload.total_count;
      rows.push(...pageRows);
      if (pageRows.length < 100) {
        return Object.freeze({
          total_count: totalCount || rows.length,
          items: Object.freeze(rows),
        });
      }
      if (page === MAX_PAGES) fail('Enterprise settings pagination exceeded safety limit');
    }
    return Object.freeze({ total_count: rows.length, items: Object.freeze(rows) });
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
      const path = descriptor.path({ enterprise });
      return descriptor.pagination
        ? readPaginated(path, descriptor.pagination)
        : authenticatedGet(path);
    },
  });
}
