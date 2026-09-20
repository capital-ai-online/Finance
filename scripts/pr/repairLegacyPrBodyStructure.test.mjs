import assert from 'node:assert/strict';
import test from 'node:test';
import { findMissingRequiredSections } from './prBodySectionContract.mjs';
import { repairLegacyPrBodyStructure } from './repairLegacyPrBodyStructure.mjs';

const CURRENT = {
  project: '## 2. 📦 Projekt & Scope',
  roadmap: '## 4. 📌 Priorität & Roadmap',
  version: '## 5. 🔢 Version & PR-Klasse',
  check: '## 6. ✅ Prüfung & Merge',
};

const legacyBody = [
  '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0 -->',
  'CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0',
  '# CAPITAL-AI Pull Request',
  '',
  '## 1. Herkunft',
  '- **Branch:** agent/example → main',
  '',
  '## 2. Projektzuordnung',
  '- **Projekt:** CAPITAL-AI-OPS',
  '',
  '## 3. Umsetzung',
  '- Legacy implementation evidence stays intact.',
  '',
  '## 4. Exit Gate',
  'Runtime cutover is complete without legacy fallback.',
  '',
  '## 5. Prüfung',
  '- **Fresh main correlation:** PASS',
  '- **Human/CODEOWNER Merge erforderlich:** Ja.',
  '- **Agent-Self-Merge:** Nein.',
  '',
  '## 6. Abgrenzung',
  'External provider mutation is excluded.',
  '',
  '## Summary by CodeRabbit',
  '- Keep generated release notes.',
  '',
  '## 7. Maschinenlesbare Baseline',
  '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
  'CAPITAL_AI_PRODUCTION_BASELINE_START',
  '- **Baseline-ID:** sha256:test',
  'CAPITAL_AI_PRODUCTION_BASELINE_END',
  '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
  '',
].join('\n');

