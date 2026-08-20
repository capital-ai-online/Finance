import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  QUALITY_EXECUTION_EVIDENCE_PATH,
  readQualityExecutionEvidence,
  writeQualityExecutionEvidence,
} from '../../src/platform/Quality/Execution/QualityExecutionEvidence';

const SOURCE_COMMIT = 'b'.repeat(40);
const OTHER_COMMIT = 'c'.repeat(40);

describe('QualityExecutionEvidence', () => {
  it('round-trips evidence only for the exact source commit', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quality-execution-'));
    writeQualityExecutionEvidence(root, SOURCE_COMMIT, [{
      phase: 'test',
      status: 'PASS',
      checkedAt: '2026-08-20T00:00:00.000Z',
      sourceCommit: SOURCE_COMMIT,
      command: 'npm run test:raw',
      exitCode: 0,
      evidenceRefs: ['package.json#scripts.test:raw'],
    }]);

    expect(readQualityExecutionEvidence(root, SOURCE_COMMIT)?.records).toHaveLength(1);
    expect(readQualityExecutionEvidence(root, OTHER_COMMIT)).toBeNull();
  });

  it('rejects malformed or cross-commit evidence instead of upgrading it to PASS', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quality-execution-invalid-'));
    const target = path.join(root, QUALITY_EXECUTION_EVIDENCE_PATH);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, JSON.stringify({
      schemaVersion: 'quality-execution-evidence/1.0.0',
      sourceCommit: SOURCE_COMMIT,
      records: [{
        phase: 'build',
        status: 'PASS',
        checkedAt: '2026-08-20T00:00:00.000Z',
        sourceCommit: OTHER_COMMIT,
        command: 'npm run build:raw',
        exitCode: 0,
        evidenceRefs: ['package.json#scripts.build:raw'],
      }],
    }));

    expect(readQualityExecutionEvidence(root, SOURCE_COMMIT)).toBeNull();
  });
});
