import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseChangedFilesJson, planChangedFiles } from './planPrValidation.mjs';

describe('planChangedFiles', () => {
  it('uses NONE and skips software tests, CodeQL and automated review for docs-only changes', () => {
    const plan = planChangedFiles(['docs/projects/operations/ROADMAP.md', '.ai/work-claims/x.json']);
    assert.equal(plan.validation_profile, 'none');
    assert.equal(plan.vitest_mode, 'none');
    assert.equal(plan.codeql_mode, 'none');
    assert.equal(plan.automated_code_review_mode, 'none');
  });

  it('uses FOCUSED changed Vitest only for test-only changes and skips CodeQL/review', () => {
    const plan = planChangedFiles(['tests/unit/foo.test.ts']);
    assert.equal(plan.validation_profile, 'focused');
    assert.equal(plan.vitest_mode, 'changed');
    assert.equal(plan.codeql_mode, 'none');
    assert.equal(plan.automated_code_review_mode, 'none');
  });

  it('treats non-Vitest *.test files as focused test-only provider cost control', () => {
    const plan = planChangedFiles(['scripts/pr/example.test.mjs']);
    assert.equal(plan.validation_profile, 'focused');
    assert.equal(plan.node_pr_tests, true);
    assert.equal(plan.codeql_mode, 'none');
    assert.equal(plan.automated_code_review_mode, 'none');
  });

  it('uses FOCUSED changed Vitest plus targeted JavaScript/TypeScript CodeQL for normal app source', () => {
    const plan = planChangedFiles(['src/features/screening/ui/RankingBoard.tsx']);
    assert.equal(plan.validation_profile, 'focused');
    assert.equal(plan.vitest_mode, 'changed');
    assert.equal(plan.codeql_mode, 'targeted');
    assert.equal(plan.codeql_languages, 'javascript-typescript');
    assert.equal(plan.automated_code_review_mode, 'targeted');
  });

  it('forces FULL tests/review for security-sensitive source', () => {
    const plan = planChangedFiles(['src/platform/Security/safeIo.ts']);
    assert.equal(plan.validation_profile, 'full');
    assert.equal(plan.vitest_mode, 'full');
    assert.equal(plan.codeql_mode, 'full');
    assert.equal(plan.codeql_languages, 'javascript-typescript');
    assert.equal(plan.automated_code_review_mode, 'full');
  });

  it('keeps dependency-only changes FULL while CodeQL remains unnecessary', () => {
    const plan = planChangedFiles(['package-lock.json']);
    assert.equal(plan.validation_profile, 'full');
    assert.equal(plan.vitest_mode, 'full');
    assert.equal(plan.codeql_mode, 'none');
    assert.equal(plan.automated_code_review_mode, 'full');
  });

  it('forces FULL for CI/provider-control workflow changes to prevent self-demotion', () => {
    for (const path of [
      '.github/workflows/ci.yml',
      '.github/workflows/selective-codeql.yml',
      '.github/workflows/selective-copilot-code-review.yml',
    ]) {
      const plan = planChangedFiles([path]);
      assert.equal(plan.validation_profile, 'full', path);
      assert.equal(plan.vitest_mode, 'full', path);
      assert.equal(plan.codeql_mode, 'full', path);
      assert.equal(plan.codeql_languages, 'actions', path);
      assert.equal(plan.automated_code_review_mode, 'full', path);
    }
  });

  it('keeps ordinary non-deploy workflow changes focused but reviews them fully', () => {
    const plan = planChangedFiles(['.github/workflows/pr-governance.yml']);
    assert.equal(plan.validation_profile, 'focused');
    assert.equal(plan.vitest_mode, 'none');
    assert.equal(plan.codeql_mode, 'targeted');
    assert.equal(plan.codeql_languages, 'actions');
    assert.equal(plan.automated_code_review_mode, 'full');
  });

  it('runs focused Node PR tests without the Vitest suite for scripts/pr source changes', () => {
    const plan = planChangedFiles(['scripts/pr/validatePrBody.mjs']);
    assert.equal(plan.validation_profile, 'focused');
    assert.equal(plan.vitest_mode, 'none');
    assert.equal(plan.node_pr_tests, true);
    assert.equal(plan.codeql_mode, 'targeted');
  });

  it('fails closed to FULL for unknown non-documentary paths', () => {
    const plan = planChangedFiles(['custom/tooling.xyz']);
    assert.equal(plan.validation_profile, 'full');
    assert.equal(plan.vitest_mode, 'full');
    assert.equal(plan.codeql_mode, 'full');
    assert.equal(plan.codeql_languages, 'actions,javascript-typescript,python');
    assert.equal(plan.automated_code_review_mode, 'full');
  });

  it('keeps main pushes force-FULL', () => {
    const plan = planChangedFiles([], { forceFull: true });
    assert.equal(plan.validation_profile, 'full');
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
    assert.equal(plan.validation_profile, 'focused');
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
