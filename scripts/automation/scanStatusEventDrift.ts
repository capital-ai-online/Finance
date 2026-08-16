/**
 * Documentary Status-Event Drift scan (Phase B + Phase C propose/apply).
 *
 * Default: read-only detect + print proposals (dryRun).
 * Optional: --apply writes header lines in the local working tree only.
 * Never pushes, never opens PRs, never touches main remotely.
 *
 * Usage:
 *   npx tsx scripts/automation/scanStatusEventDrift.ts
 *   npx tsx scripts/automation/scanStatusEventDrift.ts --apply
 *   npx tsx scripts/automation/scanStatusEventDrift.ts --path docs/runbooks/FOO.md
 */

import { detectStatusEventDrift } from '../../src/platform/Documentary/Discovery/StatusEventDriftDetector';
import {
  applyStatusHeaderUpdates,
  proposeStatusHeaderUpdates,
} from '../../src/platform/Documentary/Discovery/StatusEventDriftUpdater';

function parseArgs(argv: string[]): { apply: boolean; paths: string[] } {
  const apply = argv.includes('--apply');
  const paths: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--path' && argv[i + 1]) {
      paths.push(argv[i + 1]);
      i += 1;
    }
  }
  return { apply, paths };
}

const { apply, paths } = parseArgs(process.argv.slice(2));
const repoRoot = process.cwd();

const report = detectStatusEventDrift({
  repoRoot,
  ...(paths.length > 0 ? { documentPaths: paths } : {}),
});

const proposals = proposeStatusHeaderUpdates(report);
const update = applyStatusHeaderUpdates({
  repoRoot,
  proposals,
  dryRun: !apply,
});

const output = {
  scan: {
    scannedAt: report.scannedAt,
    detectorVersion: report.detectorVersion,
    summary: report.summary,
  },
  findings: report.findings.map((f) => ({
    documentPath: f.documentPath,
    headerClass: f.headerClass,
    headerStatus: f.headerStatus,
    claimStatus: f.claimStatus,
    evidenceStatus: f.evidenceStatus,
    drift: f.drift,
    conflict: f.conflict,
    recommendedHeaderStatus: f.recommendedHeaderStatus,
  })),
  proposals,
  update: {
    updaterVersion: update.updaterVersion,
    dryRun: update.dryRun,
    summary: update.summary,
    results: update.results,
  },
  note: apply
    ? 'Headers written in local working tree only. Create/update a Draft-PR manually; do not push to main without Owner review.'
    : 'Dry-run only. Pass --apply to write header lines locally for a Draft-PR working tree.',
};

console.log(JSON.stringify(output, null, 2));

if (report.summary.drift > 0 && !apply) {
  console.error(
    `[StatusEventDrift] ${report.summary.drift} drift finding(s). Review proposals above; use --apply only in a Draft-PR branch.`
  );
  process.exitCode = 2;
}
