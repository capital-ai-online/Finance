import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { test } from 'node:test';

const script = 'scripts/operations/renderDigestImageReference.mjs';
const digest = 'sha256:' + 'a'.repeat(64);

test('renders only the canonical GHCR digest reference', () => {
  const output = execFileSync(process.execPath, [
    script,
    '--image',
    'ghcr.io/capital-ai-online/finance',
    '--digest',
    digest,
  ], { encoding: 'utf8' });

  assert.equal(output.trim(), `ghcr.io/capital-ai-online/finance@${digest}`);
});

test('rejects tag-based or non-canonical image authority', () => {
  for (const image of [
    'ghcr.io/capital-ai-online/finance:latest',
    'ghcr.io/capital-ai-online/finance:deadbeef',
    'ghcr.io/other/finance',
  ]) {
    const result = spawnSync(process.execPath, [
      script,
      '--image',
      image,
      '--digest',
      digest,
    ], { encoding: 'utf8' });

    assert.notEqual(result.status, 0);
  }
});

test('rejects malformed digests', () => {
  const result = spawnSync(process.execPath, [
    script,
    '--image',
    'ghcr.io/capital-ai-online/finance',
    '--digest',
    'sha256:not-a-real-digest',
  ], { encoding: 'utf8' });

  assert.notEqual(result.status, 0);
});
