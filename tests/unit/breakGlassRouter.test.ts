import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  checkAdminAccess: vi.fn(),
  requireStepUp: vi.fn(),
  writeAgentAuditEvent: vi.fn(),
}));

vi.mock('../../src/platform/Security/authMiddleware', () => ({
  checkAdminAccess: mocks.checkAdminAccess,
  requireStepUp: mocks.requireStepUp,
}));
vi.mock('../../server/agentAudit/agentAuditWriter', () => ({
  writeAgentAuditEvent: mocks.writeAgentAuditEvent,
}));

import { breakGlassRouter } from '../../server/systemadmin/breakGlassRouter';
import { resetRateLimit } from '../../src/platform/Security/rateLimiter';
import { MAX_BREAK_GLASS_DURATION_MS } from '../../src/platform/Security/breakGlass';

const OWNER_AUTHZ = Object.freeze({
  authorized: true,
  role: 'owner' as const,
  reason: undefined,
  actorLabel: 'sven.kulessa@gmail.com',
  userId: 'owner-user-1',
});

const DENIED_AUTHZ = Object.freeze({
  authorized: false,
  role: null,
  reason: 'not-owner',
  actorLabel: 'unknown',
});

function validActivationBody(overrides: Record<string, unknown> = {}) {
  return {
    capability: 'READ',
    targetResource: 'github:SvenKulessa/Finance',
    reason: 'M9 break-glass router HTTP test',
    roadmapItem: 'M9-BREAK-GLASS-LIVE-WIRING',
    allowedPaths: ['docs/evidence/m9/**'],
    ...overrides,
  };
}

async function withServer(fn: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use('/api/systemadmin/break-glass', breakGlassRouter);
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const value = app.listen(0, '127.0.0.1', () => resolve(value));
  });
  try {
    const address = server.address() as AddressInfo;
    await fn(`http://127.0.0.1:${address.port}/api/systemadmin/break-glass`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
  }
}

