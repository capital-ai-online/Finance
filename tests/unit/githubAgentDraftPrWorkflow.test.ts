import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/open-agent-draft-pr.yml');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

describe('GitHub agent draft PR bot governance', () => {
  it('uses the current Node 24 GitHub Actions toolchain pinned by immutable SHAs', () => {
    const yaml = workflow();
    expect(yaml).toContain('actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8');
    expect(yaml).toContain('actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444');
    expect(yaml).toContain("node-version: '24.18.0'");
    expect(yaml).not.toContain('11bd71901bbe5b1630ceea73d27597364c9af683');
    expect(yaml).not.toContain('49933ea5288caeca8642d1e84afbd3f7d6820020');
    expect(yaml).not.toContain("node-version: '22'");
  });

  it('allows only canonical active-provider branch namespaces', () => {
    const yaml = workflow();
    expect(yaml).toContain('agent/*|claude/*|grok/*|ai/*');
    expect(yaml).toContain('agent/, claude/, grok/, ai/');
    expect(yaml).not.toContain('gemini/*');
    expect(yaml).not.toContain('copilot/*');
  });

  it('keeps least privilege and does not persist checkout credentials', () => {
    const yaml = workflow();
    expect(yaml).toContain('permissions:\n  contents: read\n  pull-requests: write');
    expect(yaml.match(/persist-credentials: false/g)?.length).toBe(2);
  });

  it('restricts dispatch mutation to the repository owner and requires the Approval Envelope', () => {
    const yaml = workflow();
    expect(yaml).toContain("github.triggering_actor == 'SvenKulessa'");
    expect(yaml).toContain("github.actor == 'SvenKulessa'");
    expect(yaml).toContain('approval_envelope_json:');
    expect(yaml).toContain('owner_pr_create_approval:');
    expect(yaml).toContain('node ../policy/scripts/pr/evaluateApprovalEnvelopeCli.mjs');
    expect(yaml).toContain("PR_COORDINATION_FAIL_CLOSED: 'true'");
  });

  it('does not hardcode envelope correlation PASS flags in the create workflow', () => {
    const yaml = workflow();
    expect(yaml).toContain('PR_CORRELATION_EVIDENCE_PATH: artifacts/pr/create-correlation.json');
    expect(yaml).toContain('PR_CORRELATION_OUTPUT: artifacts/pr/create-correlation.json');
    expect(yaml).toContain('PR_CREATE_GATE_OUTPUT: artifacts/pr/create-gate.json');
    expect(yaml).not.toContain('PR_CORRELATION_RESULT: PASS');
    expect(yaml).not.toContain("PR_AUTHORITY_RESOLVED: 'true'");
    expect(yaml).not.toContain("PR_OPEN_WRITER_PASS: 'true'");
    expect(yaml).not.toContain("PR_SEMANTIC_PASS: 'true'");
    expect(yaml).not.toContain("PR_NAMESPACE_PASS: 'true'");
    expect(yaml).not.toContain("PR_SECURITY_PASS: 'true'");
    expect(yaml).not.toContain('PR_VALIDATION_STATUS: PASS');
  });

  it('derives policy and PR body from trusted current main before mutation', () => {
    const yaml = workflow();
    expect(yaml).toContain('ref: main');
    expect(yaml).toContain('git fetch --no-tags ../policy main:refs/remotes/origin/main');
    expect(yaml).toContain('node ../policy/scripts/pr/productionPreflight.mjs');
    expect(yaml).toContain('node ../policy/scripts/pr/validateWorkClaim.mjs');
    expect(yaml).toContain('node ../policy/scripts/pr/renderPullRequestBody.mjs');
    expect(yaml).toContain('PR_TEMPLATE_PATH: ../policy/.github/pull_request_template.md');
  });

  it('prevents duplicate open PR creation and always opens as draft', () => {
    const yaml = workflow();
    expect(yaml).toContain('gh pr list --repo "$GITHUB_REPOSITORY" --state open --head "$HEAD_BRANCH"');
    expect(yaml).toContain('--draft');
    expect(yaml).toContain('--base main');
  });
});
