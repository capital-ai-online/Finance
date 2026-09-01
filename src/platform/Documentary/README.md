# Documentary

## Enterprise Component

Status: Partial Implementation

Version: 1.14.0

Component Version Authority: `manifest.json#version`

Document Schema Version Authority: `Versioning/DocumentaryVersion.ts#DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`

Platform Version Authority: repository `package.json#version` via `src/platform/Release/Services/platformVersionControlPlane.ts`

Owner: CAPITAL-AI

---

## Purpose

Documentary wird schrittweise zu einer ausführbaren Plattformkomponente ausgebaut. Implementiert sind der bilinguale Vocabulary-Layer, D0 Version Authority, D1 Code Discovery, Documentation Hygiene als read-only Service, Status-Event Drift Detection (Phase B), Status-Event Drift Updater (Phase C, header-only), D3 Document Models/Provenance, D2 Core Engine, D5/E1/E4 Traceability/Event-Integration, D4 Review/Lifecycle Governance, D6 Generatoren/Renderer einschließlich deterministischer Mermaid-Projektion, D7 Knowledge Projection sowie der ADR-0097 Documentary Maintenance Control Loop einschließlich D9-Maintenance-Observability und eines eng begrenzten Archive-Retention-Planners.

## Implemented Scope

- `Contracts/BilingualDocumentReference.ts`
- `Documentation/BilingualDocumentaryProjection.ts`
- `Versioning/DocumentaryVersion.ts`
- `Governance/Services/DocumentationHygieneValidator.ts`
- `Discovery/CodeEvidence.ts`
- `Discovery/StatusEventEvidence.ts`
- `Discovery/StatusEventDriftDetector.ts`
- `Discovery/StatusEventDriftUpdater.ts`
- `Discovery/SemanticFreshnessAnalyzer.ts`
- `Agents/DocumentaryMaintenanceAgent.ts`
- `Agents/ArchiveRetentionAgent.ts`
- `Orchestration/DocumentaryMaintenanceOrchestrator.ts`
- `Observability/DocumentaryMaintenanceObservability.ts`
- `Models/DocumentaryDocument.ts`
- `Models/DocumentaryProvenance.ts`
- `Interfaces/IDocumentaryEngine.ts`
- `Engine/DocumentaryEngine.ts`
- `Events/DocumentaryEvents.ts`
- `Events/DocumentaryEventConsumer.ts`
- `Events/DocumentaryEventPublisher.ts`
- `Traceability/DocumentaryTraceability.ts`
- `Lifecycle/DocumentaryLifecycle.ts`
- `Generators/DocumentaryRenderer.ts`
- `Mermaid/DocumentaryMermaidRenderer.ts`
- `Knowledge/DocumentaryKnowledgeProjection.ts`
- `Architecture/documentary-baseline.json`

## Documentary Maintenance Control Loop

ADR-0097 ergänzt die bestehende Struktur um einen branchbasierten Maintenance-Pfad:

`Semantic Freshness -> Supervisor Recommendation -> Platform Director Decision -> Agent IAM/Compliance -> Maintenance Agent -> isolated branch -> existing Draft-PR workflow`.

Der `SemanticFreshnessAnalyzer` korreliert registrierte Dokumente deterministisch mit Source-Änderungen und unterstützt periodische Vollscans. Der Supervisor erzeugt daraus Evidence/Recommendation, trifft aber weiterhin keine Entscheidung. Der Orchestrator bindet die Recommendation an eine freigegebene Platform-Director-Entscheidung und die bestehenden Agent-IAM-Capabilities.

Der Maintenance Agent ist Patch-only. Er darf semantische Volltextänderungen ausschließlich auf nicht geschützten `docs/`-Pfaden planen/anwenden. ADRs, Governance, Compliance, Security, Legal, Evidence, Archive und Release-Evidence sind Review-only. `main` ist kein zulässiges Apply-Ziel.

Bei einer tatsächlich angewendeten semantischen Dokumentänderung wird die Dokumentversion im kanonischen Document Registry deterministisch um genau eine Patchversion erhöht und der Lifecycle auf `generated` gesetzt. Das Modell bestimmt weder Version noch Approval-Status.

Die AI-Ausführung verwendet über `server/documentaryMaintenanceAiAdapter.ts` die bereits vorhandene providerneutrale Anthropic/OpenAI-Kette, RAG-Evidence und AI-Evaluation-Governance. Es wird kein zweites Agent-/Provider-Framework eingeführt.

`scripts/automation/runDocumentaryMaintenanceControlLoop.ts` verlangt einen sauberen Checkout des exakten aktuellen `main`. `sourceCommit` muss genau diesem Main-SHA entsprechen. Vor Branch-Erstellung wird ein gleichnamiger Remote-Agent-Branch abgelehnt; bei Fehlern nach einem Push wird ein noch nicht übergebenes Remote-Artefakt best-effort wieder entfernt. Der Host stage-t nur explizite Patch-/Claim-Pfade, führt lokale Governance-Hygiene aus und nutzt anschließend den bestehenden Workflow `.github/workflows/open-agent-draft-pr.yml`. Wenn sich `main` vor dem PR-Handoff ändert, wird der Kandidat verworfen und muss auf der neuen Baseline neu erzeugt werden.

