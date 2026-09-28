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

  it('keeps branch write privilege isolated to bounded pre-create convergence and never persists checkout credentials', () => {
    const yaml = workflow();
    expect(yaml).toContain('permissions: {}');
    expect(yaml).toContain('converge-project-labels:\n    name: Kanonische Projektlabel-Provider-Metadaten konvergieren\n    permissions:\n      contents: read\n      pull-requests: write');
    expect(yaml).toContain('precreate-sync:\n    name: Agenten-Branch vor Draft-PR auf CURRENT_MAIN konvergieren\n    permissions:\n      contents: write\n      pull-requests: read');
    expect(yaml).toContain('preflight-and-open:\n    name: Vertrauenswürdige Korrelation und Draft-PR-Erstellung\n    needs: [precreate-sync]\n    permissions:\n      contents: read\n      pull-requests: write');
    expect(yaml.match(/contents: write/g)?.length).toBe(1);
    expect(yaml.match(/persist-credentials: false/g)?.length).toBe(4);
    expect(yaml).not.toContain('persist-credentials: true');
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
    expect(yaml).toContain('PR_TRUSTED_HANDOFF: ${{ inputs.trusted_handoff }}');
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

  it('uses deterministic project-lane triage before creating a successor', () => {
    const yaml = workflow();
    expect(yaml).toContain('--state open');
    expect(yaml).toContain('--base main');
    expect(yaml).toContain('--json number,headRefName,createdAt,title,labels');
    expect(yaml).toContain('agentLaneTriage.mjs');
    expect(yaml).toContain('PR_PROJECT_ID');
    expect(yaml).toContain('LANE_AVAILABLE');
    expect(yaml).toContain('Draft-PR deferred by deterministic project-lane triage');
    expect(yaml).not.toContain('Geordnete Agenten-PR-Lane blockiert');

    const laneIndex = yaml.indexOf('agentLaneTriage.mjs');
    const createIndex = yaml.lastIndexOf('gh pr create');
    expect(laneIndex).toBeGreaterThan(-1);
    expect(createIndex).toBeGreaterThan(laneIndex);
  });

  it('converges a stale branch before candidate checkout and production preflight without force-push', () => {
    const yaml = workflow();
    const syncIndex = yaml.indexOf('Agenten-Branch vor Draft-PR auf CURRENT_MAIN konvergieren');
    const checkoutIndex = yaml.indexOf('Angeforderten Agenten-Branch auschecken');
    const preflightIndex = yaml.indexOf('Produktions-Baseline vor PR-Erstellung prüfen');

    expect(syncIndex).toBeGreaterThan(-1);
    expect(checkoutIndex).toBeGreaterThan(syncIndex);
    expect(preflightIndex).toBeGreaterThan(checkoutIndex);
    expect(yaml).toContain('behind|diverged)');
    expect(yaml).toContain('repos/${GITHUB_REPOSITORY}/merges');
    expect(yaml).toContain('-f "base=$HEAD_BRANCH"');
    expect(yaml).toContain('-f "head=$live_main_sha"');
    expect(yaml).toContain('after_lineage');
    expect(yaml).toContain('CURRENT_MAIN bewegte sich während Pre-create-Sync');
    expect(yaml).toContain('sync-agent-pr-branches.yml');
    expect(yaml).toContain("needs.precreate-sync.outputs.existing_pr != 'true'");
    expect(yaml).not.toContain('git push --force');
    expect(yaml).not.toContain('git push -f');
  });

  it('accepts trusted default-branch autonomous and self-healing handoffs without weakening manual dispatch', () => {
    const yaml = workflow();
    expect(yaml).toContain("inputs.trusted_handoff == 'agent-autocreate'");
    expect(yaml).toContain("github.event_name == 'workflow_run'");
    expect(yaml).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(yaml).toContain('github.event.workflow_run.head_repository.full_name == github.repository');
    expect(yaml).toContain("inputs.trusted_handoff == 'self-healing-recovery'");
    expect(yaml).toContain("github.event_name == 'schedule'");
    expect(yaml).toContain("github.ref == 'refs/heads/main'");
    expect(yaml).toContain("github.triggering_actor == 'SvenKulessa'");
    expect(yaml).toContain("github.actor == 'SvenKulessa'");
    expect(yaml.match(/PR_TRUSTED_HANDOFF: \$\{\{ inputs\.trusted_handoff \}\}/g)?.length).toBe(2);
  });

  it('uses the existing GitHub App as PR author so the sole Human Owner can provide the required approval', () => {
    const yaml = workflow();
    expect(yaml).toContain('CAPITAL_AI_GITHUB_APP_PRIVATE_KEY:');
    expect(yaml).toContain('actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1');
    expect(yaml).toContain('permission-pull-requests: write');
    expect(yaml).toContain('PR_CREATE_TOKEN: ${{ steps.pr_app_token.outputs.token }}');
    expect(yaml).toContain('GH_TOKEN="$PR_CREATE_TOKEN" gh pr create');
    expect(yaml).not.toContain('secrets: inherit');

    const autonomous = fs.readFileSync(path.join(root, '.github/workflows/agent-draft-pr-autocreate.yml'), 'utf8');
    const documentary = fs.readFileSync(path.join(root, '.github/workflows/documentary-change-impact.yml'), 'utf8');
    for (const caller of [autonomous, documentary]) {
      expect(caller).toContain('CAPITAL_AI_GITHUB_APP_PRIVATE_KEY: ${{ secrets.CAPITAL_AI_GITHUB_APP_PRIVATE_KEY }}');
      expect(caller).not.toContain('secrets: inherit');
    }
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

describe('autonomous agent Draft-PR intake', () => {
  const signalPath = path.join(root, '.github/workflows/agent-branch-signal.yml');
  const intakePath = path.join(root, '.github/workflows/agent-draft-pr-autocreate.yml');

  it('keeps the branch signal unprivileged and free of candidate checkout', () => {
    const yaml = fs.readFileSync(signalPath, 'utf8');
    expect(yaml).toContain('permissions: {}');
    expect(yaml).toContain("'agent/**'");
    expect(yaml).toContain("'claude/**'");
    expect(yaml).toContain("'grok/**'");
    expect(yaml).toContain("'ai/**'");
    expect(yaml).not.toContain('actions/checkout');
    expect(yaml).not.toContain('pull-requests: write');
    expect(yaml).not.toContain('issues: write');
  });

  it('uses workflow_run default-branch privilege separation for Draft-PR creation', () => {
    const yaml = fs.readFileSync(intakePath, 'utf8');
    expect(yaml).toContain("workflow_run:");
    expect(yaml).toContain("workflows: ['Agent Branch Signal']");
    expect(yaml).toContain("types: [completed]");
    expect(yaml).toContain("github.event.workflow_run.head_repository.full_name == github.repository");
    expect(yaml).toContain('uses: ./.github/workflows/open-agent-draft-pr.yml');
    expect(yaml).toContain('contents: write');
    expect(yaml).toContain('pull-requests: write');
    expect(yaml).not.toContain('issues: write');
    expect(yaml).toContain('trusted_handoff: agent-autocreate');
    expect(yaml).not.toContain('actions/checkout');
    expect(yaml).not.toContain('\n    steps:');
  });
});
