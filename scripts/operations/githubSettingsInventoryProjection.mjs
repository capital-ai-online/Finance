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

function collectionItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray(raw.items)) return raw.items;
  return [];
}

export function projectOrganizationSettings(raw) {
  const organization = raw && typeof raw === 'object' ? raw : {};
  return Object.freeze({
    login: typeof organization.login === 'string' ? organization.login : null,
    defaultRepositoryPermission: typeof organization.default_repository_permission === 'string'
      ? organization.default_repository_permission
      : null,
    membersCanCreateRepositories: organization.members_can_create_repositories === true,
    membersCanCreatePublicRepositories: organization.members_can_create_public_repositories === true,
    membersCanCreatePrivateRepositories: organization.members_can_create_private_repositories === true,
    membersCanCreateInternalRepositories: organization.members_can_create_internal_repositories === true,
    membersCanForkPrivateRepositories: organization.members_can_fork_private_repositories === true,
    membersCanCreatePages: organization.members_can_create_pages === true,
    webCommitSignoffRequired: organization.web_commit_signoff_required === true,
    twoFactorRequirementEnabled: organization.two_factor_requirement_enabled === true,
    emailRedacted: true,
    billingEmailRedacted: true,
  });
}

export function projectSelectedAccountInventory(raw) {
  const rows = collectionItems(raw);
  return Object.freeze({
    totalCount: Number.isInteger(raw?.total_count) ? raw.total_count : rows.length,
    observedCount: rows.length,
    identitiesRedacted: true,
  });
}

export function projectRunnerInventory(raw) {
  const rows = collectionItems(raw);
  return Object.freeze({
    totalCount: Number.isInteger(raw?.total_count) ? raw.total_count : rows.length,
    observedCount: rows.length,
    statuses: sortedUnique(rows.map((runner) => runner?.status)),
    busyCount: rows.filter((runner) => runner?.busy === true).length,
    offlineCount: rows.filter((runner) => runner?.status === 'offline').length,
    namesRedacted: true,
    labelsRedacted: true,
    identitiesRedacted: true,
  });
}

export function projectRunnerGroupInventory(raw) {
  const rows = collectionItems(raw);
  return Object.freeze({
    totalCount: Number.isInteger(raw?.total_count) ? raw.total_count : rows.length,
    observedCount: rows.length,
    visibilities: sortedUnique(rows.map((group) => group?.visibility)),
    allowsPublicRepositories: rows.some((group) => group?.allows_public_repositories === true),
    namesRedacted: true,
    selectedRepositoryIdentitiesRedacted: true,
    selectedWorkflowIdentitiesRedacted: true,
  });
}

export function projectAppInstallationInventory(raw) {
  const rows = collectionItems(raw);
  return Object.freeze({
    totalCount: Number.isInteger(raw?.total_count) ? raw.total_count : rows.length,
    observedCount: rows.length,
    installations: Object.freeze(rows.map((row) => Object.freeze({
      appSlug: typeof row?.app_slug === 'string' ? row.app_slug : null,
      repositorySelection: typeof row?.repository_selection === 'string' ? row.repository_selection : null,
      permissionKeys: sortedUnique(Object.keys(row?.permissions && typeof row.permissions === 'object' ? row.permissions : {})),
      events: sortedUnique(Array.isArray(row?.events) ? row.events : []),
      suspended: Boolean(row?.suspended_at),
      createdAt: typeof row?.created_at === 'string' ? row.created_at : null,
      updatedAt: typeof row?.updated_at === 'string' ? row.updated_at : null,
    }))),
    installationIdsRedacted: true,
    accountIdentityRedacted: true,
  });
}

