/**
 * Documentary Phase B — read-only Status-Event Drift Detector.
 * Authority: docs/architecture/DOCUMENTARY_STATUS_EVENT_DRIFT_CONTRACT.md
 *
 * - Input: repo paths (runbooks, claims), optional merge-success trigger
 * - Output: machine-readable findings only
 * - No file writes, no PR creation, no claim mutation
 */

import fs from 'node:fs';
import path from 'node:path';
import type {
  EvidenceStatus,
  StatusEventDriftFinding,
  StatusEventDriftReport,
  StatusEventMergeTrigger,
  StatusHeaderClass,
} from './StatusEventEvidence';
import { STATUS_EVENT_DETECTOR_VERSION } from './StatusEventEvidence';

const PRE_MUTATION_TOKENS = [
  'PRE-MUTATION',
  'OWNER-FREIGABE ERFORDERLICH',
  'OWNER ACTION REQUIRED',
  'HUMAN APPROVAL REQUIRED',
  'NO PRODUCTION MUTATION AUTHORIZED',
  'NO PRODUCTION MUTATION',
];

const IN_PROGRESS_TOKENS = [
  'IN PROGRESS',
  'IMPLEMENTED /',
  'PENDING',
  'LIVE MUTATION BLOCKED',
];

const VERIFIED_TOKENS = ['VERIFIED PASS', 'COMPLETE / VERIFIED', '**VERIFIED PASS**', 'VERIFIED'];
const APPLIED_TOKENS = ['APPLIED'];
const SUPERSEDED_TOKENS = ['SUPERSEDED'];
const ARCHIVED_TOKENS = ['ARCHIVED'];

const EVIDENCE_SECTION_RE =
  /^##\s+(Apply-Evidenz|Apply Evidence|Apply-Evidence|Post-Mutation Evidence|Nachtrag)\b/im;

const HEADER_STATUS_RE = /^(?:\*\*)?Status:?\*?\*?\s*(.+)$/im;
const WORK_CLAIM_RE = /Work claim:\s*`?([A-Za-z0-9._-]+)`?/i;
const SUCCESS_MARKERS = [
  /success:\s*true/i,
  /\bVERIFIED\b/i,
  /\bVerifikation\b/i,
  /\bverification\b/i,
  /\bcommit\b/i,
  /\bUPDATE\b/i,
  /\bangewendet\b/i,
  /\bexecuted\b/i,
  /\bAusgefuehrt\b/i,
  /\bAusgeführt\b/i,
];

export interface StatusEventDriftScanOptions {
  repoRoot: string;
  /** Explicit document paths relative to repo root. If empty, scans docs/runbooks. */
  documentPaths?: string[];
  claimDir?: string;
  sourceCommit?: string;
  /** Successful merge as trigger context (does not write status). */
  mergeTrigger?: StatusEventMergeTrigger;
  scannedAt?: string;
}

function normalizeRel(repoRoot: string, absolute: string): string {
  return path.relative(repoRoot, absolute).replace(/\\/g, '/');
}

function classifyHeader(raw: string | null): StatusHeaderClass {
  if (!raw) return 'UNKNOWN';
  const upper = raw.toUpperCase();

  if (PRE_MUTATION_TOKENS.some((t) => upper.includes(t.toUpperCase()))) return 'PRE_MUTATION';
  if (SUPERSEDED_TOKENS.some((t) => upper.includes(t))) return 'SUPERSEDED';
  if (ARCHIVED_TOKENS.some((t) => upper.includes(t))) return 'ARCHIVED';
  if (VERIFIED_TOKENS.some((t) => upper.includes(t.toUpperCase()))) return 'VERIFIED';
  if (APPLIED_TOKENS.some((t) => upper.includes(t))) return 'APPLIED';
  if (IN_PROGRESS_TOKENS.some((t) => upper.includes(t.toUpperCase()))) return 'IN_PROGRESS';
  if (/(DESIGN ONLY|PROPOSED|ACTIVE|PLANNED)/i.test(raw)) return 'OTHER';
  return 'UNKNOWN';
}

