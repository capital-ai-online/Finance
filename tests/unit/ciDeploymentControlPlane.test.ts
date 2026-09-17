import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
}

describe('CI and Render deployment control plane', () => {
  const ci = source('.github/workflows/ci.yml');
  const render = source('render.yaml');

  it('does not expose retired M10 authorization while allowing exact-head CI revalidation', () => {
    expect(ci).not.toContain('M10_CI_GATE_ENABLED');
    expect(ci).not.toContain('AUTHORIZE_PR_CI');
    expect(ci).not.toContain('/api/m10/');
    expect(ci).toContain('workflow_dispatch:');
    expect(ci).toContain('source_autofix_run_id:');
    expect(ci).toContain("dispatchShaBound = context.eventName !== 'workflow_dispatch' || runSha === headSha");
  });

  it('keeps consolidated production deployment restricted to verified main pushes', () => {
    expect(ci).toContain("github.event_name == 'push' && github.ref == 'refs/heads/main'");
    expect(ci).toContain('needs: [build-and-test]');
    expect(ci).toContain('verifySupplyChainProvenance.ts --require-ci');
    expect(ci).toContain('cosign sign-blob --yes');
    expect(ci).toContain('cosign verify-blob');
    expect(ci).toContain('RENDER_DEPLOY_HOOK_URL');
    expect(ci).toContain('manifest.sourceCommit !== process.env.VERIFIED_COMMIT_SHA');
    expect(ci).toContain('ref=${VERIFIED_COMMIT_SHA}');
    expect(ci).toContain('node p2b-runtime/artifacts/deployment/verifyDeploymentIdentity.mjs');
  });

  it('prevents Render from becoming a second automatic deployment authority', () => {
    expect(render).toContain('autoDeployTrigger: off');
    expect(render).toContain('verified main -> supply-chain attestation');
    expect(render).not.toContain('autoDeployTrigger: checksPass');
    expect(render).not.toContain('autoDeployTrigger: commit');
  });
});
