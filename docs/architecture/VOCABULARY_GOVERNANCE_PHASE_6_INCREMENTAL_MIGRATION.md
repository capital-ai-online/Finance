# CAPITAL-AI Vocabulary Governance — Phase 6 Incremental Existing-Code Migration

Status: IN PROGRESS  
Date: 2026-08-10  
Authority: ESS-0017 / ESS-0017-CONTRACTS  
Baseline: `04c0e5957aca7025b07f55439e052cef8e070571`  
Mode: READ ONLY for Phase 6.0 / 6.1

## Deutsch

### Ziel

Phase 6 überführt bestehende technische Naming-Schulden schrittweise in die Canonical Vocabulary Governance. Es gibt keine Big-Bang-Renaming-Migration. Jeder Kandidat wird zuerst inventarisiert, gegen die Vocabulary Registry auf einen freigegebenen Zielbegriff gebunden und anschließend durch den bestehenden Phase-3-Analyzer `analyzeRenameImpact` klassifiziert.

### Phase 6.0 — Naming Debt Inventory

Die maschinenlesbare Quelle ist `docs/governance/vocabulary/rename-candidates.json`.

Pflichtfelder je Kandidat:
- stabile `REN-*`-ID;
- aktueller Begriff;
- freigegebener kanonischer Zielbegriff;
- Vocabulary Concept-ID;
- Priorität;
- fachliche Begründung;
- beobachtete Repository-Flächen;
- `migrationPolicy: CLASSIFY_ONLY`.

Der Contract ist absichtlich fail-closed. Phase 6.0/6.1 akzeptiert keine Mutation Policy.

### Phase 6.1 — Evidence Classification

`scripts/automation/classifyRenameCandidates.ts` lädt das Inventar und delegiert jede Bewertung an den bereits etablierten `validateRenameImpact`-Analyzer. Die möglichen Evidence-Zustände bleiben:

- `SAFE`: keine Blocker und keine Runtime-Referenzen;
- `CONDITIONAL`: Runtime-Referenzen vorhanden, aber kein harter Blocker;
- `BLOCKED`: API/Route, Schema/Contract, Env/Config, Dynamic Import, ungültiger Zielbegriff oder andere harte Governance-Grenze.

Ein `BLOCKED`-Kandidat ist ein gültiges Analyseergebnis und darf die Inventarisierung nicht als technischen Fehler behandeln. Nur ein ungültiger Inventory-Contract stoppt den Lauf.

### Initiale Kandidaten

`REN-0001 — Plan -> SubscriptionTier`

Der Begriff `Plan` ist als Alias des Vocabulary Concepts `VOC-BILLING-0002` bekannt; `SubscriptionTier` ist der freigegebene technische Zielbegriff. Repository-Evidence zeigt Verwendungen in Stripe, Entitlements, Checkout und Subscription UI. Deshalb wird kein automatischer Rename vorgenommen.

`REN-0002 — Screener -> Screening`

`Screening` ist unter `VOC-ANALYTICS-0001` freigegeben. `Screener` ist jedoch breit in Komponenten, Produktdarstellung und Dokumentation verankert. Auch dieser Kandidat bleibt bis zur vollständigen Impact-Auswertung unverändert.

### Schutzgrenzen

- Keine Dateinamen, Exports, Imports, Komponenten, Variablen oder Contracts werden in Phase 6.0/6.1 umbenannt.
- Keine Änderung an API-Routen, DB-Schemas, Environment Keys, Event-Namen, Stripe-, Supabase- oder Render-Konfiguration.
- Nur `SAFE` darf später in Phase 6.2 für einen kleinen Draft-PR vorgeschlagen werden.
- `CONDITIONAL` benötigt Dependency-Evidence und Review.
- `BLOCKED` benötigt eine explizite Architektur-/Governance-Entscheidung oder bleibt unverändert.
- Nach jedem späteren Rename-Batch bleiben TypeScript, Tests, Build, Manifest-Integrität und Deployment Readiness verpflichtend.
- Die GitHub-Actions-Budgetrichtlinie bleibt bindend; keine zusätzliche Vollpipeline nur für das Inventory.

### Exit-Kriterien Phase 6.0/6.1

- [x] Maschinenlesbarer Inventory-Contract angelegt.
- [x] Read-only Batch-Classifier an Phase-3-Analyzer angebunden.
- [x] Contract-Tests angelegt.
- [x] Erste reale Kandidaten aufgenommen.
- [ ] CI bestätigt TypeScript, Tests, Build und Manifest-Integrität.
- [ ] Classification Evidence des finalen PR-Heads ausgewertet.
- [ ] Erster eindeutig `SAFE` Kandidat für Phase 6.2 ausgewählt oder dokumentiert, dass noch kein sicherer Kandidat existiert.

## English

### Goal

Phase 6 migrates existing naming debt incrementally into canonical Vocabulary Governance. Phase 6.0/6.1 is strictly read-only: candidates are inventoried and classified through the existing Phase 3 rename-impact analyzer before any source-code mutation is allowed.

The machine-readable inventory is `docs/governance/vocabulary/rename-candidates.json`. Every candidate must reference an approved canonical target term and a Vocabulary Concept ID and must use `CLASSIFY_ONLY` migration policy.

`SAFE` candidates may later enter a small Phase 6.2 migration PR. `CONDITIONAL` candidates require dependency evidence and review. `BLOCKED` candidates require an explicit architecture/governance decision or remain unchanged.
