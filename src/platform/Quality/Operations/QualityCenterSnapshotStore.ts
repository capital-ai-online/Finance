import fs from 'node:fs';
import path from 'node:path';
import {
  QUALITY_CENTER_CONTRACT_VERSION,
  QUALITY_CENTER_REPORT_SCHEMA,
  type QualityCenterReport,
} from '../Contracts/QualityCenterContract';

export const QUALITY_CENTER_SNAPSHOT_RELATIVE_PATH = 'dist/quality/quality-center-report.json' as const;
export const QUALITY_CENTER_WORKING_SNAPSHOT_RELATIVE_PATH = '.quality/quality-center-report.json' as const;

function isFullGitSha(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{40}$/i.test(value);
}

function isValidReport(value: unknown): value is QualityCenterReport {
  if (!value || typeof value !== 'object') return false;
  const report = value as Partial<QualityCenterReport>;
  if (report.schemaVersion !== QUALITY_CENTER_REPORT_SCHEMA) return false;
  if (report.contractVersion !== QUALITY_CENTER_CONTRACT_VERSION) return false;
  if (typeof report.checkedAt !== 'string' || Number.isNaN(Date.parse(report.checkedAt))) return false;
  if (!isFullGitSha(report.repositoryObservation?.sourceCommit)) return false;
  return true;
}

function atomicWriteJson(filePath: string, report: QualityCenterReport): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporaryPath, filePath);
  fs.chmodSync(filePath, 0o644);
}

export function persistQualityCenterReport(
  repoRoot: string,
  report: QualityCenterReport,
): readonly string[] {
  if (!isValidReport(report)) {
    throw new Error('[QualityCenterSnapshotStore] refusing to persist invalid or commit-unbound QualityCenterReport.');
  }

  const destinations = [
    path.join(repoRoot, QUALITY_CENTER_WORKING_SNAPSHOT_RELATIVE_PATH),
    path.join(repoRoot, QUALITY_CENTER_SNAPSHOT_RELATIVE_PATH),
  ];
  for (const destination of destinations) atomicWriteJson(destination, report);
  return Object.freeze(destinations.map((destination) => path.relative(repoRoot, destination).replace(/\\/g, '/')));
}

export interface QualityCenterSnapshotReadResult {
  report: QualityCenterReport;
  sourcePath: string;
}

export function readQualityCenterReport(
  repoRoot: string,
  expectedSourceCommit?: string | null,
): QualityCenterSnapshotReadResult | null {
  if (expectedSourceCommit != null && !isFullGitSha(expectedSourceCommit)) return null;

  const candidates = [
    path.join(repoRoot, QUALITY_CENTER_SNAPSHOT_RELATIVE_PATH),
    path.join(repoRoot, QUALITY_CENTER_WORKING_SNAPSHOT_RELATIVE_PATH),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8')) as unknown;
      if (!isValidReport(parsed)) continue;
      const observedSourceCommit = parsed.repositoryObservation.sourceCommit;
      if (expectedSourceCommit && (!observedSourceCommit || observedSourceCommit.toLowerCase() !== expectedSourceCommit.toLowerCase())) {
        continue;
      }
      return Object.freeze({
        report: parsed,
        sourcePath: path.relative(repoRoot, candidate).replace(/\\/g, '/'),
      });
    } catch {
      // Malformed/stale snapshots are evidence gaps, never a reason to fabricate a fallback report.
    }
  }
  return null;
}
