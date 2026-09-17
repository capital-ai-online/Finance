# CAPITAL-AI Documentary Engine & Event-Driven Value Chain Roadmap

Status: ACTIVE  
Date: 2026-08-10  
Primary Authority: ESS-0010 Documentary Engine  
Related Authorities: ESS-0011 Traceability, ESS-0012 Documentation Governance, ESS-0017 Vocabulary Governance  
Foundation: Vocabulary Governance Roadmap COMPLETE / OPERATIONAL

## 1. Zielbild

Die nächste Entwicklungsstufe macht Documentary zu einer ausführbaren Plattformkomponente statt eines überwiegend vorbereiteten Zielbaums. Dokumentation soll aus Code-, Architektur-, Event-, Versionierungs- und Release-Evidence deterministisch abgeleitet, versioniert, geprüft und über die bestehende Event-Driven Value Chain aktualisiert werden. Dokumentationshygiene wird dabei kontinuierlich statt punktuell betrieben.

Schutzgrenzen:
- keine zweite EventMesh-Implementierung;
- keine zweite Vocabulary- oder Traceability-Authority;
- keine autonome Architektur- oder Release-Freigabe;
- keine Dokumentgenerierung ohne Provenance/Evidence;
- keine automatische Mutation geschützter Contracts, APIs, DB-Schemas oder ENV Keys;
- bestehende GitHub-Actions-Budgetrichtlinie bleibt bindend.

## 2. Aktueller Documentary-Stand

Documentary ist derzeit nur teilweise implementiert. Produktiv vorhanden ist der bilinguale Vocabulary-basierte Contract-/Projection-Layer. Mehrere vorgesehene Bereiche (`Engine`, `Events`, `Generators`, `Discovery`, `Knowledge`, `Mermaid`, `Migration`, `Models`, `Plugins`, `Interfaces`) sind noch überwiegend Zielstruktur. README und Manifest weisen die Komponente entsprechend als Partial Implementation / development aus.

Zusätzlich besteht Versionsdrift: `README.md` nennt Documentary Version 1.1.0, während `manifest.json` Version 1.0.0 führt. Diese Inkonsistenz wird als früher Roadmap-Blocker behandelt.

## 3. Workstream D — Documentary Engine

### D0 — Baseline, Manifest und Version Authority
Priorität: P0

- Documentary-README, Manifest, ESS-0010 und realen Codebestand gegeneinander validieren.
- eine eindeutige Documentary-Komponentenversion definieren;
- Version Manager als Quelle für Release-/Platform-Versionen anbinden;
- Component-Version, Document-Schema-Version und Plattformversion semantisch trennen;
- Versionierungsregeln für generierte Dokumente definieren;
- Manifest-Integrität um Implementierungsgrad und reale Dateien erweitern;
- leere Placeholder-Strukturen entweder mit geplantem Status kennzeichnen oder erst bei Implementierung materialisieren.

Exit: keine Versionsdrift; Manifest entspricht realem Codebestand; Versionierungscontract ist getestet.

### D1 — Code Integration & Discovery
Priorität: P0

- read-only Code Discovery für Module, Exports, Contracts, Routes, Events und Manifeste;
- Code-Evidence mit Commit-SHA, Pfad, Symbol und Component-ID versehen;
- dokumentierbare Komponenten automatisch inventarisieren;
- Abhängigkeiten und Import-/Export-Beziehungen als Evidence bereitstellen;
- keine AST-basierte Mutation; Discovery bleibt read-only.

Exit: Documentary kann aus dem aktuellen Repository reproduzierbar eine Code-Evidence-Map erzeugen.

### D2 — Documentary Core Engine
Priorität: P0

- `DocumentaryEngine` als Orchestrierungsservice implementieren;
- Input: Evidence + Concept IDs + Traceability + Version Context;
- Output: deterministische Document Models, nicht direkt freie Markdown-Texte;
- idempotente Verarbeitung über Correlation-/Evidence-IDs;
- fail-closed bei fehlender Authority, Provenance oder Version;
- Human-Approval für geschützte Dokumentklassen.

Exit: ein dokumentierter Komponenten-Use-Case läuft vollständig über den Engine-Contract.

### D3 — Document Models, Schemas & Provenance
Priorität: P0

- typisierte Document Model Contracts;
- `documentId`, `documentType`, `schemaVersion`, `componentVersion`, `platformVersion`, `sourceCommit`, `generatedAt`, `reviewStatus`;
- Provenance für Code, ESS, ADR, Vocabulary, Event und manuelle Evidence;
- Statusmodell: draft / generated / reviewed / approved / superseded / archived;
- Hash/Fingerprint zur Drift- und Reproduzierbarkeitsprüfung.

Exit: jedes generierte Dokument ist versioniert, provenance-fähig und reproduzierbar.

### D4 — Generators & Bilingual Rendering
Priorität: P1

- Markdown Generator;
- DE/EN Rendering aus gemeinsamer semantischer Identität;
- Mermaid/Diagramm-Generator auf strukturierten Models;
- Templates für Architecture, Component, API, Runbook, Release Evidence und Handoff;
- Vocabulary- und Naming-Gates vor Ausgabe;
- keine voneinander unabhängigen DE-/EN-Quellen.

