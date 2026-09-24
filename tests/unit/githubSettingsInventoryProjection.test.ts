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