function assertV16Repair(
  result,
  {
    priority = 'P2 🟡 Normal',
    versionImpact = 'NOT_EVALUATED ⚪',
  } = {},
) {
  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.deepEqual(findMissingRequiredSections(result.body), []);
  assert.match(result.body, /CAPITAL_AI_PR_TEMPLATE_VERSION: 1\.6\.0/);
  assert.match(result.body, /^## 4\. 📌 Priorität & Roadmap$/m);
  assert.ok(result.body.includes('- **Priorität:** ' + priority));
  assert.match(result.body, /^## 5\. 🔢 Version & PR-Klasse$/m);
  assert.ok(result.body.includes('- **Versionsimpact:** ' + versionImpact));
  assert.match(result.body, /- \*\*Version-Manager-Check:\*\* NOT_RUN/);
  assert.match(result.body, /^## 6\. ✅ Prüfung & Merge$/m);
  assert.match(result.body, /Human-\/CODEOWNER-Freigabe für Merge erforderlich:\*\* Ja/);
  assert.equal((result.body.match(/CAPITAL_AI_PRODUCTION_BASELINE_START/g) || []).length, 2);
  assert.equal((result.body.match(/CAPITAL_AI_PRODUCTION_BASELINE_END/g) || []).length, 2);
}


test('normalizes the merge gate in an otherwise canonical v1.6 body', () => {
  const body = [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.6.0 -->',
    'CAPITAL_AI_PR_TEMPLATE_VERSION: 1.6.0',
    '# CAPITAL-AI Pull Request',
    '',
    '## 1. 🎯 Kurzüberblick',
    '- Exact evidence remains unchanged.',
    '',
    '## 2. 📦 Projekt & Scope',
    '- **Projekt:** CAPITAL-AI-OPS',
    '',
    '## 3. 🛠️ Umsetzung',
    '- Existing implementation stays intact.',
    '',
    '## 4. 📌 Priorität & Roadmap',
    '- **Priorität:** P1 🟠 Hoch',
    '',
    '## 5. 🔢 Version & PR-Klasse',
    '- **Versionsimpact:** NONE ➖',
    '- **Version-Manager-Check:** STATIC_ONLY',
    '',
    '## 6. ✅ Prüfung & Merge',
    '- **Human-/CODEOWNER-Merge erforderlich:** Ja',
    '- **Self-/Auto-Merge:** Nein',
    '',
    '## 7. Maschinenlesbare Baseline',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
    'CAPITAL_AI_PRODUCTION_BASELINE_START',
    '- **Baseline-ID:** sha256:test',
    'CAPITAL_AI_PRODUCTION_BASELINE_END',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
    '',
  ].join('\n');

  assert.deepEqual(findMissingRequiredSections(body), []);
  const result = repairLegacyPrBodyStructure(body, { prClass: 'R' });
  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.equal(result.reason, 'current-template-merge-gate-normalized');
  assert.match(result.body, /- \*\*Human-\/CODEOWNER-Freigabe für Merge erforderlich:\*\* Ja/);
  assert.doesNotMatch(result.body, /Human-\/CODEOWNER-Merge erforderlich/);
  assert.match(result.body, /Exact evidence remains unchanged\./);
});

test('repairs only the allowlisted legacy v1.5 structure and upgrades it to v1.6', () => {
  assert.deepEqual(findMissingRequiredSections(legacyBody), [CURRENT.roadmap, CURRENT.version, CURRENT.check]);
  const result = repairLegacyPrBodyStructure(legacyBody, { prClass: 'R' });
  assertV16Repair(result);
  assert.equal(result.reason, 'legacy-to-v1.6-structure-repaired');
  assert.match(result.body, /- \*\*Klasse:\*\* R/);
  assert.match(result.body, /^### Abgrenzung$/m);
  assert.match(result.body, /Runtime cutover is complete without legacy fallback\./);
  assert.match(result.body, /Keep generated release notes\./);
});

const currentV16SecurityBoundaryBody = [
  '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.6.0 -->',
  'CAPITAL_AI_PR_TEMPLATE_VERSION: 1.6.0',
  '# CAPITAL-AI Pull Request',
  '',
  '> **P1 🟠 Hoch · NONE ➖ · PR-Klasse C**',
  '> Existing review-stack change.',
  '',
  '## 1. 🎯 Kurzüberblick',
  '- Existing overview stays intact.',
  '',
  '## 2. 📦 Projekt & Scope',
  '- **Projekt:** CAPITAL-AI-OPS',
  '',
  '## 3. 🛠️ Umsetzung',
  '- Existing implementation stays intact.',
  '',
  '## 4. 🔐 Security Boundary',
  '- Least-privilege review boundary remains advisory.',
  '',
  '## 5. ✅ Prüfung & Merge',
  '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
  '- **Agent-Self-Merge / Auto-Merge:** Nein.',
  '',
  '## 6. 🔢 Version',
  '- **Versionsimpact:** NONE ➖',
  '- **PR-Klasse:** C',
  '- **Begründung:** Workflow review infrastructure only.',
  '',
  '## 7. Maschinenlesbare Baseline',
  '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
  'CAPITAL_AI_PRODUCTION_BASELINE_START',
  '- **Baseline-ID:** sha256:test',
  'CAPITAL_AI_PRODUCTION_BASELINE_END',
  '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
  '',
].join('\n');

test('repairs the observed current v1.6 security-boundary shape without inventing priority', () => {
  assert.deepEqual(findMissingRequiredSections(currentV16SecurityBoundaryBody), [
    CURRENT.roadmap,
    CURRENT.version,
    CURRENT.check,
  ]);

  const result = repairLegacyPrBodyStructure(currentV16SecurityBoundaryBody, { prClass: 'C' });
  assertV16Repair(result, { priority: 'P1 🟠 Hoch', versionImpact: 'NONE ➖' });
  assert.equal(result.reason, 'current-v1.6-security-boundary-shape-repaired');
  assert.match(result.body, /^### 🔐 Security Boundary$/m);
  assert.match(result.body, /- \*\*Priorität:\*\* P1 🟠 Hoch/);
  assert.match(result.body, /- \*\*Versionsimpact:\*\* NONE ➖/);
  assert.match(result.body, /- \*\*PR-Klasse:\*\* C/);
  assert.match(result.body, /- \*\*Version-Manager-Check:\*\* NOT_RUN/);
  assert.match(result.body, /Least-privilege review boundary remains advisory\./);
  assert.match(result.body, /Human-\/CODEOWNER-Freigabe für Merge erforderlich:\*\* Ja/);
});

test('preserves replacement-like PR text as inert data during current v1.6 repair', () => {
  const body = currentV16SecurityBoundaryBody.replace(
    '- Least-privilege review boundary remains advisory.',
    '- Literal replacement tokens stay inert: test('refuses a lookalike current v1.6 security shape outside the exact allowlist', () => { $1 $',
  );
  const result = repairLegacyPrBodyStructure(body, { prClass: 'C' });
  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.match(result.body, /Literal replacement tokens stay inert: \test('refuses a lookalike current v1.6 security shape outside the exact allowlist', () => { \$1 \$\$/);
  assert.doesNotMatch(result.body, /## 4\. 🔐 Security Boundary[\s\S]*## 4\. 🔐 Security Boundary/);
});

test('refuses a lookalike current v1.6 security shape outside the exact allowlist', () => {
  const body = currentV16SecurityBoundaryBody.replace(
    '## 4. 🔐 Security Boundary',
    '## 4. 🔐 Security Boundaries',
  );
  const result = repairLegacyPrBodyStructure(body, { prClass: 'C' });
  assert.equal(result.eligible, false);
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'unsupported-legacy-shape');
});

test('refuses to rewrite an unsupported malformed body', () => {
  const body = legacyBody.replace('## 6. Abgrenzung', '## 6. Something Else');
  const result = repairLegacyPrBodyStructure(body, { prClass: 'R' });
  assert.equal(result.eligible, false);
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'unsupported-legacy-shape');
});

test('requires a trusted D/C/R classification before an eligible write', () => {
  assert.throws(() => repairLegacyPrBodyStructure(legacyBody, { prClass: 'UNKNOWN' }), /Trusted PR class must be one of D\/C\/R/);
});

const partialLegacyBody = [
  '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0 -->',
  'CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0',
  '# CAPITAL-AI Pull Request',
  '',
  '## 1. Herkunft',
  '- **Branch:** agent/fintech-example → main',
  '',
  '## 2. Projektzuordnung',
  '- **Projekt:** CAPITAL-AI-FINTECH',
  '',
  '## 3. Umsetzung',
  '- FIN-12 evidence remains untouched.',
  '',
  '## 4. Work Package / Exit Gate',
  '- **Work Package:** CAPITAL-AI-FINTECH / FIN-12.',
  '- **Exit Gate:** invalid evidence remains NOT_COMPUTABLE.',
  '',
  '## 5. PR-Klasse',
  '- **Klasse:** C — Code / Tests / Validated-Data Contract.',
  '',
  '## 6. Aktuelle Korrelation',
  '- **CURRENT_MAIN:** exact.',
  '- **Human/CODEOWNER Merge:** erforderlich; kein Agent-Self-Merge/Auto-Merge.',
  '',
  '## 7. Maschinenlesbare Baseline',
  '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
  'CAPITAL_AI_PRODUCTION_BASELINE_START',
  '- **Baseline-ID:** sha256:test',
  'CAPITAL_AI_PRODUCTION_BASELINE_END',
  '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
  '',
].join('\n');

test('repairs the allowlisted partial legacy shape without rewriting its PR-class evidence', () => {
  assert.deepEqual(findMissingRequiredSections(partialLegacyBody), [CURRENT.roadmap, CURRENT.check]);
  const result = repairLegacyPrBodyStructure(partialLegacyBody, { prClass: 'C' });
  assertV16Repair(result);
  assert.equal(result.reason, 'legacy-to-v1.6-partial-structure-repaired');
  assert.match(result.body, /\*\*Klasse:\*\* C — Code \/ Tests \/ Validated-Data Contract\./);
  assert.match(result.body, /FIN-12 evidence remains untouched\./);
  assert.match(result.body, /Agent-Self-Merge\/Auto-Merge:\*\* Nein\./);
});

test('refuses an unsupported partial legacy heading shape', () => {
  const body = partialLegacyBody.replace('## 6. Aktuelle Korrelation', '## 6. Andere Korrelation');
  const result = repairLegacyPrBodyStructure(body, { prClass: 'C' });
  assert.equal(result.eligible, false);
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'unsupported-partial-legacy-shape');
});

const projectOwnerLegacyBody = [
  '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0 -->',
  'CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0',
  '# CAPITAL-AI Pull Request',
  '',
  '## 1. Herkunft',
  '- **Branch:** agent/data-gemini-example → main',
  '',
  '## 2. Projekt-/Owner-Zuordnung',
  '- **Aktuelle Authority:** CAPITAL-AI-FINTECH.',
  '',
  '## 3. Umsetzung',
  '- Gemini Free-Tier behavior remains unchanged.',
  '',
  '## 4. Zero-Cost-Invariante',
  '- Kein Paid-Mode.',
  '',
  '## 5. Validierung',
  '- Hosted checks bind to the exact head.',
  '',
  '## 6. Merge-Abhängigkeiten',
  '- Kein Agent-Self-Merge, kein Auto-Merge.',
  '',
  '## 7. Maschinenlesbare Baseline',
  '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
  'CAPITAL_AI_PRODUCTION_BASELINE_START',
  '- **Baseline-ID:** sha256:test',
  'CAPITAL_AI_PRODUCTION_BASELINE_END',
  '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
  '',
].join('\n');

test('repairs the project/owner legacy shape, upgrades to v1.6 and preserves semantic subsections', () => {
  assert.deepEqual(findMissingRequiredSections(projectOwnerLegacyBody), [
    CURRENT.project,
    CURRENT.roadmap,
    CURRENT.version,
    CURRENT.check,
  ]);
  const result = repairLegacyPrBodyStructure(projectOwnerLegacyBody, { prClass: 'R' });
  assertV16Repair(result);
  assert.equal(result.reason, 'legacy-to-v1.6-project-owner-structure-repaired');
  assert.match(result.body, /^## 2\. 📦 Projekt & Scope$/m);
  assert.match(result.body, /^### Zero-Cost-Invariante$/m);
  assert.match(result.body, /^### Validierung$/m);
  assert.match(result.body, /^### Merge-Abhängigkeiten$/m);
  assert.match(result.body, /Gemini Free-Tier behavior remains unchanged\./);
});

test('refuses an unsupported project/owner legacy heading shape', () => {
  const body = projectOwnerLegacyBody.replace('## 6. Merge-Abhängigkeiten', '## 6. Andere Abhängigkeiten');
  const result = repairLegacyPrBodyStructure(body, { prClass: 'R' });
  assert.equal(result.eligible, false);
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'unsupported-project-owner-legacy-shape');
});
