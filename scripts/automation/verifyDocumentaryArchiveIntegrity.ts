import { verifyArchiveIntegrityIndex } from '../../src/platform/Documentary/ArchiveIntegrity/ArchiveIntegrityVerifier';

try {
  const report = verifyArchiveIntegrityIndex(process.cwd(), { verifyHistoricalSources: true });
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error('[archive-integrity] FAIL-CLOSED:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
