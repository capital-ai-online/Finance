import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = fs.readFileSync('.github/workflows/self-healing-package-continuation.yml', 'utf8');

describe('Self-Healing package continuation workflow', () => {
  it('runs only after the canonical successful post-merge correlation lane', () => {
    expect(workflow).toContain("workflows: ['Post-Merge Production Correlation']");
    expect(workflow).toContain("types: [completed]");
    expect(workflow).toContain("branches: [main]");
    expect(workflow).toContain("github.event.workflow_run.path == '.github/workflows/post-merge-production-correlation.yml'");
    expect(workflow).toContain("github.event.workflow_run.event == 'push'");
    expect(workflow).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(workflow).toContain("github.event.workflow_run.conclusion == 'success'");
  });

  it('uses least privilege and never receives contents write or merge authority', () => {
    expect(workflow).toContain('permissions: {}');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('pull-requests: read');
    expect(workflow).toContain('issues: write');
    expect(workflow).not.toContain('contents: write');
    expect(workflow).not.toMatch(/enablePullRequestAutoMerge|pulls\.merge|gh pr merge|mergePullRequest/i);
  });

  it('uses pinned trusted automation and current-main SH-02 work graph', () => {
    expect(workflow).toContain('actions/github-script@3a2844b7e9c422d3c10d287c895573f7108da1b3');
    expect(workflow).toContain('CAPITAL_AI_SH_CONTINUATION_V1');
    expect(workflow).toContain('OPS_08_B_SH_02_AUTONOMOUS_SELF_HEALING_PLATFORM_2026-09-20.md');
    expect(workflow).toContain('READY_FOR_FRESH_CURRENT_MAIN_CORRELATION');
  });

  it('generation-binds READY/BLOCKED/COMPLETE handoff writes to unchanged current main', () => {
    expect(workflow).toContain('capital-ai-self-healing-continuation-generation/1.0.0');
    expect(workflow).toContain("const crypto = require('crypto')");
    expect(workflow).toContain('Continuation Generation drifted before handoff mutation');
    expect(workflow).toContain('revalidateContinuationGeneration');
    expect(workflow).toContain('Continuation generation:');
    expect(workflow).toContain('cancel-in-progress: false');
  });

  it('does not checkout or execute candidate branch code', () => {
    expect(workflow).not.toContain('actions/checkout@');
    expect(workflow).not.toContain('npm ci');
    expect(workflow).not.toContain('node candidate/');
    expect(workflow).not.toContain('update-branch');
  });
});
