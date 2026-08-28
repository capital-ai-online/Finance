import fs from 'node:fs';

const OWNER = 'SvenKulessa';
const REPO = 'Finance';
const EXPECTED_PATH = '.github/policies/main-production-protection.expected.json';
const mode = process.argv[2]; // 'plan' | 'apply'
const token = process.env.GH_TOKEN;
const repositoryPath = `/repos/${OWNER}/${REPO}`;

// Bind Required Checks to the GitHub Apps that actually produce them. This prevents another
// actor/integration with write access from spoofing a required context by name alone.
const CHECK_INTEGRATION_IDS = new Map([
  ['build-and-test', 15368],
  ['PR Governance (Kosten / Workflow / Vorlage)', 15368],
  ['Hardened image / HIGH+CRITICAL CVE gate', 15368],
  ['GitGuardian Security Checks', 46505],
]);

if (!['plan', 'apply'].includes(mode)) {
  console.error('Usage: rulesetSync.mjs <plan|apply>');
  process.exit(1);
}
if (!token) {
  console.error('GH_TOKEN is required');
  process.exit(1);
}
if (mode === 'apply' && process.env.GITHUB_REF !== 'refs/heads/main') {
  console.error(`REF DENY: ruleset/repository apply is allowed only on refs/heads/main, got ${process.env.GITHUB_REF || 'missing'}`);
  process.exit(1);
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
    const detail = typeof response.data === 'object' && response.data?.message
      ? response.data.message
      : String(response.data || '');
    throw new Error(`${init.method || 'GET'} ${path} -> ${response.status} ${detail}`);
  }
  return response.data;
}

async function featureEnabled(path) {
  const response = await ghResponse(path);
  if (response.status === 200 || response.status === 204) return true;
  if (response.status === 404) return false;
  const detail = typeof response.data === 'object' && response.data?.message
    ? response.data.message
    : String(response.data || '');
  throw new Error(`GET ${path} -> ${response.status} ${detail}`);
}

function statusCheck(context) {
  const integrationId = CHECK_INTEGRATION_IDS.get(context);
  if (!integrationId) {
    throw new Error(`No trusted integration_id is registered for required check: ${context}`);
  }
  return { context, integration_id: integrationId };
}

// Uebersetzt das abstrakte expected.json-Format in die konkrete GitHub-Ruleset-API-Struktur.
// Die Parameter bilden den beabsichtigten vollständigen Zustand ab; ein PUT darf keine bereits
// aktive Schutzwirkung versehentlich durch Weglassen eines Feldes zurücksetzen.
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
          allowed_merge_methods: ['merge', 'squash', 'rebase'],
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

