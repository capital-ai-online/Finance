import { createRepositoryQualityReport } from './repositoryQualityReport';
import { persistQualityCenterReport } from '../../src/platform/Quality/Operations/QualityCenterSnapshotStore';

try {
  const repoRoot = process.cwd();
  const report = createRepositoryQualityReport(repoRoot);
  const paths = persistQualityCenterReport(repoRoot, report);
  process.stdout.write(`[QualityCenterSnapshot] ${report.repositoryObservation.sourceCommit} -> ${paths.join(', ')}\n`);
} catch (error) {
  console.error(`[QualityCenterSnapshot] FAIL-CLOSED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
