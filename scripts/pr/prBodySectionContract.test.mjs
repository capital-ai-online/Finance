import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  REQUIRED_PR_SECTIONS,
  bodyHasRequiredSection,
  canonicalizeKnownSectionHeadings,
  findMissingRequiredSections,
} from './prBodySectionContract.mjs';

test('canonical PR template contains every required section', () => {
  const template = fs.readFileSync(
    path.join(process.cwd(), '.github/pull_request_template.md'),
    'utf8',
  );
  assert.deepEqual(findMissingRequiredSections(template), []);
});

test('legacy merge-authorization heading remains a narrow compatible alias', () => {
  const body = REQUIRED_PR_SECTIONS.join('\n\n').replace(
    '## 8. Merge-Autorisierung (vereinfacht)',
    '## 8. Merge-Autorisierung',
  );

  assert.deepEqual(findMissingRequiredSections(body), []);
  assert.equal(
    bodyHasRequiredSection(body, '## 8. Merge-Autorisierung (vereinfacht)'),
    true,
  );

  const canonicalized = canonicalizeKnownSectionHeadings(body);
  assert.match(canonicalized, /^## 8\. Merge-Autorisierung \(vereinfacht\)$/m);
  assert.doesNotMatch(canonicalized, /^## 8\. Merge-Autorisierung$/m);
});

test('similar but non-contract headings are rejected', () => {
  assert.equal(
    bodyHasRequiredSection(
      '## 8. Merge-Autorisierung erweitert',
      '## 8. Merge-Autorisierung (vereinfacht)',
    ),
    false,
  );
});
