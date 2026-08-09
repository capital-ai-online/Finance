# CAPITAL-AI Canonical Vocabulary Registry

Authority: `ESS-0017` / `ESS-0017-CONTRACTS`  
Architecture decision: `ADR-0046`

## Deutsch

Die Vocabulary-Komponente ist die kanonische Terminologiequelle fuer CAPITAL-AI. Sie verwaltet stabile Concept-IDs, englische technische Begriffe, deutsche und englische Anzeigeformen, Aliase sowie verbotene Begriffe.

Phase 2 veraendert keine bestehenden Code-Namen. Ein bestehender Identifier wird erst in Phase 3 nach Safe-Rename-Impact-Analyse geaendert.

Die Registry erzeugt keinen zweiten Event Bus, Knowledge Graph oder Traceability Store. Phase 2 enthaelt absichtlich keine neuen Event-Namen; die spaetere EventMesh-Anbindung darf erst nach Abgleich mit dem kanonischen EventCatalog erfolgen.

### Verwendung

```ts
import { createDefaultVocabularyRegistry, VocabularyService } from './index';

const registry = createDefaultVocabularyRegistry();
const vocabulary = new VocabularyService(registry);

vocabulary.getCanonicalTerm('Abonnement'); // Subscription
vocabulary.getDisplayName('Subscription', 'de'); // Abonnement
```

### Validierung

Contract-Test:

```text
npx tsx src/platform/Vocabulary/Tests/vocabularyRegistry.test.ts
```

Geprueft werden unter anderem Concept-ID-Format, technische Begriffe, Authority-Referenzen, Alias-Kollisionen, DE/EN-Aufloesung und Immutable Snapshots.

## English

The Vocabulary component is CAPITAL-AI's canonical terminology source. It manages stable concept identities, English technical terms, German and English display mappings, aliases, forbidden terms and deterministic collision detection.

Phase 2 does not rename existing runtime identifiers. Active renames are deferred to the Safe Rename Gate in Phase 3.

The component does not introduce a second Event Bus, Knowledge Graph or Traceability store. No new event type is registered in Phase 2; EventMesh integration requires canonical EventCatalog compatibility validation first.
