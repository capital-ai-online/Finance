import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('Human Owner Comment Gate', () => {
  it('uses trusted default-branch event chains and no pull_request_target', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    expect(gate).toContain('workflow_run:');
    expect(gate).toContain('workflows: ["PR Governance"]');
    expect(gate).toContain('issue_comment:');
    expect(gate).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(gate).not.toContain('pull_request_target:');
    expect(gate).not.toContain('pull_request:\n');
  });

  it('partitions permissions with the PR #239 least-privilege workaround', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    const seed = gate.slice(gate.indexOf('  seed-or-reset:'), gate.indexOf('  human-verification:'));
    const human = gate.slice(gate.indexOf('  human-verification:'));
    expect(gate).toContain('permissions: {}');
    expect(seed).toContain('issues: read');
    expect(seed).toContain('pull-requests: write');
    expect(seed).not.toContain('issues: write');
    expect(seed).not.toContain('actions: write');
    expect(human).toContain('actions: write');
    expect(human).toContain('checks: write');
    expect(human).not.toContain('pull-requests: write');
  });

  it('accepts only the workflow bot comment and exact non-quoted attestations', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    expect(gate).toContain('.user.login == "github-actions[bot]"');
    expect(gate).toContain("EXPECTED_COMMENT_AUTHOR='github-actions[bot]'");
    expect(gate).toContain("line.startswith('>')");
    expect(gate).toContain("re.fullmatch(r'-\\s*\\[\\s*[xX]");
    expect(gate).toContain('if found != required:');
  });

  it('binds checks and one-shot lookup to PR, comment, head and GitHub Actions app', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    const build = read('.github/workflows/pr-build-and-test.yml');
    expect(gate).toContain('external_id=capital-ai:pr:${PR_NUMBER}:human:${COMMENT_ID}:${current_head}');
    expect(gate).toContain('external_id=capital-ai:pr:${PR_NUMBER}:build:${COMMENT_ID}:${current_head}');
    expect(gate).toContain('startswith(env.CHECK_PREFIX)');
    expect(build).toContain('.external_id == env.EXPECTED_EXTERNAL_ID');
    expect(build).toContain('(.app.slug // "") == "github-actions"');
  });
});

describe('PR Build and Test dispatch', () => {
  it('uses YAML-safe scalars for text containing a PR hash', () => {
    const build = read('.github/workflows/pr-build-and-test.yml');
    expect(build).toMatch(/^run-name: "PR #\$\{\{ inputs\.pr_number \}\}/m);
    expect(build).toContain('name: Primär-Volltest autorisiert\n        run: >-');
    expect(build).not.toMatch(/^\s*run:\s+echo\s+.*PR #/m);
  });

  it('executes the full candidate suite only after fail-closed evidence validation', () => {
    const build = read('.github/workflows/pr-build-and-test.yml');
    expect(build).toContain('Human-/Owner-Evidence erneut verifizieren');
    expect(build).toContain('actions: read');
    expect(build).toContain('actions/workflows/pr-governance.yml/runs?event=pull_request&head_sha=${EXPECTED_HEAD_SHA}');
    expect(build).toContain('Live-PR-Body und Produktionsbaseline mit trusted-main Policy validieren');
    expect(build).toContain('needs: [owner-evidence]');
    expect(build).toContain('npm run repository:validate');
    expect(build).toContain('npm audit --omit=dev --audit-level=high');
    expect(build).toContain('npm test');
    expect(build).toContain('npm run build');
    expect(build).toContain('Produktions-Docker-Container starten und /healthz prüfen');
  });
});
