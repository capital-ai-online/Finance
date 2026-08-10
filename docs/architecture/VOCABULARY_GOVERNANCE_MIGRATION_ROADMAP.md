# CAPITAL-AI Vocabulary Governance Migration Roadmap

Status: COMPLETE / OPERATIONAL  
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

### Phase 6 — Incremental Existing-Code Migration — COMPLETE
PR #154 etablierte Naming-Debt-Inventar und Klassifizierung. PR #155 schloss Phase 6 produktiv ab. `REN-0001: Plan -> SubscriptionTier` bleibt `CONDITIONAL`, `REN-0002: Screener -> Screening` bleibt `BLOCKED`. Es existierten keine `SAFE`-Kandidaten; deshalb wurde korrekt keine Rename-Mutation erzwungen. Nicht sichere Kandidaten verbleiben mit `automaticMigrationAllowed: false` im geschützten Backlog.

### Phase 7 — Continuous Governance — COMPLETE
Abschluss durch PR #156. Implementiert sind Continuous Repository Vocabulary Validation, kostengünstiger CI-Einstiegspunkt, Lifecycle Evidence sowie Regression Protection. Die Canonical Vocabulary Registry bleibt Single Source of Truth; Human Approval, Safe-Rename-Gate, EventMesh und CI-Budgetgrenzen bleiben übergeordnet.

### Migrationsabschluss
Die Vocabulary-Governance-Migration ist abgeschlossen und geht in den operativen Governance-Betrieb über. Weitere Verbesserungen an Documentary Engine, Event-Driven Value Chain und Documentation Hygiene werden in `DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` geführt.

## English

### Migration sequence
0. Baseline and protection — complete.  
1. Governance foundation — complete.  
1.5. Authority and namespace reconciliation — complete.  
2. Canonical Vocabulary Registry — complete through PR #145.  
3. Safe Rename Gate — complete through PR #151 / main CI #649.  
4. Bilingual Documentary Integration — complete through PR #152.  
5. Event-Driven Value Chain — complete through PR #153 / main CI #656.  
6. Incremental Existing-Code Migration — complete through PRs #154 and #155; no unsafe rename was forced.  
7. Continuous Governance — complete through PR #156.

### Success criteria
- English-only technical naming for new code.
- DE/EN documentation cannot semantically drift independently.
- Documentation Governance remains ESS-0012; Vocabulary Governance remains ESS-0017.
- Active renames cannot bypass impact validation.
- No non-SAFE rename can be automatically migrated.
- Lifecycle events use the existing EventMesh.
- Automation remains subordinate to protected-change boundaries and CI budget limits.
