import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { classifyChangedFiles } from './classifyPrScope.mjs';
import {
  findRuntimeConsumedPaths,
  findRuntimeConsumerFiles,
  parseChangedFilesJson,
  planChangedFiles,
} from './planPrValidation.mjs';

describe('planChangedFiles', () => {
  it('uses NONE and skips software tests, CodeQL and automated review for docs-only changes', () => {
    const plan = planChangedFiles(['docs/projects/operations/ROADMAP.md', '.ai/work-claims/x.json']);
    assert.equal(plan.validation_profile, 'none');
    assert.equal(plan.vitest_mode, 'none');
    assert.equal(plan.codeql_mode, 'none');
    assert.equal(plan.automated_code_review_mode, 'none');
  });

  it('fails closed to FULL when a documentary artifact is consumed by runtime/test/workflow code', () => {
    const path = 'docs/contracts/runtime-policy.md';
    const plan = planChangedFiles([path], { runtimeConsumedPaths: [path] });
    assert.equal(plan.validation_profile, 'full');
    assert.equal(plan.vitest_mode, 'full');
    assert.equal(plan.node_pr_tests, true);
    assert.equal(plan.node_systemadmin_tests, true);
    assert.equal(plan.node_security_assessment_tests, true);
    assert.equal(plan.codeql_mode, 'full');
    assert.equal(plan.automated_code_review_mode, 'full');
    assert.match(plan.reason, /runtime-consumed-documentary-artifact/);
  });

  it('discovers a real runtime consumer and escalates planner, classifier and CLI fail-closed', () => {
    const repository = mkdtempSync(join(tmpdir(), 'capital-ai-runtime-consumer-'));
    const artifact = 'docs/contracts/runtime-policy.md';
    try {
      mkdirSync(join(repository, 'docs/contracts'), { recursive: true });
      mkdirSync(join(repository, 'src'), { recursive: true });
      writeFileSync(join(repository, artifact), 'version: 1\n', 'utf8');
      writeFileSync(
        join(repository, 'src/consumer.ts'),
        "export const policyPath = 'docs/contracts/runtime-policy.md';\n",
        'utf8',
      );
      execFileSync('git', ['init'], { cwd: repository, stdio: 'ignore' });
      execFileSync('git', ['config', 'user.email', 'ci@example.invalid'], { cwd: repository });
      execFileSync('git', ['config', 'user.name', 'CI Test'], { cwd: repository });
      execFileSync('git', ['add', '.'], { cwd: repository });
      execFileSync('git', ['commit', '-m', 'base'], { cwd: repository, stdio: 'ignore' });
      const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();

      const runtimeConsumerFiles = findRuntimeConsumerFiles([artifact], 'HEAD', { cwd: repository });
      const runtimeConsumedPaths = findRuntimeConsumedPaths([artifact], 'HEAD', { cwd: repository });
      assert.deepEqual(runtimeConsumerFiles, { [artifact]: ['src/consumer.ts'] });
      assert.deepEqual(runtimeConsumedPaths, [artifact]);
      assert.equal(planChangedFiles([artifact], { runtimeConsumedPaths }).validation_profile, 'full');
      assert.equal(classifyChangedFiles([artifact], { runtimeConsumedPaths }).class, 'C');

      writeFileSync(join(repository, artifact), 'version: 2\n', 'utf8');
      execFileSync('git', ['add', artifact], { cwd: repository });
      execFileSync('git', ['commit', '-m', 'change policy'], { cwd: repository, stdio: 'ignore' });
      const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
      const planner = fileURLToPath(new URL('./planPrValidation.mjs', import.meta.url));
      const output = execFileSync(process.execPath, [planner], {
        cwd: repository,
        encoding: 'utf8',
        env: {
          ...process.env,
          EVENT_NAME: 'pull_request',
          CI_FORCE_FULL: 'false',
          GITHUB_OUTPUT: '',
          PR_BASE_SHA: base,
          PR_HEAD_SHA: head,
        },
      });
      assert.match(output, /profile=full/);
      assert.match(output, /consumer_escalation=true/);
      assert.match(output, /runtime-consumed-documentary-artifact/);
    } finally {
      rmSync(repository, { recursive: true, force: true });
    }
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

  it('uses changed Vitest for ordinary operations tooling instead of the full suite', () => {
    const plan = planChangedFiles(['scripts/operations/renderManagementAdapter.mjs']);
    assert.equal(plan.validation_profile, 'focused');
    assert.equal(plan.vitest_mode, 'changed');
    assert.equal(plan.codeql_mode, 'targeted');
    assert.equal(plan.automated_code_review_mode, 'targeted');
    assert.match(plan.reason, /ordinary-operations-tooling/);
  });

  it('runs only direct Vitest consumers for test-consumed documentary snapshots', () => {
    const path = 'docs/frontend/upstream-source/SvenKulessa-FRONTEND/manifest.json';
    const plan = planChangedFiles([path], {
      runtimeConsumedPaths: [path],
      runtimeConsumerFiles: {
        [path]: ['tests/unit/frontendExtendedWebdesign.test.ts'],
      },
    });
    assert.equal(plan.validation_profile, 'focused');
    assert.equal(plan.vitest_mode, 'changed');
    assert.equal(plan.codeql_mode, 'none');
    assert.equal(plan.automated_code_review_mode, 'none');
    assert.deepEqual(
      JSON.parse(plan.direct_vitest_tests_json),
      ['tests/unit/frontendExtendedWebdesign.test.ts'],
    );
    assert.match(plan.reason, /test-consumed-documentary-artifact/);
  });

  it('keeps documentary artifacts FULL when any consumer is runtime code', () => {
    const path = 'docs/contracts/runtime-policy.md';
    const plan = planChangedFiles([path], {
      runtimeConsumedPaths: [path],
      runtimeConsumerFiles: {
        [path]: ['src/consumer.ts', 'tests/unit/consumer.test.ts'],
      },
    });
    assert.equal(plan.validation_profile, 'full');
    assert.equal(plan.vitest_mode, 'full');
    assert.equal(plan.codeql_mode, 'full');
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
