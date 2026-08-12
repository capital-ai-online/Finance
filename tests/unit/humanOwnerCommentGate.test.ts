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
    expect(seed).toContain('issues: read');
  });


  it('partitions write permissions between comment seeding and CI dispatch', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    expect(gate).toContain('permissions: {}');

    const seedStart = gate.indexOf('  seed-or-reset:');
    const verifyStart = gate.indexOf('  human-verification:');
    expect(seedStart).toBeGreaterThan(-1);
    expect(verifyStart).toBeGreaterThan(seedStart);

    const seed = gate.slice(seedStart, verifyStart);
    const verify = gate.slice(verifyStart);

    expect(seed).toContain('pull-requests: write');
    expect(seed).toContain('issues: read');
    expect(seed).toContain('contents: read');
    expect(seed).not.toContain('actions: write');
    expect(seed).not.toContain('checks: write');
    expect(seed).not.toContain('contents: write');

    expect(verify).toContain('actions: write');
    expect(verify).toContain('checks: write');
    expect(verify).toContain('pull-requests: read');
    expect(verify).toContain('issues: read');
    expect(verify).toContain('contents: read');
    expect(verify).not.toContain('pull-requests: write');
    expect(verify).not.toContain('issues: write');
    expect(verify).not.toContain('contents: write');
  });

  it('limits PR-write usage to timeline comment synchronization', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    const seedStart = gate.indexOf('  seed-or-reset:');
    const verifyStart = gate.indexOf('  human-verification:');
    const seed = gate.slice(seedStart, verifyStart);

    expect(seed).toContain('issues/${PR_NUMBER}/comments');
    expect(seed).toContain('issues/comments/${comment_id}');
    expect(seed).not.toContain('/merge');
    expect(seed).not.toContain('/reviews');
    expect(seed).not.toContain('--method PUT');
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


  it('protects PR hash labels from YAML comment truncation', () => {
    const build = read('.github/workflows/pr-build-and-test.yml');
    expect(build).toContain(
      'run-name: "PR #${{ inputs.pr_number }} – trusted build/test @ ${{ inputs.head_sha }}"',
    );
    expect(build).toContain(
      'run: >-\n          echo "Primär-Volltest für PR #${{ inputs.pr_number }}@${{ inputs.head_sha }} ist durch head-genaue Human-Evidence autorisiert."',
    );
    expect(build).not.toContain('run-name: PR #');
    expect(build).not.toContain('run: echo "Primär-Volltest für PR #');
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
