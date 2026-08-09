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
Baseline, offene PRs, ESS/ADR/Events/Knowledge/Documentary/Traceability/Validatoren und technische Governance wurden inventarisiert. Keine aktiven Renames.

### Phase 1 — Governance Foundation — COMPLETE
Deutsche PR-Informationen, synchronisierter PR-Validator und Vocabulary-/Naming-Governance wurden etabliert.

### Phase 1.5 — Authority- und Nummernraum-Konsolidierung — COMPLETE
`ESS-0012` bleibt Documentation Governance; `ESS-0017` / `ESS-0017-CONTRACTS` sind Vocabulary Governance; `ADR-0046` dokumentiert die Authority-Trennung. Der nächste freie ESS-Nummernraum ist `ESS-0018`.

### Phase 2 — Canonical Vocabulary Registry — COMPLETE
Die Canonical Vocabulary Registry unter `src/platform/Vocabulary/` ist Single Source of Truth für Concepts, DE/EN-Bezeichnungen, Aliase, Forbidden Terms und sprachneutrale Governance-Referenzen. Abschluss durch PR #145 und erfolgreichen main-CI-/Deploy-Gate.

### Phase 3 — Safe Rename Gate — COMPLETE
Der read-only `validateRenameImpact`-Analyzer klassifiziert Rename-Vorschläge als `SAFE`, `CONDITIONAL` oder `BLOCKED` und prüft Vocabulary, Referenzen, Runtime-Flächen, APIs/Routen, Schemas/Contracts, Config/Env, Dynamic Imports, Casing und Naming-Regeln.

Phase 3 wurde durch PR #151 gemerged. Der Main-Commit `a41c85bc24d4ada79bb9c47c5f01693bbcb2857e` wurde in CI #649 vollständig verifiziert: TypeScript, Tests, Production Build, CSP-Auslieferung, Deployment Readiness, Docker Build, Runtime-Metadaten und `Deployment verifiziert / Render-Produktion` waren erfolgreich.

### Phase 4 — Bilingual Documentary Integration — COMPLETE
Authority: ESS-0010, ESS-0012, ESS-0017 / ESS-0017-CONTRACTS.

Implementiert durch PR #152:
- `BilingualDocumentReference` und `BilingualDocumentPair`;
- DE/EN-Projektionen aus derselben `VocabularyConcept.id`;
- identischer `canonicalCodeTerm` und identische ESS-/ADR-/Traceability-Referenzen;
- fail-closed bei unbekannten, nicht freigegebenen oder unvollständig übersetzten Concepts;
- Documentary-Manifest auf ehrlichen Teilimplementierungsstatus angehoben;
- Contract-Tests und erfolgreiche CI-/Deploy-Validierung.

Exit-Kriterium erfüllt: DE und EN können nicht unabhängig semantisch auseinanderlaufen. PR #152 wurde erfolgreich deployed.

### Phase 5 — Event-Driven Value Chain — IN PROGRESS
```text
Change/Event
  -> Supervisor
  -> Impact Analysis
  -> Platform Director decision boundary
  -> Vocabulary / Knowledge / Documentary / Traceability
  -> Quality / Security / Compliance
  -> Version Manager
  -> Release validation
```

Vocabulary-/Documentary-Events werden ausschließlich über die bestehende Enterprise Event Mesh geführt. Handler müssen idempotent sein; Correlation und Causation werden durchgängig propagiert.

Aktueller Programmscope — Step 1 Approval Bridge:
- `PlatformDirector` wird als Producer des bestehenden `PlatformDecisionEvent` registriert;
- `SupervisorAlertEvent` ist vorgelagerter Input der Entscheidungsgrenze;
- nur bereits explizit `APPROVED` `PlatformDecisionRecord`-Instanzen dürfen propagiert werden;
- `REJECTED`, `DEFERRED` und `REVOKED` werden fail-closed blockiert;
- `correlationId` ist verpflichtend und wird unverändert weitergegeben;
- keine automatische Entscheidung oder Freigabe;
- keine neuen Event-Namen und keine zweite Event-Registry.

Nächste Schritte innerhalb Phase 5:
1. Supervisor-Evidence und Impact Analysis an Decision-Prerequisites binden;
2. Approved PlatformDecisionEvent an idempotente Downstream-Handler koppeln;
3. Vocabulary, Knowledge, Documentary und Traceability über öffentliche Interfaces aktualisieren;
4. Quality, Security und Compliance als Validierungsstufe ergänzen;
5. Version Manager und Release erst nach erfolgreichen Gates auslösen;
6. Correlation/Causation und Replay-Sicherheit über die komplette Kette nachweisen.

Exit-Kriterium: Relevante Lifecycle-Ereignisse lösen deterministische Folgeaktionen aus, ohne Human-Approval-, Protected-Change- oder CI-Kostengrenzen zu umgehen.

### Phase 6 — Incremental Existing-Code Migration
Bestehende inkonsistente technische Namen werden inventarisiert und nach Blast Radius priorisiert. Nur `SAFE`-Renames dürfen automatisiert vorbereitet werden; `CONDITIONAL` und `BLOCKED` werden als Evidence eskaliert. Keine Big-Bang-Renaming-Migration.

### Phase 7 — Continuous Governance
Repository-Validator, CI, Documentary, Knowledge und Traceability werden terminologiebewusst verbunden. Neue Concepts und relevante Lifecycle-Ereignisse werden deterministisch verarbeitet, ohne Human-Approval-Gates oder die zentrale CI-Kostenrichtlinie zu umgehen.

## English

### Target state
Naming, wording, documentation, traceability and governance operate as one event-driven CAPITAL-AI value chain. Code remains English; enterprise documentation is maintained in German and English; human-facing pull request information is German.

### Migration sequence
0. Baseline and protection — complete.  
1. Governance foundation — complete.  
1.5. Authority and namespace reconciliation — complete.  
2. Canonical Vocabulary Registry — complete through PR #145.  
3. Safe Rename Gate — complete through PR #151 and verified main CI #649.  
4. Bilingual Documentary Integration — complete through PR #152 and successful deployment. DE/EN projections derive from the same approved Vocabulary Concept identity.  
5. Event-Driven Value Chain — in progress. Step 1 introduces a fail-closed approval bridge that propagates only explicit APPROVED Platform Director decisions through the existing Enterprise Event Mesh while preserving correlation IDs.  
6. Incremental Existing-Code Migration — migrate only evidence-classified SAFE names.  
7. Continuous Governance — enforce terminology and lifecycle consistency while preserving human approvals and CI cost limits.

### Success criteria
- English-only technical naming for new code.
- DE/EN documentation cannot semantically drift independently.
- PR information remains German while machine fields remain stable.
- Documentation Governance remains ESS-0012.
- Vocabulary Governance remains ESS-0017.
- active renames cannot bypass impact validation.
- lifecycle events use the existing EventMesh and update relevant governance components deterministically.
- automation remains subordinate to protected-change boundaries and CI budget limits.
