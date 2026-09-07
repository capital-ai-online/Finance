import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_RPO_TARGET_SECONDS = 86_400;

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requirePositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return value;
}

function parseTimestamp(value, label) {
  const raw = requireString(value, label);
  const epochMs = Date.parse(raw);
  if (!Number.isFinite(epochMs)) {
    throw new Error(`${label} must be an ISO-8601 timestamp`);
  }
  return { raw, epochMs };
}

function normalizeEvidence(value, index) {
  const evidence = requireObject(value, `evidence[${index}]`);
  if (evidence.schemaVersion !== '1.1.0') {
    throw new Error(`evidence[${index}].schemaVersion must be 1.1.0`);
  }
  if (evidence.workItem !== 'OPS-08-SEC-07') {
    throw new Error(`evidence[${index}].workItem must be OPS-08-SEC-07`);
  }

  const source = requireObject(evidence.source, `evidence[${index}].source`);
  if (source.readOnlyBackup !== true) {
    throw new Error(`evidence[${index}].source.readOnlyBackup must be true`);
  }

  const repository = requireObject(evidence.repository, `evidence[${index}].repository`);
  const workflowRunId = requireString(
    String(repository.workflowRunId ?? ''),
    `evidence[${index}].repository.workflowRunId`,
  );
  const workflowRunAttempt = requireString(
    String(repository.workflowRunAttempt ?? ''),
    `evidence[${index}].repository.workflowRunAttempt`,
  );

  const backup = requireObject(evidence.backup, `evidence[${index}].backup`);
  const startedAt = parseTimestamp(backup.startedAt, `evidence[${index}].backup.startedAt`);
  parseTimestamp(backup.completedAt, `evidence[${index}].backup.completedAt`);
  requirePositiveInteger(backup.encryptedBytes, `evidence[${index}].backup.encryptedBytes`);
  const encryptedSha256 = requireString(
    backup.encryptedSha256,
    `evidence[${index}].backup.encryptedSha256`,
  );
  if (!/^[a-f0-9]{64}$/i.test(encryptedSha256)) {
    throw new Error(`evidence[${index}].backup.encryptedSha256 must be a SHA-256 hex digest`);
  }

  const coverage = requireObject(backup.coverage, `evidence[${index}].backup.coverage`);
  if (coverage.storageBinaryCoverage !== 'REQUIRES_ZERO_OBJECTS') {
    throw new Error(
      `evidence[${index}].backup.coverage.storageBinaryCoverage must be REQUIRES_ZERO_OBJECTS`,
    );
  }
  if (coverage.storageObjectsRows !== 0) {
    throw new Error(`evidence[${index}] is not eligible for RPO evidence while storage objects exist`);
  }
  if (evidence.securityClosure !== 'NOT_CLAIMED') {
    throw new Error(`evidence[${index}].securityClosure must remain NOT_CLAIMED`);
  }

  const embeddedEventName =
    typeof repository.eventName === 'string' && repository.eventName.trim() !== ''
      ? repository.eventName
      : null;

  return {
    embeddedEventName,
    workflowRunId,
    workflowRunAttempt,
    startedAt: startedAt.raw,
    startedAtEpochMs: startedAt.epochMs,
    repositorySha: requireString(repository.sha, `evidence[${index}].repository.sha`),
    encryptedSha256,
  };
}

export function buildRecoveryRunEventMap(value) {
  const root = requireObject(value, 'run metadata');
  if (!Array.isArray(root.workflow_runs)) {
    throw new Error('run metadata.workflow_runs must be an array');
  }

  const result = new Map();
  for (const [index, rawRun] of root.workflow_runs.entries()) {
    const run = requireObject(rawRun, `run metadata.workflow_runs[${index}]`);
    const id = requireString(String(run.id ?? ''), `run metadata.workflow_runs[${index}].id`);
    const eventName = requireString(run.event, `run metadata.workflow_runs[${index}].event`);
    const status = requireString(run.status, `run metadata.workflow_runs[${index}].status`);
    const conclusion =
      typeof run.conclusion === 'string' && run.conclusion.trim() !== '' ? run.conclusion : null;
    result.set(id, { eventName, status, conclusion });
  }
  return result;
}

