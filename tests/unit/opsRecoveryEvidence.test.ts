import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  compareRecoveryDumps,
  inspectRecoveryDump,
} from '../../scripts/operations/recoveryDumpIntegrity.mjs';

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/ops-recovery-evidence.yml');
const workflow = () => fs.readFileSync(workflowPath, 'utf8');

function copyBlock(relation: string, rows: string[]) {
  const body = rows.length > 0 ? `${rows.join('\n')}\n` : '';
  return `COPY ${relation} (id) FROM stdin;\n${body}\\.\n`;
}

function fixture(overrides: Partial<Record<string, string[]>> = {}) {
  const rows = {
    '"public"."profiles"': ['profile-b', 'profile-a'],
    '"auth"."users"': ['user-1'],
    '"auth"."identities"': ['identity-1'],
    '"storage"."buckets"': [],
    '"storage"."objects"': [],
    '"pgmq"."meta"': ['stripe_sync_work'],
    '"pgmq"."q_stripe_sync_work"': [],
    '"pgmq"."a_stripe_sync_work"': [],
    ...overrides,
  };
  return Object.entries(rows)
    .map(([relation, values]) => copyBlock(relation, values))
    .join('');
}

describe('OPS recovery evidence', () => {
  it('keeps the workflow main-only, least-privilege and bound to exact checked-out source', () => {
    const yaml = workflow();
    expect(yaml).toContain("github.ref == 'refs/heads/main'");
    expect(yaml).toContain("vars.OPS_RECOVERY_EXECUTION_ENABLED == 'true'");
    expect(yaml).toContain('permissions:\n  contents: read');
    expect(yaml).toContain('actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8');
    expect(yaml).toContain('ref: ${{ github.sha }}');
    expect(yaml).toContain('persist-credentials: false');
    expect(yaml).not.toContain('pull_request_target');
  });

  it('validates source recovery coverage and materializes PGMQ before isolated restore', () => {
    const yaml = workflow();
    expect(yaml).toMatch(
      /node\s+(?:"[^"\n]*\/)?scripts\/operations\/recoveryDumpIntegrity\.mjs"?\s+inspect\b/,
    );
    expect(yaml).toMatch(
      /node\s+(?:"[^"\n]*\/)?scripts\/operations\/recoveryDumpIntegrity\.mjs"?\s+compare\b/,
    );
    expect(yaml).toContain('PGMQ_RELATIONS');
    expect(yaml).toContain('PGMQ_QUEUE_COUNT');
    expect(yaml).toContain('pgmq-restore-init.sql');
    expect(yaml).toContain('CREATE EXTENSION IF NOT EXISTS pgmq');
    expect(yaml).toContain('TRUNCATE TABLE pgmq.meta');
    expect(yaml).toContain("'pgmqRelationsCompared'");
    expect(yaml).toContain('AUTH_USERS_ROWS');
    expect(yaml).toContain('AUTH_IDENTITIES_ROWS');
    expect(yaml).toContain('STORAGE_OBJECTS_ROWS');
    expect(yaml).toContain("'dataIntegrityMatch'");
  });

  it('treats row ordering as non-authoritative while preserving multiset integrity', () => {
    const source = fixture({ '"pgmq"."q_stripe_sync_work"': ['queue-b', 'queue-a'] });
    const restored = fixture({
      '"public"."profiles"': ['profile-a', 'profile-b'],
      '"pgmq"."q_stripe_sync_work"': ['queue-a', 'queue-b'],
    });
    const summary = compareRecoveryDumps(source, restored);
    expect(summary.dataIntegrityMatch).toBe(true);
    expect(summary.publicRelationsCompared).toBe(1);
    expect(summary.authRelationsCompared).toBe(2);
    expect(summary.storageRelationsCompared).toBe(2);
    expect(summary.pgmqRelationsCompared).toBe(3);
  });

  it('reports PGMQ recovery coverage during source inspection', () => {
    const summary = inspectRecoveryDump(fixture());
    expect(summary.pgmqRelations).toBe(3);
  });

  it('fails when restored PGMQ queue data diverges', () => {
    expect(() =>
      compareRecoveryDumps(
        fixture({ '"pgmq"."q_stripe_sync_work"': ['queue-1'] }),
        fixture({ '"pgmq"."q_stripe_sync_work"': ['queue-2'] }),
      ),
    ).toThrow(/pgmq\.q_stripe_sync_work/);
  });

  it('fails when restored auth data diverges', () => {
    expect(() =>
      compareRecoveryDumps(fixture(), fixture({ '"auth"."users"': ['user-2'] })),
    ).toThrow(/auth\.users/);
  });

  it('fails closed when storage binary objects exist without a binary backup implementation', () => {
    expect(() => inspectRecoveryDump(fixture({ '"storage"."objects"': ['object-1'] }))).toThrow(
      /does not back up binary objects/,
    );
  });

  it('requires auth and storage recovery relations to be present in the data dump', () => {
    const incomplete = copyBlock('"public"."profiles"', ['profile-1']);
    expect(() => inspectRecoveryDump(incomplete)).toThrow(/auth\.users/);
  });
});
