import { describe, expect, it } from 'vitest';
import {
  projectArtifactStorageInventory,
  projectCacheStorageLimit,
  projectCacheUsage,
  projectSelectedActions,
  projectEnvironmentInventory,
  projectCodeSecurityConfiguration,
  projectEffectiveSettingsPolicy,
  projectCapturedSetting,
  projectCodeSecurityConfigurationCatalog,
  projectCustomPropertySchema,
  projectOrganizationSettings,
  projectRulesetInventory,
  projectRunnerGroupInventory,
  projectRunnerInventory,
  projectSelectedAccountInventory,
  projectUserEmailInventory,
  projectUserKeyInventory,
  projectUserProfile,
} from '../../scripts/operations/githubSettingsInventoryProjection.mjs';

describe('GitHub settings storage projection', () => {
  it('normalizes repository and organization cache usage shapes', () => {
    expect(projectCacheUsage({
      full_name: 'capital-ai-online/Finance',
      active_caches_size_in_bytes: 1024,
      active_caches_count: 2,
    })).toEqual({
      activeCachesCount: 2,
      activeCachesSizeInBytes: 1024,
      activeCachesSizeGiB: 0.000001,
      fullName: 'capital-ai-online/Finance',
    });

    expect(projectCacheUsage({
      total_active_caches_size_in_bytes: 2048,
      total_active_caches_count: 3,
    })).toEqual({
      activeCachesCount: 3,
      activeCachesSizeInBytes: 2048,
      activeCachesSizeGiB: 0.000002,
      fullName: null,
    });
  });

  it('projects cache limits without mutation semantics', () => {
    expect(projectCacheStorageLimit({ max_cache_size_gb: 10 })).toEqual({
      maxCacheSizeGiB: 10,
    });
  });

  it('sums only active artifact bytes and redacts names and workflow identity', () => {
    expect(projectArtifactStorageInventory({
      total_count: 3,
      artifacts: [
        { name: 'one', size_in_bytes: 1024, expired: false, workflow_run: { id: 1 } },
        { name: 'two', size_in_bytes: 2048, expired: false, workflow_run: { id: 2 } },
        { name: 'old', size_in_bytes: 4096, expired: true, workflow_run: { id: 3 } },
      ],
    })).toEqual({
      totalCount: 3,
      observedCount: 3,
      activeCount: 2,
      expiredCount: 1,
      activeSizeInBytes: 3072,
      activeSizeGiB: 0.000003,
      namesRedacted: true,
      workflowIdentityRedacted: true,
    });
  });
});


