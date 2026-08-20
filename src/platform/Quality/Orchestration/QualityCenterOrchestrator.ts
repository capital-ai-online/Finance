import type { RepositoryQualityObservationRequest } from '../RepositoryQuality/RepositoryQualityCoordinator';
import { RepositoryQualityCoordinator } from '../RepositoryQuality/RepositoryQualityCoordinator';
import {
  QUALITY_CENTER_CONTRACT_VERSION,
  QUALITY_CENTER_NON_AUTHORIZING_STATEMENT,
  QUALITY_CENTER_REPORT_SCHEMA,
  type QualityCenterEventName,
  type QualityCenterReport,
  type QualityCoverageSnapshot,
  type QualityEventPublicationFailure,
  type QualityEventSink,
  type QualityScoreMeasurement,
} from '../Contracts/QualityCenterContract';
import { CoverageCollector } from '../Coverage/CoverageCollector';
import { QualityGateRunner } from '../Gates/QualityGateRunner';
import { QualityScoreCalculator } from '../Scoring/QualityScoreCalculator';
import { TechnicalDebtRegister } from '../TechnicalDebt/TechnicalDebtRegister';

export const QUALITY_CENTER_ORCHESTRATOR_VERSION = 'quality-center-orchestrator/1.1.0' as const;

export interface QualityCenterRunRequest extends RepositoryQualityObservationRequest {
  scoreMeasurements?: readonly QualityScoreMeasurement[];
  coverageSnapshot?: QualityCoverageSnapshot;
  previousOverallScore?: number | null;
}

export interface QualityCenterOrchestratorDependencies {
  gateRunner?: QualityGateRunner;
  scoreCalculator?: QualityScoreCalculator;
  technicalDebtRegister?: TechnicalDebtRegister;
  coverageCollector?: CoverageCollector;
  eventSink?: QualityEventSink;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return String(error);
}

export class QualityCenterOrchestrator {
  private readonly gateRunner: QualityGateRunner;
  private readonly scoreCalculator: QualityScoreCalculator;
  private readonly technicalDebtRegister: TechnicalDebtRegister;
  private readonly coverageCollector: CoverageCollector;
  private readonly eventSink?: QualityEventSink;

  constructor(
    private readonly coordinator: RepositoryQualityCoordinator,
    dependencies: QualityCenterOrchestratorDependencies = {},
  ) {
    this.gateRunner = dependencies.gateRunner ?? new QualityGateRunner();
    this.scoreCalculator = dependencies.scoreCalculator ?? new QualityScoreCalculator();
    this.technicalDebtRegister = dependencies.technicalDebtRegister ?? new TechnicalDebtRegister();
    this.coverageCollector = dependencies.coverageCollector ?? new CoverageCollector();
    this.eventSink = dependencies.eventSink;
  }

  run(request: QualityCenterRunRequest = {}): QualityCenterReport {
    const failures: QualityEventPublicationFailure[] = [];
    let attempted = 0;
    let published = 0;

    const publish = (eventName: QualityCenterEventName, payload: Readonly<Record<string, unknown>>) => {
      if (!this.eventSink) return;
      attempted += 1;
      try {
        this.eventSink.publish(eventName, payload);
        published += 1;
      } catch (error) {
        failures.push(Object.freeze({ eventName, message: errorMessage(error) }));
      }
    };

    publish('ValidationStartedEvent', {
      requestedAt: request.checkedAt ?? null,
      sourceCommit: request.sourceCommit ?? null,
    });

    try {
      const repositoryObservation = this.coordinator.observe(request);
      const coverage = request.coverageSnapshot ?? this.coverageCollector.collect(
        request.repoRoot ?? process.cwd(),
        repositoryObservation.checkedAt,
      );
      const gateReport = this.gateRunner.run(repositoryObservation);
      const qualityScore = this.scoreCalculator.calculate(request.scoreMeasurements ?? []);
      const technicalDebt = this.technicalDebtRegister.snapshot();

      publish(repositoryObservation.blocking ? 'ValidationFailedEvent' : 'ValidationCompletedEvent', {
        checkedAt: repositoryObservation.checkedAt,
        overallStatus: repositoryObservation.overallStatus,
        blocking: repositoryObservation.blocking,
        findings: repositoryObservation.summary.findings,
      });

      for (const gate of gateReport.gates) {
        if (gate.status === 'PASS') {
          publish('QualityGatePassedEvent', {
            gateId: gate.id,
            name: gate.name,
            checkedAt: repositoryObservation.checkedAt,
          });
        } else if (gate.status === 'FAIL') {
          publish('QualityGateFailedEvent', {
            gateId: gate.id,
            name: gate.name,
            checkedAt: repositoryObservation.checkedAt,
            findingRuleIds: gate.findingRuleIds,
          });
        }
      }

      if (
        qualityScore.status === 'COMPLETE' &&
        qualityScore.overallScore !== null &&
        request.previousOverallScore !== undefined &&
        request.previousOverallScore !== qualityScore.overallScore
      ) {
        publish('QualityScoreChangedEvent', {
          checkedAt: repositoryObservation.checkedAt,
          previousScore: request.previousOverallScore,
          currentScore: qualityScore.overallScore,
        });
      }

      publish('CoverageCalculatedEvent', {
        checkedAt: coverage.checkedAt,
        populatedAreas: coverage.populatedAreas,
        totalAreas: coverage.totalAreas,
        testAreaCoveragePercent: coverage.testAreaCoveragePercent,
        codeCoverageStatus: coverage.codeCoverage.status,
      });

      return Object.freeze({
        schemaVersion: QUALITY_CENTER_REPORT_SCHEMA,
        contractVersion: QUALITY_CENTER_CONTRACT_VERSION,
        checkedAt: repositoryObservation.checkedAt,
        repositoryObservation,
        gateReport,
        qualityScore,
        coverage,
        technicalDebt,
        eventPublication: Object.freeze({
          attempted,
          published,
          failed: failures.length,
          failures: Object.freeze([...failures]),
        }),
        governanceRefs: Object.freeze([
          'ESS-0001-CONTRACTS Chapter 12',
          'ESS-0005',
          'ADR-0096',
          repositoryObservation.schemaVersion,
        ]),
        complianceRefs: Object.freeze([
          'ESS-0001-CONTRACTS Chapter 11',
          'ESS-0006',
          'ADR-0012',
        ]),
        nonAuthorizingStatement: QUALITY_CENTER_NON_AUTHORIZING_STATEMENT,
      });
    } catch (error) {
      publish('ValidationFailedEvent', {
        error: errorMessage(error),
        sourceCommit: request.sourceCommit ?? null,
      });
      throw error;
    }
  }
}
