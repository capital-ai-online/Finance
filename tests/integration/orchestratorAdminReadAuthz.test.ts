// FO-01 / ADR-0067 — HTTP-level authorization evidence for administrative Orchestrator reads.
//
// The external identity-verification boundary is mocked deliberately. These tests exercise the
// real Express router/guard composition over node:http and prove that canonical IAM decisions
// are enforced before operational payload handlers run. This follows the repository convention
// of using native node:http + fetch rather than adding supertest.

import http from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPERVISOR_ZONE_ROLES } from '../../src/platform/Security/types';

vi.mock('../../src/platform/Security/authMiddleware', () => ({
  checkAdminAccess: vi.fn(),
}));

vi.mock('../../src/lib/requestOrchestrator', () => ({
  orchestrator: {
    getStats: vi.fn(() => ({ marker: 'AUTHORIZED_STATS_PAYLOAD' })),
    updateConfig: vi.fn(),
    resetStats: vi.fn(),
  },
}));

import { checkAdminAccess } from '../../src/platform/Security/authMiddleware';
import { orchestrator } from '../../src/lib/requestOrchestrator';
import { orchestratorRouter } from '../../server/orchestrator';

const checkAdminAccessMock = vi.mocked(checkAdminAccess);
const getStatsMock = vi.mocked(orchestrator.getStats);

type AuthScenario =
  | 'missing'
  | 'invalid'
  | 'insufficient-role'
  | 'rate-limited'
  | 'supervisor';

function installAuthScenarioResolver() {
  checkAdminAccessMock.mockImplementation(async (req) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return {
        authorized: false,
        role: null,
        reason: 'no-valid-credentials',
        actorLabel: 'unknown',
      };
    }

    switch (authorization) {
      case 'Bearer invalid-token':
        return {
          authorized: false,
          role: null,
          reason: 'no-valid-credentials',
          actorLabel: 'unknown',
        };
      case 'Bearer user-token':
        return {
          authorized: false,
          role: 'user',
          reason: 'insufficient-role',
          actorLabel: 'user-id',
        };
      case 'Bearer rate-token':
        return {
          authorized: false,
          role: null,
          reason: 'rate-limited',
          actorLabel: '127.0.0.1',
        };
      case 'Bearer supervisor-token':
        return {
          authorized: true,
          role: 'supervisor',
          reason: 'iam-role',
          userId: 'supervisor-id',
          actorLabel: 'supervisor-id',
        };
      default:
        return {
          authorized: false,
          role: null,
          reason: 'no-valid-credentials',
          actorLabel: 'unknown',
        };
    }
  });
}

function authorizationFor(scenario: AuthScenario): string | undefined {
  switch (scenario) {
    case 'missing':
      return undefined;
    case 'invalid':
      return 'Bearer invalid-token';
    case 'insufficient-role':
      return 'Bearer user-token';
    case 'rate-limited':
      return 'Bearer rate-token';
    case 'supervisor':
      return 'Bearer supervisor-token';
  }
}

async function requestApp(
  path: '/api/orchestrator/stats' | '/api/orchestrator/ping-models',
  scenario: AuthScenario,
): Promise<{ status: number; text: string; json: unknown }> {
  const app = express();
  app.use('/api/orchestrator', orchestratorRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const { port } = server.address() as AddressInfo;

  try {
    const authorization = authorizationFor(scenario);
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: authorization ? { authorization } : undefined,
    });
    const text = await response.text();
    return {
      status: response.status,
      text,
      json: text ? JSON.parse(text) : null,
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe('FO-01 Orchestrator admin read HTTP authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installAuthScenarioResolver();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const path of [
    '/api/orchestrator/stats',
    '/api/orchestrator/ping-models',
  ] as const) {
    it(`${path} denies a request without bearer credentials before the handler`, async () => {
      const result = await requestApp(path, 'missing');

      expect(result.status).toBe(401);
      expect(result.json).toEqual({ error: 'Ungültiger Zugriff. Zugriff verweigert.' });
      expect(result.text).not.toContain('AUTHORIZED_STATS_PAYLOAD');
    });

    it(`${path} denies an invalid bearer token before the handler`, async () => {
      const result = await requestApp(path, 'invalid');

      expect(result.status).toBe(401);
      expect(result.json).toEqual({ error: 'Ungültiger Zugriff. Zugriff verweigert.' });
      expect(result.text).not.toContain('AUTHORIZED_STATS_PAYLOAD');
    });

    it(`${path} returns HTTP 403 for a valid identity outside SUPERVISOR_ZONE_ROLES`, async () => {
      const result = await requestApp(path, 'insufficient-role');

      expect(result.status).toBe(403);
      expect(result.json).toEqual({ error: 'Ungültiger Zugriff. Zugriff verweigert.' });
      expect(result.text).not.toContain('AUTHORIZED_STATS_PAYLOAD');
    });

    it(`${path} preserves rate-limit denial as HTTP 429`, async () => {
      const result = await requestApp(path, 'rate-limited');

      expect(result.status).toBe(429);
      expect(result.json).toEqual({ error: 'Ungültiger Zugriff. Zugriff verweigert.' });
      expect(result.text).not.toContain('AUTHORIZED_STATS_PAYLOAD');
    });

    it(`${path} permits an IAM-authorized supervisor`, async () => {
      const result = await requestApp(path, 'supervisor');

      expect(result.status).toBe(200);
      expect(result.text).not.toContain('Ungültiger Zugriff. Zugriff verweigert.');
    });
  }

  it('delegates every HTTP decision to the canonical orchestrator IAM zone and role set', async () => {
    await requestApp('/api/orchestrator/stats', 'supervisor');

    expect(checkAdminAccessMock).toHaveBeenCalledTimes(1);
    expect(checkAdminAccessMock).toHaveBeenCalledWith(
      expect.any(Object),
      'orchestrator-config',
      SUPERVISOR_ZONE_ROLES,
    );
    expect(getStatsMock).toHaveBeenCalledTimes(1);
  });

  it('never executes the stats payload handler when IAM denies access', async () => {
    await requestApp('/api/orchestrator/stats', 'missing');
    await requestApp('/api/orchestrator/stats', 'invalid');
    await requestApp('/api/orchestrator/stats', 'insufficient-role');
    await requestApp('/api/orchestrator/stats', 'rate-limited');

    expect(getStatsMock).not.toHaveBeenCalled();
  });
});
