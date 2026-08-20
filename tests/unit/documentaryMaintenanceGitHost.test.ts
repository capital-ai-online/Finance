import { describe, expect, it } from 'vitest';
import { buildMaintenanceBranchName, buildRuntimeWorkClaim } from '../../scripts/automation/runDocumentaryMaintenanceControlLoop';

describe('Documentary maintenance Git host helpers', () => {
  it('creates an isolated agent branch name', () => {
    expect(buildMaintenanceBranchName('DOC Freshness / 2026-08-20')).toBe('agent/documentary-maintenance-doc-freshness-2026-08-20');
  });

  it('creates a PR-validator-compatible bounded work claim', () => {
    const claim = buildRuntimeWorkClaim({ correlationId: 'corr-123', baseSha: 'f'.repeat(40), changedPaths: ['docs/architecture/FOO.md'], startedAt: '2026-08-20T00:00:00.000Z' });
    expect(claim.schemaVersion).toBe('1.0.0');
    expect(claim.baseBranch).toBe('main');
    expect(claim.claimedPaths).toEqual(['docs/architecture/FOO.md', 'docs/governance/document-registry.json']);
    expect(claim.claimedPaths).not.toContain('**');
  });
});
