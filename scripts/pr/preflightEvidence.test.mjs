import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPreflightEvidence, REQUIRED_EXACT_HEAD_CONTEXTS } from './planPrValidation.mjs';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const C = 'c'.repeat(40);

describe('ChatGPT preflight evidence contract', () => {
  it('keeps missing executions truthful as NOT_RUN for docs-only scope', () => {
    const evidence = buildPreflightEvidence({
      baseSha: A,
      headSha: B,
      treeSha: C,
      files: ['docs/projects/operations/ROADMAP.md'],
      toolVersions: { node: 'v24.18.0' },
    });

    assert.equal(evidence.pr_class, 'D');
    assert.equal(evidence.production_impact, false);
    assert.equal(evidence.validation_profile, 'NONE');
    assert.equal(evidence.checks.lint.result, 'NOT_RUN');
    assert.equal(evidence.checks.gitleaks.planned, true);
    assert.equal(evidence.checks.gitleaks.result, 'NOT_RUN');
    assert.deepEqual(evidence.required_exact_head_contexts, REQUIRED_EXACT_HEAD_CONTEXTS);
    assert.match(evidence.evidence_fingerprint, /^sha256:[0-9a-f]{64}$/);
  });

  it('selects focused validation for bounded application source', () => {
    const evidence = buildPreflightEvidence({
      baseSha: A,
      headSha: B,
      treeSha: C,
      files: ['src/features/screening/ui/RankingBoard.tsx'],
      results: { lint: 'PASS', vitest: 'PASS' },
    });

    assert.equal(evidence.pr_class, 'C');
    assert.equal(evidence.production_impact, true);
    assert.equal(evidence.validation_profile, 'FOCUSED');
    assert.equal(evidence.checks.lint.result, 'PASS');
    assert.equal(evidence.checks.vitest.result, 'PASS');
    assert.equal(evidence.checks.knip.planned, true);
    assert.equal(evidence.checks.jscpd.planned, true);
    assert.equal(evidence.selected_tests.length, 1);
    assert.match(evidence.selected_tests[0], /vitest run --changed/);
  });

  it('fails closed to full for dependency/runtime scope', () => {
    const evidence = buildPreflightEvidence({
      baseSha: A,
      headSha: B,
      treeSha: C,
      files: ['package-lock.json'],
    });

    assert.equal(evidence.pr_class, 'R');
    assert.equal(evidence.production_impact, true);
    assert.equal(evidence.validation_profile, 'FULL');
    assert.equal(evidence.checks.osv.planned, true);
    assert.ok(evidence.selected_tests.includes('npm test'));
  });

  it('rejects invented result states and fingerprints exact identity', () => {
    assert.throws(() => buildPreflightEvidence({
      baseSha: A,
      headSha: B,
      treeSha: C,
      files: ['scripts/pr/example.mjs'],
      results: { lint: 'ASSUMED_PASS' },
    }), /Invalid preflight result/);

    const first = buildPreflightEvidence({
      baseSha: A,
      headSha: B,
      treeSha: C,
      files: ['scripts/pr/example.mjs'],
    });
    const second = buildPreflightEvidence({
      baseSha: A,
      headSha: 'd'.repeat(40),
      treeSha: C,
      files: ['scripts/pr/example.mjs'],
    });
    assert.notEqual(first.evidence_fingerprint, second.evidence_fingerprint);
  });
});
