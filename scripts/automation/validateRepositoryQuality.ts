import { RepositoryQualityCoordinator } from '../../src/platform/Quality/RepositoryQuality/RepositoryQualityCoordinator';
import { createDefaultRepositoryQualityAdapters } from './repositoryQualityAdapters';

function resolveSourceCommit(): string | null {
  const candidate = process.env.GIT_COMMIT || process.env.SOURCE_VERSION || process.env.RENDER_GIT_COMMIT || '';
  return /^[0-9a-f]{40}$/i.test(candidate) ? candidate : null;
}

const coordinator = new RepositoryQualityCoordinator(createDefaultRepositoryQualityAdapters());
const observation = coordinator.observe({
  repoRoot: process.cwd(),
  sourceCommit: resolveSourceCommit(),
});

process.stdout.write(`${JSON.stringify(observation, null, 2)}\n`);
if (observation.blocking) process.exitCode = 1;
