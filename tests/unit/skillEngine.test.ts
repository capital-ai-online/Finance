import { describe, expect, it } from 'vitest';
import {
  SKILL_ENGINE_SYSTEM_PROMPT,
  buildVocabularyInventory,
  compileSkillPrompt,
  errorClasses,
  skillCatalog,
  validateSkillCatalog,
} from '../../src/platform/Quality/SkillEngine';
import { VocabularyRegistry } from '../../src/platform/Vocabulary/Registry/VocabularyRegistry';

describe('CAPITAL-AI Skill Engine', () => {
  it('keeps the catalog structurally valid and component-complete', () => {
    const findings = validateSkillCatalog(skillCatalog);
    expect(findings.filter((finding) => finding.severity === 'error')).toEqual([]);
    expect(skillCatalog.length).toBeGreaterThanOrEqual(30);
    expect(errorClasses).toHaveLength(22);
  });

  it('uses one stable system prompt and dynamic component context', () => {
    const first = compileSkillPrompt(skillCatalog[0], { mainRef: 'main', commitSha: 'abc123' });
    const second = compileSkillPrompt(skillCatalog[1], { mainRef: 'main', commitSha: 'abc123' });

    expect(first.systemPrompt).toBe(SKILL_ENGINE_SYSTEM_PROMPT);
    expect(second.systemPrompt).toBe(SKILL_ENGINE_SYSTEM_PROMPT);
    expect(first.contextPrompt).not.toBe(second.contextPrompt);
    expect(first.contextPrompt).toContain(skillCatalog[0].id);
    expect(second.contextPrompt).toContain(skillCatalog[1].id);
  });

  it('keeps the structured output schema outside natural-language prompts', () => {
    const compiled = compileSkillPrompt(skillCatalog[0]);
    expect(compiled.outputSchema).toBeTruthy();
    expect(compiled.systemPrompt).not.toContain('additionalProperties');
    expect(compiled.contextPrompt).not.toContain('additionalProperties');
  });

  it('resolves existing vocabulary and leaves unknown terms as review candidates', () => {
    const inventory = buildVocabularyInventory(skillCatalog);
    const vocabularyGovernance = inventory.find((entry) => entry.term === 'VocabularyGovernance');
    const screening = inventory.find((entry) => entry.term === 'Screening');
    const architecture = inventory.find((entry) => entry.term === 'Architecture');

    expect(vocabularyGovernance?.conceptId).toBe('VOC-PLATFORM-0001');
    expect(screening?.conceptId).toBe('VOC-ANALYTICS-0001');
    expect(architecture?.status).toBe('NEW_CANDIDATE');
    expect(architecture?.conceptId).toBeNull();
  });

  it('classifies canonical, alias, forbidden and review-candidate vocabulary through the canonical registry', () => {
    const skill = {
      ...skillCatalog[0],
      id: 'SKILL-TEST-VOCABULARY-STATUS',
      vocabularyTerms: ['Subscription', 'abo', 'Membership', 'Architecture'],
    };
    const inventory = buildVocabularyInventory([skill]);

    expect(inventory.find((entry) => entry.term === 'Subscription')?.status).toBe('CANONICAL');
    expect(inventory.find((entry) => entry.term === 'abo')?.status).toBe('ALIAS');
    expect(inventory.find((entry) => entry.term === 'Membership')?.status).toBe('FORBIDDEN');
    expect(inventory.find((entry) => entry.term === 'Architecture')).toMatchObject({
      status: 'NEW_CANDIDATE',
      conceptId: null,
      canonicalTerm: null,
    });
  });

  it('uses the vocabulary NFKC normalization contract for inventory and catalog validation', () => {
    const skill = {
      ...skillCatalog[0],
      id: 'SKILL-TEST-VOCABULARY-NFKC',
      vocabularyTerms: ['Subscription', 'Ｓｕｂｓｃｒｉｐｔｉｏｎ'],
    };

    const inventory = buildVocabularyInventory([skill]);
    const findings = validateSkillCatalog([skill]);

    expect(inventory).toHaveLength(1);
    expect(inventory[0]).toMatchObject({
      conceptId: 'VOC-BILLING-0001',
      canonicalTerm: 'Subscription',
      status: 'CANONICAL',
    });
    expect(findings.some((finding) => finding.code === 'DUPLICATE_SKILL_TERM')).toBe(true);
  });

  it('accepts an injected vocabulary registry without granting candidate-creation authority', () => {
    const registry = new VocabularyRegistry();
    registry.register({
      id: 'VOC-PLATFORM-9999',
      canonicalCodeTerm: 'InjectedTerm',
      displayNameDE: 'Injizierter Begriff',
      displayNameEN: 'Injected term',
      definitionDE: 'Nur für den isolierten Skill-Engine-Vertragstest.',
      definitionEN: 'Used only for the isolated Skill Engine contract test.',
      aliases: ['InjectedAlias'],
      forbiddenTerms: [],
      category: 'platform',
      status: 'approved',
      version: '1.0.0',
      essReferences: ['ESS-0017'],
      adrReferences: ['ADR-0078'],
      traceabilityReferences: [],
    });
    const skill = {
      ...skillCatalog[0],
      id: 'SKILL-TEST-INJECTED-VOCABULARY',
      vocabularyTerms: ['InjectedAlias', 'UnregisteredCandidate'],
    };

    const inventory = buildVocabularyInventory([skill], registry);

    expect(inventory.find((entry) => entry.term === 'InjectedAlias')).toMatchObject({
      status: 'ALIAS',
      conceptId: 'VOC-PLATFORM-9999',
      canonicalTerm: 'InjectedTerm',
    });
    expect(inventory.find((entry) => entry.term === 'UnregisteredCandidate')).toMatchObject({
      status: 'NEW_CANDIDATE',
      conceptId: null,
      canonicalTerm: null,
    });
    expect(registry.resolveTerm('UnregisteredCandidate')).toBeUndefined();
  });

  it('does not bake a provider or autonomous mutation into the base prompt', () => {
    expect(SKILL_ENGINE_SYSTEM_PROMPT).toContain('read-only');
    expect(SKILL_ENGINE_SYSTEM_PROMPT).toContain('Do not mutate');
    expect(SKILL_ENGINE_SYSTEM_PROMPT).not.toContain('gpt-');
    expect(SKILL_ENGINE_SYSTEM_PROMPT).not.toContain('Claude');
  });
});
