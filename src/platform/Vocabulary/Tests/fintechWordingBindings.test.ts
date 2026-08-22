import { describe, expect, it } from 'vitest';
import {
  createDefaultUiMessageCatalog,
  createDefaultVocabularyRegistry,
  FINTECH_VALUE_CHAIN_STAGE_IDS,
  fintechWordingBindings,
  validateFintechWordingBindings,
} from '../index';

describe('VW-2 FinTech wording bindings', () => {
  it('covers every SC-MD-SPT-0001 stage exactly once', () => {
    expect(fintechWordingBindings).toHaveLength(18);
    expect(fintechWordingBindings.map((item) => item.stageId).sort()).toEqual([...FINTECH_VALUE_CHAIN_STAGE_IDS].sort());
    expect(new Set(fintechWordingBindings.map((item) => item.stageId)).size).toBe(18);
  });

  it('references only registered concepts and messages and remains non-authorizing', () => {
    const registry = createDefaultVocabularyRegistry();
    const catalog = createDefaultUiMessageCatalog(registry);
    expect(validateFintechWordingBindings(registry, catalog)).toEqual([]);

    for (const binding of fintechWordingBindings) {
      expect(binding.financialDecisionAuthority).toBe(false);
      expect(binding.mutationAuthority).toBe(false);
      expect(binding.authorityReferences).toContain('SC-MD-SPT-0001');
    }
  });
});
