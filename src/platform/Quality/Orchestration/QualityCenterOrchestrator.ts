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
import { Chapter12ValidatorRunner } from '../../Validators/Chapter12ValidatorRunner';
import { MandatoryValidatorCatalog } from '../../Validators/MandatoryValidatorCatalog';
import { CoverageCollector } from '../Coverage/CoverageCollector';
import { readQualityExecutionEvidence, type QualityExecutionEvidenceSnapshot } from '../Execution/QualityExecutionEvidence';
import { QualityGateRunner } from '../Gates/QualityGateRunner';
import { QualityScoreCalculator } from '../Scoring/QualityScoreCalculator';
import { TechnicalDebtRegister } from '../TechnicalDebt/TechnicalDebtRegister';
import { FintechValueChainQualityProjection } from '../ValueChain/FintechValueChainQualityProjection';

export const QUALITY_CENTER_ORCHESTRATOR_VERSION = 'quality-center-orchestrator/1.5.0' as const;

export interface QualityCenterRunRequest extends RepositoryQualityObservationRequest {
  scoreMeasurements?: readonly QualityScoreMeasurement[];
  coverageSnapshot?: QualityCoverageSnapshot;
  previousOverallScore?: number | null;
  executionEvidence?: QualityExecutionEvidenceSnapshot | null;
}

export interface QualityCenterOrchestratorDependencies {
  mandatoryValidatorCatalog?: MandatoryValidatorCatalog;
  chapter12ValidatorRunner?: Chapter12ValidatorRunner;
  gateRunner?: QualityGateRunner;
  scoreCalculator?: QualityScoreCalculator;
  technicalDebtRegister?: TechnicalDebtRegister;
  coverageCollector?: CoverageCollector;
  fintechValueChainProjection?: FintechValueChainQualityProjection;
  eventSink?: QualityEventSink;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return String(error);
}

export class QualityCenterOrchestrator {
  private readonly mandatoryValidatorCatalog: MandatoryValidatorCatalog;
  private readonly chapter12ValidatorRunner: Chapter12ValidatorRunner;
  private readonly gateRunner: QualityGateRunner;
  private readonly scoreCalculator: QualityScoreCalculator;
  private readonly technicalDebtRegister: TechnicalDebtRegister;
  private readonly coverageCollector: CoverageCollector;
  private readonly fintechValueChainProjection: FintechValueChainQualityProjection;
  private readonly eventSink?: QualityEventSink;

  constructor(
    private readonly coordinator: RepositoryQualityCoordinator,
    dependencies: QualityCenterOrchestratorDependencies = {},
  ) {
    this.eventSink = dependencies.eventSink;
    this.mandatoryValidatorCatalog = dependencies.mandatoryValidatorCatalog ?? new MandatoryValidatorCatalog();
    this.chapter12ValidatorRunner = dependencies.chapter12ValidatorRunner ?? new Chapter12ValidatorRunner();
    this.gateRunner = dependencies.gateRunner ?? new QualityGateRunner();
    this.scoreCalculator = dependencies.scoreCalculator ?? new QualityScoreCalculator();
    this.technicalDebtRegister = dependencies.technicalDebtRegister ?? new TechnicalDebtRegister([], this.eventSink);
    this.coverageCollector = dependencies.coverageCollector ?? new CoverageCollector();
    this.fintechValueChainProjection = dependencies.fintechValueChainProjection ?? new FintechValueChainQualityProjection();
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
      const repoRoot = request.repoRoot ?? process.cwd();
      const mandatoryValidators = this.mandatoryValidatorCatalog.snapshot();
      const chapter12Validation = this.chapter12ValidatorRunner.run({
        repoRoot,
        checkedAt: repositoryObservation.checkedAt,
        sourceCommit: repositoryObservation.sourceCommit,
        repositoryObservation,
      });
      const coverage = request.coverageSnapshot ?? this.coverageCollector.collect(
        repoRoot,
        repositoryObservation.checkedAt,
      );
      const executionEvidence = request.executionEvidence !== undefined
        ? request.executionEvidence
        : repositoryObservation.sourceCommit
          ? readQualityExecutionEvidence(repoRoot, repositoryObservation.sourceCommit)
          : null;
      const gateReport = this.gateRunner.run(repositoryObservation, {
        chapter12Validation,
        executionEvidence,
      });
      const qualityScore = this.scoreCalculator.calculate(request.scoreMeasurements ?? []);
      const fintechValueChain = this.fintechValueChainProjection.project(repoRoot, repositoryObservation.checkedAt);
      const technicalDebt = this.technicalDebtRegister.snapshot();

      const validationBlocking = repositoryObservation.blocking || chapter12Validation.blocking || gateReport.blocking;
      publish(validationBlocking ? 'ValidationFailedEvent' : 'ValidationCompletedEvent', {
        checkedAt: repositoryObservation.checkedAt,
        overallStatus: repositoryObservation.overallStatus,
        blocking: validationBlocking,
        findings: repositoryObservation.summary.findings,
        mandatoryValidatorsAvailable: mandatoryValidators.available,
        mandatoryValidatorsPartial: mandatoryValidators.partial,
        mandatoryValidatorsNotAvailable: mandatoryValidators.notAvailable,
        chapter12Status: chapter12Validation.overallStatus,
        chapter12Passed: chapter12Validation.passed,
        chapter12Failed: chapter12Validation.failed,
        chapter12NotAvailable: chapter12Validation.notAvailable,
        gateStatus: gateReport.overallStatus,
        executionEvidenceAvailable: Boolean(executionEvidence),
        fintechValueChainHomogeneous: fintechValueChain.homogeneous,
        fintechValueChainConnectedStages: fintechValueChain.connectedStages,
        fintechValueChainTotalStages: fintechValueChain.totalStages,
        qualityHotPathIsolated: fintechValueChain.hotPathIsolation.isolated,
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
        mandatoryValidators,
        chapter12Validation,
        gateReport,
        qualityScore,
        coverage,
        fintechValueChain,
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
          'SC-MD-SPT-0001',
          repositoryObservation.schemaVersion,
          chapter12Validation.schemaVersion,
          fintechValueChain.schemaVersion,
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
