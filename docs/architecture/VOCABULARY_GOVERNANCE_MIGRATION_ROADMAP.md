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

Exit-Kriterium erfüllt: Kein aktiver Rename kann den vorgelagerten Impact-Gate umgehen; technische Folgevalidierung und CI-Kostenrichtlinie bleiben erhalten.

### Phase 4 — Bilingual Documentary Integration — IN PROGRESS
Authority: ESS-0010, ESS-0012, ESS-0017 / ESS-0017-CONTRACTS.

Umsetzung erfolgt inkrementell, da die vollständige Documentary Engine aktuell noch nicht implementiert ist.

Aktueller Programmscope:
- `BilingualDocumentReference` als sprachgebundene Sicht einer gemeinsamen `VocabularyConcept.id`;
- `BilingualDocumentPair` für gekoppelte DE/EN-Sichten derselben Concept-ID;
- Projektion ausschließlich aus `approved` Vocabulary Concepts;
- identischer `canonicalCodeTerm` in DE und EN;
- identische ESS-/ADR-/Traceability-Referenzen über beide Sprachen;
- fail-closed bei unbekannten Concepts, fehlender Freigabe oder fehlender Übersetzung;
- Vitest-Contract-Tests;
- keine neuen Event-Typen in Phase 4.

Nächste Schritte innerhalb Phase 4:
1. Documentary-Consumer schrittweise auf gemeinsame Concept-IDs ausrichten;
2. Revalidierungsregeln für Legacy-Dokumente aus PR #142 definieren;
3. file-by-file DE/EN-Zielstruktur vorbereiten;
4. fehlende Übersetzungen als Event-Anforderung für Phase 5 spezifizieren;
5. keine Big-Bang-Dokumentmigration.

Exit-Kriterium: DE und EN können nicht unabhängig semantisch auseinanderlaufen; Documentary-Artefakte referenzieren dieselben Concept- und Governance-Identitäten.

### Phase 5 — Event-Driven Value Chain
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
3. Safe Rename Gate — complete through PR #151 and verified main CI #649 including Docker and Render deployment of commit `a41c85bc24d4ada79bb9c47c5f01693bbcb2857e`.  
4. Bilingual Documentary Integration — in progress: DE/EN documentary projections derive from the same approved Vocabulary Concept identity and retain identical language-neutral governance references. The full Documentary Engine is not yet implemented, so integration remains incremental and explicit.  
5. Event-Driven Value Chain — propagate standardized events through the existing Enterprise Event Mesh.  
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
