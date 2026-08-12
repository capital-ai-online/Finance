import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('Human Owner Comment Gate', () => {
  it('uses only trusted default-branch event chains for mutations', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    expect(gate).toContain('workflow_run:');
    expect(gate).toContain('workflows: ["PR Governance"]');
    expect(gate).toContain('issue_comment:');
    expect(gate).toContain('types: [edited]');
    expect(gate).not.toContain('pull_request_target:');
    expect(gate).not.toContain('pull_request:\n');
  });

  it('seeds from the trusted workflow_run payload without a PR API bootstrap dependency', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    const seed = gate.slice(gate.indexOf('  seed-or-reset:'), gate.indexOf('  human-verification:'));
    expect(seed).toContain('PR_HEAD_SHA: ${{ github.event.workflow_run.pull_requests[0].head.sha }}');
    expect(seed).toContain('PR_BASE_REF: ${{ github.event.workflow_run.pull_requests[0].base.ref }}');
    expect(seed).not.toContain('pulls/${PR_NUMBER}');
    expect(seed).toContain('pull-requests: write');
    expect(seed).toContain('issues: write');
  });

  it('binds the human gate to owner, current head, exact review and both attestations', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    expect(gate).toContain("github.actor == 'SvenKulessa'");
    expect(gate).toContain('CAPITAL_AI_HUMAN_GATE_HEAD_SHA');
    expect(gate).toContain('test "$approval_head" = "$current_head"');
    expect(gate).toContain('.commit_id == env.PR_HEAD_SHA');
    expect(gate).toContain('"okay"');
    expect(gate).toContain('💪');
    expect(gate).toContain('- [x] Human/Owner: vollständigen PR-Diff geprüft.');
    expect(gate).toContain('- [x] Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.');
  });

  it('creates Human verification and build-and-test checks on the exact PR head', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    expect(gate).toContain('checks: write');
    expect(gate).toContain('repos/${GITHUB_REPOSITORY}/check-runs');
    expect(gate).toContain("-f name='Human-/Owner-Verifikation'");
    expect(gate).toContain("-f name='build-and-test'");
    expect(gate).toContain('-f head_sha="$current_head"');
    expect(gate).toContain('check_name=build-and-test');
  });

  it('dispatches exactly the trusted main build workflow and passes the reserved head check', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    expect(gate).toContain('gh workflow run pr-build-and-test.yml');
    expect(gate).toContain('--ref main');
    expect(gate).toContain('-f build_check_run_id="$BUILD_CHECK_RUN_ID"');
    expect(gate).toContain('Kein zweiter Build');
  });
});

describe('PR Build and Test dispatch', () => {
  it('is dispatch-only and revalidates human evidence before executing PR code', () => {
    const build = read('.github/workflows/pr-build-and-test.yml');
    expect(build).toContain('workflow_dispatch:');
    expect(build).not.toContain('pull_request_target:');
    expect(build).toContain('Human-/Owner-Evidence erneut verifizieren');
    expect(build).toContain('CAPITAL_AI_HUMAN_GATE_HEAD_SHA');
    expect(build).toContain('.commit_id == env.PR_HEAD_SHA');
    expect(build).toContain('build_check_run_id:');
  });

  it('executes candidate code only in a read-only job on exactly the approved head', () => {
    const build = read('.github/workflows/pr-build-and-test.yml');
    const executor = build.slice(build.indexOf('  build-and-test-executor:'), build.indexOf('  report-pr-head-check:'));
    expect(executor).toContain('contents: read');
    expect(executor).not.toContain('checks: write');
    expect(executor).not.toContain('pull-requests: write');
    expect(executor).toContain('ref: ${{ inputs.head_sha }}');
    expect(executor).toContain('persist-credentials: false');
    expect(executor).toContain('test "$(git rev-parse HEAD)" = "${{ inputs.head_sha }}"');
  });

  it('preserves blocking repository, build and runtime verification', () => {
    const build = read('.github/workflows/pr-build-and-test.yml');
    expect(build).toContain('npm run repository:validate');
    expect(build).toContain('npm audit --omit=dev --audit-level=high');
    expect(build).toContain('npm run lint');
    expect(build).toContain('npm test');
    expect(build).toContain('npm run build');
    expect(build).toContain('verifyProductionConfigInvariants.ts');
    expect(build).toContain('verifyDockerHardening.mjs');
    expect(build).toContain('Produktions-Docker-Container starten und /healthz prüfen');
  });

  it('reports PASS or FAIL back to the reserved build-and-test check on the PR head', () => {
    const build = read('.github/workflows/pr-build-and-test.yml');
    const reporter = build.slice(build.indexOf('  report-pr-head-check:'));
    expect(reporter).toContain('checks: write');
    expect(reporter).toContain('if: ${{ always() }}');
    expect(reporter).toContain('.head_sha == env.EXPECTED_HEAD_SHA');
    expect(reporter).toContain('.name == "build-and-test"');
    expect(reporter).toContain("conclusion=success");
    expect(reporter).toContain("conclusion=failure");
    expect(reporter).toContain('check-runs/${BUILD_CHECK_RUN_ID}');
  });
});
