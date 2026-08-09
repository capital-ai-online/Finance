# CAPITAL-AI Vocabulary Governance Migration Roadmap

Status: Active  
Datum / Date: 2026-08-10  
Authority: ESS-0001-CONTRACTS  
Related: ESS-0010, ESS-0012, ESS-0017, ESS-0017-CONTRACTS, ADR-0046  
CI Cost Governance: `docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md`

## Deutsch

### Zielbild
Naming, Wording, Dokumentation, Traceability und Governance werden als zusammenhängender, ereignisbasierter Teil der CAPITAL-AI Wertschöpfungskette betrieben. Code bleibt Englisch; Enterprise-Dokumentation wird Deutsch und Englisch geführt; menschlich sichtbare Pull-Request-Informationen werden Deutsch geführt.

### Phase 0 — Baseline und Schutz — COMPLETE
Baseline und technische Governance wurden inventarisiert; aktive Renames waren ausgeschlossen.

### Phase 1 — Governance Foundation — COMPLETE
Deutsche PR-Informationen sowie Vocabulary-/Naming-Governance wurden etabliert.

### Phase 1.5 — Authority- und Nummernraum-Konsolidierung — COMPLETE
`ESS-0012` bleibt Documentation Governance; `ESS-0017` / `ESS-0017-CONTRACTS` sind Vocabulary Governance; `ADR-0046` dokumentiert die Authority-Trennung.

### Phase 2 — Canonical Vocabulary Registry — COMPLETE
Canonical Vocabulary Registry als Single Source of Truth, abgeschlossen durch PR #145 und verifizierten main-CI-/Deploy-Gate.

### Phase 3 — Safe Rename Gate — COMPLETE
`validateRenameImpact` klassifiziert Renames als `SAFE`, `CONDITIONAL` oder `BLOCKED`. Abschluss durch PR #151 und main CI #649.

### Phase 4 — Bilingual Documentary Integration — COMPLETE
DE/EN-Projektionen nutzen dieselben Vocabulary Concept- und Governance-Identitäten. Abschluss durch PR #152 und erfolgreichen Deploy.

### Phase 5 — Event-Driven Value Chain — COMPLETE
Die Approval Bridge propagiert nur explizit `APPROVED` Platform Decisions über den bestehenden EventMesh. PR #153 / Commit `04c0e5957aca7025b07f55439e052cef8e070571` wurde in CI #656 einschließlich Docker und Render verifiziert.

### Phase 6 — Incremental Existing-Code Migration — IMPLEMENTATION COMPLETE IN DRAFT

Phase 6.0/6.1 wurde mit PR #154 auf `main` etabliert. Merge-Commit `77cf6ed3143dc39120c55f7c767d4a758bc9735d` wurde in main CI #658 vollständig verifiziert und an Render deployed.

Abschlussstand:
- 6.0 Naming Debt Inventory — COMPLETE;
- 6.1 Evidence Classification — COMPLETE;
- 6.2 SAFE Migration Batch — COMPLETE als kontrollierter No-op, da `safeMigrationCount = 0`;
- 6.3 Dependency Validation — Basis vollständig verifiziert; Abschluss-Draft durchläuft denselben regulären CI-Gate;
- 6.4 Vocabulary / Documentary / Traceability Synchronisation — COMPLETE ohne neue semantische Identitäten, da kein Rename ausgeführt wurde;
- 6.5 Conditional / Blocked Backlog — COMPLETE.

Aktuelle Evidence:
1. `REN-0001: Plan -> SubscriptionTier` — `BLOCKED`; Billing-/Entitlement-Contract-Oberfläche (`PlanEntitlements`).
2. `REN-0002: Screener -> Screening` — `BLOCKED`; Frontend-Runtime-Contract (`ScreenerProps` / exportierter Component-Name).

Die materialisierte Klassifikation liegt in `docs/governance/vocabulary/rename-classification-evidence.json`; der geschützte Folge-Backlog in `docs/governance/vocabulary/rename-backlog.json`. Ein Regressionstest vergleicht die gespeicherte Evidence mit dem Live-Phase-3-Analyzer. Es wurden keine aktiven Renames durchgeführt.

Produktionsabschluss Phase 6: finalen Draft-PR mergen und dessen main-CI-/Render-Gate erfolgreich verifizieren.

### Phase 7 — Continuous Governance — NEXT
Repository-Validator, CI, Documentary, Knowledge und Traceability werden terminologiebewusst verbunden. Neue Concepts und relevante Lifecycle-Ereignisse werden deterministisch verarbeitet, ohne Human-Approval-Gates oder die zentrale CI-Kostenrichtlinie zu umgehen.

## English

### Migration sequence
0. Baseline and protection — complete.  
1. Governance foundation — complete.  
1.5. Authority and namespace reconciliation — complete.  
2. Canonical Vocabulary Registry — complete through PR #145.  
3. Safe Rename Gate — complete through PR #151 / main CI #649.  
4. Bilingual Documentary Integration — complete through PR #152.  
5. Event-Driven Value Chain — complete through PR #153 / main CI #656.  
6. Incremental Existing-Code Migration — implementation complete in draft. PR #154 established the inventory/classifier and its merge commit was verified by main CI #658. The final evidence classifies both current candidates as BLOCKED, records zero SAFE migrations, performs no rename mutation, and stores the protected backlog. Production completion requires merge plus successful main CI/Render verification.  
7. Continuous Governance — next.

### Success criteria
- English-only technical naming for new code.
- DE/EN documentation cannot semantically drift independently.
- PR information remains German while machine fields remain stable.
- Documentation Governance remains ESS-0012; Vocabulary Governance remains ESS-0017.
- Active renames cannot bypass impact validation.
- No non-SAFE rename can be automatically migrated.
- Lifecycle events use the existing EventMesh.
- Automation remains subordinate to protected-change boundaries and CI budget limits.
