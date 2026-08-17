// M10 (ADR-0066, ESS-0022) Phase 3 live-wiring — HTTP router tests. Mocks the already-tested
// orchestration functions from credentialEnrollment.ts (tests/unit/m10CredentialEnrollment.test.ts
// covers their real behavior) and authMiddleware's checkAdminAccess/requireStepUp, mirroring the
// exact pattern used in tests/unit/breakGlassRouter.test.ts. What this file proves is the router's
// own responsibility: Owner+step-up gating on every mutating route, request validation, response
// shaping, and that every action writes an audit event.
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  checkAdminAccess: vi.fn(),
  requireStepUp: vi.fn(),
  writeAgentAuditEvent: vi.fn(),
  beginM10CredentialEnrollment: vi.fn(),
  completeM10CredentialEnrollment: vi.fn(),
  revokeM10Credential: vi.fn(),
}));

vi.mock('../../src/platform/Security/authMiddleware', () => ({
  checkAdminAccess: mocks.checkAdminAccess,
  requireStepUp: mocks.requireStepUp,
}));
vi.mock('../../server/agentAudit/agentAuditWriter', () => ({
  writeAgentAuditEvent: mocks.writeAgentAuditEvent,
}));
vi.mock('../../server/m10/credentialEnrollment', () => ({
  beginM10CredentialEnrollment: mocks.beginM10CredentialEnrollment,
  completeM10CredentialEnrollment: mocks.completeM10CredentialEnrollment,
  revokeM10Credential: mocks.revokeM10Credential,
}));
// The router constructs Supabase-backed stores at module load; keep them inert in tests (no
// Supabase env configured anyway, but mocking avoids relying on that incidental fact).
vi.mock('../../server/m10/credentialEnrollmentSupabaseStore', () => ({
  createSupabaseM10RegistrationChallengeStore: () => ({ save: vi.fn(), get: vi.fn(), markConsumed: vi.fn() }),
  createSupabaseM10CredentialStore: () => ({ save: vi.fn(), listActiveForOwner: vi.fn().mockResolvedValue([]), revoke: vi.fn() }),
}));

import { m10CredentialEnrollmentRouter } from '../../server/m10/credentialEnrollmentRouter';
import { resetRateLimit } from '../../src/platform/Security/rateLimiter';
import { SYSTEMADMIN_OWNER_ACTOR_ID } from '../../src/platform/Security/roadmapExecutionMandate';

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

async function withServer(fn: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use('/api/m10/credential-enrollment', m10CredentialEnrollmentRouter);
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const value = app.listen(0, '127.0.0.1', () => resolve(value));
  });
  try {
    const address = server.address() as AddressInfo;
    await fn(`http://127.0.0.1:${address.port}/api/m10/credential-enrollment`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimit('m10-enroll-begin:127.0.0.1');
  mocks.checkAdminAccess.mockResolvedValue(OWNER_AUTHZ);
  mocks.requireStepUp.mockResolvedValue(true);
  mocks.writeAgentAuditEvent.mockResolvedValue('supabase:agent_audit_events:test-1');
});

afterEach(() => vi.restoreAllMocks());

describe('M10 credential enrollment router: POST /begin', () => {
  it('rejects a non-owner caller before calling beginM10CredentialEnrollment', async () => {
    mocks.checkAdminAccess.mockResolvedValue(DENIED_AUTHZ);
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/begin`, { method: 'POST' });
      expect(response.status).toBe(403);
      expect(mocks.requireStepUp).not.toHaveBeenCalled();
      expect(mocks.beginM10CredentialEnrollment).not.toHaveBeenCalled();
    });
  });

  it('rejects without a fresh step-up (428)', async () => {
    mocks.requireStepUp.mockResolvedValue(false);
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/begin`, { method: 'POST' });
      expect(response.status).toBe(428);
      const json = await response.json();
      expect(json.code).toBe('step_up_required');
      expect(mocks.beginM10CredentialEnrollment).not.toHaveBeenCalled();
    });
  });

  it('passes the correct purpose zone to requireStepUp', async () => {
    mocks.beginM10CredentialEnrollment.mockResolvedValue({ verdict: 'CHALLENGE_ISSUED', challengeId: 'c1', options: {} });
    await withServer(async (baseUrl) => {
      await fetch(`${baseUrl}/begin`, { method: 'POST' });
    });
    expect(mocks.requireStepUp).toHaveBeenCalledWith(expect.anything(), 'systemadmin:m10-passkey-enroll-begin');
  });

  it('returns the WebAuthn options on success and audits ALLOW', async () => {
    mocks.beginM10CredentialEnrollment.mockResolvedValue({
      verdict: 'CHALLENGE_ISSUED',
      challengeId: 'challenge-a',
      options: { challenge: 'challenge-a', rp: { id: 'capital-ai.online' } },
    });
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/begin`, { method: 'POST' });
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.options.challenge).toBe('challenge-a');
    });
    expect(mocks.beginM10CredentialEnrollment).toHaveBeenCalledWith(SYSTEMADMIN_OWNER_ACTOR_ID, expect.anything());
    expect(mocks.writeAgentAuditEvent).toHaveBeenCalledTimes(1);
    expect(mocks.writeAgentAuditEvent.mock.calls[0]?.[0]).toMatchObject({ decision: 'ALLOW', result: 'SUCCESS' });
  });

  it('propagates a DENY from beginM10CredentialEnrollment as 403 and audits DENY', async () => {
    mocks.beginM10CredentialEnrollment.mockResolvedValue({ verdict: 'DENY', reason: 'no reason' });
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/begin`, { method: 'POST' });
      expect(response.status).toBe(403);
    });
    expect(mocks.writeAgentAuditEvent.mock.calls[0]?.[0]).toMatchObject({ decision: 'DENY', result: 'DENIED' });
  });

  it('rate-limits repeated begin attempts from the same IP', async () => {
    mocks.beginM10CredentialEnrollment.mockResolvedValue({ verdict: 'CHALLENGE_ISSUED', challengeId: 'c', options: {} });
    await withServer(async (baseUrl) => {
      for (let i = 0; i < 5; i += 1) {
        const response = await fetch(`${baseUrl}/begin`, { method: 'POST' });
        expect(response.status).toBe(200);
      }
      const response = await fetch(`${baseUrl}/begin`, { method: 'POST' });
      expect(response.status).toBe(429);
    });
  });
});

