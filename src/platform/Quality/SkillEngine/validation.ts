import { normalizeVocabularyTerm } from '../../Vocabulary';
import { errorClassById } from './errorClasses';
import type { CatalogValidationFinding, VerificationSkill } from './types';

export function validateSkillCatalog(skills: VerificationSkill[]): CatalogValidationFinding[] {
  const findings: CatalogValidationFinding[] = [];
  const skillIds = new Set<string>();
  const quickWinIds = new Set<string>();
  const developmentIds = new Set<string>();

  for (const skill of skills) {
    if (skillIds.has(skill.id)) {
      findings.push({ code: 'SKILL_ID_DUPLICATE', severity: 'error', message: `Duplicate skill id: ${skill.id}`, skillId: skill.id });
    }
    skillIds.add(skill.id);

    if (skill.componentPaths.length === 0) findings.push({ code: 'MISSING_COMPONENT_PATH', severity: 'error', message: 'Component path is required.', skillId: skill.id });
    if (skill.focus.length === 0) findings.push({ code: 'MISSING_FOCUS', severity: 'error', message: 'At least one verification focus is required.', skillId: skill.id });
    if (skill.authorities.length === 0) findings.push({ code: 'MISSING_AUTHORITY', severity: 'error', message: 'At least one authority reference is required.', skillId: skill.id });
    if (skill.vocabularyTerms.length === 0) findings.push({ code: 'MISSING_VOCABULARY', severity: 'warning', message: 'No vocabulary seed terms declared.', skillId: skill.id });

    for (const errorClassId of skill.errorClassIds) {
      if (!errorClassById.has(errorClassId)) {
        findings.push({ code: 'UNKNOWN_ERROR_CLASS', severity: 'error', message: `Unknown error class ${errorClassId}.`, skillId: skill.id });
      }
    }

    const normalizedVocabulary = new Set<string>();
    for (const term of skill.vocabularyTerms) {
      const normalized = normalizeVocabularyTerm(term);
      if (normalizedVocabulary.has(normalized)) {
        findings.push({ code: 'DUPLICATE_SKILL_TERM', severity: 'warning', message: `Duplicate vocabulary term ${term}.`, skillId: skill.id });
      }
      normalizedVocabulary.add(normalized);
    }

    for (const quickWin of skill.quickWins) {
      if (quickWinIds.has(quickWin.id)) findings.push({ code: 'QUICK_WIN_ID_DUPLICATE', severity: 'error', message: `Duplicate quick-win id ${quickWin.id}.`, skillId: skill.id });
      quickWinIds.add(quickWin.id);
    }

    for (const development of skill.developments) {
      if (developmentIds.has(development.id)) findings.push({ code: 'DEVELOPMENT_ID_DUPLICATE', severity: 'error', message: `Duplicate development id ${development.id}.`, skillId: skill.id });
      developmentIds.add(development.id);
    }
  }

  return findings;
}
