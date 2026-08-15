# ADR-0077 — Canonical Naming, Bilingual Documentation & Vocabulary Governance

Status: Proposed  
Datum / Date: 2026-08-09  
Authority: ESS-0001-CONTRACTS  
Related: ESS-0012, ESS-0003, ESS-0009, ESS-0010, ESS-0011

## Numbering note

Formerly filed as ADR-0044 (number collision with production-runtime-artifact-immutability). Content unchanged; number reassigned under ADR-0081.

## Deutsch

### Kontext
CAPITAL-AI verwendet derzeit teilweise gemischte deutsche und englische technische Bezeichnungen sowie dezentrale UI- und Dokumentationstexte. Eine autonome AI-native Wertschöpfungskette benötigt eindeutige, maschinenlesbare und nachvollziehbare Begriffe.

### Entscheidung
1. Aktiver Code und technische Identifier werden ausschließlich in Englisch geführt.
2. Enterprise-Dokumentation wird in Deutsch und Englisch gepflegt.
3. Menschlich sichtbare Pull-Request-Informationen werden standardmäßig in deutscher Sprache geführt.
4. Eine zentrale Vocabulary Registry wird Single Source of Truth für kanonische Begriffe, Aliase, verbotene Varianten und Übersetzungen.
5. Naming- und Terminologievalidierung wird in Repository- und CI-Governance integriert.
6. Aktive Renames dürfen erst nach Safe-Rename-Impact-Analyse durchgeführt werden.
7. Regex-, Dateisystem-Casing-, Import-/Export-, Routing-, API-, Schema-, Test-, Build- und Deployment-Abhängigkeiten müssen vor einem Rename validiert werden.
8. Technische maschinenlesbare Marker und stabile Keys dürfen Englisch bleiben, auch wenn ihre sichtbare Beschreibung Deutsch ist.

### Konsequenzen
- Bestehende Namen werden nicht pauschal umbenannt.
- Migrationen erfolgen inkrementell nach Risiko und Evidence.
- UI- und Dokumentationsbegriffe werden aus kanonischen Concepts abgeleitet.
- PR-Template und PR-Validator müssen atomar synchronisiert werden.

## English

### Context
CAPITAL-AI currently contains a mixture of German and English technical naming and decentralized wording. An autonomous AI-native value chain requires unambiguous, machine-readable, traceable terminology.

### Decision
1. Active code and technical identifiers use English only.
2. Enterprise documentation is maintained in German and English.
3. Human-facing pull request information is written in German by default.
4. A central Vocabulary Registry becomes the source of truth for canonical terms, aliases, forbidden variants, and translations.
5. Naming and terminology validation becomes part of repository and CI governance.
6. Active renames require a Safe Rename impact analysis before implementation.
7. Regex, filesystem casing, dependency, routing, API, schema, test, build, and deployment effects must be validated before a rename.
8. Stable machine-readable markers and keys may remain English while their human-facing descriptions are German.

### Consequences
Existing code is not mass-renamed. Migration is incremental and evidence-driven. PR template and validation logic must remain synchronized.
