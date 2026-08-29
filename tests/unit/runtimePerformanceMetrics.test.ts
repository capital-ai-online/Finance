import { describe, expect, it } from 'vitest';
import { renderMetrics } from '../../server/metrics';

describe('runtime performance metrics', () => {
  it('exposes event-loop lag and utilization gauges', () => {
    const metrics = renderMetrics();

    expect(metrics).toContain('# TYPE nodejs_event_loop_lag_seconds gauge');
    expect(metrics).toContain('nodejs_event_loop_lag_seconds ');
    expect(metrics).toContain('# TYPE nodejs_event_loop_lag_max_seconds gauge');
    expect(metrics).toContain('nodejs_event_loop_lag_max_seconds ');
    expect(metrics).toContain('# TYPE nodejs_event_loop_utilization_ratio gauge');
    expect(metrics).toContain('nodejs_event_loop_utilization_ratio ');
  });
});
