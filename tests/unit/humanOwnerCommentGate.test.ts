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

  it('keeps write permissions narrowly scoped to comment sync and dispatch', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    expect(gate).toContain('actions: write');
    expect(gate).toContain('issues: write');
    expect(gate).toContain('pull-requests: read');
    expect(gate).toContain('contents: read');
    expect(gate).not.toContain('contents: write');
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

  it('dispatches exactly the trusted PR build workflow and prevents same-head duplicate dispatch', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    expect(gate).toContain('actions/workflows/pr-build-and-test.yml/runs?event=workflow_dispatch');
    expect(gate).toContain('select(.display_title == env.RUN_TITLE)');
    expect(gate).toContain('gh workflow run pr-build-and-test.yml');
    expect(gate).toContain('--ref main');
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
  });

  it('checks out exactly the approved head with no persisted credentials', () => {
    const build = read('.github/workflows/pr-build-and-test.yml');
    expect(build).toContain('ref: ${{ inputs.head_sha }}');
    expect(build).toContain('persist-credentials: false');
    expect(build).toContain('test "$(git rev-parse HEAD)" = "${{ inputs.head_sha }}"');
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
});