Exit: beide Sprachen werden aus demselben Document Model erzeugt.

### D5 — Traceability Integration
Priorität: P0

- ESS ↔ ADR ↔ Code ↔ Tests ↔ Events ↔ Documents ↔ Release verbinden;
- Traceability IDs in Document Models verpflichtend machen;
- orphaned Documents und orphaned Code Components erkennen;
- Impact-Analyse bei Code-/Contract-Änderungen bereitstellen.

Exit: Documentary-Ausgaben sind bidirektional zur Enterprise Traceability verknüpft.

### D6 — Knowledge Integration
Priorität: P1

- freigegebene Documentary-Ausgaben in Knowledge-Projektionen überführen;
- superseded/archived Inhalte aus aktuellen Knowledge Views ausschließen;
- Concept-ID und Provenance erhalten;
- keine separate Knowledge-Authority erzeugen.

Exit: Knowledge konsumiert ausschließlich freigegebene, versionierte Documentary-Artefakte.

### D7 — Governance, Review & Quality
Priorität: P0

- Documentation Governance Validator direkt anbinden;
- Pflichtfelder, Links, Versionen, Vocabulary, Traceability und Provenance prüfen;
- Review-/Approval-Grenzen je Dokumentklasse definieren;
- stale, duplicate, conflicting und orphaned Dokumente erkennen;
- Audit Evidence für automatische Generierung speichern.

Exit: kein geschütztes Dokument kann ohne Governance-Gate als approved gelten.

### D8 — Migration & Legacy Compatibility
Priorität: P1

- bestehende manuelle Dokumente klassifizieren: canonical / generated / evidence / legacy / archive;
- aktuelle Root-Kompatibilitätsausnahmen wie `DATENSCHUTZ_PROTOKOLL.md` kontrolliert migrieren;
- Runtime-Referenzen vor Moves aktualisieren;
- Redirect-/Alias-Strategie für dokumentierte Pfade definieren;
- keine historischen Evidence-Inhalte umschreiben.

Exit: aktive Dokumentation folgt der kanonischen Hierarchie; historische Evidence bleibt unverändert nachvollziehbar.

### D9 — Documentary Observability
Priorität: P2

- Metriken: freshness, coverage, orphan rate, stale rate, generation failures, approval latency;
- strukturierte Logs mit correlationId/documentId;
- Health Report für Documentary-Komponente;
- keine personenbezogenen oder geheimen Inhalte in Telemetrie.

Exit: Documentary-Qualität ist messbar und auditierbar.

## 4. Weitere verbesserungsbedürftige Documentary-Punkte

1. Vollständige Engine fehlt; aktuell existiert primär der Bilingual-Layer.
2. README-/Manifest-Versionen sind inkonsistent.
3. Code Discovery ist nicht als produktiver Documentary-Input implementiert.
4. Dokument-Schema-/Component-/Platform-Versionen sind nicht sauber getrennt.
5. Generators sind noch nicht als ausführbare Pipeline implementiert.
6. Documentary-spezifische Event Producer/Consumer sind nicht vollständig verdrahtet.
7. Traceability ist noch nicht verpflichtender Bestandteil jedes Document Models.
8. Knowledge-Projektion ist noch nicht produktiv an approved Documents gekoppelt.
9. Provenance/Fingerprints für generierte Inhalte fehlen.
10. Review-/Approval-Lifecycle ist nicht vollständig implementiert.
11. Stale-/Duplicate-/Conflict-/Orphan-Erkennung muss automatisiert werden.
12. Mermaid-/Architecture-Diagramme sind noch nicht modellgetrieben generiert.
13. Legacy-/Migration-Pfade benötigen kontrollierte Runtime-Kompatibilität.
14. Dokumentations-Freshness und Coverage besitzen noch keine operativen SLOs/KPIs.
15. Component-Manifeste und Documentary müssen stärker automatisch synchronisiert werden.
16. Release-/Deployment-Evidence muss Documentary deterministisch aktualisieren können.
17. Fehler-/Retry-/Idempotency-Verhalten der Engine ist noch zu definieren und zu testen.
18. Security-/Compliance-Klassifizierung für sensible Dokumenttypen muss in den Generator-Contract einfließen.

## 5. Workstream E — Event-Driven Value Chain 2.0

### E0 — Event Contract Inventory
Priorität: P0

- Producer/Consumer-Matrix aller kanonischen Events erzeugen;
- Events ohne Producer, Consumer oder Authority erkennen;
- Event-Versionen und Payload-Schemas inventarisieren;
- keine neuen Events anlegen, solange ein bestehender kanonischer Event geeignet ist.

### E1 — Documentary Event Integration
Priorität: P0

Zielkette:
`Code/Architecture Change -> Supervisor Evidence -> Platform Decision -> EventMesh -> Documentary Impact -> Traceability -> Quality/Security/Compliance -> Version Manager -> Release Evidence`.

