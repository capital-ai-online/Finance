import {
  DEFAULT_GITHUB_API_BASE_URL,
  GITHUB_API_VERSION,
} from './githubAppInstallationAuthTransport.mjs';

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_PAGES = 100;

export const GITHUB_USER_SETTINGS_READ_CAPABILITIES = Object.freeze({
  'user.profile.get': Object.freeze({
    requiredPermission: 'read:user (classic PAT) or Account profile: read',
    path: '/user',
  }),
  'user.emails.list': Object.freeze({
    requiredPermission: 'user:email (classic PAT) or Email addresses: read',
    path: '/user/emails',
    pagination: 'array',
  }),
  'user.ssh_keys.list': Object.freeze({
    requiredPermission: 'read:public_key (classic PAT) or Git SSH keys: read',
    path: '/user/keys',
    pagination: 'array',
  }),
  'user.gpg_keys.list': Object.freeze({
    requiredPermission: 'read:gpg_key (classic PAT) or GPG keys: read',
    path: '/user/gpg_keys',
    pagination: 'array',
  }),
  'user.ssh_signing_keys.list': Object.freeze({
    requiredPermission: 'read:ssh_signing_key (classic PAT) or SSH signing keys: read',
    path: '/user/ssh_signing_keys',
    pagination: 'array',
  }),
});

function fail(message) {
  throw new Error(`[GITHUB-USER-SETTINGS-READ] ${message}`);
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
  if (typeof value !== 'string' || value.trim().length === 0) return Object.freeze([]);
  return Object.freeze(sortedUnique(
    value.split(',').map((scope) => scope.trim()).filter((scope) => /^[A-Za-z0-9:_-]{1,80}$/.test(scope)),
  ));
}

function parseHeaderInteger(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return null;
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function sanitizeProviderReason(payload) {
  const raw = typeof payload?.message === 'string' ? payload.message : 'GitHub API request rejected';
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
  const remaining = parseHeaderInteger(response.headers.get('x-ratelimit-remaining'));
  return Object.freeze({
    classification: response.status === 403 && remaining === 0
      ? 'RATE_LIMITED'
      : response.status === 403
        ? 'FORBIDDEN'
        : response.status === 404
          ? 'NOT_FOUND_OR_HIDDEN'
          : 'HTTP_ERROR',
    oauthScopes: parseScopeHeader(response.headers.get('x-oauth-scopes')),
    acceptedOauthScopes: parseScopeHeader(response.headers.get('x-accepted-oauth-scopes')),
    ssoRequired: response.headers.has('x-github-sso'),
    rateLimit: Object.freeze({
      limit: parseHeaderInteger(response.headers.get('x-ratelimit-limit')),
      remaining,
      resetEpochSeconds: parseHeaderInteger(response.headers.get('x-ratelimit-reset')),
      resource: /^[A-Za-z0-9_-]{1,40}$/.test(response.headers.get('x-ratelimit-resource') || '')
        ? response.headers.get('x-ratelimit-resource')
        : null,
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
 *   userReadToken?: string;
 *   fetchImpl?: typeof fetch;
 *   apiBaseUrl?: string;
 * }} [options]
 */
export function createGitHubUserSettingsReadClient({
  userReadToken,
  fetchImpl = globalThis.fetch,
  apiBaseUrl = DEFAULT_GITHUB_API_BASE_URL,
} = {}) {
  if (typeof userReadToken !== 'string' || userReadToken.trim().length < 20) {
    fail('userReadToken is required');
  }
  if (typeof fetchImpl !== 'function') fail('fetchImpl is required');

  const token = userReadToken.trim();
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
      const error = new Error(`[GITHUB-USER-SETTINGS-READ] GitHub API request failed with HTTP ${response.status}`);
      error.status = response.status;
      error.providerDiagnostics = buildProviderDiagnostics(response, payload);
      throw error;
    }
    return payload;
  }

  async function readArray(path) {
    const rows = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const joiner = path.includes('?') ? '&' : '?';
      const payload = await authenticatedGet(`${path}${joiner}per_page=100&page=${page}`);
      if (!Array.isArray(payload)) fail('paginated user settings response must be an array');
      rows.push(...payload);
      if (payload.length < 100) return Object.freeze(rows);
      if (page === MAX_PAGES) fail('user settings pagination exceeded safety limit');
    }
    return Object.freeze(rows);
  }

  return Object.freeze({
    describeBoundary() {
      return Object.freeze({
        publicMethods: Object.freeze(['GET']),
        rawProxy: false,
        capabilities: Object.freeze(Object.keys(GITHUB_USER_SETTINGS_READ_CAPABILITIES)),
        auth: 'authenticated_user_read_token',
        tokenPersistence: false,
      });
    },

    async read(capability) {
      const descriptor = GITHUB_USER_SETTINGS_READ_CAPABILITIES[capability];
      if (!descriptor) fail(`unsupported capability: ${capability}`);
      return descriptor.pagination === 'array'
        ? readArray(descriptor.path)
        : authenticatedGet(descriptor.path);
    },
  });
}
