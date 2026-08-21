# ESS-0017-CONTRACTS

## Vocabulary / Wording Governance Contracts

### Version

1.5.0

### Status

Proposed Enterprise Specification — effective after Human Merge

---

## Dokumentklassifizierung

Dieses Dokument definiert ausschließlich Vocabulary-, Terminology-, Naming-, Message-, Usage- und Projection-Verträge für ESS-0017.

Es definiert keine globale Repository-, Financial-Runtime-, Event-, Security-, Compliance-, IAM-, Billing-, Release-, Deployment- oder Documentation-Governance. Diese verbleiben in den jeweils zuständigen Authorities. Bei Konflikt gilt die repositoryweite Authority Resolution; Recency, Übersetzung oder UI-Projektion erzeugen keine höhere Authority.

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

Concept IDs folgen `VOC-<CATEGORY>-<NNNN>`, sind unveränderlich und werden nach Retirement nie wiederverwendet.

W3C SKOS ist Referenzmodell für die spätere explizite Trennung von Preferred-, Alternative- und Hidden-Labels. `forbiddenTerms` bleibt eine CAPITAL-AI-Governance-Erweiterung und ist nicht mit Hidden Labels gleichzusetzen.

---

# Chapter 2 — Naming Contract

Technische Identifier, einschließlich stabiler UI Message Keys, sind Englisch. Bestehende Runtime-Identifier werden nicht allein aus Vocabulary-Gründen umbenannt; aktive Renames bleiben am Safe Rename Gate gebunden.

Human-facing DE/EN-Varianten müssen dieselben Concept IDs referenzieren. Ein Sprachwechsel darf keine technische Identity, Authority oder fachliche Entscheidung verändern.

---

# Chapter 3 — Alias / Forbidden-Term Contract

- Aliase müssen eindeutig einem Concept zugeordnet sein.
- Aliase dürfen nicht mit einem aktiven kanonischen Term eines anderen Concepts kollidieren.
- Forbidden Terms dürfen in neuem governed content nicht als Preferred Bezeichnung eingeführt werden.
- Historische Vorkommen bleiben Evidence und werden nicht blind ersetzt.
- Legacy-/Hidden-Term-Semantik ist such-/migrationsorientiert und niemals Preferred UI Output.

---

# Chapter 4 — Safe Rename Contract

Vor einem aktiven technischen Rename sind mindestens Repository-References, Imports/Exports, dynamische Imports, Routes/APIs/Schemas, Config/Environment-References, Regex/Naming Policies, Filesystem Casing, TypeScript/Lint, relevante Tests, Production Build und Deployment Readiness zu prüfen.

Ergebnis:

```text
SAFE | CONDITIONAL | BLOCKED
```

Nur `SAFE` darf automatisiert vorbereitet werden.

---

# Chapter 5 — Event Boundary

Vocabulary führt keinen zweiten Event Bus ein. Neue Vocabulary Events dürfen nur über die bestehende EventMesh registriert werden und nur dann, wenn kein semantisch äquivalentes kanonisches Event existiert.

---

# Chapter 6 — Source Authority Contract

Zulässige Quellen für kanonische Vocabulary-/Wording-Entscheidungen sind aktuelle fachliche Runtime Contracts, ESS/Contracts, aktive beziehungsweise Accepted ADRs, Registry-Einträge, Traceability Evidence, aktuelle Architecture Specifications und revalidierte Domain-Dokumentation.

Nicht automatisch autoritativ sind:

- Legacy-Dokumente;
- historische Evidence/Snapshots;
- superseded Roadmaps/Blueprints;
- GitHub-Wiki-Seiten;
- nicht revalidierte Provider-/Modell-Dokumentation;
- neuere Dateien allein aufgrund ihres Datums.

---

# Chapter 7 — UI Message Catalog Contract — VW-1

Jeder governed Message-Eintrag besitzt mindestens:

- stabilen englischen `key`;
- `text.de` und `text.en`;
- mindestens eine referenzierte `conceptId`;
- `context`;
- `status`;
- `version`;
- deklarierte `placeholders`, falls dynamisch;
- `authorityReferences`, wenn zusätzliche fachliche Authority erforderlich ist.

Initial zulässige Contexts:

```text
react | pdf | email | seo | accessibility | shared
```

Message Keys sind stabile technische Identity. Textänderungen ändern den Key nicht automatisch.

Der Catalog muss fail-closed reagieren auf:

- ungültige Key-Struktur;
- ungültige Version;
- fehlende DE/EN-Texte;
- unbekannte Concept IDs;
- inkonsistente Placeholder-Verträge;
- Key-Kollisionen.

VW-1 bis VW-5 implementieren nur deterministische deklarierte Placeholder-Ersetzung. Vollständige Unicode-MessageFormat-2-Semantik wird nicht behauptet.

---

# Chapter 8 — FinTech Value-Chain Wording Projection — VW-2

