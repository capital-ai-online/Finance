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

test('canonical PR template contains every compact v1.6 section and human-first field', () => {
  const template = fs.readFileSync(
    path.join(process.cwd(), '.github/pull_request_template.md'),
    'utf8',
  );
  assert.deepEqual(findMissingRequiredSections(template), []);
  assert.equal(REQUIRED_PR_SECTIONS.length, 7);
  for (const placeholder of ['{{PRIORITY}}', '{{PRIORITY_REASON}}', '{{VERSION_IMPACT}}', '{{VERSION_MANAGER_CHECK}}']) {
    assert.ok(template.includes(placeholder), 'missing human-first placeholder: ' + placeholder);
  }
  assert.match(template, /P0 🔴 Kritisch · P1 🟠 Hoch · P2 🟡 Normal · P3 🟢 Niedrig/);
  assert.match(template, /NOT_EVALUATED ⚪ · NONE ➖ · PATCH 🩹 · MINOR ✨ · MAJOR 💥/);
});

test('v1.5 canonical PR headings remain narrowly compatible for open PRs', () => {
  const v15Body = [
    '## 1. Herkunft',
    '## 2. Projektzuordnung',
    '## 3. Umsetzung',
    '## 4. Roadmap',
    '## 5. PR-Klasse',
    '## 6. Prüfung',
    '## 7. Maschinenlesbare Baseline',
  ].join('\n\n');

  assert.deepEqual(findMissingRequiredSections(v15Body), []);
  assert.equal(bodyHasRequiredSection(v15Body, '## 1. 🎯 Kurzüberblick'), true);

  const canonicalized = canonicalizeKnownSectionHeadings(v15Body);
  const canonicalLines = new Set(canonicalized.split(/\r?\n/));
  for (const heading of REQUIRED_PR_SECTIONS) assert.ok(canonicalLines.has(heading), 'missing canonical heading: ' + heading);
});

test('pre-v1.5 canonical aliases remain compatible without becoming a second contract', () => {
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
  const canonicalized = canonicalizeKnownSectionHeadings(legacyBody);
  for (const heading of REQUIRED_PR_SECTIONS) assert.ok(canonicalized.includes(heading));
});

test('similar but non-contract headings are rejected', () => {
  assert.equal(
    bodyHasRequiredSection(
      '## 5. 🔢 Version & PR-Klasse erweitert',
      '## 5. 🔢 Version & PR-Klasse',
    ),
    false,
  );
});
