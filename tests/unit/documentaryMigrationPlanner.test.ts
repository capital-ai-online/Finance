import { describe, expect, it } from 'vitest';
import { DocumentaryMigrationPlanner } from '../../src/platform/Documentary/Migration/DocumentaryMigrationPlanner';

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    path: 'docs/generated/legacy-copy.md',
    registered: false,
    referenced: false,
    authorityArtifact: false,
    evidenceArtifact: false,
    securityOrComplianceArtifact: false,
    ownerProject: 'CAPITAL-AI-DOC',
    canonicalPath: 'docs/architecture/canonical.md',
    reproducible: true,
    ...overrides,
  } as any;
}

describe('DocumentaryMigrationPlanner', () => {
  it('creates read-only migration candidates for reproducible generated documents with a canonical target', () => {
    const planner = new DocumentaryMigrationPlanner();
    const result = planner.assess(candidate());

    expect(result.classification).toBe('generated');
    expect(result.disposition).toBe('migration-candidate');
    expect(result.targetPath).toBe('docs/architecture/canonical.md');
    expect(result.mutationPerformed).toBe(false);
  });

  it('routes legacy documents with a known canonical target to redirect planning', () => {
    const planner = new DocumentaryMigrationPlanner();
    const result = planner.assess(candidate({ path: 'docs/legacy/old.md' }));

    expect(result.classification).toBe('legacy');
    expect(result.disposition).toBe('redirect-candidate');
    expect(result.mutationPerformed).toBe(false);
  });

  it('retains protected evidence, authority, referenced and security/compliance documents', () => {
    const planner = new DocumentaryMigrationPlanner();

    for (const overrides of [
      { path: 'docs/evidence/run.md', evidenceArtifact: true },
      { path: 'docs/governance/authority.md', authorityArtifact: true },
      { path: 'docs/architecture/referenced.md', referenced: true },
      { path: 'docs/compliance/policy.md', securityOrComplianceArtifact: true },
      { path: 'docs/archive/history.md' },
    ]) {
      expect(planner.assess(candidate(overrides)).disposition).toBe('retain');
    }
  });

  it('blocks foreign-owner and unsafe paths fail-closed', () => {
    const planner = new DocumentaryMigrationPlanner();

    expect(planner.assess(candidate({ ownerProject: 'CAPITAL-AI-OPS' })).disposition).toBe('blocked');
    expect(planner.assess(candidate({ path: '../outside.md' })).disposition).toBe('blocked');
    expect(planner.assess(candidate({ path: 'src/runtime.ts' })).disposition).toBe('blocked');
    expect(planner.assess(candidate({ canonicalPath: '../outside.md' })).disposition).toBe('blocked');
  });

  it('keeps ambiguous or non-reproducible documents in owner review', () => {
    const planner = new DocumentaryMigrationPlanner();

    expect(planner.assess(candidate({ reproducible: false })).disposition).toBe('owner-review');
    expect(planner.assess(candidate({ canonicalPath: null })).disposition).toBe('owner-review');
    expect(planner.assess(candidate({ path: 'docs/misc/unknown.md', canonicalPath: null })).disposition).toBe('owner-review');
  });

  it('produces a deterministic plan without performing mutations', () => {
    const planner = new DocumentaryMigrationPlanner();
    const plan = planner.plan([
      candidate({ path: 'docs/generated/b.md', canonicalPath: 'docs/current/b.md' }),
      candidate({ path: 'docs/legacy/a.md', canonicalPath: 'docs/current/a.md' }),
      candidate({ path: 'docs/legacy/foreign.md', ownerProject: 'CAPITAL-AI-DATA' }),
    ]);

    expect(plan.assessments.map((assessment) => assessment.path)).toEqual([
      'docs/generated/b.md',
      'docs/legacy/a.md',
      'docs/legacy/foreign.md',
    ]);
    expect(plan.migrationCandidates).toEqual(['docs/generated/b.md']);
    expect(plan.redirectCandidates).toEqual(['docs/legacy/a.md']);
    expect(plan.blocked).toEqual(['docs/legacy/foreign.md']);
    expect(plan.mutationPerformed).toBe(false);
  });
});
