const OWNER = 'SvenKulessa';
const REPO = 'Finance';
const ENVIRONMENT = 'ruleset-admin';
const mode = process.argv[2]; // plan | apply
const token = process.env.GH_TOKEN;
const repositoryPath = `/repos/${OWNER}/${REPO}`;
const environmentPath = `${repositoryPath}/environments/${encodeURIComponent(ENVIRONMENT)}`;
const policiesPath = `${environmentPath}/deployment-branch-policies`;

if (!['plan', 'apply'].includes(mode)) {
  console.error('Usage: rulesetAdminEnvironment.mjs <plan|apply>');
  process.exit(1);
}
if (!token) {
  console.error('GH_TOKEN is required');
  process.exit(1);
}
if (mode === 'apply' && process.env.GITHUB_REF !== 'refs/heads/main') {
  console.error(`REF DENY: ruleset-admin environment apply is allowed only on refs/heads/main, got ${process.env.GITHUB_REF || 'missing'}`);
  process.exit(1);
}

function responseDetail(response) {
  return typeof response.data === 'object' && response.data?.message
    ? response.data.message
    : String(response.data || '');
}

async function ghResponse(path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2026-03-10',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    signal: init.signal || AbortSignal.timeout(15_000),
    redirect: 'manual',
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { ok: res.ok, status: res.status, data };
}

async function gh(path, init = {}) {
  const response = await ghResponse(path, init);
  if (!response.ok) {
    throw new Error(`${init.method || 'GET'} ${path} -> ${response.status} ${responseDetail(response)}`);
  }
  return response.data;
}

function preservedEnvironmentBody(environment) {
  const waitRule = (environment.protection_rules || []).find((rule) => rule.type === 'wait_timer');
  const reviewerRule = (environment.protection_rules || []).find((rule) => rule.type === 'required_reviewers');
  const reviewers = reviewerRule
    ? (reviewerRule.reviewers || []).map((entry) => ({
        type: entry.type,
        id: Number(entry.reviewer?.id),
      })).filter((entry) => ['User', 'Team'].includes(entry.type) && Number.isInteger(entry.id) && entry.id > 0)
    : null;

  return {
    wait_timer: Number(waitRule?.wait_timer || 0),
    prevent_self_review: reviewerRule?.prevent_self_review === true,
    reviewers,
    deployment_branch_policy: {
      protected_branches: false,
      custom_branch_policies: true,
    },
  };
}

async function readState() {
  const environment = await gh(environmentPath);
  let policies = [];
  if (environment.deployment_branch_policy?.custom_branch_policies === true) {
    const result = await gh(`${policiesPath}?per_page=100`);
    policies = Array.isArray(result.branch_policies) ? result.branch_policies : [];
  }
  return {
    environment,
    normalized: {
      deployment_branch_policy: {
        protected_branches: environment.deployment_branch_policy?.protected_branches === true,
        custom_branch_policies: environment.deployment_branch_policy?.custom_branch_policies === true,
      },
      policy_names: policies.map((policy) => String(policy.name || '')).sort(),
    },
    policies,
  };
}

const desired = {
  deployment_branch_policy: {
    protected_branches: false,
    custom_branch_policies: true,
  },
  policy_names: ['main'],
};

const before = await readState();
console.log('### ruleset-admin Environment');
console.log('```json');
console.log(JSON.stringify({ current: before.normalized, desired }, null, 2));
console.log('```');
const changed = JSON.stringify(before.normalized) !== JSON.stringify(desired);
console.log(`ruleset_admin_environment_changed=${changed}`);

if (mode === 'plan') {
  console.log('Environment plan-only: keine GitHub-Einstellung wurde veraendert.');
  process.exit(0);
}

// Preserve any supported wait-timer/reviewer settings while switching only the deployment branch
// policy to a custom allowlist. On private Pro/Team repositories reviewers may be unavailable;
// null keeps that state rather than inventing an unsupported reviewer gate.
if (before.environment.deployment_branch_policy?.custom_branch_policies !== true
  || before.environment.deployment_branch_policy?.protected_branches === true) {
  await gh(environmentPath, {
    method: 'PUT',
    body: JSON.stringify(preservedEnvironmentBody(before.environment)),
  });
}

// Recreate the policy even when a same-named entry existed. The list response does not reliably
// expose whether a policy is a branch or tag; recreating it with type=branch proves the intended
// main-only branch boundary. A failure after deletion is fail-closed: no branch can consume the
// environment until the policy is repaired.
const afterModeSwitch = await readState();
for (const policy of afterModeSwitch.policies) {
  const id = Number(policy.id);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Deployment branch policy has no valid id');
  await gh(`${policiesPath}/${id}`, { method: 'DELETE' });
}
await gh(policiesPath, {
  method: 'POST',
  body: JSON.stringify({ name: 'main', type: 'branch' }),
});

const after = await readState();
if (JSON.stringify(after.normalized) !== JSON.stringify(desired)) {
  throw new Error(`ruleset-admin Environment Post-Apply-Verifikation fehlgeschlagen:\n${JSON.stringify({ after: after.normalized, desired }, null, 2)}`);
}
console.log('ruleset-admin Environment ist fail-closed auf den Branch main beschraenkt und post-write verifiziert.');
