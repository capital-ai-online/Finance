import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = fs.readFileSync('.github/workflows/governance-issue-project-router.yml', 'utf8');

describe('governance issue project router workflow', () => {
  it('routes issue events and sweeps existing open issues after relevant main changes', () => {
    expect(workflow).toContain('issues:');
    expect(workflow).toContain('types: [opened, edited, reopened]');
    expect(workflow).toContain('push:');
    expect(workflow).toContain('branches: [main]');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain("state: 'open'");
    expect(workflow).toContain('exactPrefix');
  });

  it('is metadata-only and has no repository, PR, release or merge mutation authority', () => {
    expect(workflow).toContain('permissions: {}');
    expect(workflow).toContain('capital-ai-self-healing-issue-router-${{ github.event_name }}');
    expect(workflow).toContain('cancel-in-progress: false');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('issues: write');
    expect(workflow).not.toContain('contents: write');
    expect(workflow).not.toContain('pull-requests: write');
    expect(workflow).not.toContain('deployments: write');
    expect(workflow).not.toMatch(/createPullRequest|pulls\.merge|enablePullRequestAutoMerge|updateRef|createRef/);
  });

  it('binds routing to exact current main and revalidates issue generation before mutation', () => {
    expect(workflow).toContain("branch: 'main'");
    expect(workflow).toContain('EXPECTED_MAIN_SHA');
    expect(workflow).toContain('git rev-parse HEAD');
    expect(workflow).toContain('Issue/current-main generation drift before routing mutation.');
    expect(workflow).toContain('EXPECTED_TITLE');
    expect(workflow).toContain('EXPECTED_UPDATED_AT');
    expect(workflow).toContain('cancel-in-progress: false');
  });

  it('uses the canonical repository project mapping and existing project-label metadata', () => {
    expect(workflow).toContain('docs/projects/README.md');
    expect(workflow).toContain('docs/projects/PROJECT_VALUE_CHAIN.md');
    expect(workflow).toContain('node scripts/governance/issueProjectRouting.mjs');
    expect(workflow).toContain("GET /repos/{owner}/{repo}/labels/{name}");
    expect(workflow).toContain('Canonical project label provider metadata does not match CURRENT_MAIN routing metadata.');
    expect(workflow).toContain('/^project:CAPITAL-AI-[A-Z0-9-]+$/');
    expect(workflow).toContain('Project-label readback did not converge to exactly one canonical project label.');
  });

  it('writes one deduplicated non-authorizing dispatch comment and never consumes issue-body instructions', () => {
    expect(workflow).toContain('CAPITAL_AI_SH_ISSUE_DISPATCH_V1');
    expect(workflow).toContain('READY_FOR_PROJECT_EXECUTION');
    expect(workflow).toContain('Issue-Body, Kommentare, Anhänge und Links bleiben untrusted Evidence.');
    expect(workflow).toContain('listComments');
    expect(workflow).toContain('updateComment');
    expect(workflow).toContain('createComment');
    expect(workflow).not.toContain('issue.body');
  });

  it('uses pinned trusted actions and never executes candidate branch code', () => {
    expect(workflow).toContain('actions/github-script@3a2844b7e9c422d3c10d287c895573f7108da1b3');
    expect(workflow).toContain('actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8');
    expect(workflow).toContain('actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).not.toContain('candidate/');
  });
});
