import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { escapeDriveQueryValue, fileDigests } from './googleDriveBackupUpload.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('Google Drive backup uploader', () => {
  it('escapes folder/file query literals without changing ordinary names', () => {
    assert.equal(escapeDriveQueryValue('CAPITAL-AI'), 'CAPITAL-AI');
    assert.equal(escapeDriveQueryValue("week's-backup"), "week\\'s-backup");
    assert.equal(escapeDriveQueryValue('a\\b'), 'a\\\\b');
  });

  it('computes stable size, MD5 and SHA-256 evidence', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-drive-test-'));
    const file = path.join(dir, 'archive.age');
    fs.writeFileSync(file, 'capital-ai-backup\n');
    const a = fileDigests(file);
    const b = fileDigests(file);
    assert.deepEqual(a, b);
    assert.equal(a.size, 18);
    assert.match(a.md5, /^[0-9a-f]{32}$/);
    assert.match(a.sha256, /^[0-9a-f]{64}$/);
  });
});
