function sortedUnique(values) {
  return Object.freeze(
    [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))].sort(),
  );
}

function booleanOrFalse(value) {
  return value === true;
}

export function projectRepositorySettings(raw) {
  const repository = raw && typeof raw === 'object' ? raw : {};
  return Object.freeze({
    visibility: typeof repository.visibility === 'string' ? repository.visibility : null,
    archived: booleanOrFalse(repository.archived),
    disabled: booleanOrFalse(repository.disabled),
    defaultBranch: typeof repository.default_branch === 'string' ? repository.default_branch : null,
    features: Object.freeze({
      issues: booleanOrFalse(repository.has_issues),
      projects: booleanOrFalse(repository.has_projects),
      wiki: booleanOrFalse(repository.has_wiki),
      pages: booleanOrFalse(repository.has_pages),
      discussions: booleanOrFalse(repository.has_discussions),
    }),
    merge: Object.freeze({
      mergeCommit: booleanOrFalse(repository.allow_merge_commit),
      squash: booleanOrFalse(repository.allow_squash_merge),
      rebase: booleanOrFalse(repository.allow_rebase_merge),
      autoMerge: booleanOrFalse(repository.allow_auto_merge),
      updateBranch: booleanOrFalse(repository.allow_update_branch),
      deleteBranchOnMerge: booleanOrFalse(repository.delete_branch_on_merge),
      webCommitSignoffRequired: booleanOrFalse(repository.web_commit_signoff_required),
    }),
  });
}

export function projectActionsPermissions(raw) {
  const settings = raw && typeof raw === 'object' ? raw : {};
  return Object.freeze({
    enabled: settings.enabled === true,
    enabledRepositories: typeof settings.enabled_repositories === 'string'
      ? settings.enabled_repositories
      : null,
    enabledOrganizations: typeof settings.enabled_organizations === 'string'
      ? settings.enabled_organizations
      : null,
    allowedActions: typeof settings.allowed_actions === 'string' ? settings.allowed_actions : null,
    shaPinningRequired: settings.sha_pinning_required === true,
  });
}

export function projectWorkflowPermissions(raw) {
  const settings = raw && typeof raw === 'object' ? raw : {};
  return Object.freeze({
    defaultWorkflowPermissions: typeof settings.default_workflow_permissions === 'string'
      ? settings.default_workflow_permissions
      : null,
    canApprovePullRequestReviews: settings.can_approve_pull_request_reviews === true,
  });
}

export function projectRetentionSettings(raw) {
  const settings = raw && typeof raw === 'object' ? raw : {};
  return Object.freeze({
    days: Number.isInteger(settings.days) ? settings.days : null,
    maximumAllowedDays: Number.isInteger(settings.maximum_allowed_days)
      ? settings.maximum_allowed_days
      : null,
  });
}

export function projectForkPrSettings(raw) {
  const settings = raw && typeof raw === 'object' ? raw : {};
  return Object.freeze({
    runWorkflowsFromForkPullRequests: settings.run_workflows_from_fork_pull_requests === true,
    sendWriteTokensToWorkflows: settings.send_write_tokens_to_workflows === true,
    sendSecretsAndVariables: settings.send_secrets_and_variables === true,
    requireApprovalForForkPrWorkflows: settings.require_approval_for_fork_pr_workflows === true,
  });
}

export function projectSelfHostedRunnerSettings(raw) {
  const settings = raw && typeof raw === 'object' ? raw : {};
  return Object.freeze({
    enabledRepositories: typeof settings.enabled_repositories === 'string'
      ? settings.enabled_repositories
      : null,
  });
}

export function projectCustomPropertyInventory(raw) {
  const rows = Array.isArray(raw) ? raw : [];
  return Object.freeze({
    propertyCount: rows.length,
    propertyNames: sortedUnique(rows.map((row) => row?.property_name)),
    valuesRedacted: true,
  });
}

export function projectRulesetInventory(raw) {
  const rows = Array.isArray(raw) ? raw : [];
  return Object.freeze({
    rulesetCount: rows.length,
    targets: sortedUnique(rows.map((row) => row?.target)),
    enforcementStates: sortedUnique(rows.map((row) => row?.enforcement)),
    namesRedacted: true,
    bypassActorsRedacted: true,
  });
}


function roundedGiB(bytes) {
  const value = typeof bytes === 'number' && Number.isFinite(bytes) ? bytes : 0;
  return Number((value / (1024 ** 3)).toFixed(6));
}

export function projectCacheUsage(raw) {
  const settings = raw && typeof raw === 'object' ? raw : {};
  const bytes = typeof settings.active_caches_size_in_bytes === 'number'
    ? settings.active_caches_size_in_bytes
    : typeof settings.total_active_caches_size_in_bytes === 'number'
      ? settings.total_active_caches_size_in_bytes
      : 0;
  const count = Number.isInteger(settings.active_caches_count)
    ? settings.active_caches_count
    : Number.isInteger(settings.total_active_caches_count)
      ? settings.total_active_caches_count
      : 0;
  return Object.freeze({
    activeCachesCount: count,
    activeCachesSizeInBytes: bytes,
    activeCachesSizeGiB: roundedGiB(bytes),
    fullName: typeof settings.full_name === 'string' ? settings.full_name : null,
  });
}

