import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseChangedFilesJson, planChangedFiles } from './planPrValidation.mjs';

describe('planChangedFiles', () => {
  it('skips software tests, CodeQL and automated review for docs-only changes', () => {
    const plan = planChangedFiles(['docs/projects/operations/ROADMAP.md', '.ai/work-claims/x.json']);
    assert.equal(plan.vitest_mode, 'none');
    assert.equal(plan.codeql_mode, 'none');
    assert.equal(plan.automated_code_review_mode, 'none');
  });

  it('uses changed Vitest only for test-only changes and skips CodeQL/review', () => {
    const plan = planChangedFiles(['tests/unit/foo.test.ts']);
    assert.equal(plan.vitest_mode, 'changed');
    assert.equal(plan.codeql_mode, 'none');
    assert.equal(plan.automated_code_review_mode, 'none');
  });

  it('treats non-Vitest *.test files as test-only for provider cost control', () => {
    const plan = planChangedFiles(['scripts/pr/example.test.mjs']);
    assert.equal(plan.node_pr_tests, true);
    assert.equal(plan.codeql_mode, 'none');
    assert.equal(plan.automated_code_review_mode, 'none');
  });

  it('uses changed Vitest plus targeted JavaScript/TypeScript CodeQL for normal app source', () => {
    const plan = planChangedFiles(['src/features/screening/ui/RankingBoard.tsx']);
    assert.equal(plan.vitest_mode, 'changed');
    assert.equal(plan.codeql_mode, 'targeted');
    assert.equal(plan.codeql_languages, 'javascript-typescript');
    assert.equal(plan.automated_code_review_mode, 'targeted');
  });

  it('forces full tests/review for security-sensitive source', () => {
    const plan = planChangedFiles(['src/platform/Security/safeIo.ts']);
    assert.equal(plan.vitest_mode, 'full');
    assert.equal(plan.codeql_mode, 'full');
    assert.equal(plan.codeql_languages, 'javascript-typescript');
    assert.equal(plan.automated_code_review_mode, 'full');
  });

  it('keeps dependency-only changes out of CodeQL while tests stay conservative', () => {
    const plan = planChangedFiles(['package-lock.json']);
    assert.equal(plan.vitest_mode, 'full');
    assert.equal(plan.codeql_mode, 'none');
    assert.equal(plan.automated_code_review_mode, 'full');
  });

  it('selects Actions CodeQL and full automated review for workflow-only changes', () => {
    const plan = planChangedFiles(['.github/workflows/pr-governance.yml']);
    assert.equal(plan.vitest_mode, 'none');
    assert.equal(plan.codeql_mode, 'targeted');
    assert.equal(plan.codeql_languages, 'actions');
    assert.equal(plan.automated_code_review_mode, 'full');
  });

  it('runs focused Node PR tests without the Vitest suite for scripts/pr source changes', () => {
    const plan = planChangedFiles(['scripts/pr/validatePrBody.mjs']);
    assert.equal(plan.vitest_mode, 'none');
    assert.equal(plan.node_pr_tests, true);
    assert.equal(plan.codeql_mode, 'targeted');
  });

  it('fails closed for unknown non-documentary paths', () => {
    const plan = planChangedFiles(['custom/tooling.xyz']);
    assert.equal(plan.vitest_mode, 'full');
    assert.equal(plan.codeql_mode, 'full');
    assert.equal(plan.codeql_languages, 'actions,javascript-typescript,python');
    assert.equal(plan.automated_code_review_mode, 'full');
  });

  it('keeps main pushes force-full', () => {
    const plan = planChangedFiles([], { forceFull: true });
    assert.equal(plan.vitest_mode, 'full');
    assert.equal(plan.codeql_mode, 'full');
    assert.equal(plan.automated_code_review_mode, 'full');
    assert.equal(plan.node_pr_tests, true);
    assert.equal(plan.node_systemadmin_tests, true);
    assert.equal(plan.node_security_assessment_tests, true);
  });

  it('preserves embedded newlines as data in structured changed-file JSON', () => {
    const files = parseChangedFilesJson(JSON.stringify(['.github/workflows/odd\nname.yml']));
    assert.deepEqual(files, ['.github/workflows/odd\nname.yml']);

    const plan = planChangedFiles(files);
    assert.equal(plan.codeql_mode, 'targeted');
    assert.equal(plan.codeql_languages, 'actions');
    assert.equal(plan.automated_code_review_mode, 'full');
  });

  it('rejects non-array or non-string changed-file JSON fail-closed', () => {
    assert.throws(
      () => parseChangedFilesJson('{"filename":"src/app.ts"}'),
      /CHANGED_FILES_JSON must be a JSON array of strings/,
    );
    assert.throws(
      () => parseChangedFilesJson('["src/app.ts",42]'),
      /CHANGED_FILES_JSON must be a JSON array of strings/,
    );
  });
});
