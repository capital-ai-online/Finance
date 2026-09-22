import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const securityPolicy = readFileSync('.github/SECURITY.md', 'utf8');
const sandboxThreatModel = readFileSync(
  'docs/security/ARCHIVE_RETENTION_SANDBOX_THREAT_MODEL_2026-08-22.md',
  'utf8',
);

describe('Security trust-root convergence', () => {
  it('keeps active SEC surfaces on AGENTS.md@CURRENT_MAIN as the sole execution authority', () => {
    for (const content of [securityPolicy, sandboxThreatModel]) {
      expect(content).toContain('/AGENTS.md@CURRENT_MAIN');
      expect(content).not.toContain('docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md');
      expect(content).not.toContain('`DEVELOPMENT_CHAIN_EXECUTION_POLICY`');
    }
  });

  it('preserves subject-matter Security constraints without recreating a second development control plane', () => {
    expect(securityPolicy).toContain('subject-matter constraints');
    expect(securityPolicy).toContain('historical DevelopmentChain authority IDs are traceability aliases');
    expect(sandboxThreatModel).toContain('Subject-matter constraints');
    expect(sandboxThreatModel).toContain('AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION');
    expect(sandboxThreatModel).toContain('no standalone DevelopmentChain execution policy is active');
  });

  it('keeps PR creation correlation-gated and final merge Human/CODEOWNER-bound', () => {
    expect(securityPolicy).toContain('correlation-gated PR creation');
    expect(securityPolicy).toContain('Human/CODEOWNER merge');
    expect(sandboxThreatModel).toContain('HostedCIPass         != HumanMergeAuthorization');
  });
});