describe('GitHub multi-scope settings projections', () => {
  it('projects organization policy fields while redacting contact addresses', () => {
    expect(projectOrganizationSettings({
      login: 'capital-ai-online',
      default_repository_permission: 'read',
      members_can_create_repositories: false,
      members_can_create_public_repositories: false,
      members_can_create_private_repositories: true,
      members_can_create_internal_repositories: false,
      members_can_fork_private_repositories: false,
      members_can_create_pages: false,
      web_commit_signoff_required: true,
      two_factor_requirement_enabled: true,
      email: 'private@example.test',
      billing_email: 'billing@example.test',
    })).toEqual({
      login: 'capital-ai-online',
      defaultRepositoryPermission: 'read',
      membersCanCreateRepositories: false,
      membersCanCreatePublicRepositories: false,
      membersCanCreatePrivateRepositories: true,
      membersCanCreateInternalRepositories: false,
      membersCanForkPrivateRepositories: false,
      membersCanCreatePages: false,
      webCommitSignoffRequired: true,
      twoFactorRequirementEnabled: true,
      emailRedacted: true,
      billingEmailRedacted: true,
    });
  });

  it('projects selected-account, runner and runner-group inventory without identities', () => {
    expect(projectSelectedAccountInventory({
      total_count: 2,
      items: [{ login: 'one' }, { login: 'two' }],
    })).toEqual({
      totalCount: 2,
      observedCount: 2,
      identitiesRedacted: true,
    });

    expect(projectRunnerInventory({
      total_count: 2,
      items: [
        { name: 'one', status: 'online', busy: true, labels: [{ name: 'prod' }] },
        { name: 'two', status: 'offline', busy: false },
      ],
    })).toEqual({
      totalCount: 2,
      observedCount: 2,
      statuses: ['offline', 'online'],
      busyCount: 1,
      offlineCount: 1,
      namesRedacted: true,
      labelsRedacted: true,
      identitiesRedacted: true,
    });

    expect(projectRunnerGroupInventory({
      total_count: 1,
      items: [{ name: 'prod', visibility: 'selected', allows_public_repositories: false }],
    })).toEqual({
      totalCount: 1,
      observedCount: 1,
      visibilities: ['selected'],
      allowsPublicRepositories: false,
      namesRedacted: true,
      selectedRepositoryIdentitiesRedacted: true,
      selectedWorkflowIdentitiesRedacted: true,
    });
  });

  it('projects security configuration catalogs and property schemas without protected values', () => {
    expect(projectCodeSecurityConfigurationCatalog({
      total_count: 1,
      items: [{
        id: 44,
        name: 'enterprise-default',
        target_type: 'global',
        enforcement: 'enforced',
        advanced_security: 'disabled',
        code_scanning_default_setup: 'disabled',
        secret_scanning: 'disabled',
        secret_scanning_push_protection: 'disabled',
      }],
    })).toEqual({
      totalCount: 1,
      observedCount: 1,
      targetTypes: ['global'],
      enforcementStates: ['enforced'],
      advancedSecurityStates: ['disabled'],
      codeScanningDefaultSetupStates: ['disabled'],
      secretScanningStates: ['disabled'],
      secretScanningPushProtectionStates: ['disabled'],
      configurationIdentitiesRedacted: true,
    });

    expect(projectCustomPropertySchema([
      {
        property_name: 'environment',
        value_type: 'single_select',
        required: true,
        allowed_values: ['production'],
        default_value: 'production',
      },
    ])).toEqual({
      propertyCount: 1,
      propertyNames: ['environment'],
      valueTypes: ['single_select'],
      requiredCount: 1,
      allowedValuesRedacted: true,
      defaultValuesRedacted: true,
    });
  });

  it('redacts user contact and cryptographic identity material', () => {
    expect(projectUserProfile({
      login: 'owner',
      type: 'User',
      site_admin: false,
      two_factor_authentication: true,
      email: 'private@example.test',
      name: 'Private Name',
      company: 'Private Co',
      location: 'Private City',
      plan: { name: 'free' },
      total_private_repos: 4,
      owned_private_repos: 3,
    })).toEqual({
      login: 'owner',
      accountType: 'User',
      siteAdmin: false,
      twoFactorAuthentication: true,
      planName: 'free',
      privateRepos: 4,
      ownedPrivateRepos: 3,
      emailRedacted: true,
      nameRedacted: true,
      companyRedacted: true,
      locationRedacted: true,
    });

    expect(projectUserEmailInventory([
      { email: 'one@example.test', primary: true, verified: true, visibility: 'private' },
      { email: 'two@example.test', primary: false, verified: false, visibility: null },
    ])).toEqual({
      totalCount: 2,
      primaryCount: 1,
      verifiedCount: 1,
      visibilities: ['private'],
      addressesRedacted: true,
    });

    const projectedKeys = projectUserKeyInventory([
      {
        title: 'private-title',
        key: 'ssh-ed25519 SECRET',
        raw_key: 'GPG_SECRET',
        expired: false,
        can_sign: true,
        emails: [{ email: 'private@example.test' }],
      },
    ]);
    expect(projectedKeys).toEqual({
      totalCount: 1,
      expiredCount: 0,
      signingCapableCount: 1,
      keyMaterialRedacted: true,
      titlesRedacted: true,
      emailsRedacted: true,
      identitiesRedacted: true,
    });
    expect(JSON.stringify(projectedKeys)).not.toContain('SECRET');
    expect(JSON.stringify(projectedKeys)).not.toContain('private@example.test');
  });

  it('accepts paginated ruleset envelopes without exposing ruleset identity', () => {
    expect(projectRulesetInventory({
      total_count: 1,
      items: [{ id: 1, name: 'protect-main', target: 'branch', enforcement: 'active' }],
    })).toEqual({
      rulesetCount: 1,
      targets: ['branch'],
      enforcementStates: ['active'],
      namesRedacted: true,
      bypassActorsRedacted: true,
    });
  });
});