function extractHeaderStatus(content: string): string | null {
  const match = content.match(HEADER_STATUS_RE);
  if (!match) return null;
  return match[1].trim().replace(/\*+/g, '').trim();
}

function extractClaimId(content: string): string | null {
  const match = content.match(WORK_CLAIM_RE);
  return match ? match[1].trim() : null;
}

function extractEvidenceSection(content: string): { title: string; body: string } | null {
  const match = content.match(EVIDENCE_SECTION_RE);
  if (!match || match.index === undefined) return null;
  const title = match[1];
  const start = match.index + match[0].length;
  const rest = content.slice(start);
  const nextHeading = rest.search(/\n##\s+/);
  const body = (nextHeading >= 0 ? rest.slice(0, nextHeading) : rest).trim();
  return { title, body };
}

function evidenceHasSuccess(body: string): boolean {
  return SUCCESS_MARKERS.some((re) => re.test(body));
}

function evidenceHasVerification(body: string): boolean {
  return /Verifikation|verification|VERIFIED|Zielzustand|schema_migrations/i.test(body);
}

function extractTimestamps(body: string): string[] {
  const dates = [...body.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)].map((m) => m[1]);
  return [...new Set(dates)].sort();
}

function readClaim(
  repoRoot: string,
  claimDir: string,
  claimId: string | null
): { status: string | null; path: string | null; externalMutations: unknown[] } {
  if (!claimId) return { status: null, path: null, externalMutations: [] };
  const claimPath = path.join(repoRoot, claimDir, `${claimId}.json`);
  if (!fs.existsSync(claimPath)) {
    return { status: null, path: null, externalMutations: [] };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(claimPath, 'utf8')) as {
      status?: string;
      externalMutations?: unknown[];
    };
    return {
      status: typeof raw.status === 'string' ? raw.status : null,
      path: normalizeRel(repoRoot, claimPath),
      externalMutations: Array.isArray(raw.externalMutations) ? raw.externalMutations : [],
    };
  } catch {
    return { status: null, path: normalizeRel(repoRoot, claimPath), externalMutations: [] };
  }
}

function listDefaultRunbooks(repoRoot: string): string[] {
  const dir = path.join(repoRoot, 'docs', 'runbooks');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => path.join('docs', 'runbooks', e.name))
    .sort();
}

function recommendedFromEvidence(
  headerClass: StatusHeaderClass,
  claimApplied: boolean,
  evidenceStatus: EvidenceStatus
): string | null {
  if (headerClass !== 'PRE_MUTATION') return null;
  if (!claimApplied && evidenceStatus === 'NONE') return null;
  if (evidenceStatus === 'APPLIED_WITH_VERIFICATION') return 'VERIFIED PASS';
  if (evidenceStatus === 'APPLIED' || claimApplied) return 'APPLIED';
  return null;
}

