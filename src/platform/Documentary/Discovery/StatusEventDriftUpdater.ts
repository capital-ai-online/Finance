/**
 * Documentary Phase C — controlled Status-Event Drift Updater.
 * Authority: docs/architecture/DOCUMENTARY_STATUS_EVENT_DRIFT_CONTRACT.md
 *
 * - Builds header-only proposals from Phase B findings
 * - Applies only when dryRun=false (intended for Draft-PR working trees)
 * - Fail-closed on conflict, missing recommendation, or path outside allowlist
 * - Never rewrites Apply-Evidenz body content
 * - Never auto-merges; never silent write to main
 */

import fs from 'node:fs';
import path from 'node:path';
import type { StatusEventDriftFinding, StatusEventDriftReport } from './StatusEventEvidence';
import { STATUS_EVENT_DETECTOR_VERSION } from './StatusEventEvidence';

export const STATUS_EVENT_UPDATER_VERSION = '0.1.0-phase-c';

/** Paths relative to repo root that may receive header updates. */
const ALLOWED_PREFIXES = [
  'docs/runbooks/',
  'docs/seo/',
  'docs/evidence/',
  'docs/architecture/',
];

const HEADER_STATUS_LINE_RE = /^((?:\*\*)?Status:?\*?\*?\s*)(.+)$/im;

export interface StatusHeaderUpdateProposal {
  documentPath: string;
  previousHeaderStatus: string | null;
  proposedHeaderStatus: string;
  claimId: string | null;
  claimPath: string | null;
  evidenceSection: string | null;
  detectorVersion: string;
  updaterVersion: string;
  reason: string;
}

export interface StatusHeaderUpdateResult {
  documentPath: string;
  applied: boolean;
  dryRun: boolean;
  previousHeaderStatus: string | null;
  newHeaderStatus: string | null;
  skippedReason?: string;
}

export interface StatusHeaderUpdateReport {
  updaterVersion: string;
  detectorVersion: string;
  dryRun: boolean;
  proposedAt: string;
  proposals: StatusHeaderUpdateProposal[];
  results: StatusHeaderUpdateResult[];
  summary: {
    proposed: number;
    applied: number;
    skipped: number;
  };
}

