import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import {
  classifyRenameCandidateInventory,
  loadRenameCandidateInventory,
  type RenameCandidateInventory,
} from './classifyRenameCandidates';

type MaterializedEvidenceCandidate = {
  id: string;
  sourceTerm?: string;
  targetTerm?: string;
  vocabularyConceptId?: string;
  classification: string;
  mandatoryFindingCodes?: string[];
  decision?: string;
  evidenceSurfaces?: string[];
  rationale?: string;
  [key: string]: unknown;
};

type RenameEvidence = {
  schemaVersion: string;
  authority: string;
  baselineCommit: string;
  phase?: string;
  safeMigrationCount: number;
  candidates: MaterializedEvidenceCandidate[];
  phase6Conclusion: string;
  migrationPerformed: boolean;
  [key: string]: unknown;
};

type RenameBacklogItem = {
  id: string;
  classification: string;
  automaticMigrationAllowed: boolean;
  [key: string]: unknown;
};

type RenameBacklog = {
  schemaVersion: string;
  authority: string;
  baselineCommit: string;
  policy?: string;
  items: RenameBacklogItem[];
  [key: string]: unknown;
};

export type SynchronizedRenameMaterializedState = {
  evidence: RenameEvidence;
  backlog: RenameBacklog;
};

function assertExactIds(label: string, expectedIds: string[], actualIds: string[]): void {
  const expected = [...expectedIds].sort();
  const actual = [...actualIds].sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error(
      `${label} candidate IDs drift from rename-candidates.json: expected=${expected.join(',')} actual=${actual.join(',')}`,
    );
  }
}

/**
 * Synchronizes analyzer-owned materialized fields while preserving human-curated
 * rationale/backlog context. The live Phase-3 analyzer remains the authority for
 * classification and detailed finding codes; the snapshot deliberately does not
 * duplicate finding-code lists as a second mutable authority.
 */
export function synchronizeRenameMaterializedState(
  inventory: RenameCandidateInventory,
  rootDir: string,
  evidence: RenameEvidence,
  backlog: RenameBacklog,
): SynchronizedRenameMaterializedState {
  const classified = classifyRenameCandidateInventory(inventory, rootDir);
  const inventoryIds = inventory.candidates.map((candidate) => candidate.id);
  assertExactIds('Evidence', inventoryIds, evidence.candidates.map((candidate) => candidate.id));
  assertExactIds('Backlog', inventoryIds, backlog.items.map((item) => item.id));

  const reportById = new Map(classified.map((candidate) => [candidate.id, candidate.report]));
  const safeMigrationCount = classified.filter((candidate) => candidate.report.classification === 'SAFE').length;

  const synchronizedEvidence: RenameEvidence = {
    ...evidence,
    baselineCommit: inventory.baselineCommit,
    safeMigrationCount,
    candidates: evidence.candidates.map((stored) => {
      const report = reportById.get(stored.id);
      if (!report) throw new Error(`Missing live analyzer report for ${stored.id}.`);
      return {
        ...stored,
        classification: report.classification,
        // Detailed codes are live analyzer output. Keeping a second copied list here
        // caused the Phase-6 drift that PR #487 exposed, so the materialized projection
        // intentionally stores no independent finding-code authority.
        mandatoryFindingCodes: [],
        decision: 'DO_NOT_RENAME',
      };
    }),
    phase6Conclusion: safeMigrationCount === 0 ? 'NO_SAFE_CANDIDATES' : 'SAFE_CANDIDATES_REQUIRE_HUMAN_REVIEW',
    migrationPerformed: false,
  };

  const synchronizedBacklog: RenameBacklog = {
    ...backlog,
    baselineCommit: inventory.baselineCommit,
    items: backlog.items.map((stored) => {
      const report = reportById.get(stored.id);
      if (!report) throw new Error(`Missing live analyzer report for ${stored.id}.`);
      return {
        ...stored,
        classification: report.classification,
        automaticMigrationAllowed: false,
      };
    }),
  };

  return { evidence: synchronizedEvidence, backlog: synchronizedBacklog };
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function runCli(): void {
  const rootDir = process.cwd();
  const write = process.argv.includes('--write');
  const check = process.argv.includes('--check') || !write;
  const inventoryPath = path.join(rootDir, 'docs/governance/vocabulary/rename-candidates.json');
  const evidencePath = path.join(rootDir, 'docs/governance/vocabulary/rename-classification-evidence.json');
  const backlogPath = path.join(rootDir, 'docs/governance/vocabulary/rename-backlog.json');

  const inventory = loadRenameCandidateInventory(inventoryPath);
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8')) as RenameEvidence;
  const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8')) as RenameBacklog;
  const synchronized = synchronizeRenameMaterializedState(inventory, rootDir, evidence, backlog);
  const expectedEvidence = stableJson(synchronized.evidence);
  const expectedBacklog = stableJson(synchronized.backlog);
  const currentEvidence = stableJson(evidence);
  const currentBacklog = stableJson(backlog);
  const drifted = currentEvidence !== expectedEvidence || currentBacklog !== expectedBacklog;

  if (write) {
    fs.writeFileSync(evidencePath, expectedEvidence, 'utf8');
    fs.writeFileSync(backlogPath, expectedBacklog, 'utf8');
    console.log('[VOCABULARY-RENAME-SYNC] Materialized Phase-6 evidence synchronized from the live analyzer.');
    return;
  }

  if (check && drifted) {
    throw new Error(
      'Materialized Phase-6 rename evidence is stale. Run `tsx scripts/automation/syncRenameCandidateEvidence.ts --write` on a feature branch, review the diff, and commit it.',
    );
  }

  console.log('[VOCABULARY-RENAME-SYNC] PASS — materialized Phase-6 evidence matches the live analyzer.');
}

const isDirectExecution = Boolean(process.argv[1])
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirectExecution) runCli();
