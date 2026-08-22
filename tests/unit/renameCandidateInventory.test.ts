import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  classifyRenameCandidateInventory,
  loadRenameCandidateInventory,
  validateRenameCandidateInventory,
  type RenameCandidateInventory,
} from '../../scripts/automation/classifyRenameCandidates';
import { synchronizeRenameMaterializedState } from '../../scripts/automation/syncRenameCandidateEvidence';

const validInventory: RenameCandidateInventory = {
  schemaVersion: '1.0.0',
  authority: 'ESS-0017',
  baselineCommit: '04c0e5957aca7025b07f55439e052cef8e070571',
  mode: 'READ_ONLY',
  candidates: [
    {
      id: 'REN-TEST-0001',
      sourceTerm: 'LegacyPlan',
      targetTerm: 'SubscriptionTier',
      vocabularyConceptId: 'VOC-BILLING-0002',
      priority: 'LOW',
      reason: 'Test candidate.',
      observedSurfaces: [],
      migrationPolicy: 'CLASSIFY_ONLY',
    },
  ],
};

type MaterializedEvidence = {
  schemaVersion: string;
  authority: string;
  baselineCommit: string;
  phase: string;
  safeMigrationCount: number;
  migrationPerformed: boolean;
  phase6Conclusion: string;
  candidates: Array<{
    id: string;
    sourceTerm?: string;
    targetTerm?: string;
    vocabularyConceptId?: string;
    classification: string;
    mandatoryFindingCodes: string[];
    decision: string;
    evidenceSurfaces?: string[];
    rationale?: string;
  }>;
};

type MaterializedBacklog = {
  schemaVersion: string;
  authority: string;
  baselineCommit: string;
  policy: string;
  items: Array<{
    id: string;
    classification: string;
    status?: string;
    requiredNextDecision?: string;
    protectedSurfaces?: string[];
    automaticMigrationAllowed: boolean;
  }>;
};

function loadMaterializedState(root: string) {
  const evidence = JSON.parse(
    fs.readFileSync(path.join(root, 'docs/governance/vocabulary/rename-classification-evidence.json'), 'utf8'),
  ) as MaterializedEvidence;
  const backlog = JSON.parse(
    fs.readFileSync(path.join(root, 'docs/governance/vocabulary/rename-backlog.json'), 'utf8'),
  ) as MaterializedBacklog;
  return { evidence, backlog };
}

describe('Phase 6 rename candidate inventory', () => {
  it('accepts the read-only ESS-0017 inventory contract', () => {
    expect(validateRenameCandidateInventory(validInventory)).toEqual(validInventory);
  });

  it('rejects duplicate candidate ids fail-closed', () => {
    const duplicate = {
      ...validInventory,
      candidates: [validInventory.candidates[0], { ...validInventory.candidates[0] }],
    };
    expect(() => validateRenameCandidateInventory(duplicate)).toThrow(/Duplicate rename candidate id/);
  });

  it('rejects migration policies that could mutate code', () => {
    const unsafe = {
      ...validInventory,
      candidates: [{ ...validInventory.candidates[0], migrationPolicy: 'AUTO_RENAME' }],
    };
    expect(() => validateRenameCandidateInventory(unsafe)).toThrow(/CLASSIFY_ONLY/);
  });

  it('classifies candidates through the existing Phase 3 analyzer without mutating files', () => {
    const classified = classifyRenameCandidateInventory(validInventory, process.cwd());
    expect(classified).toHaveLength(1);
    expect(['SAFE', 'CONDITIONAL', 'BLOCKED']).toContain(classified[0].report.classification);
    expect(classified[0].report.targetTerm).toBe('SubscriptionTier');
    expect(classified[0].report.requiredGates).toContain('npm run lint');
  });

  it('keeps the materialized Phase 6 evidence synchronized with the live analyzer', () => {
    const root = process.cwd();
    const inventory = loadRenameCandidateInventory(path.join(root, 'docs/governance/vocabulary/rename-candidates.json'));
    const classified = classifyRenameCandidateInventory(inventory, root);
    const { evidence, backlog } = loadMaterializedState(root);
    const synchronized = synchronizeRenameMaterializedState(inventory, root, evidence, backlog);

    expect(synchronized.evidence).toEqual(evidence);
    expect(synchronized.backlog).toEqual(backlog);
    expect(evidence.baselineCommit).toBe(inventory.baselineCommit);
    expect(backlog.baselineCommit).toBe(inventory.baselineCommit);
    expect(evidence.safeMigrationCount).toBe(0);
    expect(evidence.migrationPerformed).toBe(false);
    expect(evidence.phase6Conclusion).toBe('NO_SAFE_CANDIDATES');
    expect(evidence.candidates).toHaveLength(inventory.candidates.length);
    expect(backlog.items).toHaveLength(inventory.candidates.length);

    for (const candidate of classified) {
      const stored = evidence.candidates.find((entry) => entry.id === candidate.id);
      const backlogEntry = backlog.items.find((entry) => entry.id === candidate.id);
      expect(stored, `Missing evidence for ${candidate.id}`).toBeDefined();
      expect(backlogEntry, `Missing backlog entry for ${candidate.id}`).toBeDefined();
      expect(stored?.classification).toBe(candidate.report.classification);
      expect(stored?.decision).toBe('DO_NOT_RENAME');
      expect(stored?.mandatoryFindingCodes).toEqual([]);
      expect(backlogEntry?.classification).toBe(candidate.report.classification);
      expect(backlogEntry?.automaticMigrationAllowed).toBe(false);
      expect(candidate.report.classification).not.toBe('SAFE');
    }
  });

  it('repairs stale materialized classifications from the live analyzer without authorizing migration', () => {
    const root = process.cwd();
    const inventory = loadRenameCandidateInventory(path.join(root, 'docs/governance/vocabulary/rename-candidates.json'));
    const classified = classifyRenameCandidateInventory(inventory, root);
    const { evidence, backlog } = loadMaterializedState(root);
    const staleEvidence = structuredClone(evidence);
    const staleBacklog = structuredClone(backlog);

    staleEvidence.candidates[0].classification = classified[0].report.classification === 'BLOCKED' ? 'CONDITIONAL' : 'BLOCKED';
    staleBacklog.items[0].classification = staleEvidence.candidates[0].classification;
    staleEvidence.candidates[0].mandatoryFindingCodes = ['STALE_SNAPSHOT_CODE'];
    staleEvidence.migrationPerformed = true;
    staleBacklog.items[0].automaticMigrationAllowed = true;

    const repaired = synchronizeRenameMaterializedState(inventory, root, staleEvidence, staleBacklog);
    expect(repaired.evidence.candidates[0].classification).toBe(classified[0].report.classification);
    expect(repaired.backlog.items[0].classification).toBe(classified[0].report.classification);
    expect(repaired.evidence.candidates[0].mandatoryFindingCodes).toEqual([]);
    expect(repaired.evidence.migrationPerformed).toBe(false);
    expect(repaired.backlog.items[0].automaticMigrationAllowed).toBe(false);
  });
});