function isAllowedPath(documentPath: string): boolean {
  const normalized = documentPath.replace(/\\/g, '/');
  return ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

/**
 * Build header-update proposals from a Phase B drift report.
 * Only drift findings with a recommended status and no conflict are eligible.
 */
export function proposeStatusHeaderUpdates(
  report: StatusEventDriftReport
): StatusHeaderUpdateProposal[] {
  const proposals: StatusHeaderUpdateProposal[] = [];

  for (const finding of report.findings) {
    if (!finding.drift) continue;
    if (finding.conflict) continue;
    if (!finding.recommendedHeaderStatus) continue;
    if (!isAllowedPath(finding.documentPath)) continue;

    proposals.push({
      documentPath: finding.documentPath,
      previousHeaderStatus: finding.headerStatus,
      proposedHeaderStatus: finding.recommendedHeaderStatus,
      claimId: finding.claimId,
      claimPath: finding.claimPath ?? finding.provenance.claimPath,
      evidenceSection: finding.provenance.evidenceSection,
      detectorVersion: finding.provenance.detectorVersion || report.detectorVersion,
      updaterVersion: STATUS_EVENT_UPDATER_VERSION,
      reason:
        'PRE_MUTATION header while claim applied and/or Apply-Evidenz documents success; ' +
        'recommended class from Phase B detector.',
    });
  }

  return proposals;
}

function replaceHeaderStatusLine(content: string, newStatus: string): {
  next: string;
  previous: string | null;
  changed: boolean;
} {
  const match = content.match(HEADER_STATUS_LINE_RE);
  if (!match || match.index === undefined) {
    return { next: content, previous: null, changed: false };
  }
  const prefix = match[1];
  const previous = match[2].trim();
  if (previous === newStatus) {
    return { next: content, previous, changed: false };
  }
  const replacement = `${prefix}${newStatus}`;
  const next =
    content.slice(0, match.index) + replacement + content.slice(match.index + match[0].length);
  return { next, previous, changed: true };
}

export interface ApplyStatusHeaderUpdatesOptions {
  repoRoot: string;
  proposals: StatusHeaderUpdateProposal[];
  /** Default true — no filesystem write. */
  dryRun?: boolean;
  proposedAt?: string;
}

/**
 * Apply header-only updates. Fail-closed skips; never touches Apply-Evidenz body.
 * dryRun defaults to true.
 */
export function applyStatusHeaderUpdates(
  options: ApplyStatusHeaderUpdatesOptions
): StatusHeaderUpdateReport {
  const dryRun = options.dryRun !== false ? true : false;
  const proposedAt = options.proposedAt ?? new Date().toISOString();
  const results: StatusHeaderUpdateResult[] = [];

  for (const proposal of options.proposals) {
    if (!isAllowedPath(proposal.documentPath)) {
      results.push({
        documentPath: proposal.documentPath,
        applied: false,
        dryRun,
        previousHeaderStatus: proposal.previousHeaderStatus,
        newHeaderStatus: null,
        skippedReason: 'path outside allowlist',
      });
      continue;
    }

    if (!proposal.proposedHeaderStatus) {
      results.push({
        documentPath: proposal.documentPath,
        applied: false,
        dryRun,
        previousHeaderStatus: proposal.previousHeaderStatus,
        newHeaderStatus: null,
        skippedReason: 'missing recommended header status',
      });
      continue;
    }

    const absolute = path.join(options.repoRoot, proposal.documentPath);
    if (!fs.existsSync(absolute)) {
      results.push({
        documentPath: proposal.documentPath,
        applied: false,
        dryRun,
        previousHeaderStatus: proposal.previousHeaderStatus,
        newHeaderStatus: null,
        skippedReason: 'file not found',
      });
      continue;
    }

    const content = fs.readFileSync(absolute, 'utf8');
    const { next, previous, changed } = replaceHeaderStatusLine(
      content,
      proposal.proposedHeaderStatus
    );

    if (!changed) {
      results.push({
        documentPath: proposal.documentPath,
        applied: false,
        dryRun,
        previousHeaderStatus: previous,
        newHeaderStatus: previous,
        skippedReason: previous === proposal.proposedHeaderStatus ? 'already at target' : 'no Status header line',
      });
      continue;
    }

    if (!dryRun) {
      fs.writeFileSync(absolute, next, 'utf8');
    }

    results.push({
      documentPath: proposal.documentPath,
      applied: !dryRun,
      dryRun,
      previousHeaderStatus: previous,
      newHeaderStatus: proposal.proposedHeaderStatus,
    });
  }

  const applied = results.filter((r) => r.applied).length;
  const skipped = results.filter((r) => !r.applied).length;

  return {
    updaterVersion: STATUS_EVENT_UPDATER_VERSION,
    detectorVersion: STATUS_EVENT_DETECTOR_VERSION,
    dryRun,
    proposedAt,
    proposals: options.proposals,
    results,
    summary: {
      proposed: options.proposals.length,
      applied,
      skipped,
    },
  };
}

/**
 * Convenience: detect → propose → optionally apply (default dryRun).
 * Does not open PRs and does not push.
 */
export function runControlledStatusHeaderUpdate(options: {
  repoRoot: string;
  documentPaths?: string[];
  dryRun?: boolean;
  sourceCommit?: string;
}): StatusHeaderUpdateReport {
  // Lazy import path avoided: caller may pass precomputed report; here we import detector.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { detectStatusEventDrift } = require('./StatusEventDriftDetector') as typeof import('./StatusEventDriftDetector');
  const report = detectStatusEventDrift({
    repoRoot: options.repoRoot,
    documentPaths: options.documentPaths,
    sourceCommit: options.sourceCommit,
  });
  const proposals = proposeStatusHeaderUpdates(report);
  return applyStatusHeaderUpdates({
    repoRoot: options.repoRoot,
    proposals,
    dryRun: options.dryRun,
  });
}

/** Exported for tests: path allowlist check. */
export function isStatusUpdatePathAllowed(documentPath: string): boolean {
  return isAllowedPath(documentPath);
}

/** Exported for tests: pure header line replacement. */
export function previewHeaderStatusReplacement(
  content: string,
  newStatus: string
): { next: string; previous: string | null; changed: boolean } {
  return replaceHeaderStatusLine(content, newStatus);
}

/** Type guard helper for finding eligibility (tests). */
export function isEligibleFinding(finding: StatusEventDriftFinding): boolean {
  return (
    finding.drift === true &&
    finding.conflict === false &&
    !!finding.recommendedHeaderStatus &&
    isAllowedPath(finding.documentPath)
  );
}
