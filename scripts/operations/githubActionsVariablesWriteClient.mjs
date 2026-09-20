import {
  createGitHubAppJwt,
  DEFAULT_GITHUB_API_BASE_URL,
  GITHUB_API_VERSION,
} from './githubAppInstallationAuthTransport.mjs';

const REQUEST_TIMEOUT_MS = 15_000;
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;
const MAX_INSTALLATION_PAGES = 100;
export const ALLOWED_REPOSITORY_VARIABLE = 'GHCR_DIGEST_PUBLISH_ENABLED';

function fail(message) {
  throw new Error(`[GITHUB-ACTIONS-VARIABLES-WRITE] ${message}`);
}

function assertClientId(value) {
  if (typeof value !== 'string' || value.length < 3 || value.length > 256) {
    fail('clientId is required');
  }
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
    fail('repository owner must match the configured organization');
  }
}

function assertAllowedMutation(name, value) {
  if (name !== ALLOWED_REPOSITORY_VARIABLE) {
    fail(`variable name must be exactly ${ALLOWED_REPOSITORY_VARIABLE}`);
  }
  if (!['true', 'false'].includes(value)) {
    fail('variable value must be exactly true or false');
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

function targetMatches(installation, organization) {
  if (!installation || typeof installation !== 'object') return false;
  if (!Number.isInteger(installation.id) || installation.id <= 0) return false;
  if (String(installation.target_type || '').toLowerCase() !== 'organization') return false;
  const candidates = [
    installation?.account?.login,
    installation?.account?.slug,
  ]
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim().toLowerCase());
  return candidates.includes(organization.toLowerCase());
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
 * @typedef {object} GitHubActionsVariablesWriteClientOptions
 * @property {string} [clientId]
 * @property {string} [privateKeyPem]
 * @property {string} [organization]
 * @property {typeof fetch} [fetchImpl]
 * @property {string} [apiBaseUrl]
 * @property {() => number} [now]
 */

/**
 * @param {GitHubActionsVariablesWriteClientOptions} [options]
 */
export function createGitHubActionsVariablesWriteClient({
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
  let tokenCache = null;

  function mintJwt() {
    return createGitHubAppJwt({ clientId, privateKeyPem, nowMs: now() });
  }

  async function request({ method, path, authorization, body = undefined }) {
    let response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${authorization}`,
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      fail(`GitHub API network request failed: ${error?.name || 'unknown error'}`);
    }

    const payload = await parseJson(response);
    if (!response.ok) {
      const error = new Error(
        `[GITHUB-ACTIONS-VARIABLES-WRITE] GitHub API request failed with HTTP ${response.status}`,
      );
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  async function resolveOrganizationInstallation() {
    if (installation) return installation;
    const jwt = mintJwt();
    const matches = [];

    for (let page = 1; page <= MAX_INSTALLATION_PAGES; page += 1) {
      const rows = await request({
        method: 'GET',
        path: `/app/installations?per_page=100&page=${page}`,
        authorization: jwt,
      });
      if (!Array.isArray(rows)) fail('GET /app/installations must return an array');
      matches.push(...rows.filter((row) => targetMatches(row, organization)));
      if (rows.length < 100) break;
      if (page === MAX_INSTALLATION_PAGES) fail('installation pagination exceeded safety limit');
    }

    if (matches.length !== 1) {
      fail(`expected exactly one Organization installation for ${organization}; found ${matches.length}`);
    }
    installation = matches[0];
    return installation;
  }

  async function installationToken() {
    if (tokenCache && now() + TOKEN_REFRESH_SKEW_MS < tokenCache.expiresAt) {
      return tokenCache.token;
    }

    const target = await resolveOrganizationInstallation();
    const payload = await request({
      method: 'POST',
      path: `/app/installations/${target.id}/access_tokens`,
      authorization: mintJwt(),
    });
    if (!payload || typeof payload.token !== 'string' || payload.token.length < 10) {
      fail('installation token response does not contain a token');
    }

    const expiresAt = parseExpiry(payload.expires_at);
    if (expiresAt <= now() + TOKEN_REFRESH_SKEW_MS) {
      fail('installation token lifetime is shorter than the refresh safety window');
    }
    tokenCache = { token: payload.token, expiresAt };
    return tokenCache.token;
  }

  async function authenticatedRequest({ method, path, body = undefined, retry401 = true }) {
    const token = await installationToken();
    try {
      return await request({ method, path, body, authorization: token });
    } catch (error) {
      if (retry401 && error?.status === 401) {
        tokenCache = null;
        return authenticatedRequest({ method, path, body, retry401: false });
      }
      throw error;
    }
  }

  return Object.freeze({
    describeBoundary() {
      return Object.freeze({
        organization,
        allowedVariable: ALLOWED_REPOSITORY_VARIABLE,
        allowedValues: Object.freeze(['true', 'false']),
        publicMethods: Object.freeze(['GET', 'POST', 'PATCH']),
        tokenPersistence: false,
        patFallback: false,
      });
    },

    async setRepositoryVariable({ repository, name, value } = {}) {
      assertRepository(repository, organization);
      assertAllowedMutation(name, value);

      const itemPath = `/repos/${repository}/actions/variables/${encodeURIComponent(name)}`;
      let action;

      try {
        await authenticatedRequest({ method: 'GET', path: itemPath });
        await authenticatedRequest({
          method: 'PATCH',
          path: itemPath,
          body: { name, value },
        });
        action = 'updated';
      } catch (error) {
        if (error?.status !== 404) throw error;
        await authenticatedRequest({
          method: 'POST',
          path: `/repos/${repository}/actions/variables`,
          body: { name, value },
        });
        action = 'created';
      }

      const readback = await authenticatedRequest({ method: 'GET', path: itemPath });
      if (
        !readback
        || typeof readback !== 'object'
        || readback.name !== name
        || readback.value !== value
      ) {
        fail('repository variable readback does not match the requested mutation');
      }

      const target = await resolveOrganizationInstallation();
      return Object.freeze({
        status: 'PASS',
        action,
        repository,
        variable: Object.freeze({
          name: readback.name,
          value: readback.value,
          createdAt: typeof readback.created_at === 'string' ? readback.created_at : null,
          updatedAt: typeof readback.updated_at === 'string' ? readback.updated_at : null,
        }),
        auth: 'github_app_installation_token',
        organizationInstallationId: target.id,
        patUsed: false,
        secretsOrTokensLogged: false,
      });
    },
  });
}
