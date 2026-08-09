import type { VocabularyConcept, VocabularyFinding } from '../Domain/VocabularyConcept';
import { VocabularyValidator } from '../Validators/VocabularyValidator';

export class VocabularyRegistry {
  private readonly concepts = new Map<string, VocabularyConcept>();
  private readonly termIndex = new Map<string, string>();

  constructor(private readonly validator = new VocabularyValidator()) {}

  register(concept: VocabularyConcept): void {
    const findings = this.validateForRegistration(concept);
    if (findings.length > 0) {
      const details = findings.map((finding) => `${finding.code}: ${finding.message}`).join('; ');
      throw new Error(`Vocabulary concept ${concept.id} is invalid: ${details}`);
    }

    if (this.concepts.has(concept.id)) {
      throw new Error(`Vocabulary concept ID already registered: ${concept.id}`);
    }

    const snapshot = this.freezeConcept(concept);
    this.concepts.set(snapshot.id, snapshot);

    for (const term of this.indexedTerms(snapshot)) {
      this.termIndex.set(this.validator.normalize(term), snapshot.id);
    }
  }

  registerAll(concepts: VocabularyConcept[]): void {
    for (const concept of concepts) {
      this.register(concept);
    }
  }

  getById(id: string): VocabularyConcept | undefined {
    return this.concepts.get(id);
  }

  resolveTerm(term: string): VocabularyConcept | undefined {
    const id = this.termIndex.get(this.validator.normalize(term));
    return id ? this.concepts.get(id) : undefined;
  }

  list(): VocabularyConcept[] {
    return [...this.concepts.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  findForbiddenUsage(term: string): VocabularyConcept[] {
    const normalized = this.validator.normalize(term);
    return this.list().filter((concept) =>
      concept.forbiddenTerms.some((candidate) => this.validator.normalize(candidate) === normalized),
    );
  }

  private validateForRegistration(concept: VocabularyConcept): VocabularyFinding[] {
    const findings = this.validator.validate(concept);

    for (const term of this.indexedTerms(concept)) {
      const normalized = this.validator.normalize(term);
      const existingId = this.termIndex.get(normalized);
      if (existingId && existingId !== concept.id) {
        findings.push({
          code: 'TERM_COLLISION',
          conceptId: concept.id,
          message: `Term "${term}" already belongs to ${existingId}.`,
        });
      }
    }

    return findings;
  }

  private indexedTerms(concept: VocabularyConcept): string[] {
    return [concept.canonicalCodeTerm, concept.displayNameDE, concept.displayNameEN, ...concept.aliases];
  }

  private freezeConcept(concept: VocabularyConcept): VocabularyConcept {
    return Object.freeze({
      ...concept,
      aliases: Object.freeze([...concept.aliases]) as unknown as string[],
      forbiddenTerms: Object.freeze([...concept.forbiddenTerms]) as unknown as string[],
      essReferences: Object.freeze([...concept.essReferences]) as unknown as string[],
      adrReferences: Object.freeze([...concept.adrReferences]) as unknown as string[],
      traceabilityReferences: Object.freeze([...concept.traceabilityReferences]) as unknown as string[],
    });
  }
}
