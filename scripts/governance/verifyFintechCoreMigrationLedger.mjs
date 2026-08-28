import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FINTECH_CORE_MIGRATION_BASELINE = Object.freeze({
  '20260821000550_fintech_core_durable_traceability.sql': '8a08df52727630d876a15bae0970b2910e973ee7',
  '20260821000558_fintech_core_durable_traceability_least_privilege.sql': '533f8a9fab60ee64edd669859b90d8e6014132b7',
  '20260821000716_fintech_core_fk_indexes.sql': '0b6e33d82a49f0737341d6780c4448e223136908',
  '20260821003628_fintech_core_rpc_persistence_boundary.sql': '31572c52b46c532e53fe32e1c493900eb1f3f4ad',
  '20260821071823_fintech_core_paper_replay_reader.sql': '5db937b4f8a0de69129d6139fd3a4b59fa01cb06',
  '20260822012200_fintech_core_ft6b_fixed_point_reconciliation.sql': '864e5fe5799c9c708c7fa2f4680501e1a4a9322e',
  '20260827135000_fintech_core_ft6a_order_intent_reconciliation_ledger_recovery.sql': 'c1abf1456f1d7af97ee734a71b7b441db24ae876',
});

export function gitBlobSha(content) {
  const text = Buffer.isBuffer(content) ? content.toString('utf8') : String(content);
  const normalized = Buffer.from(text.replace(/\r\n/g, '\n'), 'utf8');
  const header = Buffer.from(`blob ${normalized.length}\0`, 'utf8');
  return crypto.createHash('sha1').update(header).update(normalized).digest('hex');
}

export function validateFintechCoreMigrationLedger(
  root = process.cwd(),
  expectedMigrations = FINTECH_CORE_MIGRATION_BASELINE,
) {
  const errors = [];
  const migrationDir = path.join(root, 'supabase', 'migrations');

  if (!fs.existsSync(migrationDir)) {
    return [`FinTechCore migration ledger: directory missing: ${migrationDir}`];
  }

  const expected = new Map(Object.entries(expectedMigrations));
  const actual = fs.readdirSync(migrationDir)
    .filter((name) => name.endsWith('.sql') && name.includes('fintech_core'))
    .sort();

  for (const [name, expectedSha] of expected) {
    const target = path.join(migrationDir, name);
    if (!fs.existsSync(target)) {
      errors.push(`FinTechCore migration ledger: canonical migration missing: ${name}`);
      continue;
    }

    const actualSha = gitBlobSha(fs.readFileSync(target));
    if (actualSha !== expectedSha) {
      errors.push(
        `FinTechCore migration ledger: applied/recovery migration content drift: ${name} `
        + `(expected git blob ${expectedSha}, got ${actualSha})`,
      );
    }
  }

  for (const name of actual) {
    if (!expected.has(name)) {
      errors.push(
        `FinTechCore migration ledger: unreviewed migration blocked: ${name}. `
        + 'Reconcile the Supabase production ledger and explicitly advance the governed baseline first.',
      );
    }
  }

  return errors;
}

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  const errors = validateFintechCoreMigrationLedger();
  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
  } else {
    console.log('FinTechCore migration ledger baseline: OK');
  }
}
