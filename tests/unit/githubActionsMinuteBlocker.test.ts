import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GITHUB_ACTIONS_MINUTE_BLOCKER_MARKER,
  GITHUB_ACTIONS_MINUTE_BLOCKER_TITLE,
  syncGitHubActionsMinuteBlocker,
} from '../../scripts/operations/syncGitHubActionsMinuteBlocker.mjs';

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function report(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: '1.0.0',
    mode: 'monitor',
    generatedAt: '2026-10-01T00:15:00.000Z',
    cycle: { year: 2026, month: 10 },
    actionsMinutes: {
      source: 'enterprise.billing.usage.summary',
      consumedGrossMinutes: 45_000,
      warningThresholdMinutes: 5_000,
      blockerThresholdMinutes: 45_000,
      remainingToBlockerMinutes: 0,
      state: 'BLOCKED',
      warningTriggered: true,
      blockerRequired: true,
    },
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GitHub Actions minute blocker sync', () => {
  it('never mutates GitHub in test mode', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await syncGitHubActionsMinuteBlocker({
      report: report({ mode: 'test' }),
      token: 'token',
      repository: 'capital-ai-online/Finance',
    });

    expect(result).toEqual({ status: 'SKIPPED', reason: 'test_mode_has_no_blocker_mutation' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates one durable blocker issue when 45,000 minutes are reached', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response({ number: 2001 }, 201));
    vi.stubGlobal('fetch', fetchMock);

    const result = await syncGitHubActionsMinuteBlocker({
      report: report(),
      token: 'token',
      repository: 'capital-ai-online/Finance',
    });

    expect(result).toEqual({ status: 'BLOCKER_CREATED', created: true, issueNumber: 2001 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const createInit = fetchMock.mock.calls[1][1] as RequestInit;
    const body = JSON.parse(String(createInit.body));
    expect(body.title).toBe(GITHUB_ACTIONS_MINUTE_BLOCKER_TITLE);
    expect(body.body).toContain(`<!-- ${GITHUB_ACTIONS_MINUTE_BLOCKER_MARKER} -->`);
    expect(body.body).toContain('45000');
  });

  it('is idempotent while the blocker issue remains open', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response([{
      number: 2001,
      body: `<!-- ${GITHUB_ACTIONS_MINUTE_BLOCKER_MARKER} -->\nactive`,
    }]));
    vi.stubGlobal('fetch', fetchMock);

    const result = await syncGitHubActionsMinuteBlocker({
      report: report(),
      token: 'token',
      repository: 'capital-ai-online/Finance',
    });

    expect(result).toEqual({ status: 'BLOCKER_ACTIVE', created: false, issueNumber: 2001 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('closes the blocker automatically once the monthly state is below 45,000', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response([{
        number: 2001,
        body: `<!-- ${GITHUB_ACTIONS_MINUTE_BLOCKER_MARKER} -->\nactive`,
      }]))
      .mockResolvedValueOnce(response({ id: 1 }, 201))
      .mockResolvedValueOnce(response({ number: 2001, state: 'closed' }));
    vi.stubGlobal('fetch', fetchMock);

    const clearReport = report({
      actionsMinutes: {
        source: 'enterprise.billing.usage.summary',
        consumedGrossMinutes: 0,
        warningThresholdMinutes: 5_000,
        blockerThresholdMinutes: 45_000,
        remainingToBlockerMinutes: 45_000,
        state: 'BELOW_WARNING',
        warningTriggered: false,
        blockerRequired: false,
      },
    });

    const result = await syncGitHubActionsMinuteBlocker({
      report: clearReport,
      token: 'token',
      repository: 'capital-ai-online/Finance',
    });

    expect(result).toEqual({ status: 'BLOCKER_CLOSED', created: false, issueNumber: 2001 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1][0])).toContain('/issues/2001/comments');
    expect(String(fetchMock.mock.calls[2][0])).toContain('/issues/2001');
    expect((fetchMock.mock.calls[2][1] as RequestInit).method).toBe('PATCH');
  });

  it('fails closed when duplicate open blocker issues exist', async () => {
    const body = `<!-- ${GITHUB_ACTIONS_MINUTE_BLOCKER_MARKER} -->`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response([
      { number: 2001, body },
      { number: 2002, body },
    ])));

    await expect(syncGitHubActionsMinuteBlocker({
      report: report(),
      token: 'token',
      repository: 'capital-ai-online/Finance',
    })).rejects.toThrow(/multiple open Actions minute blocker issues/);
  });
});
