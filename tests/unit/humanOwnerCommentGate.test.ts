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

  it('does not let a same-name CI check hide the gate reservation', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    const human = gate.slice(gate.indexOf('  human-verification:'));
    expect(human).toContain('check_name=build-and-test&filter=all&per_page=100');
    expect(human).not.toContain('check_name=build-and-test&per_page=100');
    expect(human).toContain('startswith(env.CHECK_PREFIX)');
  });

  it('keeps a running or successful one-shot closed and permits a reviewed retry after failure', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    const human = gate.slice(gate.indexOf('  human-verification:'));
    expect(human).toContain('.status != "completed" or .conclusion == "success"');
    expect(human).toContain('if [ -n "$blocking" ]; then');
    expect(human).toContain('echo "dispatch=false" >> "$GITHUB_OUTPUT"');
  });

  it('keeps PR workflow followers serial instead of running Auto-Status beside the Human Gate', () => {
    const autoStatus = read('.github/workflows/pr-auto-classification.yml');
    expect(autoStatus).toContain('workflows: ["PR Build and Test"]');
    expect(autoStatus).not.toContain('workflows: ["PR Governance", "PR Build and Test"]');
    expect(autoStatus).not.toContain("github.event.workflow_run.name == 'PR Governance'");
    expect(autoStatus).toContain("github.event.workflow_run.name == 'PR Build and Test'");
  });
});

describe('PR Build and Test dispatch', () => {
  it('uses YAML-safe scalars for text containing a PR hash', () => {
    const build = read('.github/workflows/pr-build-and-test.yml');
    expect(build).toMatch(/^run-name: "PR #\$\{\{ inputs\.pr_number \}\}/m);
    expect(build).toContain('name: Primär-Volltest autorisiert\n        run: >-');
    expect(build).not.toMatch(/^\s*run:\s+echo\s+.*PR #/m);
  });

  it('separates Human evidence from trusted policy validation', () => {
    const build = read('.github/workflows/pr-build-and-test.yml');
    expect(build).toContain('  human-owner-evidence:');
    expect(build).toContain('  trusted-policy-preflight:');
    expect(build).toContain('needs: [human-owner-evidence]');
    expect(build).toContain('name: Trusted PR Policy / Baseline validieren');
    expect(build).toContain('Policy-Preflight=${POLICY_RESULT}');
  });

  it('keeps trusted policy and candidate checkouts isolated without cross-checkout branch fetches', () => {
    const build = read('.github/workflows/pr-build-and-test.yml');
    expect(build).toContain('path: policy');
    expect(build).toContain('path: candidate');
    expect(build).toContain('fetch-depth: 0');
    expect(build).toContain('persist-credentials: false');
    expect(build).toContain('git cat-file -e "${PR_BASE_REF}^{commit}"');
    expect(build).toContain('git cat-file -e "${PR_HEAD_REF}^{commit}"');
    expect(build).not.toContain('git fetch --no-tags ../policy main:refs/remotes/origin/main');
  });

  it('executes the full candidate suite only after Human evidence and policy preflight pass', () => {
    const build = read('.github/workflows/pr-build-and-test.yml');
    expect(build).toContain('Human-/Owner-Evidence erneut verifizieren');
    expect(build).toContain('actions: read');
    expect(build).toContain('actions/workflows/pr-governance.yml/runs?event=pull_request&head_sha=${EXPECTED_HEAD_SHA}');
    expect(build).toContain('Live-PR-Body und Produktionsbaseline mit trusted-main Policy validieren');
    expect(build).toContain('needs: [human-owner-evidence, trusted-policy-preflight]');
    expect(build).toContain('npm run repository:validate');
    expect(build).toContain('npm audit --omit=dev --audit-level=high');
    expect(build).toContain('npm test');
    expect(build).toContain('npm run build');
    expect(build).toContain('Produktions-Docker-Container starten und /healthz prüfen');
  });
});
