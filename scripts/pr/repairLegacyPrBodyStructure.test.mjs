import assert from 'node:assert/strict';
import test from 'node:test';
import { findMissingRequiredSections } from './prBodySectionContract.mjs';
import {
  repairLegacyPrBodyStructure,
  validatePrMutationBoundary,
} from './repairLegacyPrBodyStructure.mjs';

const CURRENT = {
  project: '## 2. 📦 Projekt & Scope',
  roadmap: '## 4. 📌 Priorität & Roadmap',
  version: '## 5. 🔢 Version & PR-Klasse',
  check: '## 6. ✅ Prüfung & Merge',
};

const BOUNDARY_REPOSITORY = 'capital-ai-online/Finance';
const BOUNDARY_MAIN_SHA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const BOUNDARY_HEAD_SHA = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const HISTORICAL_PR_BASE_SHA = 'cccccccccccccccccccccccccccccccccccccccc';

function boundaryFixture() {
  return {
    livePr: {
      state: 'open',
      base: { ref: 'main', sha: HISTORICAL_PR_BASE_SHA },
      head: {
        sha: BOUNDARY_HEAD_SHA,
        repo: { full_name: BOUNDARY_REPOSITORY },
      },
    },
    liveMain: { commit: { sha: BOUNDARY_MAIN_SHA } },
    repository: BOUNDARY_REPOSITORY,
    expectedHeadSha: BOUNDARY_HEAD_SHA,
    expectedMainSha: BOUNDARY_MAIN_SHA,
    mainIsAncestorOfHead: true,
  };
}

test('accepts a synchronized PR when pull.base.sha is historical but current main is an ancestor of the exact head', () => {
  const fixture = boundaryFixture();
  assert.notEqual(fixture.livePr.base.sha, fixture.expectedMainSha);
  assert.equal(validatePrMutationBoundary(fixture), '');
});

test('fails closed when exact current main is not an ancestor of the exact PR head', () => {
  const fixture = boundaryFixture();
  fixture.mainIsAncestorOfHead = false;
  assert.equal(validatePrMutationBoundary(fixture), 'main-not-ancestor-of-head');
});

test('fails closed when live main moved after the expected main snapshot was bound', () => {
  const fixture = boundaryFixture();
  fixture.liveMain.commit.sha = 'dddddddddddddddddddddddddddddddddddddddd';
  assert.equal(validatePrMutationBoundary(fixture), 'main-drift');
});

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

const currentV16GenericMissingSectionsBody = [
  '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.6.0 -->',
  'CAPITAL_AI_PR_TEMPLATE_VERSION: 1.6.0',
  '# CAPITAL-AI Pull Request',
  '',
  '> **P1 🟠 Hoch · PATCH 🩹 · PR-Klasse M**',
  '> Enterprise Cost Center Writer aktivieren',
  '',
  '## 1. 🎯 Kurzüberblick',
  '- Existing overview stays intact.',
  '',
  '## 2. 📦 Projekt & Scope',
  '- **Projekt:** CAPITAL-AI-OPS · Operations',
  '',
  '## 3. 🛠️ Umsetzung',
  '- Existing implementation stays intact.',
  '',
  '## 4. 🔐 Provider-Voraussetzung',
  '- Enterprise billing: write is required.',
  '',
  '## 5. ✅ Prüfung & Merge',
  '- **Human-/CODEOWNER-Merge erforderlich:** Ja',
  '- **Agent-Self-Merge / Auto-Merge:** Nein',
  '',
  '## 6. Erwartete Provider-Mutation',
  '- name: Enterprise',
  '',
  '## 7. Maschinenlesbare Baseline',
  '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
  'CAPITAL_AI_PRODUCTION_BASELINE_START',
  '- **Baseline-ID:** sha256:test',
  'CAPITAL_AI_PRODUCTION_BASELINE_END',
  '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
  '',
].join('\n');