export function projectSecretMetadataInventory(raw) {
  const rows = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.secrets)
      ? raw.secrets
      : [];
  return Object.freeze({
    totalCount: Number.isInteger(raw?.total_count) ? raw.total_count : rows.length,
    observedCount: rows.length,
    secrets: Object.freeze(rows.map((row) => Object.freeze({
      name: typeof row?.name === 'string' ? row.name : null,
      visibility: typeof row?.visibility === 'string' ? row.visibility : null,
      createdAt: typeof row?.created_at === 'string' ? row.created_at : null,
      updatedAt: typeof row?.updated_at === 'string' ? row.updated_at : null,
      selectedRepositoryScope: typeof row?.selected_repositories_url === 'string',
    }))),
    valuesProjected: false,
  });
}

export function projectAuditLogInventory(raw) {
  const rows = Array.isArray(raw) ? raw : [];
  const securityRelevant = rows
    .filter((row) => /(?:secret|token|oauth|integration|hook|app|actions|repo|org|copilot|billing)/i.test(String(row?.action || '')))
    .slice(0, 100);
  return Object.freeze({
    observedCount: rows.length,
    securityRelevantCount: securityRelevant.length,
    events: Object.freeze(securityRelevant.map((row) => Object.freeze({
      action: typeof row?.action === 'string' ? row.action : null,
      actor: typeof row?.actor === 'string' ? row.actor : null,
      org: typeof row?.org === 'string' ? row.org : null,
      repo: typeof row?.repo === 'string' ? row.repo : null,
      app: typeof row?.app === 'string'
        ? row.app
        : typeof row?.oauth_application_name === 'string'
          ? row.oauth_application_name
          : null,
      createdAt: Number.isFinite(Number(row?.created_at)) ? Number(row.created_at) : null,
    }))),
    ipAddressesProjected: false,
    userAgentsProjected: false,
    secretValuesProjected: false,
  });
}

export function projectCodeSecurityConfigurationCatalog(raw) {
  const rows = collectionItems(raw);
  const featureValues = (name) => sortedUnique(
    rows.map((configuration) => configuration?.[name]),
  );
  return Object.freeze({
    totalCount: Number.isInteger(raw?.total_count) ? raw.total_count : rows.length,
    observedCount: rows.length,
    targetTypes: featureValues('target_type'),
    enforcementStates: featureValues('enforcement'),
    advancedSecurityStates: featureValues('advanced_security'),
    codeScanningDefaultSetupStates: featureValues('code_scanning_default_setup'),
    secretScanningStates: featureValues('secret_scanning'),
    secretScanningPushProtectionStates: featureValues('secret_scanning_push_protection'),
    configurationIdentitiesRedacted: true,
  });
}

export function projectCustomPropertySchema(raw) {
  const rows = collectionItems(raw);
  return Object.freeze({
    propertyCount: rows.length,
    propertyNames: sortedUnique(rows.map((row) => row?.property_name)),
    valueTypes: sortedUnique(rows.map((row) => row?.value_type)),
    requiredCount: rows.filter((row) => row?.required === true).length,
    allowedValuesRedacted: true,
    defaultValuesRedacted: true,
  });
}

export function projectUserProfile(raw) {
  const user = raw && typeof raw === 'object' ? raw : {};
  return Object.freeze({
    login: typeof user.login === 'string' ? user.login : null,
    accountType: typeof user.type === 'string' ? user.type : null,
    siteAdmin: user.site_admin === true,
    twoFactorAuthentication: typeof user.two_factor_authentication === 'boolean'
      ? user.two_factor_authentication
      : null,
    planName: typeof user?.plan?.name === 'string' ? user.plan.name : null,
    privateRepos: Number.isInteger(user.total_private_repos) ? user.total_private_repos : null,
    ownedPrivateRepos: Number.isInteger(user.owned_private_repos) ? user.owned_private_repos : null,
    emailRedacted: true,
    nameRedacted: true,
    companyRedacted: true,
    locationRedacted: true,
  });
}

