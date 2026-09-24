import assert from 'node:assert/strict';
import test from 'node:test';
import {
  loadSupabaseMigrationLedger,
  validateSupabaseMigrationLedgerObject,
  validateSupabaseMigrationLedgerReconciliation,
} from '../governance/verifySupabaseMigrationLedgerReconciliation.mjs';

test('OPS/PVC-02 Supabase migration reconciliation classifies the full checked-in remote snapshot', () => {
  assert.deepEqual(validateSupabaseMigrationLedgerReconciliation(), []);

  const ledger = loadSupabaseMigrationLedger();
  assert.equal(ledger.summary.remote_total, ledger.provider_readback.remote_total);
  assert.equal(ledger.summary.remote_total, ledger.remote_migrations.length);
  assert.equal(
    ledger.summary.exact_match + ledger.summary.timestamp_alias + ledger.summary.remote_only_history,
    ledger.summary.remote_total,
  );
  assert.equal(ledger.summary.unknown, 0);
});

test('Supabase migration reconciliation fails closed when provider readback cardinality disagrees with the snapshot', () => {
  const ledger = structuredClone(loadSupabaseMigrationLedger());
  ledger.provider_readback.remote_total += 1;

  const errors = validateSupabaseMigrationLedgerObject(process.cwd(), ledger);
  assert.ok(errors.some((error) => error.includes('rows from provider readback')));
});

test('Supabase migration reconciliation fails closed when a remote row is unclassified', () => {
  const ledger = structuredClone(loadSupabaseMigrationLedger());
  ledger.remote_migrations[0].classification = 'UNKNOWN';

  const errors = validateSupabaseMigrationLedgerObject(process.cwd(), ledger);
  assert.ok(errors.some((error) => error.includes('unknown classification')));
});

test('Supabase migration reconciliation fails closed when a timestamp alias points at a different migration name', () => {
  const ledger = structuredClone(loadSupabaseMigrationLedger());
  const alias = ledger.remote_migrations.find((entry) => entry.classification === 'TIMESTAMP_ALIAS');
  alias.remote_name = `${alias.remote_name}_drift`;

  const errors = validateSupabaseMigrationLedgerObject(process.cwd(), ledger);
  assert.ok(errors.some((error) => error.includes('no same-name current local migration')));
});
