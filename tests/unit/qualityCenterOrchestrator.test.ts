import { describe, expect, it } from 'vitest';
import type { RepositoryQualityAdapter } from '../../src/platform/Governance/Contracts/RepositoryQualityEvidence';
import { QualityCenterOrchestrator } from '../../src/platform/Quality/Orchestration/QualityCenterOrchestrator';
import { RepositoryQualityCoordinator } from '../../src/platform/Quality/RepositoryQuality/RepositoryQualityCoordinator';
import { ValidatorRegistry } from '../../src/platform/Validators/ValidatorRegistry';

function pass(domain: RepositoryQualityAdapter['domain']): RepositoryQualityAdapter {
  return {
    domain,
    run: ({ checkedAt }) => ({ domain, status: 'PASS', blocking: false, checkedAt, source: 'test', authorityRefs: [], findings: [] }),
  };
}

describe('QualityCenterOrchestrator', () => {
  it('returns a single non-authorizing governance/compliance/value-chain-linked report', () => {
    const registry = new ValidatorRegistry([
      pass('platform-version'), pass('documentation-hygiene'), pass('documentation-consistency'),
      pass('repository-conventions'), pass('vocabulary'), pass('compliance'),
    ]);
    const coordinator = new RepositoryQualityCoordinator(registry);
    const report = new QualityCenterOrchestrator(coordinator).run({ checkedAt: '2026-08-20T00:00:00.000Z' });

    expect(report.contractVersion).toBe('quality-center-contract/1.3.0');
    expect(report.governanceRefs).toContain('ADR-0096');
    expect(report.governanceRefs).toContain('SC-MD-SPT-0001');
    expect(report.complianceRefs).toContain('ESS-0006');
    expect(report.nonAuthorizingStatement).toContain('cannot authorize merge');
    expect(report.mandatoryValidators).toMatchObject({ total: 16, available: 16, partial: 0, notAvailable: 0, complete: true });
    expect(report.chapter12Validation).toMatchObject({ total: 16, executed: 16 });
    expect(report.qualityScore.status).toBe('NOT_AVAILABLE');
    expect(report.coverage.schemaVersion).toBe('quality-coverage/1.0.0');
    expect(report.fintechValueChain).toMatchObject({
      schemaVersion: 'fintech-value-chain-quality/1.0.0',
      authority: 'SC-MD-SPT-0001',
      totalStages: 14,
      connectedStages: 14,
      homogeneous: true,
    });
    expect(report.fintechValueChain.hotPathIsolation).toMatchObject({ isolated: true, directQualityImports: [] });
  });
});
