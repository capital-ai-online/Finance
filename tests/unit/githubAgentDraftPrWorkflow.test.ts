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
  });

  it('allows only canonical active-provider branch namespaces', () => {
    const yaml = workflow();
    expect(yaml).toContain('agent/*|claude/*|grok/*|ai/*');
    expect(yaml).toContain('agent/, claude/, grok/, ai/');
    expect(yaml).not.toContain('gemini/*');
    expect(yaml).not.toContain('copilot/*');
  });

  it('keeps least privilege and never persists checkout credentials', () => {
    const yaml = workflow();
    expect(yaml).toContain('permissions:\n  contents: read\n  pull-requests: write');
    expect(yaml.match(/persist-credentials: false/g)?.length).toBe(4);
    expect(yaml).not.toContain('contents: write');
  });

  it('runs provider-label convergence only on direct relevant main pushes and never on reusable handoffs', () => {
    const yaml = workflow();
    expect(yaml).toContain("paths:\n      - 'docs/projects/README.md'");
    expect(yaml).toContain("github.event_name == 'push' &&");
    expect(yaml).toContain("inputs.head_branch == ''");
    expect(yaml).toContain('PR_LABEL_CLASSIFICATION_SCOPE=ALL_PROJECTS');
    expect(yaml).toContain('CANONICAL_PROJECT_LABEL_SET_CLASSIFIED');
    expect(yaml).toContain('Provider-Readback');
  });

  it('removes pre-create Owner approval inputs while retaining Owner-bound dispatch identity', () => {
    const yaml = workflow();
    expect(yaml).toContain("github.triggering_actor == 'SvenKulessa'");
    expect(yaml).toContain("github.actor == 'SvenKulessa'");
    expect(yaml).toContain('workflow_call:');
    expect(yaml).toContain("inputs.trusted_handoff == 'documentary-autosync'");
    expect(yaml).toContain("github.event_name == 'push'");
    expect(yaml).toContain("github.ref == 'refs/heads/main'");
    expect(yaml).not.toContain('approval_envelope_json:');
    expect(yaml).not.toContain('owner_pr_create_approval:');
    expect(yaml).not.toContain('PR Erstellung : Freigegeben');
    expect(yaml).not.toContain('evaluateApprovalEnvelopeCli.mjs');
    expect(yaml).not.toContain('verifyPrCreationApproval.mjs');
  });

  it('derives policy and PR body from trusted current main before mutation', () => {
    const yaml = workflow();
    expect(yaml).toContain('ref: main');
    expect(yaml).toContain('git fetch --no-tags ../policy main:refs/remotes/origin/main');
    expect(yaml).toContain('node ../policy/scripts/pr/productionPreflight.mjs');
    expect(yaml).toContain('node ../policy/scripts/pr/validateWorkClaim.mjs');
    expect(yaml).toContain('node ../policy/scripts/pr/renderPullRequestBody.mjs');
    expect(yaml).toContain('PR_TEMPLATE_PATH: ../policy/.github/pull_request_template.md');
    expect(yaml).toContain("PR_COORDINATION_FAIL_CLOSED: 'true'");
  });

  it('refreshes trusted main and reruns correlation immediately before external create mutation', () => {
    const yaml = workflow();
    expect(yaml).toContain('path: create-policy');
    expect(yaml).toContain('git/ref/heads/main');
    expect(yaml).toContain("--jq '.object.sha'");
    expect(yaml).toContain('git fetch --no-tags ../create-policy main:refs/remotes/origin/main');
    expect(yaml).toContain('node ../create-policy/scripts/pr/productionPreflight.mjs');
    expect(yaml).toContain('node ../create-policy/scripts/pr/validateWorkClaim.mjs');
    expect(yaml).toContain('PR_CORRELATION_OUTPUT: artifacts/pr/final-create-correlation.json');
  });

  it('serializes the automated agent PR lane before creating a successor', () => {
    const yaml = workflow();
    expect(yaml).toContain('--state open');
    expect(yaml).toContain('--base main');
    expect(yaml).toContain('test("^(agent|claude|grok|ai)/")');
    expect(yaml).toContain('Geordnete Agenten-PR-Lane blockiert');
    expect(yaml).toContain('älterer aktiver Agenten-PR');

    const laneIndex = yaml.indexOf('Geordnete Agenten-PR-Lane blockiert');
    const createIndex = yaml.lastIndexOf('gh pr create');
    expect(laneIndex).toBeGreaterThan(-1);
    expect(createIndex).toBeGreaterThan(laneIndex);
  });

  it('prevents duplicate open PR creation and always opens as draft against main', () => {
    const yaml = workflow();
    expect(yaml).toContain('gh pr list --repo "$GITHUB_REPOSITORY" --state open --head "$HEAD_BRANCH"');
    expect(yaml).toContain('--draft');
    expect(yaml).toContain('--base main');
    expect(yaml).toContain('--head "$HEAD_BRANCH"');
    expect(yaml).toContain('--title "$PR_TITLE"');
  });
});
