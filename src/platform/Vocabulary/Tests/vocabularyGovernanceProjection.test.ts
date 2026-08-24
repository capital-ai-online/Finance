import { describe, expect, it } from 'vitest';
import {
  createDefaultUiMessageCatalog,
  createDefaultVocabularyRegistry,
  fintechWordingBindings,
} from '../index';
import { createVocabularyWordingSnapshot, WordingUsageIndex } from '../node';
import { projectVocabularyWordingThroughDocumentary } from '../../Documentary/Knowledge/VocabularyWordingDocumentaryProjection';

describe('VW-5 Vocabulary wording Documentary projection', () => {
  it('reuses the canonical Documentary D7 Knowledge and Traceability contracts deterministically', () => {
    const registry = createDefaultVocabularyRegistry();
    const catalog = createDefaultUiMessageCatalog(registry);
    const usage = new WordingUsageIndex(catalog);
    usage.register({
      messageKey: 'screening.request.title',
      conceptIds: ['VOC-PRODUCT-0101', 'VOC-ANALYTICS-0001'],
      surface: 'react',
      sourcePath: 'src/features/screening/ui/Example.tsx',
      feature: 'screening',
      fintechStageIds: ['VC-01-REQUEST-INTAKE'],
    });

    const sourceCommit = 'a'.repeat(40);
    const snapshot = createVocabularyWordingSnapshot(sourceCommit, registry, catalog, usage, fintechWordingBindings);
    const input = {
      snapshot,
      generatedAt: '2026-08-21T21:00:00.000Z',
      correlationId: 'VW-5-test',
      causationId: 'VW-5-test',
    };
    const first = projectVocabularyWordingThroughDocumentary(input);
    const second = projectVocabularyWordingThroughDocumentary(input);

    expect(snapshot.stages).toHaveLength(18);
    expect(snapshot.usages[0].sourcePath).toBe('src/features/screening/ui/Example.tsx');
    expect(first.document.fingerprint).toBe(second.document.fingerprint);
    expect(first.knowledge.checksum).toBe(second.knowledge.checksum);
    expect(first.knowledge.nodes[0].conceptIds).toContain('VOC-ANALYTICS-0001');
    expect(first.knowledge.relationships.some((edge) => edge.type === 'REFERENCES_CONCEPT')).toBe(true);
    expect(first.traceability.documentFingerprint).toBe(first.document.fingerprint);
    expect(first.traceability.sourceCommit).toBe(sourceCommit);
    expect(first.financialDecisionAuthority).toBe(false);
    expect(first.mutationAuthority).toBe(false);
  });

  it('requires an exact source commit before Documentary handoff', () => {
    const registry = createDefaultVocabularyRegistry();
    const catalog = createDefaultUiMessageCatalog(registry);
    expect(() => createVocabularyWordingSnapshot('main', registry, catalog, new WordingUsageIndex(catalog), fintechWordingBindings))
      .toThrow(/exact 40-character source commit SHA/);
  });
});
