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

### Phase 5 — Event-Driven Value Chain — COMPLETE
Phase 5 wurde durch PR #153 auf dem bestehenden Enterprise Event Mesh umgesetzt. Die Approval Bridge propagiert ausschließlich explizit `APPROVED` `PlatformDecisionRecord`-Instanzen als kanonisches `PlatformDecisionEvent`; andere Decision-Status werden fail-closed blockiert. Die `correlationId` bleibt erhalten, und es wurde keine zweite Event-Registry oder automatische Entscheidungslogik eingeführt.

Der Main-Commit `04c0e5957aca7025b07f55439e052cef8e070571` wurde in CI #656 vollständig verifiziert: TypeScript, Unit-Tests, Production Build, CSP, Deployment Readiness, Docker Build, Runtime-Metadaten und `Deployment verifiziert / Render-Produktion` waren erfolgreich.

### Phase 6 — Incremental Existing-Code Migration — IN PROGRESS
Phase 6 beginnt bewusst mit einer read-only Inventarisierungs- und Evidence-Stufe.

#### Phase 6.0 — Naming Debt Inventory
- maschinenlesbare Quelle: `docs/governance/vocabulary/rename-candidates.json`;
- jeder Kandidat besitzt stabile `REN-*`-ID, aktuellen Begriff, freigegebenen kanonischen Zielbegriff, Vocabulary Concept-ID, Priorität, Begründung und beobachtete Repository-Flächen;
- `migrationPolicy` ist in Phase 6.0/6.1 zwingend `CLASSIFY_ONLY`;
- keine aktive Codeänderung.

#### Phase 6.1 — Rename Classification
- `scripts/automation/classifyRenameCandidates.ts` delegiert jeden Kandidaten an den bestehenden Phase-3-Analyzer `analyzeRenameImpact`;
- Ergebnis bleibt `SAFE`, `CONDITIONAL` oder `BLOCKED`;
- `BLOCKED` ist gültige Evidence und kein Fehler des Inventarisierungslaufs;
- nur ein ungültiger Inventory-Contract stoppt fail-closed.

Initiale Kandidaten:
1. `REN-0001`: `Plan -> SubscriptionTier` (`VOC-BILLING-0002`), aufgrund von Billing-/Stripe-/Entitlement-Flächen kein Blind-Rename.
2. `REN-0002`: `Screener -> Screening` (`VOC-ANALYTICS-0001`), aufgrund breiter Frontend-/Produkt-/Dokumentationsreferenzen kein Blind-Rename.

Nächste Schritte:
1. CI für den Phase-6.0/6.1-Draft verifizieren;
2. Classification Evidence der Kandidaten auswerten;
3. nur einen eindeutig `SAFE` Kandidaten für Phase 6.2 auswählen;
4. `CONDITIONAL` und `BLOCKED` als Evidence-Backlog führen;
5. keine Big-Bang-Renaming-Migration.

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
4. Bilingual Documentary Integration — complete through PR #152 and successful deployment.  
5. Event-Driven Value Chain — complete through PR #153 and verified main CI #656 / Render deployment of commit `04c0e5957aca7025b07f55439e052cef8e070571`.  
6. Incremental Existing-Code Migration — in progress. Phase 6.0/6.1 inventories naming debt and classifies every candidate through the existing Phase 3 analyzer without mutating source code.  
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
