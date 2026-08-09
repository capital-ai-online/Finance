import { describe, expect, it } from 'vitest';
import {
  classifyRenameCandidateInventory,
  validateRenameCandidateInventory,
  type RenameCandidateInventory,
} from '../../scripts/automation/classifyRenameCandidates';

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
});
