import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/open-agent-draft-pr.yml');
const verifierPath = path.join(root, 'scripts/pr/verifyPrCreationApproval.mjs');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

function verifier(): string {
  return fs.readFileSync(verifierPath, 'utf8');
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

  it('keeps least privilege and never persists checkout credentials', () => {
    const yaml = workflow();
    expect(yaml).toContain('permissions:\n  contents: read\n  pull-requests: write');
    expect(yaml.match(/persist-credentials: false/g)?.length).toBe(3);
    expect(yaml).not.toContain('contents: write');
  });

  it('restricts dispatch mutation to the repository owner and requires explicit Approval Envelope evidence', () => {
    const yaml = workflow();
    expect(yaml).toContain("github.triggering_actor == 'SvenKulessa'");
    expect(yaml).toContain("github.actor == 'SvenKulessa'");
    expect(yaml).toContain('approval_envelope_json:');
    expect(yaml).toContain('owner_pr_create_approval:');
    expect(yaml).toContain("description: 'Exakte Owner-Freigabe. Nur gültig: PR Erstellung : Freigegeben'");
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

  it('refreshes trusted main and reruns correlation immediately before the external create mutation', () => {
    const yaml = workflow();
    expect(yaml).toContain('path: create-policy');
    expect(yaml).toContain('git/ref/heads/main');
    expect(yaml).toContain("--jq '.object.sha'");
    expect(yaml).toContain('git fetch --no-tags ../create-policy main:refs/remotes/origin/main');
    expect(yaml).toContain('node ../create-policy/scripts/pr/productionPreflight.mjs');
    expect(yaml).toContain('node ../create-policy/scripts/pr/validateWorkClaim.mjs');
    expect(yaml).toContain('PR_CORRELATION_EVIDENCE_PATH: artifacts/pr/final-create-correlation.json');
    expect(yaml).toContain('PR_EXPECTED_CURRENT_MAIN_SHA="$live_main_sha"');
  });

  it('binds the actual rendered title and live refs through trusted-main verifier directly before gh pr create', () => {
    const yaml = workflow();
    expect(yaml).toContain('PR_TITLE: ${{ steps.render.outputs.pr_title }}');
    expect(yaml).toContain('PR_INTENDED_TITLE="$PR_TITLE"');
    expect(yaml).toContain('node ../create-policy/scripts/pr/verifyPrCreationApproval.mjs');
    expect(yaml).not.toContain('node scripts/pr/verifyPrCreationApproval.mjs');

    const verifyIndex = yaml.lastIndexOf('node ../create-policy/scripts/pr/verifyPrCreationApproval.mjs');
    const createIndex = yaml.lastIndexOf('gh pr create');
    expect(verifyIndex).toBeGreaterThan(-1);
    expect(createIndex).toBeGreaterThan(verifyIndex);
    expect(yaml.slice(verifyIndex, createIndex)).not.toContain('run:');
  });

  it('final verifier has explicit negative gates for missing, stale and divergent approval evidence', () => {
    const source = verifier();
    expect(source).toContain('Approval Envelope evidence is missing');
    expect(source).toContain('final create-correlation evidence is stale or has an invalid timestamp');
    expect(source).toContain('live main SHA changed after the final local refresh');
    expect(source).toContain('live branch head SHA differs from the locally verified branch head');
    expect(source).toContain('actual rendered PR title differs from the approved title');
    expect(source).toContain('result.state !== APPROVAL_STILL_VALID');
  });

  it('prevents duplicate open PR creation and always opens as draft', () => {
    const yaml = workflow();
    expect(yaml).toContain('gh pr list --repo "$GITHUB_REPOSITORY" --state open --head "$HEAD_BRANCH"');
    expect(yaml).toContain('--draft');
    expect(yaml).toContain('--base main');
  });
});
