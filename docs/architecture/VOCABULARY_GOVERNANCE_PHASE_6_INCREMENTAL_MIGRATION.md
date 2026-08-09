# CAPITAL-AI Vocabulary Governance — Phase 6 Incremental Existing-Code Migration

Status: IMPLEMENTATION COMPLETE — DRAFT REVIEW PENDING  
Date: 2026-08-10  
Authority: ESS-0017 / ESS-0017-CONTRACTS  
Verified foundation: PR #154 / `77cf6ed3143dc39120c55f7c767d4a758bc9735d` / main CI #658

## Deutsch

### Ziel und Ergebnis
Phase 6 migriert Naming-Schulden ausschließlich bei nachgewiesenem `SAFE`. Die vollständige Auswertung des aktuellen Inventars ergibt **0 SAFE-Kandidaten**. Daher wurde kein aktiver Code-Rename durchgeführt.

### 6.0 Naming Debt Inventory — COMPLETE
PR #154 etablierte `rename-candidates.json` mit stabilen `REN-*`-IDs, Vocabulary Concept-IDs, kanonischen Zielbegriffen und `CLASSIFY_ONLY`.

### 6.1 Evidence Classification — COMPLETE
Die materialisierte Evidence liegt in `docs/governance/vocabulary/rename-classification-evidence.json` und wird gegen den Live-Analyzer regressionsgeprüft.

- `REN-0001 — Plan -> SubscriptionTier`: `CONDITIONAL`. Exakte `Plan`-Referenzen liegen in Billing-/Entitlement-Runtime-Flächen. Ein dependency-aware Migrationsplan ist erforderlich.
- `REN-0002 — Screener -> Screening`: `BLOCKED`. `src/components/Screener.tsx` enthält exakte `Screener`-Runtime-Referenzen und mit `interface ScreenerProps` zugleich eine Contract-Fläche; der Phase-3-Analyzer meldet `SCHEMA_OR_CONTRACT_REFERENCE`.

### 6.2 SAFE Migration Batch — COMPLETE, NO-OP
`safeMigrationCount = 0`. Ohne SAFE-Kandidat ist keine Rename-Mutation zulässig. Der No-op ist der korrekte fail-closed Abschluss.

### 6.3 Dependency Validation — FINAL DRAFT GATE
PR #154 / main CI #658 ist vollständig verifiziert, einschließlich Docker und Render. Der Abschluss-Draft muss TypeScript, Tests, Build, Manifest-Integrität und Deployment Readiness bestehen.

### 6.4 Vocabulary / Documentary / Traceability Synchronisation — COMPLETE
Alle Kandidaten bleiben an freigegebene Vocabulary Concept-IDs gebunden. Da keine Mutation ausgeführt wurde, entstehen keine neuen Documentary-/Traceability-Identitäten und keine DE/EN-Drift.

### 6.5 Conditional / Blocked Backlog — COMPLETE
`docs/governance/vocabulary/rename-backlog.json` enthält alle nicht sicheren Kandidaten. REN-0001 ist `CONDITIONAL`, REN-0002 `BLOCKED`; beide sind `DEFERRED` und `automaticMigrationAllowed: false`. Eine spätere Migration benötigt explizite scopegebundene Freigabe und die jeweils erforderliche Dependency-/Architektur-Evidence.

### Exit-Kriterien
- [x] Inventory vollständig und maschinenlesbar.
- [x] Alle Kandidaten durch den bestehenden Phase-3-Analyzer klassifiziert.
- [x] Evidence wird gegen den Live-Analyzer regressionsgeprüft.
- [x] 0 SAFE-Kandidaten dokumentiert; keine unzulässige Mutation.
- [x] Alle CONDITIONAL/BLOCKED-Kandidaten im geschützten Backlog.
- [x] Vocabulary/Documentary/Traceability bleiben konsistent.
- [ ] Finaler Draft-PR-CI-Lauf erfolgreich.
- [ ] Merge und anschließender main-CI-/Render-Gate erfolgreich.

## English
Phase 6 is evidence-first and fail-closed. The current inventory contains zero SAFE candidates, so no code rename is permitted or performed. REN-0001 is CONDITIONAL because exact `Plan` references occur on billing/entitlement runtime surfaces. REN-0002 is BLOCKED because `src/components/Screener.tsx` combines exact `Screener` runtime references with the `interface ScreenerProps` contract surface, producing `SCHEMA_OR_CONTRACT_REFERENCE`. Stored evidence is regression-checked against the live Phase-3 analyzer. Production completion requires successful draft CI, merge, and verified main deployment.
