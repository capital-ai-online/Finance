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

test('canonical PR template contains every compact required section', () => {
  const template = fs.readFileSync(
    path.join(process.cwd(), '.github/pull_request_template.md'),
    'utf8',
  );
  assert.deepEqual(findMissingRequiredSections(template), []);
  assert.equal(REQUIRED_PR_SECTIONS.length, 7);
});

test('previous canonical PR headings remain narrowly compatible for open PRs', () => {
  const legacyBody = [
    '## 1. Arbeitsauftrag',
    '## 4. Umfang / Multi-Agent-Koordination',
    '## 5. Änderungszusammenfassung',
    '## 6. Architektur- / Governance-Auswirkungen',
    '## 9. PR-Checkklasse und auszuführende Checks',
    '## 12. Prüf- und Merge-Bereitschaft',
    '## 3. Produktions-Baseline — maschinenverwalteter / beratender Nachweis',
  ].join('\n\n');

  assert.deepEqual(findMissingRequiredSections(legacyBody), []);
  assert.equal(bodyHasRequiredSection(legacyBody, '## 1. Herkunft'), true);

  const canonicalized = canonicalizeKnownSectionHeadings(legacyBody);
  for (const heading of REQUIRED_PR_SECTIONS) {
    assert.match(canonicalized, new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
  }
});

test('similar but non-contract headings are rejected', () => {
  assert.equal(
    bodyHasRequiredSection(
      '## 5. PR-Klasse erweitert',
      '## 5. PR-Klasse',
    ),
    false,
  );
});
