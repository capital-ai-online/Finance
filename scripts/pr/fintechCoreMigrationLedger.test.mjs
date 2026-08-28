import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  gitBlobSha,
  validateFintechCoreMigrationLedger,
} from '../governance/verifyFintechCoreMigrationLedger.mjs';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-fintech-ledger-'));
  const migrationDir = path.join(root, 'supabase', 'migrations');
  fs.mkdirSync(migrationDir, { recursive: true });
  return { root, migrationDir };
}

test('accepts an exact reviewed FinTechCore migration baseline', () => {
  const { root, migrationDir } = fixture();
  try {
    const name = '20260827135000_fintech_core_recovery.sql';
    const content = 'begin;\nselect 1;\ncommit;\n';
    fs.writeFileSync(path.join(migrationDir, name), content, 'utf8');

    assert.deepEqual(
      validateFintechCoreMigrationLedger(root, { [name]: gitBlobSha(content) }),
      [],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('fails closed on an unreviewed additional FinTechCore migration', () => {
  const { root, migrationDir } = fixture();
  try {
    const canonical = '20260827135000_fintech_core_recovery.sql';
    const content = 'begin;\nselect 1;\ncommit;\n';
    fs.writeFileSync(path.join(migrationDir, canonical), content, 'utf8');
    fs.writeFileSync(
      path.join(migrationDir, '20260828100000_fintech_core_unreviewed.sql'),
      'select 2;\n',
      'utf8',
    );

    const errors = validateFintechCoreMigrationLedger(root, {
      [canonical]: gitBlobSha(content),
    });
    assert.equal(errors.some((error) => error.includes('unreviewed migration blocked')), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('fails closed when reviewed migration content is rewritten', () => {
  const { root, migrationDir } = fixture();
  try {
    const name = '20260827135000_fintech_core_recovery.sql';
    const canonicalContent = 'begin;\nselect 1;\ncommit;\n';
    fs.writeFileSync(path.join(migrationDir, name), 'begin;\nselect 2;\ncommit;\n', 'utf8');

    const errors = validateFintechCoreMigrationLedger(root, {
      [name]: gitBlobSha(canonicalContent),
    });
    assert.equal(errors.some((error) => error.includes('content drift')), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('fails closed when a canonical migration is missing', () => {
  const { root } = fixture();
  try {
    const errors = validateFintechCoreMigrationLedger(root, {
      '20260827135000_fintech_core_recovery.sql': gitBlobSha('select 1;\n'),
    });
    assert.equal(errors.some((error) => error.includes('canonical migration missing')), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
