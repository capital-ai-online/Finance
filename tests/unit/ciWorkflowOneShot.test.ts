import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('single CI authority contract', () => {
  it('keeps main CI push-only and free of PR authorization state', () => {
    const ci = read('.github/workflows/ci.yml');
    expect(ci).toContain('push:\n    branches: [main]');
    expect(ci).not.toContain('pull_request:');
    expect(ci).not.toContain('issue_comment:');
    expect(ci).not.toContain('Human/Owner:');
    expect(ci).not.toContain('owner-gate');
    expect(ci).toContain('permissions: {}');
    expect(ci).toContain('persist-credentials: false');
  });

  it('routes PR builds only through the head-bound comment gate and trusted main dispatch', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    const build = read('.github/workflows/pr-build-and-test.yml');
    expect(gate).toContain('issue_comment:');
    expect(gate).toContain('types: [edited]');
    expect(gate).toContain('gh workflow run pr-build-and-test.yml');
    expect(gate).toContain('--ref main');
    expect(build).toContain('workflow_dispatch:');
    expect(build).not.toContain('pull_request_target:');
    expect(build).not.toContain('pull_request:\n');
    expect(build).toContain('cancel-in-progress: false');
  });

  it('binds the one-shot reservation to PR, bot comment and exact head', () => {
    const gate = read('.github/workflows/human-owner-comment-gate.yml');
    const build = read('.github/workflows/pr-build-and-test.yml');
    expect(gate).toContain('capital-ai:pr:${PR_NUMBER}:build:${COMMENT_ID}:${current_head}');
    expect(gate).toContain('startswith(env.CHECK_PREFIX)');
    expect(build).toContain('.external_id == env.EXPECTED_EXTERNAL_ID');
    expect(build).toContain('.head_sha == env.EXPECTED_HEAD_SHA');
    expect(build).toContain('(.app.slug // "") == "github-actions"');
  });

  it('keeps blocking software, runtime and main deployment checks', () => {
    const main = read('.github/workflows/ci.yml');
    const pr = read('.github/workflows/pr-build-and-test.yml');
    for (const workflow of [main, pr]) {
      expect(workflow).toContain('npm audit --omit=dev --audit-level=high');
      expect(workflow).toContain('npm test');
      expect(workflow).toContain('npm run build');
      expect(workflow).toContain('verifyDockerHardening.mjs');
      expect(workflow).toContain('Produktions-Docker-Container starten und /healthz prüfen');
    }
    expect(main).toContain('Render-Deployment für verifizierten main-Commit auslösen');
    expect(pr).not.toContain('RENDER_DEPLOY_HOOK_URL');
  });
});