function normalizedRule(rule) {
  if (rule.type === 'non_fast_forward' || rule.type === 'deletion') return { type: rule.type };
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

// Hard-Floor: unabhaengig davon, was in expected.json steht oder wer die PR gemerged hat -
// diese Kernschutzregeln duerfen NIE unterschritten werden. Bricht vor jedem API-Schreibzugriff ab.
function enforceRulesetFloor(desired) {
  const failures = [];
  const normalized = normalizedRuleset(desired);
  const statusRule = normalized.rules.find((r) => r.type === 'required_status_checks');
  const prRule = normalized.rules.find((r) => r.type === 'pull_request');
  const checks = new Map((statusRule?.parameters.required_status_checks ?? []).map((c) => [c.context, c.integration_id]));

  for (const [context, integrationId] of CHECK_INTEGRATION_IDS) {
    if (checks.get(context) !== integrationId) {
      failures.push(`required check "${context}" muss an integration_id ${integrationId} gebunden sein`);
    }
  }
  if (checks.size !== CHECK_INTEGRATION_IDS.size) failures.push('Required-Check-Menge darf keine unbekannten oder fehlenden Kontexte enthalten');
  if (statusRule?.parameters.strict_required_status_checks_policy !== true) failures.push('strict required status checks muss aktiviert sein');
  if (statusRule?.parameters.do_not_enforce_on_create !== false) failures.push('Required Checks muessen auch bei Ref-Erstellung gelten');
  if (!normalized.rules.some((r) => r.type === 'non_fast_forward')) failures.push('non_fast_forward-Schutz fehlt');
  if (!prRule) failures.push('pull_request-Pflicht fehlt');
  if (prRule?.parameters.require_code_owner_review !== true) failures.push('CODEOWNER-Review-Pflicht fehlt');
  if (prRule?.parameters.required_review_thread_resolution !== true) failures.push('Review-Thread-Aufloesung muss erforderlich sein');
  if (prRule?.parameters.require_extra_approval_for_unattributed_changes !== true) failures.push('Extra-Approval fuer unattributed changes muss erforderlich sein');
  if ((normalized.bypass_actors ?? []).length > 0) failures.push('bypass_actors muss leer sein');
  if (normalized.enforcement !== 'active') failures.push('Ruleset muss active sein');
  if (normalized.target !== 'branch') failures.push('Ruleset target muss branch sein');
  if (!normalized.conditions.ref_name.include.includes('~DEFAULT_BRANCH')) failures.push('Ruleset muss den Default-Branch erfassen');

  if (failures.length) {
    throw new Error(`RULESET FLOOR VERLETZT:\n${failures.map((f) => `- ${f}`).join('\n')}`);
  }
}

function desiredRepositorySecurity(expected) {
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
      approval_policy: String(actions.fork_pr_approval_policy || ''),
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
  if (desired.fork_pr_approval.approval_policy !== 'all_external_contributors') failures.push('alle externen Fork-PR-Workflows muessen Approval erfordern');
  if (desired.fork_pr_workflows.send_write_tokens_to_workflows !== false) failures.push('Fork-PR-Workflows duerfen keine Write-Tokens erhalten');
  if (desired.fork_pr_workflows.send_secrets_and_variables !== false) failures.push('Fork-PR-Workflows duerfen keine Secrets/Variablen erhalten');
  if (desired.fork_pr_workflows.require_approval_for_fork_pr_workflows !== true) failures.push('Fork-PR-Workflows muessen Admin-Approval erfordern');
  if (!Number.isInteger(desired.artifact_and_log_retention.days) || desired.artifact_and_log_retention.days < 1 || desired.artifact_and_log_retention.days > 90) {
    failures.push('Artifact-/Log-Retention muss zwischen 1 und 90 Tagen liegen');
  }
  if (desired.vulnerability_alerts !== true) failures.push('Vulnerability Alerts muessen aktiviert sein');
  if (desired.dependabot_security_updates !== true) failures.push('Dependabot Security Updates muessen aktiviert sein');
  if (failures.length) {
    throw new Error(`REPOSITORY FLOOR VERLETZT:\n${failures.map((f) => `- ${f}`).join('\n')}`);
  }
}

async function readRepositorySecurity() {
  const [repo, actionsPermissions, workflowPermissions, privateRepoAccess, forkPrApproval, forkPrWorkflows, retention] = await Promise.all([
    gh(repositoryPath),
    gh(`${repositoryPath}/actions/permissions`),
    gh(`${repositoryPath}/actions/permissions/workflow`),
    gh(`${repositoryPath}/actions/permissions/access`),
    gh(`${repositoryPath}/actions/permissions/fork-pr-contributor-approval`),
    gh(`${repositoryPath}/actions/permissions/fork-pr-workflows-private-repos`),
    gh(`${repositoryPath}/actions/permissions/artifact-and-log-retention`),
  ]);
  const vulnerabilityAlerts = await featureEnabled(`${repositoryPath}/vulnerability-alerts`);
  const dependabotStatus = await ghResponse(`${repositoryPath}/automated-security-fixes`);
  const dependabotSecurityUpdates = dependabotStatus.status === 200 && dependabotStatus.data?.enabled === true && dependabotStatus.data?.paused !== true;
  if (![200, 404].includes(dependabotStatus.status)) {
    const detail = typeof dependabotStatus.data === 'object' && dependabotStatus.data?.message
      ? dependabotStatus.data.message
      : String(dependabotStatus.data || '');
    throw new Error(`GET ${repositoryPath}/automated-security-fixes -> ${dependabotStatus.status} ${detail}`);
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
      approval_policy: String(forkPrApproval.approval_policy || ''),
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

async function applyRepositorySecurity(desired) {
  await gh(repositoryPath, {
    method: 'PATCH',
    body: JSON.stringify(desired.repository),
  });
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
  await gh(`${repositoryPath}/actions/permissions/fork-pr-contributor-approval`, {
    method: 'PUT',
    body: JSON.stringify(desired.fork_pr_approval),
  });
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

const expected = JSON.parse(fs.readFileSync(EXPECTED_PATH, 'utf8'));
const desiredRuleset = buildDesiredRuleset(expected);
const desiredSecurity = desiredRepositorySecurity(expected);
enforceRulesetFloor(desiredRuleset);
enforceRepositoryFloor(desiredSecurity);

const rulesets = await gh(`${repositoryPath}/rulesets`);
const existing = rulesets.find((r) => r.name === expected.ruleset_name);
const currentRuleset = existing ? await gh(`${repositoryPath}/rulesets/${existing.id}`) : null;
const currentRulesetNormalized = currentRuleset ? normalizedRuleset(currentRuleset) : null;
const desiredRulesetNormalized = normalizedRuleset(desiredRuleset);
const rulesetChanged = !jsonEqual(currentRulesetNormalized, desiredRulesetNormalized);

const currentSecurity = await readRepositorySecurity();
const repositoryChanged = !jsonEqual(currentSecurity, desiredSecurity);

console.log('## GitHub Security Reconciliation');
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
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `ruleset_changed=${rulesetChanged}\nrepository_changed=${repositoryChanged}\n`);
}

if (mode === 'apply') {
  // Ruleset first: the merge boundary is the critical security floor. If a secondary repository
  // endpoint later fails due to product/account constraints, the branch protection still becomes
  // stronger rather than remaining at the old weak baseline.
  if (rulesetChanged) {
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
  }

  const afterRulesets = await gh(`${repositoryPath}/rulesets`);
  const afterSummary = afterRulesets.find((r) => r.name === expected.ruleset_name);
  if (!afterSummary) throw new Error('Ruleset fehlt nach Apply');
  const afterRuleset = await gh(`${repositoryPath}/rulesets/${afterSummary.id}`);
  const afterRulesetNormalized = normalizedRuleset(afterRuleset);
  enforceRulesetFloor(afterRuleset);
  if (!jsonEqual(afterRulesetNormalized, desiredRulesetNormalized)) {
    throw new Error(`Ruleset Post-Apply-Verifikation fehlgeschlagen:\n${JSON.stringify({ after: afterRulesetNormalized, expected: desiredRulesetNormalized }, null, 2)}`);
  }

  if (repositoryChanged) {
    await applyRepositorySecurity(desiredSecurity);
  }
  const afterSecurity = await readRepositorySecurity();
  enforceRepositoryFloor(afterSecurity);
  if (!jsonEqual(afterSecurity, desiredSecurity)) {
    throw new Error(`Repository Post-Apply-Verifikation fehlgeschlagen:\n${JSON.stringify({ after: afterSecurity, expected: desiredSecurity }, null, 2)}`);
  }

  console.log('GitHub Ruleset + Repository/Actions hardening applied and fail-closed post-write verified.');
}
