# CAPITAL-AI Vocabulary Governance — Phase 6 Incremental Existing-Code Migration

Status: IMPLEMENTATION COMPLETE — DRAFT REVIEW PENDING  
Date: 2026-08-10  
Authority: ESS-0017 / ESS-0017-CONTRACTS  
Verified foundation: PR #154 / `77cf6ed3143dc39120c55f7c767d4a758bc9735d` / main CI #658  

## Deutsch

### Ziel und Ergebnis

Phase 6 migriert bestehende Naming-Schulden ausschließlich dann, wenn der Phase-3-Analyzer einen Kandidaten nachweislich als `SAFE` klassifiziert. Die vollständige Phase-6-Auswertung ergab für das aktuelle Inventar **0 SAFE-Kandidaten**. Deshalb wurde bewusst kein aktiver Code-Rename durchgeführt. Das ist ein gültiger fail-closed Abschluss und verhindert eine erzwungene Migration über Runtime-, Billing- oder Contract-Grenzen.

### Phase 6.0 — Naming Debt Inventory — COMPLETE

PR #154 führte `docs/governance/vocabulary/rename-candidates.json` mit stabilen `REN-*`-IDs, Vocabulary Concept-IDs, kanonischen Zielbegriffen, Priorität, Begründung und beobachteten Repository-Flächen ein. Die Policy bleibt `CLASSIFY_ONLY`.

### Phase 6.1 — Evidence Classification — COMPLETE

`scripts/automation/classifyRenameCandidates.ts` delegiert an den bestehenden Phase-3-Analyzer `analyzeRenameImpact`. Die materialisierte Evidence liegt in `docs/governance/vocabulary/rename-classification-evidence.json` und wird durch Tests gegen den Live-Analyzer validiert.

Ergebnis:
- `REN-0001 — Plan -> SubscriptionTier`: `BLOCKED`. `Plan` ist Bestandteil von Billing-/Entitlement-Contracts; insbesondere existiert `PlanEntitlements` als TypeScript-Interface.
- `REN-0002 — Screener -> Screening`: `BLOCKED`. `Screener` ist Bestandteil eines Frontend-Runtime-Contracts; insbesondere existiert `ScreenerProps` und der exportierte React-Component-Name `Screener`.

### Phase 6.2 — SAFE Migration Batch — COMPLETE, NO-OP

`safeMigrationCount` ist `0`. Daher ist keine automatische oder manuell vorbereitete Rename-Mutation zulässig. Phase 6.2 ist als kontrollierter No-op abgeschlossen. Ein künstlicher Rename nur zum Erzeugen einer Änderung würde die Governance verletzen.

### Phase 6.3 — Dependency Validation — COMPLETE FOR FOUNDATION; FINAL DRAFT GATE REQUIRED

Main CI #658 für die gemergte Phase-6.0/6.1-Basis war vollständig grün, einschließlich TypeScript, Tests, Production Build, CSP, Deployment Readiness, Docker Build, Runtime-Metadaten und Render Production Deploy. Der Abschluss-Draft muss dieselben regulären PR-Gates bestehen; es wird kein zusätzlicher Vollworkflow eingeführt.

### Phase 6.4 — Vocabulary / Documentary / Traceability Synchronisation — COMPLETE

Jeder Kandidat bleibt an eine freigegebene Vocabulary Concept-ID und den kanonischen Zielbegriff gebunden. Da kein Rename ausgeführt wurde, entstehen keine neuen Documentary- oder Traceability-Identitäten und keine DE/EN-Drift. Die bestehenden Aliase bleiben Such-/Migrationshinweise; sie werden nicht zu neuen technischen Authorities.

### Phase 6.5 — Conditional / Blocked Backlog — COMPLETE

`docs/governance/vocabulary/rename-backlog.json` ist die geschützte Übergabe für nicht sichere Kandidaten. Beide aktuellen Einträge sind `BLOCKED`, `DEFERRED`, `automaticMigrationAllowed: false` und benötigen vor einer späteren Migration eine explizite, scopegebundene Architektur-/Governance-Entscheidung.

### Exit-Kriterien

- [x] Maschinenlesbares Naming-Debt-Inventar vorhanden.
- [x] Alle inventarisierten Kandidaten durch den bestehenden Analyzer klassifiziert.
- [x] Materialisierte Evidence wird gegen den Live-Analyzer regressionsgeprüft.
- [x] Nur `SAFE` wäre migrationsfähig; aktuell existieren 0 SAFE-Kandidaten.
- [x] Keine unzulässige Code-, API-, Schema-, ENV- oder Event-Mutation durchgeführt.
- [x] Alle `BLOCKED` Kandidaten im geschützten Backlog erfasst.
- [x] Vocabulary-, Documentary- und Traceability-Identitäten bleiben konsistent.
- [ ] Finaler Draft-PR-CI-Lauf erfolgreich.
- [ ] Merge und anschließender main-CI-/Render-Gate erfolgreich.

## English

### Result

Phase 6 is implemented as an evidence-first, fail-closed migration stage. The current inventory contains zero `SAFE` candidates, so no code rename is permitted or performed.

`REN-0001` (`Plan -> SubscriptionTier`) is `BLOCKED` because the source term participates in billing/entitlement contracts, including the `PlanEntitlements` interface. `REN-0002` (`Screener -> Screening`) is `BLOCKED` because it participates in frontend runtime contracts, including `ScreenerProps` and the exported React component.

The materialized evidence is stored in `docs/governance/vocabulary/rename-classification-evidence.json`; non-safe work is retained in `docs/governance/vocabulary/rename-backlog.json`. Regression tests compare stored classifications and mandatory finding codes with the live Phase-3 analyzer so evidence cannot silently drift.

Phase 6.2 is therefore a controlled no-op: zero SAFE candidates means zero rename mutations. Phase 6 is complete in the draft implementation once the final PR CI passes; merge and verified main deployment remain the production completion gates.
