import { createPrivateKey, sign as cryptoSign } from 'node:crypto';

export const GITHUB_API_VERSION = '2026-03-10';
export const DEFAULT_GITHUB_API_BASE_URL = 'https://api.github.com';

const JWT_CLOCK_SKEW_SECONDS = 60;
const JWT_LIFETIME_SECONDS = 9 * 60;
const INSTALLATION_TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_INSTALLATION_PAGES = 100;

/** @returns {never} */
function fail(message) {
  throw new Error(`[GITHUB-APP-INSTALLATION-AUTH] ${message}`);
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function assertClientId(clientId) {
  if (typeof clientId !== 'string' || clientId.length < 3 || clientId.length > 256) {
    fail('clientId is required');
  }
}

function assertEnterpriseSlug(enterprise) {
  if (
    typeof enterprise !== 'string'
    || enterprise.length < 1
    || enterprise.length > 100
    || !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(enterprise)
  ) {
    fail('enterprise must be a valid GitHub enterprise slug');
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

function assertFetch(fetchImpl) {
  if (typeof fetchImpl !== 'function') fail('fetchImpl is required');
}

function normalizePrivateKey(privateKeyPem) {
  if (typeof privateKeyPem !== 'string' || privateKeyPem.length < 64) {
    fail('privateKeyPem is required');
  }

  let key;
  try {
    key = createPrivateKey(privateKeyPem);
  } catch {
    fail('privateKeyPem is not a valid private key');
  }

  if (key.asymmetricKeyType !== 'rsa') {
    fail('privateKeyPem must contain an RSA private key');
  }
  return key;
}

function parseExpiresAt(value) {
  const parsed = Date.parse(String(value || ''));
  if (!Number.isFinite(parsed)) fail('installation token response has invalid expires_at');
  return parsed;
}

function sanitizeProviderError(status) {
  return `GitHub API request failed with HTTP ${status}`;
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    fail('GitHub API returned non-JSON content');
  }
}

function installationIdentityCandidates(installation) {
  return [
    installation?.account?.login,
    installation?.account?.slug,
    installation?.enterprise?.slug,
    installation?.enterprise?.login,
  ]
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim().toLowerCase());
}

function isExactEnterpriseInstallation(installation, enterprise) {
  if (!installation || typeof installation !== 'object') return false;
  if (!Number.isInteger(installation.id) || installation.id <= 0) return false;
  if (String(installation.target_type || '').toLowerCase() !== 'enterprise') return false;
  return installationIdentityCandidates(installation).includes(enterprise.toLowerCase());
}

function assertSafeBillingPath(path, enterprise) {
  if (typeof path !== 'string' || path.includes('://') || path.includes('\\') || path.includes('..')) {
    fail('GitHub REST path must be a safe relative API path');
  }

  const allowedPrefix = `/enterprises/${enterprise}/settings/billing/`;
  if (!path.startsWith(allowedPrefix)) {
    fail(`GitHub REST path must stay inside ${allowedPrefix}`);
  }
}

function assertBillingReadPath(method, path, enterprise) {
  if (method !== 'GET') fail('authenticated billing reader only allows GET');
  assertSafeBillingPath(path, enterprise);
}

function assertCostCenterName(name) {
  if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 255) {
    fail('cost center name must be between 1 and 255 characters');
  }
  if (!/^[A-Za-z0-9 _.-]+$/.test(name.trim())) {
    fail('cost center name contains unsupported characters');
  }
}

function assertCostCenterCreateRequest(method, path, enterprise) {
  if (method !== 'POST') fail('cost center create transport only allows POST');
  assertSafeBillingPath(path, enterprise);
  const expectedPath = `/enterprises/${enterprise}/settings/billing/cost-centers`;
  if (path !== expectedPath) fail(`cost center create path must equal ${expectedPath}`);
}

/**
 * @param {{
 *   clientId?: string;
 *   privateKeyPem?: string;
 *   nowMs?: number;
 * }} [options]
 */
export function createGitHubAppJwt({
  clientId,
  privateKeyPem,
  nowMs = Date.now(),
} = {}) {
  assertClientId(clientId);
  const key = normalizePrivateKey(privateKeyPem);

  if (!Number.isFinite(nowMs) || nowMs <= 0) fail('nowMs must be a positive timestamp');

  const nowSeconds = Math.floor(nowMs / 1000);
  const header = base64UrlJson({ alg: 'RS256', typ: 'JWT' });
  const payload = base64UrlJson({
    iat: nowSeconds - JWT_CLOCK_SKEW_SECONDS,
    exp: nowSeconds + JWT_LIFETIME_SECONDS,
    iss: clientId,
  });
  const unsigned = `${header}.${payload}`;
  const signature = cryptoSign('RSA-SHA256', Buffer.from(unsigned, 'utf8'), key).toString('base64url');

  return `${unsigned}.${signature}`;
}

/**
 * @param {{
 *   clientId: string;
 *   privateKeyPem: string;
 *   enterprise: string;
 *   fetchImpl?: typeof fetch;
 *   apiBaseUrl?: string;
 *   now?: () => number;
 * }} options
 */
