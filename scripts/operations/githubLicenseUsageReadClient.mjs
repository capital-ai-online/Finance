import {
  createGitHubAppJwt,
  DEFAULT_GITHUB_API_BASE_URL,
  GITHUB_API_VERSION,
} from './githubAppInstallationAuthTransport.mjs';

const REQUEST_TIMEOUT_MS = 15_000;
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;
const MAX_INSTALLATION_PAGES = 100;

function fail(message) {
  throw new Error(`[GITHUB-LICENSE-USAGE-READ] ${message}`);
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

function assertOptionalInteger(value, label, min, max) {
  if (value === undefined || value === null) return;
  if (!Number.isInteger(value) || value < min || value > max) {
    fail(`${label} must be an integer between ${min} and ${max}`);
  }
}

function assertOptionalRepository(value) {
  if (value === undefined || value === null) return;
  if (
    typeof value !== 'string'
    || value.length < 3
    || value.length > 202
    || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)
  ) {
    fail('repository must use owner/repository form');
  }
}

function assertVariableName(value) {
  if (
    typeof value !== 'string'
    || value.length < 1
    || value.length > 100
    || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)
  ) {
    fail('variable name must use GitHub Actions variable syntax');
  }
}

function buildQuery(path, entries) {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
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

function targetMatches(installation, targetType, slug) {
  if (!installation || typeof installation !== 'object') return false;
  if (!Number.isInteger(installation.id) || installation.id <= 0) return false;
  if (String(installation.target_type || '').toLowerCase() !== targetType.toLowerCase()) return false;

  const candidates = [
    installation?.account?.login,
    installation?.account?.slug,
    installation?.enterprise?.slug,
    installation?.enterprise?.login,
  ]
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim().toLowerCase());

  return candidates.includes(slug.toLowerCase());
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
 * @typedef {object} GitHubLicenseUsageReadClientOptions
 * @property {string} [clientId]
 * @property {string} [privateKeyPem]
 * @property {string} [enterprise]
 * @property {string} [organization]
 * @property {string} [enterpriseReadPat]
 * @property {typeof fetch} [fetchImpl]
 * @property {string} [apiBaseUrl]
 * @property {() => number} [now]
 */

/**
 * @param {GitHubLicenseUsageReadClientOptions} [options]
 */
export function createGitHubLicenseUsageReadClient({
  clientId,
  privateKeyPem,
  enterprise,
  organization,
  enterpriseReadPat = undefined,
  fetchImpl = globalThis.fetch,
  apiBaseUrl = DEFAULT_GITHUB_API_BASE_URL,
  now = () => Date.now(),
} = {}) {
  assertClientId(clientId);
  assertSlug(enterprise, 'enterprise');
  assertSlug(organization, 'organization');
  if (
    enterpriseReadPat !== undefined
    && (typeof enterpriseReadPat !== 'string' || enterpriseReadPat.trim().length < 20)
  ) {
    fail('enterpriseReadPat must be a non-empty secret token when provided');
  }
  const normalizedEnterpriseReadPat = typeof enterpriseReadPat === 'string'
    ? enterpriseReadPat.trim()
    : null;
  if (typeof privateKeyPem !== 'string' || privateKeyPem.length < 64) fail('privateKeyPem is required');
  if (typeof fetchImpl !== 'function') fail('fetchImpl is required');
  if (typeof now !== 'function') fail('now must be a function');

  const baseUrl = normalizeBaseUrl(apiBaseUrl);
  let installations = null;
  let installationsPromise = null;
  const tokenCache = new Map();

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
      const error = new Error(`[GITHUB-LICENSE-USAGE-READ] GitHub API request failed with HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  async function loadInstallations() {
    if (installations) return installations;
    if (installationsPromise) return installationsPromise;

    installationsPromise = (async () => {
      const jwt = mintJwt();
      const rows = [];
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
      installations = rows;
      return installations;
    })();

    try {
      return await installationsPromise;
    } finally {
      installationsPromise = null;
    }
  }

  async function resolveInstallation(targetType, slug) {
    const rows = await loadInstallations();
    const matches = rows.filter((row) => targetMatches(row, targetType, slug));
    if (matches.length !== 1) {
      fail(`expected exactly one ${targetType} installation for ${slug}; found ${matches.length}`);
    }
    return matches[0];
  }

  async function installationToken(targetType, slug) {
    const key = `${targetType.toLowerCase()}:${slug.toLowerCase()}`;
    const cached = tokenCache.get(key);
    if (cached && now() + TOKEN_REFRESH_SKEW_MS < cached.expiresAt) return cached.token;

    const installation = await resolveInstallation(targetType, slug);
    const payload = await request({
      method: 'POST',
      path: `/app/installations/${installation.id}/access_tokens`,
      authorization: mintJwt(),
    });
    if (!payload || typeof payload.token !== 'string' || payload.token.length < 10) {
      fail('installation token response does not contain a token');
    }
    const expiresAt = parseExpiry(payload.expires_at);
    if (expiresAt <= now() + TOKEN_REFRESH_SKEW_MS) {
      fail('installation token lifetime is shorter than the refresh safety window');
    }

    tokenCache.set(key, { token: payload.token, expiresAt, installationId: installation.id });
    return payload.token;
  }

  async function authenticatedGet(targetType, slug, path, retry401 = true) {
    const token = await installationToken(targetType, slug);
    try {
      return await request({ method: 'GET', path, authorization: token });
    } catch (error) {
      if (retry401 && error?.status === 401) {
        tokenCache.delete(`${targetType.toLowerCase()}:${slug.toLowerCase()}`);
        return authenticatedGet(targetType, slug, path, false);
      }
      throw error;
    }
  }

  return Object.freeze({
    describeBoundary() {
      return Object.freeze({
        enterprise,
        organization,
        publicMethods: Object.freeze(['GET']),
        capabilities: Object.freeze([
          'enterprise.consumed_licenses.list',
          'organization.advanced_security.active_committers.code_security',
          'organization.advanced_security.active_committers.secret_protection',
          'organization.billing.usage.summary',
          'organization.billing.usage.report',
          'repository.actions.variable.get',
          'organization.actions.variable.get',
        ]),
        enterpriseConsumedLicensesAuth: normalizedEnterpriseReadPat
          ? 'github_app_with_pat_fallback'
          : 'github_app_only',
        tokenPersistence: false,
        clientSecretUsed: false,
      });
    },

    /**
     * @param {{ page?: number }} [options]
     */
    async getEnterpriseConsumedLicenses({ page = 1 } = {}) {
      if (!Number.isInteger(page) || page < 1 || page > 1000) fail('page must be an integer between 1 and 1000');
      const path = `/enterprises/${enterprise}/consumed-licenses?per_page=100&page=${page}`;

      try {
        return await authenticatedGet('Enterprise', enterprise, path);
      } catch (error) {
        if (
          normalizedEnterpriseReadPat
          && (error?.status === 403 || error?.status === 404)
        ) {
          return request({
            method: 'GET',
            path,
            authorization: normalizedEnterpriseReadPat,
          });
        }
        throw error;
      }
    },

    async getOrganizationUsageReport({ year, month, day } = {}) {
      assertOptionalInteger(year, 'year', 2000, 2100);
      assertOptionalInteger(month, 'month', 1, 12);
      assertOptionalInteger(day, 'day', 1, 31);

      return authenticatedGet(
        'Organization',
        organization,
        buildQuery(
          `/organizations/${organization}/settings/billing/usage`,
          [
            ['year', year],
            ['month', month],
            ['day', day],
          ],
        ),
      );
    },

    async getOrganizationUsageSummary({ year, month, day, repository } = {}) {
      assertOptionalInteger(year, 'year', 2000, 2100);
      assertOptionalInteger(month, 'month', 1, 12);
      assertOptionalInteger(day, 'day', 1, 31);
      assertOptionalRepository(repository);

      return authenticatedGet(
        'Organization',
        organization,
        buildQuery(
          `/organizations/${organization}/settings/billing/usage/summary`,
          [
            ['year', year],
            ['month', month],
            ['day', day],
            ['repository', repository],
          ],
        ),
      );
    },

    async getRepositoryVariable({ repository, name } = {}) {
      assertOptionalRepository(repository);
      if (!repository) fail('repository is required');
      const [owner] = repository.split('/');
      if (owner.toLowerCase() !== organization.toLowerCase()) {
        fail('repository owner must match the configured organization');
      }
      assertVariableName(name);

      return authenticatedGet(
        'Organization',
        organization,
        `/repos/${repository}/actions/variables/${encodeURIComponent(name)}`,
      );
    },

    async getOrganizationVariable({ name } = {}) {
      assertVariableName(name);
      return authenticatedGet(
        'Organization',
        organization,
        `/orgs/${organization}/actions/variables/${encodeURIComponent(name)}`,
      );
    },

    /**
     * Runtime validation intentionally accepts a string here so invalid products
     * remain testable and fail closed at the public boundary.
     * @param {{ product?: string, page?: number }} [options]
     */
    async getAdvancedSecurityActiveCommitters({ product, page = 1 } = {}) {
      if (!['code_security', 'secret_protection'].includes(product)) {
        fail('product must be code_security or secret_protection');
      }
      if (!Number.isInteger(page) || page < 1 || page > 1000) fail('page must be an integer between 1 and 1000');
      return authenticatedGet(
        'Organization',
        organization,
        `/orgs/${organization}/settings/billing/advanced-security?advanced_security_product=${product}&per_page=100&page=${page}`,
      );
    },

    async preflight() {
      const [enterpriseInstallation, organizationInstallation] = await Promise.all([
        resolveInstallation('Enterprise', enterprise),
        resolveInstallation('Organization', organization),
      ]);
      return Object.freeze({
        enterpriseInstallationId: enterpriseInstallation.id,
        organizationInstallationId: organizationInstallation.id,
      });
    },
  });
}
