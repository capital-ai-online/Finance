import fs from 'node:fs';
import path from 'node:path';

export const QUALITY_EXECUTION_EVIDENCE_SCHEMA = 'quality-execution-evidence/1.0.0' as const;
export const QUALITY_EXECUTION_EVIDENCE_PATH = '.quality/execution-evidence.json' as const;

export type QualityExecutionPhase = 'contract' | 'test' | 'build';
export type QualityExecutionStatus = 'PASS' | 'FAIL';

export interface QualityExecutionRecord {
  phase: QualityExecutionPhase;
  status: QualityExecutionStatus;
  checkedAt: string;
  sourceCommit: string;
  command: string;
  exitCode: number;
  evidenceRefs: readonly string[];
}

export interface QualityExecutionEvidenceSnapshot {
  schemaVersion: typeof QUALITY_EXECUTION_EVIDENCE_SCHEMA;
  sourceCommit: string;
  records: readonly QualityExecutionRecord[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validRecord(value: unknown): value is QualityExecutionRecord {
  if (!isRecord(value)) return false;
  return (
    (value.phase === 'contract' || value.phase === 'test' || value.phase === 'build') &&
    (value.status === 'PASS' || value.status === 'FAIL') &&
    typeof value.checkedAt === 'string' &&
    typeof value.sourceCommit === 'string' && /^[0-9a-f]{40}$/i.test(value.sourceCommit) &&
    typeof value.command === 'string' && value.command.length > 0 &&
    typeof value.exitCode === 'number' && Number.isInteger(value.exitCode) &&
    Array.isArray(value.evidenceRefs) && value.evidenceRefs.every((item) => typeof item === 'string' && item.length > 0)
  );
}

function freezeRecord(record: QualityExecutionRecord): QualityExecutionRecord {
  return Object.freeze({ ...record, evidenceRefs: Object.freeze([...record.evidenceRefs]) });
}

export function readQualityExecutionEvidence(
  repoRoot = process.cwd(),
  expectedSourceCommit?: string | null,
): QualityExecutionEvidenceSnapshot | null {
  const file = path.join(repoRoot, QUALITY_EXECUTION_EVIDENCE_PATH);
  if (!fs.existsSync(file)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown;
    if (!isRecord(parsed) || parsed.schemaVersion !== QUALITY_EXECUTION_EVIDENCE_SCHEMA) return null;
    if (typeof parsed.sourceCommit !== 'string' || !/^[0-9a-f]{40}$/i.test(parsed.sourceCommit)) return null;
    if (expectedSourceCommit && parsed.sourceCommit !== expectedSourceCommit) return null;
    if (!Array.isArray(parsed.records) || !parsed.records.every(validRecord)) return null;
    if (parsed.records.some((record) => record.sourceCommit !== parsed.sourceCommit)) return null;

    return Object.freeze({
      schemaVersion: QUALITY_EXECUTION_EVIDENCE_SCHEMA,
      sourceCommit: parsed.sourceCommit,
      records: Object.freeze(parsed.records.map(freezeRecord)),
    });
  } catch {
    return null;
  }
}

export function writeQualityExecutionEvidence(
  repoRoot: string,
  sourceCommit: string,
  records: readonly QualityExecutionRecord[],
): QualityExecutionEvidenceSnapshot {
  if (!/^[0-9a-f]{40}$/i.test(sourceCommit)) {
    throw new Error('[QualityExecutionEvidence] sourceCommit must be a full 40-character Git SHA.');
  }
  if (records.some((record) => !validRecord(record) || record.sourceCommit !== sourceCommit)) {
    throw new Error('[QualityExecutionEvidence] invalid execution record or source-commit mismatch.');
  }

  const byPhase = new Map<QualityExecutionPhase, QualityExecutionRecord>();
  for (const record of records) byPhase.set(record.phase, freezeRecord(record));
  const ordered = (['contract', 'test', 'build'] as const)
    .map((phase) => byPhase.get(phase))
    .filter((record): record is QualityExecutionRecord => Boolean(record));
  const snapshot = Object.freeze({
    schemaVersion: QUALITY_EXECUTION_EVIDENCE_SCHEMA,
    sourceCommit,
    records: Object.freeze(ordered),
  });

  const output = path.join(repoRoot, QUALITY_EXECUTION_EVIDENCE_PATH);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const temporary = `${output}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(snapshot, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, output);
  return snapshot;
}

export function executionRecord(
  snapshot: QualityExecutionEvidenceSnapshot | null,
  phase: QualityExecutionPhase,
): QualityExecutionRecord | null {
  return snapshot?.records.find((record) => record.phase === phase) ?? null;
}
