import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { summarizePrLifecycle, summarizeLifecycleWindow } from './analyzeRunnerLifecycle.mjs';

describe('runner lifecycle telemetry', () => {
  it('counts all heads and isolates failed/cancelled/duplicate waste', () => {
    const row = summarizePrLifecycle({
      pr: { number: 42, created_at: '2026-09-21T10:00:00Z', merged_at: '2026-09-21T11:00:00Z' },
      pr_class: 'C-P',
      first_green_at: '2026-09-21T10:30:00Z',
      runs: [
        {
          workflow: 'CI', head_sha: 'a', base_sha: 'm', conclusion: 'success', run_attempt: 1,
          jobs: [{ started_at: '2026-09-21T10:05:00Z', completed_at: '2026-09-21T10:10:00Z' }],
        },
        {
          workflow: 'CI', head_sha: 'a', base_sha: 'm', conclusion: 'success', run_attempt: 2,
          jobs: [{ started_at: '2026-09-21T10:12:00Z', completed_at: '2026-09-21T10:14:00Z' }],
        },
        {
          workflow: 'OSS', head_sha: 'b', base_sha: 'm', conclusion: 'failure', run_attempt: 1, preflight_avoidable: true,
          jobs: [{ started_at: '2026-09-21T10:20:00Z', completed_at: '2026-09-21T10:23:00Z' }],
        },
        {
          workflow: 'Governance', head_sha: 'b', base_sha: 'm', conclusion: 'cancelled', run_attempt: 1,
          jobs: [{ started_at: '2026-09-21T10:24:00Z', completed_at: '2026-09-21T10:25:00Z' }],
        },
      ],
    });

    assert.equal(row.heads, 2);
    assert.equal(row.runner_minutes, 11);
    assert.equal(row.failed_minutes, 3);
    assert.equal(row.cancelled_minutes, 1);
    assert.equal(row.duplicate_minutes, 2);
    assert.equal(row.preflight_avoidable_minutes, 3);
    assert.equal(row.created_to_first_green_min, 30);
    assert.equal(row.created_to_merge_min, 60);
    assert.equal(row.top_cost_check, 'CI');
  });

  it('calculates rolling aggregate p50/p95 and class totals', () => {
    const summary = summarizeLifecycleWindow([
      {
        pr: { number: 1, created_at: '2026-09-21T10:00:00Z', merged_at: '2026-09-21T10:10:00Z' },
        pr_class: 'D',
        runs: [{ workflow: 'Governance', head_sha: 'a', base_sha: 'm', conclusion: 'success',
          jobs: [{ started_at: '2026-09-21T10:00:00Z', completed_at: '2026-09-21T10:01:00Z' }] }],
      },
      {
        pr: { number: 2, created_at: '2026-09-21T10:00:00Z', merged_at: '2026-09-21T10:20:00Z' },
        pr_class: 'C-N',
        runs: [{ workflow: 'CI', head_sha: 'b', base_sha: 'm', conclusion: 'success',
          jobs: [{ started_at: '2026-09-21T10:00:00Z', completed_at: '2026-09-21T10:05:00Z' }] }],
      },
    ]);

    assert.equal(summary.pr_count, 2);
    assert.equal(summary.total_runner_min, 6);
    assert.equal(summary.avg_runner_min, 3);
    assert.equal(summary.p50_runner_min, 1);
    assert.equal(summary.p95_runner_min, 5);
    assert.equal(summary.by_class.D.total_runner_min, 1);
    assert.equal(summary.by_class['C-N'].total_runner_min, 5);
  });
});