export function projectCacheRetentionLimit(raw) {
  const settings = raw && typeof raw === 'object' ? raw : {};
  return Object.freeze({
    days: Number.isInteger(settings.days) ? settings.days : null,
  });
}

export function projectCacheStorageLimit(raw) {
  const settings = raw && typeof raw === 'object' ? raw : {};
  return Object.freeze({
    maxCacheSizeGiB: typeof settings.max_cache_size_gb === 'number'
      && Number.isFinite(settings.max_cache_size_gb)
      ? settings.max_cache_size_gb
      : null,
  });
}

export function projectArtifactStorageInventory(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const artifacts = Array.isArray(payload.artifacts) ? payload.artifacts : [];
  const active = artifacts.filter((artifact) => artifact?.expired !== true);
  const expired = artifacts.filter((artifact) => artifact?.expired === true);
  const activeBytes = active.reduce(
    (sum, artifact) => sum + (
      typeof artifact?.size_in_bytes === 'number' && Number.isFinite(artifact.size_in_bytes)
        ? artifact.size_in_bytes
        : 0
    ),
    0,
  );

  return Object.freeze({
    totalCount: Number.isInteger(payload.total_count) ? payload.total_count : artifacts.length,
    observedCount: artifacts.length,
    activeCount: active.length,
    expiredCount: expired.length,
    activeSizeInBytes: activeBytes,
    activeSizeGiB: roundedGiB(activeBytes),
    namesRedacted: true,
    workflowIdentityRedacted: true,
  });
}

export function projectCapturedSetting(capture, projector) {
  if (!capture || capture.status !== 'PASS') {
    return Object.freeze({
      status: capture?.status || 'NOT_OBSERVABLE',
      requiredPermission: capture?.requiredPermission || null,
      providerStatus: Number.isInteger(capture?.providerStatus) ? capture.providerStatus : null,
      reason: typeof capture?.reason === 'string' ? capture.reason : null,
    });
  }

  return Object.freeze({
    status: 'PASS',
    requiredPermission: capture.requiredPermission || null,
    data: projector(capture.data),
  });
}


export function projectSelectedActions(raw) {
  const settings = raw && typeof raw === 'object' ? raw : {};
  return Object.freeze({
    githubOwnedAllowed: settings.github_owned_allowed === true,
    verifiedAllowed: settings.verified_allowed === true,
    patternsAllowed: sortedUnique(Array.isArray(settings.patterns_allowed) ? settings.patterns_allowed : []),
  });
}

export function projectEnvironmentInventory(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const environments = Array.isArray(payload.environments) ? payload.environments : [];
  return Object.freeze({
    totalCount: Number.isInteger(payload.total_count) ? payload.total_count : environments.length,
    environments: Object.freeze(environments.map((environment) => {
      const rules = Array.isArray(environment?.protection_rules) ? environment.protection_rules : [];
      const reviewerRule = rules.find((rule) => rule?.type === 'required_reviewers');
      const waitTimerRule = rules.find((rule) => rule?.type === 'wait_timer');
      const reviewers = Array.isArray(reviewerRule?.reviewers) ? reviewerRule.reviewers : [];
      return Object.freeze({
        name: typeof environment?.name === 'string' ? environment.name : null,
        protectionRuleTypes: sortedUnique(rules.map((rule) => rule?.type)),
        waitTimerMinutes: Number.isInteger(waitTimerRule?.wait_timer) ? waitTimerRule.wait_timer : null,
        requiredReviewerCount: reviewers.length,
        reviewerTypes: sortedUnique(reviewers.map((reviewer) => reviewer?.type)),
        preventSelfReview: reviewerRule?.prevent_self_review === true,
        deploymentBranchPolicy: Object.freeze({
          protectedBranches: environment?.deployment_branch_policy?.protected_branches === true,
          customBranchPolicies: environment?.deployment_branch_policy?.custom_branch_policies === true,
        }),
        reviewerIdentitiesRedacted: true,
      });
    })),
  });
}