describe('GitHub settings effective policy projection', () => {

  it('keeps only bounded provider diagnostics and re-redacts unsafe diagnostic text', () => {
    const projected = projectCapturedSetting({
      status: 'NOT_OBSERVABLE',
      requiredPermission: 'Enterprise administration: read',
      providerStatus: 403,
      reason: 'bounded read rejected',
      providerDiagnostics: {
        classification: 'FORBIDDEN',
        oauthScopes: ['read:enterprise', 'admin:enterprise', 'admin:enterprise', 'bad scope value'],
        acceptedOauthScopes: ['admin:enterprise'],
        ssoRequired: false,
        rateLimit: {
          limit: 5000,
          remaining: 4999,
          resetEpochSeconds: 1760000000,
          resource: 'core',
          rawHeader: 'must-not-pass',
        },
        providerReason: 'Denied https://example.test/sso?secret=1 ghp_projection_leak_123',
        rawHeaders: {
          authorization: 'Bearer secret',
        },
      },
    }, (value: unknown) => value);

    expect(projected).toEqual({
      status: 'NOT_OBSERVABLE',
      requiredPermission: 'Enterprise administration: read',
      providerStatus: 403,
      reason: 'bounded read rejected',
      providerDiagnostics: {
        classification: 'FORBIDDEN',
        oauthScopes: ['admin:enterprise', 'read:enterprise'],
        acceptedOauthScopes: ['admin:enterprise'],
        ssoRequired: false,
        rateLimit: {
          limit: 5000,
          remaining: 4999,
          resetEpochSeconds: 1760000000,
          resource: 'core',
        },
        providerReason: 'Denied [REDACTED_URL] [REDACTED_TOKEN]',
      },
    });
    expect(JSON.stringify(projected)).not.toContain('rawHeaders');
    expect(JSON.stringify(projected)).not.toContain('rawHeader');
    expect(JSON.stringify(projected)).not.toContain('ghp_projection_leak_123');
  });

  it('projects selected action constraints without broadening parent policy', () => {
    expect(projectSelectedActions({
      github_owned_allowed: true,
      verified_allowed: false,
      patterns_allowed: ['z/*', 'a/*', 'a/*'],
    })).toEqual({
      githubOwnedAllowed: true,
      verifiedAllowed: false,
      patternsAllowed: ['a/*', 'z/*'],
    });
  });

  it('redacts environment reviewer identity while preserving protection semantics', () => {
    expect(projectEnvironmentInventory({
      total_count: 1,
      environments: [{
        name: 'production',
        protection_rules: [
          { type: 'wait_timer', wait_timer: 10 },
          {
            type: 'required_reviewers',
            prevent_self_review: true,
            reviewers: [
              { type: 'User', reviewer: { login: 'secret-owner' } },
              { type: 'Team', reviewer: { slug: 'ops' } },
            ],
          },
        ],
        deployment_branch_policy: {
          protected_branches: true,
          custom_branch_policies: false,
        },
      }],
    })).toEqual({
      totalCount: 1,
      environments: [{
        name: 'production',
        protectionRuleTypes: ['required_reviewers', 'wait_timer'],
        waitTimerMinutes: 10,
        requiredReviewerCount: 2,
        reviewerTypes: ['Team', 'User'],
        preventSelfReview: true,
        deploymentBranchPolicy: {
          protectedBranches: true,
          customBranchPolicies: false,
        },
        reviewerIdentitiesRedacted: true,
      }],
    });
  });

  it('projects code security settings without configuration or reviewer identity', () => {
    expect(projectCodeSecurityConfiguration({
      status: 'attached',
      configuration: {
        id: 1325,
        name: 'recommended',
        target_type: 'organization',
        enforcement: 'enforced',
        advanced_security: 'enabled',
        dependency_graph: 'enabled',
        code_scanning_default_setup: 'enabled',
        secret_scanning: 'enabled',
        secret_scanning_push_protection: 'enabled',
      },
    })).toMatchObject({
      attachmentStatus: 'attached',
      targetType: 'organization',
      enforcement: 'enforced',
      advancedSecurity: 'enabled',
      dependencyGraph: 'enabled',
      codeScanningDefaultSetup: 'enabled',
      secretScanning: 'enabled',
      secretScanningPushProtection: 'enabled',
      configurationIdentityRedacted: true,
      reviewerIdentitiesRedacted: true,
    });
  });

  it('resolves conservative Enterprise to Organization to Repository ceilings', () => {
    const selected = {
      githubOwnedAllowed: true,
      verifiedAllowed: true,
      patternsAllowed: [],
    };
    const effective = projectEffectiveSettingsPolicy({
      enterpriseActions: {
        enabledOrganizations: 'all',
        enabledRepositories: null,
        enabled: false,
        allowedActions: 'selected',
        shaPinningRequired: true,
      },
      enterpriseWorkflow: {
        defaultWorkflowPermissions: 'read',
        canApprovePullRequestReviews: false,
      },
      enterpriseSelectedActions: selected,
      organizationActions: {
        enabledOrganizations: null,
        enabledRepositories: 'all',
        enabled: false,
        allowedActions: 'selected',
        shaPinningRequired: true,
      },
      organizationWorkflow: {
        defaultWorkflowPermissions: 'read',
        canApprovePullRequestReviews: false,
      },
      organizationSelectedActions: selected,
      repositoryActions: {
        enabledOrganizations: null,
        enabledRepositories: null,
        enabled: true,
        allowedActions: 'selected',
        shaPinningRequired: true,
      },
      repositoryWorkflow: {
        defaultWorkflowPermissions: 'read',
        canApprovePullRequestReviews: false,
      },
      repositorySelectedActions: selected,
    });

    expect(effective.status).toBe('PASS');
    expect(effective.actions.execution).toBe('ENABLED');
    expect(effective.actions.shaPinningRequired).toBe(true);
    expect(effective.actions.defaultWorkflowPermissions).toBe('read');
    expect(effective.actions.canApprovePullRequestReviews).toBe(false);
    expect(effective.actions.selectedConstraintsComplete).toBe(true);
    expect(effective.lowerScopesCannotBroadenParentPolicy).toBe(true);
    expect(effective.improvementFindings).toEqual([
      expect.objectContaining({
        id: 'VERIFIED_MARKETPLACE_BLANKET_ALLOW',
        state: 'REVIEW_RECOMMENDED',
      }),
    ]);
  });

  it('emits fail-closed improvement findings for weak or unobservable policy ceilings', () => {
    const effective = projectEffectiveSettingsPolicy({
      enterpriseActions: {
        enabledOrganizations: 'all',
        allowedActions: 'selected',
        shaPinningRequired: false,
      },
      enterpriseWorkflow: {
        defaultWorkflowPermissions: 'write',
        canApprovePullRequestReviews: true,
      },
      organizationActions: {
        enabledRepositories: 'all',
        allowedActions: 'selected',
        shaPinningRequired: false,
      },
      organizationWorkflow: {
        defaultWorkflowPermissions: 'write',
        canApprovePullRequestReviews: true,
      },
      repositoryActions: {
        enabled: true,
        allowedActions: 'selected',
        shaPinningRequired: false,
      },
      repositoryWorkflow: {
        defaultWorkflowPermissions: 'write',
        canApprovePullRequestReviews: true,
      },
    });

    expect(effective.status).toBe('PARTIAL_COVERAGE');
    expect(effective.improvementFindings.map((finding) => finding.id)).toEqual(expect.arrayContaining([
      'ACTIONS_FULL_SHA_PINNING',
      'DEFAULT_GITHUB_TOKEN_READ_ONLY',
      'ACTIONS_PR_REVIEW_APPROVAL',
      'SELECTED_ACTIONS_OBSERVABILITY',
    ]));
  });
});