export function evaluateRecoveryRpoEvidence(values, options = {}) {
  if (!Array.isArray(values)) {
    throw new Error('evidence values must be an array');
  }
  const targetSeconds = requirePositiveInteger(
    options.targetSeconds ?? DEFAULT_RPO_TARGET_SECONDS,
    'targetSeconds',
  );
  const runEvents = options.runMetadata
    ? buildRecoveryRunEventMap(options.runMetadata)
    : new Map();

  const normalized = values.map(normalizeEvidence);
  const classified = normalized.map((entry) => {
    const metadata = runEvents.get(entry.workflowRunId);
    const metadataEventName = metadata?.eventName ?? null;
    if (
      entry.embeddedEventName &&
      metadataEventName &&
      entry.embeddedEventName !== metadataEventName
    ) {
      throw new Error(
        `workflow run ${entry.workflowRunId} event identity conflicts between evidence and run metadata`,
      );
    }
    return {
      ...entry,
      eventName: metadataEventName ?? entry.embeddedEventName,
      runSuccessful: metadata ? metadata.status === 'completed' && metadata.conclusion === 'success' : null,
    };
  });

  const scheduled = classified
    .filter((entry) => entry.eventName === 'schedule' && entry.runSuccessful !== false)
    .sort((a, b) => a.startedAtEpochMs - b.startedAtEpochMs);

  const uniqueScheduled = [];
  const identities = new Set();
  for (const entry of scheduled) {
    const identity = `${entry.workflowRunId}:${entry.workflowRunAttempt}`;
    if (identities.has(identity)) continue;
    identities.add(identity);
    uniqueScheduled.push(entry);
  }

  const unclassifiedRuns = classified.filter((entry) => !entry.eventName).length;
  const unsuccessfulRuns = classified.filter((entry) => entry.runSuccessful === false).length;

  if (uniqueScheduled.length < 2) {
    return {
      schemaVersion: '1.0.0',
      workItem: 'OPS-08-SEC-07',
      status: 'INSUFFICIENT_EVIDENCE',
      targetSeconds,
      scheduledRuns: uniqueScheduled.length,
      unclassifiedRuns,
      unsuccessfulRuns,
      intervalsSeconds: [],
      maxObservedIntervalSeconds: null,
      firstScheduledBackupStartedAt: uniqueScheduled[0]?.startedAt ?? null,
      lastScheduledBackupStartedAt: uniqueScheduled.at(-1)?.startedAt ?? null,
      securityClosure: 'NOT_CLAIMED',
    };
  }

  const intervalsSeconds = [];
  for (let index = 1; index < uniqueScheduled.length; index += 1) {
    const intervalSeconds = Math.round(
      (uniqueScheduled[index].startedAtEpochMs - uniqueScheduled[index - 1].startedAtEpochMs) / 1000,
    );
    if (intervalSeconds <= 0) {
      throw new Error('scheduled backup timestamps must be strictly increasing');
    }
    intervalsSeconds.push(intervalSeconds);
  }

  const maxObservedIntervalSeconds = Math.max(...intervalsSeconds);
  return {
    schemaVersion: '1.0.0',
    workItem: 'OPS-08-SEC-07',
    status: maxObservedIntervalSeconds <= targetSeconds ? 'MEASURED_PASS' : 'MEASURED_FAIL',
    targetSeconds,
    scheduledRuns: uniqueScheduled.length,
    unclassifiedRuns,
    unsuccessfulRuns,
    intervalsSeconds,
    maxObservedIntervalSeconds,
    firstScheduledBackupStartedAt: uniqueScheduled[0].startedAt,
    lastScheduledBackupStartedAt: uniqueScheduled.at(-1).startedAt,
    securityClosure: 'NOT_CLAIMED',
  };
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isDirectExecution() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isDirectExecution()) {
  const args = process.argv.slice(2);
  const runMetadataIndex = args.indexOf('--runs');
  if (runMetadataIndex < 0 || !args[runMetadataIndex + 1]) {
    throw new Error(
      'Usage: recoveryRpoEvidence.mjs --runs <workflow-runs.json> <ops-recovery-*-evidence.json> [more evidence files...]',
    );
  }
  const runMetadataPath = args[runMetadataIndex + 1];
  const evidenceFiles = args.filter(
    (_, index) => index !== runMetadataIndex && index !== runMetadataIndex + 1,
  );
  if (evidenceFiles.length === 0) {
    throw new Error('At least one recovery evidence JSON file is required');
  }

  const targetSeconds = process.env.RPO_TARGET_SECONDS
    ? Number(process.env.RPO_TARGET_SECONDS)
    : DEFAULT_RPO_TARGET_SECONDS;
  const summary = evaluateRecoveryRpoEvidence(evidenceFiles.map(readJsonFile), {
    targetSeconds,
    runMetadata: readJsonFile(runMetadataPath),
  });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  process.exitCode = summary.status === 'MEASURED_PASS' ? 0 : summary.status === 'MEASURED_FAIL' ? 1 : 2;
}
