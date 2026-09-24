import {
  DEFAULT_GITHUB_API_BASE_URL,
  GITHUB_API_VERSION,
} from './githubAppInstallationAuthTransport.mjs';

const REQUEST_TIMEOUT_MS = 15_000;
export const ENTERPRISE_WORKFLOW_PERMISSIONS_TARGET = Object.freeze({
  defaultWorkflowPermissions: 'read',
  canApprovePullRequestReviews: false,
});

function fail(message) {
  throw new Error(`[GITHUB-ENTERPRISE-WORKFLOW-PERMISSIONS-WRITER] ${message}`);
}

function assertSlug(value) {
  if (
    typeof value !== 'string'
    || value.length < 1
    || value.length > 100
    || !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(value)
  ) {
    fail('enterprise must be a valid GitHub slug');
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

function normalizeWorkflowPermissions(raw) {
  if (!raw || typeof raw !== 'object') fail('provider workflow-permissions response must be an object');
  const defaultWorkflowPermissions = raw.default_workflow_permissions;
  if (defaultWorkflowPermissions !== 'read' && defaultWorkflowPermissions !== 'write') {
    fail('provider returned an invalid default_workflow_permissions value');
  }
  if (typeof raw.can_approve_pull_request_reviews !== 'boolean') {
    fail('provider returned an invalid can_approve_pull_request_reviews value');
  }
  return Object.freeze({
    defaultWorkflowPermissions,
    canApprovePullRequestReviews: raw.can_approve_pull_request_reviews,
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
 * Fixed-purpose provider writer:
 * GET current Enterprise workflow permissions
 * -> optional one exact PUT
 * -> GET readback.
 *
 * No arbitrary endpoint, method or body is exposed.
 *
 * @param {{
 *   enterprise?: string;
 *   enterpriseAdminPat?: string;
 *   fetchImpl?: typeof fetch;
 *   apiBaseUrl?: string;
 * }} [options]
 */
export function createGitHubEnterpriseWorkflowPermissionsWriter({
  enterprise,
  enterpriseAdminPat,
  fetchImpl = globalThis.fetch,
  apiBaseUrl = DEFAULT_GITHUB_API_BASE_URL,
} = {}) {
  assertSlug(enterprise);
  if (typeof enterpriseAdminPat !== 'string' || enterpriseAdminPat.trim().length < 20) {
    fail('enterpriseAdminPat is required');
  }
  if (typeof fetchImpl !== 'function') fail('fetchImpl is required');

  const token = enterpriseAdminPat.trim();
  const baseUrl = normalizeBaseUrl(apiBaseUrl);
  const path = `/enterprises/${enterprise}/actions/permissions/workflow`;

  async function request(method, body = undefined) {
    let response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      fail(`GitHub API network request failed: ${error?.name || 'unknown error'}`);
    }

    const payload = await parseJson(response);
    if (!response.ok) {
      fail(`GitHub API ${method} request failed with HTTP ${response.status}`);
    }
    return payload;
  }

  async function readCurrent() {
    return normalizeWorkflowPermissions(await request('GET'));
  }

  return Object.freeze({
    describeBoundary() {
      return Object.freeze({
        enterprise,
        endpoint: path,
        publicMethods: Object.freeze(['GET', 'PUT']),
        rawProxy: false,
        desiredState: ENTERPRISE_WORKFLOW_PERMISSIONS_TARGET,
        tokenPersistence: false,
      });
    },

    async ensure() {
      const before = await readCurrent();

      if (before.defaultWorkflowPermissions !== 'read') {
        fail('precondition failed: default_workflow_permissions must already be read; no mutation performed');
      }

      if (before.canApprovePullRequestReviews === false) {
        return Object.freeze({
          status: 'NOOP_ALREADY_HARDENED',
          mutationPerformed: false,
          before,
          after: before,
        });
      }

      await request('PUT', {
        default_workflow_permissions: 'read',
        can_approve_pull_request_reviews: false,
      });

      const after = await readCurrent();
      if (
        after.defaultWorkflowPermissions !== ENTERPRISE_WORKFLOW_PERMISSIONS_TARGET.defaultWorkflowPermissions
        || after.canApprovePullRequestReviews !== ENTERPRISE_WORKFLOW_PERMISSIONS_TARGET.canApprovePullRequestReviews
      ) {
        fail('post-write readback does not match the fixed desired state');
      }

      return Object.freeze({
        status: 'UPDATED_AND_VERIFIED',
        mutationPerformed: true,
        before,
        after,
      });
    },
  });
}
