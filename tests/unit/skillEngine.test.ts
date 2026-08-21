import { describe, expect, it } from 'vitest';
import {
  SKILL_ENGINE_SYSTEM_PROMPT,
  buildVocabularyInventory,
  compileSkillPrompt,
  errorClasses,
  skillCatalog,
  validateSkillCatalog,
} from '../../src/platform/Quality/SkillEngine';

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
  });

  it('does not bake a provider or autonomous mutation into the base prompt', () => {
    expect(SKILL_ENGINE_SYSTEM_PROMPT).toContain('read-only');
    expect(SKILL_ENGINE_SYSTEM_PROMPT).toContain('Do not mutate');
    expect(SKILL_ENGINE_SYSTEM_PROMPT).not.toContain('gpt-');
    expect(SKILL_ENGINE_SYSTEM_PROMPT).not.toContain('Claude');
  });
});
