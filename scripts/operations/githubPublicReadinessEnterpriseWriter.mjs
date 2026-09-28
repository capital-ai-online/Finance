const DEFAULT_API_BASE_URL = 'https://api.github.com';
const API_VERSION = '2026-03-10';
const REQUEST_TIMEOUT_MS = 15_000;

export const PUBLIC_READINESS_ENTERPRISE_RULESET = Object.freeze({
  name: 'capital-ai-finance-main-governance',
  target: 'branch',
  enforcement: 'active',
  organization: 'capital-ai-online',
  repository: 'Finance',
});

function fail(message) {
  throw new Error(`[GITHUB-PUBLIC-READINESS-ENTERPRISE-WRITER] ${message}`);
}

function assertSlug(value, name) {
  if (
    typeof value !== 'string'
    || !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(value)
  ) {
    fail(`${name} must be a valid GitHub slug`);
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

function safeProviderError(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const message = typeof payload.message === 'string' ? payload.message.slice(0, 400) : '';
  const documentationUrl =
    typeof payload.documentation_url === 'string' ? payload.documentation_url.slice(0, 400) : '';
  const errors = Array.isArray(payload.errors)
    ? payload.errors.slice(0, 8).map((entry) => {
        if (typeof entry === 'string') return entry.slice(0, 300);
        if (!entry || typeof entry !== 'object') return String(entry).slice(0, 300);
        return {
          resource: String(entry.resource || '').slice(0, 120),
          field: String(entry.field || '').slice(0, 120),
          code: String(entry.code || '').slice(0, 120),
          message: String(entry.message || '').slice(0, 300),
        };
      })
    : [];
  return JSON.stringify({ message, documentationUrl, errors });
}

function normalizeSet(value) {
  return {
    include: Array.isArray(value?.include) ? [...value.include].map(String).sort() : [],
    exclude: Array.isArray(value?.exclude) ? [...value.exclude].map(String).sort() : [],
  };
}

function pullRequestParameters() {
  return {
    required_approving_review_count: 1,
    dismiss_stale_reviews_on_push: true,
    require_code_owner_review: true,
    require_last_push_approval: false,
    required_review_thread_resolution: true,
    require_extra_approval_for_unattributed_changes: false,
    required_reviewers: [],
    dismissal_restriction: {
      enabled: false,
      allowed_actors: [],
    },
    allowed_merge_methods: ['merge'],
  };
}

function desiredBody({ organization, repository }) {
  return {
    name: PUBLIC_READINESS_ENTERPRISE_RULESET.name,
    target: 'branch',
    enforcement: 'active',
    bypass_actors: [],
    conditions: {
      organization_name: { include: [organization], exclude: [] },
      repository_name: { include: [repository], exclude: [] },
      ref_name: { include: ['~DEFAULT_BRANCH'], exclude: [] },
    },
    rules: [
      { type: 'deletion' },
      { type: 'non_fast_forward' },
      { type: 'pull_request', parameters: pullRequestParameters() },
      { type: 'license_compliance_scanning' },
    ],
  };
}

function projectRuleset(raw) {
  if (!raw || typeof raw !== 'object') fail('provider ruleset response must be an object');
  const pull = Array.isArray(raw.rules)
    ? raw.rules.find((rule) => rule?.type === 'pull_request')?.parameters || {}
    : {};

  return Object.freeze({
    id: Number(raw.id),
    name: String(raw.name || ''),
    target: String(raw.target || ''),
    enforcement: String(raw.enforcement || ''),
    sourceType: String(raw.source_type || ''),
    bypassActors: Array.isArray(raw.bypass_actors) ? raw.bypass_actors : [],
    organizationName: normalizeSet(raw.conditions?.organization_name),
    repositoryName: normalizeSet(raw.conditions?.repository_name),
    refName: normalizeSet(raw.conditions?.ref_name),
    ruleTypes: Array.isArray(raw.rules)
      ? raw.rules.map((rule) => String(rule?.type || '')).filter(Boolean).sort()
      : [],
    pullRequest: {
      requiredApprovingReviewCount: Number(pull.required_approving_review_count),
      dismissStaleReviewsOnPush: pull.dismiss_stale_reviews_on_push === true,
      requireCodeOwnerReview: pull.require_code_owner_review === true,
      requireLastPushApproval: pull.require_last_push_approval === true,
      requiredReviewThreadResolution: pull.required_review_thread_resolution === true,
      requireExtraApprovalForUnattributedChanges:
        pull.require_extra_approval_for_unattributed_changes === true,
      requiredReviewers: Array.isArray(pull.required_reviewers) ? pull.required_reviewers : [],
      dismissalRestrictionEnabled: pull.dismissal_restriction?.enabled === true,
      allowedMergeMethods: Array.isArray(pull.allowed_merge_methods)
        ? [...pull.allowed_merge_methods].sort()
        : [],
    },
  });
}

function matchesDesired(projected, { organization, repository }) {
  const pull = projected.pullRequest;
  return projected.name === PUBLIC_READINESS_ENTERPRISE_RULESET.name
    && projected.target === 'branch'
    && projected.enforcement === 'active'
    && projected.sourceType === 'Enterprise'
    && projected.bypassActors.length === 0
    && JSON.stringify(projected.organizationName.include) === JSON.stringify([organization])
    && projected.organizationName.exclude.length === 0
    && JSON.stringify(projected.repositoryName.include) === JSON.stringify([repository])
    && projected.repositoryName.exclude.length === 0
    && JSON.stringify(projected.refName.include) === JSON.stringify(['~DEFAULT_BRANCH'])
    && projected.refName.exclude.length === 0
    && JSON.stringify(projected.ruleTypes)
      === JSON.stringify(['deletion', 'license_compliance_scanning', 'non_fast_forward', 'pull_request'])
    && pull.requiredApprovingReviewCount === 1
    && pull.dismissStaleReviewsOnPush
    && pull.requireCodeOwnerReview
    && !pull.requireLastPushApproval
    && pull.requiredReviewThreadResolution
    && !pull.requireExtraApprovalForUnattributedChanges
    && pull.requiredReviewers.length === 0
    && !pull.dismissalRestrictionEnabled
    && JSON.stringify(pull.allowedMergeMethods) === JSON.stringify(['merge']);
}

export function createGitHubPublicReadinessEnterpriseWriter({
  enterprise = 'capital-ai-online',
  organization = 'capital-ai-online',
  repository = 'Finance',
  enterpriseInstallationToken = '',
  fetchImpl = globalThis.fetch,
  apiBaseUrl = DEFAULT_API_BASE_URL,
} = {}) {
  assertSlug(enterprise, 'enterprise');
  assertSlug(organization, 'organization');
  assertSlug(repository, 'repository');
  if (typeof fetchImpl !== 'function') fail('fetchImpl is required');

  const token =
    typeof enterpriseInstallationToken === 'string' ? enterpriseInstallationToken.trim() : '';
  if (token.length < 20) fail('enterpriseInstallationToken is required');
  const baseUrl = normalizeBaseUrl(apiBaseUrl);

  async function request(method, path, body) {
    let response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': API_VERSION,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      fail(`GitHub API network request failed: ${error?.name || 'unknown error'}`);
    }

    const payload = await parseJson(response);
    if (!response.ok) {
      const detail = safeProviderError(payload);
      fail(
        `GitHub API ${method} request failed with HTTP ${response.status} via ENTERPRISE_APP_INSTALLATION${detail ? `: ${detail}` : ''}`,
      );
    }
    return payload;
  }

  async function findTargetRuleset() {
    const raw = await request('GET', `/enterprises/${enterprise}/rulesets`);
    if (!Array.isArray(raw)) fail('enterprise ruleset list must be an array');
    const matches = raw.filter(
      (entry) =>
        entry?.name === PUBLIC_READINESS_ENTERPRISE_RULESET.name
        && entry?.target === 'branch',
    );
    if (matches.length !== 1) {
      fail(
        `expected exactly one ${PUBLIC_READINESS_ENTERPRISE_RULESET.name} branch ruleset, observed ${matches.length}`,
      );
    }
    const id = Number(matches[0]?.id);
    if (!Number.isInteger(id) || id < 1) fail('target ruleset id is invalid');
    return id;
  }

  const readRuleset = async (id) =>
    projectRuleset(await request('GET', `/enterprises/${enterprise}/rulesets/${id}`));

  return Object.freeze({
    describeBoundary() {
      return Object.freeze({
        enterprise,
        organization,
        repository,
        rulesetName: PUBLIC_READINESS_ENTERPRISE_RULESET.name,
        publicMethods: ['GET', 'PUT'],
        authSource: 'ENTERPRISE_APP_INSTALLATION',
        classicPatFallback: false,
        rawProxy: false,
        tokenPersistence: false,
        repositoryVisibilityMutation: false,
      });
    },

    async ensure() {
      const id = await findTargetRuleset();
      const before = await readRuleset(id);
      if (
        before.sourceType !== 'Enterprise'
        || before.name !== PUBLIC_READINESS_ENTERPRISE_RULESET.name
        || before.target !== 'branch'
      ) {
        fail('precondition failed: target is not the expected Enterprise branch ruleset');
      }
      if (before.bypassActors.length !== 0) {
        fail('precondition failed: target Enterprise branch ruleset contains bypass actors');
      }

      if (matchesDesired(before, { organization, repository })) {
        return Object.freeze({
          status: 'NOOP_ALREADY_HARDENED',
          mutationPerformed: false,
          authSource: 'ENTERPRISE_APP_INSTALLATION',
          before,
          after: before,
        });
      }

      await request(
        'PUT',
        `/enterprises/${enterprise}/rulesets/${id}`,
        desiredBody({ organization, repository }),
      );
      const after = await readRuleset(id);
      if (!matchesDesired(after, { organization, repository })) {
        fail('post-write readback does not match the fixed public-readiness desired state');
      }
      return Object.freeze({
        status: 'UPDATED_AND_VERIFIED',
        mutationPerformed: true,
        authSource: 'ENTERPRISE_APP_INSTALLATION',
        before,
        after,
      });
    },
  });
}