- Documentary konsumiert nur freigegebene relevante Events;
- `correlationId` über die gesamte Kette erhalten;
- Documentary-Ausgabe erzeugt Folge-Evidence, keine autonome Entscheidung.

### E2 — Idempotency, Ordering & Replay
Priorität: P0

- deduplication/idempotency keys;
- definierte Ordering-Grenzen;
- Replay-Verhalten für Documentary/Knowledge-Projektionen;
- Dead-letter-/Failure-Evidence statt stiller Verluste;
- Tests für doppelte und verspätete Events.

### E3 — Version-Aware Events
Priorität: P0

- Event schemaVersion;
- producerComponentVersion;
- sourceCommit/platformVersion;
- Compatibility Policy für Payload-Änderungen;
- Breaking Changes nur über ADR/Contract-Versionierung.

### E4 — End-to-End Traceability
Priorität: P1

- correlationId + causationId + evidenceId;
- Event → Decision → Document → Version → Release nachvollziehbar;
- Audit Query/Report für eine komplette Wertschöpfungskette.

### E5 — Reliability & Observability
Priorität: P1

- Event throughput/failure/retry/latency metrics;
- Consumer Health;
- Poison-event-Erkennung;
- strukturierte Audit Logs;
- keine zusätzliche Vollpipeline für reine Observability-Checks.

### E6 — Governance Boundaries
Priorität: P0

- Human Approval bleibt vor geschützten Platform Decisions;
- Quality/Security/Compliance können blockieren;
- Version Manager darf nur verifizierte Evidence übernehmen;
- Render-Deploy bleibt ausschließlich nach verifiziertem `main`-CI möglich.

## 6. Workstream H — Documentation Hygiene 2.0

### H0 — Canonical Folder Policy
- erlaubte Root-Dokumente explizit definieren;
- neue lose Dokumente im CI blockieren;
- Fachordner anhand Document Type/Authority festlegen.

### H1 — Continuous Orphan/Stale Detection
- unreferenzierte Dokumente erkennen;
- Links und Cross References validieren;
- Dokumente gegen reale Code-/Manifest-Komponenten prüfen;
- Stale-Schwellen nach Dokumenttyp definieren.

### H2 — Archive Lifecycle
- Archivierung statt Löschung für historische Evidence;
- `supersededBy`/`archivedAt`/`sourceVersion` Metadaten;
- Archive vom aktuellen Governance-/Vocabulary-Status sauber trennen.

### H3 — Runtime Path Hygiene
- `DATENSCHUTZ_PROTOKOLL.md` nach `docs/compliance/` migrieren;
- `MarkdownOrchestrator` und andere Runtime-Pfade gleichzeitig aktualisieren;
- Hardcoded Document Paths durch Registry/Document IDs ersetzen.

### H4 — Registry & Index
- maschinenlesbarer Document Registry/Index;
- Document ID statt Dateipfad als stabile Identität;
- Type, owner, authority, version, language, lifecycle status und path registrieren.

### H5 — Hygiene CI Gate
- Root Policy, orphan detection, broken links, duplicate IDs und version drift prüfen;
- vorhandenen CI-Hauptlauf nutzen;
- keine zweite vollständige Actions-Pipeline.

## 7. Empfohlene Ausführungsreihenfolge

1. D0 — Documentary Baseline & Version Authority.
2. D1 + D3 — Code Discovery sowie Document Models/Provenance.
3. E0 + E3 — Event Inventory und versionierte Event Contracts.
4. D2 — Documentary Core Engine.
5. D5 + E1 + E4 — Traceability und End-to-End Event Integration.
6. D7 + E2 + E6 — Governance, Idempotency und Protected Boundaries.
7. D4 + D6 — Bilingual Generators und Knowledge Projection.
8. H0 + H4 + H5 — Document Registry und kontinuierliche Hygiene-Gates.
9. D8 + H1 + H2 + H3 — Legacy-/Archive-/Runtime-Pfadmigration.
10. D9 + E5 — Observability und operative Qualitätsmetriken.

Jeder Schritt wird als separater Draft-PR auf einem zuvor verifizierten `main` ausgeführt. Aktive Code-/Contract-Migrationen werden vorab auf Dependency-, Regex-, Manifest-, Event- und Deployment-Auswirkungen geprüft.

## 8. Programm-Exit-Kriterien

Das Programm gilt als abgeschlossen, wenn:
- Documentary eine reale, getestete Engine statt nur Zielstruktur besitzt;
- Code-Evidence und Versionierung deterministisch in Document Models eingehen;
- DE/EN aus derselben semantischen Quelle erzeugt werden;
- Traceability vom Code bis Release bidirektional nachvollziehbar ist;
- Event-Verarbeitung versioniert, idempotent, replay-fähig und beobachtbar ist;
- Dokumentationshygiene kontinuierlich durch Registry und CI geschützt wird;
- keine aktuelle Authority als loses/verwaistes Dokument außerhalb der kanonischen Struktur existiert;
- alle geschützten Entscheidungen weiterhin Human-/Governance-Gates respektieren;
- CI-/Render-Deployment-Grenzen und Budget Policy unverändert eingehalten werden.
