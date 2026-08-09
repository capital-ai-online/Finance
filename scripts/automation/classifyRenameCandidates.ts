import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { analyzeRenameImpact, type RenameImpactReport } from './validateRenameImpact';

export type RenameCandidatePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RenameCandidateMigrationPolicy = 'CLASSIFY_ONLY';

export interface RenameCandidate {
  id: string;
  sourceTerm: string;
  targetTerm: string;
  vocabularyConceptId: string;
  priority: RenameCandidatePriority;
  reason: string;
  observedSurfaces: string[];
  migrationPolicy: RenameCandidateMigrationPolicy;
}

export interface RenameCandidateInventory {
  schemaVersion: '1.0.0';
  authority: 'ESS-0017';
  baselineCommit: string;
  mode: 'READ_ONLY';
  candidates: RenameCandidate[];
}

export interface ClassifiedRenameCandidate extends RenameCandidate {
  report: RenameImpactReport;
}

function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid rename candidate inventory: ${field} must be a non-empty string.`);
  }
}

export function validateRenameCandidateInventory(value: unknown): RenameCandidateInventory {
  if (!value || typeof value !== 'object') throw new Error('Invalid rename candidate inventory: root object required.');
  const inventory = value as Partial<RenameCandidateInventory>;
  if (inventory.schemaVersion !== '1.0.0') throw new Error('Invalid rename candidate inventory: unsupported schemaVersion.');
  if (inventory.authority !== 'ESS-0017') throw new Error('Invalid rename candidate inventory: authority must be ESS-0017.');
  if (inventory.mode !== 'READ_ONLY') throw new Error('Invalid rename candidate inventory: mode must be READ_ONLY.');
  assertNonEmptyString(inventory.baselineCommit, 'baselineCommit');
  if (!Array.isArray(inventory.candidates) || inventory.candidates.length === 0) {
    throw new Error('Invalid rename candidate inventory: at least one candidate is required.');
  }

  const ids = new Set<string>();
  for (const [index, candidateValue] of inventory.candidates.entries()) {
    if (!candidateValue || typeof candidateValue !== 'object') throw new Error(`Invalid candidate at index ${index}.`);
    const candidate = candidateValue as Partial<RenameCandidate>;
    assertNonEmptyString(candidate.id, `candidates[${index}].id`);
    assertNonEmptyString(candidate.sourceTerm, `candidates[${index}].sourceTerm`);
    assertNonEmptyString(candidate.targetTerm, `candidates[${index}].targetTerm`);
    assertNonEmptyString(candidate.vocabularyConceptId, `candidates[${index}].vocabularyConceptId`);
    assertNonEmptyString(candidate.reason, `candidates[${index}].reason`);
    if (ids.has(candidate.id)) throw new Error(`Duplicate rename candidate id: ${candidate.id}.`);
    ids.add(candidate.id);
    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(candidate.priority ?? '')) {
      throw new Error(`Invalid priority for candidate ${candidate.id}.`);
    }
    if (candidate.migrationPolicy !== 'CLASSIFY_ONLY') {
      throw new Error(`Candidate ${candidate.id} must use CLASSIFY_ONLY in Phase 6.0/6.1.`);
    }
    if (!Array.isArray(candidate.observedSurfaces)) {
      throw new Error(`Candidate ${candidate.id} requires observedSurfaces.`);
    }
  }

  return inventory as RenameCandidateInventory;
}

export function classifyRenameCandidateInventory(
  inventory: RenameCandidateInventory,
  rootDir: string,
): ClassifiedRenameCandidate[] {
  return inventory.candidates.map((candidate) => ({
    ...candidate,
    report: analyzeRenameImpact({
      rootDir,
      sourceTerm: candidate.sourceTerm,
      targetTerm: candidate.targetTerm,
    }),
  }));
}

export function loadRenameCandidateInventory(filePath: string): RenameCandidateInventory {
  return validateRenameCandidateInventory(JSON.parse(fs.readFileSync(filePath, 'utf8')));
}

function runCli(): void {
  const rootDir = process.cwd();
  const inventoryPath = path.join(rootDir, 'docs/governance/vocabulary/rename-candidates.json');
  const inventory = loadRenameCandidateInventory(inventoryPath);
  const classified = classifyRenameCandidateInventory(inventory, rootDir);
  console.log(JSON.stringify({
    schemaVersion: inventory.schemaVersion,
    baselineCommit: inventory.baselineCommit,
    mode: inventory.mode,
    candidates: classified,
  }, null, 2));
}

const isDirectExecution = Boolean(process.argv[1]) && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirectExecution) runCli();
