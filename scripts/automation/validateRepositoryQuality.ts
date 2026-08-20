import { RepositoryQualityCoordinator } from '../../src/platform/Quality/RepositoryQuality/RepositoryQualityCoordinator';
import { QualityCenterOrchestrator } from '../../src/platform/Quality/Orchestration/QualityCenterOrchestrator';
import { ValidatorRegistry } from '../../src/platform/Validators/ValidatorRegistry';
import { createDefaultRepositoryQualityAdapters } from './repositoryQualityAdapters';

function resolveSourceCommit(): string | null {
  const candidate = process.env.GIT_COMMIT || process.env.SOURCE_VERSION || process.env.RENDER_GIT_COMMIT || '';
  return /^[0-9a-f]{40}$/i.test(candidate) ? candidate : null;
}

const registry = new ValidatorRegistry(createDefaultRepositoryQualityAdapters());
const coordinator = new RepositoryQualityCoordinator(registry);
const qualityCenter = new QualityCenterOrchestrator(coordinator);
const report = qualityCenter.run({
  repoRoot: process.cwd(),
  sourceCommit: resolveSourceCommit(),
});

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.repositoryObservation.blocking || report.gateReport.blocking) process.exitCode = 1;
