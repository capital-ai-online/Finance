import { describe, expect, it } from 'vitest';
import { buildProcessLivenessSnapshot } from '../../server/routes/health';

const configured = {
  supabase: true,
  anthropic: false,
  openai: true,
};

describe('process liveness model', () => {
  it('reports healthy process state without probing external dependencies', () => {
    const snapshot = buildProcessLivenessSnapshot({
      now: new Date('2026-09-20T12:00:00.000Z'),
      uptimeSeconds: 42,
      configured,
      processHealth: {
        healthy: true,
        fatalSource: null,
        fatalObservedAt: null,
      },
    });

    expect(snapshot).toEqual({
      status: 'ok',
      healthy: true,
      timestamp: '2026-09-20T12:00:00.000Z',
      uptimeSeconds: 42,
      configured,
      fatal: null,
    });
  });

  it('projects fatal process state as unhealthy for the /healthz 503 path', () => {
    const snapshot = buildProcessLivenessSnapshot({
      now: new Date('2026-09-20T12:00:01.000Z'),
      uptimeSeconds: 43,
      configured,
      processHealth: {
        healthy: false,
        fatalSource: 'uncaughtException',
        fatalObservedAt: '2026-09-20T12:00:00.500Z',
      },
    });

    expect(snapshot.status).toBe('unhealthy');
    expect(snapshot.healthy).toBe(false);
    expect(snapshot.fatal).toEqual({
      source: 'uncaughtException',
      observedAt: '2026-09-20T12:00:00.500Z',
    });
  });
});
