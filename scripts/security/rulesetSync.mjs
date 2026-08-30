import fs from 'node:fs';

const OWNER = 'SvenKulessa';
const REPO = 'Finance';
const EXPECTED_PATH = '.github/policies/main-production-protection.expected.json';
const mode = process.argv[2]; // plan | apply-package-a | apply
const token = process.env.GH_TOKEN;
const repositoryPath = `/repos/${OWNER}/${REPO}`;
const APPLY_MODES = new Set(['apply-package-a', 'apply']);
const PRESERVED_LIVE_RULE_TYPES = new Set(['code_quality']);

// Required contexts are issuer-bound so a different integration cannot spoof a required status by name.
const CHECK_INTEGRATION_IDS = new Map([
  ['build-and-test', 15368],
  ['PR Governance (Kosten / Workflow / Vorlage)', 15368],
  ['Hardened image / HIGH+CRITICAL CVE gate', 15368],
  ['GitGuardian Security Checks', 46505],
]);

if (!['plan', 'apply-package-a', 'apply'].includes(mode)) {
  console.error('Usage: rulesetSync.mjs <plan|apply-package-a|apply>');
  process.exit(1);
}
if (!token) {
  console.error('GH_TOKEN is required');
  process.exit(1);
}
if (APPLY_MODES.has(mode) && process.env.GITHUB_REF !== 'refs/heads/main') {
  console.error(`REF DENY: ruleset/repository apply is allowed only on refs/heads/main, got ${process.env.GITHUB_REF || 'missing'}`);
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

async function optionalGh(path, unsupportedStatuses) {
  const response = await ghResponse(path);
  if (response.ok) return { supported: true, status: response.status, data: response.data };
  if (unsupportedStatuses.has(response.status)) {
    return { supported: false, status: response.status, data: null };
  }
  throw new Error(`GET ${path} -> ${response.status} ${responseDetail(response)}`);
}

async function featureEnabled(path) {
  const response = await ghResponse(path);
  if (response.status === 200 || response.status === 204) return true;
  if (response.status === 404) return false;
  throw new Error(`GET ${path} -> ${response.status} ${responseDetail(response)}`);
}

function statusCheck(context) {
  const integrationId = CHECK_INTEGRATION_IDS.get(context);
  if (!integrationId) throw new Error(`No trusted integration_id is registered for required check: ${context}`);
  return { context, integration_id: integrationId };
}

function buildDesiredRuleset(expected) {
  const req = expected.required;
  return {
    name: expected.ruleset_name,
    target: 'branch',
    enforcement: 'active',
    conditions: { ref_name: { exclude: [], include: ['~DEFAULT_BRANCH'] } },
    bypass_actors: req.bypass_actors ?? [],
    rules: [
      ...(req.non_fast_forward_protection ? [{ type: 'non_fast_forward' }] : []),
      ...(req.deletion_protection ? [{ type: 'deletion' }] : []),
      ...(req.required_linear_history ? [{ type: 'required_linear_history' }] : []),
      {
        type: 'pull_request',
        parameters: {
          required_approving_review_count: expected.single_owner_topology?.required_approving_review_count ?? 0,
          dismiss_stale_reviews_on_push: false,
          required_reviewers: [],
          require_code_owner_review: req.require_code_owner_review,
          require_last_push_approval: false,
          required_review_thread_resolution: req.required_review_thread_resolution === true,
          require_extra_approval_for_unattributed_changes: req.require_extra_approval_for_unattributed_changes === true,
          allowed_merge_methods: req.allowed_merge_methods ?? ['squash', 'rebase'],
        },
      },
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: req.strict_required_status_checks_policy,
          do_not_enforce_on_create: false,
          required_status_checks: req.required_status_checks.map(statusCheck),
        },
      },
    ],
  };
}