export function createGitHubAppInstallationAuthTransport({
  clientId,
  privateKeyPem,
  enterprise,
  fetchImpl = globalThis.fetch,
  apiBaseUrl = DEFAULT_GITHUB_API_BASE_URL,
  now = () => Date.now(),
} = {}) {
  assertClientId(clientId);
  assertEnterpriseSlug(enterprise);
  assertFetch(fetchImpl);
  if (typeof now !== 'function') fail('now must be a function');

  const baseUrl = normalizeBaseUrl(apiBaseUrl);
  const key = normalizePrivateKey(privateKeyPem);

  let installationId = null;
  let installationToken = null;
  let installationTokenExpiresAt = 0;

  function mintJwt() {
    return createGitHubAppJwt({
      clientId,
      privateKeyPem: key.export({ type: 'pkcs8', format: 'pem' }).toString(),
      nowMs: now(),
    });
  }

  async function providerRequest({ method, path, authorization, body = undefined }) {
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

    const payload = await readJsonResponse(response);
    if (!response.ok) {
      const error = new Error(`[GITHUB-APP-INSTALLATION-AUTH] ${sanitizeProviderError(response.status)}`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  async function resolveEnterpriseInstallationId() {
    if (installationId !== null) return installationId;

    const jwt = mintJwt();
    const matches = [];

    for (let page = 1; page <= MAX_INSTALLATION_PAGES; page += 1) {
      const installations = await providerRequest({
        method: 'GET',
        path: `/app/installations?per_page=100&page=${page}`,
        authorization: jwt,
      });

      if (!Array.isArray(installations)) {
        fail('GET /app/installations must return an array');
      }

      for (const installation of installations) {
        if (isExactEnterpriseInstallation(installation, enterprise)) matches.push(installation);
      }

      if (installations.length < 100) break;
      if (page === MAX_INSTALLATION_PAGES) {
        fail(`installation pagination exceeded safety limit of ${MAX_INSTALLATION_PAGES} pages`);
      }
    }

    if (matches.length !== 1) {
      fail(`expected exactly one Enterprise installation for ${enterprise}; found ${matches.length}`);
    }

    installationId = matches[0].id;
    return installationId;
  }

  function tokenIsFresh() {
    return (
      typeof installationToken === 'string'
      && installationToken.length > 0
      && now() + INSTALLATION_TOKEN_REFRESH_SKEW_MS < installationTokenExpiresAt
    );
  }

  async function mintInstallationToken() {
    const id = await resolveEnterpriseInstallationId();
    const jwt = mintJwt();
    const payload = await providerRequest({
      method: 'POST',
      path: `/app/installations/${id}/access_tokens`,
      authorization: jwt,
    });

    if (!payload || typeof payload !== 'object') fail('installation token response must be an object');
    if (typeof payload.token !== 'string' || payload.token.length < 10) {
      fail('installation token response does not contain a token');
    }

    installationToken = payload.token;
    installationTokenExpiresAt = parseExpiresAt(payload.expires_at);
    if (installationTokenExpiresAt <= now() + INSTALLATION_TOKEN_REFRESH_SKEW_MS) {
      installationToken = null;
      installationTokenExpiresAt = 0;
      fail('installation token lifetime is shorter than the refresh safety window');
    }

    return installationToken;
  }

  async function getInstallationToken() {
    if (tokenIsFresh()) return installationToken;
    installationToken = null;
    installationTokenExpiresAt = 0;
    return mintInstallationToken();
  }

  async function authenticatedBillingGet(path, { retry401 = true } = {}) {
    assertBillingReadPath('GET', path, enterprise);
    const token = await getInstallationToken();

    try {
      return await providerRequest({
        method: 'GET',
        path,
        authorization: token,
      });
    } catch (error) {
      if (retry401 && error?.status === 401) {
        installationToken = null;
        installationTokenExpiresAt = 0;
        return authenticatedBillingGet(path, { retry401: false });
      }
      throw error;
    }
  }

  async function authenticatedCostCenterCreate(name, aiCreditPoolEnabled, { retry401 = true } = {}) {
    const path = `/enterprises/${enterprise}/settings/billing/cost-centers`;
    assertCostCenterCreateRequest('POST', path, enterprise);
    assertCostCenterName(name);
    if (typeof aiCreditPoolEnabled !== 'boolean') {
      fail('aiCreditPoolEnabled must be a boolean');
    }

    const token = await getInstallationToken();
    try {
      return await providerRequest({
        method: 'POST',
        path,
        authorization: token,
        body: {
          name: name.trim(),
          ai_credit_pool_enabled: aiCreditPoolEnabled,
        },
      });
    } catch (error) {
      if (retry401 && error?.status === 401) {
        installationToken = null;
        installationTokenExpiresAt = 0;
        return authenticatedCostCenterCreate(name, aiCreditPoolEnabled, { retry401: false });
      }
      throw error;
    }
  }

  return Object.freeze({
    describeAuthBoundary() {
      return Object.freeze({
        enterprise,
        apiBaseUrl: baseUrl,
        jwtAlgorithm: 'RS256',
        jwtMaxLifetimeSeconds: JWT_LIFETIME_SECONDS,
        installationTokenRefreshSkewSeconds: INSTALLATION_TOKEN_REFRESH_SKEW_MS / 1000,
        publicMethods: Object.freeze(['GET', 'POST(cost-centers:create)']),
        publicPathPrefix: `/enterprises/${enterprise}/settings/billing/`,
        mutationCapabilities: Object.freeze(['github.billing.cost_centers.create']),
        rawMutationProxy: false,
        clientSecretUsed: false,
        tokenPersistence: false,
      });
    },

    async githubRest({ method, path }) {
      assertBillingReadPath(method, path, enterprise);
      return authenticatedBillingGet(path);
    },

    async createCostCenter({ name, aiCreditPoolEnabled = false } = {}) {
      return authenticatedCostCenterCreate(name, aiCreditPoolEnabled);
    },

    async preflight() {
      const id = await resolveEnterpriseInstallationId();
      await getInstallationToken();
      return Object.freeze({
        enterprise,
        installationId: id,
        installationTokenExpiresAt: new Date(installationTokenExpiresAt).toISOString(),
      });
    },
  });
}
