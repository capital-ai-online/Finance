import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/ci.yml');

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

  it('keeps exactly two hosted runners in the CI workflow', () => {
    const yaml = workflow();
    expect((yaml.match(/runs-on: ubuntu-latest/g) ?? []).length).toBe(2);
    expect(yaml).toContain('  build-and-test:');
    expect(yaml).toContain('  deploy-production:');
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
    expect(deploy).toContain('ref=main');
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
});