// Package C has not decided whether Code Quality should become policy-owned. Preserve the current
// live rule byte-for-structure instead of silently deleting it during the Package-A reconciliation.
function preserveApprovedLiveRules(desired, current) {
  if (!current?.rules) return desired;
  const desiredTypes = new Set(desired.rules.map((rule) => rule.type));
  const preserved = current.rules.filter(
    (rule) => PRESERVED_LIVE_RULE_TYPES.has(rule.type) && !desiredTypes.has(rule.type),
  );
  return { ...desired, rules: [...desired.rules, ...preserved] };
}

function normalizedRule(rule) {
  if (['non_fast_forward', 'deletion', 'required_linear_history'].includes(rule.type)) return { type: rule.type };
  if (rule.type === 'pull_request') {
    const p = rule.parameters ?? {};
    return {
      type: rule.type,
      parameters: {
        required_approving_review_count: Number(p.required_approving_review_count ?? 0),
        dismiss_stale_reviews_on_push: p.dismiss_stale_reviews_on_push === true,
        required_reviewers: Array.isArray(p.required_reviewers) ? p.required_reviewers : [],
        require_code_owner_review: p.require_code_owner_review === true,
        require_last_push_approval: p.require_last_push_approval === true,
        required_review_thread_resolution: p.required_review_thread_resolution === true,
        require_extra_approval_for_unattributed_changes: p.require_extra_approval_for_unattributed_changes === true,
        allowed_merge_methods: [...(p.allowed_merge_methods ?? [])].sort(),
      },
    };
  }
  if (rule.type === 'required_status_checks') {
    const p = rule.parameters ?? {};
    return {
      type: rule.type,
      parameters: {
        strict_required_status_checks_policy: p.strict_required_status_checks_policy === true,
        do_not_enforce_on_create: p.do_not_enforce_on_create === true,
        required_status_checks: (p.required_status_checks ?? [])
          .map((check) => ({
            context: String(check.context || ''),
            integration_id: Number(check.integration_id || 0),
          }))
          .sort((a, b) => a.context.localeCompare(b.context)),
      },
    };
  }
  return { type: rule.type, parameters: rule.parameters ?? null };
}

function normalizedRuleset(value) {
  const ref = value?.conditions?.ref_name ?? {};
  return {
    name: String(value?.name || ''),
    target: String(value?.target || ''),
    enforcement: String(value?.enforcement || ''),
    conditions: {
      ref_name: {
        exclude: [...(ref.exclude ?? [])].sort(),
        include: [...(ref.include ?? [])].sort(),
      },
    },
    bypass_actors: value?.bypass_actors ?? [],
    rules: (value?.rules ?? []).map(normalizedRule).sort((a, b) => a.type.localeCompare(b.type)),
  };
}

