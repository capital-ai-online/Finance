// FO-03 — HTTP-level evidence for fail-closed, atomic Orchestrator configuration updates.

import http from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/platform/Security/authMiddleware', () => ({
  checkAdminAccess: vi.fn(async () => ({
    authorized: true,
    role: 'supervisor',
    reason: 'iam-role',
    userId: 'supervisor-id',
    actorLabel: 'supervisor-id',
  })),
}));

import { orchestrator } from '../../src/lib/requestOrchestrator';
import { orchestratorRouter } from '../../server/orchestrator';

const DEFAULT_CONFIG = {
  concurrencyLimit: 3,
  maxQueueSize: 10,
  maxRequestsPerWindow: 30,
};

function currentConfig() {
  const stats = orchestrator.getStats();
  return {
    concurrencyLimit: stats.concurrencyLimit,
    maxQueueSize: stats.maxQueueSize,
    maxRequestsPerWindow: stats.maxRequestsPerWindow,
  };
}

async function postConfig(body: unknown) {
  const app = express();
  app.use(express.json());
  app.use('/api/orchestrator', orchestratorRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const { port } = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/orchestrator/config`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer supervisor-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    return {
      status: response.status,
      json: text ? JSON.parse(text) : null,
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe('FO-03 Orchestrator config HTTP validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator.updateConfig(DEFAULT_CONFIG);
  });

  afterEach(() => {
    orchestrator.updateConfig(DEFAULT_CONFIG);
  });

  it('accepts a valid partial patch without changing omitted values', async () => {
    const result = await postConfig({ concurrencyLimit: 5 });

    expect(result.status).toBe(200);
    expect(result.json).toEqual(expect.objectContaining({ success: true }));
    expect(currentConfig()).toEqual({
      concurrencyLimit: 5,
      maxQueueSize: 10,
      maxRequestsPerWindow: 30,
    });
  });

  it('rejects an invalid mixed patch atomically without partial mutation', async () => {
    const before = currentConfig();
    const result = await postConfig({
      concurrencyLimit: 5,
      maxQueueSize: 1,
      maxRequestsPerWindow: 50,
    });

    expect(result.status).toBe(400);
    expect(result.json).toEqual(expect.objectContaining({
      error: 'Ungültige Orchestrator-Konfiguration.',
      code: 'ORCHESTRATOR_CONFIG_INVALID',
    }));
    expect(result.json.issues).toContainEqual(expect.objectContaining({
      field: 'maxQueueSize',
      code: 'OUT_OF_RANGE',
    }));
    expect(currentConfig()).toEqual(before);
  });

  it.each([
    [{ concurrencyLimit: 0 }, 'concurrencyLimit', 'OUT_OF_RANGE'],
    [{ concurrencyLimit: 1.5 }, 'concurrencyLimit', 'INVALID_INTEGER'],
    [{ maxQueueSize: 31 }, 'maxQueueSize', 'OUT_OF_RANGE'],
    [{ maxRequestsPerWindow: 101 }, 'maxRequestsPerWindow', 'OUT_OF_RANGE'],
    [{ concurrencyLimit: '5' }, 'concurrencyLimit', 'INVALID_INTEGER'],
    [{ concurrencyLimit: 5, unexpected: true }, 'unexpected', 'UNKNOWN_FIELD'],
  ] as const)('returns 400 for invalid config payload %j', async (body, field, code) => {
    const before = currentConfig();
    const result = await postConfig(body);

    expect(result.status).toBe(400);
    expect(result.json.code).toBe('ORCHESTRATOR_CONFIG_INVALID');
    expect(result.json.issues).toContainEqual(expect.objectContaining({ field, code }));
    expect(currentConfig()).toEqual(before);
  });

  it('rejects an empty object instead of treating it as a successful no-op', async () => {
    const before = currentConfig();
    const result = await postConfig({});

    expect(result.status).toBe(400);
    expect(result.json.issues).toContainEqual(expect.objectContaining({
      field: '$body',
      code: 'EMPTY_CONFIG',
    }));
    expect(currentConfig()).toEqual(before);
  });
});
