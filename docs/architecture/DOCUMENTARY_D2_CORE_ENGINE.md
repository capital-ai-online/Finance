# D2 — Documentary Core Engine

Status: IMPLEMENTED IN DRAFT  
Authority: ESS-0010 / ESS-0011 / ESS-0012  
Basis: D1 Code Evidence + D3 Document Models/Provenance + E0/E3 Event Version Evidence

## Ziel
D2 führt `DocumentaryEngine` als deterministische Orchestrierungsschicht ein. Die Engine erzeugt ausschließlich strukturierte `DocumentaryDocument`-Models und keine freien Markdown-Texte.

## Input Contract
Pflichtfelder sind `correlationId`, Document Identity/Type, vollständiger Source Commit, D1 `CodeEvidenceMap`, Vocabulary Concept IDs, Traceability IDs, D3 Version Context sowie Inhalt und Titel. Optionale zusätzliche Authority-Provenance kann ESS-, ADR-, Vocabulary-, Event- oder manuelle Evidence tragen.

## Fail-closed Regeln
- Source Commit muss ein vollständiger 40-stelliger Git SHA sein.
- Evidence Map und alle Evidence-Elemente müssen zum selben Commit gehören.
- Mindestens eine Code-Evidence, Concept-ID und Traceability-ID ist erforderlich.
- Version Context muss vollständig sein.
- Dieselbe `correlationId` ist nur für denselben semantischen Request idempotent wiederverwendbar.

## Lifecycle Boundary
Die Engine erzeugt ausschließlich `reviewStatus: generated`. Review/Approval, Event-Publishing, Rendering, Knowledge Projection und geschützte Dokumentfreigaben bleiben getrennte Workstreams.

## Versionierung
Documentary Component Version: `1.4.0`. Document Schema und Platform Version bleiben über die bestehenden D0 Authorities getrennt.