### Archive Retention / Löschplanung

`ArchiveRetentionAgent` erweitert denselben Documentary-Agentenpfad ausschließlich um deterministische Retention-Klassifikation. `archived` bedeutet ausdrücklich **nicht** `delete-authorized`.

Automatisch `delete-eligible` können nur alte, unregistrierte, unreferenzierte und deterministisch reproduzierbare Duplikate unter `docs/archive/generated/**` oder `docs/archive/transient/**` werden. Registrierte Dokumente, Authorities, Evidence, Security-/Compliance-Artefakte und referenzierte Historie bleiben erhalten. Der Agent führt selbst keine Löschung aus; `planDeletion()` liefert nur einen Owner-gated Plan mit `mutationPerformed=false`. Eine spätere physische Löschung muss als normaler, separat autorisierter Maintenance-Patch über Agent IAM, Kill Switch, Branch, PR und Human Merge laufen.

### SC-MD-SPT-0001 Wertschöpfungsketten-Anbindung

Der Maintenance-Pfad ist im Component Manifest ausdrücklich als `read-only-documentation-evidence-sidecar` an `SC-MD-SPT-0001` deklariert. Die fachliche Einordnung erfolgt um `VC-17-EVENT-TRACEABILITY-SUPERVISOR`; Documentary wird **nicht** zu einer zusätzlichen Finanz-Runtime-Stufe.

Die bestehende Quality-Projektion `fintech-value-chain-quality/1.0.0` bleibt die read-only Struktur-/Evidence-Prüfung der **18-stufigen** Kette. Documentary darf weder MarketData, Classification, Scoring, Confidence, Ranking, Eligibility noch Provider-Routing, Release oder Deployment beeinflussen. Ebenso dürfen die Financial Hotpaths keine direkte Documentary- oder Quality-Mutationsabhängigkeit erhalten.

Die Supervisor-Erweiterung dient ausschließlich als Evidence-Oberfläche. `decisionAuthority=false` und `mutationAuthority=false` bleiben explizit; die eigentliche Entscheidung verbleibt beim Platform Director und die Git-Mutation bei den separat autorisierten Agent-IAM-Capabilities.

### D9 Maintenance Observability

`Observability/DocumentaryMaintenanceObservability.ts` erzeugt einen korrelations- und commitgebundenen Health Snapshot mit ausschließlich aggregierten Zählwerten/Ratios: Registry Coverage, Freshness Ratio, Orphan Rate, Kandidaten, geplante Patches, übersprungene Patches und angewendete Dokumente. Dokumentkörper, Prompts, Diffs, Nutzerkennungen und Secrets werden nicht in den strukturierten Telemetrievertrag aufgenommen. Dieser Slice ersetzt keine zentrale Observability-Plattform und beansprucht nicht die vollständige D9-Umsetzung.

### Lokaler Pre-PR-Closure

- `npm run documentary:maintenance:test` — gezielte Unit-Tests des Control Loops.
- `npm run documentary:maintenance:validate` — Registry-, Authority-, Claim-, Branch-, Wertschöpfungsketten- und Scope-Konsistenz.
- `npm run documentary:maintenance:prepr` — gezielte Tests + TypeScript-Check + Documentation Hygiene + Governance Control Plane + Repository Quality + Closure Validator.
- `npm run sandbox:prepr` — ChatGPT/local, kostenkontrollierte Pre-PR-Projektion; ersetzt keine Hosted CI.

Der Closure Validator verlangt, dass der Work Claim exakt den tatsächlichen Diff gegen `origin/main` abdeckt und dass der Branch unmittelbar auf dem aktuellen `origin/main` basiert. Zusätzlich prüft er die SC-MD-SPT-0001-Sidecar-Deklaration, die bestehende **18-stufige** Quality-Projektion und das Verbot direkter Documentary-Abhängigkeiten auf Financial Hotpaths. Dadurch werden veraltete, überbreite oder wertschöpfungskettenwidrige Fassungen vor PR-Reife fail-closed zurückgewiesen.

## Documentation Governance

Der Namespace `Governance/` bleibt gemäß ADR-0014 / ESS-0012 ausschließlich **Documentation-only**. Der integrierte `DocumentationHygieneValidator` prüft Root-Markdown, Document Registry, Lifecycle-/Sprachwerte und Registry-Zielpfade read-only und fail-closed. Er definiert keine globale Repository-Authority, keine Merge-Entscheidung und keine Produktionsmutationsberechtigung.

Repository-weite Authority-Auflösung verbleibt im Governance Control Plane unter `src/platform/Governance` und ADR-0096. Der ADR-0097 Maintenance Agent konsumiert diese Authorities lediglich und kann sie nicht überschreiben.

## D7 Knowledge Integration