export function projectUserEmailInventory(raw) {
  const rows = collectionItems(raw);
  return Object.freeze({
    totalCount: rows.length,
    primaryCount: rows.filter((row) => row?.primary === true).length,
    verifiedCount: rows.filter((row) => row?.verified === true).length,
    visibilities: sortedUnique(rows.map((row) => row?.visibility)),
    addressesRedacted: true,
  });
}

export function projectUserKeyInventory(raw) {
  const rows = collectionItems(raw);
  return Object.freeze({
    totalCount: rows.length,
    expiredCount: rows.filter((row) => row?.expired === true).length,
    signingCapableCount: rows.filter((row) => row?.can_sign === true).length,
    keyMaterialRedacted: true,
    titlesRedacted: true,
    emailsRedacted: true,
    identitiesRedacted: true,
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
  const rows = collectionItems(raw);
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


function sanitizeDiagnosticReason(value) {
  if (typeof value !== 'string') return null;
  const sanitized = value
    .replace(/https?:\/\/[^\s)"']+/gi, '[REDACTED_URL]')
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)\b/g, '[REDACTED_TOKEN]')
    .replace(/\bBearer\s+[^\s]+/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
  return sanitized || null;
}

function projectProviderDiagnostics(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const allowedClassifications = new Set([
    'SSO_AUTHORIZATION_REQUIRED',
    'RATE_LIMITED',
    'FORBIDDEN',
    'NOT_FOUND_OR_HIDDEN',
    'HTTP_ERROR',
  ]);
  const scopes = (value) => sortedUnique(
    (Array.isArray(value) ? value : [])
      .filter((scope) => typeof scope === 'string' && /^[A-Za-z0-9:_-]{1,80}$/.test(scope)),
  );
  const integerOrNull = (value) => Number.isSafeInteger(value) && value >= 0 ? value : null;
  const resource = typeof raw?.rateLimit?.resource === 'string'
    && /^[A-Za-z0-9_-]{1,40}$/.test(raw.rateLimit.resource)
    ? raw.rateLimit.resource
    : null;

  return Object.freeze({
    classification: allowedClassifications.has(raw.classification) ? raw.classification : 'HTTP_ERROR',
    oauthScopes: Object.freeze(scopes(raw.oauthScopes)),
    acceptedOauthScopes: Object.freeze(scopes(raw.acceptedOauthScopes)),
    ssoRequired: raw.ssoRequired === true,
    rateLimit: Object.freeze({
      limit: integerOrNull(raw?.rateLimit?.limit),
      remaining: integerOrNull(raw?.rateLimit?.remaining),
      resetEpochSeconds: integerOrNull(raw?.rateLimit?.resetEpochSeconds),
      resource,
    }),
    providerReason: sanitizeDiagnosticReason(raw.providerReason),
  });
}

export function projectCapturedSetting(capture, projector) {
  if (!capture || capture.status !== 'PASS') {
    const projected = {
      status: capture?.status || 'NOT_OBSERVABLE',
      requiredPermission: capture?.requiredPermission || null,
      providerStatus: Number.isInteger(capture?.providerStatus) ? capture.providerStatus : null,
      reason: typeof capture?.reason === 'string' ? capture.reason : null,
    };
    const providerDiagnostics = projectProviderDiagnostics(capture?.providerDiagnostics);
    if (providerDiagnostics) projected.providerDiagnostics = providerDiagnostics;
    return Object.freeze(projected);
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

/**
 * @param {{
 *   enterpriseActions?: any;
 *   enterpriseWorkflow?: any;
 *   enterpriseSelectedActions?: any;
 *   organizationActions?: any;
 *   organizationWorkflow?: any;
 *   organizationSelectedActions?: any;
 *   repositoryActions?: any;
 *   repositoryWorkflow?: any;
 *   repositorySelectedActions?: any;
 *   environmentInventory?: any;
 *   codeSecurityConfiguration?: any;
 * }} [options]
 */
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
  const defaultWorkflowPermissions = mostRestrictiveWorkflowPermission(workflowValues);
  const canApprovePullRequestReviews = conservativeApproval(approvalValues);

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

  const improvementFindings = [];
  if (shaPinningRequired !== true) {
    improvementFindings.push(Object.freeze({
      id: 'ACTIONS_FULL_SHA_PINNING',
      severity: 'HIGH',
      state: shaPinningRequired === false ? 'IMPROVEMENT_AVAILABLE' : 'NOT_OBSERVABLE',
      recommendation: 'Require actions to be pinned to a full-length commit SHA at the highest enforceable scope.',
      protectedMutation: true,
    }));
  }
  if (defaultWorkflowPermissions !== 'read') {
    improvementFindings.push(Object.freeze({
      id: 'DEFAULT_GITHUB_TOKEN_READ_ONLY',
      severity: 'HIGH',
      state: defaultWorkflowPermissions === 'write' ? 'IMPROVEMENT_AVAILABLE' : 'NOT_OBSERVABLE',
      recommendation: 'Use read-only as the default GITHUB_TOKEN permission and grant write only per job.',
      protectedMutation: true,
    }));
  }
  if (canApprovePullRequestReviews !== false) {
    improvementFindings.push(Object.freeze({
      id: 'ACTIONS_PR_REVIEW_APPROVAL',
      severity: 'HIGH',
      state: canApprovePullRequestReviews === true ? 'IMPROVEMENT_AVAILABLE' : 'NOT_OBSERVABLE',
      recommendation: 'Keep GitHub Actions unable to approve pull request reviews unless an explicit governance contract requires it.',
      protectedMutation: true,
    }));
  }
  if (!selectedConstraintsComplete) {
    improvementFindings.push(Object.freeze({
      id: 'SELECTED_ACTIONS_OBSERVABILITY',
      severity: 'MEDIUM',
      state: 'NOT_OBSERVABLE',
      recommendation: 'Restore read-only selected-actions visibility at every scope using selected mode before diagnosing workflow startup failures.',
      protectedMutation: false,
    }));
  }
  const blanketVerifiedScopes = Object.entries(selectedLevels)
    .filter(([, selected]) => selected?.verifiedAllowed === true)
    .map(([scope]) => scope);
  if (blanketVerifiedScopes.length > 0) {
    improvementFindings.push(Object.freeze({
      id: 'VERIFIED_MARKETPLACE_BLANKET_ALLOW',
      severity: 'MEDIUM',
      state: 'REVIEW_RECOMMENDED',
      scopes: Object.freeze(blanketVerifiedScopes),
      recommendation: 'Review replacing blanket verified-Marketplace allowance with the smallest explicit SHA-pinned action allowlist required by CURRENT_MAIN.',
      protectedMutation: true,
    }));
  }
  if (codeSecurityConfiguration?.codeScanningDefaultSetup === 'disabled') {
    improvementFindings.push(Object.freeze({
      id: 'CODE_SCANNING_DEFAULT_SETUP_DISABLED',
      severity: 'MEDIUM',
      state: 'REVIEW_RECOMMENDED',
      recommendation: 'Review CodeQL/default setup against current entitlement and existing selective CodeQL architecture before any provider change.',
      protectedMutation: true,
    }));
  }

  return Object.freeze({
    status: knownCore.every(Boolean) && selectedConstraintsComplete
      ? 'PASS'
      : 'PARTIAL_COVERAGE',
    sourcePrecedence: Object.freeze(['enterprise', 'organization', 'repository']),
    lowerScopesCannotBroadenParentPolicy: true,
    actions: Object.freeze({
      execution: actionsExecution,
      shaPinningRequired,
      defaultWorkflowPermissions,
      canApprovePullRequestReviews,
      selectedConstraintsComplete,
      levels: actionLevels,
      selectedActions: selectedLevels,
    }),
    deploymentEnvironments: environmentInventory,
    codeSecurity: codeSecurityConfiguration,
    improvementFindings: Object.freeze(improvementFindings),
  });
}
