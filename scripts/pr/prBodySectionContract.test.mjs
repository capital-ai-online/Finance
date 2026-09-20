import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  LEGACY_V16_REQUIRED_PR_SECTIONS,
  REQUIRED_PR_SECTIONS,
  bodyHasRequiredSection,
  canonicalizeKnownSectionHeadings,
  detectPrBodyContractVersion,
  findMissingRequiredSections,
} from './prBodySectionContract.mjs';

test('canonical PR template v1.8 contains exactly three human-decision sections', () => {
  const template = fs.readFileSync(
    path.join(process.cwd(), '.github/pull_request_template.md'),
    'utf8',
  );

  assert.equal(detectPrBodyContractVersion(template), '1.8.0');
  assert.deepEqual(findMissingRequiredSections(template), []);
  assert.equal(REQUIRED_PR_SECTIONS.length, 3);
  assert.deepEqual(
    template.match(/^## .+$/gm),
    REQUIRED_PR_SECTIONS,
  );

  for (const placeholder of [
    '{{DECISION_STATUS}}',
    '{{DECISION_MAIN}}',
    '{{DECISION_SCOPE}}',
    '{{DECISION_OVERLAP}}',
    '{{DECISION_CHECKS}}',
    '{{DECISION_SECURITY}}',
    '{{DECISION_BASELINE}}',
    '{{DECISION_MAIN_REASON}}',
    '{{DECISION_MAIN_NEXT}}',
    '{{DECISION_CHECKS_REASON}}',
    '{{DECISION_CHECKS_NEXT}}',
    '{{DECISION_SECURITY_REASON}}',
    '{{DECISION_SECURITY_NEXT}}',
    '{{DECISION_BASELINE_REASON}}',
    '{{DECISION_BASELINE_NEXT}}',
    '{{IMPACT_RISK}}',
    '{{EVIDENCE_SUMMARY}}',
    '{{BLOCKER_SUMMARY}}',
  ]) {
    assert.ok(template.includes(placeholder), 'missing v1.8 decision placeholder: ' + placeholder);
  }

  assert.ok(template.includes('<summary>Technische Details & Traceability</summary>'));
  assert.ok(template.includes('<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>'));
  assert.ok(template.includes('Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja'));
  assert.ok(template.includes([
    '- **Umsetzung:** {{IMPLEMENTATION_DETAIL}}',
    '- **Warum:** {{WHY_DETAIL}}',
    '- **Roadmap / Work Package:** {{ROADMAP}}',
  ].join('\n')));
  assert.equal(template.includes('{{IMPLEMENTATION_DETAIL}}\\n- **Warum:**'), false);
});

test('v1.6 canonical body remains legacy-compatible without becoming the current contract', () => {
  const v16Body = [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.6.0 -->',
    '## 1. 🎯 Kurzüberblick',
    '## 2. 📦 Projekt & Scope',
    '## 3. 🛠️ Umsetzung',
    '## 4. 📌 Priorität & Roadmap',
    '## 5. 🔢 Version & PR-Klasse',
    '## 6. ✅ Prüfung & Merge',
    '## 7. Maschinenlesbare Baseline',
  ].join('\n\n');

  assert.equal(detectPrBodyContractVersion(v16Body), '1.6.0');
  assert.deepEqual(findMissingRequiredSections(v16Body), []);
  assert.equal(LEGACY_V16_REQUIRED_PR_SECTIONS.length, 7);
});

test('v1.5 heading aliases remain narrowly compatible for already-open legacy PRs', () => {
  const v15Body = [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0 -->',
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

  const canonicalized = canonicalizeKnownSectionHeadings(v15Body, '1.6.0');
  for (const heading of LEGACY_V16_REQUIRED_PR_SECTIONS) {
    assert.ok(canonicalized.includes(heading), 'missing legacy canonical heading: ' + heading);
  }
});

test('pre-v1.5 aliases can be evaluated only when explicitly treated as legacy evidence', () => {
  const legacyBody = [
    '## 1. Arbeitsauftrag',
    '## 4. Umfang / Multi-Agent-Koordination',
    '## 5. Änderungszusammenfassung',
    '## 6. Architektur- / Governance-Auswirkungen',
    '## 9. PR-Checkklasse und auszuführende Checks',
    '## 12. Prüf- und Merge-Bereitschaft',
    '## 3. Produktions-Baseline — maschinenverwalteter / beratender Nachweis',
  ].join('\n\n');

  assert.deepEqual(findMissingRequiredSections(legacyBody, '1.5.0'), []);
  const canonicalized = canonicalizeKnownSectionHeadings(legacyBody, '1.6.0');
  for (const heading of LEGACY_V16_REQUIRED_PR_SECTIONS) assert.ok(canonicalized.includes(heading));
});

test('similar but non-contract v1.7 headings are rejected', () => {
  assert.equal(
    bodyHasRequiredSection(
      '## 3. 🔍 Technical Evidence erweitert',
      '## 3. 🔍 Technical Evidence',
      '1.8.0',
    ),
    false,
  );
});

test('renderer and validator are wired to the deterministic decision-state contract', () => {
  const renderer = fs.readFileSync('scripts/pr/renderPullRequestBody.mjs', 'utf8');
  const validator = fs.readFileSync('scripts/pr/validatePrBody.mjs', 'utf8');

  for (const token of [
    'deriveDecisionStatus',
    'formatDecisionGateState',
    'summarizeDecisionBlockers',
    'PR_DECISION_REQUIRED_CHECKS',
    'PR_DECISION_SECURITY_COMPLIANCE',
  ]) assert.ok(renderer.includes(token), 'renderer missing decision contract token: ' + token);

  for (const token of [
    'extractDecisionStatus',
    'extractDecisionGates',
    'deriveDecisionStatus',
    'Decision Status darf nicht manuell von der Evidence abweichen.',
    'exakt drei sichtbare Hauptabschnitte',
  ]) assert.ok(validator.includes(token), 'validator missing decision contract token: ' + token);

  assert.doesNotMatch(renderer, /benötigt Human-Freigabe/);
  assert.ok(renderer.includes('NOT_RUN — erforderlicher Check wurde noch nicht ausgeführt.'));
});
