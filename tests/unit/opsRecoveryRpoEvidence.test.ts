import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RPO_TARGET_SECONDS,
  evaluateRecoveryRpoEvidence,
} from '../../scripts/operations/recoveryRpoEvidence.mjs';

function evidence({
  startedAt,
  runId,
  eventName,
  storageObjectsRows = 0,
}: {
  startedAt: string;
  runId: string;
  eventName?: string;
  storageObjectsRows?: number;
}) {
  return {
    schemaVersion: '1.1.0',
    workItem: 'OPS-08-SEC-07',
    source: { readOnlyBackup: true },
    repository: {
      ...(eventName ? { eventName } : {}),
      workflowRunId: runId,
      workflowRunAttempt: '1',
      sha: 'a'.repeat(40),
    },
    backup: {
      startedAt,
      completedAt: new Date(Date.parse(startedAt) + 1_000).toISOString(),
      encryptedBytes: 42,
      encryptedSha256: 'b'.repeat(64),
      coverage: {
        storageBinaryCoverage: 'REQUIRES_ZERO_OBJECTS',
        storageObjectsRows,
      },
    },
    securityClosure: 'NOT_CLAIMED',
  };
}

function runMetadata(
  runs: Array<{
    id: string;
    event: string;
    status?: string;
    conclusion?: string;
  }>,
) {
  return {
    workflow_runs: runs.map((run) => ({
      id: run.id,
      event: run.event,
      status: run.status ?? 'completed',
      conclusion: run.conclusion ?? 'success',
    })),
  };
}

describe('OPS recovery measured RPO evidence', () => {
  it('reports measured pass when successful scheduled backups stay within the 24h target', () => {
    const result = evaluateRecoveryRpoEvidence(
      [
        evidence({ startedAt: '2026-09-07T02:17:00Z', runId: '100' }),
        evidence({ startedAt: '2026-09-08T02:17:00Z', runId: '101' }),
      ],
      {
        runMetadata: runMetadata([
          { id: '100', event: 'schedule' },
          { id: '101', event: 'schedule' },
        ]),
      },
    );

    expect(result.status).toBe('MEASURED_PASS');
    expect(result.targetSeconds).toBe(DEFAULT_RPO_TARGET_SECONDS);
    expect(result.maxObservedIntervalSeconds).toBe(86_400);
    expect(result.securityClosure).toBe('NOT_CLAIMED');
  });

  it('does not use workflow dispatches as recurring scheduled RPO evidence', () => {
    const result = evaluateRecoveryRpoEvidence(
      [
        evidence({ startedAt: '2026-09-07T02:17:00Z', runId: '100' }),
        evidence({ startedAt: '2026-09-07T12:00:00Z', runId: '101' }),
      ],
      {
        runMetadata: runMetadata([
          { id: '100', event: 'schedule' },
          { id: '101', event: 'workflow_dispatch' },
        ]),
      },
    );

    expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.scheduledRuns).toBe(1);
  });

  it('excludes unsuccessful scheduled runs from measured RPO evidence', () => {
    const result = evaluateRecoveryRpoEvidence(
      [
        evidence({ startedAt: '2026-09-07T02:17:00Z', runId: '100' }),
        evidence({ startedAt: '2026-09-08T02:17:00Z', runId: '101' }),
      ],
      {
        runMetadata: runMetadata([
          { id: '100', event: 'schedule' },
          { id: '101', event: 'schedule', conclusion: 'failure' },
        ]),
      },
    );

    expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.scheduledRuns).toBe(1);
    expect(result.unsuccessfulRuns).toBe(1);
  });

  it('reports measured fail when the observed scheduled interval exceeds the target', () => {
    const result = evaluateRecoveryRpoEvidence(
      [
        evidence({ startedAt: '2026-09-07T02:17:00Z', runId: '100' }),
        evidence({ startedAt: '2026-09-08T02:17:01Z', runId: '101' }),
      ],
      {
        runMetadata: runMetadata([
          { id: '100', event: 'schedule' },
          { id: '101', event: 'schedule' },
        ]),
      },
    );

    expect(result.status).toBe('MEASURED_FAIL');
    expect(result.maxObservedIntervalSeconds).toBe(86_401);
  });

  it('fails closed when evidence and run metadata disagree about event identity', () => {
    expect(() =>
      evaluateRecoveryRpoEvidence(
        [
          evidence({
            startedAt: '2026-09-07T02:17:00Z',
            runId: '100',
            eventName: 'workflow_dispatch',
          }),
        ],
        { runMetadata: runMetadata([{ id: '100', event: 'schedule' }]) },
      ),
    ).toThrow(/event identity conflicts/);
  });

  it('fails closed when an evidence input reports storage objects without binary coverage', () => {
    expect(() =>
      evaluateRecoveryRpoEvidence([
        evidence({ startedAt: '2026-09-07T02:17:00Z', runId: '100', storageObjectsRows: 1 }),
      ]),
    ).toThrow(/storage objects exist/);
  });
});
