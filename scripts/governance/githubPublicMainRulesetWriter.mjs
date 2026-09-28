const DEFAULT_API_BASE_URL = 'https://api.github.com';
const API_VERSION = '2026-03-10';
const REQUEST_TIMEOUT_MS = 15_000;

export const PUBLIC_MAIN_RULESET = Object.freeze({
  owner: 'capital-ai-online',
  repository: 'Finance',
  name: 'main-production-protection',
  requiredChecks: Object.freeze([
    'GitGuardian Security Checks',
    'Hardened image / HIGH+CRITICAL CVE gate',
    'PR Governance (Kosten / Workflow / Vorlage)',
    'build-and-test',
  ]),
});

const ALLOWED_RULE_TYPES = new Set([
  'deletion',
  'non_fast_forward',
  'pull_request',
  'code_quality',
  'required_status_checks',
  'license_compliance_scanning',
]);

function fail(message) {
  throw new Error(`[GITHUB-PUBLIC-MAIN-RULESET-WRITER] ${message}`);
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
  return JSON.stringify({
    message: typeof payload.message === 'string' ? payload.message.slice(0, 400) : '',
    documentationUrl:
      typeof payload.documentation_url === 'string' ? payload.documentation_url.slice(0, 400) : '',
    errors: Array.isArray(payload.errors)
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
      : [],
  });
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

function normalizeRequiredChecks(rule) {
  const checks = Array.isArray(rule?.parameters?.required_status_checks)
    ? rule.parameters.required_status_checks
    : [];
  return checks
    .map((entry) => ({
      context: String(entry?.context || ''),
      ...(Number.isInteger(entry?.integration_id) ? { integration_id: entry.integration_id } : {}),
    }))
    .filter((entry) => entry.context)
    .sort((a, b) => a.context.localeCompare(b.context));
}

function assertExpectedChecks(rule) {
  const checks = normalizeRequiredChecks(rule);
  const names = checks.map((entry) => entry.context).sort();
  const expected = [...PUBLIC_MAIN_RULESET.requiredChecks].sort();
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    fail(`required status checks differ from canonical public-main set: ${JSON.stringify(names)}`);
  }
  return checks;
}

function projectRuleset(raw) {
  if (!raw || typeof raw !== 'object') fail('provider ruleset response must be an object');
  const rules = Array.isArray(raw.rules) ? raw.rules : [];
  const pull = rules.find((rule) => rule?.type === 'pull_request')?.parameters || {};
  const statusRule = rules.find((rule) => rule?.type === 'required_status_checks');
  const qualityRule = rules.find((rule) => rule?.type === 'code_quality');

  return Object.freeze({
    id: Number(raw.id),
    name: String(raw.name || ''),
    target: String(raw.target || ''),
    enforcement: String(raw.enforcement || ''),
    sourceType: String(raw.source_type || ''),
    source: String(raw.source || ''),
    bypassActors: Array.isArray(raw.bypass_actors) ? raw.bypass_actors : [],
    refInclude: Array.isArray(raw.conditions?.ref_name?.include)
      ? [...raw.conditions.ref_name.include].map(String).sort()
      : [],
    refExclude: Array.isArray(raw.conditions?.ref_name?.exclude)
      ? [...raw.conditions.ref_name.exclude].map(String).sort()
      : [],
    ruleTypes: rules.map((rule) => String(rule?.type || '')).filter(Boolean).sort(),
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
    statusChecks: normalizeRequiredChecks(statusRule),
    strictRequiredStatusChecksPolicy:
      statusRule?.parameters?.strict_required_status_checks_policy === true,
    doNotEnforceOnCreate: statusRule?.parameters?.do_not_enforce_on_create === true,
    codeQualitySeverity: String(qualityRule?.parameters?.severity || ''),
    rawRules: rules,
  });
}

function desiredBody(before) {
  for (const type of before.ruleTypes) {
    if (!ALLOWED_RULE_TYPES.has(type)) {
      fail(`unexpected existing rule type blocks bounded update: ${type}`);
    }
  }

  const statusRule = before.rawRules.find((rule) => rule?.type === 'required_status_checks');
  const requiredChecks = assertExpectedChecks(statusRule);
  if (before.codeQualitySeverity !== 'warnings') {
    fail('expected code_quality severity=warnings before bounded update');
  }

  return {
    name: PUBLIC_MAIN_RULESET.name,
    target: 'branch',
    enforcement: 'active',
    bypass_actors: [],
    conditions: {
      ref_name: {
        include: ['~DEFAULT_BRANCH', 'refs/heads/main'],
        exclude: [],
      },
    },
    rules: [
      { type: 'deletion' },
      { type: 'non_fast_forward' },
      { type: 'pull_request', parameters: pullRequestParameters() },
      { type: 'code_quality', parameters: { severity: 'warnings' } },
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: true,
          do_not_enforce_on_create: false,
          required_status_checks: requiredChecks,
        },
      },
      { type: 'license_compliance_scanning' },
    ],
  };
}