async function activate(baseUrl: string, body: unknown = validActivationBody()) {
  return fetch(`${baseUrl}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimit('break-glass-activate:127.0.0.1');
  mocks.checkAdminAccess.mockResolvedValue(OWNER_AUTHZ);
  mocks.requireStepUp.mockResolvedValue(true);
  mocks.writeAgentAuditEvent.mockResolvedValue('supabase:agent_audit_events:test-1');
});

afterEach(() => vi.restoreAllMocks());

describe('Break-Glass router: POST /activate', () => {
  it('rejects a non-owner caller before evaluating the request body', async () => {
    mocks.checkAdminAccess.mockResolvedValue(DENIED_AUTHZ);
    await withServer(async (baseUrl) => {
      const response = await activate(baseUrl);
      expect(response.status).toBe(403);
      expect(mocks.requireStepUp).not.toHaveBeenCalled();
      expect(mocks.writeAgentAuditEvent).not.toHaveBeenCalled();
    });
  });

  it('rejects activation without a fresh step-up (428)', async () => {
    mocks.requireStepUp.mockResolvedValue(false);
    await withServer(async (baseUrl) => {
      const response = await activate(baseUrl);
      expect(response.status).toBe(428);
      const json = await response.json();
      expect(json.code).toBe('step_up_required');
      expect(mocks.writeAgentAuditEvent).not.toHaveBeenCalled();
    });
  });

  it('issues an active mandate for an authorized, eligible request and audits ALLOW', async () => {
    await withServer(async (baseUrl) => {
      const response = await activate(baseUrl);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.mandate.mandateId).toMatch(/^REM-BREAK-GLASS-/);
      expect(json.mandate.allowedCapabilities).toEqual(['READ']);
      expect(mocks.writeAgentAuditEvent).toHaveBeenCalledTimes(1);
      expect(mocks.writeAgentAuditEvent.mock.calls[0]?.[0]).toMatchObject({
        decision: 'ALLOW',
        result: 'SUCCESS',
        policyId: 'ADR-0063/M9-BREAK-GLASS',
      });
    });
  });

  it('denies an ineligible capability and audits DENY without persisting a mandate', async () => {
    await withServer(async (baseUrl) => {
      const response = await activate(baseUrl, validActivationBody({ capability: 'PRODUCTION_MUTATION' }));
      expect(response.status).toBe(403);
      expect(mocks.writeAgentAuditEvent).toHaveBeenCalledTimes(1);
      expect(mocks.writeAgentAuditEvent.mock.calls[0]?.[0]).toMatchObject({ decision: 'DENY', result: 'DENIED' });
    });
  });

  it('rate-limits repeated activation attempts from the same IP', async () => {
    await withServer(async (baseUrl) => {
      for (let i = 0; i < 5; i += 1) {
        const response = await activate(baseUrl, validActivationBody({ roadmapItem: `M9-BREAK-GLASS-LIVE-WIRING-${i}` }));
        expect(response.status).toBe(200);
      }
      const response = await activate(baseUrl);
      expect(response.status).toBe(429);
    });
  });
});

describe('Break-Glass router: POST /revoke and GET /status', () => {
  it('revokes an active mandate and reflects it in /status', async () => {
    await withServer(async (baseUrl) => {
      const activateResponse = await activate(baseUrl);
      const { mandate } = await activateResponse.json();

      const statusBefore = await fetch(`${baseUrl}/status/${mandate.mandateId}`);
      expect(statusBefore.status).toBe(200);
      expect(await statusBefore.json()).toMatchObject({ active: true, revoked: false });

      const revokeResponse = await fetch(`${baseUrl}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandateId: mandate.mandateId }),
      });
      expect(revokeResponse.status).toBe(200);
      expect(await revokeResponse.json()).toEqual({ revoked: true });
      expect(mocks.writeAgentAuditEvent).toHaveBeenCalledTimes(2); // activation + revocation

      const statusAfter = await fetch(`${baseUrl}/status/${mandate.mandateId}`);
      expect(statusAfter.status).toBe(200);
      expect(await statusAfter.json()).toMatchObject({ active: false, revoked: true });
    });
  });

  it('returns 404 for revoke of an unknown mandateId', async () => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandateId: 'REM-BREAK-GLASS-DOES-NOT-EXIST' }),
      });
      expect(response.status).toBe(404);
    });
  });

  it('returns 404 for status of an unknown mandateId', async () => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/status/REM-BREAK-GLASS-DOES-NOT-EXIST`);
      expect(response.status).toBe(404);
    });
  });

  it('rejects revoke from a non-owner caller', async () => {
    mocks.checkAdminAccess.mockResolvedValue(DENIED_AUTHZ);
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandateId: 'REM-BREAK-GLASS-IRRELEVANT' }),
      });
      expect(response.status).toBe(403);
    });
  });

  it('rejects status lookup from a non-owner caller', async () => {
    mocks.checkAdminAccess.mockResolvedValue(DENIED_AUTHZ);
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/status/REM-BREAK-GLASS-IRRELEVANT`);
      expect(response.status).toBe(403);
    });
  });

  it('M9 drill: automatically expires without explicit revocation once MAX_BREAK_GLASS_DURATION_MS has elapsed', async () => {
    vi.useFakeTimers();
    try {
      await withServer(async (baseUrl) => {
        const activateResponse = await activate(baseUrl);
        const { mandate } = await activateResponse.json();

        const statusWithinWindow = await fetch(`${baseUrl}/status/${mandate.mandateId}`);
        expect(await statusWithinWindow.json()).toMatchObject({ active: true, revoked: false });

        vi.setSystemTime(new Date(Date.now() + MAX_BREAK_GLASS_DURATION_MS + 1_000));

        const statusAfterExpiry = await fetch(`${baseUrl}/status/${mandate.mandateId}`);
        expect(await statusAfterExpiry.json()).toMatchObject({ active: false, revoked: false });
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
