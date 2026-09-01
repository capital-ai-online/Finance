import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/pr-production-baseline-post-merge-refresh.yml');
const workflow = () => fs.readFileSync(workflowPath, 'utf8');

describe('production baseline post-merge refresh', () => {
  it('binds only to the trusted main-push branch-sync workflow', () => {
    const yaml = workflow();
    expect(yaml).toContain("workflows: ['Agenten-PR-Branches synchronisieren']");
    expect(yaml).toContain("github.event.workflow_run.path == '.github/workflows/sync-agent-pr-branches.yml'");
    expect(yaml).toContain("github.event.workflow_run.event == 'push'");
    expect(yaml).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(yaml).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(yaml).not.toContain('pull_request_target');
  });

  it('accepts healthy production only as an immutable main ancestor', () => {
    const yaml = workflow();
    expect(yaml).toContain("fetch('https://capital-ai.online/healthz'");
    expect(yaml).toContain("basehead: `${productionSha}...${mainSha}`");
    expect(yaml).toContain("lineage.data.status !== 'ahead' && lineage.data.status !== 'identical'");
    expect(yaml).toContain("productionBranch !== 'main'");
    expect(yaml).toContain('productionRepo !== `${context.repo.owner}/${context.repo.repo}`');
  });

  it('waits boundedly for update-branch and mutates only synchronized same-repo non-draft PRs', () => {
    const yaml = workflow();
    expect(yaml).toContain('const maxRounds = 7;');
    expect(yaml).toContain('setTimeout(resolve, 5_000)');
    expect(yaml).toContain("state: 'open'");
    expect(yaml).toContain("base: 'main'");
    expect(yaml).toContain('pr.draft === true');
    expect(yaml).toContain("basehead: `${mainSha}...${headSha}`");
  });

  it('retries transient GitHub API failures while keeping client and authorization errors fail-closed', () => {
    const yaml = workflow();
    expect(yaml.match(/\n\s+retries: 3/g) ?? []).toHaveLength(3);
    expect(yaml.match(/\n\s+retry-exempt-status-codes: 400,401,403,404,422/g) ?? []).toHaveLength(3);
  });

  it('executes only trusted-main baseline contracts and no candidate code', () => {
    const yaml = workflow();
    expect(yaml).toContain('node ../policy/scripts/pr/productionPreflight.mjs');
    expect(yaml).toContain('node ../policy/scripts/pr/updatePrProductionBaseline.mjs');
    expect(yaml).toContain('persist-credentials: false');
    expect(yaml).not.toContain('node candidate/');
    expect(yaml).not.toContain('npm --prefix candidate');
  });

  it('rechecks main head and production immediately before body mutation', () => {
    const yaml = workflow();
    expect(yaml).toContain('EXPECTED_PRODUCTION_SHA: ${{ steps.baseline.outputs.production_sha }}');
    expect(yaml).toContain("steps.freshness.outputs.stable == 'true'");
    expect(yaml).toContain('liveProduction === expectedProduction');
    expect(yaml).toContain('Snapshot änderte sich vor Baseline-Write');
  });

  it('revalidates exact completed Governance without relying on edited events from GITHUB_TOKEN', () => {
    const yaml = workflow();
    expect(yaml).toContain("run.path === '.github/workflows/pr-governance.yml'");
    expect(yaml).toContain('normalizeSha(item.base?.sha) === expectedMain');
    expect(yaml).toContain("POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun");
    expect(yaml).toContain('noch kein abgeschlossener exact-head/base Governance-Run');
  });

  it('keeps privileged actions pinned and permissions bounded', () => {
    const yaml = workflow();
    expect(yaml).toContain('actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8');
    expect(yaml).toContain('actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444');
    expect(yaml).toContain('actions/github-script@3a2844b7e9c422d3c10d287c895573f7108da1b3');
    expect(yaml).toContain('actions: write');
    expect(yaml).toContain('contents: read');
    expect(yaml).toContain('pull-requests: write');
  });
});