Vocabulary/Wording wird als read-only Cross-Cutting Projection an `SC-MD-SPT-0001` angebunden und niemals als zusätzliche Financial Runtime Stage.

Jede der 18 aktuellen Stufen besitzt genau ein Stage Binding mit:

- `stageId`;
- `stageName`;
- `conceptIds`;
- `messageKeys`;
- `authorityReferences`;
- `financialDecisionAuthority: false`;
- `mutationAuthority: false`.

Die Stage IDs müssen gegen die bestehende `FintechValueChainQualityProjection` geprüft werden. Eine parallele Financial-Stage-Authority ist verboten.

Vocabulary/Wording darf keine Entscheidung verändern über IAM, Entitlements, Market Data, Evidence, Provenance, Classification, Scoring, Confidence, Ranking, Eligibility, Provider Routing, Release oder Deployment.

Fail-closed Zustände (`DATA_UNAVAILABLE`, DENY, partial, ineligible oder semantisch äquivalent) dürfen nicht durch Darstellung hochgestuft werden.

---

# Chapter 9 — Wording Usage Index — VW-3

Ein Usage Record enthält mindestens:

- `messageKey`;
- `conceptIds`;
- Delivery Surface;
- `sourcePath`;
- optional Feature/Route;
- optional `fintechStageIds`.

Der Scanner erfasst nur explizite stabile Message-Key-Referenzen in Source-Dateien. Er darf keine Nutzung aus ähnlichem Freitext ableiten.

Reverse Impact muss mindestens abbilden:

```text
Concept
 -> Message Keys
 -> Source Paths / Features / Routes
 -> Delivery Surfaces
 -> FinTech Stage References
```

Der Usage Index ist read-only Evidence und autorisiert keine Source Mutation.

---

# Chapter 10 — Delivery Adapter Contract — VW-4

Read-only Delivery Adapter existieren für:

- React;
- PDF;
- E-Mail;
- SEO;
- Accessibility.

Ein context-spezifischer Message Key darf nur über die passende Surface ausgeliefert werden. `shared` ist surfaceübergreifend zulässig. Retired Messages und fehlende Placeholder Values werden fail-closed abgelehnt.

Die Adapter erzeugen keine Financial-, Legal-, Compliance-, Security- oder Billing-Authority.

---

# Chapter 11 — Documentary / Knowledge / Traceability Projection — VW-5

VW-5 erzeugt eine deterministische, commitgebundene Projection mit:

- Documentary Summary;
- Concept-, Message-, Source-, FinTech-Stage- und Authority-Nodes;
- Beziehungen `HAS_MESSAGE`, `USED_BY`, `PROJECTS_STAGE`, `GOVERNED_BY`;
- Traceability Edges;
- SHA-256 Checksum;
- `mutationAuthority: false`;
- `financialDecisionAuthority: false`.

Die Projection ist ein Handoff Contract. Sie persistiert keinen zweiten Knowledge Graph, keinen zweiten Traceability Store und publiziert noch nicht in das GitHub Wiki.

---

# Chapter 12 — GitHub Wiki Projection Boundary

GitHub Wiki ist ausschließlich eine später in VW-6 erzeugte one-way menschenlesbare Projektion:

```text
Finance.git authorities
 -> deterministic generated Markdown
 -> controlled Wiki sync
 -> Finance.wiki.git
```

Wiki-Content ist niemals Authority und darf nicht automatisch in Registry, ESS, ADR oder Message Catalog zurückschreiben.

---

# Chapter 13 — Supersession / Approval Contract

`VOCABULARY-WORDING-WIKI-SUPERSESSION-0001` ersetzt die bisherigen phasenbasierten Vocabulary-Migrations-/Statusdokumente als aktuelle Architekturprojektion nach Human Merge.

Historische Dokumente bleiben Evidence. Physische Archivierung erfolgt erst nach Reference-/Registry-Korrelation.

Semantische Wording-Änderungen mit Security-, Compliance-, Legal-, Billing-, IAM- oder Financial-Impact benötigen zusätzlich die zuständige fachliche Authority und Human/Owner Review.

---

# Success Criteria through VW-5

- Canonical Concepts sind deterministisch validierbar.
- DE/EN Mapping referenziert dieselbe Concept Identity.
- Aktive Vocabulary References verwenden ADR-0078 statt der historischen ADR-0046-Display-ID.
- UI Message Catalog validiert stabile Keys, DE/EN, Concepts und Placeholder.
- Alle 18 `SC-MD-SPT-0001`-Stufen besitzen read-only Wording Bindings.
- Usage Index liefert ausschließlich evidenzbasierte Reverse Impact Information.
- Delivery Adapter respektieren Surface Boundaries.
- Documentary/Knowledge/Traceability Projection ist commitgebunden und deterministisch.
- Keine zweite Knowledge-, Traceability-, Event- oder Financial Runtime Authority entsteht.
- GitHub Wiki bleibt bis VW-6 unpubliziert.