export function projectCodeSecurityConfiguration(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const configuration = payload.configuration && typeof payload.configuration === 'object'
    ? payload.configuration
    : {};
  const feature = (name) => typeof configuration[name] === 'string' ? configuration[name] : null;
  return Object.freeze({
    attachmentStatus: typeof payload.status === 'string' ? payload.status : null,
    targetType: feature('target_type'),
    enforcement: feature('enforcement'),
    advancedSecurity: feature('advanced_security'),
    dependencyGraph: feature('dependency_graph'),
    dependencyGraphAutosubmitAction: feature('dependency_graph_autosubmit_action'),
    dependabotAlerts: feature('dependabot_alerts'),
    dependabotSecurityUpdates: feature('dependabot_security_updates'),
    codeScanningDefaultSetup: feature('code_scanning_default_setup'),
    codeScanningDelegatedAlertDismissal: feature('code_scanning_delegated_alert_dismissal'),
    secretScanning: feature('secret_scanning'),
    secretScanningPushProtection: feature('secret_scanning_push_protection'),
    secretScanningDelegatedBypass: feature('secret_scanning_delegated_bypass'),
    secretScanningValidityChecks: feature('secret_scanning_validity_checks'),
    secretScanningNonProviderPatterns: feature('secret_scanning_non_provider_patterns'),
    secretScanningGenericSecrets: feature('secret_scanning_generic_secrets'),
    secretScanningDelegatedAlertDismissal: feature('secret_scanning_delegated_alert_dismissal'),
    privateVulnerabilityReporting: feature('private_vulnerability_reporting'),
    configurationIdentityRedacted: true,
    reviewerIdentitiesRedacted: true,
  });
}

function mostRestrictiveWorkflowPermission(values) {
  const known = values.filter((value) => value === 'read' || value === 'write');
  if (known.includes('read')) return 'read';
  return known.length === values.length && known.length > 0 ? 'write' : null;
}

function conservativeApproval(values) {
  const known = values.filter((value) => typeof value === 'boolean');
  if (known.includes(false)) return false;
  return known.length === values.length && known.length > 0 ? true : null;
}

export function projectEffectiveSettingsPolicy({
  enterpriseActions = null,
  enterpriseWorkflow = null,
  enterpriseSelectedActions = null,
  organizationActions = null,
  organizationWorkflow = null,
  organizationSelectedActions = null,
  repositoryActions = null,
  repositoryWorkflow = null,
  repositorySelectedActions = null,
  environmentInventory = null,
  codeSecurityConfiguration = null,
} = {}) {
  const actionLevels = Object.freeze({
    enterprise: enterpriseActions,
    organization: organizationActions,
    repository: repositoryActions,
  });
  const selectedLevels = Object.freeze({
    enterprise: enterpriseSelectedActions,
    organization: organizationSelectedActions,
    repository: repositorySelectedActions,
  });
  const selectedRequired = [
    ['enterprise', enterpriseActions, enterpriseSelectedActions],
    ['organization', organizationActions, organizationSelectedActions],
    ['repository', repositoryActions, repositorySelectedActions],
  ].filter(([, actions]) => actions?.allowedActions === 'selected');
  const selectedConstraintsComplete = selectedRequired.every(([, , selected]) => selected !== null);

  const shaValues = [enterpriseActions, organizationActions, repositoryActions]
    .map((value) => value?.shaPinningRequired)
    .filter((value) => typeof value === 'boolean');
  const shaPinningRequired = shaValues.includes(true)
    ? true
    : shaValues.length === 3
      ? false
      : null;

  const workflowValues = [enterpriseWorkflow, organizationWorkflow, repositoryWorkflow]
    .map((value) => value?.defaultWorkflowPermissions);
  const approvalValues = [enterpriseWorkflow, organizationWorkflow, repositoryWorkflow]
    .map((value) => value?.canApprovePullRequestReviews);

  let actionsExecution = 'UNKNOWN';
  if (enterpriseActions?.enabledOrganizations === 'none') actionsExecution = 'BLOCKED_BY_ENTERPRISE';
  else if (organizationActions?.enabledRepositories === 'none') actionsExecution = 'BLOCKED_BY_ORGANIZATION';
  else if (repositoryActions?.enabled === false) actionsExecution = 'DISABLED_AT_REPOSITORY';
  else if (
    enterpriseActions?.enabledOrganizations === 'selected'
    || organizationActions?.enabledRepositories === 'selected'
  ) actionsExecution = 'CONDITIONALLY_ENABLED';
  else if (repositoryActions?.enabled === true) actionsExecution = 'ENABLED';

  const knownCore = [
    enterpriseActions,
    enterpriseWorkflow,
    organizationActions,
    organizationWorkflow,
    repositoryActions,
    repositoryWorkflow,
  ];
  return Object.freeze({
    status: knownCore.every(Boolean) && selectedConstraintsComplete
      ? 'PASS'
      : 'PARTIAL_COVERAGE',
    sourcePrecedence: Object.freeze(['enterprise', 'organization', 'repository']),
    lowerScopesCannotBroadenParentPolicy: true,
    actions: Object.freeze({
      execution: actionsExecution,
      shaPinningRequired,
      defaultWorkflowPermissions: mostRestrictiveWorkflowPermission(workflowValues),
      canApprovePullRequestReviews: conservativeApproval(approvalValues),
      selectedConstraintsComplete,
      levels: actionLevels,
      selectedActions: selectedLevels,
    }),
    deploymentEnvironments: environmentInventory,
    codeSecurity: codeSecurityConfiguration,
  });
}
