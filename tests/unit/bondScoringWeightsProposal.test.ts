import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BOND_SCORING_WEIGHTS_PROPOSAL_VERSION,
  DRAFT_BOND_SCORING_WEIGHTS,
  previewHypotheticalBondScore,
  validateBondScoringWeightsProposal,
  type BondScoringWeightsProposal,
} from '../../src/services/bondScoringWeightsProposal';
import { evaluateBondEvidenceGate } from '../../src/types/bondScoringContract';
import fixture from '../fixtures/bond-golden-contract-v1.json';
import type { BondFeatureInputs } from '../../src/types/bondScoringContract';

const repoRoot = process.cwd();

function walkSourceFiles(dir: string, results: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSourceFiles(full, results);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) results.push(full);
  }
  return results;
}

describe('ADR-0028 bond scoring weights proposal (evaluation artifact, not a live scoring path)', () => {
  it('is a well-formed proposal: weights sum to 1.0, every dimension documented, status starts unapproved', () => {
    const validation = validateBondScoringWeightsProposal(DRAFT_BOND_SCORING_WEIGHTS);
    expect(validation.errors).toEqual([]);
    expect(validation.valid).toBe(true);
    expect(validation.weightSum).toBeCloseTo(1, 6);
    expect(DRAFT_BOND_SCORING_WEIGHTS.status).toBe('proposed');
    expect(DRAFT_BOND_SCORING_WEIGHTS.reviewedBy).toBeNull();
    expect(DRAFT_BOND_SCORING_WEIGHTS.reviewedAt).toBeNull();
    expect(DRAFT_BOND_SCORING_WEIGHTS.scoringEnabled).toBe(false);
  });

  it('rejects a proposal whose weights do not sum to 1.0', () => {
    const broken: BondScoringWeightsProposal = {
      ...DRAFT_BOND_SCORING_WEIGHTS,
      dimensions: DRAFT_BOND_SCORING_WEIGHTS.dimensions.map((dim, index) => (index === 0 ? { ...dim, weight: dim.weight + 0.5 } : dim)),
    };
    const validation = validateBondScoringWeightsProposal(broken);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((error) => error.includes('Gewichtssumme'))).toBe(true);
  });

  it('rejects a proposal marked "approved" without reviewedBy/reviewedAt', () => {
    const broken: BondScoringWeightsProposal = { ...DRAFT_BOND_SCORING_WEIGHTS, status: 'approved' };
    const validation = validateBondScoringWeightsProposal(broken);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((error) => error.includes('reviewedBy'))).toBe(true);
  });

  it('previewHypotheticalBondScore() refuses to run while the proposal is unapproved (fail-closed by construction)', () => {
    expect(() => previewHypotheticalBondScore(DRAFT_BOND_SCORING_WEIGHTS, { interestRateSensitivity: 80 })).toThrow(/proposed/);
  });

  it('previewHypotheticalBondScore() only computes a hypothetical, clearly disclaimed value once approved', () => {
    const approved: BondScoringWeightsProposal = {
      ...DRAFT_BOND_SCORING_WEIGHTS,
      status: 'approved',
      reviewedBy: 'test-reviewer',
      reviewedAt: new Date().toISOString(),
    };
    const preview = previewHypotheticalBondScore(approved, {
      interestRateSensitivity: 60,
      yieldAttractiveness: 70,
      creditQuality: 90,
      liquidity: 50,
      priceMomentum: 55,
      curveRegimeContext: 65,
      currencyRisk: 100,
    });
    expect(preview.hypotheticalScore).not.toBeNull();
    expect(preview.missingDimensions).toEqual([]);
    expect(preview.disclaimer).toMatch(/keine produktive Kennzahl/);
    expect(preview.contractVersion).toBe(BOND_SCORING_WEIGHTS_PROPOSAL_VERSION);
  });

  it('does NOT change the ADR-0022 evidence gate: a complete bond evidence fixture still yields score:null', () => {
    const result = evaluateBondEvidenceGate(fixture as BondFeatureInputs);
    expect(result.status).toBe('READY_FOR_MODEL_VALIDATION');
    expect(result.score).toBeNull();
  });

  it('is not imported by any server route or app entry point (stays a pure evaluation artifact)', () => {
    const candidateDirs = ['server', 'src/routes', 'src/features', 'server.ts'];
    const offendingFiles: string[] = [];
    for (const candidate of candidateDirs) {
      const full = path.join(repoRoot, candidate);
      if (!fs.existsSync(full)) continue;
      const files = fs.statSync(full).isDirectory() ? walkSourceFiles(full) : [full];
      for (const file of files) {
        const code = fs.readFileSync(file, 'utf8');
        if (code.includes('bondScoringWeightsProposal')) offendingFiles.push(path.relative(repoRoot, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it('is not imported by any React component (stays out of the UI until formally approved and wired)', () => {
    const componentsDir = path.join(repoRoot, 'src/components');
    const offendingFiles = walkSourceFiles(componentsDir).filter((file) => fs.readFileSync(file, 'utf8').includes('bondScoringWeightsProposal'));
    expect(offendingFiles).toEqual([]);
  });
});
