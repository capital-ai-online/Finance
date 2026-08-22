# ESS-0017-CONTRACTS

## Vocabulary / Wording Governance Contracts

### Version

1.8.0

### Status

Published Enterprise Specification — Human Merge satisfied by PR #477

---

## Dokumentklassifizierung

Dieses Dokument definiert ausschließlich Vocabulary-, Terminology-, Naming-, Message-, Usage-, Delivery-, Wiki-Projection-, Migration- und Closure-Verträge für ESS-0017.

Es definiert keine globale Repository-, Financial-Runtime-, Event-, Security-, Compliance-, IAM-, Billing-, Release-, Deployment- oder Documentation-Governance. Diese verbleiben in den zuständigen Authorities. Recency, Übersetzung, Wiki oder UI-Projektion erzeugen keine höhere Authority.

---

# Chapter 1 — Canonical Concept Contract

Jeder Vocabulary-Eintrag besitzt stabilen `id`, `canonicalCodeTerm`, DE/EN-Namen und Definitionen, Aliase, Forbidden Terms, Category, Status, Version sowie ESS-/ADR-/Traceability-Referenzen.

Concept IDs folgen `VOC-<CATEGORY>-<NNNN>`, werden nicht wiederverwendet und bleiben nach Deprecation/Retirement für historische Resolution verfügbar.

W3C SKOS ist Referenzmodell für eine spätere explizite Trennung von Preferred-, Alternative- und Hidden-Labels. `forbiddenTerms` bleibt eine CAPITAL-AI-Governance-Erweiterung.

# Chapter 2 — Naming / Safe Rename Contract

Technische Identifier und stabile UI Message Keys sind Englisch. Ein aktiver technischer Rename bleibt am bestehenden Safe Rename Gate gebunden und darf nicht allein durch Vocabulary autorisiert werden.

# Chapter 3 — Source Authority Contract

Kanonische Vocabulary-/Wording-Entscheidungen dürfen aus aktuellen fachlichen Runtime Contracts, ESS/Contracts, Accepted/aktiven ADRs, Registry-Einträgen, Traceability Evidence, aktuellen Architecture Specifications und revalidierter Domain-Dokumentation abgeleitet werden.

Nicht automatisch autoritativ sind Legacy-Dokumente, historische Snapshots, superseded Roadmaps/Blueprints, GitHub Wiki, unrevalidierte Provider-/Modelldokumentation oder neuere Dateien allein aufgrund ihres Datums.

# Chapter 4 — UI Message Catalog Contract — VW-1

Jede governed Message besitzt stabilen englischen `key`, `text.de`, `text.en`, mindestens eine `conceptId`, Context, Status, Version, deklarierte Placeholder sowie zusätzliche fachliche Authorities falls erforderlich.

Zulässige Contexts:

```text
react | pdf | email | seo | accessibility | shared
```

Fail-closed sind ungültige Keys/Versionen, fehlende DE/EN-Texte, unbekannte Concepts, Key-Kollisionen, doppelte/ungültige Placeholder, deklarierte Placeholder die in einer Sprache fehlen sowie im Text vorhandene aber nicht deklarierte Placeholder.

# Chapter 5 — FinTech Value-Chain Wording Projection — VW-2

Vocabulary/Wording ist eine read-only Cross-Cutting Projection von `SC-MD-SPT-0001` und niemals eine zusätzliche Financial Runtime Stage.

Jede der 18 aktuellen Stufen besitzt genau ein Binding mit `stageId`, `stageName`, `conceptIds`, `messageKeys`, `authorityReferences`, `financialDecisionAuthority: false` und `mutationAuthority: false`.

Die Stage IDs werden gegen die bestehende Quality Value-Chain Projection korreliert. Vocabulary darf IAM, Entitlements, Market Data, Evidence, Provenance, Classification, Scoring, Confidence, Ranking, Eligibility, Provider Routing, Release oder Deployment nicht verändern.

# Chapter 6 — Wording Usage Index — VW-3

Usage Records enthalten Message Key, Concepts, Delivery Surface, Source Path sowie optional Feature/Route und FinTech Stage IDs. Der Scanner erfasst nur explizite stabile Keys und darf Nutzung nicht aus ähnlichem Freitext erfinden.

Reverse Impact:

```text
Concept -> Message Keys -> Source/Feature/Route -> Surface -> FinTech Stage
```

Der Index ist read-only Evidence.

# Chapter 7 — Delivery Adapter Contract — VW-4

Read-only Adapter existieren für React, PDF, E-Mail, SEO und Accessibility. Context-spezifische Messages dürfen nicht über eine andere Surface ausgeliefert werden; `shared` ist wiederverwendbar. Retired Messages oder fehlende Placeholder-Werte fail-closed.

# Chapter 8 — Documentary / Knowledge / Traceability Handoff — VW-5