function matchesDesired(projected) {
  const expectedTypes = [
    'code_quality',
    'deletion',
    'license_compliance_scanning',
    'non_fast_forward',
    'pull_request',
    'required_status_checks',
  ];
  const expectedRefs = ['refs/heads/main', '~DEFAULT_BRANCH'].sort();
  const expectedChecks = [...PUBLIC_MAIN_RULESET.requiredChecks].sort();
  const pull = projected.pullRequest;

  return projected.name === PUBLIC_MAIN_RULESET.name
    && projected.target === 'branch'
    && projected.enforcement === 'active'
    && projected.sourceType === 'Repository'
    && projected.source === `${PUBLIC_MAIN_RULESET.owner}/${PUBLIC_MAIN_RULESET.repository}`
    && projected.bypassActors.length === 0
    && JSON.stringify(projected.refInclude) === JSON.stringify(expectedRefs)
    && projected.refExclude.length === 0
    && JSON.stringify(projected.ruleTypes) === JSON.stringify(expectedTypes)
    && pull.requiredApprovingReviewCount === 1
    && pull.dismissStaleReviewsOnPush
    && pull.requireCodeOwnerReview
    && !pull.requireLastPushApproval
    && pull.requiredReviewThreadResolution
    && !pull.requireExtraApprovalForUnattributedChanges
    && pull.requiredReviewers.length === 0
    && !pull.dismissalRestrictionEnabled
    && JSON.stringify(pull.allowedMergeMethods) === JSON.stringify(['merge'])
    && projected.strictRequiredStatusChecksPolicy
    && !projected.doNotEnforceOnCreate
    && JSON.stringify(projected.statusChecks.map((entry) => entry.context).sort())
      === JSON.stringify(expectedChecks)
    && projected.codeQualitySeverity === 'warnings';
}

export function createGitHubPublicMainRulesetWriter({
  repositoryAdminToken = '',
  fetchImpl = globalThis.fetch,
  apiBaseUrl = DEFAULT_API_BASE_URL,
} = {}) {
  if (typeof fetchImpl !== 'function') fail('fetchImpl is required');
  const token = typeof repositoryAdminToken === 'string' ? repositoryAdminToken.trim() : '';
  if (token.length < 20) fail('repositoryAdminToken is required');
  const baseUrl = normalizeBaseUrl(apiBaseUrl);
  const repositoryPath =
    `/repos/${PUBLIC_MAIN_RULESET.owner}/${PUBLIC_MAIN_RULESET.repository}`;

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
      fail(`GitHub API ${method} request failed with HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
    }
    return payload;
  }

  async function findRulesetId() {
    const raw = await request('GET', `${repositoryPath}/rulesets?includes_parents=false`);
    if (!Array.isArray(raw)) fail('repository ruleset list must be an array');
    const matches = raw.filter(
      (entry) => entry?.name === PUBLIC_MAIN_RULESET.name && entry?.target === 'branch',
    );
    if (matches.length !== 1) {
      fail(`expected exactly one repository-owned ${PUBLIC_MAIN_RULESET.name}; observed ${matches.length}`);
    }
    const id = Number(matches[0]?.id);
    if (!Number.isInteger(id) || id < 1) fail('target repository ruleset id is invalid');
    return id;
  }

  const read = async (id) =>
    projectRuleset(await request('GET', `${repositoryPath}/rulesets/${id}`));

  return Object.freeze({
    describeBoundary() {
      return Object.freeze({
        repository: `${PUBLIC_MAIN_RULESET.owner}/${PUBLIC_MAIN_RULESET.repository}`,
        rulesetName: PUBLIC_MAIN_RULESET.name,
        publicMethods: ['GET', 'PUT'],
        requiredPermission: 'Administration: write',
        visibilityMutation: false,
        mergeMutation: false,
      });
    },

    async ensure() {
      const id = await findRulesetId();
      const before = await read(id);
      if (
        before.sourceType !== 'Repository'
        || before.source !== `${PUBLIC_MAIN_RULESET.owner}/${PUBLIC_MAIN_RULESET.repository}`
        || before.name !== PUBLIC_MAIN_RULESET.name
        || before.target !== 'branch'
      ) {
        fail('precondition failed: target is not the expected repository-owned branch ruleset');
      }
      if (before.bypassActors.length !== 0) {
        fail('precondition failed: main-production-protection contains bypass actors');
      }
      if (matchesDesired(before)) {
        return Object.freeze({
          status: 'NOOP_ALREADY_HARDENED',
          mutationPerformed: false,
          before,
          after: before,
        });
      }

      await request('PUT', `${repositoryPath}/rulesets/${id}`, desiredBody(before));
      const after = await read(id);
      if (!matchesDesired(after)) {
        fail('post-write readback does not match the fixed public-main desired state');
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
