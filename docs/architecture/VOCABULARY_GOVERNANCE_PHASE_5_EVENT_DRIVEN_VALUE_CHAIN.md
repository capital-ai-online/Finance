# CAPITAL-AI Vocabulary Governance — Phase 5 Event-Driven Value Chain

Status: In Progress  
Date: 2026-08-10  
Base: verified `main` after Phase 4 / PR #152  
Authorities: ESS-0001-CONTRACTS, ESS-0013, ESS-0017, ADR-0018

## Deutsch

### Ziel

Phase 5 verbindet die Governance-Wertschöpfungskette über den bestehenden Enterprise Event Mesh. Es wird kein zweiter Event-Bus und keine parallele Event-Registry eingeführt.

### Verifizierte Ausgangslage

- Phase 4 ist gemerged und produktiv deployed.
- Der bestehende EventMesh besitzt einen kanonischen Standard-Event-Katalog.
- `PlatformDecisionEvent`, `SupervisorAlertEvent`, `DocumentationGeneratedEvent`, `KnowledgeUpdatedEvent`, `VersionCalculatedEvent`, `ReleasePreparedEvent` und weitere Lifecycle-Ereignisse sind bereits registriert.
- Platform Director besitzt einen fail-closed Decision-Contract, aber noch keine vollständige autonome Entscheidungslogik.

### Phase-5-Schritt 1 — Approval Bridge

Der erste ausführbare Schritt implementiert die Grenze zwischen Human-/Owner-Freigabe und autonomer Event-Propagation:

```text
Supervisor / Evidence
        ↓
PlatformDecisionRecord
        ↓
APPROVED ?
   ├─ nein → BLOCKED
   └─ ja
        ↓
PlatformDecisionEvent
        ↓
Enterprise Event Mesh
```

`publishApprovedPlatformDecision()` darf ausschließlich bereits genehmigte, immutable `PlatformDecisionRecord`-Instanzen veröffentlichen. Die Funktion erzeugt keine Entscheidung und führt keine automatische Genehmigung durch.

### Invarianten

- `status !== APPROVED` → fail closed.
- `correlationId` ist verpflichtend und wird unverändert propagiert.
- `PlatformDirector` ist der einzige Producer dieses Bridge-Schritts.
- Event-Namen stammen ausschließlich aus dem bestehenden Standard Event Catalog.
- Keine direkte Kopplung von EventMesh an Vocabulary, Documentary oder andere Fachkomponenten.
- Keine Änderungen an Stripe, Supabase, Render oder Datenbankschemas.

### Nächste Schritte innerhalb Phase 5

1. Supervisor-Evidence und Impact-Analysis formal an die Decision-Voraussetzungen anbinden.
2. Approved `PlatformDecisionEvent` als Trigger für idempotente Downstream-Handler registrieren.
3. Vocabulary, Documentary, Knowledge und Traceability über ihre öffentlichen Interfaces anbinden.
4. Quality, Security und Compliance als Validierungsstufe ergänzen.
5. Version Manager und Release nur nach erfolgreichen Gates freigeben.
6. Correlation/Causation über die gesamte Kette nachweisbar erhalten.
7. Event-Handler idempotent und replay-sicher gestalten.

## English

### Goal

Phase 5 connects the governance value chain through the existing Enterprise Event Mesh. No second event bus or parallel event registry is introduced.

### Step 1 — Approval Bridge

The first executable step establishes the boundary between explicit Platform Director approval and autonomous event propagation. `publishApprovedPlatformDecision()` only publishes an already approved immutable `PlatformDecisionRecord`; it never creates or auto-approves a decision.

The original correlation identifier is preserved, non-approved decisions fail closed, and only canonical event names from the existing EventMesh catalog are used.

### Phase 5 completion target

A relevant lifecycle change must propagate deterministically through Supervisor assessment, Platform Director approval boundary, Vocabulary/Knowledge/Documentary/Traceability updates, Quality/Security/Compliance validation, Version Manager and Release validation without bypassing human approval or CI/deployment governance.
