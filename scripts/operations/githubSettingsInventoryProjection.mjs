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
    : 0;
  return Object.freeze({
    activeCachesCount: Number.isInteger(settings.active_caches_count)
      ? settings.active_caches_count
      : 0,
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
