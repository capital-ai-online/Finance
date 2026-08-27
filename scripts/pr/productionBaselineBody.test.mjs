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

test('same atomic baseline preserves existing generatedAt and performs no body write', () => {
  const oldBaseline = validBaseline({ generatedAt: '2026-08-20T20:30:00.000Z' });
  const currentBody = `Vorher\n${renderProductionBaselineBlock(oldBaseline)}\nNachher`;

  const freshPreflight = validBaseline({ generatedAt: '2026-08-20T20:45:00.000Z' });
  const result = replaceProductionBaselineBlock(currentBody, freshPreflight);

  assert.equal(result.changed, false);
  assert.equal(result.body, currentBody);
  assert.equal(result.baselineId, oldBaseline.baselineId);
});

test('changed main/head identity replaces only the canonical baseline block', () => {
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
  assert.match(result.body, /^# PR\nOwner note stays\n/);
  assert.match(result.body, /\nManual appendix stays$/);
  assert.match(result.body, new RegExp(next.baselineId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(result.body, new RegExp(previous.baselineId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('duplicate or missing baseline markers remain fail-closed', () => {
  const baseline = validBaseline();
  const block = renderProductionBaselineBlock(baseline);

  assert.throws(
    () => replaceProductionBaselineBlock(`A\n${block}\n${block}\nB`, baseline),
    /genau einen kanonischen Produktions-Baseline-Block/,
  );
  assert.throws(
    () => replaceProductionBaselineBlock('kein Baseline-Block', baseline),
    /genau einen kanonischen Produktions-Baseline-Block/,
  );
});