describe('M10 credential enrollment router: POST /complete', () => {
  it('rejects without a valid body', async () => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(400);
      expect(mocks.completeM10CredentialEnrollment).not.toHaveBeenCalled();
    });
  });

  it('rejects a non-owner caller before touching the body', async () => {
    mocks.checkAdminAccess.mockResolvedValue(DENIED_AUTHZ);
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: 'c1', response: {} }),
      });
      expect(response.status).toBe(403);
      expect(mocks.completeM10CredentialEnrollment).not.toHaveBeenCalled();
    });
  });

  it('returns the persisted credential on success and audits ALLOW', async () => {
    mocks.completeM10CredentialEnrollment.mockResolvedValue({
      verdict: 'ENROLLED',
      credential: { credentialId: 'cred-1', ownerId: SYSTEMADMIN_OWNER_ACTOR_ID },
    });
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: 'challenge-a', response: { id: 'r' } }),
      });
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.credential.credentialId).toBe('cred-1');
    });
    expect(mocks.completeM10CredentialEnrollment).toHaveBeenCalledWith(
      SYSTEMADMIN_OWNER_ACTOR_ID, 'challenge-a', { id: 'r' }, expect.anything(),
    );
    expect(mocks.writeAgentAuditEvent.mock.calls[0]?.[0]).toMatchObject({ decision: 'ALLOW', result: 'SUCCESS' });
  });

  it('propagates a DENY as 403 and audits DENY', async () => {
    mocks.completeM10CredentialEnrollment.mockResolvedValue({ verdict: 'DENY', reason: 'verification failed' });
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: 'challenge-a', response: { id: 'r' } }),
      });
      expect(response.status).toBe(403);
    });
    expect(mocks.writeAgentAuditEvent.mock.calls[0]?.[0]).toMatchObject({ decision: 'DENY', result: 'DENIED' });
  });
});

describe('M10 credential enrollment router: POST /revoke and GET /credentials', () => {
  it('rejects revoke without a credentialId', async () => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(400);
    });
  });

  it('revokes successfully and audits ALLOW', async () => {
    mocks.revokeM10Credential.mockResolvedValue({ verdict: 'REVOKED' });
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: 'cred-1' }),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ revoked: true });
    });
    expect(mocks.writeAgentAuditEvent.mock.calls[0]?.[0]).toMatchObject({ decision: 'ALLOW', result: 'SUCCESS' });
  });

  it('returns 404 for an unknown credential and audits DENY', async () => {
    mocks.revokeM10Credential.mockResolvedValue({ verdict: 'DENY', reason: 'Unbekanntes Credential.' });
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: 'does-not-exist' }),
      });
      expect(response.status).toBe(404);
    });
    expect(mocks.writeAgentAuditEvent.mock.calls[0]?.[0]).toMatchObject({ decision: 'DENY', result: 'DENIED' });
  });

  it('rejects a non-owner caller on GET /credentials', async () => {
    mocks.checkAdminAccess.mockResolvedValue(DENIED_AUTHZ);
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/credentials`);
      expect(response.status).toBe(403);
    });
  });

  it('lists active credentials for an owner caller without requiring step-up (read-only)', async () => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/credentials`);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(Array.isArray(json.credentials)).toBe(true);
    });
    expect(mocks.requireStepUp).not.toHaveBeenCalled();
  });
});
