import type { VocabularyConcept, VocabularyFinding } from '../Domain/VocabularyConcept';

const CONCEPT_ID_PATTERN = /^VOC-[A-Z][A-Z0-9_]*-\d{4}$/;
const TECHNICAL_TERM_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/;

export class VocabularyValidator {
  validate(concept: VocabularyConcept): VocabularyFinding[] {
    const findings: VocabularyFinding[] = [];

    if (!CONCEPT_ID_PATTERN.test(concept.id)) {
      findings.push({
        code: 'INVALID_ID',
        conceptId: concept.id,
        message: `Concept ID must match ${CONCEPT_ID_PATTERN.source}`,
      });
    }

    if (!TECHNICAL_TERM_PATTERN.test(concept.canonicalCodeTerm)) {
      findings.push({
        code: 'INVALID_CANONICAL_TERM',
        conceptId: concept.id,
        message: 'canonicalCodeTerm must be an English-compatible technical identifier without whitespace or punctuation.',
      });
    }

    if (!concept.displayNameDE.trim() || !concept.displayNameEN.trim() || !concept.definitionDE.trim() || !concept.definitionEN.trim()) {
      findings.push({
        code: 'MISSING_TRANSLATION',
        conceptId: concept.id,
        message: 'German and English display names and definitions are required.',
      });
    }

    if (concept.status === 'approved' && concept.essReferences.length === 0 && concept.adrReferences.length === 0) {
      findings.push({
        code: 'MISSING_AUTHORITY',
        conceptId: concept.id,
        message: 'Approved concepts require at least one ESS or ADR authority reference.',
      });
    }

    this.findDuplicateValues(concept, concept.aliases, 'DUPLICATE_ALIAS', findings);
    this.findDuplicateValues(concept, concept.forbiddenTerms, 'DUPLICATE_FORBIDDEN_TERM', findings);

    return findings;
  }

  private findDuplicateValues(
    concept: VocabularyConcept,
    values: string[],
    code: 'DUPLICATE_ALIAS' | 'DUPLICATE_FORBIDDEN_TERM',
    findings: VocabularyFinding[],
  ): void {
    const seen = new Set<string>();
    for (const value of values) {
      const normalized = this.normalize(value);
      if (seen.has(normalized)) {
        findings.push({ code, conceptId: concept.id, message: `Duplicate term: ${value}` });
      }
      seen.add(normalized);
    }
  }

  normalize(value: string): string {
    return value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
  }
}
