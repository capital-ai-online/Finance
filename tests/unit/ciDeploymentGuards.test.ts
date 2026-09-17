import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// M7 (ADR-0061, docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md) protects the
// production trust chain, not a historical number of GitHub Actions jobs. P2B
// consolidates supply-chain attestation into build-and-test and post-deploy
// identity verification into deploy-production while preserving the same
// fail-closed main-only and exact-SHA boundaries.

const workflowPath = path.join(process.cwd(), '.github/workflows/ci.yml');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

function jobBlock(yaml: string, jobName: string): string {
  const startPattern = new RegExp(`^  ${jobName}:$`, 'm');
  const startMatch = startPattern.exec(yaml);
  if (!startMatch) throw new Error(`Job ${jobName} not found in ci.yml`);
  const start = startMatch.index + startMatch[0].length;
  const rest = yaml.slice(start);
  const nextJobMatch = /\n  [a-zA-Z][a-zA-Z0-9_-]*:\n/.exec(rest);
  return nextJobMatch ? rest.slice(0, nextJobMatch.index) : rest;
}

function stepBlock(job: string, stepName: string): string {
  const marker = `      - name: ${stepName}`;
  const start = job.indexOf(marker);
  if (start < 0) throw new Error(`Step ${stepName} not found`);
  const rest = job.slice(start + marker.length);
  const next = rest.indexOf('\n      - name: ');
  return next >= 0 ? rest.slice(0, next) : rest;
}

describe('CI deployment trust chain only runs on verified main', () => {
  const pushMainGuard = "github.event_name == 'push' && github.ref == 'refs/heads/main'";

  it('keeps deploy-production fail-closed to successful push:main only', () => {
    const deploy = jobBlock(workflow(), 'deploy-production');
    const ifLine = /^\s*if:.*$/m.exec(deploy);
    expect(ifLine, 'deploy-production must declare an if: guard').not.toBeNull();
    expect(ifLine![0]).toContain("needs.build-and-test.result == 'success'");
    expect(ifLine![0]).toContain(pushMainGuard);
    expect(deploy).not.toContain('pull_request');
    expect(deploy).not.toContain('workflow_dispatch');
  });

  it('keeps every consolidated supply-chain step main-push-only', () => {
    const build = jobBlock(workflow(), 'build-and-test');
    for (const stepName of [
      'P2B Provenance-Bindung an gehosteten main-Build erzwingen',
      'P2B cosign für main-Provenance installieren',
      'P2B Provenance keyless signieren (Sigstore/Fulcio/Rekor)',
      'P2B Signatur gegen erwartete Workflow-Identität verifizieren',
      'P2B Post-Deploy-Verifier aus exaktem main-Build bundeln',
      'P2B Supply-Chain-Artefakte aus demselben main-Build ablegen',
    ]) {
      expect(stepBlock(build, stepName)).toContain(`if: ${pushMainGuard}`);
    }
  });

  it('chains the production environment directly to the fully verified build-and-test job', () => {
    const deploy = jobBlock(workflow(), 'deploy-production');
    expect(deploy).toContain('needs: [build-and-test]');
    expect(deploy).toContain("needs.build-and-test.result == 'success'");
    expect(deploy).toContain('environment: production');
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

  it('binds quality evidence and the Docker image build to the exact checked-out source commit', () => {
    const yaml = workflow();
    const buildAndTest = jobBlock(yaml, 'build-and-test');

    expect(yaml).toContain("RELEASE_SOURCE_COMMIT: ${{ github.event_name == 'push' && github.sha || github.event.pull_request.head.sha || inputs.expected_head_sha }}");
    expect(yaml).not.toContain('inputs.m10_head_sha');
    expect(buildAndTest).toContain('test "$RELEASE_SOURCE_COMMIT" = "$(git rev-parse HEAD)"');
    expect(buildAndTest).toContain('--build-arg RELEASE_SOURCE_COMMIT="$RELEASE_SOURCE_COMMIT"');
    expect(buildAndTest).toContain('--tag "capital-ai-ci:$RELEASE_SOURCE_COMMIT"');
    expect(buildAndTest).not.toContain('capital-ai-ci:${{ github.sha }}');
  });
});
