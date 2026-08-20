import { RepositoryQualityCoordinator } from '../../src/platform/Quality/RepositoryQuality/RepositoryQualityCoordinator';
import { QualityCenterOrchestrator } from '../../src/platform/Quality/Orchestration/QualityCenterOrchestrator';
import { CoverageCollector } from '../../src/platform/Quality/Coverage/CoverageCollector';
import type { QualityCenterReport } from '../../src/platform/Quality/Contracts/QualityCenterContract';
import { ValidatorRegistry } from '../../src/platform/Validators/ValidatorRegistry';
import { createDefaultRepositoryQualityAdapters } from './repositoryQualityAdapters';
import { collectDefaultQualityScoreMeasurements } from './repositoryQualityScoreProviders';
import { EventMeshQualityEventSink } from './qualityEventMeshSink';
import { resolveSourceCommit } from './sourceIdentity';

function normalizeSourceCommit(candidate: string | null): string | null {
  const value = candidate?.trim() ?? '';
  return /^[0-9a-f]{40}$/i.test(value) ? value : null;
}

export function createRepositoryQualityReport(
  repoRoot = process.cwd(),
  checkedAt = new Date().toISOString(),
): QualityCenterReport {
  const coverageCollector = new CoverageCollector();
  const coverageSnapshot = coverageCollector.collect(repoRoot, checkedAt);
  const scoreMeasurements = collectDefaultQualityScoreMeasurements(coverageSnapshot);
  const registry = new ValidatorRegistry(createDefaultRepositoryQualityAdapters());
  const coordinator = new RepositoryQualityCoordinator(registry);
  const qualityCenter = new QualityCenterOrchestrator(coordinator, {
    coverageCollector,
    eventSink: new EventMeshQualityEventSink(),
  });

  return qualityCenter.run({
    repoRoot,
    checkedAt,
    sourceCommit: normalizeSourceCommit(resolveSourceCommit(repoRoot)),
    coverageSnapshot,
    scoreMeasurements,
  });
}
