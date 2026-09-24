import { describe, expect, it, vi } from 'vitest';
import {
  ENTERPRISE_WORKFLOW_PERMISSIONS_TARGET,
  createGitHubEnterpriseWorkflowPermissionsWriter,
} from '../../scripts/operations/githubEnterpriseWorkflowPermissionsWriter.mjs';

const ENTERPRISE = 'capital-ai-online';
const TOKEN = 'ghp_test_admin_enterprise_token_1234567890';

function response(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('GitHub Enterprise Workflow Permissions Writer', () => {
  it('is an idempotent NOOP when the Enterprise is already hardened', async () => {
    const fetchImpl = vi.fn(async () => response({
      default_workflow_permissions: 'read',
      can_approve_pull_request_reviews: false,
    }));

    const writer = createGitHubEnterpriseWorkflowPermissionsWriter({
      enterprise: ENTERPRISE,
      enterpriseAdminPat: TOKEN,
      fetchImpl: fetchImpl as typeof fetch,
    });
    const result = await writer.ensure();

    expect(result).toEqual({
      status: 'NOOP_ALREADY_HARDENED',
      mutationPerformed: false,
      before: ENTERPRISE_WORKFLOW_PERMISSIONS_TARGET,
      after: ENTERPRISE_WORKFLOW_PERMISSIONS_TARGET,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[1]?.method).toBe('GET');
  });

  it('changes only PR-review approval and verifies the exact readback', async () => {
    const calls: Array<{ method: string; body?: string }> = [];
    let reads = 0;
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const method = String(init?.method || 'GET');
      calls.push({ method, body: typeof init?.body === 'string' ? init.body : undefined });
      if (method === 'GET') {
        reads += 1;
        return response({
          default_workflow_permissions: 'read',
          can_approve_pull_request_reviews: reads === 1,
        });
      }
      if (method === 'PUT') return response(null, 204);
      throw new Error(`unexpected method: ${method}`);
    });

    const writer = createGitHubEnterpriseWorkflowPermissionsWriter({
      enterprise: ENTERPRISE,
      enterpriseAdminPat: TOKEN,
      fetchImpl: fetchImpl as typeof fetch,
    });
    const result = await writer.ensure();

    expect(result).toMatchObject({
      status: 'UPDATED_AND_VERIFIED',
      mutationPerformed: true,
      before: {
        defaultWorkflowPermissions: 'read',
        canApprovePullRequestReviews: true,
      },
      after: ENTERPRISE_WORKFLOW_PERMISSIONS_TARGET,
    });
    expect(calls.map((call) => call.method)).toEqual(['GET', 'PUT', 'GET']);
    expect(JSON.parse(calls[1]?.body || '{}')).toEqual({
      default_workflow_permissions: 'read',
      can_approve_pull_request_reviews: false,
    });
  });

  it('fails closed without PUT when default workflow permissions unexpectedly differ', async () => {
    const fetchImpl = vi.fn(async () => response({
      default_workflow_permissions: 'write',
      can_approve_pull_request_reviews: true,
    }));

    const writer = createGitHubEnterpriseWorkflowPermissionsWriter({
      enterprise: ENTERPRISE,
      enterpriseAdminPat: TOKEN,
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(writer.ensure()).rejects.toThrow(/precondition failed/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[1]?.method).toBe('GET');
  });

  it('fails if post-write readback does not match the fixed desired state', async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const method = String(init?.method || 'GET');
      if (method === 'PUT') return response(null, 204);
      return response({
        default_workflow_permissions: 'read',
        can_approve_pull_request_reviews: true,
      });
    });

    const writer = createGitHubEnterpriseWorkflowPermissionsWriter({
      enterprise: ENTERPRISE,
      enterpriseAdminPat: TOKEN,
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(writer.ensure()).rejects.toThrow(/post-write readback/);
  });

  it('does not expose the PAT or provider body in HTTP errors', async () => {
    const fetchImpl = vi.fn(async () => response({
      message: `denied for token ${TOKEN}`,
      documentation_url: 'https://example.invalid/secret',
    }, 403));

    const writer = createGitHubEnterpriseWorkflowPermissionsWriter({
      enterprise: ENTERPRISE,
      enterpriseAdminPat: TOKEN,
      fetchImpl: fetchImpl as typeof fetch,
    });

    let caught: unknown;
    try {
      await writer.ensure();
    } catch (error) {
      caught = error;
    }

    const message = String((caught as Error)?.message || caught);
    expect(message).toContain('HTTP 403');
    expect(message).not.toContain(TOKEN);
    expect(message).not.toContain('documentation_url');
    expect(message).not.toContain('example.invalid');
  });

  it('exposes no arbitrary provider mutation surface', () => {
    const writer = createGitHubEnterpriseWorkflowPermissionsWriter({
      enterprise: ENTERPRISE,
      enterpriseAdminPat: TOKEN,
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });

    expect(writer.describeBoundary()).toEqual({
      enterprise: ENTERPRISE,
      endpoint: `/enterprises/${ENTERPRISE}/actions/permissions/workflow`,
      publicMethods: ['GET', 'PUT'],
      rawProxy: false,
      desiredState: ENTERPRISE_WORKFLOW_PERMISSIONS_TARGET,
      tokenPersistence: false,
    });
    expect(Object.keys(writer).sort()).toEqual(['describeBoundary', 'ensure']);
  });
});