test('repairs a current v1.6 body with generic conflicting sections 4-6 like PR #1123', () => {
  assert.deepEqual(findMissingRequiredSections(currentV16GenericMissingSectionsBody), [
    CURRENT.roadmap,
    CURRENT.version,
    CURRENT.check,
  ]);

  const result = repairLegacyPrBodyStructure(currentV16GenericMissingSectionsBody, { prClass: 'C' });

  assertV16Repair(result, { priority: 'P1 🟠 Hoch', versionImpact: 'PATCH 🩹' });
  assert.equal(result.reason, 'current-v1.6-generic-missing-sections-repaired');
  assert.match(result.body, /^### 🔐 Provider-Voraussetzung$/m);
  assert.match(result.body, /^### ✅ Prüfung & Merge$/m);
  assert.match(result.body, /^### Erwartete Provider-Mutation$/m);
  assert.match(result.body, /- \*\*PR-Klasse:\*\* M/);
  assert.match(result.body, /trusted-main Scope-Klassifikation für den Reparaturpfad: C/);
  assert.match(result.body, /Enterprise billing: write is required\./);
  assert.match(result.body, /name: Enterprise/);
  assert.doesNotMatch(result.body, /^## 4\. 🔐 Provider-Voraussetzung$/m);
  assert.doesNotMatch(result.body, /^## 5\. ✅ Prüfung & Merge$/m);
  assert.doesNotMatch(result.body, /^## 6\. Erwartete Provider-Mutation$/m);
});

test('preserves replacement-like PR text as inert data during current v1.6 repair', () => {
  const body = currentV16SecurityBoundaryBody.replace(
    '- Least-privilege review boundary remains advisory.',
    () => '- Literal replacement tokens stay inert: $& $1 $$',
  );
  const result = repairLegacyPrBodyStructure(body, { prClass: 'C' });
  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.ok(result.body.includes('Literal replacement tokens stay inert: $& $1 $$'));
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


test('bootstraps a markerless free-form PR body into v1.6 while preserving it as quoted evidence', () => {
  const body = [
    '## 🧭 Ziel',
    'Konvergiert bestehende Repository-Struktur.',
    '',
    '## 🔧 Änderungen',
    '- Bestehende Aussage bleibt erhalten.',
    '',
    '## 🛡️ Governance',
    '- Human merge bleibt erforderlich.',
  ].join('\n');

  const result = repairLegacyPrBodyStructure(body, {
    prClass: 'C',
    durableClaimEvidence: ['CLAIM-123', '.ai/work-claims/CLAIM-123.json'],
  });

  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.equal(result.reason, 'markerless-body-bootstrapped-to-v1.6');
  assert.deepEqual(findMissingRequiredSections(result.body), []);
  assert.match(result.body, /CAPITAL_AI_PR_TEMPLATE_VERSION: 1\.6\.0/);
  assert.match(result.body, /- \*\*Priorität:\*\* P2 🟡 Normal/);
  assert.match(result.body, /- \*\*Versionsimpact:\*\* NOT_EVALUATED ⚪/);
  assert.match(result.body, /- \*\*PR-Klasse:\*\* C/);
  assert.match(result.body, /keine separate Start-Freigabe erforderlich/);
  assert.match(result.body, /- \*\*Dauerhafte Claim-Evidence:\*\* CLAIM-123/);
  assert.match(result.body, /> ## 🧭 Ziel/);
  assert.match(result.body, /> - Bestehende Aussage bleibt erhalten\./);
  assert.equal((result.body.match(/CAPITAL_AI_PRODUCTION_BASELINE_START/g) || []).length, 0);
  assert.match(result.body, /^## 7\. Maschinenlesbare Baseline$/m);
});

test('markerless bootstrap stays fail-closed for unresolved placeholders or baseline marker fragments', () => {
  const unresolved = repairLegacyPrBodyStructure('Text {{PROJECT_ID}}', { prClass: 'C' });
  assert.equal(unresolved.eligible, false);
  assert.equal(unresolved.reason, 'markerless-body-has-unresolved-placeholders');

  const partialBaseline = repairLegacyPrBodyStructure('Text CAPITAL_AI_PRODUCTION_BASELINE_START', { prClass: 'C' });
  assert.equal(partialBaseline.eligible, false);
  assert.equal(partialBaseline.reason, 'markerless-body-has-baseline-markers');
});


test('canonical current v1.8 Human Decision + Live Dashboard body is left unchanged', () => {
  const body = [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->',
    '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`',
    '# Human Decision PR',
    '',
    '> 🧭 **Entscheidungsstatus: EVIDENCE_PENDING**',
    '> P2 🟡 Normal · PR-Klasse C · NONE ➖',
    '',
    '## 1. 🧭 Entscheidung',
    '| Frage | Ergebnis |',
    '|---|---|',
    '| Owner-Aktion | Human/CODEOWNER Merge erforderlich |',
    '',
    '## 2. ✅ Evidence',
    '| Gate | Status |',
    '|---|---|',
    '| Current Main | 🟢 PASS |',
    '| Scope / Ownership | 🟢 PASS |',
    '| Overlap | 🟡 PENDING |',
    '| Required Checks | 🟡 PENDING |',
    '| Security / Compliance | 🟡 PENDING |',
    '| Production Baseline | 🟢 PASS |',
    '',
    '## 3. 🔍 Technical Evidence',
    '<details>',
    '<summary>Technische Details & Traceability</summary>',
    '',
    '- **Priorität:** P2 🟡 Normal',
    '- **Versionsimpact:** NONE ➖',
    '- **Version-Manager-Check:** PASS — fixture evidence.',
    '- **PR-Klasse:** C',
    '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
    '',
    '</details>',
    '',
    '<details>',
    '<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>',
    '',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
    '`CAPITAL_AI_PRODUCTION_BASELINE_START`',
    '- **Baseline-ID:** `sha256:test`',
    '`CAPITAL_AI_PRODUCTION_BASELINE_END`',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
    '',
    '</details>',
  ].join('\n');

  const result = repairLegacyPrBodyStructure(body, { prClass: 'C' });
  assert.equal(result.eligible, false);
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'already-canonical');
  assert.equal(result.body, body);
});

test('normalizes only the observed current v1.8 P0-HIGHEST priority token', () => {
  const body = [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->',
    '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`',
    '# Human Decision PR',
    '',
    '> 🧭 **Entscheidungsstatus: EVIDENCE_PENDING**',
    '> P0-HIGHEST 🔴 Kritisch · PR-Klasse C · NONE ➖',
    '',
    '## 1. 🧭 Entscheidung',
    '| Frage | Ergebnis |',
    '|---|---|',
    '| Owner-Aktion | Human/CODEOWNER Merge erforderlich |',
    '',
    '## 2. ✅ Evidence',
    '| Gate | Status |',
    '|---|---|',
    '| Current Main | 🟢 PASS |',
    '',
    '## 3. 🔍 Technical Evidence',
    '',
    '<details>',
    '<summary>Technische Details & Traceability</summary>',
    '',
    '- **Priorität:** P0-HIGHEST 🔴 Kritisch',
    '- **Versionsimpact:** NONE ➖',
    '- **Version-Manager-Check:** PASS — fixture evidence.',
    '- **PR-Klasse:** C',
    '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
    '',
    '</details>',
    '',
    '<details>',
    '<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>',
    '',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
    '`CAPITAL_AI_PRODUCTION_BASELINE_START`',
    '- **Baseline-ID:** `sha256:test`',
    '`CAPITAL_AI_PRODUCTION_BASELINE_END`',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
    '',
    '</details>',
  ].join('\n');

  const result = repairLegacyPrBodyStructure(body, { prClass: 'C' });
  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.equal(result.reason, 'current-v1.8-priority-token-normalized');
  assert.match(result.body, /^> P0 🔴 Kritisch · PR-Klasse C · NONE ➖$/m);
  assert.match(result.body, /^- \*\*Priorität:\*\* P0 🔴 Kritisch$/m);
  assert.doesNotMatch(result.body, /P0-HIGHEST 🔴 Kritisch/);
});


test('repairs PR #1297-style v1.8 required metadata omissions from canonical banner and durable branch evidence', () => {
  const body = [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->',
    '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`',
    '# OPS-08-B-SH-02.10',
    '',
    '> 🧭 **Entscheidungsstatus: BLOCKED**',
    '> P0 🔴 Kritisch · PR-Klasse C · PATCH 🩹',
    '',
    '## 1. 🧭 Entscheidung',
    '| Frage | Ergebnis |',
    '|---|---|',
    '| Owner-Aktion | Human/CODEOWNER Merge erforderlich |',
    '',
    '## 2. ✅ Evidence',
    '| Gate | Status |',
    '|---|---|',
    '| Current Main | 🟢 PASS |',
    '',
    '## 3. 🔍 Technical Evidence',
    '',
    '<details>',
    '<summary>Technische Details & Traceability</summary>',
    '',
    '- **Claim:** `OPS-08-B-SH-02-10-FAULT-CONVERGENCE-20260922`',
    '- **Merge-Modus:** HUMAN_MERGE_REQUIRED',
    '',
    '</details>',
    '',
    '<details>',
    '<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>',
    '',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
    '`CAPITAL_AI_PRODUCTION_BASELINE_START`',
    '- **Baseline-ID:** `sha256:test`',
    '`CAPITAL_AI_PRODUCTION_BASELINE_END`',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
    '',
    '</details>',
  ].join('\n');

  const result = repairLegacyPrBodyStructure(body, {
    prClass: 'C',
    durableClaimEvidence: [
      'OPS-08-B-SH-02-10-FAULT-CONVERGENCE-20260922',
      '.ai/work-claims/OPS-08-B-SH-02-10-FAULT-CONVERGENCE-20260922.json',
    ],
  });

  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.equal(result.reason, 'current-v1.8-required-metadata-repaired');
  assert.match(result.body, /^- \*\*Priorität:\*\* P0 🔴 Kritisch$/m);
  assert.match(result.body, /^- \*\*Versionsimpact:\*\* PATCH 🩹$/m);
  assert.match(result.body, /^- \*\*Version-Manager-Check:\*\* NOT_RUN /m);
  assert.match(result.body, /^- \*\*PR-Klasse:\*\* C$/m);
  assert.match(result.body, /^- \*\*Human-\/CODEOWNER-Freigabe für Merge erforderlich:\*\* Ja$/m);
  assert.match(
    result.body,
    /- \*\*Dauerhafte Claim-Evidence:\*\* \.ai\/work-claims\/OPS-08-B-SH-02-10-FAULT-CONVERGENCE-20260922\.json/,
  );
  assert.equal((result.body.match(/^- \*\*Priorität:\*\*/gm) || []).length, 1);
  assert.equal((result.body.match(/^- \*\*Versionsimpact:\*\*/gm) || []).length, 1);
});

test('keeps current v1.8 required metadata repair fail-closed when the canonical banner cannot resolve missing values', () => {
  const body = [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->',
    '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`',
    '# Ambiguous Human Decision PR',
    '',
    '> 🧭 **Entscheidungsstatus: BLOCKED**',
    '',
    '## 1. 🧭 Entscheidung',
    '## 2. ✅ Evidence',
    '## 3. 🔍 Technical Evidence',
    '<details>',
    '<summary>Technische Details & Traceability</summary>',
    '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
    '</details>',
    '<details>',
    '<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
    '`CAPITAL_AI_PRODUCTION_BASELINE_START`',
    '- **Baseline-ID:** `sha256:test`',
    '`CAPITAL_AI_PRODUCTION_BASELINE_END`',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
    '</details>',
  ].join('\n');

  const result = repairLegacyPrBodyStructure(body, { prClass: 'C' });
  assert.equal(result.eligible, false);
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'current-v1.8-required-metadata-unresolved');
  assert.equal(result.body, body);
});

test('repairs only the exact current v1.8 legacy baseline-section migration artifact', () => {
  const baseline = [
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
    '`CAPITAL_AI_PRODUCTION_BASELINE_START`',
    '- **Baseline-ID:** `sha256:test`',
    '- **Produktions-Commit:** `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`',
    '- **Aktueller main-Commit:** `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`',
    '- **PR-Head-Commit:** `cccccccccccccccccccccccccccccccccccccccc`',
    '`CAPITAL_AI_PRODUCTION_BASELINE_END`',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
  ].join('\n');
  const body = [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->',
    '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`',
    '# Human Decision PR',
    '',
    '> 🧭 **Entscheidungsstatus: EVIDENCE_PENDING**',
    '',
    '## 1. 🧭 Entscheidung',
    '| Frage | Ergebnis |',
    '|---|---|',
    '| Owner-Aktion | Human/CODEOWNER Merge erforderlich |',
    '',
    '## 2. ✅ Evidence',
    '| Gate | Status |',
    '|---|---|',
    '| Current Main | 🟢 PASS |',
    '',
    '## 3. 🔍 Technical Evidence',
    '',
    '<details>',
    '<summary>Technische Details & Traceability</summary>',
    '',
    '- Fachliche Evidence bleibt exakt erhalten.',
    '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
    '',
    '</details>',
    '',
    '<details>',
    '<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>',
    '',
    '{{PRODUCTION_BASELINE_BLOCK}}',
    '',
    '</details>',
    '',
    '## 7. Maschinenlesbare Baseline',
    '',
    baseline,
    '',
  ].join('\n');

  const result = repairLegacyPrBodyStructure(body, { prClass: 'C' });
  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.equal(result.reason, 'current-v1.8-legacy-baseline-section-repaired');
  assert.deepEqual(result.body.match(/^## .+$/gm), [
    '## 1. 🧭 Entscheidung',
    '## 2. ✅ Evidence',
    '## 3. 🔍 Technical Evidence',
  ]);
  assert.doesNotMatch(result.body, /\{\{PRODUCTION_BASELINE_BLOCK\}\}/);
  assert.doesNotMatch(result.body, /^## 7\. Maschinenlesbare Baseline$/m);
  assert.equal((result.body.match(/CAPITAL_AI_PRODUCTION_BASELINE_START/g) || []).length, 2);
  assert.equal((result.body.match(/CAPITAL_AI_PRODUCTION_BASELINE_END/g) || []).length, 2);
  assert.match(result.body, /Fachliche Evidence bleibt exakt erhalten\./);
  assert.match(
    result.body,
    /<summary>🤖 Maschinenlesbare Produktions-Baseline<\/summary>[\s\S]*sha256:test[\s\S]*<\/details>/,
  );
});

test('repairs the exact current v1.8 baseline-only legacy section observed on PR #1193', () => {
  const baseline = [
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
    '`CAPITAL_AI_PRODUCTION_BASELINE_START`',
    '- **Baseline-ID:** `sha256:test`',
    '- **Produktions-Commit:** `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`',
    '- **Aktueller main-Commit:** `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`',
    '- **PR-Head-Commit:** `cccccccccccccccccccccccccccccccccccccccc`',
    '`CAPITAL_AI_PRODUCTION_BASELINE_END`',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
  ].join('\n');
  const body = [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->',
    '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`',
    '# Human Decision PR',
    '',
    '> 🧭 **Entscheidungsstatus: EVIDENCE_PENDING**',
    '',
    '## 1. 🧭 Entscheidung',
    '| Frage | Ergebnis |',
    '|---|---|',
    '| Human-/CODEOWNER-Entscheidung | Erforderlich |',
    '',
    '## 2. ✅ Evidence',
    '| Gate | Status |',
    '|---|---|',
    '| Current Main | 🟢 PASS |',
    '| Changed-file overlap | 🟢 PASS |',
    '',
    '## 3. 🔍 Technical Evidence',
    '- Fachliche Evidence bleibt exakt erhalten.',
    '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
    '',
    '## 7. Maschinenlesbare Baseline',
    '',
    baseline,
    '',
  ].join('\n');

  const result = repairLegacyPrBodyStructure(body, { prClass: 'C' });
  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.equal(result.reason, 'current-v1.8-legacy-baseline-only-section-repaired');
  assert.deepEqual(result.body.match(/^## .+$/gm), [
    '## 1. 🧭 Entscheidung',
    '## 2. ✅ Evidence',
    '## 3. 🔍 Technical Evidence',
  ]);
  assert.doesNotMatch(result.body, /^## 7\. Maschinenlesbare Baseline$/m);
  assert.equal((result.body.match(/CAPITAL_AI_PRODUCTION_BASELINE_START/g) || []).length, 2);
  assert.equal((result.body.match(/CAPITAL_AI_PRODUCTION_BASELINE_END/g) || []).length, 2);
  assert.match(result.body, /Fachliche Evidence bleibt exakt erhalten\./);
  assert.match(
    result.body,
    /<summary>🤖 Maschinenlesbare Produktions-Baseline<\/summary>[\s\S]*sha256:test[\s\S]*<\/details>/,
  );
});

test('other malformed current v1.8 shapes remain fail-closed', () => {
  const body = [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->',
    '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`',
    '## 1. 🧭 Entscheidung',
    '## 2. ✅ Evidence',
    '## 3. 🔍 Technical Evidence',
    '## 4. Unexpected',
  ].join('\n');
  const result = repairLegacyPrBodyStructure(body, { prClass: 'C' });
  assert.equal(result.eligible, false);
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'current-v1.8-unsupported-shape');
});
test('repairs the exact PR #1298 hybrid v1.8 baseline shape without a second body architecture', () => {
  const baseline = [
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
    '`CAPITAL_AI_PRODUCTION_BASELINE_START`',
    '- **Baseline-ID:** `sha256:test1298`',
    '- **Produktions-Commit:** `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`',
    '- **Aktueller main-Commit:** `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`',
    '- **PR-Head-Commit:** `cccccccccccccccccccccccccccccccccccccccc`',
    '`CAPITAL_AI_PRODUCTION_BASELINE_END`',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
  ].join('\n');
  const body = [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->',
    '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`',
    '# FE-VOCABULARY-RETURN-01',
    '',
    '> 🧭 **Entscheidungsstatus: BLOCKED**',
    '> P1 🟠 Hoch · PR-Klasse C · PATCH 🩹',
    '',
    '## 1. 🧭 Entscheidung',
    '| Frage | Ergebnis |',
    '|---|---|',
    '| Owner-Aktion | Human/CODEOWNER Merge erforderlich |',
    '',
    '## 2. ✅ Evidence',
    '| Gate | Status |',
    '|---|---|',
    '| Current Main | 🟢 PASS |',
    '',
    '## 3. 🔍 Technical Evidence',
    '<details>',
    '<summary>Technische Details & Traceability</summary>',
    '- **Priorität:** P1 🟠 Hoch',
    '- **Versionsimpact:** PATCH 🩹',
    '- **Version-Manager-Check:** NOT_RUN — fixture.',
    '- **PR-Klasse:** C',
    '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
    '</details>',
    '',
    '<details>',
    '<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>',
    '',
    'NOT_RUN — wird durch die kanonische PR-Evidence-Automation gegen Exact Head erzeugt.',
    '',
    '</details>',
    '',
    '## 7. Maschinenlesbare Baseline',
    '',
    baseline,
    '',
  ].join('\n');

  const result = repairLegacyPrBodyStructure(body, { prClass: 'C' });

  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.equal(result.reason, 'current-v1.8-hybrid-baseline-section-repaired');
  assert.deepEqual(result.body.match(/^## .+$/gm), [
    '## 1. 🧭 Entscheidung',
    '## 2. ✅ Evidence',
    '## 3. 🔍 Technical Evidence',
  ]);
  assert.doesNotMatch(result.body, /^## 7\. Maschinenlesbare Baseline$/m);
  assert.doesNotMatch(result.body, /NOT_RUN — wird durch die kanonische PR-Evidence-Automation/);
  assert.match(result.body, /sha256:test1298/);
  assert.equal((result.body.match(/<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->/g) || []).length, 1);
  assert.equal((result.body.match(/<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->/g) || []).length, 1);
});
