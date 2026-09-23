import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflowPath = new URL('../../.github/workflows/ops-exact-sha-runtime-recovery.yml', import.meta.url);
const workflow = readFileSync(workflowPath, 'utf8');

describe('SH-02.7 exact-SHA runtime recovery workflow', () => {
  it('is event-driven from the canonical CI and post-merge correlation lanes', () => {
    expect(workflow).toContain("workflows: ['CI', 'Post-Merge Production Correlation']");
    expect(workflow).toContain('types: [completed]');
    expect(workflow).toContain('branches: [main]');
    expect(workflow).toContain("github.event.workflow_run.path == '.github/workflows/ci.yml'");
    expect(workflow).toContain("github.event.workflow_run.path == '.github/workflows/post-merge-production-correlation.yml'");
    expect(workflow).toContain("github.event.workflow_run.head_repository.full_name == github.repository");
  });

  it('suppresses recovery for expected queued lag through the shared cadence helper', () => {
    expect(workflow).toContain('scripts/operations/mergeCadence.mjs');
    expect(workflow).toContain("if: steps.cadence.outputs.recovery_eligible != 'true'");
    expect(workflow).toContain("if: steps.cadence.outputs.recovery_eligible == 'true'");
    expect(workflow).toContain('DEPLOYMENT_QUEUED: mergeOrdinal=');
    expect(workflow).toContain('fetch-depth: 0');
  });

  it('does not create a second Render deployment authority', () => {
    expect(workflow).toContain("workflow_id: 'ci.yml'");
    expect(workflow).toContain("event: 'push'");
    expect(workflow).toContain("head_sha: sourceSha");
    expect(workflow).toContain("job.name === 'Deployment verifiziert / Render-Produktion'");
    expect(workflow).toContain("POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun");
    expect(workflow).not.toContain('RENDER_DEPLOY_HOOK_URL');
    expect(workflow).not.toContain('render.com/deploy');
    expect(workflow).not.toContain('--request POST \\');
  });

  it('binds mutation to CURRENT_MAIN and immutable provenance evidence', () => {
    expect(workflow).toContain("sourceSha !== currentMainSha");
    expect(workflow).toContain("liveMainSha !== sourceSha");
    expect(workflow).toContain('supply-chain-provenance-${sourceSha}');
    expect(workflow).toContain("artifact.expired !== true");
    expect(workflow).toContain("run.path === '.github/workflows/ci.yml'");
    expect(workflow).toContain("run.head_repository?.full_name === expectedRepo");
  });

  it('permits one recovery attempt with contract-matching cooldown and a kill switch', () => {
    expect(workflow).toContain("RECOVERY_COOLDOWN_MS: '300000'");
    expect(workflow).toContain("RECOVERY_MAX_CI_ATTEMPT: '1'");
    expect(workflow).toContain('Number(ciRun.run_attempt || 1) > maxCiAttempt');
    expect(workflow).toContain('ageMs < cooldownMs');
    expect(workflow).toContain('CAPITAL_AI_ENABLE_EXACT_SHA_RECOVERY');
    expect(workflow).toContain('activation remains HELD');
    expect(workflow).toContain('CAPITAL_AI_DISABLE_EXACT_SHA_RECOVERY');
    expect(workflow).toContain('Recovery circuit open');
  });

  it('requires independent liveness, readiness and deployment identity readback', () => {
    expect(workflow).toContain('https://capital-ai.online/healthz');
    expect(workflow).toContain('https://capital-ai.online/readyz');
    expect(workflow).toContain("x-capital-ai-commit");
    expect(workflow).toContain("x-capital-ai-branch");
    expect(workflow).toContain("x-capital-ai-repo");
    expect(workflow).toContain("x-capital-ai-provider");
    expect(workflow).toContain("readiness.payload?.ready === true");
    expect(workflow).toContain("Recovery circuit exhausted after one attempt");
  });

  it('uses pinned actions, bounded jobs and least-privilege job permissions', () => {
    expect(workflow).toContain('actions/github-script@3a2844b7e9c422d3c10d287c895573f7108da1b3');
    expect(workflow).toContain('timeout-minutes: 5');
    expect(workflow).toContain('timeout-minutes: 3');
    expect(workflow).toContain('actions: write');
    expect(workflow).toContain('contents: read');
    expect(workflow).not.toContain('pull-requests: write');
    expect(workflow).not.toContain('issues: write');
  });
});
