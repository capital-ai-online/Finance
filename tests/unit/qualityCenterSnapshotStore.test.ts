import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  persistQualityCenterReport,
  readQualityCenterReport,
} from '../../src/platform/Quality/Operations/QualityCenterSnapshotStore';
import type { QualityCenterReport } from '../../src/platform/Quality/Contracts/QualityCenterContract';

const roots: string[] = [];

function tempRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quality-center-snapshot-'));
  roots.push(root);
  return root;
}

function report(sourceCommit = 'a'.repeat(40)): QualityCenterReport {
  return {
    schemaVersion: 'quality-center-report/1.3.0',
    contractVersion: 'quality-center-contract/1.3.0',
    checkedAt: '2026-08-20T16:00:00.000Z',
    repositoryObservation: { sourceCommit },
  } as unknown as QualityCenterReport;
}

afterEach(() => {
  while (roots.length > 0) fs.rmSync(roots.pop()!, { recursive: true, force: true });
});

describe('QualityCenterSnapshotStore', () => {
  it('persists the existing QualityCenterReport to working and runtime snapshot paths', () => {
    const root = tempRoot();
    const paths = persistQualityCenterReport(root, report());

    expect(paths).toEqual([
      '.quality/quality-center-report.json',
      'dist/quality/quality-center-report.json',
    ]);
    const loaded = readQualityCenterReport(root);
    expect(loaded?.report.schemaVersion).toBe('quality-center-report/1.3.0');
    expect(loaded?.report.repositoryObservation.sourceCommit).toBe('a'.repeat(40));
    expect(loaded?.sourcePath).toBe('dist/quality/quality-center-report.json');
  });

  it('fails closed for commit-unbound snapshots', () => {
    const root = tempRoot();
    expect(() => persistQualityCenterReport(root, report('not-a-commit'))).toThrow(/commit-unbound/);
  });

  it('ignores malformed runtime snapshot and falls back to valid working evidence', () => {
    const root = tempRoot();
    persistQualityCenterReport(root, report());
    fs.writeFileSync(path.join(root, 'dist/quality/quality-center-report.json'), '{invalid', 'utf8');

    const loaded = readQualityCenterReport(root);
    expect(loaded?.sourcePath).toBe('.quality/quality-center-report.json');
  });
});