D7 erzeugt aus einem bereits gouvernierten `DocumentaryDocument` eine deterministische Knowledge-Projektion mit Dokumentknoten, gerichteten Beziehungen, Source Commit, Dokument-Fingerprint, Concept-IDs, Traceability-IDs, Provenance-Referenzen und SHA-256-Prüfsumme.

Die Projektion ist ausschließlich ein Übergabevertrag an die in ESS-0009 spezifizierte zentrale Knowledge Engine. Sie persistiert keine Daten in `.ai/knowledge/`, startet keinen Knowledge Build und führt keine zweite Knowledge Registry ein.

## D6 Generators & Renderer

D6 rendert ausschließlich bereits erzeugte Documentary-Modelle oder deren deterministische Projektionen. Der Markdown-Renderer unterstützt die Dokumenttypen `architecture`, `component`, `api`, `runbook`, `release-evidence` und `handoff` mit dokumenttyp-spezifischen Abschnittsprofilen.

`Mermaid/DocumentaryMermaidRenderer.ts` rendert die bestehende `DocumentaryKnowledgeProjection` deterministisch als Mermaid-Quelltext. Node-Aliase sind vollständige SHA-256-Ableitungen der vorhandenen Node-IDs; Nodes und Relationships werden stabil sortiert. Evidence-Labels werden escaped, und der Generator erzeugt weder `click`-/URL-/HTML-/Script-Direktiven noch externe Ressourcen. Mermaid wird nicht ausgeführt und kein Graph persistiert.

Die Renderer verändern weder Lifecycle-Status noch Dokument-Fingerprint oder Knowledge-Projektion. Sie führen keine Freigabe, Persistenz, Source-Code-Mutation oder Event-Publikation durch und erzeugen keine zweite Diagramm- oder Knowledge-Registry.

## D4 Review & Lifecycle Governance

Der kontrollierte Lifecycle lautet `generated -> reviewed -> approved`. Nach Approval sind `approved -> superseded`, `approved -> archived` und `superseded -> archived` zulässig. `suspended` ist im repository-weiten Governance Control Plane zusätzlich für explizit pausierte normative Altverträge verfügbar.

## D5 / E1 / E4 Traceability & Event Value Chain

`DocumentaryTraceabilityRecord` verbindet Dokumente mit `correlationId`, `causationId`, Dokument-Fingerprint, Source Commit, Concept IDs, Traceability IDs und Provenance-Referenzen. Documentary nutzt ausschließlich den bestehenden EventMesh.

## D2 Core Engine

`DocumentaryEngine` orchestriert die Erzeugung strukturierter `DocumentaryDocument`-Models und erzeugt ausschließlich den Lifecycle-Status `generated`.

## Version Model

- Component Version: `manifest.json#version`.
- Document Schema Version: `DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`.
- Platform Version: ausschließlich `package.json#version`, gelesen über den Release Control Plane.
- Semantisch aktualisierte Dokumente: Patchversion im `docs/governance/document-registry.json`, Lifecycle zurück auf `generated`.
- `AGENTS.md` besitzt eine unabhängige Governance Control Plane Version und ist kein Produktversionsmirror.

## Implementation Baseline

Aktuell implementiert: `Agents`, `ArchiveRetention`, `Contracts`, `Discovery`, `Documentation`, `Engine`, `Events`, `Generators`, `Governance` (Hygiene-Service), `Interfaces`, `Knowledge`, `Lifecycle`, `Mermaid`, `Models`, `Observability` (Maintenance Slice), `Orchestration`, `Traceability`, `Versioning`.

Weiterhin geplant: `Migration`, `Plugins` sowie weitere Architecture-Runtime-Funktionen und zusätzliche ESS-0012-Validatoren. Diese Bereiche gehören nicht zum ADR-0097-Maintenance-Work-Package und werden durch WP-DOC-05 nicht berührt.

## Boundaries

Keine autonome Approval-Transition, keine Source-Code-Mutation durch Validation, keine zweite Event-, Knowledge-, Diagramm-, Governance-, Observability- oder Plattformversions-Authority. Maintenance-Mutation ist ausschließlich branchbasiert; kein Auto-Merge, kein Deploy und keine Production Mutation. Die Mermaid-Projektion bleibt pure/read-only und erzeugt keine aktiven Mermaid-Direktiven aus Evidence. Die SC-MD-SPT-0001-Anbindung bleibt read-only Evidence/Documentation und darf keine Financial-Runtime-Semantik verändern.

## ESS / ADR

- ESS-0002 — Supervisor Architect
- ESS-0003 — Platform Director
- ESS-0009 — Enterprise Knowledge Platform
- ESS-0010 — Documentary Engine
- ESS-0011 — Enterprise Traceability
- ESS-0012 — Documentation Governance (Documentation-only Scope)
- ESS-0019 — Universal AI Agent Control Plane
- SC-MD-SPT-0001 — Screening / Scoring / Market Data / SPT value-chain authority
- ADR-0014 — Documentation Governance Validator
- ADR-0078 — Vocabulary Governance Authority and Namespace
- ADR-0096 — Governance Control Plane / Authority Boundary
- ADR-0097 — Documentary Maintenance Agent Control Loop