Vocabulary erzeugt ausschließlich einen neutralen, exact-commit-bound `VocabularyWordingSnapshot` mit Concepts, Messages, tatsächlichen Usage Records, 18-stage Bindings, Authorities, Checksum und expliziten Non-Authority-Flags.

Documentary konsumiert diesen Snapshot und verwendet ausschließlich bestehende Contracts:

1. `createDocumentaryDocument()`;
2. D7 `projectDocumentaryKnowledge()`;
3. `buildDocumentaryTraceabilityRecord()`.

Ein zweiter Knowledge Graph oder Traceability Store ist verboten.

# Chapter 9 — GitHub Wiki Projection — VW-6

Die Wiki-Projektion ist deterministisch, exact-commit-bound und nicht autoritativ. Managed Markdown darf nur aus kanonischen Repositorydaten erzeugt werden.

Der Sync-Vertrag verlangt:

- bestehendes Git-Checkout mit Origin `Finance.wiki.git`;
- sauberen Worktree;
- Dry-Run als Default;
- explizites `--apply` vor Dateimutationen;
- separates `--push` vor Netzwerkpublikation;
- ausschließlich verwaltete Pages/Manifest im Staging;
- niemals automatische Rückschreibung von Wiki zu Repository Authorities.

Wiki-Publikation ist keine Merge-/Release-/Production-Authority.

# Chapter 10 — Controlled Wording Migration — VW-7

Jede Source-Migration wird explizit als Candidate mit stabiler Migration-ID, exact `sourcePath`, exact aktuellem `literal`, canonical `messageKey`, Surface und `automaticApplyAllowed: false` erfasst.

States:

```text
OPEN      governed literal remains queued
MIGRATED  stable Message Key replaces the literal
DRIFT     mapping is ambiguous or broken
```

`OPEN` ist zulässiger messbarer Migrations-Backlog. `DRIFT` blockiert das Governance-Gate. Blindes repositoryweites Regex-/Text-Replacement ist verboten.

Security-, Compliance-, Legal-, Billing-, IAM- oder Financial-Wording benötigt weiterhin die zuständige Parent Authority; Vocabulary darf solche Aussagen nicht eigenständig semantisch verändern.

# Chapter 11 — Continuous Governance / Closure — VW-8

Die vorhandene Repository-Test-/Quality-Kette wird wiederverwendet. Es entsteht kein zweiter CI-Control-Plane.

Closure muss mindestens prüfen:

- Vocabulary-Manifest/ESS-Registry-Versionen und `ADR-0078`;
- VW-0 bis VW-8 Completion Metadata;
- vollständige 18-stage Coverage;
- `financialDecisionAuthority=false` und `mutationAuthority=false`;
- deterministische Wiki-Projektion und Publish-Gates;
- null `DRIFT` im Migrationsplan;
- erforderliche Architecture-/Work-Package-Artefakte;
- bestehende Documentary-/Knowledge-/Traceability-Reuse-Boundary.

Der normale Repository-Testpfad darf die read-only Vocabulary Governance Checks aufrufen. Kostenverursachende Hosted CI bleibt post-PR gemäß Repository-Governance.

# Chapter 12 — Supersession / Human Approval

`VOCABULARY-WORDING-WIKI-SUPERSESSION-0001` ist seit Human Merge von PR #477 die aktuelle Vocabulary/Wording/Wiki-Architekturprojektion. Historische Dokumente bleiben Evidence und werden nur nach Reference-/Registry-Korrelation archiviert.

Semantische Änderungen mit Security-, Compliance-, Legal-, Billing-, IAM- oder Financial-Impact benötigen weiterhin die zuständige fachliche Authority und Human/Owner Review.

# Success Criteria through VW-8

- Canonical Concepts/DE-EN mappings bleiben deterministisch und collision-checked.
- Aktive Vocabulary Authority referenziert `ADR-0078`.
- Message Catalog, Placeholder-Contract und Delivery Boundaries sind fail-closed.
- Alle 18 `SC-MD-SPT-0001` Stufen besitzen read-only Bindings.
- Usage Index liefert evidenzbasierte Reverse-Impact-Daten.
- Documentary nutzt bestehende D7-/Traceability-Contracts.
- Wiki-Projektion ist deterministisch, one-way und nicht autoritativ.
- Controlled Migration macht Hardcoding-Debt als `OPEN` sichtbar und blockiert `DRIFT`.
- Continuous Governance ist in die bestehende Test-/Quality-Kette integriert.
- Keine zweite Knowledge-, Traceability-, Event-, Financial Runtime-, CI- oder Release-Authority entsteht.
- Keine externe Wiki-/Supabase-/Render-/Stripe-/IAM-/Production-Mutation wird durch diesen Contract autorisiert.
