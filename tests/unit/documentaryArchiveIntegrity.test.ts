import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ARCHIVE_INTEGRITY_CONTRACT_VERSION,
  verifyArchiveIntegrityIndex,
} from '../../src/platform/Documentary/ArchiveIntegrity/ArchiveIntegrityVerifier';

describe('Documentary archive integrity', () => {
  it('verifies the complete current archive tree against the tamper-evident index', () => {
    const root = path.resolve(process.cwd());
    const index = JSON.parse(
      fs.readFileSync(path.join(root, 'docs/archive/ARCHIVE_INTEGRITY_INDEX.json'), 'utf8'),
    );
    const report = verifyArchiveIntegrityIndex(root, { verifyHistoricalSources: false });
    expect(report.contractVersion).toBe(ARCHIVE_INTEGRITY_CONTRACT_VERSION);
    expect(report.archiveEntryCount).toBe(index.entries.length);
    expect(report.archiveEntryCount).toBeGreaterThan(0);
    expect(report.manifestCount).toBe(index.manifests.length);
    expect(report.state).toBe('VERIFIED');
    expect(report.historicalSourceVerification).toBe('SKIPPED');
  });
});
