import type { IVocabularyRegistry } from '../../Vocabulary/Interfaces/IVocabularyRegistry';
import type {
  BilingualDocumentPair,
  BilingualDocumentReference,
  DocumentaryLocale,
} from '../Contracts/BilingualDocumentReference';

function projectLocale(
  registry: IVocabularyRegistry,
  conceptId: string,
  locale: DocumentaryLocale,
): BilingualDocumentReference {
  const concept = registry.getById(conceptId);
  if (!concept) {
    throw new Error(`Unknown vocabulary concept: ${conceptId}`);
  }
  if (concept.status !== 'approved') {
    throw new Error(`Vocabulary concept is not approved: ${conceptId}`);
  }

  const title = locale === 'de' ? concept.displayNameDE : concept.displayNameEN;
  const definition = locale === 'de' ? concept.definitionDE : concept.definitionEN;
  if (!title.trim() || !definition.trim()) {
    throw new Error(`Missing ${locale.toUpperCase()} documentary translation for ${conceptId}`);
  }

  return Object.freeze({
    conceptId: concept.id,
    locale,
    title,
    definition,
    canonicalCodeTerm: concept.canonicalCodeTerm,
    essReferences: [...concept.essReferences],
    adrReferences: [...concept.adrReferences],
    traceabilityReferences: [...concept.traceabilityReferences],
  });
}

export function createBilingualDocumentPair(
  registry: IVocabularyRegistry,
  conceptId: string,
): BilingualDocumentPair {
  const de = projectLocale(registry, conceptId, 'de');
  const en = projectLocale(registry, conceptId, 'en');

  if (de.conceptId !== en.conceptId || de.canonicalCodeTerm !== en.canonicalCodeTerm) {
    throw new Error(`Bilingual documentary drift detected for ${conceptId}`);
  }

  return Object.freeze({ conceptId, de, en });
}

export function createDocumentReference(
  registry: IVocabularyRegistry,
  conceptId: string,
  locale: DocumentaryLocale,
): BilingualDocumentReference {
  return projectLocale(registry, conceptId, locale);
}
