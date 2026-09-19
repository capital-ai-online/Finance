import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EXPECTED_PROJECT_REF,
  parseRemoteMigrationTsv,
  validateLiveRemoteAgainstLedger,
} from '../governance/verifySupabasePreflight.mjs';

test('Supabase preflight parses a read-only remote migration snapshot', () => {
  assert.deepEqual(
    parseRemoteMigrationTsv('20260101000000\tfirst\n20260102000000\tsecond\n'),
    [
      { version: '20260101000000', name: 'first' },
      { version: '20260102000000', name: 'second' },
    ],
  );
  assert.equal(EXPECTED_PROJECT_REF, 'ryzywoktpmyhwzxmstyu');
});

test('Supabase preflight fails closed on live migration drift', () => {
  const ledger = {
    remote_migrations: [
      { remote_version: '20260101000000', remote_name: 'first' },
      { remote_version: '20260102000000', remote_name: 'second' },
    ],
  };
  const errors = validateLiveRemoteAgainstLedger(
    [
      { version: '20260101000000', name: 'first' },
      { version: '20260102000000', name: 'second_drift' },
      { version: '20260103000000', name: 'unexpected' },
    ],
    ledger,
  );
  assert.ok(errors.some((error) => error.includes('remote name drift')));
  assert.ok(errors.some((error) => error.includes('unclassified remote migration')));
});

test('Supabase preflight workflow is manual, read-only and never uses preview branching', () => {
  const workflow = fs.readFileSync('.github/workflows/supabase-preflight.yml', 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request_target:/);
  assert.doesNotMatch(workflow, /^\s+pull_request:/m);
  assert.match(workflow, /default_transaction_read_only=on/);
  assert.match(workflow, /SUPABASE_DB_URL: \$\{\{ secrets\.SUPABASE_DB_URL \}\}/);
  assert.match(workflow, /verifySupabasePreflight\.mjs/);
  for (const forbidden of ['db push', 'migration repair', 'db reset', 'apply_migration', 'create_branch']) {
    assert.ok(!workflow.includes(forbidden), `forbidden Supabase mutation primitive: ${forbidden}`);
  }
});
