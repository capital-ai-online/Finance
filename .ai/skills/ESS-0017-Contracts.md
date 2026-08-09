# ESS-0017-CONTRACTS

## Vocabulary Governance Contracts

### Version

1.0.0

### Status

Proposed Enterprise Specification

---

## Dokumentklassifizierung

Dieses Dokument definiert ausschließlich Vocabulary-, Terminology- und Naming-Verträge für ESS-0017.

Es definiert keine globalen Repository-, Event-, Layer-, Security-, Release- oder Documentation-Governance-Regeln. Diese verbleiben in den jeweils zuständigen Authorities, insbesondere ESS-0001-CONTRACTS und ESS-0012/ESS-0012-CONTRACTS.

Bei Konflikt gilt folgende Reihenfolge:

1. ESS-0001-CONTRACTS für globale Enterprise Contracts;
2. bestehende Security-/Compliance-/IAM-Authorities;
3. ESS-0013/ESS-0013-CONTRACTS für EventMesh-Regeln;
4. ESS-0012/ESS-0012-CONTRACTS für Documentation Governance;
5. ESS-0017;
6. dieses Dokument für Vocabulary-spezifische Contract-Ausprägungen.

---

# Chapter 1 — Canonical Concept Contract

Jeder Vocabulary-Eintrag besitzt verbindlich:

- `id`
- `canonicalCodeTerm`
- `displayNameDE`
- `displayNameEN`
- `definitionDE`
- `definitionEN`
- `aliases`
- `forbiddenTerms`
- `category`
- `status`
- `version`
- `essReferences`
- `adrReferences`
- `traceabilityReferences`

Fehlt ein Pflichtfeld, ist der Eintrag nicht `approved`-fähig.

## Concept Identity

Format:

```text
VOC-<CATEGORY>-<NNNN>
```

Beispiele:

```text
VOC-BILLING-0001
VOC-ASSET-0004
VOC-IAM-0012
```

Die ID ist unveränderlich und wird nach Retirement nie wiederverwendet.

---

# Chapter 2 — Naming Contracts

## Technical Code Naming

Technische Identifier sind Englisch. Dies umfasst insbesondere:

- Dateien und Verzeichnisse des aktiven Codes;
- Komponenten, Klassen, Interfaces und Types;
- Funktionen, Methoden und Variablen;
- API-Felder und Schemas;
- Event-Namen;
- technische Konfigurationsschlüssel.

Ein bestehender Identifier darf nicht allein zur Erfüllung dieser Regel umbenannt werden. Für aktive Renames gilt zwingend der Safe Rename Contract.

## Human-Facing Documentation

Enterprise-Dokumentation wird in Deutsch und Englisch geführt. Beide Varianten referenzieren dieselben Concept IDs.

## Pull Request Information

Menschlich sichtbare Pull-Request-Informationen werden auf Deutsch geführt. Maschinenlesbare Schlüssel dürfen Englisch bleiben, wenn sie von Automationen oder Validatoren verarbeitet werden.

---

# Chapter 3 — Alias and Forbidden-Term Contracts

- Ein Alias muss genau einem kanonischen Concept zugeordnet sein.
- Ein Alias darf nicht gleichzeitig kanonischer Term eines anderen aktiven Concepts sein.
- `forbiddenTerms` dürfen in neuem governed content nicht als kanonische Bezeichnung eingeführt werden.
- Historische Vorkommen werden als Evidence klassifiziert und nicht blind ersetzt.
- Collision Detection ist vor Freigabe eines Concepts verpflichtend.

---

# Chapter 4 — Bilingual Mapping Contract

`displayNameDE` und `displayNameEN` gehören immer zur identischen Concept ID.

Fehlende Übersetzungen sind ein Governance Finding. Semantisch widersprüchliche Übersetzungen blockieren den Status `approved`.

Dokumentationsgeneratoren dürfen keine neue Concept ID erzeugen, nur weil eine Sprache einen anderen Ausdruck verwendet.

---

# Chapter 5 — Safe Rename Contract

Vor jedem Rename eines aktiven technischen Identifiers müssen mindestens folgende Prüfungen erfolgreich ausgeführt oder als Evidence bewertet werden:

