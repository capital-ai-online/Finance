import test from 'node:test';
import assert from 'node:assert/strict';

import {
  codeqlLanguagesForFiles,
  protectedAutofixReason,
} from '../../scripts/security/runCodeScanningAutofix.mjs';

test('blocks governance and protected security-sensitive paths', () => {
  assert.ok(protectedAutofixReason('AGENTS.md'));
  assert.ok(protectedAutofixReason('.github/workflows/ci.yml'));
  assert.ok(protectedAutofixReason('docs/governance/policy.md'));
  assert.ok(protectedAutofixReason('supabase/migrations/001.sql'));
  assert.ok(protectedAutofixReason('server/stripe.ts'));
  assert.ok(protectedAutofixReason('src/platform/Security/authMiddleware.ts'));
  assert.ok(protectedAutofixReason('server/providers/openai.ts'));
  assert.ok(protectedAutofixReason('prisma/schema.prisma'));
  assert.ok(protectedAutofixReason('infra/production.tf'));
});

test('allows ordinary bounded application source paths', () => {
  assert.equal(protectedAutofixReason('src/platform/Security/safeIo.ts'), null);
  assert.equal(protectedAutofixReason('server/alerts.ts'), null);
  assert.equal(protectedAutofixReason('src/utils/sanitize.ts'), null);
});

test('derives supported CodeQL languages deterministically', () => {
  assert.deepEqual(
    codeqlLanguagesForFiles(['server/index.ts', 'scripts/worker.mts', 'scripts/check.py', 'README.md']),
    ['javascript-typescript', 'python'],
  );
  assert.deepEqual(codeqlLanguagesForFiles(['README.md']), []);
});
