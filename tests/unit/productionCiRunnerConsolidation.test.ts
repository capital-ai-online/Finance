import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/ci.yml');
const renderPath = path.join(root, 'render.yaml');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

function jobBlock(yaml: string, jobId: string): string {
  const marker = `  ${jobId}:`;
  const start = yaml.indexOf(marker);
  if (start < 0) throw new Error(`Job ${jobId} not found in ci.yml`);
  const rest = yaml.slice(start + marker.length);
  const next = rest.search(/\n  [a-zA-Z0-9_-]+:\n/);
  return next >= 0 ? rest.slice(0, next) : rest;
}

function stepBlock(job: string, stepName: string): string {
  const marker = `      - name: ${stepName}`;
  const start = job.indexOf(marker);
  if (start < 0) throw new Error(`Step ${stepName} not found in ci.yml`);
  const rest = job.slice(start + marker.length);
  const next = rest.indexOf('\n      - name: ');
  return next >= 0 ? rest.slice(0, next) : rest;
}

describe('P2B production CI runner consolidation', () => {
  it('keeps retired M10 authorization out and isolates bounded PR revalidation from production', () => {
    const yaml = workflow();
    expect(yaml).not.toContain('M10_CI_GATE_ENABLED');
    expect(yaml).not.toContain('AUTHORIZE_PR_CI');
    expect(yaml).toContain('workflow_dispatch:');
    expect(yaml).toContain('expected_head_sha:');
    expect(yaml).toContain('expected_base_sha:');
    expect(jobBlock(yaml, 'deploy-production')).not.toContain('workflow_dispatch');
  });

  it('keeps exactly two hosted runners in the CI workflow while computing cadence inside build-and-test', () => {
    const yaml = workflow();
    expect((yaml.match(/runs-on: ubuntu-latest/g) ?? []).length).toBe(2);
    expect(yaml).toContain('  build-and-test:');
    expect(yaml).toContain('  deploy-production:');
    expect(yaml).not.toContain('\n  deployment-cadence:');
    expect(jobBlock(yaml, 'build-and-test')).toContain('Bestehende oder 5er-Merge-Deployment-Regel bestimmen');
    expect(yaml).not.toContain('\n  supply-chain-attestation:');
    expect(yaml).not.toContain('\n  verify-deployment-identity:');
  });

  it('signs provenance inside the already verified main build', () => {
    const build = jobBlock(workflow(), 'build-and-test');
    expect(build).toContain('npm run build');
    expect(build).toContain('npm run predeploy:check');
    expect(build).toContain('verifySupplyChainProvenance.ts --require-ci');
    expect(build).toContain('cosign sign-blob --yes');
    expect(build).toContain('cosign verify-blob');
    expect(build).toContain('certificate-identity "https://github.com/${{ github.repository }}/.github/workflows/ci.yml@refs/heads/main"');
    expect(build).toContain("if: github.event_name == 'push' && github.ref == 'refs/heads/main'");
  });

  it('does not rebuild or reinstall dependencies for supply-chain attestation', () => {
    const yaml = workflow();
    expect((yaml.match(/run: npm run build/g) ?? []).length).toBe(1);
    expect((yaml.match(/run: npm ci/g) ?? []).length).toBe(1);
  });

  it('bundles the existing deployment identity verifier from the exact main build', () => {
    const build = jobBlock(workflow(), 'build-and-test');
    expect(build).toContain('npx esbuild scripts/deployment/verifyDeploymentIdentity.ts');
    expect(build).toContain('--outfile=artifacts/deployment/verifyDeploymentIdentity.mjs');
    expect(build).toContain('node --check artifacts/deployment/verifyDeploymentIdentity.mjs');
    expect(build).toContain('artifacts/deployment/verifyDeploymentIdentity.mjs');
  });

  it('keeps the production environment job minimal, exact-SHA-bound, and on Node 24 actions', () => {
    const deploy = jobBlock(workflow(), 'deploy-production');
    expect(deploy).toContain('needs: [build-and-test]');
    expect(deploy).toContain("needs.build-and-test.outputs.deploy_allowed == 'true'");
    expect(deploy).toContain('environment: production');
    expect(deploy).toContain('actions: read');
    expect(deploy).not.toContain('contents: write');
    expect(deploy).not.toContain('actions/checkout@');
    expect(deploy).not.toContain('npm ci');
    expect(deploy).not.toContain('npm run build');
    expect(deploy).toContain('actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c');
    expect(deploy).not.toContain('actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093');
    expect(deploy).toContain("node-version: '24.18.0'");
    expect(deploy).toContain('manifest.sourceCommit !== process.env.VERIFIED_COMMIT_SHA');
    expect(deploy).toContain('live_main_sha');
    expect(deploy).toContain('test "$live_main_sha" = "$VERIFIED_COMMIT_SHA"');
    expect(deploy).toContain('CAPITAL_AI_RENDER_API_KEY');
    expect(deploy).toContain('node p2b-runtime/artifacts/deployment/triggerRenderExactCommit.mjs');
    expect(deploy).not.toContain('RENDER_DEPLOY_HOOK_URL');
    expect(deploy).not.toContain('ref=main');
    expect(deploy).not.toContain('ref=${VERIFIED_COMMIT_SHA}');
    expect(deploy).toContain('node p2b-runtime/artifacts/deployment/verifyDeploymentIdentity.mjs');
  });

  it('preserves immutable supply-chain and deployment evidence', () => {
    const yaml = workflow();
    expect(yaml).toContain('supply-chain-provenance-${{ github.sha }}');
    expect(yaml).toContain('deployment-identity-evidence-${{ github.sha }}');
    expect(yaml).toContain('dist/security/provenance.json.sigstore.json');
    expect(yaml).toContain('retention-days: 90');
  });

  it('keeps deploy-production fail-closed to successful push:main only', () => {
    const deploy = jobBlock(workflow(), 'deploy-production');
    const ifLine = /^\s*if:.*$/m.exec(deploy);
    expect(ifLine, 'deploy-production must declare an if: guard').not.toBeNull();
    expect(ifLine![0]).toContain("needs.build-and-test.result == 'success'");
    expect(ifLine![0]).toContain("github.event_name == 'push' && github.ref == 'refs/heads/main'");
    expect(deploy).not.toContain('pull_request');
    expect(deploy).not.toContain('workflow_dispatch');
  });

  it('keeps each consolidated supply-chain mutation step main-push-only', () => {
    const build = jobBlock(workflow(), 'build-and-test');
    const guard = "github.event_name == 'push' && github.ref == 'refs/heads/main'";
    for (const stepName of [
      'P2B Provenance-Bindung an gehosteten main-Build erzwingen',
      'P2B cosign für main-Provenance installieren',
      'P2B Provenance keyless signieren (Sigstore/Fulcio/Rekor)',
      'P2B Signatur gegen erwartete Workflow-Identität verifizieren',
      'P2B Post-Deploy-Verifier aus exaktem main-Build bundeln',
      'P2B Supply-Chain-Artefakte aus demselben main-Build ablegen',
    ]) {
      expect(stepBlock(build, stepName)).toContain(`if: ${guard}`);
    }
  });

  it('keeps OIDC signing authority out of the production environment job', () => {
    const yaml = workflow();
    const build = jobBlock(yaml, 'build-and-test');
    const deploy = jobBlock(yaml, 'deploy-production');
    expect(build).toContain('id-token: write');
    expect(build).not.toContain('contents: write');
    expect(deploy).toContain('actions: read');
    expect(deploy).not.toContain('id-token: write');
    expect(deploy).not.toContain('contents: write');
  });

  it('binds quality evidence and Docker identity to the exact checked-out source commit', () => {
    const yaml = workflow();
    const build = jobBlock(yaml, 'build-and-test');
    expect(yaml).toContain("RELEASE_SOURCE_COMMIT: ${{ github.event_name == 'push' && github.sha || github.event.pull_request.head.sha || inputs.expected_head_sha }}");
    expect(yaml).not.toContain('inputs.m10_head_sha');
    expect(build).toContain('test "$RELEASE_SOURCE_COMMIT" = "$(git rev-parse HEAD)"');
    expect(build).toContain('--build-arg RELEASE_SOURCE_COMMIT="$RELEASE_SOURCE_COMMIT"');
    expect(build).toContain('--tag "capital-ai-ci:$RELEASE_SOURCE_COMMIT"');
    expect(build).not.toContain('capital-ai-ci:${{ github.sha }}');
  });

  it('keeps exact-head dispatch correlation and retired M10 out of current CI', () => {
    const yaml = workflow();
    expect(yaml).not.toContain('M10_CI_GATE_ENABLED');
    expect(yaml).not.toContain('AUTHORIZE_PR_CI');
    expect(yaml).not.toContain('/api/m10/');
    expect(yaml).toContain('source_autofix_run_id:');
    expect(yaml).toContain("dispatchShaBound = context.eventName !== 'workflow_dispatch' || runSha === headSha");
  });

  it('keeps Render native auto deploy disabled so verified CI remains the deployment authority', () => {
    const render = fs.readFileSync(renderPath, 'utf8');
    expect(render).toContain('autoDeployTrigger: off');
    expect(render).toContain('verified main -> supply-chain attestation');
    expect(render).not.toContain('autoDeployTrigger: checksPass');
    expect(render).not.toContain('autoDeployTrigger: commit');
  });

});
