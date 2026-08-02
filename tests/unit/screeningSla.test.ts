import { describe, expect, it } from 'vitest';
import { buildScreeningSlaReport } from '../../src/services/screeningSla';

describe('screeningSla', () => {
  it('reports NO_RUNTIME_EVIDENCE without observations', () => {
    const report = buildScreeningSlaReport([]);
    expect(report.state).toBe('NO_RUNTIME_EVIDENCE');
    expect(report.hardScreeningBlockEnabled).toBe(false);
  });

  it('reports HEALTHY for successful low-latency providers', () => {
    const report = buildScreeningSlaReport([{ provider: 'A', successes: 10, failures: 0, consecutiveFailures: 0, ewmaLatencyMs: 250, cooldownUntilMs: 0 }]);
    expect(report.state).toBe('HEALTHY');
    expect(report.healthy).toBe(1);
  });

  it('reports DEGRADED for high latency or material failure rate', () => {
    const report = buildScreeningSlaReport([{ provider: 'A', successes: 8, failures: 2, consecutiveFailures: 0, ewmaLatencyMs: 3500, cooldownUntilMs: 0 }]);
    expect(report.state).toBe('DEGRADED');
  });

  it('reports UNAVAILABLE after consecutive failures', () => {
    const report = buildScreeningSlaReport([{ provider: 'A', successes: 1, failures: 3, consecutiveFailures: 3, cooldownUntilMs: 0 }]);
    expect(report.state).toBe('UNAVAILABLE');
    expect(report.unavailable).toBe(1);
  });
});
