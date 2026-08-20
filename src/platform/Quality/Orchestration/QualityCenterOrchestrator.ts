import type { RepositoryQualityObservationRequest } from '../RepositoryQuality/RepositoryQualityCoordinator';
import { RepositoryQualityCoordinator } from '../RepositoryQuality/RepositoryQualityCoordinator';
import {
  QUALITY_CENTER_CONTRACT_VERSION,
  QUALITY_CENTER_NON_AUTHORIZING_STATEMENT,
  QUALITY_CENTER_REPORT_SCHEMA,
  type QualityCenterReport,
  type QualityScoreMeasurement,
} from '../Contracts/QualityCenterContract';
import { QualityGateRunner } from '../Gates/QualityGateRunner';
import { QualityScoreCalculator } from '../Scoring/QualityScoreCalculator';
import { TechnicalDebtRegister } from '../TechnicalDebt/TechnicalDebtRegister';

export const QUALITY_CENTER_ORCHESTRATOR_VERSION = 'quality-center-orchestrator/1.0.0' as const;

export interface QualityCenterRunRequest extends RepositoryQualityObservationRequest {
  scoreMeasurements?: readonly QualityScoreMeasurement[];
}

export class QualityCenterOrchestrator {
  constructor(
    private readonly coordinator: RepositoryQualityCoordinator,
    private readonly gateRunner = new QualityGateRunner(),
    private readonly scoreCalculator = new QualityScoreCalculator(),
    private readonly technicalDebtRegister = new TechnicalDebtRegister(),
  ) {}

  run(request: QualityCenterRunRequest = {}): QualityCenterReport {
    const repositoryObservation = this.coordinator.observe(request);
    const gateReport = this.gateRunner.run(repositoryObservation);
    const qualityScore = this.scoreCalculator.calculate(request.scoreMeasurements ?? []);
    const technicalDebt = this.technicalDebtRegister.snapshot();

    return Object.freeze({
      schemaVersion: QUALITY_CENTER_REPORT_SCHEMA,
      contractVersion: QUALITY_CENTER_CONTRACT_VERSION,
      checkedAt: repositoryObservation.checkedAt,
      repositoryObservation,
      gateReport,
      qualityScore,
      technicalDebt,
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
  }
}