1. Repository reference scan;
2. import/export dependency graph;
3. dynamic imports and lazy loading;
4. routes, APIs and schemas;
5. configuration and environment references;
6. regex and naming policies;
7. case-sensitive filesystem impact;
8. TypeScript/lint validation;
9. relevant tests;
10. production build;
11. deployment-readiness validation.

Ergebnis:

```text
SAFE
CONDITIONAL
BLOCKED
```

Nur `SAFE` darf automatisiert zur Umsetzung vorbereitet werden. `CONDITIONAL` und `BLOCKED` benötigen explizite Evidence und Entscheidung.

---

# Chapter 6 — Event Contracts

Vocabulary Governance führt keinen eigenen Event Bus ein.

Alle Events müssen über die bestehenden öffentlichen Interfaces der Enterprise Event Mesh veröffentlicht und konsumiert werden.

Vorgesehene Event-Typen, vorbehaltlich EventCatalog-Kompatibilitätsprüfung:

- `VocabularyConceptProposedEvent`
- `VocabularyConceptApprovedEvent`
- `VocabularyConceptDeprecatedEvent`
- `VocabularyTranslationMissingEvent`
- `VocabularyCollisionDetectedEvent`
- `VocabularyRenameImpactAssessedEvent`

Vor Registrierung ist zu prüfen, ob bereits ein semantisch äquivalentes kanonisches Event existiert.

## Event Payload Minimum

Vocabulary Events enthalten mindestens:

- `conceptId`
- `conceptVersion`
- `changeType`
- `evidenceReferences`
- `essReferences`
- `adrReferences`

Correlation und causation werden gemäß ESS-0001-CONTRACTS und ESS-0013-CONTRACTS übernommen.

---

# Chapter 7 — Source Authority Contract

Zulässige Quellen für kanonische Vocabulary-Entscheidungen:

1. aktueller aktiver Code;
2. ESS und Contracts;
3. aktive ADRs;
4. Registry-Einträge;
5. Traceability Evidence;
6. aktuelle Architecture Specifications;
7. revalidierte Domain-Dokumentation.

Nicht automatisch autoritativ:

- Legacy-Dokumente;
- historische Audit- oder Review-Snapshots;
- superseded blueprints;
- nicht revalidierte provider-/modellbezogene Dokumentation.

PR #142 dient als Klassifizierungsbasis für diese Unterscheidung.

---

# Chapter 8 — Traceability Contract

Jedes `approved` Concept muss mindestens auf seine fachliche Authority verweisen. Bei Architektur- oder Governance-Begriffen sind ESS-/ADR-Referenzen verpflichtend.

Vocabulary-Einträge werden nicht als paralleler Knowledge Graph modelliert. Beziehungen zu Komponenten, Events und Dokumenten werden über die bestehende Traceability-/Knowledge-Architektur angebunden.

---

# Chapter 9 — Validation

Vor Freigabe eines Concepts müssen mindestens validiert werden:

- eindeutige Concept ID;
- eindeutiger canonicalCodeTerm im Geltungsbereich;
- gültige DE/EN-Zuordnung;
- Alias-Kollisionen;
- Forbidden-Term-Kollisionen;
- Authority References;
- Event-Kompatibilität, wenn Events betroffen sind;
- Rename Impact, wenn aktiver Code betroffen ist.

Ein Finding ohne Evidence wird verworfen.

---

# Success Criteria

ESS-0017-CONTRACTS gilt als erfüllt, wenn:

- Concept Schema und IDs deterministisch validiert werden;
- DE/EN-Mapping aus einer gemeinsamen Concept Identity erfolgt;
- Aliase und Forbidden Terms kollisionsfrei geprüft werden;
- Safe Rename Gate vor aktiven Renames erzwungen wird;
- Events ausschließlich über die bestehende EventMesh laufen;
- Vocabulary keine parallele Knowledge-, Traceability- oder Event-Infrastruktur erzeugt;
- Legacy-Inhalte nur nach Revalidierung kanonische Terminologie beeinflussen.
