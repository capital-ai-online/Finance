import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isGoogleMarketingProtectedPath,
  validateGoogleMarketingProtectedWiring,
} from '../security/verifyGoogleMarketingProtectedWiring.mjs';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-google-wiring-'));
  const write = (relative, content = '') => {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, 'utf8');
  };

  write('.dockerignore', [
    '.github/*',
    '!.github/workflows/',
    '.github/workflows/*',
    '!.github/workflows/google-marketing-protected-change.yml',
    '',
  ].join('\n'));
  write('package.json', JSON.stringify({
    scripts: {
      build: 'tsx scripts/security/verifyGoogleMarketingInvariants.ts && vite build',
      'predeploy:check': 'tsx scripts/security/verifyGoogleMarketingInvariants.ts && node verify.mjs',
    },
  }));
  write('scripts/security/verifyGoogleMarketingInvariants.ts', 'export {};\n');
  write('tests/unit/securityResponse.production.test.ts', 'export {};\n');
  write('.github/workflows/ci.yml', [
    'jobs:',
    '  build:',
    '    steps:',
    '      - run: npm test',
    '      - run: npm run build',
    '      - run: npx vitest run tests/unit/securityResponse.production.test.ts',
    '      - run: npm run predeploy:check',
    '',
  ].join('\n'));
  return root;
}

test('matches exact and prefix-protected Google Marketing paths', () => {
  assert.equal(isGoogleMarketingProtectedPath('index.html'), true);
  assert.equal(isGoogleMarketingProtectedPath('.ai/skills/ESS-0014-google.md'), true);
  assert.equal(isGoogleMarketingProtectedPath('docs/adr/ADR-0042-consent.md'), true);
  assert.equal(isGoogleMarketingProtectedPath('src/components/Unrelated.tsx'), false);
});

test('accepts complete central Google Marketing wiring', () => {
  const root = fixture();
  try {
    assert.deepEqual(validateGoogleMarketingProtectedWiring(root), []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('fails closed when a protected central CI invariant is removed', () => {
  const root = fixture();
  try {
    const ci = path.join(root, '.github/workflows/ci.yml');
    fs.writeFileSync(ci, fs.readFileSync(ci, 'utf8').replace('      - run: npm run build\n', ''), 'utf8');
    const errors = validateGoogleMarketingProtectedWiring(root);
    assert.equal(errors.some((error) => error.includes('central CI evidence missing: build')), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
