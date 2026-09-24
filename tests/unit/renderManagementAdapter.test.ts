import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  EXPECTED_FINANCE_SERVICE,
  EXPECTED_REGISTRY_CREDENTIAL,
  EXPECTED_SUSPENDED_VALIDATION_SERVICES,
  buildRenderSettingsInventory,
  deleteUnusedRegistryCredential,
  describeSpendLimitCapability,
  planSuspendedValidationServiceDeletion,
  registryCredentialConsumers,
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

  it('keeps the management workflow owner/main-bound and without OIDC authority', () => {
    const yaml = fs.readFileSync('.github/workflows/render-management.yml', 'utf8');
    expect(yaml).toContain("github.ref == 'refs/heads/main'");
    expect(yaml).toContain("github.actor == 'SvenKulessa'");
    expect(yaml).toContain('CAPITAL_AI_RENDER_API_KEY');
    expect(yaml).toContain('CAPITAL_AI_RENDER_WORKSPACE_PLAN');
    expect(yaml).toContain('delete-suspended-validation-services');
    expect(yaml).toContain('delete-unused-registry-credential');
    expect(yaml).not.toContain('id-token: write');
    expect(yaml).not.toContain('issues: write');
    expect(yaml).not.toContain('pull-requests: write');
  });
});
