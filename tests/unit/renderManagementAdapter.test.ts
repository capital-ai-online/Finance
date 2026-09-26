import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  EXPECTED_FINANCE_SERVICE,
  EXPECTED_REGISTRY_CREDENTIAL,
  EXPECTED_STALE_STATIC_SITE,
  EXPECTED_SUSPENDED_VALIDATION_SERVICES,
  buildRenderSettingsInventory,
  buildVerifiedSuspendedValidationServiceDeletionPlan,
  deleteExactStaleStaticSite,
  deleteUnusedRegistryCredential,
  disableFinancePrPreviews,
  describeSpendLimitCapability,
  planSuspendedValidationServiceDeletion,
  registryCredentialConsumers,
  triggerRenderExactCommitDeploy,
} from '../../scripts/operations/renderManagementAdapter.mjs';

function response(status: number, body: unknown = null) {
  return {
    status,
    json: async () => body,
  } as Response;
}

describe('Render management adapter', () => {
  it('freezes deletion to the exact 22 suspended validation services and never Finance', () => {
    const services = [
      ...EXPECTED_SUSPENDED_VALIDATION_SERVICES.map((entry) => ({
        ...entry,
        suspended: 'suspended',
      })),
      {
        ...EXPECTED_FINANCE_SERVICE,
        suspended: 'not_suspended',
      },
    ];

    const plan = planSuspendedValidationServiceDeletion(services);
    expect(plan.expectedCount).toBe(22);
    expect(plan.candidateCount).toBe(22);
    expect(plan.blockedCount).toBe(0);
    expect(plan.candidates.some((entry) => entry.id === EXPECTED_FINANCE_SERVICE.id)).toBe(false);
  });

  it('blocks identity drift instead of deleting a recycled or repurposed service id', () => {
    const expected = EXPECTED_SUSPENDED_VALIDATION_SERVICES[0];
    const plan = planSuspendedValidationServiceDeletion([{
      ...expected,
      name: 'different-service',
      suspended: 'suspended',
    }]);
    expect(plan.blockedCount).toBe(1);
    expect(plan.candidateCount).toBe(0);
  });

  it('does not treat a service omitted from LIST as absent when exact-ID GET still sees it', async () => {
    const hidden = EXPECTED_SUSPENDED_VALIDATION_SERVICES[0];
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const method = String(init?.method || 'GET').toUpperCase();
      expect(method).toBe('GET');

      if (url.includes('/services?')) {
        return response(200, [{
          ...EXPECTED_FINANCE_SERVICE,
          branch: 'main',
          suspended: 'not_suspended',
          autoDeployTrigger: 'off',
          serviceDetails: {
            previews: { generation: 'automatic' },
            pullRequestPreviewsEnabled: 'yes',
          },
        }]);
      }

      const directId = url.split('/services/')[1];
      if (directId === hidden.id) {
        return response(200, {
          ...hidden,
          suspended: 'suspended',
        });
      }
      return response(404, { message: 'not found' });
    });

    const plan = await buildVerifiedSuspendedValidationServiceDeletionPlan({
      apiKey: 'test-token',
      workspaceId: 'workspace',
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(plan.verificationMode).toBe('LIST_PLUS_EXACT_ID_READ');
    expect(plan.candidateCount).toBe(1);
    expect(plan.candidates[0]).toEqual(hidden);
    expect(plan.alreadyAbsentCount).toBe(21);
    expect(plan.blockedCount).toBe(0);
  });

  it('deletes only the exact stale static site and proves it absent afterwards', async () => {
    let exists = true;
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const method = String(init?.method || 'GET').toUpperCase();
      expect(url).toBe(`https://api.render.com/v1/services/${EXPECTED_STALE_STATIC_SITE.id}`);

      if (method === 'GET') {
        if (!exists) return response(404, { message: 'not found' });
        return response(200, {
          ...EXPECTED_STALE_STATIC_SITE,
          suspended: 'suspended',
        });
      }
      if (method === 'DELETE') {
        exists = false;
        return response(204);
      }
      throw new Error(`unexpected method: ${method}`);
    });

    const result = await deleteExactStaleStaticSite({
      apiKey: 'test-token',
      confirmation: 'DELETE_EXACT_STALE_STATIC_SITE_SRV_DAEMCSEQ1P3S739VD40G',
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(result).toMatchObject({
      status: 'PASS',
      mutationPerformed: true,
      providerDeleteStatus: 204,
      serviceId: EXPECTED_STALE_STATIC_SITE.id,
      financeProtected: true,
    });
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes(EXPECTED_FINANCE_SERVICE.id))).toBe(false);
  });

  it('disables Finance PR previews with exact identity and immediate after-readback', async () => {
    let disabled = false;
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const method = String(init?.method || 'GET').toUpperCase();
      expect(url).toBe(`https://api.render.com/v1/services/${EXPECTED_FINANCE_SERVICE.id}`);

      if (method === 'GET') {
        return response(200, {
          ...EXPECTED_FINANCE_SERVICE,
          branch: 'main',
          suspended: 'not_suspended',
          autoDeployTrigger: 'off',
          serviceDetails: {
            previews: { generation: disabled ? 'off' : 'automatic' },
            pullRequestPreviewsEnabled: disabled ? 'no' : 'yes',
          },
        });
      }

      if (method === 'PATCH') {
        expect(JSON.parse(String(init?.body))).toEqual({
          serviceDetails: {
            pullRequestPreviewsEnabled: 'no',
            previews: { generation: 'off' },
          },
        });
        disabled = true;
        return response(200, {});
      }

      throw new Error(`unexpected method: ${method}`);
    });

    const result = await disableFinancePrPreviews({
      apiKey: 'test-token',
      confirmation: 'DISABLE_FINANCE_PR_PREVIEWS',
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(result).toEqual({
      status: 'PASS',
      mutationPerformed: true,
      serviceId: EXPECTED_FINANCE_SERVICE.id,
      before: {
        pullRequestPreviewsEnabled: 'yes',
        previewGeneration: 'automatic',
      },
      after: {
        pullRequestPreviewsEnabled: 'no',
        previewGeneration: 'off',
      },
    });
  });

  it('detects Render services that still consume the GHCR registry credential', () => {
    const consumers = registryCredentialConsumers([{
      id: EXPECTED_FINANCE_SERVICE.id,
      name: EXPECTED_FINANCE_SERVICE.name,
      type: EXPECTED_FINANCE_SERVICE.type,
      serviceDetails: {
        envSpecificDetails: {
          registryCredential: {
            id: EXPECTED_REGISTRY_CREDENTIAL.id,
          },
        },
      },
    }]);
    expect(consumers).toEqual([{
      id: EXPECTED_FINANCE_SERVICE.id,
      name: EXPECTED_FINANCE_SERVICE.name,
      type: EXPECTED_FINANCE_SERVICE.type,
    }]);
  });

  it('refuses registry credential deletion while Finance still references it', async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-token' });
      if (url.includes('/services?')) {
        return response(200, [{
          id: EXPECTED_FINANCE_SERVICE.id,
          name: EXPECTED_FINANCE_SERVICE.name,
          type: EXPECTED_FINANCE_SERVICE.type,
          suspended: 'not_suspended',
          serviceDetails: {
            envSpecificDetails: {
              registryCredential: {
                id: EXPECTED_REGISTRY_CREDENTIAL.id,
              },
            },
          },
        }]);
      }
      throw new Error('unexpected provider call');
    });

    const result = await deleteUnusedRegistryCredential({
      apiKey: 'test-token',
      workspaceId: 'workspace',
      confirmation: 'DELETE_UNUSED_RENDER_REGISTRY_CREDENTIAL',
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(result.status).toBe('BLOCKED_IN_USE');
    expect(result.mutationPerformed).toBe(false);
    expect(fetchImpl.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);
  });

  it('reports the 480-minute request truthfully as unsupported by the public Render API', () => {
    const capability = describeSpendLimitCapability();
    expect(capability.status).toBe('NOT_SUPPORTED_BY_PUBLIC_API');
    expect(capability.requestedWarningThresholdMinutes).toBe(480);
    expect(capability.includedHobbyPipelineMinutes).toBe(500);
    expect(capability.requestedRecipient).toBe('support@capital-ai.online');
    expect(capability.exactUsageReadback).toBe('NOT_OBSERVABLE_VIA_RENDER_PUBLIC_API');
  });

  it('projects plan limits, service settings, custom domains, workflows, notifications and bandwidth read-only', async () => {
    const historical = EXPECTED_SUSPENDED_VALIDATION_SERVICES[0];
    const calls: Array<{ url: string; method: string }> = [];
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const method = String(init?.method || 'GET').toUpperCase();
      calls.push({ url, method });
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-token' });

      if (url.includes('/services?')) {
        return response(200, [
          {
            ...EXPECTED_FINANCE_SERVICE,
            suspended: 'not_suspended',
            branch: 'main',
            autoDeploy: 'no',
            autoDeployTrigger: 'off',
            notifyOnFail: 'default',
            serviceDetails: {
              plan: 'starter',
              buildPlan: 'starter',
              region: 'frankfurt',
              healthCheckPath: '/healthz',
              cache: { profile: 'no-cache' },
              previews: { generation: 'off' },
              pullRequestPreviewsEnabled: 'no',
              renderSubdomainPolicy: 'disabled',
              runtime: 'docker',
              numInstances: 1,
              envSpecificDetails: {
                registryCredential: {
                  id: EXPECTED_REGISTRY_CREDENTIAL.id,
                  name: EXPECTED_REGISTRY_CREDENTIAL.name,
                  registry: EXPECTED_REGISTRY_CREDENTIAL.registry,
                  username: 'must-not-project',
                },
              },
            },
          },
          {
            ...historical,
            suspended: 'suspended',
            autoDeploy: 'no',
            serviceDetails: {
              buildPlan: 'starter',
              previews: { generation: 'off' },
              pullRequestPreviewsEnabled: 'no',
            },
          },
        ]);
      }
      if (url.includes(`/services/${EXPECTED_FINANCE_SERVICE.id}/custom-domains`)) {
        return response(200, [
          { id: 'cd-1', name: 'capital-ai.online', domainType: 'apex', verificationStatus: 'verified' },
          { id: 'cd-2', name: 'mta-sts.capital-ai.online', domainType: 'subdomain', verificationStatus: 'verified' },
        ]);
      }
      if (url.includes(`/services/${historical.id}/custom-domains`)) {
        return response(200, []);
      }
      if (url.includes('/workflows?')) return response(200, []);
      if (url.includes('/tasks?')) return response(200, []);
      if (url.includes('/task-runs?')) return response(200, []);
      if (url.includes('/notification-settings/overrides/services/')) {
        return response(200, {
          notificationsToSend: 'default',
          previewNotificationsEnabled: 'false',
        });
      }
      if (url.includes('/metrics/bandwidth?')) {
        return response(200, {
          metrics: [{
            type: 'bandwidth_usage',
            data: [{
              unit: 'mb',
              values: [
                { timestamp: '2026-09-01T00:00:00Z', value: 512 },
                { timestamp: '2026-09-01T01:00:00Z', value: 512 },
              ],
            }],
          }],
        });
      }
      throw new Error(`unexpected provider call: ${url}`);
    });

    const inventory = await buildRenderSettingsInventory({
      apiKey: 'test-token',
      workspaceId: 'tea-test',
      workspacePlan: 'hobby',
      now: new Date('2026-09-24T16:10:00.000Z'),
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(inventory.status).toBe('PASS');
    expect(inventory.workspace.plan).toBe('hobby');
    expect(inventory.workspace.limits).toMatchObject({
      serviceLimit: 25,
      customDomainLimit: 2,
      includedBandwidthGb: 5,
      includedPipelineMinutes: 500,
    });
    expect(inventory.workspace.services).toEqual({ used: 2, included: 25, remaining: 23 });
    expect(inventory.workspace.customDomains).toMatchObject({ used: 2, included: 2, remaining: 0 });
    expect(inventory.workspace.bandwidth.financeMonthToDate?.approxGb).toBe(1);
    expect(inventory.services.find((service) => service.id === EXPECTED_FINANCE_SERVICE.id)).toMatchObject({
      computePlan: 'starter',
      buildPlan: 'starter',
      region: 'frankfurt',
      healthCheckPath: '/healthz',
      cacheProfile: 'no-cache',
      autoDeploy: 'no',
      pullRequestPreviewsEnabled: 'no',
      renderSubdomainPolicy: 'disabled',
    });
    expect(inventory.workflows.count).toBe(0);
    expect(inventory.tasks.count).toBe(0);
    expect(inventory.taskRuns.count).toBe(0);
    expect(inventory.notifications.financeOverride).toEqual({
      notificationsToSend: 'default',
      previewNotificationsEnabled: 'false',
    });
    expect(inventory.edgeCaching).toMatchObject({
      financeCurrentProfile: 'no-cache',
      recommendation: 'common-static-files',
      recommendationStatus: 'READ_ONLY_RECOMMENDATION_NOT_APPLIED',
    });
    expect(JSON.stringify(inventory)).not.toContain('must-not-project');
    expect(JSON.stringify(inventory)).not.toContain('test-token');
    expect(calls.every((call) => call.method === 'GET')).toBe(true);
  });

  it('triggers only the exact Finance commit through the Render API without projecting credentials', async () => {
    const exactSha = '1234567890abcdef1234567890abcdef12345678';
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      expect(String(input)).toBe(`https://api.render.com/v1/services/${EXPECTED_FINANCE_SERVICE.id}/deploys`);
      expect(init?.method).toBe('POST');
      expect(init?.headers).toMatchObject({
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      });
      expect(JSON.parse(String(init?.body))).toEqual({
        commitId: exactSha,
        clearCache: 'do_not_clear',
      });
      return response(201, { id: 'dep-exact', status: 'build_in_progress' });
    });

    const result = await triggerRenderExactCommitDeploy({
      apiKey: 'test-token',
      commitId: exactSha,
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(result).toEqual({
      status: 'TRIGGERED',
      serviceId: EXPECTED_FINANCE_SERVICE.id,
      commitId: exactSha,
      deployId: 'dep-exact',
      deployStatus: 'build_in_progress',
      credentialProjected: false,
    });
    expect(JSON.stringify(result)).not.toContain('test-token');

    await expect(triggerRenderExactCommitDeploy({
      apiKey: 'test-token',
      serviceId: 'srv-other',
      commitId: exactSha,
      fetchImpl: fetchImpl as typeof fetch,
    })).rejects.toThrow(/exact Finance service id required/);
  });

  it('keeps the management workflow owner/main-bound and without OIDC authority', () => {
    const yaml = fs.readFileSync('.github/workflows/render-management.yml', 'utf8');
    expect(yaml).toContain("github.ref == 'refs/heads/main'");
    expect(yaml).toContain("github.actor == 'SvenKulessa'");
    expect(yaml).toContain('CAPITAL_AI_RENDER_API_KEY');
    expect(yaml).toContain('CAPITAL_AI_RENDER_WORKSPACE_PLAN');
    expect(yaml).toContain('delete-suspended-validation-services');
    expect(yaml).toContain('delete-exact-stale-static-site');
    expect(yaml).toContain('delete-unused-registry-credential');
    expect(yaml).toContain('disable-finance-pr-previews');
    expect(yaml).not.toContain('id-token: write');
    expect(yaml).not.toContain('issues: write');
    expect(yaml).not.toContain('pull-requests: write');
  });
});
