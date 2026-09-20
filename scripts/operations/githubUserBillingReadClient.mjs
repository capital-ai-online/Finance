export const GITHUB_USER_BILLING_REQUIRED_PERMISSION = 'user.plan:read';
export const GITHUB_API_VERSION = '2026-03-10';

const DEFAULT_API_BASE_URL = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 15_000;

function fail(message) {
  throw new Error(`[GITHUB-USER-BILLING-READ] ${message}`);
}

function assertUsername(value) {
  if (
    typeof value !== 'string'
    || value.length < 1
    || value.length > 100
    || !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(value)
  ) {
    fail('username must be a valid GitHub login');
  }
}

function assertToken(value) {
  if (typeof value !== 'string' || value.trim().length < 20) {
    fail('userAccessToken is required');
  }
}

function assertOptionalInteger(value, label, min, max) {
  if (value === undefined || value === null) return;
  if (!Number.isInteger(value) || value < min || value > max) {
    fail(`${label} must be an integer between ${min} and ${max}`);
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

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringOrNull(value) {
  return typeof value === 'string' ? value : null;
}

function normalizeUsageItem(raw) {
  if (!raw || typeof raw !== 'object') fail('usage item must be an object');
  return Object.freeze({
    product: stringOrNull(raw.product),
    sku: stringOrNull(raw.sku),
    unitType: stringOrNull(raw.unitType),
    pricePerUnit: numberOrNull(raw.pricePerUnit),
    grossQuantity: numberOrNull(raw.grossQuantity),
    grossAmount: numberOrNull(raw.grossAmount),
    discountQuantity: numberOrNull(raw.discountQuantity),
    discountAmount: numberOrNull(raw.discountAmount),
    netQuantity: numberOrNull(raw.netQuantity),
    netAmount: numberOrNull(raw.netAmount),
  });
}

function normalizeUsageSummary(raw) {
  if (!raw || typeof raw !== 'object') fail('usage summary must be an object');
  const period = raw.timePeriod && typeof raw.timePeriod === 'object' ? raw.timePeriod : {};
  const usageItems = Array.isArray(raw.usageItems) ? raw.usageItems : [];
  return Object.freeze({
    timePeriod: Object.freeze({
      year: Number.isInteger(period.year) ? period.year : null,
      month: Number.isInteger(period.month) ? period.month : null,
      day: Number.isInteger(period.day) ? period.day : null,
    }),
    user: stringOrNull(raw.user),
    usageItems: Object.freeze(usageItems.map(normalizeUsageItem)),
  });
}

function buildQuery(path, entries) {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function createGitHubUserBillingReadClient({
  username,
  userAccessToken,
  fetchImpl = globalThis.fetch,
  apiBaseUrl = DEFAULT_API_BASE_URL,
} = {}) {
  assertUsername(username);
  assertToken(userAccessToken);
  if (typeof fetchImpl !== 'function') fail('fetchImpl is required');

  const baseUrl = normalizeBaseUrl(apiBaseUrl);
  const token = userAccessToken.trim();

  async function getUsageSummary({ year, month, day } = {}) {
    assertOptionalInteger(year, 'year', 2000, 2100);
    assertOptionalInteger(month, 'month', 1, 12);
    assertOptionalInteger(day, 'day', 1, 31);

    const path = buildQuery(
      `/users/${username}/settings/billing/usage/summary`,
      [['year', year], ['month', month], ['day', day]],
    );

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

    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        fail('GitHub API returned non-JSON content');
      }
    }

    if (!response.ok) {
      const error = new Error(`[GITHUB-USER-BILLING-READ] GitHub API request failed with HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return normalizeUsageSummary(payload);
  }

  return Object.freeze({
    describeBoundary() {
      return Object.freeze({
        username,
        requiredPermission: GITHUB_USER_BILLING_REQUIRED_PERMISSION,
        acceptedCredential: 'github_app_user_access_token_or_fine_grained_pat',
        publicMethods: Object.freeze(['GET']),
        publicPath: `/users/${username}/settings/billing/usage/summary`,
        tokenPersistence: false,
      });
    },
    getUsageSummary,
  });
}
