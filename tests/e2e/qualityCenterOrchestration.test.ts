import { describe, expect, it } from 'vitest';
import type { RepositoryQualityAdapter } from '../../src/platform/Governance/Contracts/RepositoryQualityEvidence';
import type {
  QualityCenterEventName,
  QualityCoverageSnapshot,
  QualityEventSink,
} from '../../src/platform/Quality/Contracts/QualityCenterContract';
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
      source: `e2e:${domain}`,
      authorityRefs: ['ESS-0005'],
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

describe('Quality Center E2E orchestration', () => {
  it('links registry, coordinator, gates, scoring, coverage and event publication', () => {
    const events: QualityCenterEventName[] = [];
    const eventSink: QualityEventSink = {
      publish: (eventName) => { events.push(eventName); },
    };
    const registry = new ValidatorRegistry([
      pass('platform-version'),
      pass('documentation-hygiene'),
      pass('documentation-consistency'),
      pass('repository-conventions'),
      pass('vocabulary'),
      pass('compliance'),
    ]);
    const report = new QualityCenterOrchestrator(
      new RepositoryQualityCoordinator(registry),
      { eventSink },
    ).run({
      checkedAt: '2026-08-20T00:00:00.000Z',
      sourceCommit: 'a'.repeat(40),
      coverageSnapshot: coverage,
      scoreMeasurements: [
        { axis: 'test', value: 100, source: 'e2e', authorityRefs: ['ESS-0005'] },
        { axis: 'security', value: 95, source: 'e2e', authorityRefs: ['ESS-0006'] },
      ],
    });

    expect(report.repositoryObservation.overallStatus).toBe('PASS');
    expect(report.qualityScore.status).toBe('PARTIAL');
    expect(report.coverage.testAreaCoveragePercent).toBe(100);
    expect(report.eventPublication.failed).toBe(0);
    expect(events).toContain('ValidationStartedEvent');
    expect(events).toContain('ValidationCompletedEvent');
    expect(events).toContain('CoverageCalculatedEvent');
    expect(report.nonAuthorizingStatement).toContain('cannot authorize merge');
  });
});
