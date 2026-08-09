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
### Phase 1 — Governance Foundation — COMPLETE
### Phase 1.5 — Authority- und Nummernraum-Konsolidierung — COMPLETE
`ESS-0012` bleibt Documentation Governance; `ESS-0017` / `ESS-0017-CONTRACTS` bleiben Vocabulary Governance; `ADR-0046` dokumentiert die Authority-Trennung.

### Phase 2 — Canonical Vocabulary Registry — COMPLETE
Abschluss durch PR #145.

### Phase 3 — Safe Rename Gate — COMPLETE
Abschluss durch PR #151 / main CI #649.

### Phase 4 — Bilingual Documentary Integration — COMPLETE
Abschluss durch PR #152 und erfolgreichen Deploy.

### Phase 5 — Event-Driven Value Chain — COMPLETE
Abschluss durch PR #153 / main CI #656 / verifiziertes Render-Deployment.

### Phase 6 — Incremental Existing-Code Migration — IMPLEMENTATION COMPLETE IN DRAFT
Phase 6.0/6.1 wurde mit PR #154 auf `main` etabliert. Merge-Commit `77cf6ed3143dc39120c55f7c767d4a758bc9735d` wurde in main CI #658 vollständig verifiziert und an Render deployed.

Abschlussstand:
- 6.0 Naming Debt Inventory — COMPLETE;
- 6.1 Evidence Classification — COMPLETE;
- 6.2 SAFE Migration Batch — COMPLETE als kontrollierter No-op, da `safeMigrationCount = 0`;
- 6.3 Dependency Validation — finaler Draft-CI ist noch das verbleibende Review-Gate;
- 6.4 Vocabulary / Documentary / Traceability Synchronisation — COMPLETE ohne Mutation;
- 6.5 Conditional / Blocked Backlog — COMPLETE.

Aktuelle Evidence:
1. `REN-0001: Plan -> SubscriptionTier` — `CONDITIONAL`; exakte Runtime-Referenzen in Billing-/Entitlement-Flächen.
2. `REN-0002: Screener -> Screening` — `CONDITIONAL`; exakte Runtime-Referenzen in Frontend-Flächen.

Beide Kandidaten sind `DEFERRED` und `automaticMigrationAllowed: false`. Ein Regressionstest vergleicht die materialisierte Evidence mit dem Live-Phase-3-Analyzer. Es wurden keine aktiven Renames durchgeführt.

Produktionsabschluss Phase 6: Abschluss-Draft mergen und anschließend main-CI-/Docker-/Render-Gate erfolgreich verifizieren.

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
6. Incremental Existing-Code Migration — implementation complete in draft. PR #154 established the inventory/classifier and main CI #658 verified it. Both current candidates are CONDITIONAL, zero are SAFE, no rename mutation was performed, and all non-safe candidates are retained in the protected backlog. Production completion requires merge plus successful main CI/Render verification.  
7. Continuous Governance — next.

### Success criteria
- English-only technical naming for new code.
- DE/EN documentation cannot semantically drift independently.
- Documentation Governance remains ESS-0012; Vocabulary Governance remains ESS-0017.
- Active renames cannot bypass impact validation.
- No non-SAFE rename can be automatically migrated.
- Lifecycle events use the existing EventMesh.
- Automation remains subordinate to protected-change boundaries and CI budget limits.
