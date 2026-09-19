import assert from 'node:assert/strict';
import test from 'node:test';
import { findMissingRequiredSections } from './prBodySectionContract.mjs';
import { repairLegacyPrBodyStructure } from './repairLegacyPrBodyStructure.mjs';

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

test('repairs only the allowlisted legacy v1.5 structure and preserves evidence', () => {
  assert.deepEqual(findMissingRequiredSections(legacyBody), ['## 4. Roadmap', '## 5. PR-Klasse', '## 6. Prüfung']);
  const result = repairLegacyPrBodyStructure(legacyBody, { prClass: 'R' });
  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.deepEqual(findMissingRequiredSections(result.body), []);
  assert.match(result.body, /^## 4\. Roadmap$/m);
  assert.match(result.body, /^## 5\. PR-Klasse$/m);
  assert.match(result.body, /- \*\*Klasse:\*\* R/);
  assert.match(result.body, /^## 6\. Prüfung$/m);
  assert.match(result.body, /^### Abgrenzung$/m);
  assert.match(result.body, /Human-\/CODEOWNER-Freigabe für Merge erforderlich:\*\* Ja/);
  assert.match(result.body, /Runtime cutover is complete without legacy fallback\./);
  assert.match(result.body, /Keep generated release notes\./);
  assert.equal((result.body.match(/CAPITAL_AI_PRODUCTION_BASELINE_START/g) || []).length, 2);
  assert.equal((result.body.match(/CAPITAL_AI_PRODUCTION_BASELINE_END/g) || []).length, 2);
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

test('repairs the allowlisted partial legacy shape without rewriting PR-class content', () => {
  assert.deepEqual(findMissingRequiredSections(partialLegacyBody), [
    '## 4. Roadmap',
    '## 6. Prüfung',
  ]);
  const result = repairLegacyPrBodyStructure(partialLegacyBody, { prClass: 'C' });
  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.equal(result.reason, 'legacy-v1.5-partial-structure-repaired');
  assert.deepEqual(findMissingRequiredSections(result.body), []);
  assert.match(result.body, /^## 4\. Roadmap$/m);
  assert.match(result.body, /^## 5\. PR-Klasse$/m);
  assert.match(result.body, /\*\*Klasse:\*\* C — Code \/ Tests \/ Validated-Data Contract\./);
  assert.match(result.body, /^## 6\. Prüfung$/m);
  assert.match(result.body, /FIN-12 evidence remains untouched\./);
  assert.match(result.body, /Human-\/CODEOWNER-Freigabe für Merge erforderlich:\*\* Ja/);
  assert.match(result.body, /Agent-Self-Merge\/Auto-Merge:\*\* Nein\./);
  assert.equal((result.body.match(/CAPITAL_AI_PRODUCTION_BASELINE_START/g) || []).length, 2);
  assert.equal((result.body.match(/CAPITAL_AI_PRODUCTION_BASELINE_END/g) || []).length, 2);
});

test('refuses an unsupported partial legacy heading shape', () => {
  const body = partialLegacyBody.replace(
    '## 6. Aktuelle Korrelation',
    '## 6. Andere Korrelation',
  );
  const result = repairLegacyPrBodyStructure(body, { prClass: 'C' });
  assert.equal(result.eligible, false);
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'unsupported-partial-legacy-shape');
});
