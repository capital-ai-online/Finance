import { describe, expect, it } from 'vitest';
import { ArchiveRetentionAgent } from '../../src/platform/Documentary/Agents/ArchiveRetentionAgent';

const now = new Date('2026-08-22T10:00:00Z');

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    path: 'docs/archive/generated/duplicate.md',
    archivedAt: '2026-05-01T00:00:00Z',
    registered: false,
    referenced: false,
    authorityArtifact: false,
    evidenceArtifact: false,
    securityOrComplianceArtifact: false,
    reproducible: true,
    canonicalDuplicatePath: 'docs/current/canonical.md',
    ...overrides,
  } as any;
}

describe('ArchiveRetentionAgent', () => {
  it('marks only old reproducible unreferenced generated/transient duplicates delete-eligible', () => {
    const agent = new ArchiveRetentionAgent();
    const result = agent.assess(candidate(), now);
    expect(result.disposition).toBe('delete-eligible');
    expect(result.reasons).toEqual([]);
  });

  it('retains registered, referenced, authority and evidence artifacts regardless of age', () => {
    const agent = new ArchiveRetentionAgent();
    for (const overrides of [
      { registered: true },
      { referenced: true },
      { authorityArtifact: true },
      { evidenceArtifact: true },
      { securityOrComplianceArtifact: true },
      { path: 'docs/archive/governance/superseded/adr.md' },
    ]) {
      expect(agent.assess(candidate(overrides), now).disposition).toBe('retain');
    }
  });

  it('requires retention expiry and reproducibility before eligibility', () => {
    const agent = new ArchiveRetentionAgent();
    expect(agent.assess(candidate({ archivedAt: '2026-08-01T00:00:00Z' }), now).disposition).toBe('owner-review');
    expect(agent.assess(candidate({ reproducible: false }), now).disposition).toBe('owner-review');
    expect(agent.assess(candidate({ canonicalDuplicatePath: null }), now).disposition).toBe('owner-review');
  });

  it('never performs deletion and requires owner approval, kill-switch clear and maintenance branch', () => {
    const agent = new ArchiveRetentionAgent();
    const assessment = agent.assess(candidate(), now);

    expect(agent.planDeletion({ assessments: [assessment], branchName: 'feature/x', ownerApproved: true, killSwitchActive: false }).authorized).toBe(false);
    expect(agent.planDeletion({ assessments: [assessment], branchName: 'agent/documentary-maintenance-x', ownerApproved: false, killSwitchActive: false }).authorized).toBe(false);
    expect(agent.planDeletion({ assessments: [assessment], branchName: 'agent/documentary-maintenance-x', ownerApproved: true, killSwitchActive: true }).authorized).toBe(false);

    const plan = agent.planDeletion({ assessments: [assessment], branchName: 'agent/documentary-maintenance-x', ownerApproved: true, killSwitchActive: false });
    expect(plan.authorized).toBe(true);
    expect(plan.paths).toEqual(['docs/archive/generated/duplicate.md']);
    expect(plan.mutationPerformed).toBe(false);
  });
});
