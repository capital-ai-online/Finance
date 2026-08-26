import {
  createDefaultVocabularyRegistry,
  normalizeVocabularyTerm,
  type IVocabularyRegistry,
} from '../../Vocabulary';
import type { VocabularyInventoryEntry, VerificationSkill } from './types';

export function buildVocabularyInventory(
  skills: VerificationSkill[],
  registry: IVocabularyRegistry = createDefaultVocabularyRegistry(),
): VocabularyInventoryEntry[] {
  const usage = new Map<string, { term: string; skillIds: Set<string> }>();

  for (const skill of skills) {
    for (const term of skill.vocabularyTerms) {
      const key = normalizeVocabularyTerm(term);
      const current = usage.get(key) ?? { term, skillIds: new Set<string>() };
      current.skillIds.add(skill.id);
      usage.set(key, current);
    }
  }

  return [...usage.values()]
    .map(({ term, skillIds }) => {
      const forbiddenMatches = registry.findForbiddenUsage(term);
      const concept = registry.resolveTerm(term);

      if (forbiddenMatches.length > 0) {
        const forbiddenConcept = forbiddenMatches[0];
        return {
          term,
          normalizedTerm: normalizeVocabularyTerm(term),
          status: 'FORBIDDEN' as const,
          conceptId: forbiddenConcept.id,
          canonicalTerm: forbiddenConcept.canonicalCodeTerm,
          displayNameDE: forbiddenConcept.displayNameDE,
          displayNameEN: forbiddenConcept.displayNameEN,
          usedBySkillIds: [...skillIds].sort(),
        };
      }

      if (concept) {
        const canonicalForms = [concept.canonicalCodeTerm, concept.displayNameDE, concept.displayNameEN].map(
          normalizeVocabularyTerm,
        );
        const status = canonicalForms.includes(normalizeVocabularyTerm(term)) ? 'CANONICAL' as const : 'ALIAS' as const;
        return {
          term,
          normalizedTerm: normalizeVocabularyTerm(term),
          status,
          conceptId: concept.id,
          canonicalTerm: concept.canonicalCodeTerm,
          displayNameDE: concept.displayNameDE,
          displayNameEN: concept.displayNameEN,
          usedBySkillIds: [...skillIds].sort(),
        };
      }

      return {
        term,
        normalizedTerm: normalizeVocabularyTerm(term),
        status: 'NEW_CANDIDATE' as const,
        conceptId: null,
        canonicalTerm: null,
        displayNameDE: null,
        displayNameEN: null,
        usedBySkillIds: [...skillIds].sort(),
      };
    })
    .sort((a, b) => a.term.localeCompare(b.term));
}
