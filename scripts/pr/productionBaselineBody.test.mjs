import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeProductionBaselineId,
  renderProductionBaselineBlock,
} from './lib.mjs';
import { replaceProductionBaselineBlock } from './productionBaselineBody.mjs';

function validBaseline(overrides = {}) {
  const baseline = {
    schemaVersion: '1.2.0',
    generatedAt: '2026-08-20T20:40:00.000Z',
    productionUrl: 'https://capital-ai.online/',
    productionHealthUrl: 'https://capital-ai.online/healthz',
    bootstrap: false,
    production: {
      status: 'ok',
      version: '0.7.0',
      commitSha: '1'.repeat(40),
      branch: 'main',
      repoSlug: 'SvenKulessa/Finance',
      provider: 'render',
    },
    main: { sha: '2'.repeat(40) },
    head: { sha: '3'.repeat(40), version: '0.7.0' },
    drift: { productionToMainCommits: 1, mainToHeadCommits: 2 },
    checks: {
      productionHealthy: true,
      immutableProductionIdentity: true,
      productionRepoMatches: true,
      productionBranchIsMain: true,
      productionIsAncestorOfMain: true,
      branchContainsCurrentMain: true,
      versionIsNotOlderThanProduction: true,
    },
    ...overrides,
  };
  baseline.baselineId = computeProductionBaselineId(baseline);
  return baseline;
}

test('same atomic baseline is CURRENT, preserves generatedAt and performs no body write', () => {
  const oldBaseline = validBaseline({ generatedAt: '2026-08-20T20:30:00.000Z' });
  const currentBody = `Vorher\n${renderProductionBaselineBlock(oldBaseline)}\nNachher`;

  const freshPreflight = validBaseline({ generatedAt: '2026-08-20T20:45:00.000Z' });
  const result = replaceProductionBaselineBlock(currentBody, freshPreflight);

  assert.equal(result.changed, false);
  assert.equal(result.evidenceState, 'CURRENT');
  assert.equal(result.body, currentBody);
  assert.equal(result.baselineId, oldBaseline.baselineId);
});

test('changed main/head identity is STALE and replaces only the canonical baseline block', () => {
  const previous = validBaseline({ generatedAt: '2026-08-20T20:30:00.000Z' });
  const currentBody = `# PR\nOwner note stays\n${renderProductionBaselineBlock(previous)}\nManual appendix stays`;

  const next = validBaseline({
    generatedAt: '2026-08-20T20:45:00.000Z',
    main: { sha: '4'.repeat(40) },
    head: { sha: '5'.repeat(40), version: '0.7.0' },
    drift: { productionToMainCommits: 2, mainToHeadCommits: 1 },
  });
  const result = replaceProductionBaselineBlock(currentBody, next);

  assert.equal(result.changed, true);
  assert.equal(result.evidenceState, 'STALE');
  assert.match(result.body, /^# PR\nOwner note stays\n/);
  assert.match(result.body, /\nManual appendix stays$/);
  assert.match(result.body, new RegExp(next.baselineId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(result.body, new RegExp(previous.baselineId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('marker-free canonical section 3 is classified STALE and reconstructed atomically', () => {
  const baseline = validBaseline();
  const body = [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0 -->',
    '# CAPITAL-AI Änderungsantrag (Pull Request)',
    '',
    '## 2. Agenten-/Principal-Identität und PR-Erstellungsfreigabe',
    '',
    'Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
    '',
    '## 3. Produktions-Baseline — maschinenverwalteter / beratender Nachweis',
    '',
    'ADVISORY / NOT MACHINE-RENDERED',
    'mainSha: stale-main',
    'headSha: stale-head',
    '',
    '## 4. Umfang / Multi-Agent-Koordination',
    '',
    'Owner note after baseline stays',
  ].join('\n');

  const result = replaceProductionBaselineBlock(body, baseline);

  assert.equal(result.changed, true);
  assert.equal(result.evidenceState, 'STALE');
  assert.match(result.body, new RegExp(baseline.baselineId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(result.body, /<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->/);
  assert.match(result.body, /`CAPITAL_AI_PRODUCTION_BASELINE_START`/);
  assert.match(result.body, /`CAPITAL_AI_PRODUCTION_BASELINE_END`/);
  assert.match(result.body, /<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->/);
  assert.doesNotMatch(result.body, /ADVISORY \/ NOT MACHINE-RENDERED/);
  assert.doesNotMatch(result.body, /stale-main|stale-head/);
  assert.match(result.body, /## 4\. Umfang \/ Multi-Agent-Koordination\n\nOwner note after baseline stays$/);
});

test('partial or duplicate baseline markers remain fail-closed', () => {
  const baseline = validBaseline();
  const block = renderProductionBaselineBlock(baseline);

  assert.throws(
    () => replaceProductionBaselineBlock(`A\n${block}\n${block}\nB`, baseline),
    /unvollständigen oder duplizierten Produktions-Baseline-Markerzustand/,
  );
  assert.throws(
    () => replaceProductionBaselineBlock(`${block}\n\`CAPITAL_AI_PRODUCTION_BASELINE_START\``, baseline),
    /unvollständigen oder duplizierten Produktions-Baseline-Markerzustand/,
  );
});

test('marker-free body without unique canonical section boundaries remains fail-closed', () => {
  const baseline = validBaseline();

  assert.throws(
    () => replaceProductionBaselineBlock('kein Baseline-Block', baseline),
    /keinen eindeutig reparierbaren kanonischen Produktions-Baseline-Abschnitt 3/,
  );

  const duplicateHeading = [
    '## 3. Produktions-Baseline — maschinenverwalteter / beratender Nachweis',
    'alt',
    '## 3. Produktions-Baseline — maschinenverwalteter / beratender Nachweis',
    'alt 2',
    '## 4. Umfang / Multi-Agent-Koordination',
  ].join('\n');
  assert.throws(
    () => replaceProductionBaselineBlock(duplicateHeading, baseline),
    /keinen eindeutig reparierbaren kanonischen Produktions-Baseline-Abschnitt 3/,
  );
});
