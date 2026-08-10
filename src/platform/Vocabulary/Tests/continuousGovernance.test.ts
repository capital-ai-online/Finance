import { describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { validateContinuousVocabularyGovernance } from '../Validators/ContinuousGovernanceValidator';
import { InMemoryGovernanceLifecycleSink } from '../Services/GovernanceLifecycle';

describe('Continuous Vocabulary Governance', () => {
  it('blocks forbidden terminology in governed repository content', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-vocabulary-'));
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src', 'example.ts'), 'export const label = "Membership";');

    const report = validateContinuousVocabularyGovernance(root);
    expect(report.blocking).toBe(true);
    expect(report.findings.some((finding) => finding.ruleId === 'VOC-CONT-001')).toBe(true);
  });

  it('accepts canonical terminology', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-vocabulary-'));
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src', 'example.ts'), 'export const label = "Subscription";');

    const report = validateContinuousVocabularyGovernance(root);
    expect(report.blocking).toBe(false);
  });

  it('ignores forbidden terminology inside explicitly non-canonical archive evidence', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-vocabulary-'));
    fs.mkdirSync(path.join(root, 'docs', 'archive', 'legacy'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'docs', 'archive', 'legacy', 'snapshot.md'),
      'Historic terminology: Membership and PremiumPackage.',
    );

    const report = validateContinuousVocabularyGovernance(root);
    expect(report.blocking).toBe(false);
    expect(report.findings).toHaveLength(0);
  });

  it('keeps lifecycle evidence deterministic and immutable', () => {
    const sink = new InMemoryGovernanceLifecycleSink();
    sink.publish({
      type: 'CONCEPT_REGISTERED',
      conceptId: 'VOC-PLATFORM-0001',
      canonicalCodeTerm: 'VocabularyGovernance',
      status: 'approved',
      occurredAt: '2026-08-10T00:00:00.000Z',
      authorityReferences: ['ESS-0017'],
      traceabilityReferences: ['TRACE-VOC-0001'],
    });

    const events = sink.list();
    expect(events).toHaveLength(1);
    expect(events[0].authorityReferences).toEqual(['ESS-0017']);
    expect(Object.isFrozen(events[0])).toBe(true);
  });
});
