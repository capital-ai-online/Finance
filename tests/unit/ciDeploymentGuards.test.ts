import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// M7 (ADR-0061, docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md, "Required Negative Tests":
// "deploy request from non-main or unverified source -> DENY"). Proves the guard is real at the
// actual CI-config level, not just documented intent: a PR (or any push to a non-main branch)
// must never reach deploy-production, supply-chain-attestation or verify-deployment-identity.

const workflowPath = path.join(process.cwd(), '.github/workflows/ci.yml');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

// Extracts the raw text of a single top-level job block (from its `  <name>:` header up to the
// next line at the same two-space top-level-job indentation), mirroring the extraction style
// already used by tests/unit/systemadminExecutionHostWorkflow.test.ts for workflow assertions.
function jobBlock(yaml: string, jobName: string): string {
  const startPattern = new RegExp(`^  ${jobName}:$`, 'm');
  const startMatch = startPattern.exec(yaml);
  if (!startMatch) throw new Error(`Job ${jobName} not found in ci.yml`);
  const start = startMatch.index + startMatch[0].length;
  const rest = yaml.slice(start);
  const nextJobMatch = /\n  [a-zA-Z][a-zA-Z0-9_-]*:\n/.exec(rest);
  return nextJobMatch ? rest.slice(0, nextJobMatch.index) : rest;
}

describe('CI deployment jobs only run on push to main', () => {
  const pushMainGuard = "github.event_name == 'push' && github.ref == 'refs/heads/main'";

  it.each(['deploy-production', 'supply-chain-attestation', 'verify-deployment-identity'])(
    '%s carries the push+main fail-closed guard and never mentions pull_request',
    (jobName) => {
      const block = jobBlock(workflow(), jobName);
      const ifLine = /^\s*if:.*$/m.exec(block);
      expect(ifLine, `${jobName} must declare an if: guard`).not.toBeNull();
      expect(ifLine![0]).toContain(pushMainGuard);
      expect(block).not.toContain('pull_request');
      expect(block).not.toContain('workflow_dispatch');
    },
  );

  it('chains deploy-production -> verify-deployment-identity and gates deploy-production on supply-chain-attestation', () => {
    const yaml = workflow();
    expect(jobBlock(yaml, 'deploy-production')).toContain('needs: [build-and-test, supply-chain-attestation]');
    expect(jobBlock(yaml, 'verify-deployment-identity')).toContain('needs: [deploy-production]');
  });

  it('never grants deploy-production or supply-chain-attestation broader-than-needed permissions', () => {
    const yaml = workflow();
    // deploy-production only ever fires a pre-scoped Render deploy hook, it needs no repo write.
    expect(jobBlock(yaml, 'deploy-production')).not.toContain('permissions:');
    // supply-chain-attestation needs id-token for cosign OIDC, but never contents: write.
    const attestation = jobBlock(yaml, 'supply-chain-attestation');
    expect(attestation).toContain('id-token: write');
    expect(attestation).not.toContain('contents: write');
  });
});
