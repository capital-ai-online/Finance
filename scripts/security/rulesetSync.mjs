const OWNER = 'SvenKulessa';
const REPO = 'Finance';
const RULESET_NAME = 'main-production-protection';
const mode = process.argv[2] || 'plan';
const token = process.env.GH_TOKEN;
const repositoryPath = `/repos/${OWNER}/${REPO}`;

if (mode !== 'plan') {
  console.error('Usage: rulesetSync.mjs plan');
  console.error('Ruleset apply modes were retired by Owner decision on 2026-08-30.');
  process.exit(1);
}
if (!token) {
  console.error('GH_TOKEN is required for provider readback');
  process.exit(1);
}

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2026-03-10',
    },
    signal: AbortSignal.timeout(15_000),
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

  if (!res.ok) {
    const detail = typeof data === 'object' && data?.message ? data.message : String(data || '');
    throw new Error(`GET ${path} -> ${res.status} ${detail}`);
  }
  return data;
}

function summarizePullRequestRule(rule) {
  const parameters = rule?.parameters ?? {};
  return {
    required_approving_review_count: Number(parameters.required_approving_review_count ?? 0),
    require_code_owner_review: parameters.require_code_owner_review === true,
    required_review_thread_resolution: parameters.required_review_thread_resolution === true,
    require_extra_approval_for_unattributed_changes:
      parameters.require_extra_approval_for_unattributed_changes === true,
    allowed_merge_methods: parameters.allowed_merge_methods ?? [],
  };
}

function summarizeStatusChecks(rule) {
  const parameters = rule?.parameters ?? {};
  return {
    strict_required_status_checks_policy: parameters.strict_required_status_checks_policy === true,
    required_status_checks: (parameters.required_status_checks ?? []).map((check) => ({
      context: String(check.context || ''),
      integration_id: Number(check.integration_id || 0),
    })),
  };
}

const rulesets = await gh(`${repositoryPath}/rulesets`);
const selected = Array.isArray(rulesets)
  ? rulesets.find((ruleset) => ruleset?.name === RULESET_NAME)
  : null;

if (!selected?.id) {
  throw new Error(`Live ruleset not found: ${RULESET_NAME}`);
}

const live = await gh(`${repositoryPath}/rulesets/${selected.id}`);
const repository = await gh(repositoryPath);
const pullRequestRule = (live.rules ?? []).find((rule) => rule.type === 'pull_request');
const statusChecksRule = (live.rules ?? []).find((rule) => rule.type === 'required_status_checks');

const snapshot = {
  authority: 'live-provider-state',
  owner_decision: '2026-08-30: repository-owned canonical desired ruleset retired; current live rules remain in force',
  repository: `${OWNER}/${REPO}`,
  default_branch: repository.default_branch,
  ruleset: {
    id: live.id,
    name: live.name,
    enforcement: live.enforcement,
    target: live.target,
    conditions: live.conditions,
    bypass_actors: live.bypass_actors ?? [],
    rule_types: (live.rules ?? []).map((rule) => rule.type),
    pull_request: summarizePullRequestRule(pullRequestRule),
    required_status_checks: summarizeStatusChecks(statusChecksRule),
  },
  repository_merge_settings: {
    allow_merge_commit: repository.allow_merge_commit === true,
    allow_squash_merge: repository.allow_squash_merge === true,
    allow_rebase_merge: repository.allow_rebase_merge === true,
    allow_auto_merge: repository.allow_auto_merge === true,
    delete_branch_on_merge: repository.delete_branch_on_merge === true,
    web_commit_signoff_required: repository.web_commit_signoff_required === true,
  },
};

console.log('# Ruleset Provider Readback');
console.log('');
console.log('- Mode: `plan` / read-only');
console.log('- Repository-owned canonical desired ruleset: **retired**');
console.log('- Provider authority: current live GitHub configuration');
console.log('- No provider mutation is implemented by this script.');
console.log('');
console.log('```json');
console.log(JSON.stringify(snapshot, null, 2));
console.log('```');
