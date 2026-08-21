import { describe, expect, it } from 'vitest';
import {
  createDefaultUiMessageCatalog,
  createDefaultVocabularyRegistry,
  fintechWordingBindings,
  projectVocabularyGovernance,
  WordingUsageIndex,
} from '../index';

describe('VW-5 Vocabulary governance projection', () => {
  it('produces deterministic Documentary/Knowledge/Traceability evidence without mutation authority', () => {
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
    const first = projectVocabularyGovernance(sourceCommit, registry, catalog, usage, fintechWordingBindings);
    const second = projectVocabularyGovernance(sourceCommit, registry, catalog, usage, fintechWordingBindings);

    expect(first.checksum).toBe(second.checksum);
    expect(first.documentary.fintechStageIds).toHaveLength(18);
    expect(first.documentary.sourcePaths).toContain('src/features/screening/ui/Example.tsx');
    expect(first.knowledge.relationships.some((edge) => edge.type === 'HAS_MESSAGE')).toBe(true);
    expect(first.knowledge.relationships.some((edge) => edge.type === 'USED_BY')).toBe(true);
    expect(first.traceability.length).toBe(first.knowledge.relationships.length);
    expect(first.financialDecisionAuthority).toBe(false);
    expect(first.mutationAuthority).toBe(false);
  });

  it('requires an exact source commit for audit binding', () => {
    const registry = createDefaultVocabularyRegistry();
    const catalog = createDefaultUiMessageCatalog(registry);
    expect(() => projectVocabularyGovernance('main', registry, catalog, new WordingUsageIndex(catalog), fintechWordingBindings))
      .toThrow(/exact 40-character source commit SHA/);
  });
});