function enforceRulesetFloor(desired) {
  const failures = [];
  const normalized = normalizedRuleset(desired);
  const statusRule = normalized.rules.find((rule) => rule.type === 'required_status_checks');
  const prRule = normalized.rules.find((rule) => rule.type === 'pull_request');
  const checks = new Map((statusRule?.parameters.required_status_checks ?? []).map((check) => [check.context, check.integration_id]));

  for (const [context, integrationId] of CHECK_INTEGRATION_IDS) {
    if (checks.get(context) !== integrationId) failures.push(`required check "${context}" muss an integration_id ${integrationId} gebunden sein`);
  }
  if (checks.size !== CHECK_INTEGRATION_IDS.size) failures.push('Required-Check-Menge darf keine unbekannten oder fehlenden Kontexte enthalten');
  if (statusRule?.parameters.strict_required_status_checks_policy !== true) failures.push('strict required status checks muss aktiviert sein');
  if (statusRule?.parameters.do_not_enforce_on_create !== false) failures.push('Required Checks muessen auch bei Ref-Erstellung gelten');
  if (!normalized.rules.some((rule) => rule.type === 'non_fast_forward')) failures.push('non_fast_forward-Schutz fehlt');
  if (!normalized.rules.some((rule) => rule.type === 'required_linear_history')) failures.push('required_linear_history-Schutz fehlt');
  if (prRule?.parameters.allowed_merge_methods.includes('merge')) failures.push('Merge-Commits sind mit required_linear_history unvereinbar');
  if (!prRule?.parameters.allowed_merge_methods.includes('squash') || !prRule?.parameters.allowed_merge_methods.includes('rebase')) failures.push('squash und rebase muessen als lineare Merge-Methoden zugelassen sein');
  if (!prRule) failures.push('pull_request-Pflicht fehlt');
  if (prRule?.parameters.require_code_owner_review !== true) failures.push('CODEOWNER-Review-Pflicht fehlt');
  if (prRule?.parameters.required_review_thread_resolution !== true) failures.push('Review-Thread-Aufloesung muss erforderlich sein');
  if (prRule?.parameters.require_extra_approval_for_unattributed_changes !== true) failures.push('Extra-Approval fuer unattributed changes muss erforderlich sein');
  if ((normalized.bypass_actors ?? []).length > 0) failures.push('bypass_actors muss leer sein');
  if (normalized.enforcement !== 'active') failures.push('Ruleset muss active sein');
  if (normalized.target !== 'branch') failures.push('Ruleset target muss branch sein');
  if (!normalized.conditions.ref_name.include.includes('~DEFAULT_BRANCH')) failures.push('Ruleset muss den Default-Branch erfassen');

  if (failures.length) throw new Error(`RULESET FLOOR VERLETZT:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

function desiredRepositorySecurity(expected, { forkPrApprovalSupported }) {
  const hardening = expected.repository_hardening;
  if (!hardening?.actions) throw new Error('repository_hardening.actions fehlt im Sollzustand');
  const actions = hardening.actions;
  return {
    repository: {
      web_commit_signoff_required: hardening.web_commit_signoff_required === true,
      allow_auto_merge: hardening.allow_auto_merge === true,
      delete_branch_on_merge: hardening.delete_branch_on_merge === true,
    },
    actions_permissions: {
      enabled: actions.enabled === true,
      allowed_actions: String(actions.allowed_actions || ''),
      sha_pinning_required: actions.sha_pinning_required === true,
    },
    workflow_permissions: {
      default_workflow_permissions: String(actions.default_workflow_permissions || ''),
      can_approve_pull_request_reviews: actions.can_approve_pull_request_reviews === true,
    },
    private_repo_access: {
      access_level: String(actions.private_repo_access_level || ''),
    },
    fork_pr_approval: {
      supported: forkPrApprovalSupported === true,
      approval_policy: forkPrApprovalSupported === true ? String(actions.fork_pr_approval_policy || '') : null,
    },
    fork_pr_workflows: {
      run_workflows_from_fork_pull_requests: actions.fork_pr_workflows?.run_workflows_from_fork_pull_requests === true,
      send_write_tokens_to_workflows: actions.fork_pr_workflows?.send_write_tokens_to_workflows === true,
      send_secrets_and_variables: actions.fork_pr_workflows?.send_secrets_and_variables === true,
      require_approval_for_fork_pr_workflows: actions.fork_pr_workflows?.require_approval_for_fork_pr_workflows === true,
    },
    artifact_and_log_retention: {
      days: Number(actions.artifact_and_log_retention_days),
    },
    vulnerability_alerts: hardening.vulnerability_alerts === true,
    dependabot_security_updates: hardening.dependabot_security_updates === true,
  };
}

function enforceRepositoryFloor(desired) {
  const failures = [];
  if (desired.repository.web_commit_signoff_required !== true) failures.push('web commit signoff muss aktiviert sein');
  if (desired.repository.allow_auto_merge !== false) failures.push('auto merge muss deaktiviert sein');
  if (desired.repository.delete_branch_on_merge !== true) failures.push('gemergte Branches muessen automatisch geloescht werden');
  if (desired.actions_permissions.enabled !== true) failures.push('GitHub Actions muss fuer die erforderlichen Security-Gates aktiviert bleiben');
  if (desired.actions_permissions.sha_pinning_required !== true) failures.push('Actions SHA-Pinning muss repositoryweit erzwungen werden');
  if (desired.workflow_permissions.default_workflow_permissions !== 'read') failures.push('Default GITHUB_TOKEN muss read-only sein');
  if (desired.workflow_permissions.can_approve_pull_request_reviews !== false) failures.push('GitHub Actions darf PR-Reviews nicht genehmigen');
  if (desired.private_repo_access.access_level !== 'none') failures.push('externe private Workflows duerfen dieses Repository nicht als Workflow-/Action-Quelle nutzen');
  if (desired.fork_pr_approval.supported && desired.fork_pr_approval.approval_policy !== 'all_external_contributors') {
    failures.push('alle externen Fork-PR-Workflows muessen Approval erfordern');
  }
  if (desired.fork_pr_workflows.send_write_tokens_to_workflows !== false) failures.push('Fork-PR-Workflows duerfen keine Write-Tokens erhalten');
  if (desired.fork_pr_workflows.send_secrets_and_variables !== false) failures.push('Fork-PR-Workflows duerfen keine Secrets/Variablen erhalten');
  if (desired.fork_pr_workflows.require_approval_for_fork_pr_workflows !== true) failures.push('Fork-PR-Workflows muessen Admin-Approval erfordern');
  if (!Number.isInteger(desired.artifact_and_log_retention.days) || desired.artifact_and_log_retention.days < 1 || desired.artifact_and_log_retention.days > 90) {
    failures.push('Artifact-/Log-Retention muss zwischen 1 und 90 Tagen liegen');
  }
  if (desired.vulnerability_alerts !== true) failures.push('Vulnerability Alerts muessen aktiviert sein');
  if (desired.dependabot_security_updates !== true) failures.push('Dependabot Security Updates muessen aktiviert sein');
  if (failures.length) throw new Error(`REPOSITORY FLOOR VERLETZT:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

function enforceRepositoryCore(actual, desired) {
  if (!jsonEqual(actual.repository, desired.repository)) {
    throw new Error(`PACKAGE-A REPOSITORY CORE VERLETZT:\n${JSON.stringify({ actual: actual.repository, desired: desired.repository }, null, 2)}`);
  }
}

async function readRepositorySecurity() {
  // Read the repository first so 422 is tolerated only for the known contributor-approval endpoint
  // on a private repository. Auth failures and server failures remain fail-closed.
  const repo = await gh(repositoryPath);
  const [actionsPermissions, workflowPermissions, privateRepoAccess, forkPrWorkflows, retention] = await Promise.all([
    gh(`${repositoryPath}/actions/permissions`),
    gh(`${repositoryPath}/actions/permissions/workflow`),
    gh(`${repositoryPath}/actions/permissions/access`),
    gh(`${repositoryPath}/actions/permissions/fork-pr-workflows-private-repos`),
    gh(`${repositoryPath}/actions/permissions/artifact-and-log-retention`),
  ]);

  const forkPrApprovalResult = await optionalGh(
    `${repositoryPath}/actions/permissions/fork-pr-contributor-approval`,
    repo.private === true ? new Set([404, 422]) : new Set([404]),
  );
  const vulnerabilityAlerts = await featureEnabled(`${repositoryPath}/vulnerability-alerts`);
  const dependabotStatus = await ghResponse(`${repositoryPath}/automated-security-fixes`);
  const dependabotSecurityUpdates = dependabotStatus.status === 200
    && dependabotStatus.data?.enabled === true
    && dependabotStatus.data?.paused !== true;
  if (![200, 404].includes(dependabotStatus.status)) {
    throw new Error(`GET ${repositoryPath}/automated-security-fixes -> ${dependabotStatus.status} ${responseDetail(dependabotStatus)}`);
  }

  return {
    repository: {
      web_commit_signoff_required: repo.web_commit_signoff_required === true,
      allow_auto_merge: repo.allow_auto_merge === true,
      delete_branch_on_merge: repo.delete_branch_on_merge === true,
    },
    actions_permissions: {
      enabled: actionsPermissions.enabled === true,
      allowed_actions: String(actionsPermissions.allowed_actions || ''),
      sha_pinning_required: actionsPermissions.sha_pinning_required === true,
    },
    workflow_permissions: {
      default_workflow_permissions: String(workflowPermissions.default_workflow_permissions || ''),
      can_approve_pull_request_reviews: workflowPermissions.can_approve_pull_request_reviews === true,
    },
    private_repo_access: {
      access_level: String(privateRepoAccess.access_level || ''),
    },
    fork_pr_approval: {
      supported: forkPrApprovalResult.supported,
      approval_policy: forkPrApprovalResult.supported
        ? String(forkPrApprovalResult.data?.approval_policy || '')
        : null,
    },
    fork_pr_workflows: {
      run_workflows_from_fork_pull_requests: forkPrWorkflows.run_workflows_from_fork_pull_requests === true,
      send_write_tokens_to_workflows: forkPrWorkflows.send_write_tokens_to_workflows === true,
      send_secrets_and_variables: forkPrWorkflows.send_secrets_and_variables === true,
      require_approval_for_fork_pr_workflows: forkPrWorkflows.require_approval_for_fork_pr_workflows === true,
    },
    artifact_and_log_retention: {
      days: Number(retention.days),
    },
    vulnerability_alerts: vulnerabilityAlerts,
    dependabot_security_updates: dependabotSecurityUpdates,
  };
}

function jsonEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function applyRepositoryCore(desired) {
  await gh(repositoryPath, {
    method: 'PATCH',
    body: JSON.stringify(desired.repository),
  });
}

async function applyRepositorySecurity(desired) {
  await applyRepositoryCore(desired);
  await gh(`${repositoryPath}/actions/permissions`, {
    method: 'PUT',
    body: JSON.stringify(desired.actions_permissions),
  });
  await gh(`${repositoryPath}/actions/permissions/workflow`, {
    method: 'PUT',
    body: JSON.stringify(desired.workflow_permissions),
  });
  await gh(`${repositoryPath}/actions/permissions/access`, {
    method: 'PUT',
    body: JSON.stringify(desired.private_repo_access),
  });
  if (desired.fork_pr_approval.supported) {
    await gh(`${repositoryPath}/actions/permissions/fork-pr-contributor-approval`, {
      method: 'PUT',
      body: JSON.stringify({ approval_policy: desired.fork_pr_approval.approval_policy }),
    });
  }
  await gh(`${repositoryPath}/actions/permissions/fork-pr-workflows-private-repos`, {
    method: 'PUT',
    body: JSON.stringify(desired.fork_pr_workflows),
  });
  await gh(`${repositoryPath}/actions/permissions/artifact-and-log-retention`, {
    method: 'PUT',
    body: JSON.stringify(desired.artifact_and_log_retention),
  });
  await gh(`${repositoryPath}/vulnerability-alerts`, { method: 'PUT' });
  await gh(`${repositoryPath}/automated-security-fixes`, { method: 'PUT' });
}

async function applyAndVerifyRuleset({ existing, desiredRuleset, desiredRulesetNormalized }) {
  if (existing) {
    await gh(`${repositoryPath}/rulesets/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify(desiredRuleset),
    });
  } else {
    await gh(`${repositoryPath}/rulesets`, {
      method: 'POST',
      body: JSON.stringify(desiredRuleset),
    });
  }

  const afterRulesets = await gh(`${repositoryPath}/rulesets`);
  const afterSummary = afterRulesets.find((ruleset) => ruleset.name === desiredRuleset.name);
  if (!afterSummary) throw new Error('Ruleset fehlt nach Apply');
  const afterRuleset = await gh(`${repositoryPath}/rulesets/${afterSummary.id}`);
  enforceRulesetFloor(afterRuleset);
  const afterRulesetNormalized = normalizedRuleset(afterRuleset);
  if (!jsonEqual(afterRulesetNormalized, desiredRulesetNormalized)) {
    throw new Error(`Ruleset Post-Apply-Verifikation fehlgeschlagen:\n${JSON.stringify({ after: afterRulesetNormalized, expected: desiredRulesetNormalized }, null, 2)}`);
  }
}

const expected = JSON.parse(fs.readFileSync(EXPECTED_PATH, 'utf8'));
const rulesets = await gh(`${repositoryPath}/rulesets`);
const existing = rulesets.find((ruleset) => ruleset.name === expected.ruleset_name);
const currentRuleset = existing ? await gh(`${repositoryPath}/rulesets/${existing.id}`) : null;
const desiredRuleset = preserveApprovedLiveRules(buildDesiredRuleset(expected), currentRuleset);
enforceRulesetFloor(desiredRuleset);

const currentSecurity = await readRepositorySecurity();
const desiredSecurity = desiredRepositorySecurity(expected, {
  forkPrApprovalSupported: currentSecurity.fork_pr_approval.supported,
});
enforceRepositoryFloor(desiredSecurity);

const currentRulesetNormalized = currentRuleset ? normalizedRuleset(currentRuleset) : null;
const desiredRulesetNormalized = normalizedRuleset(desiredRuleset);
const rulesetChanged = !jsonEqual(currentRulesetNormalized, desiredRulesetNormalized);
const repositoryChanged = !jsonEqual(currentSecurity, desiredSecurity);
const repositoryCoreChanged = !jsonEqual(currentSecurity.repository, desiredSecurity.repository);

console.log('## GitHub Security Reconciliation');
console.log(`mode=${mode}`);
console.log('### Ruleset');
console.log('```json');
console.log(JSON.stringify({ current: currentRulesetNormalized ?? '(existiert noch nicht)', desired: desiredRulesetNormalized }, null, 2));
console.log('```');
console.log(`ruleset_changed=${rulesetChanged}`);
console.log('### Repository / Actions');
console.log('```json');
console.log(JSON.stringify({ current: currentSecurity, desired: desiredSecurity }, null, 2));
console.log('```');
console.log(`repository_changed=${repositoryChanged}`);
console.log(`repository_core_changed=${repositoryCoreChanged}`);
console.log(`fork_pr_contributor_approval_supported=${currentSecurity.fork_pr_approval.supported}`);
if (!currentSecurity.fork_pr_approval.supported) {
  console.log('fork-pr-contributor-approval ist fuer diese private Repository-Konstellation nicht verfuegbar; private Fork-Workflow-Approval bleibt separat fail-closed erforderlich.');
}
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `ruleset_changed=${rulesetChanged}\nrepository_changed=${repositoryChanged}\nrepository_core_changed=${repositoryCoreChanged}\n`,
  );
}

if (mode === 'plan') {
  console.log('Plan-only: keine GitHub-Einstellung wurde veraendert.');
  process.exit(0);
}

if (rulesetChanged) {
  await applyAndVerifyRuleset({ existing, desiredRuleset, desiredRulesetNormalized });
}

if (mode === 'apply-package-a') {
  if (repositoryCoreChanged) await applyRepositoryCore(desiredSecurity);
  const afterSecurity = await readRepositorySecurity();
  enforceRepositoryCore(afterSecurity, desiredSecurity);
  console.log('Package A applied: Ruleset-Kernschutz und Repository-Core wurden fail-closed verifiziert; Paket-B-Einstellungen blieben unangetastet.');
  process.exit(0);
}

if (repositoryChanged) await applyRepositorySecurity(desiredSecurity);
const afterSecurity = await readRepositorySecurity();
enforceRepositoryFloor(afterSecurity);
if (!jsonEqual(afterSecurity, desiredSecurity)) {
  throw new Error(`Repository Post-Apply-Verifikation fehlgeschlagen:\n${JSON.stringify({ after: afterSecurity, expected: desiredSecurity }, null, 2)}`);
}
console.log('Full apply: GitHub Ruleset + Repository/Actions hardening applied and fail-closed post-write verified.');