function evaluateDocument(
  repoRoot: string,
  documentPath: string,
  claimDir: string,
  scannedAt: string,
  sourceCommit: string | undefined,
  mergeTrigger: StatusEventMergeTrigger | undefined
): StatusEventDriftFinding {
  const absolute = path.join(repoRoot, documentPath);
  const content = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';

  const headerStatus = extractHeaderStatus(content);
  const headerClass = classifyHeader(headerStatus);
  const claimId = extractClaimId(content);
  const claim = readClaim(repoRoot, claimDir, claimId);
  const evidence = extractEvidenceSection(content);

  let evidenceStatus: EvidenceStatus = 'NONE';
  let evidenceTimestamps: string[] = [];
  let evidenceSection: string | null = null;

  if (evidence) {
    evidenceSection = evidence.title;
    evidenceTimestamps = extractTimestamps(evidence.body);
    const success = evidenceHasSuccess(evidence.body);
    const verified = evidenceHasVerification(evidence.body);
    if (success && verified) evidenceStatus = 'APPLIED_WITH_VERIFICATION';
    else if (success) evidenceStatus = 'APPLIED';
  }

  const claimApplied =
    claim.status === 'applied' && claim.externalMutations.length > 0;

  // Drift: PRE_MUTATION header while claim applied and/or Apply-Evidenz success
  const drift =
    headerClass === 'PRE_MUTATION' &&
    (claimApplied || evidenceStatus === 'APPLIED' || evidenceStatus === 'APPLIED_WITH_VERIFICATION');

  // Conflict: claim applied but evidence missing/empty, or opposite
  const conflict =
    (claimApplied && evidenceStatus === 'NONE') ||
    (!claimApplied && claim.status !== null && claim.status !== 'applied' && evidenceStatus !== 'NONE');

  const recommendedHeaderStatus = drift
    ? recommendedFromEvidence(headerClass, claimApplied, evidenceStatus)
    : null;

  return {
    documentPath,
    headerStatus,
    headerClass,
    evidenceStatus,
    claimId,
    claimStatus: claim.status,
    claimPath: claim.path,
    drift,
    conflict: drift ? false : conflict,
    recommendedHeaderStatus: conflict && !drift ? null : recommendedHeaderStatus,
    sourceEvidenceIds: [],
    evidenceTimestamps,
    ...(mergeTrigger ? { mergeTrigger } : {}),
    provenance: {
      claimPath: claim.path,
      evidenceSection,
      detectorVersion: STATUS_EVENT_DETECTOR_VERSION,
      scannedAt,
      ...(sourceCommit ? { sourceCommit } : {}),
    },
  };
}

/**
 * Read-only scan. When `mergeTrigger.mergeSucceeded` is true, the report is annotated
 * as merge-triggered; status headers are never written.
 */
export function detectStatusEventDrift(options: StatusEventDriftScanOptions): StatusEventDriftReport {
  const scannedAt = options.scannedAt ?? new Date().toISOString();
  const claimDir = options.claimDir ?? path.join('.ai', 'work-claims');
  const paths =
    options.documentPaths && options.documentPaths.length > 0
      ? options.documentPaths
      : listDefaultRunbooks(options.repoRoot);

  const findings = paths.map((documentPath) =>
    evaluateDocument(
      options.repoRoot,
      documentPath,
      claimDir,
      scannedAt,
      options.sourceCommit,
      options.mergeTrigger
    )
  );

  const drift = findings.filter((f) => f.drift).length;
  const conflict = findings.filter((f) => f.conflict).length;

  return {
    scannedAt,
    detectorVersion: STATUS_EVENT_DETECTOR_VERSION,
    ...(options.sourceCommit ? { sourceCommit: options.sourceCommit } : {}),
    ...(options.mergeTrigger ? { mergeTrigger: options.mergeTrigger } : {}),
    findings,
    summary: {
      scanned: findings.length,
      drift,
      conflict,
      clean: findings.length - drift - conflict,
    },
  };
}

/** Convenience: scan after a successful merge (trigger annotation only). */
export function detectStatusEventDriftAfterMerge(
  options: Omit<StatusEventDriftScanOptions, 'mergeTrigger'> & {
    pullRequestNumber?: number;
    mergeCommitSha?: string;
    mergedAt?: string;
  }
): StatusEventDriftReport {
  return detectStatusEventDrift({
    ...options,
    mergeTrigger: {
      mergeSucceeded: true,
      ...(options.pullRequestNumber !== undefined
        ? { pullRequestNumber: options.pullRequestNumber }
        : {}),
      ...(options.mergeCommitSha ? { mergeCommitSha: options.mergeCommitSha } : {}),
      ...(options.mergedAt ? { mergedAt: options.mergedAt } : {}),
    },
  });
}
