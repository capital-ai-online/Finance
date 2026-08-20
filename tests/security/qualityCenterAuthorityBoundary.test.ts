import { describe, expect, it } from 'vitest';
import type { RepositoryQualityAdapter } from '../../src/platform/Governance/Contracts/RepositoryQualityEvidence';
import type { QualityCoverageSnapshot, QualityEventSink } from '../../src/platform/Quality/Contracts/QualityCenterContract';
import { QualityCenterOrchestrator } from '../../src/platform/Quality/Orchestration/QualityCenterOrchestrator';
import { RepositoryQualityCoordinator } from '../../src/platform/Quality/RepositoryQuality/RepositoryQualityCoordinator';
import { ValidatorRegistry } from '../../src/platform/Validators/ValidatorRegistry';

function pass(domain: RepositoryQualityAdapter['domain']): RepositoryQualityAdapter {
  return {
    domain,
    run: ({ checkedAt }) => ({
      domain,
      status: 'PASS',
      blocking: false,
      checkedAt,
      source: 'security-test',
      authorityRefs: [],
      findings: [],
    }),
  };
}

const coverage: QualityCoverageSnapshot = {
  schemaVersion: 'quality-coverage/1.0.0',
  checkedAt: '2026-08-20T00:00:00.000Z',
  populatedAreas: 7,
  totalAreas: 7,
  testAreaCoveragePercent: 100,
  testAreas: [],
  codeCoverage: { status: 'NOT_AVAILABLE', source: null, metrics: null },
  authorityRefs: ['ESS-0005'],
};

describe('Quality Center authority boundary', () => {
  it('does not turn EventMesh delivery failures into authorization or mutation capability', () => {
    const registry = new ValidatorRegistry([
      pass('platform-version'),
      pass('documentation-hygiene'),
      pass('documentation-consistency'),
      pass('repository-conventions'),
      pass('vocabulary'),
      pass('compliance'),
    ]);
    const eventSink: QualityEventSink = {
      publish: () => { throw new Error('event transport unavailable'); },
    };
    const report = new QualityCenterOrchestrator(
      new RepositoryQualityCoordinator(registry),
      { eventSink },
    ).run({
      checkedAt: '2026-08-20T00:00:00.000Z',
      coverageSnapshot: coverage,
    });

    expect(report.eventPublication.failed).toBeGreaterThan(0);
    expect(report.nonAuthorizingStatement).toContain('cannot authorize merge');
    expect(report.nonAuthorizingStatement).toContain('production mutation');
    expect(report.repositoryObservation.overallStatus).toBe('PASS');
  });
});
