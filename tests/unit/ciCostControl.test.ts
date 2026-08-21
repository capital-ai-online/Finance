import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/ci.yml');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

function stepBlock(yaml: string, stepName: string): string {
  const marker = `      - name: ${stepName}`;
  const start = yaml.indexOf(marker);
  if (start < 0) throw new Error(`Step ${stepName} not found in ci.yml`);
  const rest = yaml.slice(start + marker.length);
  const next = rest.indexOf('\n      - name: ');
  return next >= 0 ? rest.slice(0, next) : rest;
}

describe('P0 GitHub Actions CI cost control', () => {
  it('keeps the M10 passkey gate operationally disabled', () => {
    const yaml = workflow();
    expect(yaml).toContain("M10_CI_GATE_ENABLED: 'false'");
    expect(yaml).toContain('M10 is operationally disabled: manual workflow_dispatch is not an alternate CI authorization path.');
  });

  it('places cost control after the M10 state check but before checkout and expensive work', () => {
    const yaml = workflow();
    const m10 = yaml.indexOf('M10 CI-Autorisierung vor teuren Schritten prüfen');
    const cost = yaml.indexOf('P0 CI-Kostenkontrolle — exakten PR-Snapshot wiederverwenden');
    const checkout = yaml.indexOf('Repository auschecken');

    expect(m10).toBeGreaterThan(-1);
    expect(cost).toBeGreaterThan(m10);
    expect(checkout).toBeGreaterThan(cost);
  });

  it('grants only read access to Actions for exact-run lookup', () => {
    const yaml = workflow();
    const buildStart = yaml.indexOf('  build-and-test:');
    const nextJob = yaml.indexOf('\n  deploy-production:', buildStart);
    const block = yaml.slice(buildStart, nextJob);

    expect(block).toContain('actions: read');
    expect(block).not.toContain('actions: write');
  });

  it('reuses a PASS only for the same workflow, PR number, head SHA and base SHA', () => {
    const cost = stepBlock(workflow(), 'P0 CI-Kostenkontrolle — exakten PR-Snapshot wiederverwenden');

    expect(cost).toContain("event: 'pull_request'");
    expect(cost).toContain('head_sha: headSha');
    expect(cost).toContain("status: 'success'");
    expect(cost).toContain('run.workflow_id !== workflowId');
    expect(cost).toContain('pr.number === prNumber');
    expect(cost).toContain('correlatedPr?.head?.sha === headSha');
    expect(cost).toContain('correlatedPr?.base?.sha === baseSha');
  });

  it('limits snapshot reuse to pull_request events', () => {
    const cost = stepBlock(workflow(), 'P0 CI-Kostenkontrolle — exakten PR-Snapshot wiederverwenden');
    expect(cost).toContain("if: github.event_name == 'pull_request'");
  });

  it('skips checkout and scope classification only after an exact successful snapshot match', () => {
    const yaml = workflow();
    const checkout = stepBlock(yaml, 'Repository auschecken');
    const scope = stepBlock(yaml, 'Prüfumfang klassifizieren (D/C/R)');

    expect(checkout).toContain("if: steps.cost_control.outputs.reuse_exact_snapshot != 'true'");
    expect(scope).toContain("if: steps.cost_control.outputs.reuse_exact_snapshot != 'true'");
  });

  it('does not reuse PR validation for the production main-push chain', () => {
    const yaml = workflow();
    const reuse = stepBlock(yaml, 'Exakten CI-PASS wiederverwenden');

    expect(reuse).toContain("if: steps.cost_control.outputs.reuse_exact_snapshot == 'true'");
    expect(yaml).toContain("github.event_name == 'push' && github.ref == 'refs/heads/main'");
  });
});
